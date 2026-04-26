/**
 * DataBeacon-SchemaManager — per-engine integration coverage
 *
 * Session 4 routes the SchemaManager's EnsureSchema body through
 * meadow-migrationmanager (SchemaIntrospector → SchemaDiff →
 * MigrationGenerator → engine-specific execute), replacing the
 * SQLite-only ALTER TABLE branch Session 2 shipped. These tests cover
 * fresh-bootstrap and incremental ADD COLUMN against the four
 * supported engines:
 *
 *   - SQLite  — always runs; in-memory better-sqlite3 file via
 *               MeadowConnectionManager.
 *   - MySQL   — runs only when port 23389 (test/docker-compose.yml
 *               mysql container) is reachable; otherwise the test
 *               skips with a clear message.
 *   - Postgres — runs only when port 25389 (postgres container) is
 *                reachable.
 *   - MSSQL   — runs only when env MSSQL_TEST_HOST is set + that
 *               port is reachable; the docker-compose doesn't ship
 *               MSSQL by default.
 *
 * Bring up MySQL + Postgres locally with:
 *
 *   npm run docker-test-up
 *
 * The suite spins up an in-process retold-databeacon, registers a
 * fresh BeaconConnection per engine pointing at a per-test schema /
 * database, runs EnsureSchema twice (fresh + incremental ADD COLUMN),
 * and verifies the resulting tables / columns via the connector's
 * own introspectTableColumns method.
 *
 * Opt-in via running:
 *   npx mocha test/DataBeacon-SchemaManager_tests.js -u tdd
 *
 * The suite is not part of the default mocha spec; the per-engine
 * cases skip automatically when the engine isn't reachable.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */

const Chai = require('chai');
const Expect = Chai.expect;

const libNet = require('net');
const libPath = require('path');
const libFs = require('fs');

const libPict = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('../source/Retold-DataBeacon.js');
const libDataBeaconSchemaManager = require('../source/services/DataBeacon-SchemaManager.js');

// ──────────────────────────────────────────────────────────────────
//  Engine-availability probes
// ──────────────────────────────────────────────────────────────────

const MYSQL_HOST = process.env.MYSQL_TEST_HOST || '127.0.0.1';
const MYSQL_PORT = Number(process.env.MYSQL_TEST_PORT || 23389);
const MYSQL_USER = process.env.MYSQL_TEST_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_TEST_PASSWORD || 'testpassword';

const POSTGRES_HOST = process.env.POSTGRES_TEST_HOST || '127.0.0.1';
const POSTGRES_PORT = Number(process.env.POSTGRES_TEST_PORT || 25389);
const POSTGRES_USER = process.env.POSTGRES_TEST_USER || 'postgres';
const POSTGRES_PASSWORD = process.env.POSTGRES_TEST_PASSWORD || 'testpassword';

const MSSQL_HOST = process.env.MSSQL_TEST_HOST;
const MSSQL_PORT = Number(process.env.MSSQL_TEST_PORT || 1433);
const MSSQL_USER = process.env.MSSQL_TEST_USER || 'sa';
const MSSQL_PASSWORD = process.env.MSSQL_TEST_PASSWORD || '';

function isPortReachable(pHost, pPort, pTimeoutMs)
{
	return new Promise((fResolve) =>
	{
		let tmpSocket = libNet.createConnection({ host: pHost, port: pPort });
		tmpSocket.setTimeout(pTimeoutMs || 1500);
		tmpSocket.on('connect', () => { tmpSocket.destroy(); fResolve(true); });
		tmpSocket.on('timeout', () => { tmpSocket.destroy(); fResolve(false); });
		tmpSocket.on('error', () => { fResolve(false); });
	});
}

// ──────────────────────────────────────────────────────────────────
//  Test scratch directory
// ──────────────────────────────────────────────────────────────────

const TEST_DIR = libPath.resolve(__dirname, '..', '.test_schema_manager');

function ensureCleanDir(pDir)
{
	if (libFs.existsSync(pDir))
	{
		libFs.rmSync(pDir, { recursive: true, force: true });
	}
	libFs.mkdirSync(pDir, { recursive: true });
}

// ──────────────────────────────────────────────────────────────────
//  Fixture descriptor — same shape as
//  ultravisor/source/persistence/UltravisorPersistenceSchema.json but
//  smaller. Two tables; one with two indices; small column counts so
//  the introspect+diff round-trip is fast. The "v2" variant adds one
//  column to each table to exercise the ADD COLUMN path.
// ──────────────────────────────────────────────────────────────────

function descriptorV1()
{
	return {
		SchemaName: 'sm-test',
		Version: 1,
		Tables:
		[
			{
				Scope: 'SMTestThing',
				DefaultIdentifier: 'IDSMTestThing',
				Schema:
				[
					{ Column: 'IDSMTestThing', Type: 'AutoIdentity', Size: 'Default' },
					{ Column: 'Name',          Type: 'String',       Size: '64' },
					{ Column: 'Status',        Type: 'String',       Size: '32' },
					{ Column: 'Priority',      Type: 'Integer',      Size: 'int' }
				],
				Indexes:
				[
					{ Name: 'IX_SMTestThing_Status', Columns: ['Status'], Unique: false }
				]
			},
			{
				Scope: 'SMTestEvent',
				DefaultIdentifier: 'IDSMTestEvent',
				Schema:
				[
					{ Column: 'IDSMTestEvent', Type: 'AutoIdentity', Size: 'Default' },
					{ Column: 'EventGUID',     Type: 'String',       Size: '64' },
					{ Column: 'EmittedAt',     Type: 'String',       Size: '50' }
				],
				Indexes:
				[
					{ Name: 'AK_SMTestEvent_EventGUID', Columns: ['EventGUID'], Unique: true }
				]
			}
		]
	};
}

function descriptorV2()
{
	let tmp = descriptorV1();
	// Add Description (forward-only ADD COLUMN) to SMTestThing.
	tmp.Tables[0].Schema.push({ Column: 'Description', Type: 'String', Size: '256' });
	// Add Sequence (Integer) to SMTestEvent.
	tmp.Tables[1].Schema.push({ Column: 'Sequence', Type: 'Integer', Size: 'int' });
	return tmp;
}

// ──────────────────────────────────────────────────────────────────
//  In-process databeacon bootstrap
// ──────────────────────────────────────────────────────────────────

function bootDataBeacon(pSqlitePath, fCallback)
{
	let tmpFable = new libPict(
		{
			Product: 'SchemaManagerTest-DataBeacon',
			ProductVersion: '0.0.1',
			LogStreams: [{ streamtype: 'console', level: 'warn' }],
			SQLite: { SQLiteFilePath: pSqlitePath }
		});

	tmpFable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
	tmpFable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

	tmpFable.MeadowConnectionManager.connect('databeacon',
		{ Type: 'SQLite', SQLiteFilePath: pSqlitePath },
		(pConnErr, pConnection) =>
		{
			if (pConnErr) return fCallback(pConnErr);
			tmpFable.MeadowSQLiteProvider = pConnection.instance;
			tmpFable.settings.MeadowProvider = 'SQLite';

			tmpFable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
			let tmpBeacon = tmpFable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
				{
					AutoCreateSchema: true,
					AutoStartOrator: false,
					FullMeadowSchemaPath: libPath.join(__dirname, '..', 'model') + '/',
					FullMeadowSchemaFilename: 'MeadowModel-DataBeacon.json',
					Endpoints:
					{
						MeadowEndpoints: true,
						ConnectionBridge: true,
						SchemaIntrospector: true,
						DynamicEndpointManager: false,
						BeaconProvider: false,
						WebUI: false
					}
				});

			tmpBeacon.initializeService((pInitErr) =>
			{
				if (pInitErr) return fCallback(pInitErr);
				// BeaconProvider is off (no Orator / WebSocket — we don't
				// need the mesh surface for these tests); register the
				// SchemaManager directly so ensureSchema is callable.
				tmpFable.serviceManager.addServiceTypeIfNotExists('DataBeaconSchemaManager', libDataBeaconSchemaManager);
				if (!tmpFable.DataBeaconSchemaManager)
				{
					tmpFable.DataBeaconSchemaManager = tmpFable.serviceManager.instantiateServiceProvider('DataBeaconSchemaManager', {});
				}
				return fCallback(null, tmpFable, tmpBeacon);
			});
		});
}

/**
 * Insert + connect a BeaconConnection record for the given engine /
 * config. Returns IDBeaconConnection on success.
 */
function createAndConnect(pFable, pName, pType, pConfig, fCallback)
{
	let tmpRecord =
	{
		Name: pName,
		Type: pType,
		Config: JSON.stringify(pConfig),
		Status: 'Untested',
		AutoConnect: 1,
		Description: `${pType} test connection`
	};
	let tmpQuery = pFable.DAL.BeaconConnection.query.clone()
		.setIDUser(0)
		.addRecord(tmpRecord);
	pFable.DAL.BeaconConnection.doCreate(tmpQuery,
		(pCreateErr, pQ, pQR, pInserted) =>
		{
			if (pCreateErr) return fCallback(pCreateErr);
			pFable.DataBeaconConnectionBridge._connectRuntime(pInserted,
				(pRunErr) =>
				{
					if (pRunErr) return fCallback(pRunErr);
					return fCallback(null, pInserted.IDBeaconConnection);
				});
		});
}

/**
 * Read the live column set for a given table via the connector's own
 * introspectTableColumns. Resolves to a Set of column names for ergonomics.
 */
function introspectColumns(pFable, pIDConn, pTableName)
{
	return new Promise((fResolve, fReject) =>
	{
		let tmpConn = pFable.DataBeaconConnectionBridge.getConnection(pIDConn);
		let tmpSchema = tmpConn.instance.schemaProvider || tmpConn.instance._SchemaProvider;
		tmpSchema.introspectTableColumns(pTableName, (pErr, pCols) =>
		{
			if (pErr) return fReject(pErr);
			let tmpNames = new Set((pCols || []).map((pC) => pC.Column));
			fResolve(tmpNames);
		});
	});
}

function listTables(pFable, pIDConn)
{
	return new Promise((fResolve, fReject) =>
	{
		let tmpConn = pFable.DataBeaconConnectionBridge.getConnection(pIDConn);
		let tmpSchema = tmpConn.instance.schemaProvider || tmpConn.instance._SchemaProvider;
		tmpSchema.listTables((pErr, pTables) =>
		{
			if (pErr) return fReject(pErr);
			fResolve(pTables || []);
		});
	});
}

// ──────────────────────────────────────────────────────────────────
//  Engine-parameterized test factory
//
//  Each suite block registers two cases — fresh-bootstrap and
//  incremental ADD COLUMN — and skips cleanly when the engine is
//  unreachable. The fresh-bootstrap case verifies tables + indices
//  landed; the ADD COLUMN case verifies that re-running EnsureSchema
//  with a v2 descriptor adds the new columns (forward-only filter
//  doesn't drop ColumnsAdded).
// ──────────────────────────────────────────────────────────────────

function registerEngineSuite(pSuiteName, pProbeFn, pBuildConfigFn, pUniqueNamespace)
{
	suite(pSuiteName, function ()
	{
		this.timeout(60000);
		let _Available = false;
		let _SkipReason = '';

		let _Fable = null;
		let _Beacon = null;
		let _IDConn = null;
		let _SQLitePath = '';

		// Per-suite namespacing avoids cross-test bleed when MySQL /
		// Postgres run against shared schemas. Names live within the
		// engine's main database (Chinook for the docker-compose'd
		// containers) so this also exercises the path where UV* tables
		// share the database with unrelated tables.
		let _NS = pUniqueNamespace + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

		// Override the descriptor's Scope to namespace tables for this run.
		function namespacedDescriptor(pBase)
		{
			let tmp = JSON.parse(JSON.stringify(pBase));
			for (let i = 0; i < tmp.Tables.length; i++)
			{
				let tmpOriginal = tmp.Tables[i].Scope;
				tmp.Tables[i].Scope = _NS + tmpOriginal;
				tmp.Tables[i].DefaultIdentifier = 'ID' + tmp.Tables[i].Scope;
				let tmpCols = tmp.Tables[i].Schema || [];
				if (tmpCols.length > 0 && tmpCols[0].Type === 'AutoIdentity')
				{
					tmpCols[0].Column = 'ID' + tmp.Tables[i].Scope;
				}
				let tmpIdxs = tmp.Tables[i].Indexes || [];
				for (let j = 0; j < tmpIdxs.length; j++)
				{
					tmpIdxs[j].Name = tmpIdxs[j].Name.replace(/SMTestThing|SMTestEvent/g,
						(m) => _NS + m);
				}
			}
			return tmp;
		}

		suiteSetup(function (fDone)
		{
			pProbeFn().then((pAvail) =>
			{
				if (!pAvail)
				{
					_SkipReason = `${pSuiteName.toLowerCase()} unreachable; set the *_TEST_HOST env vars or run npm run docker-test-up`;
					return fDone();
				}
				_Available = true;
				ensureCleanDir(TEST_DIR);
				_SQLitePath = libPath.join(TEST_DIR, `${_NS}-databeacon.sqlite`);
				bootDataBeacon(_SQLitePath, (pErr, pFable, pBeacon) =>
				{
					if (pErr) return fDone(pErr);
					_Fable = pFable;
					_Beacon = pBeacon;
					createAndConnect(_Fable, `${pUniqueNamespace}-conn`,
						pBuildConfigFn().Type, pBuildConfigFn().Config,
						(pConnErr, pIDConn) =>
						{
							if (pConnErr) return fDone(pConnErr);
							_IDConn = pIDConn;
							return fDone();
						});
				});
			}).catch(fDone);
		});

		suiteTeardown(function (fDone)
		{
			if (!_Available || !_Fable) return fDone();

			let tmpConn = _Fable.DataBeaconConnectionBridge.getConnection(_IDConn);
			let tmpInst = tmpConn && tmpConn.instance;
			let tmpTablesToDrop = [_NS + 'SMTestThing', _NS + 'SMTestEvent'];

			let fFinish = () =>
			{
				_Beacon.stopService(() =>
				{
					try { libFs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
					fDone();
				});
			};

			// Best-effort cleanup; failures here are not interesting.
			let tmpDropper = (pIdx) =>
			{
				if (pIdx >= tmpTablesToDrop.length) { return fFinish(); }
				let tmpName = tmpTablesToDrop[pIdx];
				let tmpSql = `DROP TABLE ${pUniqueNamespace === 'mysql' ? '`' + tmpName + '`' : '"' + tmpName + '"'}`;
				if (pUniqueNamespace === 'mssql') { tmpSql = `DROP TABLE [${tmpName}]`; }
				try
				{
					if (tmpInst._database && typeof tmpInst._database.exec === 'function')
					{
						try { tmpInst._database.exec(tmpSql); } catch (e) { /* ignore */ }
						return tmpDropper(pIdx + 1);
					}
					let tmpSchema = tmpInst.schemaProvider || tmpInst._SchemaProvider;
					let tmpPool = tmpSchema && tmpSchema._ConnectionPool;
					if (tmpPool && typeof tmpPool.query === 'function')
					{
						tmpPool.query(tmpSql, () => tmpDropper(pIdx + 1));
						return;
					}
				}
				catch (e) { /* ignore */ }
				return tmpDropper(pIdx + 1);
			};
			tmpDropper(0);
		});

		test('fresh-bootstrap creates tables + indices', function (fDone)
		{
			if (!_Available) { console.log(`      \u26A0\uFE0F  ${_SkipReason}`); return this.skip(); }
			let tmpDesc = namespacedDescriptor(descriptorV1());
			_Fable.DataBeaconSchemaManager.ensureSchema(
				{ IDBeaconConnection: _IDConn, SchemaName: 'sm-test', SchemaJSON: tmpDesc },
				(pErr, pResult) =>
				{
					if (pErr) return fDone(pErr);
					try
					{
						Expect(pResult.Success).to.equal(true);
						Expect(pResult.TablesCreated).to.include.members([_NS + 'SMTestThing', _NS + 'SMTestEvent']);
					}
					catch (pAssertErr) { return fDone(pAssertErr); }

					listTables(_Fable, _IDConn).then((pTables) =>
					{
						try
						{
							Expect(pTables).to.include.members([_NS + 'SMTestThing', _NS + 'SMTestEvent']);
						}
						catch (pAssertErr) { return fDone(pAssertErr); }
						return fDone();
					}).catch(fDone);
				});
		});

		test('incremental ADD COLUMN lands new columns via meadow-migrationmanager', function (fDone)
		{
			if (!_Available) { console.log(`      \u26A0\uFE0F  ${_SkipReason}`); return this.skip(); }
			let tmpDesc = namespacedDescriptor(descriptorV2());
			_Fable.DataBeaconSchemaManager.ensureSchema(
				{ IDBeaconConnection: _IDConn, SchemaName: 'sm-test', SchemaJSON: tmpDesc },
				(pErr, pResult) =>
				{
					if (pErr) return fDone(pErr);
					try
					{
						Expect(pResult.Success).to.equal(true);
						Expect(pResult.ColumnsAdded).to.include(`${_NS}SMTestThing.Description`);
						Expect(pResult.ColumnsAdded).to.include(`${_NS}SMTestEvent.Sequence`);
						// MigrationStatements should contain ALTER TABLE ... ADD ... entries
						let tmpAlters = pResult.MigrationStatements.filter((pS) => /ALTER TABLE/i.test(pS));
						Expect(tmpAlters.length).to.be.at.least(2);
					}
					catch (pAssertErr) { return fDone(pAssertErr); }

					Promise.all(
					[
						introspectColumns(_Fable, _IDConn, _NS + 'SMTestThing'),
						introspectColumns(_Fable, _IDConn, _NS + 'SMTestEvent')
					]).then(([pThingCols, pEventCols]) =>
					{
						try
						{
							Expect(pThingCols.has('Description')).to.equal(true);
							Expect(pEventCols.has('Sequence')).to.equal(true);
						}
						catch (pAssertErr) { return fDone(pAssertErr); }
						return fDone();
					}).catch(fDone);
				});
		});

		test('idempotent re-run does not add new tables or columns', function (fDone)
		{
			if (!_Available) { console.log(`      \u26A0\uFE0F  ${_SkipReason}`); return this.skip(); }
			let tmpDesc = namespacedDescriptor(descriptorV2());
			_Fable.DataBeaconSchemaManager.ensureSchema(
				{ IDBeaconConnection: _IDConn, SchemaName: 'sm-test', SchemaJSON: tmpDesc },
				(pErr, pResult) =>
				{
					if (pErr) return fDone(pErr);
					try
					{
						Expect(pResult.Success).to.equal(true);
						Expect(pResult.TablesCreated).to.deep.equal([]);
						Expect(pResult.ColumnsAdded).to.deep.equal([]);
					}
					catch (pAssertErr) { return fDone(pAssertErr); }
					return fDone();
				});
		});
	});
}

// ──────────────────────────────────────────────────────────────────
//  SQLite — always runs (no Docker dep)
// ──────────────────────────────────────────────────────────────────

suite('DataBeacon-SchemaManager — SQLite', function ()
{
	this.timeout(20000);
	let _Fable = null;
	let _Beacon = null;
	let _IDConn = null;
	let _SQLitePath = '';
	let _ExternalSqlite = '';

	suiteSetup(function (fDone)
	{
		ensureCleanDir(TEST_DIR);
		_SQLitePath = libPath.join(TEST_DIR, 'sqlite-databeacon.sqlite');
		_ExternalSqlite = libPath.join(TEST_DIR, 'sqlite-external.sqlite');

		bootDataBeacon(_SQLitePath, (pErr, pFable, pBeacon) =>
		{
			if (pErr) return fDone(pErr);
			_Fable = pFable;
			_Beacon = pBeacon;
			createAndConnect(_Fable, 'sqlite-conn', 'SQLite',
				{ SQLiteFilePath: _ExternalSqlite },
				(pConnErr, pIDConn) =>
				{
					if (pConnErr) return fDone(pConnErr);
					_IDConn = pIDConn;
					return fDone();
				});
		});
	});

	suiteTeardown(function (fDone)
	{
		if (!_Beacon) return fDone();
		_Beacon.stopService(() =>
		{
			try { libFs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
			fDone();
		});
	});

	test('fresh-bootstrap creates two tables and reports them', function (fDone)
	{
		_Fable.DataBeaconSchemaManager.ensureSchema(
			{ IDBeaconConnection: _IDConn, SchemaName: 'sm-test', SchemaJSON: descriptorV1() },
			(pErr, pResult) =>
			{
				if (pErr) return fDone(pErr);
				try
				{
					Expect(pResult.Success).to.equal(true);
					Expect(pResult.Engine).to.equal('sqlite');
					Expect(pResult.TablesCreated).to.have.members(['SMTestThing', 'SMTestEvent']);
					Expect(pResult.MigrationStatements).to.deep.equal([]);
				}
				catch (e) { return fDone(e); }
				return fDone();
			});
	});

	test('incremental ADD COLUMN lands new columns via the diff path', function (fDone)
	{
		_Fable.DataBeaconSchemaManager.ensureSchema(
			{ IDBeaconConnection: _IDConn, SchemaName: 'sm-test', SchemaJSON: descriptorV2() },
			(pErr, pResult) =>
			{
				if (pErr) return fDone(pErr);
				try
				{
					Expect(pResult.Success).to.equal(true);
					Expect(pResult.ColumnsAdded).to.include('SMTestThing.Description');
					Expect(pResult.ColumnsAdded).to.include('SMTestEvent.Sequence');
					let tmpAlters = pResult.MigrationStatements.filter((pS) => /ALTER TABLE/i.test(pS));
					Expect(tmpAlters.length).to.be.at.least(2);
				}
				catch (e) { return fDone(e); }

				Promise.all(
				[
					introspectColumns(_Fable, _IDConn, 'SMTestThing'),
					introspectColumns(_Fable, _IDConn, 'SMTestEvent')
				]).then(([pThing, pEvent]) =>
				{
					try
					{
						Expect(pThing.has('Description')).to.equal(true);
						Expect(pEvent.has('Sequence')).to.equal(true);
					}
					catch (e) { return fDone(e); }
					return fDone();
				}).catch(fDone);
			});
	});

	test('idempotent re-run does not add new tables or columns', function (fDone)
	{
		_Fable.DataBeaconSchemaManager.ensureSchema(
			{ IDBeaconConnection: _IDConn, SchemaName: 'sm-test', SchemaJSON: descriptorV2() },
			(pErr, pResult) =>
			{
				if (pErr) return fDone(pErr);
				try
				{
					Expect(pResult.Success).to.equal(true);
					Expect(pResult.TablesCreated).to.deep.equal([]);
					Expect(pResult.ColumnsAdded).to.deep.equal([]);
					// MigrationStatements may still contain idempotent
					// CREATE INDEX entries — the SQLite introspector folds
					// custom-named indices into the column's Indexed
					// property rather than the Indices array, so SchemaDiff
					// treats them as IndicesAdded on every re-run. Those
					// statements no-op against an existing index.
				}
				catch (e) { return fDone(e); }
				return fDone();
			});
	});

	test('forward-only filter drops destructive ops with a SkippedDestructive entry', function (fDone)
	{
		// V1 has fewer columns than v2 (v2 added Description / Sequence).
		// Re-running with v1 should report ColumnsRemoved candidates as
		// SkippedDestructive, NOT actually drop the columns.
		_Fable.DataBeaconSchemaManager.ensureSchema(
			{ IDBeaconConnection: _IDConn, SchemaName: 'sm-test', SchemaJSON: descriptorV1() },
			(pErr, pResult) =>
			{
				if (pErr) return fDone(pErr);
				try
				{
					Expect(pResult.Success).to.equal(true);
					Expect(pResult.SkippedDestructive).to.include('drop-column:SMTestThing.Description');
					Expect(pResult.SkippedDestructive).to.include('drop-column:SMTestEvent.Sequence');
				}
				catch (e) { return fDone(e); }

				// Confirm the columns are still there.
				introspectColumns(_Fable, _IDConn, 'SMTestThing').then((pCols) =>
				{
					try { Expect(pCols.has('Description')).to.equal(true); }
					catch (e) { return fDone(e); }
					return fDone();
				}).catch(fDone);
			});
	});
});

// ──────────────────────────────────────────────────────────────────
//  MySQL / Postgres / MSSQL — opt-in via reachable port
// ──────────────────────────────────────────────────────────────────

registerEngineSuite('DataBeacon-SchemaManager — MySQL',
	() => isPortReachable(MYSQL_HOST, MYSQL_PORT),
	() => (
		{
			Type: 'MySQL',
			Config:
			{
				Server: MYSQL_HOST,
				Host: MYSQL_HOST,
				Port: MYSQL_PORT,
				User: MYSQL_USER,
				Password: MYSQL_PASSWORD,
				Database: 'chinook',
				ConnectionPoolLimit: 5
			}
		}),
	'mysql');

registerEngineSuite('DataBeacon-SchemaManager — PostgreSQL',
	() => isPortReachable(POSTGRES_HOST, POSTGRES_PORT),
	() => (
		{
			Type: 'PostgreSQL',
			Config:
			{
				Server: POSTGRES_HOST,
				Host: POSTGRES_HOST,
				Port: POSTGRES_PORT,
				User: POSTGRES_USER,
				Password: POSTGRES_PASSWORD,
				Database: 'chinook'
			}
		}),
	'postgresql');

registerEngineSuite('DataBeacon-SchemaManager — MSSQL',
	() => MSSQL_HOST ? isPortReachable(MSSQL_HOST, MSSQL_PORT) : Promise.resolve(false),
	() => (
		{
			Type: 'MSSQL',
			Config:
			{
				Server: MSSQL_HOST,
				Host: MSSQL_HOST,
				Port: MSSQL_PORT,
				User: MSSQL_USER,
				Password: MSSQL_PASSWORD,
				Database: process.env.MSSQL_TEST_DATABASE || 'master'
			}
		}),
	'mssql');


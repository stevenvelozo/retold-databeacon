/**
 * Retold DataBeacon — Test Suite
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libAssert = require('assert');
const libSuperTest = require('supertest');

const libPict = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('../source/Retold-DataBeacon.js');

const libPath = require('path');
const libFs = require('fs');

// Test database path
const TEST_DB_PATH = libPath.join(__dirname, '..', 'data', 'test-databeacon.sqlite');

suite
(
	'Retold DataBeacon',
	function ()
	{
		let _Fable = null;
		let _DataBeacon = null;
		let _Server = null;

		suiteSetup
		(
			function (fDone)
			{
				// Ensure test data directory exists
				let tmpDataDir = libPath.dirname(TEST_DB_PATH);
				if (!libFs.existsSync(tmpDataDir))
				{
					libFs.mkdirSync(tmpDataDir, { recursive: true });
				}

				// Clean up old test database
				if (libFs.existsSync(TEST_DB_PATH))
				{
					libFs.unlinkSync(TEST_DB_PATH);
				}

				_Fable = new libPict(
					{
						Product: 'RetoldDataBeaconTest',
						ProductVersion: '0.0.1',
						APIServerPort: 18389,
						LogStreams: [{ streamtype: 'console', level: 'warn' }],
						SQLite: { SQLiteFilePath: TEST_DB_PATH }
					});

				_Fable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
				_Fable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

				_Fable.MeadowConnectionManager.connect('databeacon',
					{
						Type: 'SQLite',
						SQLiteFilePath: TEST_DB_PATH
					},
					function (pError, pConnection)
					{
						if (pError)
						{
							return fDone(pError);
						}

						_Fable.MeadowSQLiteProvider = pConnection.instance;
						_Fable.settings.MeadowProvider = 'SQLite';

						_Fable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
						_DataBeacon = _Fable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
							{
								AutoCreateSchema: true,
								AutoStartOrator: true,

								FullMeadowSchemaPath: libPath.join(__dirname, '..', 'model') + '/',
								FullMeadowSchemaFilename: 'MeadowModel-DataBeacon.json',

								Endpoints:
									{
										MeadowEndpoints: true,
										ConnectionBridge: true,
										SchemaIntrospector: true,
										DynamicEndpointManager: true,
										BeaconProvider: true,
										WebUI: false
									}
							});

						_DataBeacon.initializeService(
							function (pInitError)
							{
								if (pInitError)
								{
									return fDone(pInitError);
								}

								_Server = _Fable.OratorServiceServer.server;
								return fDone();
							});
					});
			}
		);

		suiteTeardown
		(
			function (fDone)
			{
				if (_DataBeacon && _DataBeacon.serviceInitialized)
				{
					_DataBeacon.stopService(
						function ()
						{
							// Clean up test database
							try
							{
								if (libFs.existsSync(TEST_DB_PATH))
								{
									libFs.unlinkSync(TEST_DB_PATH);
								}
							}
							catch (e) { /* ignore cleanup errors */ }
							return fDone();
						});
				}
				else
				{
					return fDone();
				}
			}
		);

		test
		(
			'Service should be initialized',
			function ()
			{
				libAssert.strictEqual(_DataBeacon.serviceInitialized, true);
				libAssert.strictEqual(_DataBeacon.serviceType, 'RetoldDataBeacon');
			}
		);

		test
		(
			'Schema should have been created',
			function ()
			{
				libAssert.ok(_Fable.MeadowSQLiteProvider, 'SQLite provider should exist');
				libAssert.ok(_Fable.MeadowSQLiteProvider.db, 'SQLite db handle should exist');

				// Verify tables exist
				let tmpStmt = _Fable.MeadowSQLiteProvider.db.prepare(
					"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
				let tmpTables = tmpStmt.all();
				let tmpTableNames = tmpTables.map(function (pR) { return pR.name; });

				libAssert.ok(tmpTableNames.indexOf('BeaconConnection') >= 0, 'BeaconConnection table should exist');
				libAssert.ok(tmpTableNames.indexOf('IntrospectedTable') >= 0, 'IntrospectedTable table should exist');
				libAssert.ok(tmpTableNames.indexOf('User') >= 0, 'User table should exist');
			}
		);

		test
		(
			'DAL entities should be initialized',
			function ()
			{
				libAssert.ok(_Fable.DAL, 'DAL should exist on fable');
				libAssert.ok(_Fable.DAL.BeaconConnection, 'BeaconConnection DAL should exist');
				libAssert.ok(_Fable.DAL.IntrospectedTable, 'IntrospectedTable DAL should exist');
				libAssert.ok(_Fable.DAL.User, 'User DAL should exist');
			}
		);

		test
		(
			'GET /beacon/connections should return empty list',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connections')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Connections, 'Response should have Connections array');
						libAssert.strictEqual(pResponse.body.Count, 0, 'Should have 0 connections initially');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection should create a connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection')
					.send({
						Name: 'Test SQLite',
						Type: 'SQLite',
						Config: { SQLiteFilePath: TEST_DB_PATH },
						Description: 'Test connection to internal DB'
					})
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						libAssert.ok(pResponse.body.Connection, 'Should have Connection object');
						libAssert.strictEqual(pResponse.body.Connection.Name, 'Test SQLite');
						libAssert.strictEqual(pResponse.body.Connection.Type, 'SQLite');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connections should return the created connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connections')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Count, 1, 'Should have 1 connection');
						libAssert.strictEqual(pResponse.body.Connections[0].Name, 'Test SQLite');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connection/1 should return the connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/1')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Connection, 'Should have Connection object');
						libAssert.strictEqual(pResponse.body.Connection.Name, 'Test SQLite');
						return fDone();
					});
			}
		);

		test
		(
			'PUT /beacon/connection/1 should update the connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.put('/beacon/connection/1')
					.send({ Description: 'Updated description' })
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						libAssert.strictEqual(pResponse.body.Connection.Description, 'Updated description');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/connect should establish live connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/connect')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/introspect should discover tables',
			function (fDone)
			{
				this.timeout(10000);

				libSuperTest(_Server)
					.post('/beacon/connection/1/introspect')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));
						libAssert.ok(pResponse.body.TableCount > 0, 'Should discover at least one table');

						// Should find our internal tables
						let tmpTableNames = pResponse.body.Tables.map(function (pT) { return pT.TableName; });
						libAssert.ok(tmpTableNames.indexOf('BeaconConnection') >= 0, 'Should find BeaconConnection table');
						libAssert.ok(tmpTableNames.indexOf('User') >= 0, 'Should find User table');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connection/1/tables should return cached tables',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/1/tables')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Count > 0, 'Should have cached tables');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connection/1/table/User should return column details',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/1/table/User')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.TableName, 'User');
						libAssert.ok(pResponse.body.Columns, 'Should have Columns array');
						libAssert.ok(pResponse.body.Columns.length > 0, 'Should have at least one column');

						// Check that column metadata is populated
						let tmpIDCol = pResponse.body.Columns.find(function (pC) { return pC.Name === 'IDUser'; });
						libAssert.ok(tmpIDCol, 'Should have IDUser column');
						libAssert.ok(tmpIDCol.IsPrimaryKey, 'IDUser should be primary key');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/query should execute read-only queries',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/query')
					.send({ SQL: 'SELECT * FROM User' })
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						libAssert.ok(pResponse.body.Rows, 'Should have Rows');
						libAssert.ok(pResponse.body.RowCount > 0, 'Should have at least 1 row (system user)');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/query should reject non-SELECT queries',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/query')
					.send({ SQL: 'DELETE FROM User' })
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Success, false, 'Should fail');
						libAssert.ok(pResponse.body.Error.indexOf('SELECT') >= 0, 'Error should mention SELECT');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/endpoints should return empty list initially',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/endpoints')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Count, 0, 'Should have 0 endpoints initially');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/endpoint/1/User/enable should wire dynamic User CRUD routes',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/endpoint/1/User/enable')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));
						libAssert.ok(pResponse.body.Endpoint, 'Should return endpoint detail');

						// Hit the dynamically-registered route to confirm it's live.
						libSuperTest(_Server)
							.get('/1.0/Users/0/50')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.ok(Array.isArray(pListResponse.body), 'User list endpoint should respond with an array');
								return fDone();
							});
					});
			}
		);

		test
		(
			'disconnect + reconnect should restore enabled endpoints automatically',
			function (fDone)
			{
				this.timeout(10000);

				// Tear down the live connection; the /1.0/Users route is still
				// physically registered in Restify (it can't be removed), but
				// the in-memory handle should be cleared.
				libSuperTest(_Server)
					.post('/beacon/connection/1/disconnect')
					.expect(200)
					.end(function (pDisconnectError, pDisconnectResponse)
					{
						if (pDisconnectError) return fDone(pDisconnectError);
						libAssert.ok(pDisconnectResponse.body.Success, 'Disconnect should succeed');

						// listEndpoints() should no longer advertise the User endpoint.
						libSuperTest(_Server)
							.get('/beacon/endpoints')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.strictEqual(pListResponse.body.Count, 0, 'Endpoints list should be empty while disconnected');

								// Reconnect and check the response advertises how
								// many endpoints were restored (the bug fix).
								libSuperTest(_Server)
									.post('/beacon/connection/1/connect')
									.expect(200)
									.end(function (pConnectError, pConnectResponse)
									{
										if (pConnectError) return fDone(pConnectError);
										libAssert.ok(pConnectResponse.body.Success, 'Reconnect should succeed');
										libAssert.ok(pConnectResponse.body.EndpointsRestored >= 1,
											'Reconnect should restore at least one endpoint; got: ' + JSON.stringify(pConnectResponse.body));

										// The /1.0/Users/0/50 endpoint should work WITHOUT the
										// user toggling it off and back on — this is the exact
										// regression this test guards.
										libSuperTest(_Server)
											.get('/1.0/Users/0/50')
											.expect(200)
											.end(function (pUsersError, pUsersResponse)
											{
												if (pUsersError) return fDone(pUsersError);
												libAssert.ok(Array.isArray(pUsersResponse.body), 'User endpoint should work after reconnect with no manual toggle');
												return fDone();
											});
									});
							});
					});
			}
		);

		test
		(
			'POST /beacon/endpoint/1/User/disable should tear the endpoint back down',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/endpoint/1/User/disable')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));

						libSuperTest(_Server)
							.get('/beacon/endpoints')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.strictEqual(pListResponse.body.Count, 0, 'Endpoints list should be empty after disable');
								return fDone();
							});
					});
			}
		);

		test
		(
			'GET /beacon/connection/available-types should list installed types',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/available-types')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Types, 'Should have Types array');
						libAssert.ok(pResponse.body.Types.length > 0, 'Should have at least one type');

						let tmpSQLite = pResponse.body.Types.find(function (pT) { return pT.Type === 'SQLite'; });
						libAssert.ok(tmpSQLite, 'SQLite should be in the list');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/ultravisor/status should report disconnected',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/ultravisor/status')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Connected, false, 'Beacon should not be connected');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/disconnect should disconnect',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/disconnect')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						return fDone();
					});
			}
		);

		test
		(
			'DELETE /beacon/connection/1 should soft-delete',
			function (fDone)
			{
				libSuperTest(_Server)
					.delete('/beacon/connection/1')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');

						// Verify it no longer appears in the list
						libSuperTest(_Server)
							.get('/beacon/connections')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.strictEqual(pListResponse.body.Count, 0, 'Should have 0 connections after delete');
								return fDone();
							});
					});
			}
		);

		// ----------------------------------------------------------------
		// _runQuery driver dispatch (unit-style — no live external DBs)
		//
		// These tests prove the query-execution dispatcher reaches every
		// supported driver by feeding it a minimal mock provider with the
		// shape of each driver's pool. They guard against regressions in
		// the symptom the user reported: "MSSQL isn't supported."
		// ----------------------------------------------------------------
		suite
		(
			'_runQuery driver dispatch',
			function ()
			{
				let _Introspector = null;

				suiteSetup
				(
					function ()
					{
						_Introspector = _Fable.DataBeaconSchemaIntrospector;
						libAssert.ok(_Introspector, 'SchemaIntrospector service should be available');
						libAssert.strictEqual(typeof _Introspector._runQuery, 'function', '_runQuery should exist');
					}
				);

				test
				(
					'MySQL: dispatches to pool.query callback',
					function (fDone)
					{
						let tmpRows = [ { id: 1 }, { id: 2 } ];
						let tmpProvider =
						{
							pool:
							{
								query: function (pSQL, fCb) { return fCb(null, tmpRows); }
							}
						};
						_Introspector._runQuery('MySQL', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRows);
							return fDone();
						});
					}
				);

				test
				(
					'PostgreSQL: extracts .rows from result',
					function (fDone)
					{
						let tmpResult = { rows: [ { x: 'a' } ], rowCount: 1 };
						let tmpProvider =
						{
							pool:
							{
								query: function (pSQL, fCb) { return fCb(null, tmpResult); }
							}
						};
						_Introspector._runQuery('PostgreSQL', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpResult.rows);
							return fDone();
						});
					}
				);

				test
				(
					'SQLite: uses prepare().all()',
					function (fDone)
					{
						let tmpRows = [ { hello: 'world' } ];
						let tmpProvider =
						{
							db:
							{
								prepare: function (pSQL)
								{
									return { all: function () { return tmpRows; } };
								}
							}
						};
						_Introspector._runQuery('SQLite', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRows);
							return fDone();
						});
					}
				);

				test
				(
					'MSSQL: extracts .recordset from request().query() promise — REGRESSION GUARD',
					function (fDone)
					{
						let tmpRecordset = [ { TABLE_NAME: 'User' } ];
						let tmpProvider =
						{
							pool:
							{
								request: function ()
								{
									return {
										query: function (pSQL)
										{
											return Promise.resolve({ recordset: tmpRecordset, rowsAffected: [1] });
										}
									};
								}
							}
						};
						_Introspector._runQuery('MSSQL', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRecordset);
							return fDone();
						});
					}
				);

				test
				(
					'MSSQL: surfaces a query error from the rejected promise',
					function (fDone)
					{
						let tmpProvider =
						{
							pool:
							{
								request: function ()
								{
									return {
										query: function (pSQL)
										{
											return Promise.reject(new Error('Invalid object name dbo.Missing'));
										}
									};
								}
							}
						};
						_Introspector._runQuery('MSSQL', tmpProvider, 'SELECT 1 FROM dbo.Missing', function (pError, pResult)
						{
							libAssert.ok(pError, 'Should produce an error');
							libAssert.ok(/Missing/.test(pError.message), 'Error message should be passed through');
							return fDone();
						});
					}
				);

				test
				(
					'MSSQL: returns clear error when provider not connected',
					function (fDone)
					{
						_Introspector._runQuery('MSSQL', {}, 'SELECT 1', function (pError)
						{
							libAssert.ok(pError, 'Should produce an error');
							libAssert.ok(/not connected/i.test(pError.message), 'Error should mention not-connected');
							return fDone();
						});
					}
				);

				test
				(
					'MongoDB / Solr / RocksDB: explicit not-SQL errors per driver',
					function (fDone)
				{
					let tmpResults = [];
					let tmpExpectations =
					[
						{ Type: 'MongoDB', Pattern: /MongoDB/ },
						{ Type: 'Solr', Pattern: /Solr/ },
						{ Type: 'RocksDB', Pattern: /RocksDB/ }
					];
					let tmpRemaining = tmpExpectations.length;
					tmpExpectations.forEach(function (pExpect)
					{
						_Introspector._runQuery(pExpect.Type, {}, 'SELECT 1', function (pError)
						{
							libAssert.ok(pError, `${pExpect.Type} should error`);
							libAssert.ok(pExpect.Pattern.test(pError.message),
								`${pExpect.Type} error should mention the driver name; got: ${pError.message}`);
							tmpResults.push(pExpect.Type);
							tmpRemaining--;
							if (tmpRemaining === 0)
							{
								libAssert.strictEqual(tmpResults.length, tmpExpectations.length);
								return fDone();
							}
						});
					});
				}
				);

				test
				(
					'Unknown driver: bare not-supported error',
					function (fDone)
					{
						_Introspector._runQuery('Cassandra', {}, 'SELECT 1', function (pError)
						{
							libAssert.ok(pError, 'Should error for unknown driver');
							libAssert.ok(/Cassandra/.test(pError.message), 'Error should include the type name');
							return fDone();
						});
					}
				);
			}
		);
	}
);

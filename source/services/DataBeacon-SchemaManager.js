/**
 * DataBeacon -- Schema Manager
 *
 * Adds DDL capabilities to retold-databeacon: ensure that a named set
 * of tables (and their indices) exists in a connected database.
 * Mesh-callable via the DataBeaconSchema capability registered in
 * DataBeacon-BeaconProvider.js.
 *
 * Why this exists
 * ===============
 * retold-databeacon's DataBeaconManagement capability exposes
 * Introspect / EnableEndpoint / DisableEndpoint — all read-or-expose
 * surface, no create. Bootstrapping ultravisor's persistence tables
 * (UVQueueWorkItem etc.) into a fresh database from the mesh requires
 * a DDL surface. This module provides one.
 *
 * Schema descriptor shape
 * =======================
 * Callers pass a JSON descriptor following the conventions in
 * `modules/apps/ultravisor/source/persistence/UltravisorPersistenceSchema.json`:
 *
 *   {
 *     "SchemaName": "ultravisor",
 *     "Version":    1,
 *     "Tables": [
 *       {
 *         "Scope":             "UVQueueWorkItem",
 *         "DefaultIdentifier": "IDUVQueueWorkItem",
 *         "Domain":            "Ultravisor",
 *         "Schema": [
 *           { "Column": "...", "Type": "AutoIdentity|String|Integer|Float|Boolean|CreateDate|UpdateDate|Deleted", "Size": "..." },
 *           ...
 *         ],
 *         "Indexes": [ { "Name": "...", "Columns": [...], "Unique": true } ]
 *       }
 *     ]
 *   }
 *
 * Engine generalization (Session 2)
 * =================================
 * Every meadow connector (sqlite / mysql / mssql / postgresql) exposes
 * a `schemaProvider` getter that returns its `Meadow-Schema-<engine>`
 * service. Those services accept a meadow-shaped descriptor
 * (`{ Tables: [{ TableName, Columns: [{ Column, DataType, Size? }], Indices?: [...] }] }`)
 * and run engine-specific DDL via `createTables` + `createAllIndices`.
 *
 * This manager translates our schema descriptor (Scope/Schema/Indexes,
 * with high-level Type values like AutoIdentity / Integer / Float /
 * Deleted / CreateDate) into the meadow shape, then delegates table
 * creation and index creation to the connector. Both connector calls
 * are idempotent (CREATE [TABLE|INDEX] IF NOT EXISTS, or equivalent
 * INFORMATION_SCHEMA-gated paths on engines that lack IF NOT EXISTS).
 *
 * Forward-only ADD COLUMN migration uses the connector's
 * `introspectTableColumns` to detect missing columns. SQLite ADD COLUMN
 * uses better-sqlite3's synchronous .exec() against the live handle;
 * MySQL/MSSQL/Postgres ADD COLUMN is deferred to Session 4 (see the
 * persistence-via-databeacon plan) — for those engines we currently
 * surface a Note when the descriptor adds columns to an existing table.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */
const libFableServiceProviderBase = require('fable-serviceproviderbase');

// Map our descriptor's high-level Type values onto the lower-level
// meadow connector DataType vocabulary used by `Meadow-Schema-<engine>`.
const DESCRIPTOR_TYPE_TO_MEADOW_DATATYPE =
{
	AutoIdentity:  'ID',
	AutoGUID:      'GUID',
	String:        'String',
	Text:          'Text',
	Integer:       'Numeric',
	Float:         'Decimal',
	Decimal:       'Decimal',
	Boolean:       'Boolean',
	Deleted:       'Boolean',
	CreateDate:    'DateTime',
	UpdateDate:    'DateTime',
	DeleteDate:    'DateTime',
	DateTime:      'DateTime',
	JSON:          'JSON',
	ForeignKey:    'ForeignKey',
	CreateIDUser:  'Numeric',
	UpdateIDUser:  'Numeric',
	DeleteIDUser:  'Numeric'
};

class DataBeaconSchemaManager extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'DataBeaconSchemaManager';
	}

	/**
	 * EnsureSchema action handler. Idempotent: every call ensures the
	 * tables in the descriptor exist on the named connection, runs
	 * forward-only ADD COLUMN migrations where the engine supports it,
	 * and creates indices if missing.
	 *
	 * @param {object} pSettings    - { IDBeaconConnection, SchemaName, SchemaJSON }
	 * @param {function} fCallback - function(pError, pResult)
	 *   pResult: { Success, Engine, SchemaName, TablesCreated, ColumnsAdded, IndicesCreated, Notes:[] }
	 */
	ensureSchema(pSettings, fCallback)
	{
		let tmpConnID = pSettings && pSettings.IDBeaconConnection;
		let tmpSchemaName = (pSettings && pSettings.SchemaName) || 'unnamed';
		let tmpSchemaJSON = pSettings && pSettings.SchemaJSON;

		if (!tmpConnID)
		{
			return fCallback(new Error('EnsureSchema: IDBeaconConnection is required.'));
		}
		if (!tmpSchemaJSON || !Array.isArray(tmpSchemaJSON.Tables))
		{
			return fCallback(new Error('EnsureSchema: SchemaJSON.Tables is required.'));
		}

		let tmpBridge = this.fable.DataBeaconConnectionBridge;
		if (!tmpBridge)
		{
			return fCallback(new Error('EnsureSchema: DataBeaconConnectionBridge service not available.'));
		}
		let tmpConn = tmpBridge.getConnection(tmpConnID);
		if (!tmpConn || tmpConn.status !== 'connected')
		{
			return fCallback(new Error(`EnsureSchema: connection [${tmpConnID}] is not live.`));
		}

		let tmpSchemaService = this._engineSchemaService(tmpConn);
		if (!tmpSchemaService)
		{
			return fCallback(new Error(
				`EnsureSchema: connector "${tmpConn.type}" does not expose a schemaProvider — ` +
				`only sqlite / mysql / mssql / postgresql connectors are wired for EnsureSchema.`));
		}

		let tmpEngine = (tmpConn.type || '').toLowerCase();
		let tmpMeadowSchema;
		try
		{
			tmpMeadowSchema = this._descriptorToMeadowSchema(tmpSchemaJSON);
		}
		catch (pTransErr)
		{
			return fCallback(pTransErr);
		}

		let tmpResult =
		{
			Success: true,
			SchemaName: tmpSchemaName,
			Engine: tmpEngine,
			TablesCreated: [],
			ColumnsAdded: [],
			IndicesCreated: [],
			Notes: []
		};

		// 1. Snapshot which tables already exist so the result can report
		//    truly-new tables vs. no-ops. Connector's listTables strips
		//    sqlite_* / pg_catalog noise for us.
		tmpSchemaService.listTables((pListErr, pExistingTables) =>
		{
			if (pListErr) { return fCallback(pListErr); }
			let tmpExistingSet = new Set(pExistingTables || []);

			// 2. createTables — idempotent on every supported engine.
			tmpSchemaService.createTables(tmpMeadowSchema, (pCreateErr) =>
			{
				if (pCreateErr) { return fCallback(pCreateErr); }
				for (let i = 0; i < tmpMeadowSchema.Tables.length; i++)
				{
					let tmpName = tmpMeadowSchema.Tables[i].TableName;
					if (!tmpExistingSet.has(tmpName))
					{
						tmpResult.TablesCreated.push(tmpName);
					}
				}

				// 3. Forward-only ADD COLUMN for tables that already
				//    existed before this call.
				this._forwardMigrateColumns(tmpConn, tmpEngine, tmpSchemaService,
					tmpMeadowSchema, tmpExistingSet, tmpResult,
					(pMigErr) =>
					{
						if (pMigErr) { return fCallback(pMigErr); }

						// 4. createAllIndices — idempotent on every
						//    supported engine.
						tmpSchemaService.createAllIndices(tmpMeadowSchema, (pIdxErr) =>
						{
							if (pIdxErr) { return fCallback(pIdxErr); }
							for (let i = 0; i < tmpMeadowSchema.Tables.length; i++)
							{
								let tmpIdxs = tmpMeadowSchema.Tables[i].Indices || [];
								for (let j = 0; j < tmpIdxs.length; j++)
								{
									tmpResult.IndicesCreated.push(tmpIdxs[j].Name);
								}
							}
							return fCallback(null, tmpResult);
						});
					});
			});
		});
	}

	/**
	 * IntrospectSchema action handler. Reports whether each descriptor
	 * table exists, and which descriptor columns are missing on each
	 * existing table. Engine-agnostic — uses the connector's
	 * `listTables` and `introspectTableColumns`.
	 *
	 * @param {object} pSettings    - { IDBeaconConnection, SchemaName, SchemaJSON }
	 * @param {function} fCallback - function(pError, pResult)
	 *   pResult: { Success, SchemaName, Engine, Tables: [{ Scope, Exists, Columns, MissingColumns }] }
	 */
	introspectSchema(pSettings, fCallback)
	{
		let tmpConnID = pSettings && pSettings.IDBeaconConnection;
		let tmpSchemaName = (pSettings && pSettings.SchemaName) || 'unnamed';
		let tmpSchemaJSON = pSettings && pSettings.SchemaJSON;

		if (!tmpConnID)
		{
			return fCallback(new Error('IntrospectSchema: IDBeaconConnection is required.'));
		}
		if (!tmpSchemaJSON || !Array.isArray(tmpSchemaJSON.Tables))
		{
			return fCallback(new Error('IntrospectSchema: SchemaJSON.Tables is required.'));
		}

		let tmpBridge = this.fable.DataBeaconConnectionBridge;
		if (!tmpBridge)
		{
			return fCallback(new Error('IntrospectSchema: DataBeaconConnectionBridge service not available.'));
		}
		let tmpConn = tmpBridge.getConnection(tmpConnID);
		if (!tmpConn || tmpConn.status !== 'connected')
		{
			return fCallback(new Error(`IntrospectSchema: connection [${tmpConnID}] is not live.`));
		}

		let tmpSchemaService = this._engineSchemaService(tmpConn);
		if (!tmpSchemaService)
		{
			return fCallback(new Error(
				`IntrospectSchema: connector "${tmpConn.type}" does not expose a schemaProvider.`));
		}

		let tmpEngine = (tmpConn.type || '').toLowerCase();
		let tmpResult =
		{
			Success: true,
			SchemaName: tmpSchemaName,
			Engine: tmpEngine,
			Tables: []
		};

		tmpSchemaService.listTables((pListErr, pExistingTables) =>
		{
			if (pListErr) { return fCallback(pListErr); }
			let tmpExistingSet = new Set(pExistingTables || []);
			let tmpDescTables = tmpSchemaJSON.Tables;

			let tmpAdvance = (pIdx) =>
			{
				if (pIdx >= tmpDescTables.length)
				{
					return fCallback(null, tmpResult);
				}
				let tmpDesc = tmpDescTables[pIdx];
				let tmpName = tmpDesc.Scope;
				let tmpExpectedCols = (tmpDesc.Schema || []).map((pC) => pC.Column);
				if (!tmpExistingSet.has(tmpName))
				{
					tmpResult.Tables.push(
					{
						Scope: tmpName,
						Exists: false,
						Columns: [],
						MissingColumns: tmpExpectedCols
					});
					return tmpAdvance(pIdx + 1);
				}
				tmpSchemaService.introspectTableColumns(tmpName, (pColErr, pCols) =>
				{
					if (pColErr) { return fCallback(pColErr); }
					let tmpHave = new Set((pCols || []).map((pC) => pC.Column));
					let tmpMissing = tmpExpectedCols.filter((pName) => !tmpHave.has(pName));
					tmpResult.Tables.push(
					{
						Scope: tmpName,
						Exists: true,
						Columns: Array.from(tmpHave),
						MissingColumns: tmpMissing
					});
					return tmpAdvance(pIdx + 1);
				});
			};

			tmpAdvance(0);
		});
	}

	// ====================================================================
	// Engine resolution + descriptor translation
	// ====================================================================

	/**
	 * Return the connector's MeadowSchema service for a live connection.
	 * Every meadow connector exposes either a `schemaProvider` getter
	 * or, on older revisions, a `_SchemaProvider` field. Returns null
	 * for connectors that don't ship a schema service (e.g. mongodb,
	 * solr, dgraph) — those raise a clear error in ensureSchema.
	 */
	_engineSchemaService(pConn)
	{
		if (!pConn || !pConn.instance) { return null; }
		if (pConn.instance.schemaProvider) { return pConn.instance.schemaProvider; }
		if (pConn.instance._SchemaProvider) { return pConn.instance._SchemaProvider; }
		return null;
	}

	/**
	 * Translate our schema descriptor (Scope / Schema / Indexes / high-
	 * level Type) into the meadow connector shape (TableName / Columns /
	 * Indices / lower-level DataType).
	 */
	_descriptorToMeadowSchema(pDescriptor)
	{
		let tmpTables = [];
		for (let i = 0; i < pDescriptor.Tables.length; i++)
		{
			let tmpDesc = pDescriptor.Tables[i];
			if (!tmpDesc.Scope || !Array.isArray(tmpDesc.Schema))
			{
				continue;
			}
			let tmpMeadowTable =
			{
				TableName: tmpDesc.Scope,
				Columns: tmpDesc.Schema.map((pCol) => this._descriptorToMeadowColumn(pCol))
			};
			if (Array.isArray(tmpDesc.Indexes))
			{
				tmpMeadowTable.Indices = tmpDesc.Indexes.map((pIdx, pK) => (
					{
						Name: pIdx.Name || `IX_${tmpDesc.Scope}_${pK}`,
						Columns: Array.isArray(pIdx.Columns) ? pIdx.Columns : [pIdx.Columns],
						Unique: !!pIdx.Unique,
						Strategy: pIdx.Strategy || ''
					}));
			}
			tmpTables.push(tmpMeadowTable);
		}
		return { Tables: tmpTables };
	}

	_descriptorToMeadowColumn(pCol)
	{
		let tmpType = pCol.Type;
		let tmpSize = pCol.Size;
		let tmpDataType = DESCRIPTOR_TYPE_TO_MEADOW_DATATYPE[tmpType] || 'Text';

		// `String, Size: 'Default'` has no meaningful CHAR(N) on
		// MySQL / MSSQL / Postgres. Fall back to Text (unbounded) so
		// the engine path still produces a valid CREATE TABLE. SQLite
		// stores both as TEXT so this is invisible there.
		if (tmpType === 'String' && (tmpSize === 'Default' || tmpSize == null))
		{
			tmpDataType = 'Text';
			tmpSize = null;
		}
		// JSON columns take Text on every supported engine — keep them
		// engine-portable. Connectors with native JSON could promote
		// later without changing this map.
		if (tmpType === 'JSON')
		{
			tmpDataType = 'Text';
			tmpSize = null;
		}

		let tmpResult = { Column: pCol.Column, DataType: tmpDataType };
		if (tmpSize && tmpSize !== 'Default' && tmpSize !== 'int')
		{
			tmpResult.Size = tmpSize;
		}
		else if (tmpDataType === 'Decimal')
		{
			// Connectors render `DECIMAL(${Size})` directly — supply a
			// neutral default for Float-typed descriptor columns.
			tmpResult.Size = '10,2';
		}
		return tmpResult;
	}

	// ====================================================================
	// Forward-only ADD COLUMN migration
	// ====================================================================

	/**
	 * For each table that existed before createTables, diff descriptor
	 * columns against the live database and add the missing ones. The
	 * actual ALTER TABLE statement is engine-specific.
	 */
	_forwardMigrateColumns(pConn, pEngine, pSchemaService, pMeadowSchema, pPreExistingSet, pResult, fCallback)
	{
		let tmpToCheck = pMeadowSchema.Tables.filter((pT) => pPreExistingSet.has(pT.TableName));
		if (tmpToCheck.length === 0) { return fCallback(null); }

		let tmpAdvance = (pIdx) =>
		{
			if (pIdx >= tmpToCheck.length) { return fCallback(null); }
			let tmpTable = tmpToCheck[pIdx];
			pSchemaService.introspectTableColumns(tmpTable.TableName, (pErr, pCols) =>
			{
				if (pErr) { return fCallback(pErr); }
				let tmpHave = new Set((pCols || []).map((pC) => pC.Column));
				let tmpMissing = tmpTable.Columns.filter((pC) => !tmpHave.has(pC.Column) && pC.DataType !== 'ID');
				if (tmpMissing.length === 0) { return tmpAdvance(pIdx + 1); }
				this._addColumnsForTable(pConn, pEngine, tmpTable.TableName, tmpMissing, pResult, (pAddErr) =>
				{
					if (pAddErr) { return fCallback(pAddErr); }
					return tmpAdvance(pIdx + 1);
				});
			});
		};
		tmpAdvance(0);
	}

	_addColumnsForTable(pConn, pEngine, pTableName, pColumns, pResult, fCallback)
	{
		// Today only SQLite has a runtime ALTER TABLE path here. The
		// other engines have idempotent `createTables` (CREATE IF NOT
		// EXISTS) so fresh-bootstrap is fine on all four engines, but
		// a *changed* descriptor against an existing MySQL/Postgres/
		// MSSQL schema needs ADD COLUMN — that's Session 4 work.
		if (pEngine === 'sqlite')
		{
			try
			{
				this._addColumnsSqlite(pConn, pTableName, pColumns, pResult);
				return fCallback(null);
			}
			catch (pErr) { return fCallback(pErr); }
		}
		pResult.Notes.push(
			`forward-migration deferred: engine [${pEngine}] does not yet support ADD COLUMN ` +
			`for ${pColumns.length} missing column(s) on ${pTableName} (Session 4).`);
		return fCallback(null);
	}

	/**
	 * SQLite ADD COLUMN — synchronous via better-sqlite3.
	 * The connector's setDatabase() has already wired up `_Database` on
	 * the schemaProvider, but for ALTER TABLE we go through the same
	 * better-sqlite3 handle. The handle lives at
	 * `pConn.instance._database` (Meadow-Connection-SQLite.js:172).
	 */
	_addColumnsSqlite(pConn, pTableName, pColumns, pResult)
	{
		let tmpDB = pConn.instance && pConn.instance._database;
		if (!tmpDB || typeof tmpDB.exec !== 'function')
		{
			throw new Error('addColumnsSqlite: SQLite connection has no .exec method (unexpected meadow shape).');
		}
		for (let i = 0; i < pColumns.length; i++)
		{
			let tmpCol = pColumns[i];
			let tmpFragment = this._sqliteColumnSqlFragment(tmpCol);
			let tmpAlter = `ALTER TABLE "${pTableName}" ADD COLUMN ${tmpFragment};`;
			try
			{
				tmpDB.exec(tmpAlter);
				pResult.ColumnsAdded.push(`${pTableName}.${tmpCol.Column}`);
			}
			catch (pAlterErr)
			{
				if (/duplicate column/i.test(pAlterErr.message || ''))
				{
					continue;
				}
				throw pAlterErr;
			}
		}
	}

	/**
	 * Mirror the column-type fragments emitted by
	 * Meadow-Schema-SQLite.generateCreateTableStatement so the ALTER
	 * matches exactly what the original CREATE would have produced.
	 */
	_sqliteColumnSqlFragment(pCol)
	{
		let tmpName = pCol.Column;
		switch (pCol.DataType)
		{
			case 'GUID':
				return `"${tmpName}" TEXT DEFAULT '00000000-0000-0000-0000-000000000000'`;
			case 'ForeignKey':
			case 'Numeric':
				return `"${tmpName}" INTEGER NOT NULL DEFAULT 0`;
			case 'Decimal':
				return `"${tmpName}" REAL`;
			case 'String':
				return `"${tmpName}" TEXT NOT NULL DEFAULT ''`;
			case 'Text':
				return `"${tmpName}" TEXT`;
			case 'DateTime':
				return `"${tmpName}" TEXT`;
			case 'Boolean':
				return `"${tmpName}" INTEGER NOT NULL DEFAULT 0`;
			case 'JSON':
				return `"${tmpName}" TEXT`;
			default:
				return `"${tmpName}" TEXT`;
		}
	}
}

/**
 * Register the DataBeaconSchema beacon capability on an existing
 * beacon service. Mirrors the registerMeadowProxyCapability shape.
 *
 * Two actions:
 *   - EnsureSchema(IDBeaconConnection, SchemaName, SchemaJSON)
 *   - IntrospectSchema(IDBeaconConnection, SchemaName, SchemaJSON)
 *
 * Both expect the descriptor in SchemaJSON to follow the convention
 * documented at the top of this file.
 */
const registerSchemaCapability = function (pBeaconService, pFable)
{
	let tmpManager = pFable.DataBeaconSchemaManager;
	if (!tmpManager)
	{
		throw new Error('registerSchemaCapability: DataBeaconSchemaManager not registered on fable yet.');
	}

	pBeaconService.registerCapability(
	{
		Capability: 'DataBeaconSchema',
		Name: 'DataBeaconSchemaProvider',
		actions:
		{
			'EnsureSchema':
			{
				Description: 'Idempotently materialize a set of tables (and indices) on a connected database.',
				SettingsSchema:
				[
					{ Name: 'IDBeaconConnection', DataType: 'Number', Required: true },
					{ Name: 'SchemaName',         DataType: 'String', Required: true },
					{ Name: 'SchemaJSON',         DataType: 'Object', Required: true }
				],
				Handler: function (pWorkItem, pContext, fHandlerCallback)
				{
					let tmpSettings = pWorkItem.Settings || {};
					tmpManager.ensureSchema(tmpSettings, (pErr, pResult) =>
					{
						if (pErr) { return fHandlerCallback(pErr); }
						return fHandlerCallback(null, { Outputs: pResult, Log: [] });
					});
				}
			},
			'IntrospectSchema':
			{
				Description: 'Report which descriptor tables/columns exist on a connected database.',
				SettingsSchema:
				[
					{ Name: 'IDBeaconConnection', DataType: 'Number', Required: true },
					{ Name: 'SchemaName',         DataType: 'String', Required: true },
					{ Name: 'SchemaJSON',         DataType: 'Object', Required: true }
				],
				Handler: function (pWorkItem, pContext, fHandlerCallback)
				{
					let tmpSettings = pWorkItem.Settings || {};
					tmpManager.introspectSchema(tmpSettings, (pErr, pResult) =>
					{
						if (pErr) { return fHandlerCallback(pErr); }
						return fHandlerCallback(null, { Outputs: pResult, Log: [] });
					});
				}
			}
		}
	});
};

module.exports = DataBeaconSchemaManager;
module.exports.registerSchemaCapability = registerSchemaCapability;
module.exports.DESCRIPTOR_TYPE_TO_MEADOW_DATATYPE = DESCRIPTOR_TYPE_TO_MEADOW_DATATYPE;

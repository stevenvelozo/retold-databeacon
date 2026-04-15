/**
 * DataBeacon - Schema Introspector Service
 *
 * Per-dialect schema introspection for external databases.
 * Queries information_schema (MySQL/PostgreSQL/MSSQL) or
 * sqlite_master/PRAGMA (SQLite) to discover tables and columns,
 * then persists the results to the IntrospectedTable DAL entity.
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libFableServiceProviderBase = require('fable-serviceproviderbase');

const defaultSchemaIntrospectorOptions = (
	{
		RoutePrefix: '/beacon'
	});

class DataBeaconSchemaIntrospector extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, defaultSchemaIntrospectorOptions, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this.serviceType = 'DataBeaconSchemaIntrospector';
	}

	// ================================================================
	// Dialect-Specific Introspectors
	// ================================================================

	/**
	 * Get an introspector object for the given connection type.
	 * Returns { listTables(pPool, fCallback), describeTable(pPool, pTableName, fCallback) }
	 */
	_getIntrospector(pType)
	{
		switch (pType)
		{
			case 'MySQL':
				return this._mysqlIntrospector();
			case 'PostgreSQL':
				return this._postgresqlIntrospector();
			case 'MSSQL':
				return this._mssqlIntrospector();
			case 'SQLite':
				return this._sqliteIntrospector();
			default:
				return null;
		}
	}

	_mysqlIntrospector()
	{
		return {
			listTables: (pProvider, fCallback) =>
			{
				let tmpPool = pProvider.pool || pProvider;
				tmpPool.query(
					`SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
					(pError, pResults) =>
					{
						if (pError) return fCallback(pError);
						let tmpTables = [];
						for (let i = 0; i < pResults.length; i++)
						{
							tmpTables.push({ TableName: pResults[i].TABLE_NAME, RowCountEstimate: pResults[i].TABLE_ROWS || 0 });
						}
						return fCallback(null, tmpTables);
					});
			},
			describeTable: (pProvider, pTableName, fCallback) =>
			{
				let tmpPool = pProvider.pool || pProvider;
				tmpPool.query(
					`SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
					 FROM information_schema.COLUMNS
					 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
					 ORDER BY ORDINAL_POSITION`,
					[pTableName],
					(pError, pResults) =>
					{
						if (pError) return fCallback(pError);
						let tmpColumns = [];
						for (let i = 0; i < pResults.length; i++)
						{
							let tmpRow = pResults[i];
							tmpColumns.push(
							{
								Name: tmpRow.COLUMN_NAME,
								NativeType: tmpRow.DATA_TYPE,
								MaxLength: tmpRow.CHARACTER_MAXIMUM_LENGTH,
								Nullable: tmpRow.IS_NULLABLE === 'YES',
								IsPrimaryKey: tmpRow.COLUMN_KEY === 'PRI',
								IsAutoIncrement: (tmpRow.EXTRA || '').indexOf('auto_increment') >= 0,
								DefaultValue: tmpRow.COLUMN_DEFAULT,
								MeadowType: this._mapNativeTypeToMeadow(tmpRow.DATA_TYPE, tmpRow.COLUMN_KEY === 'PRI', (tmpRow.EXTRA || '').indexOf('auto_increment') >= 0)
							});
						}
						return fCallback(null, tmpColumns);
					});
			}
		};
	}

	_postgresqlIntrospector()
	{
		return {
			listTables: (pProvider, fCallback) =>
			{
				let tmpPool = pProvider.pool || pProvider;
				tmpPool.query(
					`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`,
					(pError, pResult) =>
					{
						if (pError) return fCallback(pError);
						let tmpRows = pResult.rows || pResult;
						let tmpTables = [];
						for (let i = 0; i < tmpRows.length; i++)
						{
							tmpTables.push({ TableName: tmpRows[i].table_name, RowCountEstimate: 0 });
						}
						return fCallback(null, tmpTables);
					});
			},
			describeTable: (pProvider, pTableName, fCallback) =>
			{
				let tmpPool = pProvider.pool || pProvider;
				let tmpSQL = `
					SELECT c.column_name, c.data_type, c.character_maximum_length, c.is_nullable, c.column_default,
						   CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
					FROM information_schema.columns c
					LEFT JOIN (
						SELECT ku.column_name
						FROM information_schema.table_constraints tc
						JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
						WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
					) pk ON pk.column_name = c.column_name
					WHERE c.table_schema = 'public' AND c.table_name = $1
					ORDER BY c.ordinal_position`;

				tmpPool.query(tmpSQL, [pTableName],
					(pError, pResult) =>
					{
						if (pError) return fCallback(pError);
						let tmpRows = pResult.rows || pResult;
						let tmpColumns = [];
						for (let i = 0; i < tmpRows.length; i++)
						{
							let tmpRow = tmpRows[i];
							let tmpIsAuto = (tmpRow.column_default || '').indexOf('nextval') >= 0;
							tmpColumns.push(
							{
								Name: tmpRow.column_name,
								NativeType: tmpRow.data_type,
								MaxLength: tmpRow.character_maximum_length,
								Nullable: tmpRow.is_nullable === 'YES',
								IsPrimaryKey: tmpRow.is_primary_key,
								IsAutoIncrement: tmpIsAuto,
								DefaultValue: tmpRow.column_default,
								MeadowType: this._mapNativeTypeToMeadow(tmpRow.data_type, tmpRow.is_primary_key, tmpIsAuto)
							});
						}
						return fCallback(null, tmpColumns);
					});
			}
		};
	}

	_mssqlIntrospector()
	{
		return {
			listTables: (pProvider, fCallback) =>
			{
				let tmpPool = pProvider.pool || pProvider;
				let tmpRequest = tmpPool.request ? tmpPool.request() : tmpPool;
				let tmpQuery = tmpRequest.query || tmpRequest;

				if (typeof tmpQuery === 'function')
				{
					tmpQuery.call(tmpRequest,
						`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`,
						(pError, pResult) =>
						{
							if (pError) return fCallback(pError);
							let tmpRows = pResult.recordset || pResult;
							let tmpTables = [];
							for (let i = 0; i < tmpRows.length; i++)
							{
								tmpTables.push({ TableName: tmpRows[i].TABLE_NAME, RowCountEstimate: 0 });
							}
							return fCallback(null, tmpTables);
						});
				}
				else
				{
					return fCallback(new Error('MSSQL provider query interface not available'));
				}
			},
			describeTable: (pProvider, pTableName, fCallback) =>
			{
				let tmpPool = pProvider.pool || pProvider;
				let tmpRequest = tmpPool.request ? tmpPool.request() : tmpPool;
				let tmpQuery = tmpRequest.query || tmpRequest;

				if (typeof tmpQuery === 'function')
				{
					tmpRequest.input('tableName', pTableName);
					tmpQuery.call(tmpRequest,
						`SELECT c.COLUMN_NAME, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH, c.IS_NULLABLE, c.COLUMN_DEFAULT,
						        CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY,
						        COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') AS IS_IDENTITY
						 FROM INFORMATION_SCHEMA.COLUMNS c
						 LEFT JOIN (
						     SELECT ku.COLUMN_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
						     JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
						     WHERE tc.TABLE_NAME = @tableName AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
						 ) pk ON pk.COLUMN_NAME = c.COLUMN_NAME
						 WHERE c.TABLE_NAME = @tableName
						 ORDER BY c.ORDINAL_POSITION`,
						(pError, pResult) =>
						{
							if (pError) return fCallback(pError);
							let tmpRows = pResult.recordset || pResult;
							let tmpColumns = [];
							for (let i = 0; i < tmpRows.length; i++)
							{
								let tmpRow = tmpRows[i];
								tmpColumns.push(
								{
									Name: tmpRow.COLUMN_NAME,
									NativeType: tmpRow.DATA_TYPE,
									MaxLength: tmpRow.CHARACTER_MAXIMUM_LENGTH,
									Nullable: tmpRow.IS_NULLABLE === 'YES',
									IsPrimaryKey: !!tmpRow.IS_PRIMARY_KEY,
									IsAutoIncrement: !!tmpRow.IS_IDENTITY,
									DefaultValue: tmpRow.COLUMN_DEFAULT,
									MeadowType: this._mapNativeTypeToMeadow(tmpRow.DATA_TYPE, !!tmpRow.IS_PRIMARY_KEY, !!tmpRow.IS_IDENTITY)
								});
							}
							return fCallback(null, tmpColumns);
						});
				}
				else
				{
					return fCallback(new Error('MSSQL provider query interface not available'));
				}
			}
		};
	}

	_sqliteIntrospector()
	{
		return {
			listTables: (pProvider, fCallback) =>
			{
				try
				{
					let tmpDB = pProvider.db || pProvider;
					let tmpStmt = tmpDB.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`);
					let tmpRows = tmpStmt.all();
					let tmpTables = [];
					for (let i = 0; i < tmpRows.length; i++)
					{
						tmpTables.push({ TableName: tmpRows[i].name, RowCountEstimate: 0 });
					}
					return fCallback(null, tmpTables);
				}
				catch (pError)
				{
					return fCallback(pError);
				}
			},
			describeTable: (pProvider, pTableName, fCallback) =>
			{
				try
				{
					let tmpDB = pProvider.db || pProvider;
					let tmpStmt = tmpDB.prepare(`PRAGMA table_info("${pTableName.replace(/"/g, '""')}")`);
					let tmpRows = tmpStmt.all();
					let tmpColumns = [];
					for (let i = 0; i < tmpRows.length; i++)
					{
						let tmpRow = tmpRows[i];
						let tmpIsPK = !!tmpRow.pk;
						tmpColumns.push(
						{
							Name: tmpRow.name,
							NativeType: tmpRow.type || 'TEXT',
							MaxLength: null,
							Nullable: !tmpRow.notnull,
							IsPrimaryKey: tmpIsPK,
							IsAutoIncrement: tmpIsPK && (tmpRow.type || '').toUpperCase().indexOf('INTEGER') >= 0,
							DefaultValue: tmpRow.dflt_value,
							MeadowType: this._mapNativeTypeToMeadow(tmpRow.type || 'TEXT', tmpIsPK, tmpIsPK && (tmpRow.type || '').toUpperCase().indexOf('INTEGER') >= 0)
						});
					}
					return fCallback(null, tmpColumns);
				}
				catch (pError)
				{
					return fCallback(pError);
				}
			}
		};
	}

	// ================================================================
	// Type Mapping
	// ================================================================

	/**
	 * Map a native database type to a Meadow type.
	 */
	_mapNativeTypeToMeadow(pNativeType, pIsPrimaryKey, pIsAutoIncrement)
	{
		if (pIsPrimaryKey && pIsAutoIncrement)
		{
			return 'AutoIdentity';
		}

		let tmpType = (pNativeType || 'TEXT').toUpperCase();

		// Integer types
		if (tmpType.indexOf('INT') >= 0 || tmpType === 'TINYINT' || tmpType === 'SMALLINT' || tmpType === 'MEDIUMINT' || tmpType === 'BIGINT')
		{
			return 'Numeric';
		}

		// Decimal/float types
		if (tmpType.indexOf('DECIMAL') >= 0 || tmpType.indexOf('NUMERIC') >= 0 || tmpType.indexOf('FLOAT') >= 0 ||
			tmpType.indexOf('DOUBLE') >= 0 || tmpType.indexOf('REAL') >= 0 || tmpType === 'MONEY' || tmpType === 'SMALLMONEY')
		{
			return 'Numeric';
		}

		// Boolean types
		if (tmpType === 'BOOLEAN' || tmpType === 'BOOL' || tmpType === 'BIT')
		{
			return 'Boolean';
		}

		// Date/time types
		if (tmpType.indexOf('DATE') >= 0 || tmpType.indexOf('TIME') >= 0 || tmpType === 'YEAR')
		{
			return 'DateTime';
		}

		// Text/string types
		if (tmpType.indexOf('CHAR') >= 0 || tmpType.indexOf('TEXT') >= 0 || tmpType === 'ENUM' || tmpType === 'SET' ||
			tmpType === 'CLOB' || tmpType.indexOf('VARYING') >= 0 || tmpType === 'NTEXT' || tmpType === 'NCHAR' ||
			tmpType === 'XML' || tmpType === 'JSON' || tmpType === 'UUID' || tmpType === 'UNIQUEIDENTIFIER' ||
			tmpType.indexOf('CHARACTER') >= 0)
		{
			return 'String';
		}

		// Binary types
		if (tmpType.indexOf('BLOB') >= 0 || tmpType.indexOf('BINARY') >= 0 || tmpType === 'BYTEA' || tmpType === 'IMAGE')
		{
			return 'String';
		}

		// Default to String
		return 'String';
	}

	/**
	 * Map a Meadow type and native type to a Meadow schema size.
	 */
	_mapSizeToMeadow(pMeadowType, pMaxLength, pNativeType)
	{
		if (pMeadowType === 'AutoIdentity') return 'Default';
		if (pMeadowType === 'Numeric')
		{
			let tmpType = (pNativeType || '').toUpperCase();
			if (tmpType.indexOf('DECIMAL') >= 0 || tmpType.indexOf('FLOAT') >= 0 ||
				tmpType.indexOf('DOUBLE') >= 0 || tmpType.indexOf('REAL') >= 0)
			{
				return 'decimal';
			}
			return 'int';
		}
		if (pMeadowType === 'Boolean') return 'Default';
		if (pMeadowType === 'DateTime') return 'Default';
		if (pMaxLength && pMaxLength > 0) return String(pMaxLength);
		return 'Default';
	}

	// ================================================================
	// Core Introspection Logic
	// ================================================================

	/**
	 * Introspect all tables for a given connection ID and persist results.
	 */
	introspect(pIDBeaconConnection, fCallback)
	{
		let tmpConnectionBridge = this.fable.DataBeaconConnectionBridge;

		if (!tmpConnectionBridge || !tmpConnectionBridge.isConnected(pIDBeaconConnection))
		{
			return fCallback(new Error('Connection is not live. Connect first.'));
		}

		// Load the connection record to get the type
		let tmpReadQuery = this.fable.DAL.BeaconConnection.query.clone()
			.addFilter('IDBeaconConnection', pIDBeaconConnection);

		this.fable.DAL.BeaconConnection.doRead(tmpReadQuery,
			(pReadError, pReadQuery, pConnectionRecord) =>
			{
				if (pReadError || !pConnectionRecord || !pConnectionRecord.IDBeaconConnection)
				{
					return fCallback(new Error('Connection record not found'));
				}

				let tmpType = pConnectionRecord.Type;
				let tmpIntrospector = this._getIntrospector(tmpType);

				if (!tmpIntrospector)
				{
					return fCallback(new Error(`Introspection not supported for type: ${tmpType}`));
				}

				let tmpProvider = tmpConnectionBridge.getConnectionInstance(pIDBeaconConnection);

				if (!tmpProvider)
				{
					return fCallback(new Error('Could not get connection provider instance'));
				}

				this.fable.log.info(`Introspecting ${tmpType} connection "${pConnectionRecord.Name}"...`);

				tmpIntrospector.listTables(tmpProvider,
					(pListError, pTables) =>
					{
						if (pListError)
						{
							return fCallback(pListError);
						}

						this.fable.log.info(`Found ${pTables.length} table(s). Describing columns...`);

						let tmpAnticipate = this.fable.newAnticipate();
						let tmpResults = [];

						for (let i = 0; i < pTables.length; i++)
						{
							let tmpTableInfo = pTables[i];
							tmpAnticipate.anticipate(
								(fStepCallback) =>
								{
									tmpIntrospector.describeTable(tmpProvider, tmpTableInfo.TableName,
										(pDescError, pColumns) =>
										{
											if (pDescError)
											{
												this.fable.log.warn(`Error describing table ${tmpTableInfo.TableName}: ${pDescError}`);
												return fStepCallback();
											}

											tmpResults.push(
											{
												TableName: tmpTableInfo.TableName,
												RowCountEstimate: tmpTableInfo.RowCountEstimate || 0,
												Columns: pColumns
											});
											return fStepCallback();
										});
								});
						}

						tmpAnticipate.wait(
							(pWaitError) =>
							{
								if (pWaitError)
								{
									return fCallback(pWaitError);
								}

								// Persist results to IntrospectedTable
								this._persistIntrospectionResults(pIDBeaconConnection, tmpResults,
									(pPersistError) =>
									{
										if (pPersistError)
										{
											return fCallback(pPersistError);
										}
										return fCallback(null, tmpResults);
									});
							});
					});
			});
	}

	/**
	 * Persist introspection results to the IntrospectedTable DAL entity.
	 * Upserts: updates existing records, creates new ones.
	 */
	_persistIntrospectionResults(pIDBeaconConnection, pResults, fCallback)
	{
		if (!this.fable.DAL || !this.fable.DAL.IntrospectedTable)
		{
			return fCallback(new Error('IntrospectedTable DAL not initialized'));
		}

		let tmpAnticipate = this.fable.newAnticipate();
		let tmpNow = new Date().toISOString();

		for (let i = 0; i < pResults.length; i++)
		{
			let tmpResult = pResults[i];

			tmpAnticipate.anticipate(
				(fStepCallback) =>
				{
					// Check if a record already exists for this connection+table
					let tmpFindQuery = this.fable.DAL.IntrospectedTable.query.clone()
						.addFilter('IDBeaconConnection', pIDBeaconConnection)
						.addFilter('TableName', tmpResult.TableName)
						.addFilter('Deleted', 0);

					this.fable.DAL.IntrospectedTable.doReads(tmpFindQuery,
						(pFindError, pFindQuery, pExisting) =>
						{
							if (pExisting && pExisting.length > 0)
							{
								// Update existing record
								let tmpRecord = pExisting[0];
								tmpRecord.ColumnDefinitions = JSON.stringify(tmpResult.Columns);
								tmpRecord.LastIntrospectedDate = tmpNow;
								tmpRecord.RowCountEstimate = tmpResult.RowCountEstimate || 0;

								let tmpUpdateQuery = this.fable.DAL.IntrospectedTable.query.clone()
									.addRecord(tmpRecord);

								this.fable.DAL.IntrospectedTable.doUpdate(tmpUpdateQuery,
									(pError) =>
									{
										if (pError) this.fable.log.warn(`Error updating IntrospectedTable for ${tmpResult.TableName}: ${pError}`);
										return fStepCallback();
									});
							}
							else
							{
								// Create new record
								let tmpNewRecord =
								{
									IDBeaconConnection: pIDBeaconConnection,
									DatabaseName: '',
									TableName: tmpResult.TableName,
									ColumnDefinitions: JSON.stringify(tmpResult.Columns),
									LastIntrospectedDate: tmpNow,
									EndpointsEnabled: 0,
									RowCountEstimate: tmpResult.RowCountEstimate || 0
								};

								let tmpCreateQuery = this.fable.DAL.IntrospectedTable.query.clone()
									.setIDUser(0)
									.addRecord(tmpNewRecord);

								this.fable.DAL.IntrospectedTable.doCreate(tmpCreateQuery,
									(pError) =>
									{
										if (pError) this.fable.log.warn(`Error creating IntrospectedTable for ${tmpResult.TableName}: ${pError}`);
										return fStepCallback();
									});
							}
						});
				});
		}

		tmpAnticipate.wait(fCallback);
	}

	/**
	 * Execute a read-only query against an external database connection.
	 */
	executeQuery(pIDBeaconConnection, pSQL, fCallback)
	{
		let tmpConnectionBridge = this.fable.DataBeaconConnectionBridge;

		if (!tmpConnectionBridge || !tmpConnectionBridge.isConnected(pIDBeaconConnection))
		{
			return fCallback(new Error('Connection is not live.'));
		}

		// Safety: only allow SELECT statements
		let tmpTrimmed = (pSQL || '').trim().toUpperCase();
		if (!tmpTrimmed.startsWith('SELECT'))
		{
			return fCallback(new Error('Only SELECT queries are allowed.'));
		}

		let tmpReadQuery = this.fable.DAL.BeaconConnection.query.clone()
			.addFilter('IDBeaconConnection', pIDBeaconConnection);

		this.fable.DAL.BeaconConnection.doRead(tmpReadQuery,
			(pReadError, pReadQuery, pConnectionRecord) =>
			{
				if (pReadError || !pConnectionRecord)
				{
					return fCallback(new Error('Connection record not found'));
				}

				let tmpType = pConnectionRecord.Type;
				let tmpProvider = tmpConnectionBridge.getConnectionInstance(pIDBeaconConnection);

				if (!tmpProvider)
				{
					return fCallback(new Error('Could not get connection provider instance'));
				}

				this._runQuery(tmpType, tmpProvider, pSQL, fCallback);
			});
	}

	_runQuery(pType, pProvider, pSQL, fCallback)
	{
		switch (pType)
		{
			case 'MySQL':
			{
				let tmpPool = pProvider.pool || pProvider;
				if (!tmpPool || typeof tmpPool.query !== 'function')
				{
					return fCallback(new Error('MySQL provider not connected.'));
				}
				tmpPool.query(pSQL,
					(pError, pResults) =>
					{
						if (pError) return fCallback(pError);
						return fCallback(null, pResults);
					});
				break;
			}
			case 'PostgreSQL':
			{
				let tmpPool = pProvider.pool || pProvider;
				if (!tmpPool || typeof tmpPool.query !== 'function')
				{
					return fCallback(new Error('PostgreSQL provider not connected.'));
				}
				let tmpResult = tmpPool.query(pSQL,
					(pError, pData) =>
					{
						if (pError) return fCallback(pError);
						return fCallback(null, (pData && pData.rows) || pData || []);
					});
				// node-postgres' Pool.query may return a Promise on newer
				// versions when no callback is supplied — defensive support.
				if (tmpResult && typeof tmpResult.then === 'function' && typeof tmpResult.catch === 'function')
				{
					this._adoptPromise(tmpResult, (pData) => (pData && pData.rows) || pData || [], fCallback);
				}
				break;
			}
			case 'SQLite':
			{
				try
				{
					let tmpDB = pProvider.db || pProvider;
					if (!tmpDB || typeof tmpDB.prepare !== 'function')
					{
						return fCallback(new Error('SQLite provider not connected.'));
					}
					let tmpStmt = tmpDB.prepare(pSQL);
					let tmpRows = tmpStmt.all();
					return fCallback(null, tmpRows);
				}
				catch (pError)
				{
					return fCallback(pError);
				}
				break;
			}
			case 'MSSQL':
			{
				try
				{
					// node-mssql exposes a ConnectionPool with .request() that
					// returns a Request whose .query(sql) returns a Promise
					// resolving to { recordset, recordsets, rowsAffected, ... }.
					// Older versions also supported a callback variant — match
					// the SchemaIntrospector's existing dual-style for safety.
					let tmpPool = pProvider.pool || pProvider;
					if (!tmpPool || typeof tmpPool.request !== 'function')
					{
						return fCallback(new Error('MSSQL provider not connected.'));
					}
					let tmpRequest = tmpPool.request();
					let tmpResult = tmpRequest.query(pSQL);
					if (tmpResult && typeof tmpResult.then === 'function')
					{
						this._adoptPromise(tmpResult, (pData) => (pData && pData.recordset) || [], fCallback);
					}
					else
					{
						return fCallback(null, (tmpResult && tmpResult.recordset) || []);
					}
				}
				catch (pError)
				{
					return fCallback(pError);
				}
				break;
			}
			case 'MongoDB':
				return fCallback(new Error('MongoDB does not support raw SQL — use the MongoDB collection API directly.'));
			case 'Solr':
				return fCallback(new Error('Solr does not support raw SQL — use the Solr query string syntax via /select.'));
			case 'RocksDB':
				return fCallback(new Error('RocksDB is a key-value store and does not support raw SQL.'));
			default:
				return fCallback(new Error(`Query execution not supported for type: ${pType}`));
		}
	}

	/**
	 * Adapt a Promise-returning query into the (err, rows) callback shape
	 * used throughout this service. Idempotent — guards against double-fire
	 * when a driver also accepts a callback alongside the Promise.
	 */
	_adoptPromise(pPromise, fExtractRows, fCallback)
	{
		let tmpDelivered = false;
		let tmpDeliver = (pError, pRows) =>
		{
			if (tmpDelivered) return;
			tmpDelivered = true;
			return fCallback(pError, pRows);
		};
		pPromise.then(
			(pData) => tmpDeliver(null, fExtractRows(pData)),
			(pError) => tmpDeliver(pError));
	}

	// ================================================================
	// REST Routes
	// ================================================================

	connectRoutes(pOratorServiceServer)
	{
		let tmpRoutePrefix = this.options.RoutePrefix;

		// POST /beacon/connection/:id/introspect -- introspect all tables
		pOratorServiceServer.doPost(`${tmpRoutePrefix}/connection/:id/introspect`,
			(pRequest, pResponse, fNext) =>
			{
				let tmpID = parseInt(pRequest.params.id, 10);

				this.introspect(tmpID,
					(pError, pResults) =>
					{
						if (pError)
						{
							pResponse.send({ Success: false, Error: pError.message || pError });
							return fNext();
						}

						pResponse.send(
						{
							Success: true,
							TableCount: pResults.length,
							Tables: pResults.map((pR) => ({ TableName: pR.TableName, ColumnCount: pR.Columns.length, RowCountEstimate: pR.RowCountEstimate }))
						});
						return fNext();
					});
			});

		// GET /beacon/connection/:id/tables -- list cached introspected tables
		pOratorServiceServer.doGet(`${tmpRoutePrefix}/connection/:id/tables`,
			(pRequest, pResponse, fNext) =>
			{
				if (!this.fable.DAL || !this.fable.DAL.IntrospectedTable)
				{
					pResponse.send({ Tables: [] });
					return fNext();
				}

				let tmpID = parseInt(pRequest.params.id, 10);

				let tmpQuery = this.fable.DAL.IntrospectedTable.query.clone()
					.addFilter('IDBeaconConnection', tmpID)
					.addFilter('Deleted', 0);

				this.fable.DAL.IntrospectedTable.doReads(tmpQuery,
					(pError, pQuery, pRecords) =>
					{
						if (pError)
						{
							pResponse.send({ Error: pError.message || pError, Tables: [] });
							return fNext();
						}

						let tmpTables = [];
						for (let i = 0; i < pRecords.length; i++)
						{
							let tmpRec = pRecords[i];
							let tmpCols = [];
							try { tmpCols = JSON.parse(tmpRec.ColumnDefinitions || '[]'); }
							catch (e) { /* ignore */ }

							tmpTables.push(
							{
								IDIntrospectedTable: tmpRec.IDIntrospectedTable,
								TableName: tmpRec.TableName,
								ColumnCount: tmpCols.length,
								RowCountEstimate: tmpRec.RowCountEstimate,
								EndpointsEnabled: !!tmpRec.EndpointsEnabled,
								LastIntrospectedDate: tmpRec.LastIntrospectedDate
							});
						}

						pResponse.send({ Count: tmpTables.length, Tables: tmpTables });
						return fNext();
					});
			});

		// GET /beacon/connection/:id/table/:tableName -- get column details
		pOratorServiceServer.doGet(`${tmpRoutePrefix}/connection/:id/table/:tableName`,
			(pRequest, pResponse, fNext) =>
			{
				if (!this.fable.DAL || !this.fable.DAL.IntrospectedTable)
				{
					pResponse.send({ Error: 'IntrospectedTable DAL not initialized' });
					return fNext();
				}

				let tmpID = parseInt(pRequest.params.id, 10);
				let tmpTableName = pRequest.params.tableName;

				let tmpQuery = this.fable.DAL.IntrospectedTable.query.clone()
					.addFilter('IDBeaconConnection', tmpID)
					.addFilter('TableName', tmpTableName)
					.addFilter('Deleted', 0);

				this.fable.DAL.IntrospectedTable.doReads(tmpQuery,
					(pError, pQuery, pRecords) =>
					{
						if (pError || !pRecords || pRecords.length === 0)
						{
							pResponse.send({ Error: 'Table not found' });
							return fNext();
						}

						let tmpRec = pRecords[0];
						let tmpCols = [];
						try { tmpCols = JSON.parse(tmpRec.ColumnDefinitions || '[]'); }
						catch (e) { /* ignore */ }

						pResponse.send(
						{
							IDIntrospectedTable: tmpRec.IDIntrospectedTable,
							TableName: tmpRec.TableName,
							Columns: tmpCols,
							RowCountEstimate: tmpRec.RowCountEstimate,
							EndpointsEnabled: !!tmpRec.EndpointsEnabled,
							LastIntrospectedDate: tmpRec.LastIntrospectedDate
						});
						return fNext();
					});
			});

		// POST /beacon/connection/:id/query -- execute a read-only query
		pOratorServiceServer.doPost(`${tmpRoutePrefix}/connection/:id/query`,
			(pRequest, pResponse, fNext) =>
			{
				let tmpID = parseInt(pRequest.params.id, 10);
				let tmpBody = pRequest.body || {};
				let tmpSQL = tmpBody.SQL || tmpBody.sql || '';

				if (!tmpSQL)
				{
					pResponse.send({ Error: 'SQL is required' });
					return fNext();
				}

				this.executeQuery(tmpID, tmpSQL,
					(pError, pResults) =>
					{
						if (pError)
						{
							pResponse.send({ Success: false, Error: pError.message || pError });
							return fNext();
						}

						pResponse.send(
						{
							Success: true,
							RowCount: Array.isArray(pResults) ? pResults.length : 0,
							Rows: pResults
						});
						return fNext();
					});
			});

		this.fable.log.info(`DataBeacon SchemaIntrospector routes connected at ${tmpRoutePrefix}/connection/:id/introspect, tables, query`);
	}
}

module.exports = DataBeaconSchemaIntrospector;
module.exports.serviceType = 'DataBeaconSchemaIntrospector';
module.exports.default_configuration = defaultSchemaIntrospectorOptions;

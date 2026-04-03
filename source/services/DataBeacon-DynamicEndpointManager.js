/**
 * DataBeacon - Dynamic Endpoint Manager Service
 *
 * Generates meadow DAL objects and REST endpoints from introspected
 * table schemas. Each enabled table gets standard CRUD routes at
 * /1.0/{TableName}. Uses per-connection Meadow instances to route
 * queries to the correct external database provider.
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libFableServiceProviderBase = require('fable-serviceproviderbase');
const libMeadow = require('meadow');
const libMeadowEndpoints = require('meadow-endpoints');

const defaultDynamicEndpointManagerOptions = (
	{
		RoutePrefix: '/beacon'
	});

class DataBeaconDynamicEndpointManager extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, defaultDynamicEndpointManagerOptions, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this.serviceType = 'DataBeaconDynamicEndpointManager';

		// Track enabled dynamic endpoints
		// Key: "connectionId-tableName", Value: { dal, endpoints, connectionId, tableName }
		this._EnabledEndpoints = {};

		// Per-connection Meadow instances for provider isolation
		// Key: connectionId, Value: Meadow instance
		this._ConnectionMeadows = {};
	}

	/**
	 * Build a Meadow schema object from introspected column definitions.
	 */
	_buildMeadowSchema(pTableName, pColumns)
	{
		let tmpIntrospector = this.fable.DataBeaconSchemaIntrospector;
		let tmpSchema = [];
		let tmpDefaultObject = {};

		for (let i = 0; i < pColumns.length; i++)
		{
			let tmpCol = pColumns[i];
			let tmpMeadowType = tmpCol.MeadowType || 'String';
			let tmpSize = tmpIntrospector._mapSizeToMeadow(tmpMeadowType, tmpCol.MaxLength, tmpCol.NativeType);

			// Map special meadow types for audit columns
			let tmpSchemaType = tmpMeadowType;
			let tmpColName = tmpCol.Name;

			if (tmpMeadowType === 'AutoIdentity')
			{
				tmpSchemaType = 'AutoIdentity';
			}
			else if (tmpColName === 'GUIDSource' || tmpColName.startsWith('GUID'))
			{
				tmpSchemaType = 'AutoGUID';
			}

			tmpSchema.push(
			{
				Column: tmpColName,
				Type: tmpSchemaType,
				Size: tmpSize
			});

			// Set default values
			switch (tmpMeadowType)
			{
				case 'AutoIdentity':
					tmpDefaultObject[tmpColName] = 0;
					break;
				case 'Numeric':
					tmpDefaultObject[tmpColName] = 0;
					break;
				case 'Boolean':
					tmpDefaultObject[tmpColName] = false;
					break;
				case 'DateTime':
					tmpDefaultObject[tmpColName] = null;
					break;
				default:
					tmpDefaultObject[tmpColName] = '';
					break;
			}
		}

		// Find the primary key column for DefaultIdentifier
		let tmpIDColumn = pColumns.find((pC) => pC.IsPrimaryKey);
		let tmpDefaultIdentifier = tmpIDColumn ? tmpIDColumn.Name : (pColumns.length > 0 ? pColumns[0].Name : 'ID');

		return {
			Scope: pTableName,
			DefaultIdentifier: tmpDefaultIdentifier,
			Domain: 'Default',
			Schema: tmpSchema,
			DefaultObject: tmpDefaultObject
		};
	}

	/**
	 * Get or create a Meadow instance for a specific connection.
	 * This ensures provider isolation between different external databases.
	 */
	_getMeadowForConnection(pIDBeaconConnection, pType)
	{
		let tmpKey = String(pIDBeaconConnection);

		if (this._ConnectionMeadows[tmpKey])
		{
			return this._ConnectionMeadows[tmpKey];
		}

		// Create a new Meadow instance that will use this connection's provider
		let tmpMeadow = libMeadow.new(this.fable);
		this._ConnectionMeadows[tmpKey] = tmpMeadow;

		return tmpMeadow;
	}

	/**
	 * Map a connection type to its Meadow provider name.
	 */
	_providerNameForType(pType)
	{
		switch (pType)
		{
			case 'MySQL': return 'MySQL';
			case 'PostgreSQL': return 'PostgreSQL';
			case 'MSSQL': return 'MSSQL';
			case 'SQLite': return 'SQLite';
			default: return pType;
		}
	}

	/**
	 * Enable CRUD endpoints for a specific introspected table.
	 */
	enableEndpoint(pIDBeaconConnection, pTableName, fCallback)
	{
		let tmpKey = `${pIDBeaconConnection}-${pTableName}`;

		if (this._EnabledEndpoints[tmpKey])
		{
			return fCallback(null, { Message: 'Endpoint already enabled', TableName: pTableName });
		}

		// Verify the connection is live
		let tmpConnectionBridge = this.fable.DataBeaconConnectionBridge;
		if (!tmpConnectionBridge || !tmpConnectionBridge.isConnected(pIDBeaconConnection))
		{
			return fCallback(new Error('Connection is not live. Connect first.'));
		}

		// Load the introspected table record
		let tmpQuery = this.fable.DAL.IntrospectedTable.query.clone()
			.addFilter('IDBeaconConnection', pIDBeaconConnection)
			.addFilter('TableName', pTableName)
			.addFilter('Deleted', 0);

		this.fable.DAL.IntrospectedTable.doReads(tmpQuery,
			(pError, pQuery, pRecords) =>
			{
				if (pError || !pRecords || pRecords.length === 0)
				{
					return fCallback(new Error(`Introspected table not found: ${pTableName}. Run introspect first.`));
				}

				let tmpRecord = pRecords[0];
				let tmpColumns = [];
				try
				{
					tmpColumns = JSON.parse(tmpRecord.ColumnDefinitions || '[]');
				}
				catch (e)
				{
					return fCallback(new Error('Failed to parse column definitions'));
				}

				if (tmpColumns.length === 0)
				{
					return fCallback(new Error('No columns found for table'));
				}

				// Load the connection record to get the type
				let tmpConnQuery = this.fable.DAL.BeaconConnection.query.clone()
					.addFilter('IDBeaconConnection', pIDBeaconConnection);

				this.fable.DAL.BeaconConnection.doRead(tmpConnQuery,
					(pConnError, pConnQuery, pConnectionRecord) =>
					{
						if (pConnError || !pConnectionRecord)
						{
							return fCallback(new Error('Connection record not found'));
						}

						try
						{
							let tmpType = pConnectionRecord.Type;
							let tmpProviderName = this._providerNameForType(tmpType);

							// Build the meadow schema from introspected columns
							let tmpMeadowSchema = this._buildMeadowSchema(pTableName, tmpColumns);

							// Use the connection's provider instance
							let tmpConnectionInstance = tmpConnectionBridge.getConnectionInstance(pIDBeaconConnection);
							let tmpProviderKey = `Meadow${tmpProviderName}Provider`;

							// Register the external provider on fable so Meadow DAL can find it.
							// Meadow looks for fable.Meadow{Type}Provider when setProvider is called.
							// We overwrite it here -- the internal SQLite provider remains available
							// as fable.MeadowSQLiteProvider for the internal DAL.
							this.fable[tmpProviderKey] = tmpConnectionInstance;

							// Get or create a Meadow for this connection
							let tmpMeadow = this._getMeadowForConnection(pIDBeaconConnection, tmpType);

							// Create DAL entity
							let tmpDAL = tmpMeadow.loadFromPackageObject(tmpMeadowSchema);
							tmpDAL.setProvider(tmpProviderName);

							// Create meadow-endpoints
							let tmpEndpoints = libMeadowEndpoints.new(tmpDAL);

							// Connect routes - this creates /1.0/{TableName} CRUD endpoints
							tmpEndpoints.connectRoutes(this.fable.OratorServiceServer);

							// Track the enabled endpoint
							this._EnabledEndpoints[tmpKey] =
							{
								dal: tmpDAL,
								endpoints: tmpEndpoints,
								connectionId: pIDBeaconConnection,
								tableName: pTableName,
								connectionType: tmpType
							};

							// Update the IntrospectedTable record
							tmpRecord.EndpointsEnabled = 1;
							let tmpUpdateQuery = this.fable.DAL.IntrospectedTable.query.clone()
								.addRecord(tmpRecord);

							this.fable.DAL.IntrospectedTable.doUpdate(tmpUpdateQuery,
								() =>
								{
									this.fable.log.info(`Dynamic endpoints enabled for ${pTableName} (connection #${pIDBeaconConnection})`);
									return fCallback(null,
									{
										TableName: pTableName,
										EndpointBase: `/1.0/${pTableName}`,
										ColumnCount: tmpColumns.length
									});
								});
						}
						catch (pEnableError)
						{
							this.fable.log.error(`Error enabling endpoint for ${pTableName}: ${pEnableError}`);
							return fCallback(pEnableError);
						}
					});
			});
	}

	/**
	 * Disable CRUD endpoints for a specific table.
	 * Note: Restify doesn't support route removal, so we mark it disabled
	 * and the routes will not be re-enabled on restart.
	 */
	disableEndpoint(pIDBeaconConnection, pTableName, fCallback)
	{
		let tmpKey = `${pIDBeaconConnection}-${pTableName}`;

		delete this._EnabledEndpoints[tmpKey];

		// Update the IntrospectedTable record
		let tmpQuery = this.fable.DAL.IntrospectedTable.query.clone()
			.addFilter('IDBeaconConnection', pIDBeaconConnection)
			.addFilter('TableName', pTableName)
			.addFilter('Deleted', 0);

		this.fable.DAL.IntrospectedTable.doReads(tmpQuery,
			(pError, pQuery, pRecords) =>
			{
				if (pRecords && pRecords.length > 0)
				{
					let tmpRecord = pRecords[0];
					tmpRecord.EndpointsEnabled = 0;

					let tmpUpdateQuery = this.fable.DAL.IntrospectedTable.query.clone()
						.addRecord(tmpRecord);

					this.fable.DAL.IntrospectedTable.doUpdate(tmpUpdateQuery,
						() =>
						{
							this.fable.log.info(`Dynamic endpoints disabled for ${pTableName}`);
							return fCallback(null, { TableName: pTableName, Disabled: true });
						});
				}
				else
				{
					return fCallback(null, { TableName: pTableName, Disabled: true });
				}
			});
	}

	/**
	 * List all enabled dynamic endpoints.
	 */
	listEndpoints()
	{
		let tmpEndpoints = [];
		let tmpKeys = Object.keys(this._EnabledEndpoints);

		for (let i = 0; i < tmpKeys.length; i++)
		{
			let tmpEntry = this._EnabledEndpoints[tmpKeys[i]];
			tmpEndpoints.push(
			{
				ConnectionID: tmpEntry.connectionId,
				TableName: tmpEntry.tableName,
				ConnectionType: tmpEntry.connectionType,
				EndpointBase: `/1.0/${tmpEntry.tableName}`
			});
		}

		return tmpEndpoints;
	}

	/**
	 * Re-enable dynamic endpoints from persisted IntrospectedTable records
	 * on service startup (warm-up).
	 */
	warmUpEndpoints(fCallback)
	{
		if (!this.fable.DAL || !this.fable.DAL.IntrospectedTable)
		{
			return fCallback();
		}

		let tmpQuery = this.fable.DAL.IntrospectedTable.query.clone()
			.addFilter('EndpointsEnabled', 1)
			.addFilter('Deleted', 0);

		this.fable.DAL.IntrospectedTable.doReads(tmpQuery,
			(pError, pQuery, pRecords) =>
			{
				if (pError || !pRecords || pRecords.length === 0)
				{
					return fCallback();
				}

				this.fable.log.info(`DataBeacon: Warming up ${pRecords.length} dynamic endpoint(s)...`);

				let tmpAnticipate = this.fable.newAnticipate();

				for (let i = 0; i < pRecords.length; i++)
				{
					let tmpRecord = pRecords[i];
					tmpAnticipate.anticipate(
						(fStepCallback) =>
						{
							// Only re-enable if the connection is live
							let tmpConnectionBridge = this.fable.DataBeaconConnectionBridge;
							if (tmpConnectionBridge && tmpConnectionBridge.isConnected(tmpRecord.IDBeaconConnection))
							{
								this.enableEndpoint(tmpRecord.IDBeaconConnection, tmpRecord.TableName,
									(pEnableError) =>
									{
										if (pEnableError)
										{
											this.fable.log.warn(`Warm-up failed for ${tmpRecord.TableName}: ${pEnableError}`);
										}
										return fStepCallback();
									});
							}
							else
							{
								this.fable.log.info(`Skipping warm-up for ${tmpRecord.TableName} — connection not live`);
								return fStepCallback();
							}
						});
				}

				tmpAnticipate.wait(fCallback);
			});
	}

	// ================================================================
	// REST Routes
	// ================================================================

	connectRoutes(pOratorServiceServer)
	{
		let tmpRoutePrefix = this.options.RoutePrefix;

		// POST /beacon/endpoint/:connectionId/:tableName/enable
		pOratorServiceServer.doPost(`${tmpRoutePrefix}/endpoint/:connectionId/:tableName/enable`,
			(pRequest, pResponse, fNext) =>
			{
				let tmpConnectionId = parseInt(pRequest.params.connectionId, 10);
				let tmpTableName = pRequest.params.tableName;

				this.enableEndpoint(tmpConnectionId, tmpTableName,
					(pError, pResult) =>
					{
						if (pError)
						{
							pResponse.send({ Success: false, Error: pError.message || pError });
							return fNext();
						}
						pResponse.send({ Success: true, Endpoint: pResult });
						return fNext();
					});
			});

		// POST /beacon/endpoint/:connectionId/:tableName/disable
		pOratorServiceServer.doPost(`${tmpRoutePrefix}/endpoint/:connectionId/:tableName/disable`,
			(pRequest, pResponse, fNext) =>
			{
				let tmpConnectionId = parseInt(pRequest.params.connectionId, 10);
				let tmpTableName = pRequest.params.tableName;

				this.disableEndpoint(tmpConnectionId, tmpTableName,
					(pError, pResult) =>
					{
						if (pError)
						{
							pResponse.send({ Success: false, Error: pError.message || pError });
							return fNext();
						}
						pResponse.send({ Success: true, Result: pResult });
						return fNext();
					});
			});

		// GET /beacon/endpoints -- list all enabled dynamic endpoints
		pOratorServiceServer.doGet(`${tmpRoutePrefix}/endpoints`,
			(pRequest, pResponse, fNext) =>
			{
				let tmpEndpoints = this.listEndpoints();
				pResponse.send({ Count: tmpEndpoints.length, Endpoints: tmpEndpoints });
				return fNext();
			});

		this.fable.log.info(`DataBeacon DynamicEndpointManager routes connected at ${tmpRoutePrefix}/endpoint*`);
	}
}

module.exports = DataBeaconDynamicEndpointManager;
module.exports.serviceType = 'DataBeaconDynamicEndpointManager';
module.exports.default_configuration = defaultDynamicEndpointManagerOptions;

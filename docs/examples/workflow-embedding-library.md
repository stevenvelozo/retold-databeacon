# Workflow: Embedding as a Library

Install retold-databeacon as a dependency and extend it with custom endpoints, services, or middleware in your own application.

## Prerequisites

- Node.js 18 or later
- npm

## Setup

```bash
mkdir my-data-app && cd my-data-app
npm init -y
npm install --save retold-databeacon pict meadow-connection-manager meadow-connection-sqlite
```

## Basic Embedding

Create `server.js`:

```javascript
const libPict = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('retold-databeacon');

const libPath = require('path');
const libFs = require('fs');

// Ensure data directory exists
let tmpDataDir = libPath.join(process.cwd(), 'data');
if (!libFs.existsSync(tmpDataDir))
{
	libFs.mkdirSync(tmpDataDir, { recursive: true });
}

let tmpDBPath = libPath.join(tmpDataDir, 'app.sqlite');

let _Fable = new libPict(
	{
		Product: 'MyDataApp',
		ProductVersion: '1.0.0',
		APIServerPort: 8400,
		LogStreams: [{ streamtype: 'console' }],
		SQLite: { SQLiteFilePath: tmpDBPath }
	});

// Set up connection manager
_Fable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
_Fable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

// Connect internal SQLite
_Fable.MeadowConnectionManager.connect('internal',
	{ Type: 'SQLite', SQLiteFilePath: tmpDBPath },
	function (pError, pConnection)
	{
		if (pError)
		{
			console.error('SQLite error:', pError);
			process.exit(1);
		}

		_Fable.MeadowSQLiteProvider = pConnection.instance;
		_Fable.settings.MeadowProvider = 'SQLite';

		// Create and initialize DataBeacon
		_Fable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
		let tmpBeacon = _Fable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
			{
				AutoCreateSchema: true,

				FullMeadowSchemaPath: libPath.join(
					libPath.dirname(require.resolve('retold-databeacon/package.json')),
					'model') + '/',
				FullMeadowSchemaFilename: 'MeadowModel-DataBeacon.json',

				Endpoints:
					{
						MeadowEndpoints: true,
						ConnectionBridge: true,
						SchemaIntrospector: true,
						DynamicEndpointManager: true,
						BeaconProvider: true,
						WebUI: true
					}
			});

		tmpBeacon.initializeService(
			function (pInitError)
			{
				if (pInitError)
				{
					console.error('Init error:', pInitError);
					process.exit(1);
				}

				// DataBeacon is running -- now add custom routes
				addCustomRoutes(_Fable);

				console.log('MyDataApp running on port 8400');
				console.log('DataBeacon UI: http://localhost:8400/');
			});
	});
```

## Adding Custom Endpoints

Extend DataBeacon with application-specific routes:

```javascript
function addCustomRoutes(pFable)
{
	let tmpServer = pFable.OratorServiceServer;

	// Custom health endpoint with database status
	tmpServer.doGet('/api/health',
		function (pRequest, pResponse, fNext)
		{
			let tmpConnBridge = pFable.DataBeaconConnectionBridge;
			let tmpConnections = [];

			if (pFable.DAL && pFable.DAL.BeaconConnection)
			{
				let tmpQuery = pFable.DAL.BeaconConnection.query.clone()
					.addFilter('Deleted', 0);

				pFable.DAL.BeaconConnection.doReads(tmpQuery,
					function (pError, pQuery, pRecords)
					{
						let tmpStatus = [];
						for (let i = 0; i < (pRecords || []).length; i++)
						{
							tmpStatus.push(
							{
								Name: pRecords[i].Name,
								Type: pRecords[i].Type,
								Connected: tmpConnBridge.isConnected(pRecords[i].IDBeaconConnection)
							});
						}

						pResponse.send(
						{
							Status: 'OK',
							Uptime: process.uptime(),
							Connections: tmpStatus,
							Endpoints: pFable.DataBeaconDynamicEndpointManager.listEndpoints()
						});
						return fNext();
					});
			}
			else
			{
				pResponse.send({ Status: 'OK', Uptime: process.uptime() });
				return fNext();
			}
		});

	// Custom aggregate endpoint
	tmpServer.doGet('/api/aggregate/:connectionId/:tableName/count',
		function (pRequest, pResponse, fNext)
		{
			let tmpConnID = parseInt(pRequest.params.connectionId, 10);
			let tmpTable = pRequest.params.tableName;

			pFable.DataBeaconSchemaIntrospector.executeQuery(tmpConnID,
				'SELECT COUNT(*) AS total FROM ' + tmpTable,
				function (pError, pResults)
				{
					if (pError)
					{
						pResponse.send({ Error: pError.message });
						return fNext();
					}
					pResponse.send({ Table: tmpTable, Count: pResults[0].total });
					return fNext();
				});
		});

	// Custom batch introspection endpoint
	tmpServer.doPost('/api/introspect-all',
		function (pRequest, pResponse, fNext)
		{
			if (!pFable.DAL || !pFable.DAL.BeaconConnection)
			{
				pResponse.send({ Error: 'Not initialized' });
				return fNext();
			}

			let tmpQuery = pFable.DAL.BeaconConnection.query.clone()
				.addFilter('Deleted', 0);

			pFable.DAL.BeaconConnection.doReads(tmpQuery,
				function (pError, pQuery, pRecords)
				{
					let tmpAnticipate = pFable.newAnticipate();
					let tmpResults = [];

					for (let i = 0; i < (pRecords || []).length; i++)
					{
						let tmpRecord = pRecords[i];
						if (pFable.DataBeaconConnectionBridge.isConnected(tmpRecord.IDBeaconConnection))
						{
							tmpAnticipate.anticipate(
								function (fStep)
								{
									pFable.DataBeaconSchemaIntrospector.introspect(
										tmpRecord.IDBeaconConnection,
										function (pErr, pTables)
										{
											tmpResults.push(
											{
												Connection: tmpRecord.Name,
												TableCount: pTables ? pTables.length : 0
											});
											return fStep();
										});
								});
						}
					}

					tmpAnticipate.wait(
						function ()
						{
							pResponse.send({ Results: tmpResults });
							return fNext();
						});
				});
		});

	pFable.log.info('Custom API routes registered at /api/*');
}
```

## Adding a Custom Beacon Capability

Register additional capabilities that Ultravisor can dispatch work to:

```javascript
function addCustomBeaconCapability(pFable)
{
	let tmpBeaconProvider = pFable.DataBeaconBeaconProvider;

	// Only if beacon is connected
	if (!tmpBeaconProvider.isBeaconConnected())
	{
		pFable.log.warn('Beacon not connected -- skipping custom capability registration');
		return;
	}

	// Access the internal beacon service to register additional capabilities
	tmpBeaconProvider._BeaconService.registerCapability(
		{
			Capability: 'MyAppData',
			Name: 'MyAppDataProvider',
			actions:
			{
				'GetRowCount':
				{
					Description: 'Get the row count for a table on a connected database',
					SettingsSchema:
					[
						{ Name: 'IDBeaconConnection', DataType: 'Number', Required: true },
						{ Name: 'TableName', DataType: 'String', Required: true }
					],
					Handler: function (pWorkItem, pContext, fCallback)
					{
						let tmpSettings = pWorkItem.Settings || {};
						let tmpSQL = 'SELECT COUNT(*) AS total FROM ' + tmpSettings.TableName;

						pFable.DataBeaconSchemaIntrospector.executeQuery(
							tmpSettings.IDBeaconConnection,
							tmpSQL,
							function (pError, pResults)
							{
								if (pError) return fCallback(pError);
								return fCallback(null,
								{
									Table: tmpSettings.TableName,
									Count: pResults[0].total
								});
							});
					}
				}
			}
		});

	pFable.log.info('Custom beacon capability "MyAppData" registered');
}
```

## Adding a Custom Dialect Introspector

Extend schema introspection to support additional database types:

```javascript
function addMongoDBIntrospector(pFable)
{
	let tmpIntrospector = pFable.DataBeaconSchemaIntrospector;

	// Save the original _getIntrospector method
	let tmpOriginalGetIntrospector = tmpIntrospector._getIntrospector.bind(tmpIntrospector);

	// Override with extended version
	tmpIntrospector._getIntrospector = function (pType)
	{
		if (pType === 'MongoDB')
		{
			return {
				listTables: function (pProvider, fCallback)
				{
					let tmpDB = pProvider.db || pProvider;
					tmpDB.listCollections().toArray(
						function (pError, pCollections)
						{
							if (pError) return fCallback(pError);
							let tmpTables = pCollections.map(function (pC)
							{
								return { TableName: pC.name, RowCountEstimate: 0 };
							});
							return fCallback(null, tmpTables);
						});
				},
				describeTable: function (pProvider, pTableName, fCallback)
				{
					let tmpDB = pProvider.db || pProvider;
					tmpDB.collection(pTableName).findOne({},
						function (pError, pSample)
						{
							if (pError) return fCallback(pError);
							if (!pSample)
							{
								return fCallback(null, []);
							}

							let tmpColumns = Object.keys(pSample).map(function (pKey)
							{
								return {
									Name: pKey,
									NativeType: typeof pSample[pKey],
									MaxLength: null,
									Nullable: true,
									IsPrimaryKey: pKey === '_id',
									IsAutoIncrement: false,
									DefaultValue: null,
									MeadowType: 'String'
								};
							});
							return fCallback(null, tmpColumns);
						});
				}
			};
		}

		return tmpOriginalGetIntrospector(pType);
	};

	pFable.log.info('MongoDB introspector extension registered');
}
```

## Disabling Specific Endpoint Groups

Embed DataBeacon as a headless data access layer without the web UI:

```javascript
let tmpBeacon = _Fable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
	{
		AutoCreateSchema: true,
		AutoStartOrator: false,  // Don't start HTTP server

		Endpoints:
			{
				MeadowEndpoints: true,
				ConnectionBridge: true,
				SchemaIntrospector: true,
				DynamicEndpointManager: true,
				BeaconProvider: false,   // No Ultravisor integration
				WebUI: false             // No web interface
			}
	});
```

---

## Stand-Alone Mode (No Ultravisor)

When embedding, omit the `BeaconProvider` endpoint group and don't call `connectBeacon`. All connection, introspection, and dynamic endpoint features work independently.

---

## With Ultravisor Integration

After initialization, connect to Ultravisor programmatically:

```javascript
tmpBeacon.initializeService(
	function (pInitError)
	{
		// Connect to Ultravisor after service is ready
		pFable.DataBeaconBeaconProvider.connectBeacon(
			{
				ServerURL: 'http://localhost:54321',
				Name: 'embedded-databeacon',
				MaxConcurrent: 5
			},
			function (pError)
			{
				if (pError)
				{
					pFable.log.warn('Beacon connection failed:', pError);
				}
				else
				{
					pFable.log.info('Beacon connected to Ultravisor');
					// Optionally register custom capabilities here
					addCustomBeaconCapability(pFable);
				}
			});
	});
```

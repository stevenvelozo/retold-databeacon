# RetoldDataBeacon

The main service class for the DataBeacon application. Extends `fable-serviceproviderbase`. Orchestrates initialization of the web server, internal DAL, sub-services, and static file serving.

**Module:** `source/Retold-DataBeacon.js`

## Default Options

```javascript
{
	AutoStartOrator: true,          // Start the Restify web server during initializeService
	AutoCreateSchema: false,        // Run CREATE TABLE IF NOT EXISTS on the embedded SQLite DB

	FullMeadowSchemaPath: `${process.cwd()}/model/`,   // Directory containing the Meadow model JSON
	FullMeadowSchemaFilename: 'MeadowModel-DataBeacon.json',  // Model filename

	WebAppPath: false,              // Absolute path to a web app folder for static serving; false to skip

	Endpoints:
	{
		MeadowEndpoints: true,       // Internal DAL CRUD routes (BeaconConnection, IntrospectedTable, User)
		ConnectionBridge: true,      // /beacon/connection* routes
		SchemaIntrospector: true,    // /beacon/connection/:id/introspect, tables, query routes
		DynamicEndpointManager: true, // /beacon/endpoint* routes
		BeaconProvider: true,        // /beacon/ultravisor* routes
		WebUI: true                  // Static file serving for the built-in web UI
	},

	DataBeacon:
	{
		RoutePrefix: '/beacon'       // Base path prefix for all beacon-specific routes
	}
}
```

## Constructor

```javascript
new RetoldDataBeacon(pFable, pOptions, pServiceHash)
```

**Parameters:**

- `pFable` -- Fable instance to register with
- `pOptions` -- Configuration object (merged with defaults above)
- `pServiceHash` -- Optional service hash for the Fable service manager

**Behavior:**

1. Merges `pOptions` with `defaultDataBeaconSettings`
2. Adds and instantiates `OratorServiceServer` (Restify) and `Orator` service types on Fable
3. Creates an internal `Meadow` instance for the embedded SQLite DAL
4. Registers all four sub-services on Fable:
	- `DataBeaconConnectionBridge`
	- `DataBeaconSchemaIntrospector`
	- `DataBeaconDynamicEndpointManager`
	- `DataBeaconBeaconProvider`
5. Exposes `fable.DAL` and `fable.MeadowEndpoints` for convenience access

## initializeService(fCallback)

Full initialization pipeline. Must be called once after construction. Returns an error to the callback if already initialized.

```javascript
tmpDataBeacon.initializeService(
	(pError) =>
	{
		if (pError) throw pError;
		// DataBeacon is ready
	});
```

**Pipeline steps (in order):**

1. Start the Orator web server (if `AutoStartOrator` is true)
2. Enable JSON body parsing and query string parsing on Restify
3. Create the embedded SQLite schema (if `AutoCreateSchema` is true)
4. Load the internal Meadow model from disk (if `MeadowEndpoints` group is enabled)
5. Wire REST routes for each enabled sub-service
6. Serve the static web UI (if `WebUI` group is enabled)
7. Auto-connect saved database connections (if `ConnectionBridge` group is enabled)
8. Warm up persisted dynamic endpoints (if `DynamicEndpointManager` group is enabled)

## stopService(fCallback)

Graceful shutdown. Stops the Orator web server and resets `serviceInitialized` to false. Returns an error if the service was not initialized.

```javascript
tmpDataBeacon.stopService(
	(pError) =>
	{
		if (pError) console.error(pError);
		// Server stopped
	});
```

## createSchema(fCallback)

Runs the embedded `DATABEACON_SCHEMA_SQL` against the SQLite provider. Creates `User`, `BeaconConnection`, and `IntrospectedTable` tables using `CREATE TABLE IF NOT EXISTS`, and inserts a default system user.

```javascript
tmpDataBeacon.createSchema(
	(pError) =>
	{
		if (pError) console.error('Schema creation failed:', pError);
	});
```

If no SQLite provider is available on Fable, the method logs a warning and calls back without error.

## loadModel(pModelName, pModelObject, fCallback)

Loads a parsed Meadow model object, creating DAL objects and Meadow Endpoints for each entity defined in it.

```javascript
let tmpModel = require('./model/MeadowModel-DataBeacon.json');
tmpDataBeacon.loadModel('MeadowModel-DataBeacon', tmpModel,
	(pError) =>
	{
		// DAL objects available at fable.DAL.BeaconConnection, etc.
	});
```

**Parameters:**

- `pModelName` -- Display name for logging
- `pModelObject` -- Parsed model with a `Tables` property containing entity definitions
- `fCallback` -- Called with `(pError)`

For each entity in `pModelObject.Tables`, the method:

1. Calls `meadow.loadFromPackageObject()` to create a DAL entity
2. Sets the provider to `'SQLite'`
3. Creates `meadow-endpoints` and connects routes (if not already connected)

## loadModelFromFile(pModelName, pModelPath, pModelFilename, fCallback)

Convenience wrapper that loads a JSON model file from disk, then delegates to `loadModel`.

```javascript
tmpDataBeacon.loadModelFromFile(
	'MeadowModel-DataBeacon',
	'/app/model/',
	'MeadowModel-DataBeacon.json',
	(pError) =>
	{
		if (pError) console.error('Failed to load model:', pError);
	});
```

**Parameters:**

- `pModelName` -- Display name for logging
- `pModelPath` -- Directory path (must include trailing slash)
- `pModelFilename` -- JSON filename
- `fCallback` -- Called with `(pError)`

## isEndpointGroupEnabled(pGroupName)

Checks whether a named endpoint group is enabled in the `Endpoints` configuration.

```javascript
if (tmpDataBeacon.isEndpointGroupEnabled('ConnectionBridge'))
{
	// Connection routes are active
}
```

**Parameters:**

- `pGroupName` -- One of: `MeadowEndpoints`, `ConnectionBridge`, `SchemaIntrospector`, `DynamicEndpointManager`, `BeaconProvider`, `WebUI`

**Returns:** `true` if the group exists and is truthy; `false` otherwise.

## DATABEACON_SCHEMA_SQL (Exported Constant)

The embedded SQL used by `createSchema()`. Available as a named export on the module:

```javascript
const { DATABEACON_SCHEMA_SQL } = require('retold-databeacon');
```

Creates three tables:

- **User** -- IDUser (auto-increment PK), GUIDUser, audit columns, LoginID, Name
- **BeaconConnection** -- IDBeaconConnection (auto-increment PK), GUIDBeaconConnection, audit columns, Name, Type, Config (JSON string), Status, LastTestedDate, AutoConnect, Description
- **IntrospectedTable** -- IDIntrospectedTable (auto-increment PK), GUIDIntrospectedTable, audit columns, IDBeaconConnection (FK), DatabaseName, TableName, ColumnDefinitions (JSON string), LastIntrospectedDate, EndpointsEnabled, RowCountEstimate

Also inserts a default system user with `IDUser=1`.

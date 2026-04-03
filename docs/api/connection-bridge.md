# DataBeaconConnectionBridge

Manages external database connections for the DataBeacon. Combines persistence (CRUD against the `BeaconConnection` DAL entity in the internal SQLite database) with runtime connection management (delegates to `fable.MeadowConnectionManager` for actual connect/disconnect/test operations).

**Module:** `source/services/DataBeacon-ConnectionBridge.js`
**Service Type:** `DataBeaconConnectionBridge`

## Constructor

```javascript
new DataBeaconConnectionBridge(pFable, pOptions, pServiceHash)
```

Registered automatically by `RetoldDataBeacon`. Options default to:

```javascript
{
	RoutePrefix: '/beacon'
}
```

Initializes the `_LiveConnections` runtime tracker (not persisted -- rebuilt on startup).

## connectRoutes(pOratorServiceServer)

Wires all REST routes for connection management onto the provided Orator service server.

```javascript
tmpConnectionBridge.connectRoutes(fable.OratorServiceServer);
```

See the [REST route table](#rest-routes) below for the full list of routes this method registers.

## autoConnectSavedConnections(fCallback)

Reconnects all connections that have `AutoConnect=1` and `Deleted=0` on startup.

```javascript
fable.DataBeaconConnectionBridge.autoConnectSavedConnections(
	(pError) =>
	{
		if (pError) console.warn('Auto-connect warning:', pError);
	});
```

Queries the `BeaconConnection` DAL for matching records and calls `_connectRuntime` for each. Failures are logged as warnings but do not halt the callback chain.

## isConnected(pIDBeaconConnection)

Checks whether a connection is live in `MeadowConnectionManager`.

```javascript
let tmpLive = fable.DataBeaconConnectionBridge.isConnected(3);
// true or false
```

**Parameters:**

- `pIDBeaconConnection` -- Integer ID of the BeaconConnection record

**Returns:** `true` if the connection exists in MeadowConnectionManager with status `'connected'`; `false` otherwise.

## getConnectionInstance(pIDBeaconConnection)

Returns the live provider instance (e.g., a MySQL pool, PostgreSQL pool, SQLite database handle) for an external database connection.

```javascript
let tmpPool = fable.DataBeaconConnectionBridge.getConnectionInstance(3);
```

**Returns:** The provider instance object, or `null` if not connected.

## getConnection(pIDBeaconConnection)

Returns the full connection metadata object from `MeadowConnectionManager`.

```javascript
let tmpConn = fable.DataBeaconConnectionBridge.getConnection(3);
// { status: 'connected', instance: ..., ... }
```

**Returns:** The connection metadata object, or `undefined` if not found.

## _maskConfig(pConfigJSON)

Masks password fields in a Config JSON string before sending to clients.

```javascript
let tmpSafe = tmpBridge._maskConfig('{"host":"db.example.com","password":"secret123"}');
// '{"host":"db.example.com","password":"***"}'
```

Replaces the values of `password`, `Password`, and `pass` keys with `'***'`. Returns `'{}'` if the input is falsy or cannot be parsed.

## _mergeConfig(pNewConfig, pStoredConfigJSON)

Preserves the actual password when the client sends `'***'` back on an update.

```javascript
let tmpMerged = tmpBridge._mergeConfig(
	{ host: 'db.example.com', password: '***' },
	'{"host":"old.example.com","password":"secret123"}'
);
// '{"host":"db.example.com","password":"secret123"}'
```

**Parameters:**

- `pNewConfig` -- Incoming config object from the client
- `pStoredConfigJSON` -- Stored config JSON string from the database

**Returns:** JSON string with passwords preserved where the client sent `'***'`.

## _connectionName(pIDBeaconConnection)

Returns the unique connection name used in `MeadowConnectionManager`. The naming convention is `beacon-ext-{id}`.

```javascript
tmpBridge._connectionName(5);
// 'beacon-ext-5'
```

## _connectRuntime(pRecord, fCallback)

Establishes a live runtime connection via `MeadowConnectionManager`. If a connection with the same name already exists, it is disconnected first.

```javascript
tmpBridge._connectRuntime(pBeaconConnectionRecord,
	(pError, pConnection) =>
	{
		if (pError) console.error('Connect failed:', pError);
	});
```

**Parameters:**

- `pRecord` -- A BeaconConnection DAL record with `IDBeaconConnection`, `Config` (JSON string), and `Type`
- `fCallback` -- Called with `(pError, pConnection)`

## REST Routes

All routes are prefixed with the configured `RoutePrefix` (default: `/beacon`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/beacon/connections` | List all non-deleted connections |
| POST | `/beacon/connection` | Create a new connection |
| GET | `/beacon/connection/:id` | Read a single connection by ID |
| PUT | `/beacon/connection/:id` | Update a connection by ID |
| DELETE | `/beacon/connection/:id` | Soft-delete a connection (disconnects if live) |
| POST | `/beacon/connection/:id/test` | Test a saved connection |
| POST | `/beacon/connection/test` | Test an ad-hoc connection config |
| POST | `/beacon/connection/:id/connect` | Establish a live runtime connection |
| POST | `/beacon/connection/:id/disconnect` | Tear down a live connection |
| GET | `/beacon/connection/available-types` | List installed connector types |

### GET /beacon/connections

Returns all non-deleted connections with passwords masked and live status.

**Response:**

```json
{
	"Count": 2,
	"Connections": [
		{
			"IDBeaconConnection": 1,
			"Name": "Production MySQL",
			"Type": "MySQL",
			"Config": "{\"host\":\"db.example.com\",\"password\":\"***\"}",
			"Status": "Connected",
			"AutoConnect": 1,
			"Connected": true,
			"Description": "Main production database"
		}
	]
}
```

### POST /beacon/connection

Creates a new connection record.

**Request Body:**

```json
{
	"Name": "My Database",
	"Type": "MySQL",
	"Config": {
		"host": "db.example.com",
		"port": 3306,
		"user": "admin",
		"password": "secret",
		"database": "mydb"
	},
	"AutoConnect": true,
	"Description": "Development database"
}
```

**Response:**

```json
{
	"Success": true,
	"Connection": {
		"IDBeaconConnection": 3,
		"Name": "My Database",
		"Type": "MySQL",
		"Config": "{\"host\":\"db.example.com\",\"port\":3306,\"user\":\"admin\",\"password\":\"***\",\"database\":\"mydb\"}",
		"Status": "Untested",
		"Connected": false
	}
}
```

### GET /beacon/connection/:id

Returns a single connection record by ID.

**Response:**

```json
{
	"Connection": {
		"IDBeaconConnection": 1,
		"Name": "Production MySQL",
		"Type": "MySQL",
		"Config": "{\"host\":\"db.example.com\",\"password\":\"***\"}",
		"Status": "Connected",
		"Connected": true
	}
}
```

### PUT /beacon/connection/:id

Updates a connection record. Only provided fields are updated. Passwords sent as `'***'` are preserved from the stored record.

**Request Body:**

```json
{
	"Name": "Renamed Database",
	"Config": {
		"host": "new-host.example.com",
		"password": "***"
	}
}
```

**Response:**

```json
{
	"Success": true,
	"Connection": {
		"IDBeaconConnection": 1,
		"Name": "Renamed Database",
		"Config": "{\"host\":\"new-host.example.com\",\"password\":\"***\"}",
		"Connected": true
	}
}
```

### DELETE /beacon/connection/:id

Soft-deletes a connection. If the connection is live, it is disconnected first.

**Response:**

```json
{
	"Success": true
}
```

### POST /beacon/connection/:id/test

Tests a saved connection by reading the stored config and delegating to `MeadowConnectionManager.testConnection`. Updates the `Status` and `LastTestedDate` fields.

**Response (success):**

```json
{
	"Success": true,
	"Status": "OK"
}
```

**Response (failure):**

```json
{
	"Success": false,
	"Error": "ECONNREFUSED",
	"Status": "Failed"
}
```

### POST /beacon/connection/test

Tests an ad-hoc connection config without saving it.

**Request Body:**

```json
{
	"Type": "PostgreSQL",
	"Config": {
		"host": "pg.example.com",
		"port": 5432,
		"user": "admin",
		"password": "secret",
		"database": "testdb"
	}
}
```

**Response:**

```json
{
	"Success": true
}
```

### POST /beacon/connection/:id/connect

Establishes a live runtime connection. Updates the connection's `Status` to `'Connected'` or `'Failed'`.

**Response:**

```json
{
	"Success": true,
	"Status": "Connected"
}
```

### POST /beacon/connection/:id/disconnect

Tears down a live runtime connection.

**Response:**

```json
{
	"Success": true,
	"Status": "Disconnected"
}
```

### GET /beacon/connection/available-types

Lists all installed database connector types.

**Response:**

```json
{
	"Types": [
		{ "Type": "MySQL", "Installed": true },
		{ "Type": "PostgreSQL", "Installed": true },
		{ "Type": "MSSQL", "Installed": false },
		{ "Type": "SQLite", "Installed": true }
	]
}
```

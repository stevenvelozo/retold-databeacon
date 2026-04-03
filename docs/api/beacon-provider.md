# DataBeaconBeaconProvider

Registers the DataBeacon as a beacon in the Ultravisor mesh, exposing data access and management capabilities so other nodes can interact with the connected databases remotely. The `ultravisor-beacon` module is loaded optionally -- if it is not installed, the beacon functionality is unavailable but the rest of DataBeacon still works.

**Module:** `source/services/DataBeacon-BeaconProvider.js`
**Service Type:** `DataBeaconBeaconProvider`

## connectRoutes(pOratorServiceServer)

Wires the beacon management REST routes onto the provided Orator service server.

```javascript
fable.DataBeaconBeaconProvider.connectRoutes(fable.OratorServiceServer);
```

See the [REST route table](#rest-routes) below.

## connectBeacon(pBeaconConfig, fCallback)

Connects to an Ultravisor coordinator as a beacon. Registers two capabilities (`DataBeaconAccess` and `DataBeaconManagement`) and enables the beacon service.

```javascript
fable.DataBeaconBeaconProvider.connectBeacon(
	{
		ServerURL: 'ws://ultravisor.example.com:8086',
		Name: 'my-data-beacon',
		Password: 'beacon-auth-password',
		MaxConcurrent: 5,
		Tags: { environment: 'production' }
	},
	(pError) =>
	{
		if (pError) return console.error(pError);
		console.log('Beacon connected');
	});
```

**pBeaconConfig object:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ServerURL` | string | Yes | -- | Ultravisor coordinator WebSocket URL |
| `Name` | string | No | `'retold-databeacon'` | Beacon display name |
| `Password` | string | No | `''` | Authentication password |
| `MaxConcurrent` | number | No | `3` | Maximum concurrent work items |
| `StagingPath` | string | No | `process.cwd()` | Local staging directory |
| `Tags` | object | No | `{}` | Beacon metadata tags |
| `BindAddresses` | array | No | `[]` | Network bind addresses |

Returns an error if `ultravisor-beacon` is not installed or if `ServerURL` is missing. If the beacon is already connected, logs a warning and calls back without error.

## disconnectBeacon(fCallback)

Disconnects from the Ultravisor coordinator by disabling the beacon service.

```javascript
fable.DataBeaconBeaconProvider.disconnectBeacon(
	(pError) =>
	{
		if (pError) console.error(pError);
	});
```

If no beacon service is active, calls back immediately.

## isBeaconConnected()

Checks whether the beacon is currently connected and enabled.

```javascript
let tmpConnected = fable.DataBeaconBeaconProvider.isBeaconConnected();
// true or false
```

## Capabilities

Two capabilities are registered when `connectBeacon()` is called.

### DataBeaconAccess

Read-only operations against the beacon's connected databases. Four actions are available:

#### ListConnections

Lists all configured (non-deleted) database connections. Config fields are cleared for security.

**SettingsSchema:** (none)

**Response:**

```json
{
	"Connections": [
		{
			"IDBeaconConnection": 1,
			"Name": "Production MySQL",
			"Type": "MySQL",
			"Config": "{}",
			"Status": "Connected"
		}
	]
}
```

#### ListTables

Lists introspected tables for a specific connection.

**SettingsSchema:**

| Name | DataType | Required |
|------|----------|----------|
| `IDBeaconConnection` | Number | Yes |

**Response:**

```json
{
	"Tables": [
		{
			"TableName": "Orders",
			"EndpointsEnabled": true,
			"RowCountEstimate": 15000
		}
	]
}
```

#### ReadRecords

Reads records from an enabled dynamic endpoint table with pagination support.

**SettingsSchema:**

| Name | DataType | Required | Description |
|------|----------|----------|-------------|
| `IDBeaconConnection` | Number | Yes | Connection ID |
| `TableName` | String | Yes | Table name (must have endpoints enabled) |
| `Cap` | Number | No | Page size (default: 100) |
| `Begin` | Number | No | Start index for pagination |

**Response:**

```json
{
	"Records": [
		{ "IDOrder": 1, "CustomerName": "Acme Corp" }
	],
	"Count": 10
}
```

Returns an error if the endpoint is not enabled for the specified table.

#### QueryTable

Executes a read-only SQL query against a connected database. Delegates to `DataBeaconSchemaIntrospector.executeQuery()` -- only `SELECT` statements are permitted.

**SettingsSchema:**

| Name | DataType | Required |
|------|----------|----------|
| `IDBeaconConnection` | Number | Yes |
| `SQL` | String | Yes |

**Response:**

```json
{
	"Rows": [
		{ "IDOrder": 1, "CustomerName": "Acme Corp" }
	],
	"RowCount": 1
}
```

### DataBeaconManagement

Write and administrative operations.

#### Introspect

Introspects all tables for a connected database. Delegates to `DataBeaconSchemaIntrospector.introspect()`.

**SettingsSchema:**

| Name | DataType | Required |
|------|----------|----------|
| `IDBeaconConnection` | Number | Yes |

**Response:**

```json
{
	"TableCount": 12,
	"Tables": [
		{ "TableName": "Orders", "ColumnCount": 8 }
	]
}
```

#### EnableEndpoint

Enables CRUD REST endpoints for an introspected table. Delegates to `DataBeaconDynamicEndpointManager.enableEndpoint()`.

**SettingsSchema:**

| Name | DataType | Required |
|------|----------|----------|
| `IDBeaconConnection` | Number | Yes |
| `TableName` | String | Yes |

#### DisableEndpoint

Disables CRUD REST endpoints for an introspected table. Delegates to `DataBeaconDynamicEndpointManager.disableEndpoint()`.

**SettingsSchema:**

| Name | DataType | Required |
|------|----------|----------|
| `IDBeaconConnection` | Number | Yes |
| `TableName` | String | Yes |

## REST Routes

All routes are prefixed with the configured `RoutePrefix` (default: `/beacon`).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/beacon/ultravisor/connect` | Connect to an Ultravisor coordinator |
| POST | `/beacon/ultravisor/disconnect` | Disconnect from Ultravisor |
| GET | `/beacon/ultravisor/status` | Get beacon connection status |

### POST /beacon/ultravisor/connect

Connects the beacon to an Ultravisor coordinator.

**Request Body:**

```json
{
	"ServerURL": "ws://ultravisor.example.com:8086",
	"Name": "my-data-beacon",
	"Password": "beacon-auth-password",
	"MaxConcurrent": 5,
	"Tags": { "environment": "production" }
}
```

**Response:**

```json
{
	"Success": true,
	"Status": "Connected"
}
```

### POST /beacon/ultravisor/disconnect

Disconnects the beacon from the Ultravisor coordinator.

**Response:**

```json
{
	"Success": true,
	"Status": "Disconnected"
}
```

### GET /beacon/ultravisor/status

Returns the current beacon connection status.

**Response (connected):**

```json
{
	"Connected": true,
	"BeaconName": "my-data-beacon"
}
```

**Response (disconnected):**

```json
{
	"Connected": false,
	"BeaconName": null
}
```

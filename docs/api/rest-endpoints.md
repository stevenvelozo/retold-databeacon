# REST Endpoints Reference

Complete HTTP API reference for all endpoints exposed by DataBeacon. The default port is `8389` (configurable via CLI or settings). All request and response bodies are JSON.

## 1. Connection Management

Routes for managing external database connections. Managed by `DataBeaconConnectionBridge`.

### GET /beacon/connections

List all non-deleted connections. Passwords are masked in the response.

```bash
curl http://localhost:8086/beacon/connections
```

**Response:**

```json
{
	"Count": 2,
	"Connections": [
		{
			"IDBeaconConnection": 1,
			"GUIDBeaconConnection": "a1b2c3d4-...",
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

Create a new connection record. The connection is created in `Untested` status and is not automatically connected.

```bash
curl -X POST http://localhost:8086/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
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
	}'
```

**Request Body Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `Name` | string | `'Untitled Connection'` | Display name |
| `Type` | string | `'MySQL'` | Database type (`MySQL`, `PostgreSQL`, `MSSQL`, `SQLite`) |
| `Config` | object or string | `{}` | Connection configuration (host, port, user, password, database) |
| `AutoConnect` | boolean | `false` | Reconnect automatically on startup |
| `Description` | string | `''` | Optional description |

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

Read a single connection by ID. Passwords are masked.

```bash
curl http://localhost:8086/beacon/connection/1
```

**Response:**

```json
{
	"Connection": {
		"IDBeaconConnection": 1,
		"Name": "Production MySQL",
		"Type": "MySQL",
		"Config": "{\"host\":\"db.example.com\",\"password\":\"***\"}",
		"Status": "Connected",
		"Connected": true,
		"Description": "Main production database"
	}
}
```

### PUT /beacon/connection/:id

Update a connection. Only provided fields are changed. Passwords sent as `'***'` are preserved from the stored record.

```bash
curl -X PUT http://localhost:8086/beacon/connection/1 \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Renamed Database",
		"Config": {
			"host": "new-host.example.com",
			"password": "***"
		}
	}'
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

Soft-delete a connection. Disconnects the live connection first if active.

```bash
curl -X DELETE http://localhost:8086/beacon/connection/1
```

**Response:**

```json
{
	"Success": true
}
```

### POST /beacon/connection/:id/test

Test a saved connection. Updates the record's `Status` and `LastTestedDate`.

```bash
curl -X POST http://localhost:8086/beacon/connection/1/test
```

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

Test an ad-hoc connection configuration without saving it.

```bash
curl -X POST http://localhost:8086/beacon/connection/test \
	-H 'Content-Type: application/json' \
	-d '{
		"Type": "PostgreSQL",
		"Config": {
			"host": "pg.example.com",
			"port": 5432,
			"user": "admin",
			"password": "secret",
			"database": "testdb"
		}
	}'
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Type` | string | Yes | Database type |
| `Config` | object | Yes | Connection configuration |

**Response:**

```json
{
	"Success": true
}
```

### POST /beacon/connection/:id/connect

Establish a live runtime connection. Updates the record's `Status` to `Connected` or `Failed`.

```bash
curl -X POST http://localhost:8086/beacon/connection/1/connect
```

**Response:**

```json
{
	"Success": true,
	"Status": "Connected"
}
```

### POST /beacon/connection/:id/disconnect

Tear down a live runtime connection.

```bash
curl -X POST http://localhost:8086/beacon/connection/1/disconnect
```

**Response:**

```json
{
	"Success": true,
	"Status": "Disconnected"
}
```

### GET /beacon/connection/available-types

List all installed database connector types and whether they are available.

```bash
curl http://localhost:8086/beacon/connection/available-types
```

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

---

## 2. Schema Introspection

Routes for discovering database schemas. Managed by `DataBeaconSchemaIntrospector`.

### POST /beacon/connection/:id/introspect

Run the full introspection pipeline for a connected database. Discovers all tables, describes their columns, maps types, and persists results.

```bash
curl -X POST http://localhost:8086/beacon/connection/1/introspect
```

**Response:**

```json
{
	"Success": true,
	"TableCount": 12,
	"Tables": [
		{
			"TableName": "Orders",
			"ColumnCount": 8,
			"RowCountEstimate": 15000
		},
		{
			"TableName": "Products",
			"ColumnCount": 5,
			"RowCountEstimate": 200
		}
	]
}
```

### GET /beacon/connection/:id/tables

List cached introspected tables for a connection (does not re-introspect).

```bash
curl http://localhost:8086/beacon/connection/1/tables
```

**Response:**

```json
{
	"Count": 12,
	"Tables": [
		{
			"IDIntrospectedTable": 1,
			"TableName": "Orders",
			"ColumnCount": 8,
			"RowCountEstimate": 15000,
			"EndpointsEnabled": false,
			"LastIntrospectedDate": "2026-01-15T10:30:00.000Z"
		}
	]
}
```

### GET /beacon/connection/:id/table/:tableName

Get detailed column definitions for a specific introspected table.

```bash
curl http://localhost:8086/beacon/connection/1/table/Orders
```

**Response:**

```json
{
	"IDIntrospectedTable": 1,
	"TableName": "Orders",
	"Columns": [
		{
			"Name": "IDOrder",
			"NativeType": "int",
			"MaxLength": null,
			"Nullable": false,
			"IsPrimaryKey": true,
			"IsAutoIncrement": true,
			"DefaultValue": null,
			"MeadowType": "AutoIdentity"
		},
		{
			"Name": "CustomerName",
			"NativeType": "varchar",
			"MaxLength": 255,
			"Nullable": true,
			"IsPrimaryKey": false,
			"IsAutoIncrement": false,
			"DefaultValue": null,
			"MeadowType": "String"
		}
	],
	"RowCountEstimate": 15000,
	"EndpointsEnabled": false,
	"LastIntrospectedDate": "2026-01-15T10:30:00.000Z"
}
```

### POST /beacon/connection/:id/query

Execute a read-only SQL query against a connected database. Only `SELECT` statements are allowed.

```bash
curl -X POST http://localhost:8086/beacon/connection/1/query \
	-H 'Content-Type: application/json' \
	-d '{ "SQL": "SELECT * FROM Orders LIMIT 10" }'
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `SQL` (or `sql`) | string | Yes | SQL SELECT statement |

**Response:**

```json
{
	"Success": true,
	"RowCount": 10,
	"Rows": [
		{ "IDOrder": 1, "CustomerName": "Acme Corp", "Total": 250.00 }
	]
}
```

**Error (non-SELECT):**

```json
{
	"Success": false,
	"Error": "Only SELECT queries are allowed."
}
```

---

## 3. Dynamic Endpoint Management

Routes for enabling and disabling CRUD endpoints. Managed by `DataBeaconDynamicEndpointManager`.

### POST /beacon/endpoint/:connectionId/:tableName/enable

Enable CRUD REST endpoints for an introspected table. The connection must be live and the table must have been previously introspected.

```bash
curl -X POST http://localhost:8086/beacon/endpoint/1/Orders/enable
```

**Response:**

```json
{
	"Success": true,
	"Endpoint": {
		"TableName": "Orders",
		"EndpointBase": "/1.0/Orders",
		"ColumnCount": 8
	}
}
```

### POST /beacon/endpoint/:connectionId/:tableName/disable

Disable CRUD endpoints for a table.

```bash
curl -X POST http://localhost:8086/beacon/endpoint/1/Orders/disable
```

**Response:**

```json
{
	"Success": true,
	"Result": {
		"TableName": "Orders",
		"Disabled": true
	}
}
```

### GET /beacon/endpoints

List all currently enabled dynamic endpoints.

```bash
curl http://localhost:8086/beacon/endpoints
```

**Response:**

```json
{
	"Count": 2,
	"Endpoints": [
		{
			"ConnectionID": 1,
			"TableName": "Orders",
			"ConnectionType": "MySQL",
			"EndpointBase": "/1.0/Orders"
		},
		{
			"ConnectionID": 1,
			"TableName": "Products",
			"ConnectionType": "MySQL",
			"EndpointBase": "/1.0/Products"
		}
	]
}
```

---

## 4. Beacon Management

Routes for connecting DataBeacon to the Ultravisor mesh. Managed by `DataBeaconBeaconProvider`.

### POST /beacon/ultravisor/connect

Connect to an Ultravisor coordinator as a beacon.

```bash
curl -X POST http://localhost:8086/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "ws://ultravisor.example.com:8086",
		"Name": "my-data-beacon",
		"Password": "beacon-auth-password",
		"MaxConcurrent": 5,
		"Tags": { "environment": "production" }
	}'
```

**Request Body Fields:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `ServerURL` | string | Yes | -- | Ultravisor coordinator WebSocket URL |
| `Name` | string | No | `'retold-databeacon'` | Beacon display name |
| `Password` | string | No | `''` | Authentication password |
| `MaxConcurrent` | number | No | `3` | Maximum concurrent work items |
| `Tags` | object | No | `{}` | Beacon metadata tags |

**Response:**

```json
{
	"Success": true,
	"Status": "Connected"
}
```

### POST /beacon/ultravisor/disconnect

Disconnect from the Ultravisor coordinator.

```bash
curl -X POST http://localhost:8086/beacon/ultravisor/disconnect
```

**Response:**

```json
{
	"Success": true,
	"Status": "Disconnected"
}
```

### GET /beacon/ultravisor/status

Get the current beacon connection status.

```bash
curl http://localhost:8086/beacon/ultravisor/status
```

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

---

## 5. Dynamic CRUD Endpoints

Routes generated by `DataBeaconDynamicEndpointManager` when a table's endpoints are enabled. These follow the standard Meadow Endpoints pattern. Replace `{Table}` with the actual table name (e.g., `Orders`).

### GET /1.0/{Table}/Schema

Get the Meadow schema definition for this entity.

```bash
curl http://localhost:8086/1.0/Orders/Schema
```

### GET /1.0/{Table}/Count

Get the total count of records.

```bash
curl http://localhost:8086/1.0/Orders/Count
```

### GET /1.0/{Table}/CountBy/:ByField/:ByValue

Get a filtered count of records.

```bash
curl http://localhost:8086/1.0/Orders/CountBy/Status/Active
```

### GET /1.0/{Table}/:IDRecord

Read a single record by its primary key.

```bash
curl http://localhost:8086/1.0/Orders/42
```

### GET /1.0/{Table}s/:Begin/:Cap

Read a page of records. `Begin` is the starting index (0-based), `Cap` is the page size.

```bash
curl http://localhost:8086/1.0/Orderss/0/50
```

Note: the route appends an `s` to the table name for the plural reads endpoint (e.g., `Orders` becomes `Orderss`). This follows the standard Meadow Endpoints convention.

### GET /1.0/{Table}By/:ByField/:ByValue/:Begin/:Cap

Read a filtered page of records.

```bash
curl http://localhost:8086/1.0/OrdersBy/Status/Active/0/50
```

### POST /1.0/{Table}

Create a new record.

```bash
curl -X POST http://localhost:8086/1.0/Orders \
	-H 'Content-Type: application/json' \
	-d '{ "CustomerName": "Acme Corp", "Total": 250.00 }'
```

### PUT /1.0/{Table}

Update a record. The request body must include the primary key field.

```bash
curl -X PUT http://localhost:8086/1.0/Orders \
	-H 'Content-Type: application/json' \
	-d '{ "IDOrder": 42, "CustomerName": "Acme Corp Updated" }'
```

### DELETE /1.0/{Table}/:IDRecord

Delete a record by its primary key.

```bash
curl -X DELETE http://localhost:8086/1.0/Orders/42
```

---

## 6. Internal Meadow Endpoints

Standard Meadow Endpoints for the internal DAL entities. These are enabled when the `MeadowEndpoints` group is active. They follow the same CRUD pattern as the dynamic endpoints above.

### BeaconConnection

| Method | Path | Description |
|--------|------|-------------|
| GET | `/1.0/BeaconConnection/Schema` | Schema definition |
| GET | `/1.0/BeaconConnection/Count` | Total count |
| GET | `/1.0/BeaconConnection/:IDBeaconConnection` | Read by ID |
| GET | `/1.0/BeaconConnections/:Begin/:Cap` | Read paged |
| POST | `/1.0/BeaconConnection` | Create |
| PUT | `/1.0/BeaconConnection` | Update |
| DELETE | `/1.0/BeaconConnection/:IDBeaconConnection` | Delete |

### IntrospectedTable

| Method | Path | Description |
|--------|------|-------------|
| GET | `/1.0/IntrospectedTable/Schema` | Schema definition |
| GET | `/1.0/IntrospectedTable/Count` | Total count |
| GET | `/1.0/IntrospectedTable/:IDIntrospectedTable` | Read by ID |
| GET | `/1.0/IntrospectedTables/:Begin/:Cap` | Read paged |
| POST | `/1.0/IntrospectedTable` | Create |
| PUT | `/1.0/IntrospectedTable` | Update |
| DELETE | `/1.0/IntrospectedTable/:IDIntrospectedTable` | Delete |

### User

| Method | Path | Description |
|--------|------|-------------|
| GET | `/1.0/User/Schema` | Schema definition |
| GET | `/1.0/User/Count` | Total count |
| GET | `/1.0/User/:IDUser` | Read by ID |
| GET | `/1.0/Users/:Begin/:Cap` | Read paged |
| POST | `/1.0/User` | Create |
| PUT | `/1.0/User` | Update |
| DELETE | `/1.0/User/:IDUser` | Delete |

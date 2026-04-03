# Quick Start

Get Retold DataBeacon running and serving REST endpoints for a remote database in under five minutes.

## Prerequisites

-- **Node.js 18+** -- DataBeacon requires Node.js 18 or later.
-- **npm** -- Included with Node.js.

## Installation

Install as a local dependency:

```sh
npm install retold-databeacon
```

Or install globally so the `retold-databeacon` command is available everywhere:

```sh
npm install -g retold-databeacon
```

## First Run

Start the server with the default settings:

```sh
retold-databeacon serve
```

You will see output similar to:

```
Retold DataBeacon is initializing...
Endpoint groups enabled: [MeadowEndpoints, ConnectionBridge, SchemaIntrospector, DynamicEndpointManager, BeaconProvider, WebUI]
Creating DataBeacon schema (CREATE TABLE IF NOT EXISTS)...
DataBeacon schema created successfully.
Retold DataBeacon running on port 8389
API:     http://localhost:8389/1.0/
Beacon:  http://localhost:8389/beacon/
Web UI:  http://localhost:8389/
```

DataBeacon creates an internal SQLite database at `./data/databeacon.sqlite` to store connection definitions, introspected schemas, and endpoint state. You can override the port and database path:

```sh
retold-databeacon serve --port 9000 --db /mnt/data/beacon.sqlite
```

## Opening the Web UI

Open your browser to:

```
http://localhost:8389
```

The web UI lets you manage connections, browse introspected schemas, enable and disable endpoints, and monitor beacon status -- all without writing curl commands. The steps below show both the web UI approach and the equivalent curl commands.

## Adding Your First Connection

### Using the Web UI

1. Open `http://localhost:8389` in your browser.
2. Navigate to the Connections panel.
3. Click **Add Connection**.
4. Fill in the connection details:
	-- **Name**: A human-readable label (e.g. "Production MySQL").
	-- **Type**: Select the database type (MySQL, PostgreSQL, MSSQL, or SQLite).
	-- **Config**: Enter connection parameters (host, port, user, password, database).
5. Click **Save**.

### Using curl

```sh
curl -X POST http://localhost:8389/beacon/connection \
	-H "Content-Type: application/json" \
	-d '{
		"Name": "Production MySQL",
		"Type": "MySQL",
		"Config": {
			"host": "db.example.com",
			"port": 3306,
			"user": "readonly",
			"password": "secret",
			"database": "app_prod"
		},
		"AutoConnect": true,
		"Description": "Read-only access to the production application database"
	}'
```

The response includes the new connection record with its `IDBeaconConnection`:

```json
{
	"Success": true,
	"Connection": {
		"IDBeaconConnection": 1,
		"Name": "Production MySQL",
		"Type": "MySQL",
		"Config": "{\"host\":\"db.example.com\",\"port\":3306,\"user\":\"readonly\",\"password\":\"***\",\"database\":\"app_prod\"}",
		"Status": "Untested",
		"Connected": false
	}
}
```

Note that the password is masked in all API responses.

Next, establish a live runtime connection:

```sh
curl -X POST http://localhost:8389/beacon/connection/1/connect
```

```json
{
	"Success": true,
	"Status": "Connected"
}
```

You can also test a connection without saving it:

```sh
curl -X POST http://localhost:8389/beacon/connection/test \
	-H "Content-Type: application/json" \
	-d '{
		"Type": "MySQL",
		"Config": {
			"host": "db.example.com",
			"port": 3306,
			"user": "readonly",
			"password": "secret",
			"database": "app_prod"
		}
	}'
```

## Introspecting a Database

Once a connection is live, introspect it to discover all tables and columns.

### Using the Web UI

1. In the Connections panel, find your connected database.
2. Click **Introspect**.
3. The schema browser populates with all discovered tables and their column definitions.

### Using curl

```sh
curl -X POST http://localhost:8389/beacon/connection/1/introspect
```

```json
{
	"Success": true,
	"TableCount": 12,
	"Tables": [
		{ "TableName": "Customer", "ColumnCount": 15, "RowCountEstimate": 4500 },
		{ "TableName": "Order", "ColumnCount": 22, "RowCountEstimate": 89000 },
		{ "TableName": "Product", "ColumnCount": 18, "RowCountEstimate": 320 }
	]
}
```

To see the full column definitions for a specific table:

```sh
curl http://localhost:8389/beacon/connection/1/table/Customer
```

```json
{
	"IDIntrospectedTable": 1,
	"TableName": "Customer",
	"Columns": [
		{
			"Name": "IDCustomer",
			"NativeType": "int",
			"MeadowType": "AutoIdentity",
			"IsPrimaryKey": true,
			"IsAutoIncrement": true
		},
		{
			"Name": "Name",
			"NativeType": "varchar",
			"MaxLength": 255,
			"MeadowType": "String",
			"IsPrimaryKey": false
		}
	],
	"EndpointsEnabled": false
}
```

To list all cached introspected tables for a connection:

```sh
curl http://localhost:8389/beacon/connection/1/tables
```

## Enabling Endpoints

Enable CRUD REST endpoints for any introspected table.

### Using the Web UI

1. In the schema browser, find the table you want to expose.
2. Click **Enable Endpoints**.
3. The table now has live REST routes at `/1.0/{TableName}`.

### Using curl

```sh
curl -X POST http://localhost:8389/beacon/endpoint/1/Customer/enable
```

```json
{
	"Success": true,
	"Endpoint": {
		"TableName": "Customer",
		"EndpointBase": "/1.0/Customer",
		"ColumnCount": 15
	}
}
```

To see all currently enabled endpoints:

```sh
curl http://localhost:8389/beacon/endpoints
```

```json
{
	"Count": 1,
	"Endpoints": [
		{
			"ConnectionID": 1,
			"TableName": "Customer",
			"ConnectionType": "MySQL",
			"EndpointBase": "/1.0/Customer"
		}
	]
}
```

To disable endpoints for a table:

```sh
curl -X POST http://localhost:8389/beacon/endpoint/1/Customer/disable
```

## Querying Data

Once endpoints are enabled, use standard Meadow REST conventions to read and write records.

### List Records

Retrieve records with pagination. The URL pattern is `/1.0/{TableName}s/{Begin}/{Cap}`:

```sh
# Get the first 50 Customer records
curl http://localhost:8389/1.0/Customers/0/50
```

### Read a Single Record

```sh
# Read Customer with ID 42
curl http://localhost:8389/1.0/Customer/42
```

### Create a Record

```sh
curl -X POST http://localhost:8389/1.0/Customer \
	-H "Content-Type: application/json" \
	-d '{
		"Name": "Acme Corp",
		"Email": "contact@acme.com"
	}'
```

### Update a Record

```sh
curl -X PUT http://localhost:8389/1.0/Customer \
	-H "Content-Type: application/json" \
	-d '{
		"IDCustomer": 42,
		"Name": "Acme Corporation"
	}'
```

### Execute a Read-Only Query

For more complex reads, you can execute raw SELECT queries against a connected database:

```sh
curl -X POST http://localhost:8389/beacon/connection/1/query \
	-H "Content-Type: application/json" \
	-d '{
		"SQL": "SELECT c.Name, COUNT(o.IDOrder) AS OrderCount FROM Customer c LEFT JOIN Order o ON c.IDCustomer = o.IDCustomer GROUP BY c.Name ORDER BY OrderCount DESC LIMIT 10"
	}'
```

```json
{
	"Success": true,
	"RowCount": 10,
	"Rows": [
		{ "Name": "Acme Corp", "OrderCount": 127 }
	]
}
```

Only SELECT statements are allowed through the query endpoint.

## Next Steps

-- [Architecture](architecture.md) -- Understand the service architecture, internal data model, and how ConnectionBridge, SchemaIntrospector, DynamicEndpointManager, and BeaconProvider work together.
-- [Usage Workflows](examples/) -- Step-by-step walkthroughs for global CLI install, Docker deployment, embedding as a library, and Facto projection pipelines.
-- [API Reference](api/README.md) -- Complete per-route documentation for every REST endpoint.

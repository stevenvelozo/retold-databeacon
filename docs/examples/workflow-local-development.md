# Workflow: Local Development

Check out the retold-databeacon repository and run it locally for development and testing.

## Prerequisites

- Node.js 18 or later
- npm
- Git

## Clone and Setup

```bash
git clone https://github.com/stevenvelozo/retold-databeacon.git
cd retold-databeacon

# Install dependencies
npm install

# Run tests to verify the setup
npm test
```

Expected output:

```
  Retold DataBeacon
    [x] Service should be initialized
    [x] Schema should have been created
    [x] DAL entities should be initialized
    [x] GET /beacon/connections should return empty list
    ...
    [x] DELETE /beacon/connection/1 should soft-delete

  19 passing (60ms)
```

## Start the Server

```bash
npm start
```

This runs `node bin/retold-databeacon.js` which starts on port 8389 by default:

```
Retold DataBeacon running on port 8389
API:     http://localhost:8389/1.0/
Beacon:  http://localhost:8389/beacon/
Web UI:  http://localhost:8389/
```

Open `http://localhost:8389` in your browser to see the web UI.

## Walk-Through: Introspecting DataBeacon's Own Database

Since DataBeacon uses SQLite internally, the simplest test is to point it at itself.

### Step 1: Create a Connection to the Internal SQLite

Using the web UI:
1. Click **Connections** in the sidebar
2. Set **Name** to "Internal DB"
3. Set **Type** to "SQLite"
4. Set **Database** to `data/databeacon.sqlite` (the absolute path on your machine)
5. Click **Add Connection**

Or via curl:

```bash
curl -X POST http://localhost:8389/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Internal DB",
		"Type": "SQLite",
		"Config": { "SQLiteFilePath": "data/databeacon.sqlite" }
	}'
```

### Step 2: Connect

```bash
curl -X POST http://localhost:8389/beacon/connection/1/connect
```

### Step 3: Introspect

```bash
curl -X POST http://localhost:8389/beacon/connection/1/introspect
```

Response:

```json
{
	"Success": true,
	"TableCount": 3,
	"Tables": [
		{ "TableName": "BeaconConnection", "ColumnCount": 16, "RowCountEstimate": 0 },
		{ "TableName": "IntrospectedTable", "ColumnCount": 16, "RowCountEstimate": 0 },
		{ "TableName": "User", "ColumnCount": 11, "RowCountEstimate": 0 }
	]
}
```

### Step 4: Browse Table Details

```bash
curl http://localhost:8389/beacon/connection/1/table/BeaconConnection
```

### Step 5: Run an Ad-Hoc Query

```bash
curl -X POST http://localhost:8389/beacon/connection/1/query \
	-H 'Content-Type: application/json' \
	-d '{ "SQL": "SELECT IDUser, LoginID, Name FROM User" }'
```

Response:

```json
{
	"Success": true,
	"RowCount": 1,
	"Rows": [
		{ "IDUser": 1, "LoginID": "system", "Name": "System" }
	]
}
```

## Building the Web UI Bundle

If you modify the Pict web application source files, rebuild the bundle:

```bash
npm run build
```

This runs `npx quack build` which uses browserify to bundle the Pict application into `source/services/web-app/web/retold-databeacon.js`.

## Development with an External Database

### Connect to a Local MySQL

Start a MySQL server (e.g., via Docker):

```bash
docker run -d --name mysql-dev \
	-e MYSQL_ROOT_PASSWORD=devpass \
	-e MYSQL_DATABASE=testdb \
	-p 3306:3306 \
	mysql:8
```

Add the connection:

```bash
curl -X POST http://localhost:8389/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Local MySQL",
		"Type": "MySQL",
		"Config": {
			"host": "localhost",
			"port": 3306,
			"database": "testdb",
			"user": "root",
			"password": "devpass"
		}
	}'
```

Then connect, introspect, and enable endpoints as shown above.

---

## Stand-Alone Mode (No Ultravisor)

By default, DataBeacon runs stand-alone. All functionality (connections, introspection, dynamic endpoints, web UI) works without Ultravisor. The beacon status will show:

```json
{ "Connected": false, "BeaconName": null }
```

This is the recommended mode for development and testing.

---

## With a Local Ultravisor Server

To test Ultravisor integration locally, start Ultravisor in a separate terminal:

```bash
npx ultravisor serve --port 54321
```

Then connect DataBeacon to it:

```bash
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "http://localhost:54321",
		"Name": "dev-databeacon"
	}'
```

Now Ultravisor can dispatch operations to DataBeacon. See the [Facto Projection Pipeline](workflow-facto-projection.md) workflow for advanced usage.

---

## Connecting to a Remote Ultravisor

If you have an Ultravisor coordinator running on another machine:

```bash
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "https://ultravisor.staging.example.com:54321",
		"Name": "dev-beacon",
		"Password": "staging-auth-token",
		"Tags": { "environment": "development" }
	}'
```

This allows your local DataBeacon to participate in the remote Ultravisor mesh during development.

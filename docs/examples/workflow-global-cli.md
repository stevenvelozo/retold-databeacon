# Workflow: Global CLI Install

Install retold-databeacon globally and use it as a command-line utility to quickly spin up a data beacon on any machine with Node.js.

## Prerequisites

- Node.js 18 or later
- npm

## Installation

```bash
npm install -g retold-databeacon
```

Verify the installation:

```bash
retold-databeacon --help
```

## Scenario 1: Stand-Alone (No Ultravisor)

The simplest deployment -- run DataBeacon as a self-contained REST API server with no external dependencies.

### Initialize and Start

```bash
# Create a working directory
mkdir ~/my-beacon && cd ~/my-beacon

# Initialize the database schema
retold-databeacon init

# Start the server
retold-databeacon serve
```

You will see:

```
Retold DataBeacon running on port 8389
API:     http://localhost:8389/1.0/
Beacon:  http://localhost:8389/beacon/
Web UI:  http://localhost:8389/
```

### Add a MySQL Connection

```bash
curl -X POST http://localhost:8389/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Production MySQL",
		"Type": "MySQL",
		"Config": {
			"host": "db.internal.example.com",
			"port": 3306,
			"database": "app_production",
			"user": "readonly",
			"password": "secret123"
		},
		"AutoConnect": true,
		"Description": "Production application database"
	}'
```

### Connect and Introspect

```bash
# Establish the live connection
curl -X POST http://localhost:8389/beacon/connection/1/connect

# Discover all tables
curl -X POST http://localhost:8389/beacon/connection/1/introspect

# List discovered tables
curl http://localhost:8389/beacon/connection/1/tables
```

### Enable Endpoints and Query

```bash
# Enable REST API for the "customers" table
curl -X POST http://localhost:8389/beacon/endpoint/1/customers/enable

# Read the first 25 customer records
curl http://localhost:8389/1.0/customerss/0/25

# Read a single record by ID
curl http://localhost:8389/1.0/customers/42
```

### Custom Port and Database Path

```bash
retold-databeacon serve --port 9000 --db /var/data/beacon.sqlite --log /var/log/beacon.log
```

### Using a Config File

Create `beacon-config.json`:

```json
{
	"APIServerPort": 9000,
	"SQLite": {
		"SQLiteFilePath": "/var/data/beacon.sqlite"
	},
	"LogStreams": [
		{ "streamtype": "console" },
		{
			"loggertype": "simpleflatfile",
			"showtimestamps": true,
			"formattedtimestamps": true,
			"level": "trace",
			"path": "/var/log/beacon.log"
		}
	]
}
```

```bash
retold-databeacon serve --config beacon-config.json
```

---

## Scenario 2: With a Local Ultravisor Server

Run an Ultravisor coordinator on the same machine and register DataBeacon as a beacon.

### Start Ultravisor

In a separate terminal:

```bash
npx ultravisor serve --port 54321
```

### Start DataBeacon and Connect

```bash
retold-databeacon serve
```

Then connect to Ultravisor via the API:

```bash
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "http://localhost:54321",
		"Name": "local-databeacon",
		"MaxConcurrent": 5
	}'
```

Verify the connection:

```bash
curl http://localhost:8389/beacon/ultravisor/status
```

Response:

```json
{
	"Connected": true,
	"BeaconName": "local-databeacon"
}
```

Ultravisor can now dispatch work to DataBeacon's two capabilities:
- **DataBeaconAccess** -- ListConnections, ListTables, ReadRecords, QueryTable
- **DataBeaconManagement** -- Introspect, EnableEndpoint, DisableEndpoint

---

## Scenario 3: Connecting to a Remote Ultravisor

Point DataBeacon at an Ultravisor coordinator running on a different machine.

```bash
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "https://ultravisor.corp.example.com:54321",
		"Name": "datacenter-east-beacon",
		"Password": "mesh-auth-token",
		"MaxConcurrent": 10,
		"Tags": {
			"datacenter": "east",
			"environment": "production"
		}
	}'
```

### Ultravisor Operation: Remote Introspect

Import this operation into Ultravisor's UI to trigger a remote introspection via the beacon:

```json
{
	"Name": "Remote DataBeacon Introspect",
	"Description": "Triggers schema introspection on a remote DataBeacon instance",
	"Nodes": {
		"start": {
			"Type": "start",
			"Transitions": { "default": "introspect" }
		},
		"introspect": {
			"Type": "beacon-task",
			"Capability": "DataBeaconManagement",
			"Action": "Introspect",
			"Settings": {
				"IDBeaconConnection": "{~D:Record.Operation.ConnectionID~}"
			},
			"Transitions": { "default": "enable-tables" }
		},
		"enable-tables": {
			"Type": "beacon-task",
			"Capability": "DataBeaconManagement",
			"Action": "EnableEndpoint",
			"Settings": {
				"IDBeaconConnection": "{~D:Record.Operation.ConnectionID~}",
				"TableName": "{~D:Record.Operation.TableName~}"
			},
			"Transitions": { "default": "end" }
		},
		"end": {
			"Type": "end"
		}
	}
}
```

---

## Scenario 4: Remote Facto Pipeline

Use Ultravisor to pull data from DataBeacon and push it into a retold-facto instance on another beacon.

### Ultravisor Operation: Pull to Facto

```json
{
	"Name": "Pull Remote Table to Facto",
	"Description": "Reads records from a DataBeacon and bulk-creates them in Facto",
	"Nodes": {
		"start": {
			"Type": "start",
			"Transitions": { "default": "read-records" }
		},
		"read-records": {
			"Type": "beacon-task",
			"Capability": "DataBeaconAccess",
			"Action": "ReadRecords",
			"Settings": {
				"IDBeaconConnection": "{~D:Record.Operation.ConnectionID~}",
				"TableName": "{~D:Record.Operation.TableName~}",
				"Cap": 5000
			},
			"Transitions": { "default": "create-source" }
		},
		"create-source": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateSource",
			"Settings": {
				"Name": "DataBeacon Import - {~D:Record.Operation.TableName~}",
				"Type": "beacon-pull"
			},
			"Transitions": { "default": "create-dataset" }
		},
		"create-dataset": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateDataset",
			"Settings": {
				"Name": "{~D:Record.Operation.TableName~}",
				"Type": "Raw"
			},
			"Transitions": { "default": "create-job" }
		},
		"create-job": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateIngestJob",
			"Settings": {
				"IDSource": "{~D:Record.TaskOutput.create-source.Created.IDSource~}",
				"IDDataset": "{~D:Record.TaskOutput.create-dataset.Created.IDDataset~}"
			},
			"Transitions": { "default": "bulk-create" }
		},
		"bulk-create": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "BulkCreateRecords",
			"Settings": {
				"IDDataset": "{~D:Record.TaskOutput.create-dataset.Created.IDDataset~}",
				"IDSource": "{~D:Record.TaskOutput.create-source.Created.IDSource~}",
				"IDIngestJob": "{~D:Record.TaskOutput.create-job.Created.IDIngestJob~}",
				"Records": "{~D:Record.TaskOutput.read-records.Records~}"
			},
			"Transitions": { "default": "update-job" }
		},
		"update-job": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "UpdateIngestJob",
			"Settings": {
				"IDIngestJob": "{~D:Record.TaskOutput.create-job.Created.IDIngestJob~}",
				"Status": "Complete"
			},
			"Transitions": { "default": "end" }
		},
		"end": {
			"Type": "end"
		}
	}
}
```

This operation:
1. Reads records from DataBeacon's connected database
2. Creates a Source and Dataset in Facto
3. Creates an IngestJob to track the import
4. Bulk-creates the records in Facto
5. Marks the job complete

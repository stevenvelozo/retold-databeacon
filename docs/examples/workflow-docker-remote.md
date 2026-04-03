# Workflow: Docker Remote Deployment

Build a retold-databeacon Docker image, transfer it to a remote machine on a different network, and run it there to provide a database bridge for that network.

This is the primary deployment scenario -- you have databases on a network you cannot directly reach, and you want to deploy DataBeacon there to expose them via REST APIs and/or the Ultravisor mesh.

## Prerequisites

- Docker on your local machine (build)
- Docker on the remote machine (run)
- SSH access to the remote machine
- A database on the remote network to connect to

## Step 1: Build the Image Locally

```bash
cd retold-databeacon

# Build
docker build -t retold-databeacon:latest .

# Verify
docker images retold-databeacon
```

## Step 2: Export the Image

```bash
# Save to a compressed tarball
docker save retold-databeacon:latest | gzip > retold-databeacon.tar.gz

# Check the size (typically 200-400MB)
ls -lh retold-databeacon.tar.gz
```

## Step 3: Transfer to the Remote Machine

```bash
# SCP to the remote host
scp retold-databeacon.tar.gz user@remote-host:/tmp/

# Or use rsync for resume support on slow links
rsync -avz --progress retold-databeacon.tar.gz user@remote-host:/tmp/
```

## Step 4: Load the Image on the Remote Machine

SSH into the remote host:

```bash
ssh user@remote-host
```

Load the Docker image:

```bash
# Load the image
gunzip -c /tmp/retold-databeacon.tar.gz | docker load

# Verify
docker images retold-databeacon

# Clean up the tarball
rm /tmp/retold-databeacon.tar.gz
```

## Step 5: Create the Data Directory

```bash
# Create a persistent data directory
sudo mkdir -p /opt/databeacon/data
sudo chown $USER:$USER /opt/databeacon/data
```

## Step 6: Start the Service

### Basic Start

```bash
docker run -d \
	--name databeacon \
	--restart unless-stopped \
	-p 8389:8389 \
	-v /opt/databeacon/data:/app/data \
	retold-databeacon:latest
```

### With a Config File

Create `/opt/databeacon/config.json`:

```json
{
	"APIServerPort": 8389,
	"LogStreams": [
		{ "streamtype": "console" },
		{
			"loggertype": "simpleflatfile",
			"showtimestamps": true,
			"formattedtimestamps": true,
			"level": "info",
			"path": "/app/data/beacon.log"
		}
	]
}
```

```bash
docker run -d \
	--name databeacon \
	--restart unless-stopped \
	-p 8389:8389 \
	-v /opt/databeacon/data:/app/data \
	-v /opt/databeacon/config.json:/app/config.json:ro \
	retold-databeacon:latest \
	node bin/retold-databeacon.js serve --config /app/config.json
```

### Verify

```bash
# Check health
curl http://localhost:8389/beacon/ultravisor/status

# Check logs
docker logs -f databeacon
```

## Step 7: Add Database Connections

Now configure connections to databases on the remote network.

### PostgreSQL on the Same Network

```bash
curl -X POST http://localhost:8389/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Warehouse PostgreSQL",
		"Type": "PostgreSQL",
		"Config": {
			"host": "postgres.internal.corp",
			"port": 5432,
			"database": "warehouse",
			"user": "beacon_reader",
			"password": "read-only-pass"
		},
		"AutoConnect": true,
		"Description": "Data warehouse on the corporate network"
	}'
```

### MySQL Legacy Application

```bash
curl -X POST http://localhost:8389/beacon/connection \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Legacy CRM",
		"Type": "MySQL",
		"Config": {
			"host": "10.0.1.50",
			"port": 3306,
			"database": "crm_production",
			"user": "readonly",
			"password": "crm-secret"
		},
		"AutoConnect": true,
		"Description": "Legacy CRM MySQL database"
	}'
```

### Connect, Introspect, and Enable

```bash
# Connect both
curl -X POST http://localhost:8389/beacon/connection/1/connect
curl -X POST http://localhost:8389/beacon/connection/2/connect

# Introspect both
curl -X POST http://localhost:8389/beacon/connection/1/introspect
curl -X POST http://localhost:8389/beacon/connection/2/introspect

# List tables for the warehouse
curl http://localhost:8389/beacon/connection/1/tables

# Enable specific tables
curl -X POST http://localhost:8389/beacon/endpoint/1/sales_orders/enable
curl -X POST http://localhost:8389/beacon/endpoint/1/customers/enable
curl -X POST http://localhost:8389/beacon/endpoint/2/contacts/enable

# Verify endpoints
curl http://localhost:8389/beacon/endpoints
```

## Step 8: Access from Outside

From your local machine (assuming the remote host is accessible):

```bash
# Browse data via REST
curl http://remote-host:8389/1.0/sales_orderss/0/10

# Access the web UI
open http://remote-host:8389/
```

---

## Stand-Alone Mode (No Ultravisor)

The remote DataBeacon runs as a self-contained REST API. Clients on any network that can reach port 8389 can use the REST API and web UI directly. No Ultravisor required.

This is ideal when you simply need REST access to databases that are otherwise unreachable.

---

## With a Local Ultravisor on the Remote Machine

If you want workflow orchestration on the remote network, also deploy Ultravisor:

```bash
# Start Ultravisor
docker run -d \
	--name ultravisor \
	--restart unless-stopped \
	-p 54321:54321 \
	node:20-slim \
	npx ultravisor serve --port 54321

# Connect DataBeacon
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "http://172.17.0.1:54321",
		"Name": "remote-network-beacon"
	}'
```

---

## Connecting to Your Central Ultravisor

The most powerful scenario -- the remote DataBeacon connects back to your central Ultravisor coordinator, making the remote databases available to your entire mesh.

```bash
curl -X POST http://localhost:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "https://ultravisor.headquarters.example.com:54321",
		"Name": "datacenter-east-beacon",
		"Password": "mesh-secret",
		"MaxConcurrent": 10,
		"Tags": {
			"datacenter": "east",
			"network": "corporate",
			"databases": ["warehouse-pg", "crm-mysql"]
		}
	}'
```

### Ultravisor Operation: Remote Data Pull

From the central Ultravisor UI, import this operation to pull data from the remote beacon into a local Facto instance:

```json
{
	"Name": "Pull Remote Warehouse Data",
	"Description": "Pull sales orders from the remote datacenter DataBeacon into local Facto",
	"Nodes": {
		"start": {
			"Type": "start",
			"Transitions": { "default": "read-remote" }
		},
		"read-remote": {
			"Type": "beacon-task",
			"BeaconTags": { "datacenter": "east" },
			"Capability": "DataBeaconAccess",
			"Action": "ReadRecords",
			"Settings": {
				"IDBeaconConnection": 1,
				"TableName": "sales_orders",
				"Cap": 10000
			},
			"Transitions": { "default": "create-source" }
		},
		"create-source": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateSource",
			"Settings": {
				"Name": "Datacenter East - Warehouse",
				"Type": "beacon-pull"
			},
			"Transitions": { "default": "create-dataset" }
		},
		"create-dataset": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateDataset",
			"Settings": {
				"Name": "Sales Orders (East)",
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
			"Transitions": { "default": "ingest" }
		},
		"ingest": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "BulkCreateRecords",
			"Settings": {
				"IDDataset": "{~D:Record.TaskOutput.create-dataset.Created.IDDataset~}",
				"IDSource": "{~D:Record.TaskOutput.create-source.Created.IDSource~}",
				"IDIngestJob": "{~D:Record.TaskOutput.create-job.Created.IDIngestJob~}",
				"Records": "{~D:Record.TaskOutput.read-remote.Records~}"
			},
			"Transitions": { "default": "complete-job" }
		},
		"complete-job": {
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

---

## Updating the Remote Deployment

When you have a new version:

```bash
# On your local machine
docker build -t retold-databeacon:latest .
docker save retold-databeacon:latest | gzip > retold-databeacon.tar.gz
scp retold-databeacon.tar.gz user@remote-host:/tmp/

# On the remote machine
ssh user@remote-host
gunzip -c /tmp/retold-databeacon.tar.gz | docker load
docker stop databeacon
docker rm databeacon
docker run -d \
	--name databeacon \
	--restart unless-stopped \
	-p 8389:8389 \
	-v /opt/databeacon/data:/app/data \
	retold-databeacon:latest
```

The SQLite database in `/opt/databeacon/data` persists across container replacements. All connections, introspected schemas, and enabled endpoints survive the update. Auto-connect connections will automatically reconnect on startup.

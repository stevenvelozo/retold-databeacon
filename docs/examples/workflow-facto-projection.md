# Workflow: Facto Projection Pipeline

Use retold-databeacon with retold-facto and Ultravisor to pull raw recordsets from a remote database and push them into the Facto data pipeline -- creating sources, datasets, and projections that can be deployed to other databases.

This is the most advanced workflow, combining all three services in the Ultravisor mesh.

## Architecture

```
Remote Network                          Your Network
┌─────────────────────┐                 ┌──────────────────────────────┐
│  PostgreSQL DB      │                 │  Ultravisor Coordinator      │
│  MySQL DB           │                 │  Retold Facto (port 8420)    │
│                     │                 │  Target MySQL (projections)  │
│  DataBeacon (8389)──┼──── WAN/VPN ───┤                              │
│    ├ Connections     │                 │                              │
│    ├ Introspection   │                 │                              │
│    └ Dynamic APIs    │                 │                              │
└─────────────────────┘                 └──────────────────────────────┘
```

## Prerequisites

- DataBeacon deployed on the remote network (see [Docker Remote](workflow-docker-remote.md))
- Ultravisor coordinator running on your network
- Retold Facto running on your network with a Facto beacon registered
- Network connectivity between DataBeacon and Ultravisor (firewall rules allowing outbound from DataBeacon)

## Step 1: Set Up the Remote DataBeacon

On the remote machine, DataBeacon should already be running with database connections configured. Connect it to your central Ultravisor:

```bash
curl -X POST http://remote-databeacon:8389/beacon/ultravisor/connect \
	-H 'Content-Type: application/json' \
	-d '{
		"ServerURL": "https://ultravisor.hq.example.com:54321",
		"Name": "remote-data-beacon",
		"Password": "mesh-secret",
		"MaxConcurrent": 5,
		"Tags": {
			"role": "data-source",
			"network": "remote-dc"
		}
	}'
```

Ensure the databases are connected and introspected:

```bash
# On the remote DataBeacon
curl -X POST http://localhost:8389/beacon/connection/1/connect
curl -X POST http://localhost:8389/beacon/connection/1/introspect
```

## Step 2: Set Up Facto with Beacon

On your local network, Facto should be running and registered as a beacon with the same Ultravisor.

If using the ultravisor-suite-harness pattern, Facto registers capabilities:
- **FactoData** -- CreateSource, CreateDataset, CreateIngestJob, BulkCreateRecords, UpdateIngestJob, ReadRecords
- **FactoTransform** -- ApplyMapping
- **FactoDeploy** -- DeploySchema

## Step 3: Define the Pull Operation

This Ultravisor operation reads records from the remote DataBeacon and ingests them into Facto.

### Operation: Pull Remote Table to Facto

Save this as `pull-remote-to-facto.json` and import it into Ultravisor:

```json
{
	"Name": "Pull Remote Table to Facto",
	"Description": "Read records from a remote DataBeacon and ingest them into the local Facto instance for projection mapping",
	"Variables": {
		"SourceBeaconConnectionID": 1,
		"SourceTableName": "customers",
		"SourceName": "Remote Datacenter",
		"DatasetName": "Customers (Remote)",
		"RecordCap": 10000
	},
	"Nodes": {
		"start": {
			"Type": "start",
			"Transitions": { "default": "read-remote-records" }
		},
		"read-remote-records": {
			"Type": "beacon-task",
			"BeaconTags": { "role": "data-source" },
			"Capability": "DataBeaconAccess",
			"Action": "ReadRecords",
			"Settings": {
				"IDBeaconConnection": "{~D:Record.Operation.SourceBeaconConnectionID~}",
				"TableName": "{~D:Record.Operation.SourceTableName~}",
				"Cap": "{~D:Record.Operation.RecordCap~}"
			},
			"Transitions": { "default": "create-facto-source" }
		},
		"create-facto-source": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateSource",
			"Settings": {
				"Name": "{~D:Record.Operation.SourceName~}",
				"Type": "beacon-pull"
			},
			"Transitions": { "default": "create-facto-dataset" }
		},
		"create-facto-dataset": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateDataset",
			"Settings": {
				"Name": "{~D:Record.Operation.DatasetName~}",
				"Type": "Raw"
			},
			"Transitions": { "default": "create-ingest-job" }
		},
		"create-ingest-job": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateIngestJob",
			"Settings": {
				"IDSource": "{~D:Record.TaskOutput.create-facto-source.Created.IDSource~}",
				"IDDataset": "{~D:Record.TaskOutput.create-facto-dataset.Created.IDDataset~}"
			},
			"Transitions": { "default": "bulk-ingest" }
		},
		"bulk-ingest": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "BulkCreateRecords",
			"Settings": {
				"IDDataset": "{~D:Record.TaskOutput.create-facto-dataset.Created.IDDataset~}",
				"IDSource": "{~D:Record.TaskOutput.create-facto-source.Created.IDSource~}",
				"IDIngestJob": "{~D:Record.TaskOutput.create-ingest-job.Created.IDIngestJob~}",
				"Records": "{~D:Record.TaskOutput.read-remote-records.Records~}"
			},
			"Transitions": { "default": "complete-job" }
		},
		"complete-job": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "UpdateIngestJob",
			"Settings": {
				"IDIngestJob": "{~D:Record.TaskOutput.create-ingest-job.Created.IDIngestJob~}",
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

## Step 4: Define the Projection Deployment

After data is in Facto, use a second operation to create a projection that deploys to a target database.

### Operation: Deploy Projection to MySQL

Save this as `deploy-projection.json`:

```json
{
	"Name": "Deploy Dataset Projection",
	"Description": "Create a projection from a Facto dataset and deploy it to a MySQL target",
	"Variables": {
		"DatasetID": 1,
		"StoreConnectionID": 1,
		"ProjectionName": "customers_flat"
	},
	"Nodes": {
		"start": {
			"Type": "start",
			"Transitions": { "default": "create-projection-store" }
		},
		"create-projection-store": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateProjectionStore",
			"Settings": {
				"IDDataset": "{~D:Record.Operation.DatasetID~}",
				"IDStoreConnection": "{~D:Record.Operation.StoreConnectionID~}",
				"TargetTableName": "{~D:Record.Operation.ProjectionName~}"
			},
			"Transitions": { "default": "deploy-schema" }
		},
		"deploy-schema": {
			"Type": "beacon-task",
			"Capability": "FactoDeploy",
			"Action": "DeploySchema",
			"Settings": {
				"IDProjectionStore": "{~D:Record.TaskOutput.create-projection-store.Created.IDProjectionStore~}"
			},
			"Transitions": { "default": "end" }
		},
		"end": {
			"Type": "end"
		}
	}
}
```

## Step 5: Full Pipeline Orchestration

For a complete automated pipeline, combine pull and deploy into a single operation:

### Operation: Full Pull-and-Deploy Pipeline

```json
{
	"Name": "Full Remote Pull and Deploy",
	"Description": "Pull data from remote DataBeacon, ingest into Facto, and deploy projection to target MySQL",
	"Variables": {
		"SourceBeaconConnectionID": 1,
		"SourceTableName": "sales_orders",
		"SourceName": "Remote Warehouse",
		"DatasetName": "Sales Orders (Remote)",
		"RecordCap": 50000,
		"TargetStoreConnectionID": 1,
		"TargetTableName": "sales_orders_mirror"
	},
	"Nodes": {
		"start": {
			"Type": "start",
			"Transitions": { "default": "introspect-remote" }
		},
		"introspect-remote": {
			"Type": "beacon-task",
			"BeaconTags": { "role": "data-source" },
			"Capability": "DataBeaconManagement",
			"Action": "Introspect",
			"Settings": {
				"IDBeaconConnection": "{~D:Record.Operation.SourceBeaconConnectionID~}"
			},
			"Transitions": { "default": "read-records" }
		},
		"read-records": {
			"Type": "beacon-task",
			"BeaconTags": { "role": "data-source" },
			"Capability": "DataBeaconAccess",
			"Action": "ReadRecords",
			"Settings": {
				"IDBeaconConnection": "{~D:Record.Operation.SourceBeaconConnectionID~}",
				"TableName": "{~D:Record.Operation.SourceTableName~}",
				"Cap": "{~D:Record.Operation.RecordCap~}"
			},
			"Transitions": { "default": "create-source" }
		},
		"create-source": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateSource",
			"Settings": {
				"Name": "{~D:Record.Operation.SourceName~}",
				"Type": "beacon-pull"
			},
			"Transitions": { "default": "create-dataset" }
		},
		"create-dataset": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateDataset",
			"Settings": {
				"Name": "{~D:Record.Operation.DatasetName~}",
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
				"Records": "{~D:Record.TaskOutput.read-records.Records~}"
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
			"Transitions": { "default": "create-projection" }
		},
		"create-projection": {
			"Type": "beacon-task",
			"Capability": "FactoData",
			"Action": "CreateProjectionStore",
			"Settings": {
				"IDDataset": "{~D:Record.TaskOutput.create-dataset.Created.IDDataset~}",
				"IDStoreConnection": "{~D:Record.Operation.TargetStoreConnectionID~}",
				"TargetTableName": "{~D:Record.Operation.TargetTableName~}"
			},
			"Transitions": { "default": "deploy" }
		},
		"deploy": {
			"Type": "beacon-task",
			"Capability": "FactoDeploy",
			"Action": "DeploySchema",
			"Settings": {
				"IDProjectionStore": "{~D:Record.TaskOutput.create-projection.Created.IDProjectionStore~}"
			},
			"Transitions": { "default": "end" }
		},
		"end": {
			"Type": "end"
		}
	}
}
```

This single operation:
1. Introspects the remote database to ensure schema is current
2. Reads up to 50,000 records from the remote table
3. Creates a Facto Source and Dataset
4. Ingests all records into Facto
5. Creates a Projection Store targeting a local MySQL
6. Deploys the schema to the target MySQL

## Running the Pipeline

From the Ultravisor UI or API:

```bash
# Trigger the operation via Ultravisor API
curl -X POST http://ultravisor.hq.example.com:54321/1.0/Operation \
	-H 'Content-Type: application/json' \
	-d '{
		"Name": "Full Remote Pull and Deploy",
		"Settings": {
			"SourceBeaconConnectionID": 1,
			"SourceTableName": "sales_orders",
			"RecordCap": 50000,
			"TargetStoreConnectionID": 1,
			"TargetTableName": "sales_orders_mirror"
		}
	}'
```

## Scheduling Recurring Pulls

For ongoing synchronization, schedule the operation to run periodically:

```json
{
	"Name": "Nightly Sales Sync",
	"Schedule": "0 2 * * *",
	"Operation": "Full Remote Pull and Deploy",
	"Variables": {
		"SourceBeaconConnectionID": 1,
		"SourceTableName": "sales_orders",
		"RecordCap": 100000,
		"TargetStoreConnectionID": 1,
		"TargetTableName": "sales_orders_nightly"
	}
}
```

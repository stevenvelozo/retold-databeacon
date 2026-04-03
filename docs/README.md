# Retold DataBeacon

Retold DataBeacon is a deployable service that bridges access to remote databases. It runs on machines where you need to expose databases that are not directly reachable from your primary infrastructure -- as a Docker container, a global CLI tool, or embedded as a library in your own application. Point it at one or many databases and instantly get schema introspection, REST APIs, a web management interface, and Ultravisor beacon integration.

## Features

-- **Multi-Database Connectivity** -- Connect to MySQL, PostgreSQL, MSSQL, SQLite, MongoDB, RocksDB, and Solr through meadow-connection-manager. Mix and match databases from a single beacon instance.

-- **Schema Introspection** -- Automatically discover tables, columns, native types, primary keys, and constraints. Introspection results are persisted locally so you can browse schemas without re-querying the remote database.

-- **Dynamic REST Endpoints** -- Enable standard CRUD REST APIs for any introspected table with a single API call or button click. Endpoints follow Meadow conventions at `/1.0/{TableName}`.

-- **Ultravisor Beacon** -- Register as a beacon in the Ultravisor mesh, exposing DataBeaconAccess and DataBeaconManagement capabilities so other nodes can read records, run queries, introspect schemas, and manage endpoints remotely.

-- **Web UI** -- Built-in Pict-based web interface for managing connections, browsing introspected schemas, enabling endpoints, and monitoring beacon status.

-- **Docker-Ready** -- Multi-stage Dockerfile with SQLite persistence via volume mounts. One command to build, one command to run.

-- **CLI and Library** -- Use as a global CLI tool (`retold-databeacon serve`), a local development server, or embed as a `fable-serviceproviderbase` service in your own application.

-- **Facto Integration** -- Compatible with retold-facto projections for mapping remote database tables into the Facto data pipeline.

## Quick Start

```sh
# Install globally
npm install -g retold-databeacon

# Initialize the internal database and start the server
retold-databeacon serve
```

The server starts on port 8389 by default. Open `http://localhost:8389` to access the web UI, or use the REST API directly:

```sh
# Add a MySQL connection
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
		}
	}'

# Connect and introspect
curl -X POST http://localhost:8389/beacon/connection/1/connect
curl -X POST http://localhost:8389/beacon/connection/1/introspect

# Enable endpoints for a discovered table
curl -X POST http://localhost:8389/beacon/endpoint/1/Customer/enable

# Query records through the dynamic endpoint
curl http://localhost:8389/1.0/Customers/0/100
```

## Installation

```sh
npm install retold-databeacon
```

Or install globally for CLI usage:

```sh
npm install -g retold-databeacon
```

## Core Concepts

### Connections

A **Connection** is a named reference to an external database. Each connection stores its type (MySQL, PostgreSQL, MSSQL, SQLite), configuration (host, port, credentials, database name), and runtime status. Connections are persisted in the beacon's internal SQLite database so they survive restarts.

Connections are managed through the ConnectionBridge service, which combines persistence (CRUD against the BeaconConnection entity) with runtime connection management (delegating to `meadow-connection-manager` for actual connect, disconnect, and test operations).

### Introspection

**Introspection** queries a connected database's information schema (or SQLite pragmas) to discover every table, column, native type, primary key, and constraint. Results are persisted as IntrospectedTable records so you can browse schemas without hitting the remote database again.

Each introspected column is mapped to a Meadow type (AutoIdentity, Numeric, Boolean, DateTime, String) so that dynamic endpoints can generate correct schema objects automatically.

### Dynamic Endpoints

Once a table has been introspected, you can **enable endpoints** for it. This creates a Meadow DAL object and wires standard CRUD routes at `/1.0/{TableName}` -- supporting Create, Read, Reads (list), Update, and Delete operations. Each connection gets its own isolated Meadow instance so queries are routed to the correct external database provider.

Enabled endpoints are persisted and automatically re-enabled (warmed up) on service restart, provided their parent connection is live.

### Beacon Registration

DataBeacon can register as a **beacon** in the Ultravisor mesh. Two capabilities are exposed:

-- **DataBeaconAccess** -- Read operations: list connections, list tables, read records through enabled endpoints, execute read-only SQL queries.

-- **DataBeaconManagement** -- Write operations: introspect schemas, enable or disable endpoints.

This allows other Ultravisor nodes to interact with the beacon's connected databases without direct network access, using the Ultravisor work-item protocol.

## Configuration

DataBeacon accepts configuration through CLI flags, a JSON config file, or environment variables:

| Option | CLI Flag | Environment Variable | Default | Description |
|--------|----------|---------------------|---------|-------------|
| Port | `--port`, `-p` | `PORT` | `8389` | HTTP server port |
| Database Path | `--db`, `-d` | -- | `./data/databeacon.sqlite` | Internal SQLite file path |
| Config File | `--config`, `-c` | -- | -- | Path to a JSON config file |
| Log File | `--log`, `-l` | -- | -- | Write log output to a file |

When using the library API, configuration is passed as an options object to the `RetoldDataBeacon` service provider. Key options include:

| Option | Default | Description |
|--------|---------|-------------|
| `AutoStartOrator` | `true` | Start the web server automatically on init |
| `AutoCreateSchema` | `false` | Create internal SQLite tables if they do not exist |
| `WebAppPath` | Built-in path | Path to the web UI static files |
| `DataBeacon.RoutePrefix` | `/beacon` | Prefix for all beacon management routes |
| `Endpoints.MeadowEndpoints` | `true` | Enable internal Meadow entity CRUD routes |
| `Endpoints.ConnectionBridge` | `true` | Enable connection management routes |
| `Endpoints.SchemaIntrospector` | `true` | Enable introspection routes |
| `Endpoints.DynamicEndpointManager` | `true` | Enable dynamic endpoint routes |
| `Endpoints.BeaconProvider` | `true` | Enable Ultravisor beacon routes |
| `Endpoints.WebUI` | `true` | Serve the built-in web interface |

## Documentation

-- [Quick Start](quickstart.md) -- Get running in under five minutes
-- [Architecture](architecture.md) -- System design and service diagram
-- [API Reference](api/README.md) -- Per-service and per-route developer reference

## Related Packages

-- [fable](https://github.com/stevenvelozo/fable) -- Service dependency injection and configuration
-- [meadow](https://github.com/stevenvelozo/meadow) -- Data access layer and ORM
-- [meadow-endpoints](https://github.com/stevenvelozo/meadow-endpoints) -- Automatic REST endpoint generation from Meadow schemas
-- [meadow-connection-manager](https://github.com/stevenvelozo/meadow-connection-manager) -- Multi-database connection management
-- [orator](https://github.com/stevenvelozo/orator) -- API server abstraction
-- [retold-facto](https://github.com/stevenvelozo/retold-facto) -- Data warehouse and knowledge graph storage
-- [ultravisor](https://github.com/stevenvelozo/ultravisor) -- Workflow orchestration engine
-- [ultravisor-beacon](https://github.com/stevenvelozo/ultravisor-beacon) -- Beacon registration for Ultravisor mesh
-- [pict](https://github.com/stevenvelozo/pict) -- MVC framework for web applications

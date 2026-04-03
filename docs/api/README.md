# DataBeacon API Reference

DataBeacon is a deployable data beacon service built on the Retold ecosystem. It connects to remote databases, introspects their schemas, generates REST endpoints on the fly, and exposes capabilities to the Ultravisor mesh.

## Service Provider Pattern

DataBeacon follows the Retold service provider pattern. Every service extends `fable-serviceproviderbase` and registers itself with a Fable instance through `fable.serviceManager`. Once registered, each service can access logging, configuration, and sibling services via the shared Fable dependency-injection container.

```javascript
// Typical bootstrap
const libFable = require('fable');
const libRetoldDataBeacon = require('retold-databeacon');

let tmpFable = new libFable({ /* config */ });
tmpFable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
let tmpDataBeacon = tmpFable.serviceManager.instantiateServiceProvider('RetoldDataBeacon', tmpOptions);

tmpDataBeacon.initializeService(
	(pError) =>
	{
		if (pError) throw pError;
		console.log('DataBeacon is running');
	});
```

After initialization, sub-services are available on the Fable instance:

- `fable.DataBeaconConnectionBridge`
- `fable.DataBeaconSchemaIntrospector`
- `fable.DataBeaconDynamicEndpointManager`
- `fable.DataBeaconBeaconProvider`

## API Modules

| Service | Purpose | Reference |
|---------|---------|-----------|
| [RetoldDataBeacon](retold-databeacon.md) | Main service class -- initialization, shutdown, schema creation, model loading, endpoint configuration | Core |
| [DataBeaconConnectionBridge](connection-bridge.md) | External database connection lifecycle -- create, test, connect, disconnect, auto-reconnect | Connections |
| [DataBeaconSchemaIntrospector](schema-introspector.md) | Per-dialect schema discovery -- table listing, column description, type mapping, read-only queries | Introspection |
| [DataBeaconDynamicEndpointManager](dynamic-endpoint-manager.md) | On-the-fly CRUD endpoint generation from introspected schemas -- enable, disable, warm-up | Endpoints |
| [DataBeaconBeaconProvider](beacon-provider.md) | Ultravisor mesh integration -- beacon registration, capability exposure, remote data access | Beacon |
| [REST Endpoints](rest-endpoints.md) | Complete HTTP API reference for every route DataBeacon exposes | REST |

## Configuration

All services share the top-level options object passed to `RetoldDataBeacon`. See the [RetoldDataBeacon reference](retold-databeacon.md) for the full default options object and a description of each field.

## Endpoint Allow-List

Each endpoint group can be individually enabled or disabled through the `Endpoints` configuration key. The groups are:

- `MeadowEndpoints` -- internal DAL CRUD routes for BeaconConnection, IntrospectedTable, User
- `ConnectionBridge` -- `/beacon/connection*` routes
- `SchemaIntrospector` -- `/beacon/connection/:id/introspect`, `/tables`, `/table/:name`, `/query`
- `DynamicEndpointManager` -- `/beacon/endpoint*` routes
- `BeaconProvider` -- `/beacon/ultravisor*` routes
- `WebUI` -- static file serving for the built-in web interface

# DataBeaconSchemaIntrospector

Per-dialect schema introspection for external databases. Queries `information_schema` (MySQL, PostgreSQL, MSSQL) or `sqlite_master`/`PRAGMA` (SQLite) to discover tables and columns, then persists the results to the `IntrospectedTable` DAL entity.

**Module:** `source/services/DataBeacon-SchemaIntrospector.js`
**Service Type:** `DataBeaconSchemaIntrospector`

## connectRoutes(pOratorServiceServer)

Wires the schema introspection REST routes onto the provided Orator service server.

```javascript
fable.DataBeaconSchemaIntrospector.connectRoutes(fable.OratorServiceServer);
```

See the [REST route table](#rest-routes) below.

## introspect(pIDBeaconConnection, fCallback)

Full introspection pipeline for a live connection. Discovers all tables, describes their columns, maps types to Meadow equivalents, and persists results as `IntrospectedTable` records (upsert -- updates existing, creates new).

```javascript
fable.DataBeaconSchemaIntrospector.introspect(1,
	(pError, pResults) =>
	{
		if (pError) return console.error(pError);
		// pResults is an array of { TableName, RowCountEstimate, Columns }
		console.log(`Found ${pResults.length} tables`);
	});
```

**Parameters:**

- `pIDBeaconConnection` -- Integer ID of the BeaconConnection record (must be live/connected)
- `fCallback` -- Called with `(pError, pResults)` where `pResults` is an array of table objects

**Result element structure:**

```javascript
{
	TableName: 'Orders',
	RowCountEstimate: 15000,
	Columns: [
		{
			Name: 'IDOrder',
			NativeType: 'int',
			MaxLength: null,
			Nullable: false,
			IsPrimaryKey: true,
			IsAutoIncrement: true,
			DefaultValue: null,
			MeadowType: 'AutoIdentity'
		}
		// ... more columns
	]
}
```

## executeQuery(pIDBeaconConnection, pSQL, fCallback)

Executes a read-only query against an external database connection. Only `SELECT` statements are allowed -- any other statement type is rejected with an error.

```javascript
fable.DataBeaconSchemaIntrospector.executeQuery(1, 'SELECT * FROM Orders LIMIT 10',
	(pError, pResults) =>
	{
		if (pError) return console.error(pError);
		console.log(pResults); // Array of row objects
	});
```

**Parameters:**

- `pIDBeaconConnection` -- Integer ID of the BeaconConnection record (must be live)
- `pSQL` -- SQL query string (must begin with `SELECT`)
- `fCallback` -- Called with `(pError, pRows)`

Supported dialects for query execution: MySQL, PostgreSQL, SQLite. MSSQL query execution is not yet supported through this method.

## _getIntrospector(pType)

Returns a dialect-specific introspector object for the given connection type. The returned object provides two methods:

- `listTables(pProvider, fCallback)` -- Discovers all user tables
- `describeTable(pProvider, pTableName, fCallback)` -- Returns column definitions for a table

```javascript
let tmpIntrospector = fable.DataBeaconSchemaIntrospector._getIntrospector('MySQL');
```

**Supported types:** `MySQL`, `PostgreSQL`, `MSSQL`, `SQLite`

**Returns:** An introspector object, or `null` for unsupported types.

## Dialect-Specific SQL

### MySQL

**List tables:**

```sql
SELECT TABLE_NAME, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
	AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME
```

**Describe columns:**

```sql
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH,
	IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
ORDER BY ORDINAL_POSITION
```

### PostgreSQL

**List tables:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
	AND table_type = 'BASE TABLE'
ORDER BY table_name
```

**Describe columns:**

```sql
SELECT c.column_name, c.data_type, c.character_maximum_length,
	c.is_nullable, c.column_default,
	CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
FROM information_schema.columns c
LEFT JOIN (
	SELECT ku.column_name
	FROM information_schema.table_constraints tc
	JOIN information_schema.key_column_usage ku
		ON tc.constraint_name = ku.constraint_name
	WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
) pk ON pk.column_name = c.column_name
WHERE c.table_schema = 'public' AND c.table_name = $1
ORDER BY c.ordinal_position
```

### MSSQL

**List tables:**

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME
```

**Describe columns:**

```sql
SELECT c.COLUMN_NAME, c.DATA_TYPE, c.CHARACTER_MAXIMUM_LENGTH,
	c.IS_NULLABLE, c.COLUMN_DEFAULT,
	CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END AS IS_PRIMARY_KEY,
	COLUMNPROPERTY(
		OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME),
		c.COLUMN_NAME, 'IsIdentity'
	) AS IS_IDENTITY
FROM INFORMATION_SCHEMA.COLUMNS c
LEFT JOIN (
	SELECT ku.COLUMN_NAME
	FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
	JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
		ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
	WHERE tc.TABLE_NAME = @tableName AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
) pk ON pk.COLUMN_NAME = c.COLUMN_NAME
WHERE c.TABLE_NAME = @tableName
ORDER BY c.ORDINAL_POSITION
```

### SQLite

**List tables:**

```sql
SELECT name
FROM sqlite_master
WHERE type='table'
	AND name NOT LIKE 'sqlite_%'
ORDER BY name
```

**Describe columns:**

```sql
PRAGMA table_info("TableName")
```

## _mapNativeTypeToMeadow(pNativeType, pIsPrimaryKey, pIsAutoIncrement)

Maps a native database column type to its Meadow equivalent. If the column is both a primary key and auto-increment, returns `'AutoIdentity'` regardless of native type.

```javascript
let tmpType = fable.DataBeaconSchemaIntrospector._mapNativeTypeToMeadow('varchar', false, false);
// 'String'
```

### Type Mapping Table

| Native Type Pattern | Meadow Type |
|---------------------|-------------|
| PK + Auto-increment (any type) | `AutoIdentity` |
| `INT`, `TINYINT`, `SMALLINT`, `MEDIUMINT`, `BIGINT` | `Numeric` |
| `DECIMAL`, `NUMERIC`, `FLOAT`, `DOUBLE`, `REAL`, `MONEY`, `SMALLMONEY` | `Numeric` |
| `BOOLEAN`, `BOOL`, `BIT` | `Boolean` |
| `DATE`, `TIME`, `DATETIME`, `TIMESTAMP`, `YEAR` | `DateTime` |
| `CHAR`, `VARCHAR`, `TEXT`, `NTEXT`, `NCHAR`, `ENUM`, `SET`, `CLOB`, `VARYING`, `CHARACTER`, `XML`, `JSON`, `UUID`, `UNIQUEIDENTIFIER` | `String` |
| `BLOB`, `BINARY`, `VARBINARY`, `BYTEA`, `IMAGE` | `String` |
| Everything else | `String` |

## _mapSizeToMeadow(pMeadowType, pMaxLength, pNativeType)

Maps a Meadow type and native type to a Meadow schema size value.

```javascript
let tmpSize = fable.DataBeaconSchemaIntrospector._mapSizeToMeadow('Numeric', null, 'DECIMAL');
// 'decimal'
```

| Meadow Type | Size Logic |
|-------------|------------|
| `AutoIdentity` | `'Default'` |
| `Numeric` | `'decimal'` for DECIMAL/FLOAT/DOUBLE/REAL; `'int'` for integer types |
| `Boolean` | `'Default'` |
| `DateTime` | `'Default'` |
| `String` (with maxLength > 0) | The maxLength as a string (e.g., `'255'`) |
| `String` (no maxLength) | `'Default'` |

## REST Routes

All routes are prefixed with the configured `RoutePrefix` (default: `/beacon`).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/beacon/connection/:id/introspect` | Introspect all tables for a connected database |
| GET | `/beacon/connection/:id/tables` | List cached introspected tables |
| GET | `/beacon/connection/:id/table/:tableName` | Get column details for a specific table |
| POST | `/beacon/connection/:id/query` | Execute a read-only SQL query |

### POST /beacon/connection/:id/introspect

Runs the full introspection pipeline and persists results.

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
		}
	]
}
```

### GET /beacon/connection/:id/tables

Returns cached introspected tables for a connection. Does not re-introspect.

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

Returns column details for a specific introspected table.

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

Executes a read-only SQL query. Only `SELECT` statements are permitted.

**Request Body:**

```json
{
	"SQL": "SELECT * FROM Orders LIMIT 10"
}
```

**Response:**

```json
{
	"Success": true,
	"RowCount": 10,
	"Rows": [
		{ "IDOrder": 1, "CustomerName": "Acme Corp" }
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

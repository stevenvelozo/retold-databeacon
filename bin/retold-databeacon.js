#!/usr/bin/env node
/**
 * Retold DataBeacon — CLI Entry Point
 *
 * A deployable data beacon for connecting to remote databases,
 * introspecting schemas, generating REST endpoints, and exposing
 * beacon capabilities to the Ultravisor mesh.
 *
 * Subcommands:
 *   serve               Start the API server with web UI (default)
 *   init                Initialize the database schema
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libFable = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('../source/Retold-DataBeacon.js');

const libFs = require('fs');
const libPath = require('path');

// ================================================================
// CLI Argument Parsing
// ================================================================

let _CLIConfig = null;
let _CLILogPath = null;
let _CLIPort = null;
let _CLIDBPath = null;
let _CLICommand = 'serve';
let _CLIMode = 'server';  // 'server' (default, agent-on-customer) | 'client' (engineer laptop)

// Parse arguments
let tmpArgs = process.argv.slice(2);
let tmpPositionalIndex = 0;

for (let i = 0; i < tmpArgs.length; i++)
{
	let tmpArg = tmpArgs[i];

	if (tmpArg === '--config' || tmpArg === '-c')
	{
		if (tmpArgs[i + 1])
		{
			let tmpConfigPath = libPath.resolve(tmpArgs[i + 1]);
			try
			{
				let tmpRaw = libFs.readFileSync(tmpConfigPath, 'utf8');
				_CLIConfig = JSON.parse(tmpRaw);
				console.log(`Retold DataBeacon: Loaded config from ${tmpConfigPath}`);
			}
			catch (pConfigError)
			{
				console.error(`Retold DataBeacon: Failed to load config from ${tmpConfigPath}: ${pConfigError.message}`);
				process.exit(1);
			}
			i++;
		}
	}
	else if (tmpArg === '--port' || tmpArg === '-p')
	{
		if (tmpArgs[i + 1])
		{
			_CLIPort = parseInt(tmpArgs[i + 1], 10);
			i++;
		}
	}
	else if (tmpArg === '--db' || tmpArg === '-d')
	{
		if (tmpArgs[i + 1])
		{
			_CLIDBPath = libPath.resolve(tmpArgs[i + 1]);
			i++;
		}
	}
	else if (tmpArg === '--log' || tmpArg === '-l')
	{
		if (tmpArgs[i + 1] && !tmpArgs[i + 1].startsWith('-'))
		{
			_CLILogPath = libPath.resolve(tmpArgs[i + 1]);
			i++;
		}
		else
		{
			_CLILogPath = `${process.cwd()}/DataBeacon-Run-${Date.now()}.log`;
		}
	}
	else if (tmpArg === '--help' || tmpArg === '-h')
	{
		printHelp();
		process.exit(0);
	}
	else if (tmpArg === '--client')
	{
		_CLIMode = 'client';
	}
	else if (tmpArg === '--mode')
	{
		if (tmpArgs[i + 1])
		{
			let tmpModeValue = tmpArgs[i + 1].toLowerCase();
			if (tmpModeValue === 'client' || tmpModeValue === 'server')
			{
				_CLIMode = tmpModeValue;
			}
			else
			{
				console.error(`Retold DataBeacon: unknown --mode [${tmpArgs[i + 1]}] (expected: server | client)`);
				process.exit(1);
			}
			i++;
		}
	}
	else if (tmpArg.startsWith('--mode='))
	{
		let tmpModeValue = tmpArg.substring('--mode='.length).toLowerCase();
		if (tmpModeValue === 'client' || tmpModeValue === 'server')
		{
			_CLIMode = tmpModeValue;
		}
		else
		{
			console.error(`Retold DataBeacon: unknown --mode [${tmpModeValue}] (expected: server | client)`);
			process.exit(1);
		}
	}
	else if (!tmpArg.startsWith('-'))
	{
		if (tmpPositionalIndex === 0)
		{
			_CLICommand = tmpArg;
		}
		tmpPositionalIndex++;
	}
}

function printHelp()
{
	console.log(`
Retold DataBeacon — Remote Database Beacon Service

Usage:
  retold-databeacon [command] [options]

Commands:
  serve                Start the API server with web UI (default)
  init                 Initialize/create the database schema

Options:
  --config, -c <path>  Path to a JSON config file
  --port, -p <port>    Override the API server port (default: 8389)
  --db, -d <path>      Path to SQLite database file (default: ./data/databeacon.sqlite)
  --log, -l [path]     Write log output to a file
  --mode <server|client> Invocation mode (default: server)
  --client             Shorthand for --mode client
  --help, -h           Show this help

Modes:
  server               Default. Local data introspection + optional Ultravisor
                       beacon registration (runs on customer infrastructure).
  client               Engineer-laptop mode. Uses a user-scoped default DB
                       path (~/.retold/databeacon-client.sqlite) so client
                       state doesn't collide with project-local files. The
                       web UI still opens on the same port; connect to a
                       remote customer by adding a BeaconConnection row
                       with Type = RetoldDataBeacon.

Examples:
  retold-databeacon                              Start server on default port
  retold-databeacon serve --port 9000            Start server on port 9000
  retold-databeacon --client                     Engineer-mode (remote SQL client)
  retold-databeacon init                         Create database tables
  retold-databeacon serve --db /mnt/data/db.sqlite  Use external volume for DB
`);
}

// ================================================================
// Configuration
// ================================================================

// Default SQLite path depends on mode:
//   server  — ./data/databeacon.sqlite (project-local, matches Docker volume layouts)
//   client  — ~/.retold/databeacon-client.sqlite (user-scoped; engineer's mesh
//             connections shouldn't collide with any project-local sqlite file)
let _DefaultDBPath;
if (_CLIMode === 'client')
{
	let tmpHome = process.env.HOME || process.env.USERPROFILE || process.cwd();
	_DefaultDBPath = libPath.join(tmpHome, '.retold', 'databeacon-client.sqlite');
}
else
{
	_DefaultDBPath = libPath.join(process.cwd(), 'data', 'databeacon.sqlite');
}

let _Settings = (
	{
		Product: (_CLIMode === 'client') ? 'RetoldDataBeacon-Client' : 'RetoldDataBeacon',
		ProductVersion: '0.0.1',
		APIServerPort: _CLIPort || parseInt(process.env.PORT, 10) || 8389,
		LogStreams:
			[
				{
					streamtype: 'console'
				}
			],

		SQLite:
			{
				SQLiteFilePath: _CLIDBPath || _DefaultDBPath
			}
	});

// Merge CLI config if provided
if (_CLIConfig)
{
	Object.assign(_Settings, _CLIConfig);
}

if (_CLILogPath)
{
	_Settings.LogStreams.push(
		{
			loggertype: 'simpleflatfile',
			outputloglinestoconsole: false,
			showtimestamps: true,
			formattedtimestamps: true,
			level: 'trace',
			path: _CLILogPath
		});
}

// For non-serve commands, use quieter logging
if (_CLICommand !== 'serve')
{
	_Settings.LogStreams = [{ streamtype: 'console', level: 'warn' }];
}

// Ensure the data directory exists
let _DataDir = libPath.dirname(_Settings.SQLite.SQLiteFilePath);
if (_DataDir !== ':memory:' && !libFs.existsSync(_DataDir))
{
	libFs.mkdirSync(_DataDir, { recursive: true });
}

// ================================================================
// Bootstrap
// ================================================================

let _Fable = new libFable(_Settings);

_Fable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
_Fable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

_Fable.MeadowConnectionManager.connect('databeacon',
	{
		Type: 'SQLite',
		SQLiteFilePath: _Settings.SQLite.SQLiteFilePath
	},
	(pError, pConnection) =>
	{
		if (pError)
		{
			console.error(`SQLite connection error: ${pError}`);
			process.exit(1);
		}

		// Bridge: Meadow DAL providers look up fable.MeadowSQLiteProvider
		_Fable.MeadowSQLiteProvider = pConnection.instance;
		_Fable.settings.MeadowProvider = 'SQLite';

		switch (_CLICommand)
		{
			case 'serve':
				commandServe();
				break;
			case 'init':
				commandInit();
				break;
			default:
				console.error(`Unknown command: ${_CLICommand}`);
				printHelp();
				process.exit(1);
		}
	});

// ================================================================
// Command: serve
// ================================================================
function commandServe()
{
	_Fable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
	let tmpDataBeaconService = _Fable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
		{
			AutoCreateSchema: true,

			FullMeadowSchemaPath: libPath.join(__dirname, '..', 'model') + '/',
			FullMeadowSchemaFilename: 'MeadowModel-DataBeacon.json',

			Endpoints:
				{
					MeadowEndpoints: true,
					ConnectionBridge: true,
					SchemaIntrospector: true,
					DynamicEndpointManager: true,
					BeaconProvider: true,
					WebUI: true
				}
		});

	tmpDataBeaconService.initializeService(
		(pInitError) =>
		{
			if (pInitError)
			{
				_Fable.log.error(`Initialization error: ${pInitError}`);
				process.exit(1);
			}
			let tmpModeLabel = (_CLIMode === 'client') ? 'CLIENT MODE (remote-SQL explorer)' : 'SERVER MODE';
			_Fable.log.info(`Retold DataBeacon [${tmpModeLabel}] running on port ${_Settings.APIServerPort}`);
			_Fable.log.info(`API:     http://localhost:${_Settings.APIServerPort}/1.0/`);
			_Fable.log.info(`Beacon:  http://localhost:${_Settings.APIServerPort}/beacon/`);
			_Fable.log.info(`Web UI:  http://localhost:${_Settings.APIServerPort}/`);
			if (_CLIMode === 'client')
			{
				_Fable.log.info(`Client-mode DB: ${_Settings.SQLite.SQLiteFilePath}`);
				_Fable.log.info('Add a connection with Type="RetoldDataBeacon" to talk to a remote databeacon via Ultravisor.');
			}
		});
}

// ================================================================
// Command: init
// ================================================================
function commandInit()
{
	console.log('Initializing DataBeacon database schema...');
	try
	{
		_Fable.MeadowSQLiteProvider.db.exec(libRetoldDataBeacon.DATABEACON_SCHEMA_SQL);
		console.log('Schema created successfully.');
		console.log(`Database: ${_Settings.SQLite.SQLiteFilePath}`);
	}
	catch (pError)
	{
		console.error(`Error creating schema: ${pError.message}`);
		process.exit(1);
	}
	process.exit(0);
}

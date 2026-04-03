#!/usr/bin/env node
/**
 * DataBeacon + Facto Dev Server
 *
 * Starts both a DataBeacon server and a Facto server side by side
 * for manual inspection and testing. Both stay running until you
 * press Ctrl+C.
 *
 * Prerequisites:
 *   npm run docker-test-up  (start MySQL + PostgreSQL)
 *   npm run build           (build web UI bundle)
 *
 * Usage:
 *   npm run dev
 *   node test/dev-server.js
 *   node test/dev-server.js --beacon-port 8389 --facto-port 8420
 *
 * Then open:
 *   DataBeacon:  http://localhost:8389
 *   Facto:       http://localhost:8420
 */

'use strict';

const libPath = require('path');
const libFs = require('fs');

// ================================================================
// Parse CLI args
// ================================================================
let _BeaconPort = 8389;
let _FactoPort = 8420;

let tmpArgs = process.argv.slice(2);
for (let i = 0; i < tmpArgs.length; i++)
{
	if (tmpArgs[i] === '--beacon-port' && tmpArgs[i + 1])
	{
		_BeaconPort = parseInt(tmpArgs[i + 1], 10);
		i++;
	}
	else if (tmpArgs[i] === '--facto-port' && tmpArgs[i + 1])
	{
		_FactoPort = parseInt(tmpArgs[i + 1], 10);
		i++;
	}
}

// ================================================================
// Ensure data directory
// ================================================================
let _DataDir = libPath.join(__dirname, '..', 'data');
if (!libFs.existsSync(_DataDir))
{
	libFs.mkdirSync(_DataDir, { recursive: true });
}

let _BeaconDBPath = libPath.join(_DataDir, 'dev-databeacon.sqlite');
let _FactoDBPath = libPath.join(_DataDir, 'dev-facto.sqlite');

// ================================================================
// Start DataBeacon
// ================================================================
console.log('');
console.log('═══════════════════════════════════════════════════');
console.log('  Retold DataBeacon + Facto Dev Server');
console.log('═══════════════════════════════════════════════════');
console.log('');

const libPict = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('../source/Retold-DataBeacon.js');

let _BeaconFable = new libPict(
	{
		Product: 'RetoldDataBeacon-Dev',
		ProductVersion: '0.0.1',
		APIServerPort: _BeaconPort,
		LogStreams: [{ streamtype: 'console' }],
		SQLite: { SQLiteFilePath: _BeaconDBPath },
	});

_BeaconFable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
_BeaconFable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

_BeaconFable.MeadowConnectionManager.connect('databeacon',
	{ Type: 'SQLite', SQLiteFilePath: _BeaconDBPath },
	(pError, pConnection) =>
	{
		if (pError)
		{
			console.error('DataBeacon SQLite error:', pError);
			process.exit(1);
		}

		_BeaconFable.MeadowSQLiteProvider = pConnection.instance;
		_BeaconFable.settings.MeadowProvider = 'SQLite';

		_BeaconFable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
		let tmpBeacon = _BeaconFable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
			{
				AutoCreateSchema: true,
				AutoStartOrator: true,
				FullMeadowSchemaPath: libPath.join(__dirname, '..', 'model') + '/',
				FullMeadowSchemaFilename: 'MeadowModel-DataBeacon.json',
				Endpoints:
				{
					MeadowEndpoints: true,
					ConnectionBridge: true,
					SchemaIntrospector: true,
					DynamicEndpointManager: true,
					BeaconProvider: true,
					WebUI: true,
				},
			});

		tmpBeacon.initializeService(
			(pInitError) =>
			{
				if (pInitError)
				{
					console.error('DataBeacon init error:', pInitError);
					process.exit(1);
				}

				console.log(`  DataBeacon running on port ${_BeaconPort}`);
				console.log(`    Web UI:  http://localhost:${_BeaconPort}/`);
				console.log(`    API:     http://localhost:${_BeaconPort}/beacon/`);
				console.log('');

				// Now start Facto
				startFacto();
			});
	});

// ================================================================
// Start Facto
// ================================================================
function startFacto()
{
	let libRetoldFacto;
	try
	{
		libRetoldFacto = require('retold-facto');
	}
	catch (pError)
	{
		console.log('  Facto: not available (retold-facto not installed)');
		console.log('');
		printReady();
		return;
	}

	let tmpFactoFable = new libPict(
		{
			Product: 'RetoldFacto-Dev',
			ProductVersion: '0.0.1',
			APIServerPort: _FactoPort,
			LogStreams: [{ streamtype: 'console' }],
			SQLite: { SQLiteFilePath: _FactoDBPath },
		});

	tmpFactoFable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
	tmpFactoFable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

	tmpFactoFable.MeadowConnectionManager.connect('facto',
		{ Type: 'SQLite', SQLiteFilePath: _FactoDBPath },
		(pError, pConnection) =>
		{
			if (pError)
			{
				console.log('  Facto: SQLite error -', pError.message);
				printReady();
				return;
			}

			tmpFactoFable.MeadowSQLiteProvider = pConnection.instance;
			tmpFactoFable.settings.MeadowProvider = 'SQLite';

			tmpFactoFable.MeadowSQLiteProvider.db.exec(libRetoldFacto.FACTO_SCHEMA_SQL);

			let tmpFactoPath = libPath.dirname(require.resolve('retold-facto/package.json'));
			let tmpModelPath = libPath.join(tmpFactoPath, 'test', 'model') + '/';

			tmpFactoFable.serviceManager.addServiceType('RetoldFacto', libRetoldFacto);
			let tmpFacto = tmpFactoFable.serviceManager.instantiateServiceProvider('RetoldFacto',
				{
					StorageProvider: 'SQLite',
					AutoCreateSchema: false,
					AutoStartOrator: true,
					FullMeadowSchemaPath: tmpModelPath,
					FullMeadowSchemaFilename: 'MeadowModel-Extended.json',
					Endpoints:
					{
						MeadowEndpoints: true,
						SourceManager: true,
						RecordManager: true,
						DatasetManager: true,
						IngestEngine: true,
						ProjectionEngine: true,
						StoreConnectionManager: true,
						SchemaManager: true,
						WebUI: true,
					},
				});

			tmpFacto.initializeService(
				(pInitError) =>
				{
					if (pInitError)
					{
						console.log('  Facto: init error -', pInitError.message);
						printReady();
						return;
					}

					console.log(`  Facto running on port ${_FactoPort}`);
					console.log(`    Web UI:  http://localhost:${_FactoPort}/`);
					console.log(`    API:     http://localhost:${_FactoPort}/facto/`);
					console.log('');
					printReady();
				});
		});
}

function printReady()
{
	console.log('───────────────────────────────────────────────────');
	console.log('');
	console.log('  MySQL connection config (port 23389):');
	console.log('    Host: 127.0.0.1, Port: 23389');
	console.log('    Database: chinook, User: root, Password: testpassword');
	console.log('');
	console.log('  PostgreSQL connection config (port 25389):');
	console.log('    Host: 127.0.0.1, Port: 25389');
	console.log('    Database: chinook, User: postgres, Password: testpassword');
	console.log('');
	console.log('  Press Ctrl+C to stop all servers.');
	console.log('');
}

// Graceful shutdown
process.on('SIGINT', () =>
{
	console.log('\n  Shutting down...');
	process.exit(0);
});
process.on('SIGTERM', () =>
{
	process.exit(0);
});

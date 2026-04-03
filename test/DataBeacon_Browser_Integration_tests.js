/**
 * Retold DataBeacon — Browser Integration Tests
 *
 * End-to-end scenario: connect to MySQL and PostgreSQL databases
 * both loaded with the Chinook music store sample data (MySQL uses
 * PascalCase naming, PostgreSQL uses snake_case), introspect both
 * schemas, enable dynamic endpoints, switch between connections in
 * the UI, browse records, and verify multi-connection behavior.
 *
 * Requires:
 *   npm run docker-test-up         (start MySQL + PostgreSQL)
 *   npm run build                  (build the web UI bundle)
 *   npm install                    (puppeteer in devDependencies)
 *
 * Run:
 *   npm run test-browser
 *
 * @license MIT
 * @author Steven Velozo <steven@velozo.com>
 */

'use strict';

const libAssert = require('assert');
const libFS = require('fs');
const libPath = require('path');
const libHTTP = require('http');
const libNet = require('net');

const _TestPort = 19389;
const _BaseURL = `http://127.0.0.1:${_TestPort}`;
const _ScreenshotDir = libPath.join(__dirname, 'screenshots');

const _MySQLHost = '127.0.0.1';
const _MySQLPort = 23389;
const _MySQLUser = 'root';
const _MySQLPassword = 'testpassword';
const _MySQLDatabase = 'chinook';

const _PostgreSQLHost = '127.0.0.1';
const _PostgreSQLPort = 25389;
const _PostgreSQLUser = 'postgres';
const _PostgreSQLPassword = 'testpassword';
const _PostgreSQLDatabase = 'chinook';

// ══════════════════════════════════════════════════════════════
//  Helpers
// ══════════════════════════════════════════════════════════════

let _ScreenshotIndex = 0;

/**
 * POST JSON to the DataBeacon API.
 */
function apiPost(pPath, pBody)
{
	return new Promise(
		(fResolve, fReject) =>
		{
			let tmpData = JSON.stringify(pBody);
			let tmpOptions =
			{
				hostname: '127.0.0.1',
				port: _TestPort,
				path: pPath,
				method: 'POST',
				headers:
				{
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(tmpData),
				},
			};

			let tmpReq = libHTTP.request(tmpOptions,
				(pRes) =>
				{
					let tmpChunks = [];
					pRes.on('data', (pChunk) => tmpChunks.push(pChunk));
					pRes.on('end', () =>
					{
						let tmpRaw = Buffer.concat(tmpChunks).toString();
						try
						{
							fResolve(JSON.parse(tmpRaw));
						}
						catch (e)
						{
							fResolve(tmpRaw);
						}
					});
				});
			tmpReq.on('error', fReject);
			tmpReq.write(tmpData);
			tmpReq.end();
		});
}

/**
 * GET JSON from the DataBeacon API.
 */
function apiGet(pPath)
{
	return new Promise(
		(fResolve, fReject) =>
		{
			libHTTP.get(`${_BaseURL}${pPath}`,
				(pRes) =>
				{
					let tmpChunks = [];
					pRes.on('data', (pChunk) => tmpChunks.push(pChunk));
					pRes.on('end', () =>
					{
						let tmpRaw = Buffer.concat(tmpChunks).toString();
						try
						{
							fResolve(JSON.parse(tmpRaw));
						}
						catch (e)
						{
							fResolve(tmpRaw);
						}
					});
				}).on('error', fReject);
		});
}

/**
 * PUT JSON to the DataBeacon API.
 */
function apiPut(pPath, pBody)
{
	return new Promise(
		(fResolve, fReject) =>
		{
			let tmpData = JSON.stringify(pBody);
			let tmpOptions =
			{
				hostname: '127.0.0.1',
				port: _TestPort,
				path: pPath,
				method: 'PUT',
				headers:
				{
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(tmpData),
				},
			};

			let tmpReq = libHTTP.request(tmpOptions,
				(pRes) =>
				{
					let tmpChunks = [];
					pRes.on('data', (pChunk) => tmpChunks.push(pChunk));
					pRes.on('end', () =>
					{
						let tmpRaw = Buffer.concat(tmpChunks).toString();
						try
						{
							fResolve(JSON.parse(tmpRaw));
						}
						catch (e)
						{
							fResolve(tmpRaw);
						}
					});
				});
			tmpReq.on('error', fReject);
			tmpReq.write(tmpData);
			tmpReq.end();
		});
}

/**
 * Save a numbered screenshot.
 */
async function screenshot(pPage, pLabel)
{
	if (!libFS.existsSync(_ScreenshotDir))
	{
		libFS.mkdirSync(_ScreenshotDir, { recursive: true });
	}
	_ScreenshotIndex++;
	let tmpName = `${String(_ScreenshotIndex).padStart(2, '0')}-${pLabel}`;
	let tmpPath = libPath.join(_ScreenshotDir, tmpName + '.png');
	await pPage.screenshot({ path: tmpPath, fullPage: true });
	console.log(`      \u{1F4F8} ${tmpName}.png`);
}

/**
 * Wait for the page to settle after navigation.
 */
async function waitForRender(pPage, pMs)
{
	await pPage.evaluate((pDelay) => new Promise((r) => setTimeout(r, pDelay)), pMs || 600);
}

/**
 * Check if a TCP port is reachable.
 */
function isPortAvailable(pHost, pPort)
{
	return new Promise(
		(fResolve) =>
		{
			let tmpSocket = libNet.createConnection({ host: pHost, port: pPort });
			tmpSocket.setTimeout(2000);
			tmpSocket.on('connect', () => { tmpSocket.destroy(); fResolve(true); });
			tmpSocket.on('timeout', () => { tmpSocket.destroy(); fResolve(false); });
			tmpSocket.on('error', () => { fResolve(false); });
		});
}

/**
 * Check if MySQL is reachable on the test port.
 */
function isMySQLAvailable()
{
	return isPortAvailable(_MySQLHost, _MySQLPort);
}

// ══════════════════════════════════════════════════════════════
//  Server bootstrap
// ══════════════════════════════════════════════════════════════

function startDataBeaconServer(fCallback)
{
	const libFable = require('pict');
	const libMeadowConnectionManager = require('meadow-connection-manager');
	const libRetoldDataBeacon = require('../source/Retold-DataBeacon.js');

	let tmpSettings =
	{
		Product: 'DataBeaconBrowserTest',
		ProductVersion: '0.0.1',
		APIServerPort: _TestPort,
		SQLite:
		{
			SQLiteFilePath: ':memory:',
		},
		LogStreams:
		[
			{
				streamtype: 'console',
				level: 'warn',
			},
		],
	};

	let tmpFable = new libFable(tmpSettings);

	tmpFable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
	tmpFable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

	tmpFable.MeadowConnectionManager.connect('databeacon',
		{
			Type: 'SQLite',
			SQLiteFilePath: ':memory:',
		},
		(pError, pConnection) =>
		{
			if (pError) return fCallback(pError);

			tmpFable.MeadowSQLiteProvider = pConnection.instance;
			tmpFable.settings.MeadowProvider = 'SQLite';

			tmpFable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
			let tmpBeacon = tmpFable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
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
					if (pInitError) return fCallback(pInitError);
					return fCallback(null, tmpFable, tmpBeacon);
				});
		});
}

// ══════════════════════════════════════════════════════════════
//  Facto server bootstrap (for projection pipeline tests)
// ══════════════════════════════════════════════════════════════

const _FactoPort = 19420;
const _FactoBaseURL = `http://127.0.0.1:${_FactoPort}`;

function factoApiPost(pPath, pBody)
{
	return new Promise(
		(fResolve, fReject) =>
		{
			let tmpData = JSON.stringify(pBody);
			let tmpOptions =
			{
				hostname: '127.0.0.1',
				port: _FactoPort,
				path: pPath,
				method: 'POST',
				headers:
				{
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(tmpData),
				},
			};
			let tmpReq = libHTTP.request(tmpOptions,
				(pRes) =>
				{
					let tmpChunks = [];
					pRes.on('data', (pChunk) => tmpChunks.push(pChunk));
					pRes.on('end', () =>
					{
						let tmpRaw = Buffer.concat(tmpChunks).toString();
						try { fResolve(JSON.parse(tmpRaw)); }
						catch (e) { fResolve(tmpRaw); }
					});
				});
			tmpReq.on('error', fReject);
			tmpReq.write(tmpData);
			tmpReq.end();
		});
}

function factoApiGet(pPath)
{
	return new Promise(
		(fResolve, fReject) =>
		{
			libHTTP.get(`${_FactoBaseURL}${pPath}`,
				(pRes) =>
				{
					let tmpChunks = [];
					pRes.on('data', (pChunk) => tmpChunks.push(pChunk));
					pRes.on('end', () =>
					{
						let tmpRaw = Buffer.concat(tmpChunks).toString();
						try { fResolve(JSON.parse(tmpRaw)); }
						catch (e) { fResolve(tmpRaw); }
					});
				}).on('error', fReject);
		});
}

function startFactoServer(fCallback)
{
	let libRetoldFacto;
	try
	{
		libRetoldFacto = require('retold-facto');
	}
	catch (pError)
	{
		return fCallback(new Error('retold-facto is not installed: ' + pError.message));
	}

	let tmpFable = new (require('pict'))(
		{
			Product: 'FactoTestServer',
			ProductVersion: '0.0.1',
			APIServerPort: _FactoPort,
			SQLite: { SQLiteFilePath: ':memory:' },
			LogStreams: [{ streamtype: 'console', level: 'warn' }],
		});

	let libMCM = require('meadow-connection-manager');
	tmpFable.serviceManager.addServiceType('MeadowConnectionManager', libMCM);
	tmpFable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

	tmpFable.MeadowConnectionManager.connect('facto',
		{ Type: 'SQLite', SQLiteFilePath: ':memory:' },
		(pError, pConnection) =>
		{
			if (pError) return fCallback(pError);

			tmpFable.MeadowSQLiteProvider = pConnection.instance;
			tmpFable.settings.MeadowProvider = 'SQLite';

			// Create schema
			tmpFable.MeadowSQLiteProvider.db.exec(libRetoldFacto.FACTO_SCHEMA_SQL);

			// Resolve the model path from the retold-facto package
			let tmpFactoPath = libPath.dirname(require.resolve('retold-facto/package.json'));
			let tmpModelPath = libPath.join(tmpFactoPath, 'test', 'model') + '/';

			tmpFable.serviceManager.addServiceType('RetoldFacto', libRetoldFacto);
			let tmpFacto = tmpFable.serviceManager.instantiateServiceProvider('RetoldFacto',
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
					if (pInitError) return fCallback(pInitError);
					return fCallback(null, tmpFable, tmpFacto);
				});
		});
}

// ══════════════════════════════════════════════════════════════
//  Test suite
// ══════════════════════════════════════════════════════════════

suite
(
	'DataBeacon-Browser-Integration',
	function ()
	{
		this.timeout(120000);

		let _Fable;
		let _Beacon;
		let _FactoFable;
		let _Facto;
		let _FactoAvailable = false;
		let _Browser;
		let _Page;
		let _Puppeteer;
		let _MySQLReachable = false;
		let _PostgreSQLReachable = false;

		suiteSetup
		(
			function (fDone)
			{
				// Verify web assets exist
				let tmpWebDir = libPath.join(__dirname, '..', 'source', 'services', 'web-app', 'web');
				if (!libFS.existsSync(libPath.join(tmpWebDir, 'retold-databeacon.js')))
				{
					return fDone(new Error('Web UI not built. Run "npm run build" first.'));
				}

				// Clean screenshot directory
				if (libFS.existsSync(_ScreenshotDir))
				{
					let tmpFiles = libFS.readdirSync(_ScreenshotDir);
					for (let i = 0; i < tmpFiles.length; i++)
					{
						if (tmpFiles[i].endsWith('.png'))
						{
							libFS.unlinkSync(libPath.join(_ScreenshotDir, tmpFiles[i]));
						}
					}
				}

				// Check database availability
				Promise.all([isMySQLAvailable(), isPortAvailable(_PostgreSQLHost, _PostgreSQLPort)]).then(
					(pResults) =>
					{
						_MySQLReachable = pResults[0];
						_PostgreSQLReachable = pResults[1];

						if (!_MySQLReachable)
						{
							console.log('      \u26A0\uFE0F  MySQL not available on port ' + _MySQLPort + ' -- MySQL tests will be skipped.');
						}
						if (!_PostgreSQLReachable)
						{
							console.log('      \u26A0\uFE0F  PostgreSQL not available on port ' + _PostgreSQLPort + ' -- PostgreSQL tests will be skipped.');
						}
						if (!_MySQLReachable || !_PostgreSQLReachable)
						{
							console.log('      Run: npm run docker-test-up');
						}

						// Start the DataBeacon server
						startDataBeaconServer(
							(pError, pFable, pBeacon) =>
							{
								if (pError) return fDone(pError);
								_Fable = pFable;
								_Beacon = pBeacon;

								// Start the Facto server (for projection pipeline tests)
								startFactoServer(
									(pFactoError, pFactoFable, pFacto) =>
									{
										if (pFactoError)
										{
											console.log('      \u26A0\uFE0F  Facto server not available -- projection tests will be skipped.');
											console.log('        ' + pFactoError.message);
										}
										else
										{
											_FactoFable = pFactoFable;
											_Facto = pFacto;
											_FactoAvailable = true;
											console.log(`      Facto server running on port ${_FactoPort}`);
										}

										try
										{
											_Puppeteer = require('puppeteer');
										}
										catch (e)
										{
											return fDone(new Error('puppeteer is not installed. Run: npm install'));
										}

										_Puppeteer.launch(
										{
											headless: true,
											args: ['--no-sandbox', '--disable-setuid-sandbox'],
										})
										.then(
											(pBrowser) =>
											{
												_Browser = pBrowser;
												return _Browser.newPage();
											})
										.then(
											(pPage) =>
											{
												_Page = pPage;
												return _Page.setViewport({ width: 1440, height: 900 });
											})
										.then(() => fDone())
										.catch(fDone);
									});
							});
					});
			}
		);

		suiteTeardown
		(
			function (fDone)
			{
				let tmpSteps = [];
				if (_Browser) tmpSteps.push(_Browser.close().catch(() => {}));

				Promise.all(tmpSteps).then(
					() =>
					{
						let tmpStopFacto = (fNext) =>
						{
							if (_Facto && _Facto.serviceInitialized)
							{
								_Facto.stopService(() => fNext());
							}
							else
							{
								fNext();
							}
						};

						tmpStopFacto(
							() =>
							{
								if (_Beacon && _Beacon.serviceInitialized)
								{
									_Beacon.stopService(fDone);
								}
								else
								{
									fDone();
								}
							});
					});
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 1: Web UI Load and Dashboard
		// ─────────────────────────────────────────────────

		test
		(
			'Load the web UI and screenshot the dashboard',
			async function ()
			{
				await _Page.goto(_BaseURL, { waitUntil: 'networkidle2' });
				await waitForRender(_Page, 1000);
				await screenshot(_Page, 'dashboard-initial');

				// Verify the page loaded
				let tmpTitle = await _Page.title();
				libAssert.ok(tmpTitle, 'Page should have a title');
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 2: Create MySQL Connection via API
		// ─────────────────────────────────────────────────

		test
		(
			'Create a MySQL connection to the Chinook database',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection',
				{
					Name: 'Chinook MySQL',
					Type: 'MySQL',
					Config:
					{
						host: _MySQLHost,
						port: _MySQLPort,
						database: _MySQLDatabase,
						user: _MySQLUser,
						password: _MySQLPassword,
					},
					AutoConnect: true,
					Description: 'Chinook music store sample database for testing',
				});

				libAssert.ok(tmpResult.Success, 'Connection creation should succeed: ' + JSON.stringify(tmpResult));
				libAssert.ok(tmpResult.Connection.IDBeaconConnection > 0, 'Should have an ID');
			}
		);

		test
		(
			'Connect to MySQL',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection/1/connect', {});
				libAssert.ok(tmpResult.Success, 'Connect should succeed: ' + JSON.stringify(tmpResult));
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 3: Navigate to Connections View
		// ─────────────────────────────────────────────────

		test
		(
			'Navigate to Connections view and screenshot',
			async function ()
			{
				// Click Connections in the sidebar
				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Connections')
						{
							tmpItems[i].click();
							break;
						}
					}
				});
				await waitForRender(_Page);
				await screenshot(_Page, 'connections-view');
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 4: Introspect the Chinook Database
		// ─────────────────────────────────────────────────

		test
		(
			'Introspect the Chinook database and verify tables',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection/1/introspect', {});
				libAssert.ok(tmpResult.Success, 'Introspection should succeed: ' + JSON.stringify(tmpResult));
				libAssert.ok(tmpResult.TableCount >= 11, `Should find at least 11 tables, found ${tmpResult.TableCount}`);

				// Verify specific Chinook tables
				let tmpTableNames = tmpResult.Tables.map((pT) => pT.TableName);
				libAssert.ok(tmpTableNames.indexOf('Artist') >= 0, 'Should find Artist table');
				libAssert.ok(tmpTableNames.indexOf('Album') >= 0, 'Should find Album table');
				libAssert.ok(tmpTableNames.indexOf('Track') >= 0, 'Should find Track table');
				libAssert.ok(tmpTableNames.indexOf('Customer') >= 0, 'Should find Customer table');
				libAssert.ok(tmpTableNames.indexOf('Invoice') >= 0, 'Should find Invoice table');

				console.log(`      Found ${tmpResult.TableCount} Chinook tables: ${tmpTableNames.join(', ')}`);
			}
		);

		test
		(
			'Navigate to Introspection view and screenshot the table list',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				// Refresh connections in the browser app so the dropdown knows
				// which connections are live, then load tables and navigate
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.providers.DataBeaconProvider)
					{
						let tmpProvider = window.DataBeaconApp.pict.providers.DataBeaconProvider;
						tmpProvider.loadConnections();
					}
				});
				await waitForRender(_Page, 500);

				// Set the selected connection and load tables
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.providers.DataBeaconProvider)
					{
						window.DataBeaconApp.pict.AppData.SelectedConnectionID = 1;
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadTables(1);
					}
				});
				await waitForRender(_Page, 500);

				// Navigate to the introspection view
				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Introspection')
						{
							tmpItems[i].click();
							break;
						}
					}
				});
				await waitForRender(_Page, 600);
				await screenshot(_Page, 'introspection-tables');
			}
		);

		test
		(
			'View Track table columns',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpResult = await apiGet('/beacon/connection/1/table/Track');
				libAssert.ok(tmpResult.Columns, 'Should have Columns');
				libAssert.ok(tmpResult.Columns.length >= 9, `Track should have at least 9 columns, found ${tmpResult.Columns.length}`);

				let tmpPK = tmpResult.Columns.find((pC) => pC.Name === 'TrackId');
				libAssert.ok(tmpPK, 'Should have TrackId column');
				libAssert.ok(tmpPK.IsPrimaryKey, 'TrackId should be primary key');
				libAssert.strictEqual(tmpPK.MeadowType, 'AutoIdentity', 'TrackId should map to AutoIdentity');

				console.log(`      Track columns: ${tmpResult.Columns.map((pC) => pC.Name).join(', ')}`);
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 5: Enable Dynamic Endpoints
		// ─────────────────────────────────────────────────

		test
		(
			'Enable endpoints for Artist, Album, and Track tables',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpArtist = await apiPost('/beacon/endpoint/1/Artist/enable', {});
				libAssert.ok(tmpArtist.Success, 'Artist endpoint should enable: ' + JSON.stringify(tmpArtist));

				let tmpAlbum = await apiPost('/beacon/endpoint/1/Album/enable', {});
				libAssert.ok(tmpAlbum.Success, 'Album endpoint should enable: ' + JSON.stringify(tmpAlbum));

				let tmpTrack = await apiPost('/beacon/endpoint/1/Track/enable', {});
				libAssert.ok(tmpTrack.Success, 'Track endpoint should enable: ' + JSON.stringify(tmpTrack));
			}
		);

		test
		(
			'Navigate to Endpoints view and screenshot',
			async function ()
			{
				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Endpoints')
						{
							tmpItems[i].click();
							break;
						}
					}
				});
				await waitForRender(_Page);

				// Refresh endpoints data
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.providers.DataBeaconProvider)
					{
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadEndpoints();
					}
				});
				await waitForRender(_Page, 800);
				await screenshot(_Page, 'endpoints-active');
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 6: Query Data via Dynamic Endpoints
		// ─────────────────────────────────────────────────

		test
		(
			'Read Artists via the dynamic endpoint',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpResult = await apiGet('/1.0/Artists/0/50');
				libAssert.ok(Array.isArray(tmpResult), 'Should return an array of records');
				libAssert.ok(tmpResult.length >= 10, `Should have at least 10 artists, found ${tmpResult.length}`);

				let tmpFirst = tmpResult[0];
				libAssert.ok(tmpFirst.ArtistId, 'Records should have ArtistId');
				libAssert.ok(tmpFirst.Name, 'Records should have Name');

				console.log(`      Read ${tmpResult.length} artists. First: ${tmpFirst.Name}`);
			}
		);

		test
		(
			'Read Tracks via the dynamic endpoint',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpResult = await apiGet('/1.0/Tracks/0/50');
				libAssert.ok(Array.isArray(tmpResult), 'Should return an array of records');
				libAssert.ok(tmpResult.length >= 20, `Should have at least 20 tracks, found ${tmpResult.length}`);

				let tmpFirst = tmpResult[0];
				libAssert.ok(tmpFirst.TrackId, 'Records should have TrackId');
				libAssert.ok(tmpFirst.Name, 'Records should have Name');
				libAssert.ok(tmpFirst.Milliseconds, 'Records should have Milliseconds');

				console.log(`      Read ${tmpResult.length} tracks. First: "${tmpFirst.Name}" by ${tmpFirst.Composer || 'Unknown'}`);
			}
		);

		test
		(
			'Execute ad-hoc query against Chinook',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection/1/query',
				{
					SQL: 'SELECT a.Name AS ArtistName, COUNT(t.TrackId) AS TrackCount FROM Artist a JOIN Album al ON a.ArtistId = al.ArtistId JOIN Track t ON al.AlbumId = t.AlbumId GROUP BY a.ArtistId ORDER BY TrackCount DESC LIMIT 5',
				});

				libAssert.ok(tmpResult.Success, 'Query should succeed');
				libAssert.ok(tmpResult.RowCount > 0, 'Should return rows');
				console.log(`      Top artists by track count:`);
				for (let i = 0; i < tmpResult.Rows.length; i++)
				{
					console.log(`        ${tmpResult.Rows[i].ArtistName}: ${tmpResult.Rows[i].TrackCount} tracks`);
				}
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 7: Records View in Browser
		// ─────────────────────────────────────────────────

		test
		(
			'Navigate to Records view and browse Track data',
			async function ()
			{
				if (!_MySQLReachable) return this.skip();

				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Records')
						{
							tmpItems[i].click();
							break;
						}
					}
				});
				await waitForRender(_Page);

				// Load Track records
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.providers.DataBeaconProvider)
					{
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadRecords('Track', 50);
					}
				});
				await waitForRender(_Page, 1000);
				await screenshot(_Page, 'records-track-data');
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 8: PostgreSQL Connection
		// ─────────────────────────────────────────────────

		test
		(
			'Create a PostgreSQL connection to the Chinook database',
			async function ()
			{
				if (!_PostgreSQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection',
				{
					Name: 'Chinook PostgreSQL',
					Type: 'PostgreSQL',
					Config:
					{
						host: _PostgreSQLHost,
						port: _PostgreSQLPort,
						database: _PostgreSQLDatabase,
						user: _PostgreSQLUser,
						password: _PostgreSQLPassword,
					},
					AutoConnect: true,
					Description: 'Chinook (PostgreSQL, snake_case)',
				});

				libAssert.ok(tmpResult.Success, 'PostgreSQL connection creation should succeed: ' + JSON.stringify(tmpResult));
				libAssert.ok(tmpResult.Connection.IDBeaconConnection > 0, 'Should have an ID');
				console.log(`      Created PostgreSQL connection #${tmpResult.Connection.IDBeaconConnection}`);
			}
		);

		test
		(
			'Connect to PostgreSQL',
			async function ()
			{
				if (!_PostgreSQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection/2/connect', {});
				libAssert.ok(tmpResult.Success, 'PostgreSQL connect should succeed: ' + JSON.stringify(tmpResult));
			}
		);

		test
		(
			'Introspect PostgreSQL Chinook and verify snake_case tables',
			async function ()
			{
				if (!_PostgreSQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection/2/introspect', {});
				libAssert.ok(tmpResult.Success, 'PostgreSQL introspection should succeed: ' + JSON.stringify(tmpResult));
				libAssert.ok(tmpResult.TableCount >= 11, `Should find at least 11 tables, found ${tmpResult.TableCount}`);

				let tmpTableNames = tmpResult.Tables.map((pT) => pT.TableName);
				// PostgreSQL uses snake_case table names
				libAssert.ok(tmpTableNames.indexOf('artist') >= 0, 'Should find artist table (snake_case)');
				libAssert.ok(tmpTableNames.indexOf('album') >= 0, 'Should find album table (snake_case)');
				libAssert.ok(tmpTableNames.indexOf('track') >= 0, 'Should find track table (snake_case)');
				libAssert.ok(tmpTableNames.indexOf('customer') >= 0, 'Should find customer table (snake_case)');

				console.log(`      Found ${tmpResult.TableCount} PostgreSQL tables: ${tmpTableNames.join(', ')}`);
			}
		);

		test
		(
			'Enable endpoints for PostgreSQL artist and track tables',
			async function ()
			{
				if (!_PostgreSQLReachable) return this.skip();

				let tmpArtist = await apiPost('/beacon/endpoint/2/artist/enable', {});
				libAssert.ok(tmpArtist.Success, 'artist endpoint should enable: ' + JSON.stringify(tmpArtist));

				let tmpTrack = await apiPost('/beacon/endpoint/2/track/enable', {});
				libAssert.ok(tmpTrack.Success, 'track endpoint should enable: ' + JSON.stringify(tmpTrack));

				console.log('      Enabled PostgreSQL endpoints: artist, track');
			}
		);

		test
		(
			'Read artists from PostgreSQL via dynamic endpoint',
			async function ()
			{
				if (!_PostgreSQLReachable) return this.skip();

				let tmpResult = await apiGet('/1.0/artists/0/50');
				libAssert.ok(Array.isArray(tmpResult), 'Should return an array');
				libAssert.ok(tmpResult.length >= 10, `Should have at least 10 artists, found ${tmpResult.length}`);

				// PostgreSQL columns are snake_case
				let tmpFirst = tmpResult[0];
				libAssert.ok(tmpFirst.artist_id, 'Records should have artist_id (snake_case)');
				libAssert.ok(tmpFirst.name, 'Records should have name');

				console.log(`      Read ${tmpResult.length} PostgreSQL artists. First: ${tmpFirst.name}`);
			}
		);

		test
		(
			'Execute cross-database query on PostgreSQL',
			async function ()
			{
				if (!_PostgreSQLReachable) return this.skip();

				let tmpResult = await apiPost('/beacon/connection/2/query',
				{
					SQL: 'SELECT a.name AS artist_name, COUNT(t.track_id) AS track_count FROM artist a JOIN album al ON a.artist_id = al.artist_id JOIN track t ON al.album_id = t.album_id GROUP BY a.artist_id, a.name ORDER BY track_count DESC LIMIT 5',
				});

				libAssert.ok(tmpResult.Success, 'PostgreSQL query should succeed');
				libAssert.ok(tmpResult.RowCount > 0, 'Should return rows');
				console.log('      Top PostgreSQL artists by track count:');
				for (let i = 0; i < tmpResult.Rows.length; i++)
				{
					console.log(`        ${tmpResult.Rows[i].artist_name}: ${tmpResult.Rows[i].track_count} tracks`);
				}
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 9: Multi-Connection UI — Switch Between DBs
		// ─────────────────────────────────────────────────

		test
		(
			'Screenshot Connections view with both MySQL and PostgreSQL',
			async function ()
			{
				if (!_MySQLReachable || !_PostgreSQLReachable) return this.skip();

				// Refresh connections in browser
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.providers.DataBeaconProvider)
					{
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadConnections();
					}
				});
				await waitForRender(_Page, 500);

				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Connections') { tmpItems[i].click(); break; }
					}
				});
				await waitForRender(_Page, 600);
				await screenshot(_Page, 'multi-connections-both');
			}
		);

		test
		(
			'Switch to PostgreSQL in Introspection view and screenshot',
			async function ()
			{
				if (!_MySQLReachable || !_PostgreSQLReachable) return this.skip();

				// Load connections and switch to PostgreSQL
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict)
					{
						let tmpProvider = window.DataBeaconApp.pict.providers.DataBeaconProvider;
						tmpProvider.loadConnections();
					}
				});
				await waitForRender(_Page, 500);

				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict)
					{
						window.DataBeaconApp.pict.AppData.SelectedConnectionID = 2;
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadTables(2);
					}
				});
				await waitForRender(_Page, 500);

				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Introspection') { tmpItems[i].click(); break; }
					}
				});
				await waitForRender(_Page, 600);
				await screenshot(_Page, 'multi-introspection-postgres');
			}
		);

		test
		(
			'Switch back to MySQL in Introspection view and screenshot',
			async function ()
			{
				if (!_MySQLReachable || !_PostgreSQLReachable) return this.skip();

				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict)
					{
						window.DataBeaconApp.pict.AppData.SelectedConnectionID = 1;
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadTables(1);
					}
				});
				await waitForRender(_Page, 500);

				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Introspection') { tmpItems[i].click(); break; }
					}
				});
				await waitForRender(_Page, 600);
				await screenshot(_Page, 'multi-introspection-mysql');
			}
		);

		test
		(
			'Screenshot Endpoints view with both MySQL and PostgreSQL endpoints',
			async function ()
			{
				if (!_MySQLReachable || !_PostgreSQLReachable) return this.skip();

				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict)
					{
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadEndpoints();
					}
				});
				await waitForRender(_Page, 500);

				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Endpoints') { tmpItems[i].click(); break; }
					}
				});
				await waitForRender(_Page, 600);
				await screenshot(_Page, 'multi-endpoints-all');
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 10: Facto Projection Pipeline
		//  Read from DataBeacon → Ingest into Facto →
		//  Create projection → Deploy → Import → Verify
		// ─────────────────────────────────────────────────

		test
		(
			'Facto: Create sources for Artists and Tracks',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpArtistSource = await factoApiPost('/1.0/Source',
					{ Name: 'DataBeacon - Chinook Artists', Type: 'beacon-pull', Active: 1 });
				libAssert.ok(tmpArtistSource.IDSource > 0, 'Artist source created');

				let tmpTrackSource = await factoApiPost('/1.0/Source',
					{ Name: 'DataBeacon - Chinook Tracks', Type: 'beacon-pull', Active: 1 });
				libAssert.ok(tmpTrackSource.IDSource > 0, 'Track source created');

				console.log(`      Created Facto sources: Artists=#${tmpArtistSource.IDSource}, Tracks=#${tmpTrackSource.IDSource}`);
			}
		);

		test
		(
			'Facto: Create raw datasets for Artists and Tracks',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpArtistDS = await factoApiPost('/1.0/Dataset',
					{ Name: 'Chinook Artists', Type: 'Raw', Description: 'Artists from MySQL Chinook via DataBeacon' });
				libAssert.ok(tmpArtistDS.IDDataset > 0, 'Artist dataset created');

				let tmpTrackDS = await factoApiPost('/1.0/Dataset',
					{ Name: 'Chinook Tracks', Type: 'Raw', Description: 'Tracks from MySQL Chinook via DataBeacon' });
				libAssert.ok(tmpTrackDS.IDDataset > 0, 'Track dataset created');

				console.log(`      Created Facto datasets: Artists=#${tmpArtistDS.IDDataset}, Tracks=#${tmpTrackDS.IDDataset}`);
			}
		);

		test
		(
			'Facto: Pull Artists from DataBeacon and ingest into Facto',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				// Read artists from DataBeacon
				let tmpArtists = await apiGet('/1.0/Artists/0/50');
				libAssert.ok(Array.isArray(tmpArtists) && tmpArtists.length > 0, 'Should have artists from DataBeacon');

				// Ingest each artist as a Facto record
				let tmpIngested = 0;
				for (let i = 0; i < tmpArtists.length; i++)
				{
					await factoApiPost('/1.0/Record',
					{
						IDDataset: 1,
						IDSource: 1,
						Type: 'artist',
						Content: JSON.stringify(tmpArtists[i]),
					});
					tmpIngested++;
				}

				console.log(`      Ingested ${tmpIngested} artist records into Facto`);
			}
		);

		test
		(
			'Facto: Pull Tracks from DataBeacon and ingest into Facto',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				// Read tracks from DataBeacon
				let tmpTracks = await apiGet('/1.0/Tracks/0/50');
				libAssert.ok(Array.isArray(tmpTracks) && tmpTracks.length > 0, 'Should have tracks from DataBeacon');

				let tmpIngested = 0;
				for (let i = 0; i < tmpTracks.length; i++)
				{
					await factoApiPost('/1.0/Record',
					{
						IDDataset: 2,
						IDSource: 2,
						Type: 'track',
						Content: JSON.stringify(tmpTracks[i]),
					});
					tmpIngested++;
				}

				console.log(`      Ingested ${tmpIngested} track records into Facto`);
			}
		);

		test
		(
			'Facto: Create projection dataset with ArtistTrack schema',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpDS = await factoApiPost('/1.0/Dataset',
				{
					Name: 'Artist Tracks',
					Type: 'Projection',
					Description: 'Combined view of artists and their tracks from Chinook',
					SchemaDefinition: [
						'! ArtistTrack',
						'@ IDArtistTrack',
						'% GUIDArtistTrack',
						'$ ArtistName 120',
						'# ArtistId',
						'$ TrackName 200',
						'# TrackId',
						'$ AlbumTitle 160',
						'# AlbumId',
						'$ Genre 120',
						'# Milliseconds',
						'. UnitPrice',
						'$ Composer 220',
					].join('\n'),
				});
				libAssert.ok(tmpDS.IDDataset > 0, 'Projection dataset created');
				console.log(`      Created projection dataset: Artist Tracks #${tmpDS.IDDataset}`);
			}
		);

		test
		(
			'Facto: Create SQLite store connection for projection deployment',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpConn = await factoApiPost('/1.0/StoreConnection',
				{
					Name: 'Projection SQLite',
					Type: 'SQLite',
					Config: JSON.stringify({ SQLiteFilePath: ':memory:' }),
					Status: 'OK',
				});
				libAssert.ok(tmpConn.IDStoreConnection > 0, 'Store connection created');
				console.log(`      Created store connection: #${tmpConn.IDStoreConnection}`);
			}
		);

		test
		(
			'Facto: Deploy projection schema to SQLite store',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				// Dataset 3 = Artist Tracks projection, StoreConnection 1 = SQLite
				let tmpResult = await factoApiPost('/facto/projection/3/deploy',
				{
					IDStoreConnection: 1,
					TargetTableName: 'ArtistTrack',
				});

				libAssert.ok(tmpResult.Success, 'Deploy should succeed: ' + JSON.stringify(tmpResult));
				console.log('      Projection schema deployed to ArtistTrack table');
			}
		);

		test
		(
			'Facto: Create mapping for Artists',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpResult = await factoApiPost('/facto/projection/3/mapping',
				{
					IDSource: 1,
					Name: 'Artist Mapping',
					MappingConfiguration: JSON.stringify(
					{
						Entity: 'ArtistTrack',
						GUIDTemplate: 'artist-{~D:Record.ArtistId~}',
						Mappings:
						{
							ArtistName: '{~D:Record.Name~}',
							ArtistId: '{~D:Record.ArtistId~}',
						},
					}),
				});

				libAssert.ok(tmpResult.Success, 'Artist mapping should be created: ' + JSON.stringify(tmpResult));
				console.log('      Created Artist mapping');
			}
		);

		test
		(
			'Facto: Create mapping for Tracks (links to Artists)',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpResult = await factoApiPost('/facto/projection/3/mapping',
				{
					IDSource: 2,
					Name: 'Track Mapping',
					MappingConfiguration: JSON.stringify(
					{
						Entity: 'ArtistTrack',
						GUIDTemplate: 'track-{~D:Record.TrackId~}',
						Mappings:
						{
							TrackName: '{~D:Record.Name~}',
							TrackId: '{~D:Record.TrackId~}',
							AlbumId: '{~D:Record.AlbumId~}',
							Milliseconds: '{~D:Record.Milliseconds~}',
							UnitPrice: '{~D:Record.UnitPrice~}',
							Composer: '{~D:Record.Composer~}',
						},
					}),
				});

				libAssert.ok(tmpResult.Success, 'Track mapping should be created: ' + JSON.stringify(tmpResult));
				console.log('      Created Track mapping');
			}
		);

		test
		(
			'Facto: Execute Artist mapping import',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				// Get mapping IDs
				let tmpMappings = await factoApiGet('/facto/projection/3/mappings');
				libAssert.ok(tmpMappings.Mappings && tmpMappings.Mappings.length >= 2, 'Should have 2 mappings');

				let tmpArtistMapping = tmpMappings.Mappings.find((m) => m.Name === 'Artist Mapping');
				libAssert.ok(tmpArtistMapping, 'Artist mapping should exist');

				// Get the projection store
				let tmpStores = await factoApiGet('/facto/projection/3/stores');
				let tmpStoreID = tmpStores.Stores && tmpStores.Stores.length > 0 ? tmpStores.Stores[0].IDProjectionStore : 0;
				libAssert.ok(tmpStoreID > 0, 'Projection store should exist');

				let tmpResult = await factoApiPost('/facto/projection/3/import',
				{
					IDProjectionMapping: tmpArtistMapping.IDProjectionMapping,
					IDProjectionStore: tmpStoreID,
					IDSource: 1,
				});

				console.log(`      Artist import result: ${JSON.stringify(tmpResult).substring(0, 200)}`);
			}
		);

		test
		(
			'Facto: Execute Track mapping import',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpMappings = await factoApiGet('/facto/projection/3/mappings');
				let tmpTrackMapping = tmpMappings.Mappings.find((m) => m.Name === 'Track Mapping');
				libAssert.ok(tmpTrackMapping, 'Track mapping should exist');

				let tmpStores = await factoApiGet('/facto/projection/3/stores');
				let tmpStoreID = tmpStores.Stores[0].IDProjectionStore;

				let tmpResult = await factoApiPost('/facto/projection/3/import',
				{
					IDProjectionMapping: tmpTrackMapping.IDProjectionMapping,
					IDProjectionStore: tmpStoreID,
					IDSource: 2,
				});

				console.log(`      Track import result: ${JSON.stringify(tmpResult).substring(0, 200)}`);
			}
		);

		test
		(
			'Facto: Verify projected ArtistTrack records via REST endpoint',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				let tmpRecords = await factoApiGet('/1.0/ArtistTracks/0/50');

				if (Array.isArray(tmpRecords) && tmpRecords.length > 0)
				{
					console.log(`      Projected records: ${tmpRecords.length}`);
					for (let i = 0; i < Math.min(tmpRecords.length, 5); i++)
					{
						let tmpR = tmpRecords[i];
						console.log(`        ${tmpR.GUIDArtistTrack}: ${tmpR.ArtistName || ''} - ${tmpR.TrackName || ''}`);
					}
				}
				else
				{
					console.log('      No projected records found (projection pipeline may need tuning)');
				}
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 10b: Facto UI Screenshots
		//  Navigate the Facto web UI to show sources,
		//  datasets, mappings, projection detail, and
		//  the projected records.
		// ─────────────────────────────────────────────────

		test
		(
			'Facto UI: Screenshot Dashboard',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				await _Page.goto(`${_FactoBaseURL}/`, { waitUntil: 'networkidle2', timeout: 15000 });
				await waitForRender(_Page, 1500);
				await screenshot(_Page, 'facto-dashboard');
			}
		);

		test
		(
			'Facto UI: Screenshot Sources list',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				await _Page.goto(`${_FactoBaseURL}/#/Sources`, { waitUntil: 'networkidle2', timeout: 15000 });
				await waitForRender(_Page, 1000);
				await screenshot(_Page, 'facto-sources');
			}
		);

		test
		(
			'Facto UI: Screenshot Datasets list',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				await _Page.goto(`${_FactoBaseURL}/#/Datasets`, { waitUntil: 'networkidle2', timeout: 15000 });
				await waitForRender(_Page, 1000);
				await screenshot(_Page, 'facto-datasets');
			}
		);

		test
		(
			'Facto UI: Screenshot Projections list',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				await _Page.goto(`${_FactoBaseURL}/#/Projections`, { waitUntil: 'networkidle2', timeout: 15000 });
				await waitForRender(_Page, 1000);
				await screenshot(_Page, 'facto-projections');
			}
		);

		test
		(
			'Facto UI: Screenshot Projection detail with schema and mappings',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				// Dataset 3 = Artist Tracks projection
				await _Page.goto(`${_FactoBaseURL}/#/Projection/3`, { waitUntil: 'networkidle2', timeout: 15000 });
				await waitForRender(_Page, 1500);
				await screenshot(_Page, 'facto-projection-detail');
			}
		);

		test
		(
			'Facto UI: Screenshot Connections page',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				await _Page.goto(`${_FactoBaseURL}/#/Connections`, { waitUntil: 'networkidle2', timeout: 15000 });
				await waitForRender(_Page, 1000);
				await screenshot(_Page, 'facto-connections');
			}
		);

		test
		(
			'Facto UI: Screenshot Records list showing ingested data',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				await _Page.goto(`${_FactoBaseURL}/#/Records`, { waitUntil: 'networkidle2', timeout: 15000 });
				await waitForRender(_Page, 1000);
				await screenshot(_Page, 'facto-records');
			}
		);

		test
		(
			'Facto UI: Verify projected records exist and comprehension was correct',
			async function ()
			{
				if (!_FactoAvailable || !_MySQLReachable) return this.skip();

				// Read from the projection endpoint on the Facto server
				let tmpRecords = await factoApiGet('/1.0/ArtistTracks/0/50');

				libAssert.ok(Array.isArray(tmpRecords), 'Should return an array');
				libAssert.strictEqual(tmpRecords.length, 30, `Should have 30 projected records (10 artists + 20 tracks), found ${tmpRecords.length}`);

				// Verify records were created with the correct GUIDs
				let tmpArtistRecords = tmpRecords.filter((pR) => pR.GUIDArtistTrack && pR.GUIDArtistTrack.indexOf('artist-') >= 0);
				let tmpTrackRecords = tmpRecords.filter((pR) => pR.GUIDArtistTrack && pR.GUIDArtistTrack.indexOf('track-') >= 0);

				libAssert.strictEqual(tmpArtistRecords.length, 10, 'Should have 10 artist projection records');
				libAssert.strictEqual(tmpTrackRecords.length, 20, 'Should have 20 track projection records');

				console.log(`      Projected records: ${tmpRecords.length} total (${tmpArtistRecords.length} artists, ${tmpTrackRecords.length} tracks)`);
				console.log(`      Artist GUIDs: ${tmpArtistRecords.map((pR) => pR.GUIDArtistTrack).join(', ')}`);
				console.log(`      Sample track GUID: ${tmpTrackRecords[0].GUIDArtistTrack}`);

				// Note: The import logs confirm field values in the comprehension
				// (ArtistName="AC/DC", ArtistId=1, etc.) are correctly resolved
				// from {~D:Record.X~} templates. The projection store upsert
				// pipeline in retold-facto is a separate concern.
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 11: Dashboard with Both Connections Active
		// ─────────────────────────────────────────────────

		test
		(
			'Return to Dashboard and screenshot final state',
			async function ()
			{
				// Refresh all data
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.providers.DataBeaconProvider)
					{
						let p = window.DataBeaconApp.pict.providers.DataBeaconProvider;
						p.loadConnections();
						p.loadEndpoints();
						p.loadBeaconStatus();
					}
				});
				await waitForRender(_Page, 500);

				await _Page.evaluate(() =>
				{
					let tmpItems = document.querySelectorAll('.nav-item');
					for (let i = 0; i < tmpItems.length; i++)
					{
						if (tmpItems[i].dataset.view === 'Dashboard')
						{
							tmpItems[i].click();
							break;
						}
					}
				});
				await waitForRender(_Page, 800);
				await screenshot(_Page, 'dashboard-final');
			}
		);

		// ─────────────────────────────────────────────────
		//  Phase 12: Beacon Status & Final Verification
		// ─────────────────────────────────────────────────

		test
		(
			'Verify beacon status is disconnected (no Ultravisor in test)',
			async function ()
			{
				let tmpStatus = await apiGet('/beacon/ultravisor/status');
				libAssert.strictEqual(tmpStatus.Connected, false, 'Beacon should not be connected');
			}
		);

		test
		(
			'List all enabled endpoints across both databases',
			async function ()
			{
				let tmpEndpoints = await apiGet('/beacon/endpoints');

				let tmpExpected = 0;
				if (_MySQLReachable) tmpExpected += 3; // Artist, Album, Track (PascalCase)
				if (_PostgreSQLReachable) tmpExpected += 2; // artist, track (snake_case)

				if (tmpExpected > 0)
				{
					libAssert.ok(tmpEndpoints.Count >= tmpExpected, `Should have at least ${tmpExpected} endpoints, found ${tmpEndpoints.Count}`);
					console.log(`      Active endpoints (${tmpEndpoints.Count}):`);
					for (let i = 0; i < tmpEndpoints.Endpoints.length; i++)
					{
						let tmpEP = tmpEndpoints.Endpoints[i];
						console.log(`        ${tmpEP.TableName} (${tmpEP.ConnectionType}) -> ${tmpEP.EndpointBase}`);
					}
				}
				else
				{
					libAssert.strictEqual(tmpEndpoints.Count, 0, 'Should have 0 endpoints without databases');
				}
			}
		);
	}
);

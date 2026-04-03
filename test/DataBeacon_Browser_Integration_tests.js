/**
 * Retold DataBeacon — Browser Integration Tests
 *
 * End-to-end scenario: connect to a MySQL database with the Chinook
 * music store sample data, introspect the schema, enable dynamic
 * endpoints, browse records via the web UI, and verify everything
 * works via Puppeteer with screenshots at each step.
 *
 * Requires:
 *   docker compose up -d mysql     (start Chinook MySQL)
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
 * Check if MySQL is reachable on the test port.
 */
function isMySQLAvailable()
{
	return new Promise(
		(fResolve) =>
		{
			let tmpSocket = libNet.createConnection({ host: _MySQLHost, port: _MySQLPort });
			tmpSocket.setTimeout(2000);
			tmpSocket.on('connect', () => { tmpSocket.destroy(); fResolve(true); });
			tmpSocket.on('timeout', () => { tmpSocket.destroy(); fResolve(false); });
			tmpSocket.on('error', () => { fResolve(false); });
		});
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
		let _Browser;
		let _Page;
		let _Puppeteer;
		let _MySQLReachable = false;

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

				// Check MySQL availability
				isMySQLAvailable().then(
					(pAvailable) =>
					{
						_MySQLReachable = pAvailable;

						if (!_MySQLReachable)
						{
							console.log('      \u26A0\uFE0F  MySQL not available on port ' + _MySQLPort + ' -- MySQL tests will be skipped.');
							console.log('      Run: docker compose up -d mysql');
						}

						// Start the DataBeacon server
						startDataBeaconServer(
							(pError, pFable, pBeacon) =>
							{
								if (pError) return fDone(pError);
								_Fable = pFable;
								_Beacon = pBeacon;

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
						if (_Beacon && _Beacon.serviceInitialized)
						{
							_Beacon.stopService(fDone);
						}
						else
						{
							fDone();
						}
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
				await waitForRender(_Page);

				// Select the connection and load tables
				await _Page.evaluate(() =>
				{
					if (window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.providers.DataBeaconProvider)
					{
						window.DataBeaconApp.pict.providers.DataBeaconProvider.loadTables(1);
					}
				});
				await waitForRender(_Page, 1000);
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
		//  Phase 8: Dashboard with Active Connections
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
		//  Phase 9: Beacon Status
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
			'List all enabled endpoints',
			async function ()
			{
				let tmpEndpoints = await apiGet('/beacon/endpoints');

				if (_MySQLReachable)
				{
					libAssert.ok(tmpEndpoints.Count >= 3, `Should have at least 3 endpoints, found ${tmpEndpoints.Count}`);
					console.log(`      Active endpoints: ${tmpEndpoints.Endpoints.map((pE) => pE.TableName).join(', ')}`);
				}
				else
				{
					libAssert.strictEqual(tmpEndpoints.Count, 0, 'Should have 0 endpoints without MySQL');
				}
			}
		);
	}
);

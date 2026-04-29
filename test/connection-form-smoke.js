'use strict';

const libPuppeteer = require('puppeteer');
const libChildProcess = require('child_process');

const REPO   = '/Users/steven/Code/retold/modules/apps/retold-databeacon';
const ORIGIN = 'http://localhost:8389';

let _server = null;
let _browser = null;

function startServer()
{
	return new Promise((resolve, reject) =>
	{
		_server = libChildProcess.spawn('node', [ 'test/dev-server.js' ],
			{ cwd: REPO, stdio: 'pipe' });
		let tmpStarted = false;
		const tmpTimer = setTimeout(() =>
			{ if (!tmpStarted) reject(new Error('Server boot timed out')); }, 30000);
		_server.stdout.on('data', (pData) =>
			{
				if (!tmpStarted && pData.toString().includes('listening on'))
				{
					tmpStarted = true;
					clearTimeout(tmpTimer);
					setTimeout(resolve, 800);
				}
			});
		_server.stderr.on('data', () => {});
		_server.on('error', reject);
	});
}

async function stopServer()
{
	if (_server) { _server.kill('SIGTERM'); }
	if (_browser) { await _browser.close().catch(() => {}); }
}

function expect(pCondition, pLabel)
{
	if (!pCondition) { throw new Error('FAIL: ' + pLabel); }
	console.log('  ✓ ' + pLabel);
}

async function main()
{
	console.log('1. Starting retold-databeacon dev server on :8389...');
	await startServer();
	console.log('   server up');

	console.log('\n2. Verifying GET /beacon/connection/schemas returns expected providers...');
	const tmpRes = await fetch(`${ORIGIN}/beacon/connection/schemas`);
	const tmpJSON = await tmpRes.json();
	expect(Array.isArray(tmpJSON.Schemas), 'Schemas is an array');
	expect(tmpJSON.Schemas.length >= 6, `at least 6 schemas (got ${tmpJSON.Schemas.length})`);
	const tmpProviders = tmpJSON.Schemas.map((s) => s.Provider);
	expect(tmpProviders.includes('MySQL'), 'MySQL schema present');
	expect(tmpProviders.includes('MSSQL'), 'MSSQL schema present');
	expect(tmpProviders.includes('SQLite'), 'SQLite schema present');
	const tmpMSSQL = tmpJSON.Schemas.find((s) => s.Provider === 'MSSQL');
	expect(tmpMSSQL.Fields.some((f) => f.MapTo && f.MapTo.length === 2), 'MSSQL has a MapTo field');
	expect(tmpMSSQL.Fields.some((f) => f.Multiplier === 1000), 'MSSQL has a Multiplier=1000 field');

	console.log('\n3. Booting headless browser, loading the SPA...');
	_browser = await libPuppeteer.launch({ headless: 'new' });
	const tmpPage = await _browser.newPage();
	const tmpConsoleErrors = [];
	tmpPage.on('console', (m) =>
		{
			if (m.type() !== 'error') { return; }
			let tmpURL = (m.location && m.location().url) || '';
			// Ignore the unrelated favicon.ico 404 — pre-existing, the
			// dev server doesn't ship one and it's outside this work.
			if (tmpURL.includes('favicon.ico')) { return; }
			tmpConsoleErrors.push(`${m.text()} (${tmpURL})`);
		});
	tmpPage.on('pageerror', (e) => tmpConsoleErrors.push('pageerror: ' + e.message));

	await tmpPage.goto(ORIGIN + '/', { waitUntil: 'networkidle0', timeout: 15000 });

	// DataBeacon exposes the app as window.DataBeaconApp (not window.pict).
	await tmpPage.waitForFunction(
		'window.DataBeaconApp && window.DataBeaconApp.pict && window.DataBeaconApp.pict.views',
		{ timeout: 10000 });

	console.log('\n4. Navigating to the Connections view via the app API...');
	await tmpPage.evaluate(() => { window.DataBeaconApp.setActiveView('Connections'); });
	// Wait for the schemas API call + the shared form to mount the
	// schema-driven inputs.
	await tmpPage.waitForSelector('#databeacon-conn-mysql-host', { timeout: 5000 });

	console.log('\n5. Verifying the schema-driven form mounted...');
	expect(await tmpPage.$('#databeacon-conn-provider-select') !== null, 'Provider <select> is in the DOM');
	const tmpOptionCount = await tmpPage.$$eval('#databeacon-conn-provider-select option', (els) => els.length);
	expect(tmpOptionCount >= 6, `provider select has all options (got ${tmpOptionCount})`);
	expect(await tmpPage.$('#databeacon-conn-mysql-host') !== null, 'MySQL host input present');
	expect(await tmpPage.$('#databeacon-conn-mssql-server') !== null, 'MSSQL server input present');
	expect(await tmpPage.$('#databeacon-conn-sqlite-SQLiteFilePath') !== null, 'SQLite path input present');

	console.log('\n6. Verifying the active form is visible and others are hidden...');
	const tmpVisibility = await tmpPage.evaluate(() =>
		{
			const tmpForms = Array.from(document.querySelectorAll('[id^="databeacon-conn-form-"]'));
			return tmpForms.map((el) => ({ id: el.id, display: el.style.display }));
		});
	const tmpVisible = tmpVisibility.filter((f) => f.display === '' || f.display === 'block');
	expect(tmpVisible.length === 1, `exactly one form visible (got ${tmpVisible.length})`);

	console.log('\n7. Switching provider to MSSQL → its advanced <details> should appear...');
	await tmpPage.select('#databeacon-conn-provider-select', 'MSSQL');
	await new Promise((r) => setTimeout(r, 200));
	expect(await tmpPage.$('#databeacon-conn-form-mssql details') !== null,
		'MSSQL form has the <details> Advanced section');
	const tmpVisibilityAfter = await tmpPage.evaluate(() =>
		{
			const tmpForms = Array.from(document.querySelectorAll('[id^="databeacon-conn-form-"]'));
			return tmpForms.map((el) => ({ id: el.id, display: el.style.display }));
		});
	const tmpVisibleAfter = tmpVisibilityAfter.filter((f) => f.display === '' || f.display === 'block');
	expect(tmpVisibleAfter.length === 1 && tmpVisibleAfter[0].id === 'databeacon-conn-form-mssql',
		'after select-change, only MSSQL form is visible');

	console.log('\n8. Round-tripping form values via getProviderConfig() (MySQL)...');
	await tmpPage.select('#databeacon-conn-provider-select', 'MySQL');
	await new Promise((r) => setTimeout(r, 200));
	await tmpPage.evaluate(() =>
		{
			document.getElementById('databeacon-conn-mysql-host').value = '10.0.0.42';
			document.getElementById('databeacon-conn-mysql-port').value = '13306';
			document.getElementById('databeacon-conn-mysql-user').value = 'tester';
		});
	const tmpResult = await tmpPage.evaluate(() =>
		{
			const tmpView = window.DataBeaconApp.pict.views['PictSection-ConnectionForm'];
			return tmpView.getProviderConfig();
		});
	expect(tmpResult.Provider === 'MySQL', 'getProviderConfig returns Provider=MySQL');
	expect(tmpResult.Config.host === '10.0.0.42', 'host edit flows through');
	expect(tmpResult.Config.port === 13306, 'port parsed as Number');
	expect(tmpResult.Config.user === 'tester', 'user edit flows through');

	console.log('\n9. MSSQL Multiplier+MapTo round-trip...');
	await tmpPage.select('#databeacon-conn-provider-select', 'MSSQL');
	await new Promise((r) => setTimeout(r, 200));
	await tmpPage.evaluate(() =>
		{
			document.getElementById('databeacon-conn-mssql-RetryInitialDelaySec').value = '7';
		});
	const tmpMSSQLResult = await tmpPage.evaluate(() =>
		{
			const tmpView = window.DataBeaconApp.pict.views['PictSection-ConnectionForm'];
			return tmpView.getProviderConfig();
		});
	expect(tmpMSSQLResult.Provider === 'MSSQL', 'getProviderConfig returns Provider=MSSQL after switch');
	expect(tmpMSSQLResult.Config.ConnectRetryOptions
		&& tmpMSSQLResult.Config.ConnectRetryOptions.InitialDelayMs === 7000,
		'ConnectRetryOptions.InitialDelayMs=7000 (Multiplier ×1000 applied)');
	expect(tmpMSSQLResult.Config.DDLRetryOptions
		&& tmpMSSQLResult.Config.DDLRetryOptions.InitialDelayMs === 7000,
		'DDLRetryOptions.InitialDelayMs=7000 (MapTo writes both targets)');

	console.log('\n10. Console error count:');
	if (tmpConsoleErrors.length > 0)
	{
		console.log('   (errors observed:)');
		tmpConsoleErrors.slice(0, 5).forEach((e) => console.log('     ' + e));
	}
	expect(tmpConsoleErrors.length === 0, 'zero console errors / pageerrors');

	console.log('\nAll smoke checks passed.');
}

main()
	.then(() => stopServer().then(() => process.exit(0)))
	.catch(async (pErr) =>
		{
			console.log('\nFAILED:', pErr.message);
			await stopServer();
			process.exit(1);
		});

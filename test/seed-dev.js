#!/usr/bin/env node
/**
 * Seed the dev servers with the same data the Puppeteer tests create.
 *
 * Run this AFTER `npm run dev` is up and the test databases are running.
 * It replays the full pipeline: connect MySQL + PostgreSQL, introspect,
 * enable endpoints, pull data into Facto, create projections.
 *
 * Usage:
 *   npm run docker-test-up   # start Chinook MySQL + PostgreSQL
 *   npm run dev              # start DataBeacon:8389 + Facto:8420  (in another terminal)
 *   node test/seed-dev.js    # seed everything
 */

'use strict';

const libHTTP = require('http');

const _BeaconPort = 8389;
const _FactoPort = 8420;

// ══════════════════════════════════════════════════════════════

function post(pPort, pPath, pBody)
{
	return new Promise(
		(fResolve, fReject) =>
		{
			let tmpData = JSON.stringify(pBody);
			let tmpReq = libHTTP.request(
				{
					hostname: '127.0.0.1',
					port: pPort,
					path: pPath,
					method: 'POST',
					headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(tmpData) },
				},
				(pRes) =>
				{
					let tmpChunks = [];
					pRes.on('data', (pC) => tmpChunks.push(pC));
					pRes.on('end', () =>
					{
						try { fResolve(JSON.parse(Buffer.concat(tmpChunks).toString())); }
						catch (e) { fResolve(Buffer.concat(tmpChunks).toString()); }
					});
				});
			tmpReq.on('error', fReject);
			tmpReq.write(tmpData);
			tmpReq.end();
		});
}

function get(pPort, pPath)
{
	return new Promise(
		(fResolve, fReject) =>
		{
			libHTTP.get({ hostname: '127.0.0.1', port: pPort, path: pPath },
				(pRes) =>
				{
					let tmpChunks = [];
					pRes.on('data', (pC) => tmpChunks.push(pC));
					pRes.on('end', () =>
					{
						try { fResolve(JSON.parse(Buffer.concat(tmpChunks).toString())); }
						catch (e) { fResolve(Buffer.concat(tmpChunks).toString()); }
					});
				}).on('error', fReject);
		});
}

function beacon(pMethod, pPath, pBody)
{
	if (pMethod === 'GET') return get(_BeaconPort, pPath);
	return post(_BeaconPort, pPath, pBody);
}

function facto(pMethod, pPath, pBody)
{
	if (pMethod === 'GET') return get(_FactoPort, pPath);
	return post(_FactoPort, pPath, pBody);
}

// ══════════════════════════════════════════════════════════════

async function run()
{
	console.log('');
	console.log('Seeding dev servers with Chinook data...');
	console.log('');

	// ─── Verify servers are up ───────────────────────────
	try
	{
		await beacon('GET', '/beacon/ultravisor/status');
	}
	catch (e)
	{
		console.error('DataBeacon not reachable on port ' + _BeaconPort + '. Run: npm run dev');
		process.exit(1);
	}

	// ─── MySQL connection ────────────────────────────────
	console.log('1. Creating MySQL connection...');
	let tmpMySQL = await beacon('POST', '/beacon/connection',
	{
		Name: 'Chinook MySQL',
		Type: 'MySQL',
		Config: { host: '127.0.0.1', port: 23389, database: 'chinook', user: 'root', password: 'testpassword' },
		AutoConnect: true,
		Description: 'Chinook music store (MySQL, PascalCase)',
	});
	let tmpMySQLID = tmpMySQL.Connection ? tmpMySQL.Connection.IDBeaconConnection : 0;
	console.log(`   Created connection #${tmpMySQLID}`);

	console.log('   Connecting...');
	await beacon('POST', `/beacon/connection/${tmpMySQLID}/connect`, {});

	console.log('   Introspecting...');
	let tmpMySQLIntrospect = await beacon('POST', `/beacon/connection/${tmpMySQLID}/introspect`, {});
	console.log(`   Found ${tmpMySQLIntrospect.TableCount} tables`);

	console.log('   Enabling endpoints: Artist, Album, Track...');
	await beacon('POST', `/beacon/endpoint/${tmpMySQLID}/Artist/enable`, {});
	await beacon('POST', `/beacon/endpoint/${tmpMySQLID}/Album/enable`, {});
	await beacon('POST', `/beacon/endpoint/${tmpMySQLID}/Track/enable`, {});
	await beacon('POST', `/beacon/endpoint/${tmpMySQLID}/Customer/enable`, {});
	await beacon('POST', `/beacon/endpoint/${tmpMySQLID}/Invoice/enable`, {});
	console.log('');

	// ─── PostgreSQL connection ───────────────────────────
	console.log('2. Creating PostgreSQL connection...');
	let tmpPG = await beacon('POST', '/beacon/connection',
	{
		Name: 'Chinook PostgreSQL',
		Type: 'PostgreSQL',
		Config: { host: '127.0.0.1', port: 25389, database: 'chinook', user: 'postgres', password: 'testpassword' },
		AutoConnect: true,
		Description: 'Chinook music store (PostgreSQL, snake_case)',
	});
	let tmpPGID = tmpPG.Connection ? tmpPG.Connection.IDBeaconConnection : 0;
	console.log(`   Created connection #${tmpPGID}`);

	console.log('   Connecting...');
	await beacon('POST', `/beacon/connection/${tmpPGID}/connect`, {});

	console.log('   Introspecting...');
	let tmpPGIntrospect = await beacon('POST', `/beacon/connection/${tmpPGID}/introspect`, {});
	console.log(`   Found ${tmpPGIntrospect.TableCount} tables`);

	console.log('   Enabling endpoints: artist, track...');
	await beacon('POST', `/beacon/endpoint/${tmpPGID}/artist/enable`, {});
	await beacon('POST', `/beacon/endpoint/${tmpPGID}/track/enable`, {});
	console.log('');

	// ─── Check if Facto is available ─────────────────────
	let tmpFactoAvailable = false;
	try
	{
		await facto('GET', '/beacon/ultravisor/status');
		tmpFactoAvailable = false; // That's a DataBeacon route, try Facto-specific
	}
	catch (e) { /* not a DataBeacon instance */ }
	try
	{
		await facto('GET', '/1.0/Sources/0/1');
		tmpFactoAvailable = true;
	}
	catch (e) { /* Facto not running */ }

	if (!tmpFactoAvailable)
	{
		console.log('Facto not running on port ' + _FactoPort + ' — skipping projection pipeline.');
		console.log('');
		printDone();
		return;
	}

	// ─── Facto: Sources + Datasets ───────────────────────
	console.log('3. Creating Facto sources...');
	let tmpArtistSource = await facto('POST', '/1.0/Source',
		{ Name: 'DataBeacon - Chinook Artists', Type: 'beacon-pull', Active: 1 });
	let tmpTrackSource = await facto('POST', '/1.0/Source',
		{ Name: 'DataBeacon - Chinook Tracks', Type: 'beacon-pull', Active: 1 });
	console.log(`   Sources: Artists=#${tmpArtistSource.IDSource}, Tracks=#${tmpTrackSource.IDSource}`);

	console.log('4. Creating Facto datasets...');
	let tmpArtistDS = await facto('POST', '/1.0/Dataset',
		{ Name: 'Chinook Artists', Type: 'Raw', Description: 'Artists from MySQL Chinook via DataBeacon' });
	let tmpTrackDS = await facto('POST', '/1.0/Dataset',
		{ Name: 'Chinook Tracks', Type: 'Raw', Description: 'Tracks from MySQL Chinook via DataBeacon' });
	console.log(`   Datasets: Artists=#${tmpArtistDS.IDDataset}, Tracks=#${tmpTrackDS.IDDataset}`);

	// ─── Facto: Ingest from DataBeacon ───────────────────
	console.log('5. Pulling Artists from DataBeacon into Facto...');
	let tmpArtists = await beacon('GET', '/1.0/Artists/0/50');
	for (let i = 0; i < tmpArtists.length; i++)
	{
		await facto('POST', '/1.0/Record',
		{
			IDDataset: tmpArtistDS.IDDataset,
			IDSource: tmpArtistSource.IDSource,
			Type: 'artist',
			Content: JSON.stringify(tmpArtists[i]),
		});
	}
	console.log(`   Ingested ${tmpArtists.length} artists`);

	console.log('6. Pulling Tracks from DataBeacon into Facto...');
	let tmpTracks = await beacon('GET', '/1.0/Tracks/0/50');
	for (let i = 0; i < tmpTracks.length; i++)
	{
		await facto('POST', '/1.0/Record',
		{
			IDDataset: tmpTrackDS.IDDataset,
			IDSource: tmpTrackSource.IDSource,
			Type: 'track',
			Content: JSON.stringify(tmpTracks[i]),
		});
	}
	console.log(`   Ingested ${tmpTracks.length} tracks`);

	// ─── Facto: Projection ───────────────────────────────
	console.log('7. Creating projection dataset...');
	let tmpProjDS = await facto('POST', '/1.0/Dataset',
	{
		Name: 'Artist Tracks',
		Type: 'Projection',
		Description: 'Combined view of artists and their tracks from Chinook',
		SchemaDefinition: [
			'! ArtistTrack', '@ IDArtistTrack', '% GUIDArtistTrack',
			'$ ArtistName 120', '# ArtistId', '$ TrackName 200', '# TrackId',
			'$ AlbumTitle 160', '# AlbumId', '$ Genre 120',
			'# Milliseconds', '. UnitPrice', '$ Composer 220',
		].join('\n'),
	});
	console.log(`   Projection dataset: #${tmpProjDS.IDDataset}`);

	console.log('8. Creating store connection...');
	let tmpStoreConn = await facto('POST', '/1.0/StoreConnection',
	{
		Name: 'Projection SQLite',
		Type: 'SQLite',
		Config: JSON.stringify({ SQLiteFilePath: ':memory:' }),
		Status: 'OK',
	});
	console.log(`   Store connection: #${tmpStoreConn.IDStoreConnection}`);

	console.log('9. Deploying projection schema...');
	let tmpDeploy = await facto('POST', `/facto/projection/${tmpProjDS.IDDataset}/deploy`,
	{
		IDStoreConnection: tmpStoreConn.IDStoreConnection,
		TargetTableName: 'ArtistTrack',
	});
	console.log(`   Deployed: ${tmpDeploy.Success}`);

	console.log('10. Creating mappings...');
	await facto('POST', `/facto/projection/${tmpProjDS.IDDataset}/mapping`,
	{
		IDSource: tmpArtistSource.IDSource,
		Name: 'Artist Mapping',
		MappingConfiguration: JSON.stringify(
		{
			Entity: 'ArtistTrack',
			GUIDTemplate: 'artist-{~D:Record.ArtistId~}',
			Mappings: { ArtistName: '{~D:Record.Name~}', ArtistId: '{~D:Record.ArtistId~}' },
		}),
	});
	await facto('POST', `/facto/projection/${tmpProjDS.IDDataset}/mapping`,
	{
		IDSource: tmpTrackSource.IDSource,
		Name: 'Track Mapping',
		MappingConfiguration: JSON.stringify(
		{
			Entity: 'ArtistTrack',
			GUIDTemplate: 'track-{~D:Record.TrackId~}',
			Mappings: { TrackName: '{~D:Record.Name~}', TrackId: '{~D:Record.TrackId~}', AlbumId: '{~D:Record.AlbumId~}', Milliseconds: '{~D:Record.Milliseconds~}', UnitPrice: '{~D:Record.UnitPrice~}', Composer: '{~D:Record.Composer~}' },
		}),
	});
	console.log('    Created Artist Mapping + Track Mapping');

	console.log('11. Running projection imports...');
	let tmpMappings = await facto('GET', `/facto/projection/${tmpProjDS.IDDataset}/mappings`);
	let tmpStores = await facto('GET', `/facto/projection/${tmpProjDS.IDDataset}/stores`);
	let tmpStoreID = tmpStores.Stores[0].IDProjectionStore;

	let tmpArtistMapping = tmpMappings.Mappings.find((m) => m.Name === 'Artist Mapping');
	let tmpTrackMapping = tmpMappings.Mappings.find((m) => m.Name === 'Track Mapping');

	let tmpArtistImport = await facto('POST', `/facto/projection/${tmpProjDS.IDDataset}/import`,
		{ IDProjectionMapping: tmpArtistMapping.IDProjectionMapping, IDProjectionStore: tmpStoreID, IDSource: tmpArtistSource.IDSource });
	console.log(`    Artists: ${tmpArtistImport.RecordsProcessed} processed, ${tmpArtistImport.RecordsUpserted} upserted`);

	let tmpTrackImport = await facto('POST', `/facto/projection/${tmpProjDS.IDDataset}/import`,
		{ IDProjectionMapping: tmpTrackMapping.IDProjectionMapping, IDProjectionStore: tmpStoreID, IDSource: tmpTrackSource.IDSource });
	console.log(`    Tracks: ${tmpTrackImport.RecordsProcessed} processed, ${tmpTrackImport.RecordsUpserted} upserted`);

	// ─── Verify ──────────────────────────────────────────
	let tmpProjected = await facto('GET', '/1.0/ArtistTracks/0/50');
	console.log(`    Projected records: ${Array.isArray(tmpProjected) ? tmpProjected.length : 0}`);
	console.log('');

	printDone();
}

function printDone()
{
	let tmpEndpoints = '';

	console.log('═══════════════════════════════════════════════════');
	console.log('  Seeding complete!  Open in your browser:');
	console.log('');
	console.log(`  DataBeacon:  http://localhost:${_BeaconPort}/`);
	console.log(`  Facto:       http://localhost:${_FactoPort}/`);
	console.log('');
	console.log('  Try these:');
	console.log(`    http://localhost:${_BeaconPort}/beacon/connections`);
	console.log(`    http://localhost:${_BeaconPort}/beacon/endpoints`);
	console.log(`    http://localhost:${_BeaconPort}/1.0/Artists/0/10`);
	console.log(`    http://localhost:${_BeaconPort}/1.0/Tracks/0/10`);
	console.log(`    http://localhost:${_FactoPort}/#/Projections`);
	console.log(`    http://localhost:${_FactoPort}/#/Projection/3`);
	console.log(`    http://localhost:${_FactoPort}/1.0/ArtistTracks/0/50`);
	console.log('');
}

run().catch((pError) =>
{
	console.error('Seed error:', pError);
	process.exit(1);
});

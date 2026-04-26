/**
 * Persistence-via-DataBeacon — Session 2 end-to-end smoke
 *
 * Boots a real retold-databeacon (with its own internal SQLite +
 * Orator REST surface) plus an in-process ultravisor coordinator and
 * the QueuePersistenceBridge from
 * `modules/apps/ultravisor/source/services/`. A manual push handler
 * stitches the two fables together — the coordinator routes work
 * items into the databeacon's beacon-service capability handlers
 * synchronously, mimicking what the real WebSocket transport does.
 *
 * Coverage:
 *   1. EnsureSchema lands all four UV* tables in the assigned
 *      external SQLite via the connector's MeadowSchema service
 *      (the Session 2 generalization). 11 indices verified too.
 *   2. UpdateProxyConfig extends the MeadowProxy allowlist so
 *      PascalCase `/1.0/<routeHash>/UV*` routes can pass through.
 *   3. EnableEndpoint wires up meadow REST routes for each table.
 *   4. QueuePersistenceBridge.upsertWorkItem dispatches via
 *      MeadowProxy → loopback HTTP → meadow REST → SQLite INSERT.
 *      The row shows up in the external SQLite via direct query.
 *   5. The bridge's MeadowProxy mode is engaged via beacon Tags
 *      (PersistenceConnectionID), not legacy QueuePersistence
 *      capability.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */

const Chai = require('chai');
const Expect = Chai.expect;

const libPath = require('path');
const libFs = require('fs');
const libBetterSqlite = require('better-sqlite3');

const libPict = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('../source/Retold-DataBeacon.js');
const libUltravisorBeaconService = require('ultravisor-beacon');

// The bridges + coordinator live in the ultravisor module. Resolve them
// by relative path — Node resolves the bridges' own `require()` calls
// against ultravisor/node_modules so its pict-serviceproviderbase /
// ultravisor-beacon stay in scope.
const _UltravisorRoot = libPath.resolve(__dirname, '..', '..', 'ultravisor');
const libUltravisorBeaconCoordinator = require(libPath.join(_UltravisorRoot, 'source', 'services', 'Ultravisor-Beacon-Coordinator.cjs'));
const libUltravisorQueuePersistenceBridge = require(libPath.join(_UltravisorRoot, 'source', 'services', 'Ultravisor-QueuePersistenceBridge.cjs'));
const libUltravisorManifestStoreBridge = require(libPath.join(_UltravisorRoot, 'source', 'services', 'Ultravisor-ManifestStoreBridge.cjs'));

// Test scratch dir — both SQLite files (databeacon-internal +
// UV-external) live here. Wiped between runs.
const TEST_DIR = libPath.resolve(__dirname, '..', '.test_persistence_bridge');
const BEACON_DB_PATH = libPath.join(TEST_DIR, 'databeacon.sqlite');
const UV_DB_PATH = libPath.join(TEST_DIR, 'uv-external.sqlite');

const TEST_PORT = 28389;

function ensureCleanDir(pDir)
{
	if (libFs.existsSync(pDir))
	{
		libFs.rmSync(pDir, { recursive: true, force: true });
	}
	libFs.mkdirSync(pDir, { recursive: true });
}

function getService(pFable, pTypeName)
{
	let tmpMap = pFable.servicesMap && pFable.servicesMap[pTypeName];
	return tmpMap ? Object.values(tmpMap)[0] : null;
}

// ──────────────────────────────────────────────────────────────────
//  In-process bridge: when the coordinator pushes a work item to the
//  beacon, invoke the databeacon's registered capability handler
//  synchronously and resolve the work item with its Outputs. Mirrors
//  what the real WebSocket-push transport does end-to-end.
// ──────────────────────────────────────────────────────────────────

function makeInProcessPushHandler(pCoordinator, pBeaconService)
{
	return function (pBeaconID, pWorkItem)
	{
		// pBeaconService._CapabilityManager._Capabilities is the source
		// of truth for registered handlers — the same map ProviderRegistry
		// would have built. We invoke the handler directly so the smoke
		// test doesn't need a real Orator/WebSocket transport.
		let tmpCapabilities = pBeaconService._CapabilityManager._Capabilities;
		let tmpDescriptor = tmpCapabilities[pWorkItem.Capability];
		if (!tmpDescriptor)
		{
			pCoordinator.failWorkItem(pWorkItem.WorkItemHash, `Capability [${pWorkItem.Capability}] not registered on stub beacon.`,
				() => {});
			return false;
		}
		let tmpAction = tmpDescriptor.actions && tmpDescriptor.actions[pWorkItem.Action];
		if (!tmpAction || typeof tmpAction.Handler !== 'function')
		{
			pCoordinator.failWorkItem(pWorkItem.WorkItemHash, `Action [${pWorkItem.Capability}/${pWorkItem.Action}] has no Handler.`,
				() => {});
			return false;
		}
		// Defer to setImmediate so the work item's direct-dispatch
		// callback finishes registering on the coordinator before we
		// drive the handler to completion. dispatchAndWait registers
		// the callback AFTER enqueueWorkItem returns, which is the
		// same call that fires the push handler — synchronously
		// completing the work item from inside the push handler races
		// the callback registration and leaves the awaiter hanging.
		setImmediate(() =>
		{
			try
			{
				tmpAction.Handler(pWorkItem, {}, (pError, pResult) =>
				{
					if (pError)
					{
						pCoordinator.failWorkItem(pWorkItem.WorkItemHash, pError.message || String(pError), () => {});
						return;
					}
					// completeWorkItem expects the full {Outputs, Log} envelope.
					pCoordinator.completeWorkItem(pWorkItem.WorkItemHash, pResult || {}, () => {});
				});
			}
			catch (pErr)
			{
				pCoordinator.failWorkItem(pWorkItem.WorkItemHash, pErr.message || String(pErr), () => {});
			}
		});
		return true;
	};
}

// ──────────────────────────────────────────────────────────────────
//  Test suite
// ──────────────────────────────────────────────────────────────────

suite('Persistence-via-DataBeacon — Session 2 smoke', function ()
{
	this.timeout(30000);

	let _BeaconFable = null;
	let _Beacon = null;
	let _BeaconService = null;
	let _IDExternalConnection = null;
	let _UVFable = null;
	let _Coord = null;
	let _Bridge = null;
	let _ManifestBridge = null;
	let _StubBeaconID = null;

	suiteSetup(function (fDone)
	{
		ensureCleanDir(TEST_DIR);

		// ─── Boot the databeacon ──────────────────────────────────
		_BeaconFable = new libPict(
			{
				Product: 'PersistenceBridgeSmoke-DataBeacon',
				ProductVersion: '0.0.1',
				APIServerPort: TEST_PORT,
				LogStreams: [{ streamtype: 'console', level: 'warn' }],
				SQLite: { SQLiteFilePath: BEACON_DB_PATH }
			});

		_BeaconFable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
		_BeaconFable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

		_BeaconFable.MeadowConnectionManager.connect('databeacon',
			{ Type: 'SQLite', SQLiteFilePath: BEACON_DB_PATH },
			(pConnErr, pConnection) =>
			{
				if (pConnErr) return fDone(pConnErr);
				_BeaconFable.MeadowSQLiteProvider = pConnection.instance;
				_BeaconFable.settings.MeadowProvider = 'SQLite';

				_BeaconFable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
				_Beacon = _BeaconFable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
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
							WebUI: false
						}
					});

				_Beacon.initializeService((pInitErr) =>
				{
					if (pInitErr) return fDone(pInitErr);

					// Insert + connect the external SQLite the UV
					// tables will live in. Deduce the IDBeaconConnection
					// from the inserted record so the bridge's
					// PersistenceConnectionID tag points at the right
					// connection.
					let tmpRecord =
					{
						Name: 'uv-external',
						Type: 'SQLite',
						Config: JSON.stringify({ SQLiteFilePath: UV_DB_PATH }),
						Status: 'Untested',
						AutoConnect: 1,
						Description: 'External SQLite for the UV smoke test'
					};
					let tmpQuery = _BeaconFable.DAL.BeaconConnection.query.clone()
						.setIDUser(0)
						.addRecord(tmpRecord);
					_BeaconFable.DAL.BeaconConnection.doCreate(tmpQuery,
						(pCreateErr, pQ, pQR, pInserted) =>
						{
							if (pCreateErr) return fDone(pCreateErr);
							_IDExternalConnection = pInserted.IDBeaconConnection;

							// Establish the live runtime connection.
							_BeaconFable.DataBeaconConnectionBridge._connectRuntime(pInserted, (pRunErr) =>
							{
								if (pRunErr) return fDone(pRunErr);

								// Stand up an UltravisorBeacon service in the
								// databeacon's fable, but skip its `enable()`
								// (which would dial a real coordinator). The
								// BeaconProvider's registerCapabilitiesOn
								// installs the four capabilities — the same
								// ones a real `connectBeacon` would expose.
								_BeaconService = new libUltravisorBeaconService(_BeaconFable,
									{
										ServerURL: 'http://localhost:0',
										Name: 'persistence-smoke-databeacon',
										Tags: {}
									});
								_BeaconFable.DataBeaconBeaconProvider.registerCapabilitiesOn(_BeaconService, {});

								return bootUltravisor(fDone);
							});
						});
				});
			});
	});

	function bootUltravisor(fDone)
	{
		// ─── Boot the ultravisor coordinator + bridges ──────────
		_UVFable = new libPict(
			{
				Product: 'PersistenceBridgeSmoke-Ultravisor',
				ProductVersion: '0.0.1',
				LogStreams: [{ streamtype: 'console', level: 'warn' }],
				UltravisorFileStorePath: TEST_DIR
			});

		_UVFable.addAndInstantiateServiceTypeIfNotExists('UltravisorBeaconCoordinator', libUltravisorBeaconCoordinator);
		_UVFable.addAndInstantiateServiceTypeIfNotExists('UltravisorQueuePersistenceBridge', libUltravisorQueuePersistenceBridge);
		_UVFable.addAndInstantiateServiceTypeIfNotExists('UltravisorManifestStoreBridge', libUltravisorManifestStoreBridge);

		_Coord = getService(_UVFable, 'UltravisorBeaconCoordinator');
		_Bridge = getService(_UVFable, 'UltravisorQueuePersistenceBridge');
		_ManifestBridge = getService(_UVFable, 'UltravisorManifestStoreBridge');

		// Register a stub beacon that advertises the four databeacon
		// capabilities + the persistence tag pointing at the UV-external
		// connection. In a real deployment the lab assigns this tag
		// when the operator picks a databeacon for persistence.
		_StubBeaconID = 'bcn-uv-databeacon-smoke';
		_Coord._Beacons[_StubBeaconID] =
		{
			BeaconID: _StubBeaconID,
			Name: 'uv-databeacon-smoke',
			Capabilities: ['MeadowProxy', 'DataBeaconSchema', 'DataBeaconManagement', 'DataBeaconAccess'],
			MaxConcurrent: 4,
			CurrentWorkItems: [],
			Status: 'Online',
			LastHeartbeat: new Date().toISOString(),
			Tags: { PersistenceConnectionID: _IDExternalConnection },
			Contexts: {},
			BindAddresses: [],
			RegisteredAt: new Date().toISOString()
		};

		_Coord.setWorkItemPushHandler(makeInProcessPushHandler(_Coord, _BeaconService));
		return fDone();
	}

	suiteTeardown(function (fDone)
	{
		let fFinish = () =>
		{
			try { libFs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
			fDone();
		};
		if (_Beacon && _Beacon.serviceInitialized)
		{
			return _Beacon.stopService(fFinish);
		}
		fFinish();
	});

	test('databeacon registers all four capabilities (MeadowProxy + DataBeaconSchema + DataBeaconManagement + DataBeaconAccess)', function ()
	{
		Expect(_BeaconService).to.exist;
		let tmpCaps = _BeaconService._CapabilityManager._Capabilities;
		Expect(tmpCaps).to.have.property('MeadowProxy');
		Expect(tmpCaps).to.have.property('DataBeaconSchema');
		Expect(tmpCaps).to.have.property('DataBeaconManagement');
		Expect(tmpCaps).to.have.property('DataBeaconAccess');
		Expect(tmpCaps.DataBeaconManagement.actions).to.have.property('UpdateProxyConfig');
	});

	test('bridge bootstrap creates the four UV tables + 11 indices in the external SQLite', function (fDone)
	{
		// Manually fire the connect notification — _Coord normally does
		// this on register, but the stub beacon shortcut skipped that
		// path.
		_Bridge.onBeaconConnected(_StubBeaconID);
		_ManifestBridge.onBeaconConnected(_StubBeaconID);

		let tmpStart = Date.now();
		let tmpPoll = () =>
		{
			if (_Bridge.isMeadowProxyMode() && _ManifestBridge.isMeadowProxyMode())
			{
				let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
				try
				{
					let tmpTables = tmpDB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'UV%' ORDER BY name").all();
					let tmpNames = tmpTables.map((pR) => pR.name);
					Expect(tmpNames).to.deep.equal(['UVManifest', 'UVQueueWorkItem', 'UVQueueWorkItemAttempt', 'UVQueueWorkItemEvent']);

					let tmpIndices = tmpDB.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'IX_UV%' ORDER BY name").all();
					Expect(tmpIndices.length).to.be.at.least(11);
				}
				finally { tmpDB.close(); }
				return fDone();
			}
			if (Date.now() - tmpStart > 10000)
			{
				return fDone(new Error('Bootstrap did not complete within 10s.'));
			}
			setTimeout(tmpPoll, 50);
		};
		setTimeout(tmpPoll, 50);
	});

	test('upsertWorkItem dispatches via MeadowProxy and lands a row in the external SQLite UVQueueWorkItem table', function (fDone)
	{
		let tmpHash = 'wi-smoke-' + Date.now();
		let tmpItem =
		{
			WorkItemHash: tmpHash,
			RunID: 'run-smoke',
			RunHash: 'rh-smoke',
			NodeHash: 'nh-smoke',
			OperationHash: 'oh-smoke',
			Capability: 'Shell',
			Action: 'Echo',
			Settings: '{}',
			AffinityKey: '',
			AssignedBeaconID: '',
			Status: 'Pending',
			Priority: 0,
			EnqueuedAt: new Date().toISOString(),
			DispatchedAt: '',
			StartedAt: '',
			ClaimedAt: '',
			CompletedAt: '',
			CanceledAt: '',
			AssignedAt: '',
			LastEventAt: new Date().toISOString(),
			QueueWaitMs: 0,
			TimeoutMs: 30000,
			Health: 0,
			HealthLabel: 'Unknown',
			HealthReason: '',
			HealthComputedAt: '',
			AttemptNumber: 0,
			MaxAttempts: 1,
			RetryBackoffMs: 0,
			RetryAfter: '',
			LastError: '',
			Result: '',
			CancelRequested: false,
			CancelReason: ''
		};

		_Bridge.upsertWorkItem(tmpItem).then((pResult) =>
		{
			Expect(pResult).to.be.an('object');
			Expect(pResult.Available, 'Available').to.equal(true);
			Expect(pResult.Success, `Success (Reason: ${pResult.Reason})`).to.equal(true);

			let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
			try
			{
				let tmpRow = tmpDB.prepare('SELECT WorkItemHash, RunID, Capability, Action, Status FROM UVQueueWorkItem WHERE WorkItemHash = ?').get(tmpHash);
				Expect(tmpRow, 'row landed').to.exist;
				Expect(tmpRow.WorkItemHash).to.equal(tmpHash);
				Expect(tmpRow.RunID).to.equal('run-smoke');
				Expect(tmpRow.Capability).to.equal('Shell');
				Expect(tmpRow.Action).to.equal('Echo');
				Expect(tmpRow.Status).to.equal('Pending');
			}
			finally { tmpDB.close(); }
			return fDone();
		}).catch(fDone);
	});

	test('appendEvent lands a row in UVQueueWorkItemEvent', function (fDone)
	{
		let tmpEvent =
		{
			EventGUID: '11111111-2222-3333-4444-555555555555',
			WorkItemHash: 'wi-smoke-event',
			EventType: 'enqueued',
			Payload: '{}',
			EmittedAt: new Date().toISOString(),
			Seq: 1,
			FromStatus: '',
			ToStatus: 'Pending',
			BeaconID: 'bcn-self'
		};

		_Bridge.appendEvent(tmpEvent).then((pResult) =>
		{
			Expect(pResult.Success, `Success (Reason: ${pResult.Reason})`).to.equal(true);

			let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
			try
			{
				let tmpRow = tmpDB.prepare('SELECT EventGUID, WorkItemHash, EventType FROM UVQueueWorkItemEvent WHERE EventGUID = ?').get(tmpEvent.EventGUID);
				Expect(tmpRow, 'row landed').to.exist;
				Expect(tmpRow.WorkItemHash).to.equal('wi-smoke-event');
				Expect(tmpRow.EventType).to.equal('enqueued');
			}
			finally { tmpDB.close(); }
			return fDone();
		}).catch(fDone);
	});

	test('upsertManifest lands a row in UVManifest', function (fDone)
	{
		let tmpManifest =
		{
			Hash: 'rh-smoke-manifest',
			OperationHash: 'op-smoke',
			OperationName: 'Smoke Op',
			Status: 'Complete',
			RunMode: 'Direct',
			Live: false,
			StartTime: new Date().toISOString(),
			StopTime: new Date().toISOString(),
			ElapsedMs: 100,
			StagingPath: '',
			Output: { ok: true }
		};

		_ManifestBridge.upsertManifest(tmpManifest).then((pResult) =>
		{
			Expect(pResult.Success, `Success (Reason: ${pResult.Reason})`).to.equal(true);

			let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
			try
			{
				let tmpRow = tmpDB.prepare('SELECT Hash, OperationHash, Status, ManifestJSON FROM UVManifest WHERE Hash = ?').get('rh-smoke-manifest');
				Expect(tmpRow, 'manifest row landed').to.exist;
				Expect(tmpRow.Hash).to.equal('rh-smoke-manifest');
				Expect(tmpRow.OperationHash).to.equal('op-smoke');
				Expect(tmpRow.Status).to.equal('Complete');
				Expect(tmpRow.ManifestJSON).to.be.a('string').and.have.length.above(0);
			}
			finally { tmpDB.close(); }
			return fDone();
		}).catch(fDone);
	});

	// ─── Session 3: deferred translations now wired ────────────────────
	// Each of these is a two-step (filtered GET → PUT-by-id) flow; the
	// upsert that seeds the row runs as part of the test so the cases
	// don't depend on test-3's hash sticking around if the suite is
	// re-ordered.

	test('updateWorkItem patches an existing row via lookup-then-PUT', function (fDone)
	{
		let tmpHash = 'wi-update-' + Date.now();
		let tmpItem =
		{
			WorkItemHash: tmpHash,
			RunID: 'run-update', RunHash: 'rh-update', NodeHash: '', OperationHash: '',
			Capability: 'Shell', Action: 'Echo', Settings: '{}',
			AffinityKey: '', AssignedBeaconID: '',
			Status: 'Pending', Priority: 0,
			EnqueuedAt: new Date().toISOString(),
			DispatchedAt: '', StartedAt: '', ClaimedAt: '', CompletedAt: '', CanceledAt: '', AssignedAt: '',
			LastEventAt: new Date().toISOString(),
			QueueWaitMs: 0, TimeoutMs: 0,
			Health: 0, HealthLabel: 'Unknown', HealthReason: '', HealthComputedAt: '',
			AttemptNumber: 0, MaxAttempts: 1, RetryBackoffMs: 0, RetryAfter: '',
			LastError: '', Result: '',
			CancelRequested: false, CancelReason: ''
		};

		_Bridge.upsertWorkItem(tmpItem).then((pUpsertResult) =>
		{
			Expect(pUpsertResult.Success, `upsert (Reason: ${pUpsertResult.Reason})`).to.equal(true);
			return _Bridge.updateWorkItem(tmpHash, { Status: 'Done', CompletedAt: '2026-04-25T12:00:00.000Z' });
		}).then((pUpdateResult) =>
		{
			Expect(pUpdateResult.Success, `update (Reason: ${pUpdateResult.Reason})`).to.equal(true);

			let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
			try
			{
				let tmpRow = tmpDB.prepare('SELECT Status, CompletedAt FROM UVQueueWorkItem WHERE WorkItemHash = ?').get(tmpHash);
				Expect(tmpRow, 'row exists after update').to.exist;
				Expect(tmpRow.Status, 'Status patched').to.equal('Done');
				Expect(tmpRow.CompletedAt, 'CompletedAt patched').to.equal('2026-04-25T12:00:00.000Z');
			}
			finally { tmpDB.close(); }
			return fDone();
		}).catch(fDone);
	});

	test('updateAttemptOutcome patches an attempt row via two-column lookup-then-PUT', function (fDone)
	{
		let tmpHash = 'wi-attempt-' + Date.now();
		let tmpAttempt =
		{
			WorkItemHash: tmpHash,
			AttemptNumber: 1,
			BeaconID: 'bcn-test',
			StartedAt: new Date().toISOString(),
			EndedAt: '',
			Outcome: 'Pending',
			Error: ''
		};

		_Bridge.insertAttempt(tmpAttempt).then((pInsertResult) =>
		{
			Expect(pInsertResult.Success, `insertAttempt (Reason: ${pInsertResult.Reason})`).to.equal(true);
			return _Bridge.updateAttemptOutcome(tmpHash, 1, { Outcome: 'Success', EndedAt: '2026-04-25T12:01:00.000Z' });
		}).then((pUpdateResult) =>
		{
			Expect(pUpdateResult.Success, `updateAttemptOutcome (Reason: ${pUpdateResult.Reason})`).to.equal(true);

			let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
			try
			{
				let tmpRow = tmpDB.prepare('SELECT Outcome, EndedAt FROM UVQueueWorkItemAttempt WHERE WorkItemHash = ? AND AttemptNumber = ?').get(tmpHash, 1);
				Expect(tmpRow, 'attempt row exists').to.exist;
				Expect(tmpRow.Outcome).to.equal('Success');
				Expect(tmpRow.EndedAt).to.equal('2026-04-25T12:01:00.000Z');
			}
			finally { tmpDB.close(); }
			return fDone();
		}).catch(fDone);
	});

	test('removeManifest soft-deletes the manifest row via lookup-then-PUT (Deleted=1)', function (fDone)
	{
		let tmpRunHash = 'rh-remove-' + Date.now();
		let tmpManifest =
		{
			Hash: tmpRunHash,
			OperationHash: 'op-remove',
			OperationName: 'Remove Op',
			Status: 'Complete',
			RunMode: 'Direct',
			Live: false,
			StartTime: new Date().toISOString(),
			StopTime: new Date().toISOString(),
			ElapsedMs: 50,
			StagingPath: '',
			Output: {}
		};

		_ManifestBridge.upsertManifest(tmpManifest).then((pUpsertResult) =>
		{
			Expect(pUpsertResult.Success, `upsertManifest (Reason: ${pUpsertResult.Reason})`).to.equal(true);
			return _ManifestBridge.removeManifest(tmpRunHash);
		}).then((pRemoveResult) =>
		{
			Expect(pRemoveResult.Success, `removeManifest (Reason: ${pRemoveResult.Reason})`).to.equal(true);

			let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
			try
			{
				let tmpRow = tmpDB.prepare('SELECT Hash, Deleted FROM UVManifest WHERE Hash = ?').get(tmpRunHash);
				Expect(tmpRow, 'manifest row still present (soft-delete)').to.exist;
				Expect(tmpRow.Hash).to.equal(tmpRunHash);
				Expect(tmpRow.Deleted, 'Deleted flag set').to.equal(1);
			}
			finally { tmpDB.close(); }
			return fDone();
		}).catch(fDone);
	});

	test('setPersistenceAssignment writes persistence-assignment.json with both Queue and Manifest entries', function ()
	{
		_Bridge.setPersistenceAssignment(_StubBeaconID, _IDExternalConnection);
		_ManifestBridge.setPersistenceAssignment(_StubBeaconID, _IDExternalConnection);

		let tmpAssignmentPath = libPath.join(TEST_DIR, 'persistence-assignment.json');
		Expect(libFs.existsSync(tmpAssignmentPath), 'assignment file exists').to.equal(true);
		let tmpDoc = JSON.parse(libFs.readFileSync(tmpAssignmentPath, 'utf8'));
		Expect(tmpDoc).to.have.property('Queue');
		Expect(tmpDoc).to.have.property('Manifest');
		Expect(tmpDoc.Queue.BeaconID).to.equal(_StubBeaconID);
		Expect(tmpDoc.Manifest.BeaconID).to.equal(_StubBeaconID);
		Expect(tmpDoc.Queue.IDBeaconConnection).to.equal(_IDExternalConnection);
		Expect(tmpDoc.Manifest.IDBeaconConnection).to.equal(_IDExternalConnection);

		let tmpQueueStatus = _Bridge.getPersistenceStatus();
		Expect(tmpQueueStatus.State, 'queue is bootstrapped (assignment + earlier bootstrap)').to.equal('bootstrapped');
		Expect(tmpQueueStatus.AssignedBeaconID).to.equal(_StubBeaconID);

		let tmpManifestStatus = _ManifestBridge.getPersistenceStatus();
		Expect(tmpManifestStatus.State).to.equal('bootstrapped');
		Expect(tmpManifestStatus.AssignedBeaconID).to.equal(_StubBeaconID);
	});

	// ─── Session 4: bootstrap-flush idempotency on appendEvent ───────
	// EventGUID is unique. Bootstrap-flush re-pushes events on every
	// reconnect; the bridge must surface the resulting unique-violation
	// as {Success: true, AlreadyPresent: true} so the flush sweep can
	// keep advancing instead of aborting.

	test('appendEvent twice with the same EventGUID returns AlreadyPresent on second call', function (fDone)
	{
		let tmpEvent =
		{
			EventGUID: '99999999-aaaa-bbbb-cccc-dddddddddddd',
			WorkItemHash: 'wi-idempotent-event',
			EventType: 'enqueued',
			Payload: '{}',
			EmittedAt: new Date().toISOString(),
			Seq: 1,
			FromStatus: '',
			ToStatus: 'Pending',
			BeaconID: 'bcn-self'
		};

		_Bridge.appendEvent(tmpEvent).then((pFirst) =>
		{
			Expect(pFirst.Success, `first append succeeds (Reason: ${pFirst.Reason})`).to.equal(true);
			Expect(pFirst.AlreadyPresent, 'first append is fresh insert').to.not.equal(true);

			return _Bridge.appendEvent(tmpEvent);
		}).then((pSecond) =>
		{
			Expect(pSecond.Success, `second append succeeds (Reason: ${pSecond.Reason})`).to.equal(true);
			Expect(pSecond.AlreadyPresent, 'second append is AlreadyPresent').to.equal(true);

			let tmpDB = new libBetterSqlite(UV_DB_PATH, { readonly: true });
			try
			{
				let tmpCount = tmpDB.prepare('SELECT COUNT(*) AS n FROM UVQueueWorkItemEvent WHERE EventGUID = ?').get(tmpEvent.EventGUID).n;
				Expect(tmpCount, 'exactly one row landed').to.equal(1);
			}
			finally { tmpDB.close(); }
			return fDone();
		}).catch(fDone);
	});

	test('clearPersistenceAssignment drops state and getPersistenceStatus reports unassigned', function ()
	{
		_Bridge.clearPersistenceAssignment();
		_ManifestBridge.clearPersistenceAssignment();

		Expect(_Bridge.getPersistenceStatus().State).to.equal('unassigned');
		Expect(_ManifestBridge.getPersistenceStatus().State).to.equal('unassigned');
	});
});

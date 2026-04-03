/**
 * DataBeacon Dashboard View
 *
 * Status overview: connection count, table count, endpoint count, beacon status.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Dashboard',

	DefaultRenderable: 'DataBeacon-Dashboard',
	DefaultDestinationAddress: '#DataBeacon-View-Dashboard',

	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-Dashboard-Template',
			Template: '<div class="dashboard" id="DataBeacon-Dashboard-Content"></div>'
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Dashboard',
			TemplateHash: 'DataBeacon-Dashboard-Template',
			DestinationAddress: '#DataBeacon-View-Dashboard'
		}
	]
};

class PictViewDataBeaconDashboard extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender()
	{
		let tmpConnections = this.pict.AppData.Connections || [];
		let tmpEndpoints = this.pict.AppData.Endpoints || [];
		let tmpBeaconStatus = this.pict.AppData.BeaconStatus || {};

		let tmpConnectedCount = 0;
		for (let i = 0; i < tmpConnections.length; i++)
		{
			if (tmpConnections[i].Connected) tmpConnectedCount++;
		}

		let tmpBeaconClass = tmpBeaconStatus.Connected ? 'status-connected' : 'status-disconnected';
		let tmpBeaconLabel = tmpBeaconStatus.Connected ? 'Connected' : 'Not Connected';

		let tmpHTML = `
	<h1>DataBeacon Dashboard</h1>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">${tmpConnections.length}</div>
			<div class="stat-label">Database Connections</div>
			<div class="stat-detail">${tmpConnectedCount} active</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">${tmpEndpoints.length}</div>
			<div class="stat-label">Active Endpoints</div>
			<div class="stat-detail">REST API routes</div>
		</div>
		<div class="stat-card">
			<div class="stat-value ${tmpBeaconClass}">${tmpBeaconLabel}</div>
			<div class="stat-label">Ultravisor Beacon</div>
			<div class="stat-detail">${tmpBeaconStatus.BeaconName || 'retold-databeacon'}</div>
		</div>
	</div>

	<div class="section">
		<h2>Quick Actions</h2>
		<div class="button-row">
			<button class="btn btn-primary" onclick="window.DataBeaconApp.navigateTo('Connections')">Manage Connections</button>
			<button class="btn btn-secondary" onclick="window.DataBeaconApp.navigateTo('Endpoints')">View Endpoints</button>
		</div>
	</div>

	${this._renderConnectionSummary(tmpConnections)}`;

		let tmpEl = document.getElementById('DataBeacon-Dashboard-Content');
		if (tmpEl)
		{
			tmpEl.innerHTML = tmpHTML;
		}

		return super.onAfterRender();
	}

	_renderConnectionSummary(pConnections)
	{
		if (pConnections.length === 0) return '';

		let tmpRows = '';
		for (let i = 0; i < pConnections.length; i++)
		{
			let tmpConn = pConnections[i];
			let tmpStatusClass = tmpConn.Connected ? 'badge-success' : 'badge-neutral';
			let tmpStatusLabel = tmpConn.Connected ? 'Connected' : tmpConn.Status;
			tmpRows += `<tr><td>${tmpConn.Name}</td><td>${tmpConn.Type}</td><td><span class="badge ${tmpStatusClass}">${tmpStatusLabel}</span></td></tr>`;
		}

		return `
	<div class="section">
		<h2>Connections</h2>
		<table class="data-table">
			<thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead>
			<tbody>${tmpRows}</tbody>
		</table>
	</div>`;
	}
}

module.exports = PictViewDataBeaconDashboard;
module.exports.default_configuration = _ViewConfiguration;

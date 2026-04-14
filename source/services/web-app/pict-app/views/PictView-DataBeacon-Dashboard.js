/**
 * DataBeacon Dashboard View
 *
 * Overview screen: stats cards (connection counts, endpoint count, beacon
 * status), a quick-actions block, and a summary table of all connections.
 * All HTML is declarative; per-row fields are pre-computed by the
 * DataBeacon provider into AppData.Dashboard.*.
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
			Template: /*html*/`
<div id="DataBeacon-Dashboard-Root" class="dashboard-view">
	<h1>DataBeacon Dashboard</h1>

	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-value">{~D:AppData.Dashboard.TotalConnections:0~}</div>
			<div class="stat-label">Database Connections</div>
			<div class="stat-detail">{~D:AppData.Dashboard.ActiveConnections:0~} active</div>
		</div>
		<div class="stat-card">
			<div class="stat-value">{~D:AppData.Dashboard.TotalEndpoints:0~}</div>
			<div class="stat-label">Active Endpoints</div>
			<div class="stat-detail">REST API routes</div>
		</div>
		<div class="stat-card">
			<div class="stat-value"><span class="badge {~D:AppData.Dashboard.BeaconBadgeClass~}">{~D:AppData.Dashboard.BeaconStatusLabel~}</span></div>
			<div class="stat-label">Ultravisor Beacon</div>
			<div class="stat-detail">{~D:AppData.Dashboard.BeaconName:retold-databeacon~}</div>
		</div>
	</div>

	<div class="section">
		<h2>Quick Actions</h2>
		<div class="button-row">
			<button class="btn btn-primary" data-databeacon-action="navigate" data-view="Connections">
				<span data-databeacon-icon="connections" data-icon-size="16"></span>
				Manage Connections
			</button>
			<button class="btn btn-secondary" data-databeacon-action="navigate" data-view="Endpoints">
				<span data-databeacon-icon="endpoints" data-icon-size="16"></span>
				View Endpoints
			</button>
		</div>
	</div>

	{~TemplateIfAbsolute:DataBeacon-Dashboard-ConnectionSummary-Table:AppData.Dashboard:AppData.Dashboard.TotalConnections^>^0~}
</div>`
		},
		{
			Hash: 'DataBeacon-Dashboard-ConnectionSummary-Table',
			Template: /*html*/`
<div class="section">
	<h2>Connections</h2>
	<table class="data-table">
		<thead><tr><th>Name</th><th>Type</th><th>Status</th></tr></thead>
		<tbody>{~TS:DataBeacon-Dashboard-ConnectionSummary-Row:AppData.Dashboard.ConnectionSummary~}</tbody>
	</table>
</div>`
		},
		{
			Hash: 'DataBeacon-Dashboard-ConnectionSummary-Row',
			Template: /*html*/`
<tr>
	<td>{~D:Record.Name~}</td>
	<td>{~D:Record.Type~}</td>
	<td><span class="badge {~D:Record.StatusBadgeClass~}">{~D:Record.StatusLabel~}</span></td>
</tr>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Dashboard',
			TemplateHash: 'DataBeacon-Dashboard-Template',
			ContentDestinationAddress: '#DataBeacon-View-Dashboard',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconDashboard extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-View-Dashboard');

		let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-Dashboard-Root');
		if (tmpRootList && tmpRootList.length > 0)
		{
			// A fresh DOM node is produced on every render, so we always attach.
			tmpRootList[0].addEventListener('click', (pEvent) =>
			{
				let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
				if (!tmpBtn) return;
				this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
			});
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_handleAction(pAction, pData)
	{
		if (pAction === 'navigate' && pData.view && this.pict.views.Layout)
		{
			this.pict.views.Layout.setActiveView(pData.view);
		}
	}
}

module.exports = PictViewDataBeaconDashboard;
module.exports.default_configuration = _ViewConfiguration;

/**
 * DataBeacon Endpoints View
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Endpoints',
	DefaultRenderable: 'DataBeacon-Endpoints',
	DefaultDestinationAddress: '#DataBeacon-View-Endpoints',
	AutoRender: false,
	Templates: [{ Hash: 'DataBeacon-Endpoints-Template', Template: '<div id="DataBeacon-Endpoints-Content" class="endpoints-view"></div>' }],
	Renderables: [{ RenderableHash: 'DataBeacon-Endpoints', TemplateHash: 'DataBeacon-Endpoints-Template', DestinationAddress: '#DataBeacon-View-Endpoints' }]
};

class PictViewDataBeaconEndpoints extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender()
	{
		let tmpEndpoints = this.pict.AppData.Endpoints || [];

		let tmpHTML = `
	<h1>Active REST Endpoints</h1>
	<div class="section"><div class="button-row"><button class="btn btn-secondary" onclick="DataBeacon_refreshEndpoints()">Refresh</button></div></div>
	${tmpEndpoints.length > 0 ? this._renderList(tmpEndpoints) : '<p class="empty-state">No dynamic endpoints enabled yet.</p>'}`;

		let tmpEl = document.getElementById('DataBeacon-Endpoints-Content');
		if (tmpEl) tmpEl.innerHTML = tmpHTML;

		window.DataBeacon_refreshEndpoints = () => { this.pict.providers.DataBeaconProvider.loadEndpoints(); };
		window.DataBeacon_browseEndpoint = (t) => { this.pict.AppData.SelectedTableName=t; this.pict.providers.DataBeaconProvider.loadRecords(t,50); window.DataBeaconApp.navigateTo('Records'); };
		window.DataBeacon_openEndpoint = (u) => { window.open(u,'_blank'); };

		return super.onAfterRender();
	}

	_renderList(pEndpoints)
	{
		let rows = '';
		for (let i = 0; i < pEndpoints.length; i++)
		{
			let ep = pEndpoints[i];
			rows += `<tr><td><strong>${ep.TableName}</strong></td><td>${ep.ConnectionType}</td><td><code>${ep.EndpointBase}</code></td><td class="actions-cell"><button class="btn btn-small btn-primary" onclick="DataBeacon_browseEndpoint('${ep.TableName}')">Browse</button> <button class="btn btn-small btn-secondary" onclick="DataBeacon_openEndpoint('${ep.EndpointBase}s/0/50')">API</button></td></tr>`;
		}
		return `<div class="section"><h2>Endpoints (${pEndpoints.length})</h2><table class="data-table"><thead><tr><th>Table</th><th>Type</th><th>Base</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table><div class="help-text"><p>CRUD: GET /1.0/{Table}s/{Begin}/{Cap}, GET /1.0/{Table}/{ID}, POST/PUT/DEL /1.0/{Table}</p></div></div>`;
	}
}

module.exports = PictViewDataBeaconEndpoints;
module.exports.default_configuration = _ViewConfiguration;

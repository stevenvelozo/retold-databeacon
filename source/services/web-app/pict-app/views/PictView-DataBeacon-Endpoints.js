/**
 * DataBeacon Endpoints View
 *
 * Lists active REST endpoints with Browse / API / Refresh actions. The
 * provider pre-computes each endpoint's API URL (EndpointAPIURL) so the
 * template can emit `data-api-url` without JS concatenation.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Endpoints',
	DefaultRenderable: 'DataBeacon-Endpoints',
	DefaultDestinationAddress: '#DataBeacon-View-Endpoints',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-Endpoints-Template',
			Template: /*html*/`
<div id="DataBeacon-Endpoints-Root" class="endpoints-view">
	<h1>Active REST Endpoints</h1>
	<div class="section">
		<div class="button-row">
			<a class="btn btn-secondary" href="#/endpoints/refresh">
				<span data-databeacon-icon="refresh" data-icon-size="16"></span>
				Refresh
			</a>
		</div>
	</div>
	{~TemplateIfAbsolute:DataBeacon-Endpoints-Empty:AppData.Endpoints:AppData.Endpoints.length^==^0~}
	{~TemplateIfAbsolute:DataBeacon-Endpoints-Table:AppData.Endpoints:AppData.Endpoints.length^>^0~}
</div>`
		},
		{
			Hash: 'DataBeacon-Endpoints-Empty',
			Template: `<p class="empty-state">No dynamic endpoints enabled yet.</p>`
		},
		{
			Hash: 'DataBeacon-Endpoints-Table',
			Template: /*html*/`
<div class="section">
	<h2>Endpoints ({~D:AppData.Endpoints.length:0~})</h2>
	<table class="data-table">
		<thead><tr><th>Table</th><th>Type</th><th>Base</th><th>Actions</th></tr></thead>
		<tbody>{~TS:DataBeacon-Endpoints-Row:AppData.Endpoints~}</tbody>
	</table>
	<div class="help-text">
		<p>CRUD: GET /1.0/{Table}s/{Begin}/{Cap}, GET /1.0/{Table}/{ID}, POST/PUT/DEL /1.0/{Table}</p>
	</div>
</div>`
		},
		{
			Hash: 'DataBeacon-Endpoints-Row',
			Template: /*html*/`
<tr>
	<td><strong>{~D:Record.TableName~}</strong></td>
	<td>{~D:Record.ConnectionType~}</td>
	<td><code>{~D:Record.EndpointBase~}</code></td>
	<td class="actions-cell">
		<a class="btn btn-small btn-primary" href="#/endpoints/{~D:Record.TableName~}/browse">
			<span data-databeacon-icon="eye" data-icon-size="14"></span> Browse
		</a>
		<a class="btn btn-small btn-secondary" href="{~D:Record.EndpointAPIURL~}" target="_blank" rel="noopener">
			<span data-databeacon-icon="external-link" data-icon-size="14"></span> API
		</a>
	</td>
</tr>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Endpoints',
			TemplateHash: 'DataBeacon-Endpoints-Template',
			ContentDestinationAddress: '#DataBeacon-View-Endpoints',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconEndpoints extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-Endpoints-Root');

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconEndpoints;
module.exports.default_configuration = _ViewConfiguration;

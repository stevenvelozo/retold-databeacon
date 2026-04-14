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
			<button class="btn btn-secondary" data-databeacon-action="refresh">
				<span data-databeacon-icon="refresh" data-icon-size="16"></span>
				Refresh
			</button>
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
		<button class="btn btn-small btn-primary" data-databeacon-action="browse" data-table-name="{~D:Record.TableName~}">
			<span data-databeacon-icon="eye" data-icon-size="14"></span> Browse
		</button>
		<button class="btn btn-small btn-secondary" data-databeacon-action="open-api" data-api-url="{~D:Record.EndpointAPIURL~}">
			<span data-databeacon-icon="external-link" data-icon-size="14"></span> API
		</button>
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

		let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-Endpoints-Root');
		if (tmpRootList && tmpRootList.length > 0)
		{
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
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		switch (pAction)
		{
			case 'refresh':
				tmpProvider.loadEndpoints();
				break;
			case 'browse':
				if (pData.tableName)
				{
					this.pict.AppData.SelectedTableName = pData.tableName;
					// Always restart paging from row 0 when jumping from Endpoints.
					if (!this.pict.AppData.RecordBrowser) this.pict.AppData.RecordBrowser = {};
					this.pict.AppData.RecordBrowser.CursorStart = 0;
					let tmpPageSize = this.pict.AppData.RecordBrowser.PageSize || 50;
					tmpProvider.loadRecords(pData.tableName, 0, tmpPageSize);
					if (this.pict.views.Layout) this.pict.views.Layout.setActiveView('Records');
				}
				break;
			case 'open-api':
				if (pData.apiUrl) window.open(pData.apiUrl, '_blank');
				break;
		}
	}
}

module.exports = PictViewDataBeaconEndpoints;
module.exports.default_configuration = _ViewConfiguration;

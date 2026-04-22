/**
 * DataBeacon ConnectionList View
 *
 * Renders saved connections as a table with per-row actions. The provider
 * pre-computes per-row display flags (StatusLabel, StatusBadgeClass, etc.)
 * into AppData.Connections so this template stays declarative.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'ConnectionList',
	DefaultRenderable: 'DataBeacon-ConnectionList',
	DefaultDestinationAddress: '#DataBeacon-ConnectionList-Slot',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-ConnectionList-Template',
			Template: /*html*/`
<div id="DataBeacon-ConnectionList-Root" class="section">
	<h2>Saved Connections ({~D:AppData.Connections.length:0~})</h2>
	{~TemplateIfAbsolute:DataBeacon-ConnectionList-Empty:AppData.Connections:AppData.Connections.length^==^0~}
	{~TemplateIfAbsolute:DataBeacon-ConnectionList-Table:AppData.Connections:AppData.Connections.length^>^0~}
</div>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Empty',
			Template: `<p class="empty-state">No connections yet.</p>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Table',
			Template: /*html*/`
<table class="data-table">
	<thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead>
	<tbody>{~TS:DataBeacon-ConnectionList-Row:AppData.Connections~}</tbody>
</table>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Row',
			Template: /*html*/`
<tr>
	<td><strong>{~D:Record.Name~}</strong></td>
	<td>{~D:Record.Type~}</td>
	<td><span class="badge {~D:Record.StatusBadgeClass~}">{~D:Record.StatusLabel~}</span></td>
	<td>{~D:Record.Description~}</td>
	<td class="actions-cell">
		{~TIf:DataBeacon-ConnectionList-Row-ConnectedActions::Record.Connected^TRUE^x~}
		{~TIf:DataBeacon-ConnectionList-Row-DisconnectedActions::Record.Connected^FALSE^x~}
		<a class="btn btn-small btn-danger" href="#/connections/{~D:Record.IDBeaconConnection~}/delete">
			<span data-databeacon-icon="trash" data-icon-size="14"></span> Delete
		</a>
	</td>
</tr>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Row-ConnectedActions',
			Template: /*html*/`
<a class="btn btn-small btn-secondary" href="#/connections/{~D:Record.IDBeaconConnection~}/introspect">
	<span data-databeacon-icon="introspection" data-icon-size="14"></span> Introspect
</a>
<a class="btn btn-small btn-warning" href="#/connections/{~D:Record.IDBeaconConnection~}/disconnect">
	<span data-databeacon-icon="disconnect" data-icon-size="14"></span> Disconnect
</a>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Row-DisconnectedActions',
			Template: /*html*/`
<a class="btn btn-small btn-primary" href="#/connections/{~D:Record.IDBeaconConnection~}/connect">
	<span data-databeacon-icon="connect" data-icon-size="14"></span> Connect
</a>
<a class="btn btn-small btn-secondary" href="#/connections/{~D:Record.IDBeaconConnection~}/test">
	<span data-databeacon-icon="test" data-icon-size="14"></span> Test
</a>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-ConnectionList',
			TemplateHash: 'DataBeacon-ConnectionList-Template',
			ContentDestinationAddress: '#DataBeacon-ConnectionList-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconConnectionList extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ConnectionList-Root');

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconConnectionList;
module.exports.default_configuration = _ViewConfiguration;

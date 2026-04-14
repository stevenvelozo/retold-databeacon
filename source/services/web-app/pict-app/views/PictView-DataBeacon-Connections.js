/**
 * DataBeacon Connections Page (container view)
 *
 * Thin container: renders two slot divs, then cascades a render call to
 * the ConnectionForm and ConnectionList sub-views. New sections for the
 * Connections screen can be added as additional sub-views without touching
 * this file or growing it.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Connections',
	DefaultRenderable: 'DataBeacon-ConnectionsPage',
	DefaultDestinationAddress: '#DataBeacon-View-Connections',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-ConnectionsPage-Template',
			Template: /*html*/`
<div class="connections-view">
	<h1>Database Connections</h1>
	<div id="DataBeacon-ConnectionForm-Slot"></div>
	<div id="DataBeacon-ConnectionList-Slot"></div>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-ConnectionsPage',
			TemplateHash: 'DataBeacon-ConnectionsPage-Template',
			ContentDestinationAddress: '#DataBeacon-View-Connections',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconConnections extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		if (this.pict.views.ConnectionForm) this.pict.views.ConnectionForm.render();
		if (this.pict.views.ConnectionList) this.pict.views.ConnectionList.render();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconConnections;
module.exports.default_configuration = _ViewConfiguration;

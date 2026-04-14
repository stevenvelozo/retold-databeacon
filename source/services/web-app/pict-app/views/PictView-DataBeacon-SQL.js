/**
 * DataBeacon SQL Page (container view)
 *
 * Dedicated page for ad-hoc SQL execution. Hosts the QueryPanel sub-view
 * so it has its own nav item (separated from record browsing).
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'SQL',
	DefaultRenderable: 'DataBeacon-SQLPage',
	DefaultDestinationAddress: '#DataBeacon-View-SQL',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-SQLPage-Template',
			Template: /*html*/`
<div class="sql-view">
	<h1>SQL Query</h1>
	<div id="DataBeacon-QueryPanel-Slot"></div>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-SQLPage',
			TemplateHash: 'DataBeacon-SQLPage-Template',
			ContentDestinationAddress: '#DataBeacon-View-SQL',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconSQL extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		if (this.pict.views.QueryPanel) this.pict.views.QueryPanel.render();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconSQL;
module.exports.default_configuration = _ViewConfiguration;

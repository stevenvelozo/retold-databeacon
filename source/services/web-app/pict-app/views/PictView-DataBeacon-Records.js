/**
 * DataBeacon Records Page (container view)
 *
 * Dedicated page for paging through table records. Hosts the RecordBrowser
 * sub-view only — SQL execution lives on its own page (see
 * PictView-DataBeacon-SQL.js) so the two workflows don't crowd each other.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Records',
	DefaultRenderable: 'DataBeacon-RecordsPage',
	DefaultDestinationAddress: '#DataBeacon-View-Records',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-RecordsPage-Template',
			Template: /*html*/`
<div class="records-view">
	<h1>Record Browser</h1>
	<div id="DataBeacon-RecordBrowser-Slot"></div>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-RecordsPage',
			TemplateHash: 'DataBeacon-RecordsPage-Template',
			ContentDestinationAddress: '#DataBeacon-View-Records',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconRecords extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onBeforeRender(pRenderable)
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		if (tmpProvider && typeof tmpProvider.refreshRecordBrowserViewData === 'function')
		{
			tmpProvider.refreshRecordBrowserViewData();
		}
		return super.onBeforeRender(pRenderable);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		if (this.pict.views.RecordBrowser) this.pict.views.RecordBrowser.render();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconRecords;
module.exports.default_configuration = _ViewConfiguration;

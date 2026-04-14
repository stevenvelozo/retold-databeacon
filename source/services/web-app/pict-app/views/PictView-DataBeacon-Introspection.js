/**
 * DataBeacon Introspection Page (container view)
 *
 * Hosts two sub-views: IntrospectionControls (picker + buttons + banner)
 * and IntrospectionTables (table grid + per-table detail modal).
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Introspection',
	DefaultRenderable: 'DataBeacon-IntrospectionPage',
	DefaultDestinationAddress: '#DataBeacon-View-Introspection',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-IntrospectionPage-Template',
			Template: /*html*/`
<div class="introspection-view">
	<h1>Schema Introspection</h1>
	<div id="DataBeacon-IntrospectionControls-Slot"></div>
	<div id="DataBeacon-IntrospectionTables-Slot"></div>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-IntrospectionPage',
			TemplateHash: 'DataBeacon-IntrospectionPage-Template',
			ContentDestinationAddress: '#DataBeacon-View-Introspection',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconIntrospection extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onBeforeRender(pRenderable)
	{
		// Ask the provider to refresh its view-shape for the Introspection
		// screen (auto-select single connection, compute banner, etc.)
		// before the sub-views attempt to read AppData.Introspection.
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		if (tmpProvider && typeof tmpProvider.refreshIntrospectionViewData === 'function')
		{
			tmpProvider.refreshIntrospectionViewData();
		}
		return super.onBeforeRender(pRenderable);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		if (this.pict.views.IntrospectionControls) this.pict.views.IntrospectionControls.render();
		if (this.pict.views.IntrospectionTables) this.pict.views.IntrospectionTables.render();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconIntrospection;
module.exports.default_configuration = _ViewConfiguration;

/**
 * DataBeacon — ConnectionForm view
 *
 * Thin wrapper around the shared `pict-section-connection-form` view.
 * This wrapper owns the persistent connection-record fields (Name,
 * Description, AutoConnect) plus the Save button; the schema-driven
 * provider <select> + per-provider field block is rendered by the
 * shared view into a slot inside this template.
 *
 * Wiring:
 *   - The shared view is registered in Pict-Application-DataBeacon.js
 *     with ContainerSelector = '#DataBeacon-ConnectionForm-FieldsSlot'
 *     and FieldIDPrefix = 'databeacon-conn'.
 *   - Pict-Provider-DataBeacon#loadAvailableTypes() fetches
 *     /beacon/connection/schemas and feeds the shared view via
 *     setSchemas().
 *   - On Save, this view reads name/description/autoconnect from its
 *     own DOM and pulls Type + Config out of the shared view via
 *     getProviderConfig(), then dispatches to provider.createConnection().
 *
 * Earlier versions of this view contained inline host/port/user/etc.
 * inputs that were show/hide-toggled per type — that's now handled by
 * the shared view, which also picks up MSSQL retry tuning, Solr
 * secure-mode, MongoDB pool size, etc. for free.
 */
'use strict';

const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier:            'ConnectionForm',
	DefaultRenderable:         'DataBeacon-ConnectionForm',
	DefaultDestinationAddress: '#DataBeacon-ConnectionForm-Slot',
	AutoRender:                false,

	Templates:
	[
		{
			Hash: 'DataBeacon-ConnectionForm-Template',
			Template: /*html*/`
<div id="DataBeacon-ConnectionForm-Root" class="section">
	<h2>Add Connection</h2>
	<div class="form-grid">
		<div class="form-group"><label>Name</label><input type="text" id="databeacon-connform-name" placeholder="My Database" /></div>
		<div class="form-group"><label>Description</label><input type="text" id="databeacon-connform-description" /></div>
		<div class="form-group checkbox-group"><label><input type="checkbox" id="databeacon-connform-autoconnect" /> Auto-connect on startup</label></div>
	</div>

	<!-- pict-section-connection-form renders the type select + per-provider field block here -->
	<div id="DataBeacon-ConnectionForm-FieldsSlot" style="margin-top:1em"></div>

	<div class="button-row" style="margin-top:1em">
		<a class="btn btn-primary" href="#/connections/create">
			<span data-databeacon-icon="plus" data-icon-size="16"></span>
			Add Connection
		</a>
	</div>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash:            'DataBeacon-ConnectionForm',
			TemplateHash:              'DataBeacon-ConnectionForm-Template',
			ContentDestinationAddress: '#DataBeacon-ConnectionForm-Slot',
			RenderMethod:              'replace'
		}
	]
};

class PictViewDataBeaconConnectionForm extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ConnectionForm-Root');

		// Make sure the schema-driven form renders into our slot.  The
		// shared view's AutoRender is false so we trigger it here once
		// our slot exists.
		let tmpFormView = this.pict.views['PictSection-ConnectionForm'];
		if (tmpFormView) { tmpFormView.render(); }

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	// Router-handler entry point.  Application.createConnection() calls this
	// via the `#/connections/create` route.
	_submit() { this._createConnection(); }

	_readValue(pSelector)
	{
		let tmpList = this.pict.ContentAssignment.getElement(pSelector);
		if (!tmpList || tmpList.length === 0) return '';
		return tmpList[0].value;
	}

	_readChecked(pSelector)
	{
		let tmpList = this.pict.ContentAssignment.getElement(pSelector);
		if (!tmpList || tmpList.length === 0) return false;
		return !!tmpList[0].checked;
	}

	_createConnection()
	{
		let tmpName        = this._readValue('#databeacon-connform-name') || 'Untitled';
		let tmpDescription = this._readValue('#databeacon-connform-description');
		let tmpAutoConnect = this._readChecked('#databeacon-connform-autoconnect');

		// Pull Type + Config out of the shared view.  Falls back to
		// empty if the schemas haven't loaded yet (defensive — the
		// Save button is rendered before the schema fetch returns).
		let tmpFormView = this.pict.views['PictSection-ConnectionForm'];
		let tmpConnInfo = (tmpFormView && typeof(tmpFormView.getProviderConfig) === 'function')
			? tmpFormView.getProviderConfig()
			: { Provider: 'MySQL', Config: {} };

		this.pict.providers.DataBeaconProvider.createConnection(
			{
				Name:        tmpName,
				Type:        tmpConnInfo.Provider || 'MySQL',
				Config:      tmpConnInfo.Config || {},
				AutoConnect: tmpAutoConnect,
				Description: tmpDescription
			});
	}
}

module.exports = PictViewDataBeaconConnectionForm;
module.exports.default_configuration = _ViewConfiguration;

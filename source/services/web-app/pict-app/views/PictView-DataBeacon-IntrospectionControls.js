/**
 * DataBeacon IntrospectionControls View
 *
 * Connection picker + Introspect / Introspect All buttons + a connection
 * banner showing the current selection. The dropdown only lists connected
 * databases; the provider pre-computes AppData.Introspection.ConnectedList
 * and AppData.Introspection.SelectedBanner for this view.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'IntrospectionControls',
	DefaultRenderable: 'DataBeacon-IntrospectionControls',
	DefaultDestinationAddress: '#DataBeacon-IntrospectionControls-Slot',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-IntrospectionControls-Template',
			Template: /*html*/`
<div id="DataBeacon-IntrospectionControls-Root" class="section">
	<div class="form-row">
		<div class="form-group">
			<label>Connection</label>
			<select id="databeacon-introspect-connection" onchange="{~P~}.PictApplication.selectIntrospectionConnection(this.value)">
				{~TemplateIfAbsolute:DataBeacon-IntrospectionControls-PlaceholderOption:AppData.Introspection:AppData.Introspection.ShowPlaceholder^TRUE^x~}
				{~TS:DataBeacon-IntrospectionControls-ConnectionOption:AppData.Introspection.ConnectedList~}
			</select>
		</div>
		<div class="form-group">
			<a class="btn btn-primary {~D:AppData.Introspection.RunDisabledClass~}" href="#/introspection/run">
				<span data-databeacon-icon="introspection" data-icon-size="16"></span>
				Introspect
			</a>
		</div>
		<div class="form-group">
			<a class="btn btn-secondary {~D:AppData.Introspection.AllDisabledClass~}" href="#/introspection/all">
				<span data-databeacon-icon="refresh" data-icon-size="16"></span>
				Introspect All
			</a>
		</div>
	</div>
	{~TemplateIfAbsolute:DataBeacon-IntrospectionControls-Banner:AppData.Introspection.SelectedBanner:AppData.Introspection.HasSelection^TRUE^x~}
</div>`
		},
		{
			Hash: 'DataBeacon-IntrospectionControls-PlaceholderOption',
			Template: `<option value="">-- Select Connection --</option>`
		},
		{
			Hash: 'DataBeacon-IntrospectionControls-ConnectionOption',
			Template: `<option value="{~D:Record.IDBeaconConnection~}" {~D:Record.SelectedAttr~}>{~D:Record.Name~} ({~D:Record.Type~})</option>`
		},
		{
			Hash: 'DataBeacon-IntrospectionControls-Banner',
			Template: /*html*/`
<div class="connection-banner">
	<span class="connection-banner-name">{~D:AppData.Introspection.SelectedBanner.Name~}</span>
	<span class="badge {~D:AppData.Introspection.SelectedBanner.StatusBadgeClass~}">{~D:AppData.Introspection.SelectedBanner.StatusLabel~}</span>
	<span class="connection-banner-type">{~D:AppData.Introspection.SelectedBanner.Type~}</span>
	{~TemplateIfAbsolute:DataBeacon-IntrospectionControls-BannerDesc:AppData.Introspection.SelectedBanner:AppData.Introspection.SelectedBanner.HasDescription^TRUE^x~}
</div>`
		},
		{
			Hash: 'DataBeacon-IntrospectionControls-BannerDesc',
			Template: `<span class="connection-banner-desc">{~D:AppData.Introspection.SelectedBanner.Description~}</span>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-IntrospectionControls',
			TemplateHash: 'DataBeacon-IntrospectionControls-Template',
			ContentDestinationAddress: '#DataBeacon-IntrospectionControls-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconIntrospectionControls extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-IntrospectionControls-Root');

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	// ── Router-handler entry points (called by Application) ────────────────

	_runIntrospect()
	{
		let tmpSelectedID = this.pict.AppData.SelectedConnectionID;
		if (tmpSelectedID) { this.pict.providers.DataBeaconProvider.introspect(tmpSelectedID); }
	}

	_selectConnection(pRawValue)
	{
		let tmpID = parseInt(pRawValue, 10);
		if (isNaN(tmpID)) tmpID = null;
		this.pict.AppData.SelectedConnectionID = tmpID;

		let tmpProvider = this.pict.providers.DataBeaconProvider;
		if (tmpID)
		{
			tmpProvider.loadTables(tmpID);
		}
		else
		{
			this.pict.AppData.Tables = [];
			if (tmpProvider.refreshIntrospectionViewData) tmpProvider.refreshIntrospectionViewData();
			if (this.pict.views.IntrospectionControls) this.pict.views.IntrospectionControls.render();
			if (this.pict.views.IntrospectionTables) this.pict.views.IntrospectionTables.render();
		}
	}

	// Public entry called from Application.introspectAll() via the
	// #/introspection/all route.  Iterates all connected connections and
	// introspects each in sequence.
	_introspectAll()
	{
		let tmpConns = this.pict.AppData.Connections || [];
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpConnectedIDs = [];
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].Connected) tmpConnectedIDs.push(tmpConns[i].IDBeaconConnection);
		}
		let tmpIdx = 0;
		let tmpDoNext = () =>
		{
			if (tmpIdx >= tmpConnectedIDs.length)
			{
				if (this.pict.AppData.SelectedConnectionID)
				{
					tmpProvider.loadTables(this.pict.AppData.SelectedConnectionID);
				}
				return;
			}
			tmpProvider.introspect(tmpConnectedIDs[tmpIdx], () =>
			{
				tmpIdx++;
				tmpDoNext();
			});
		};
		tmpDoNext();
	}
}

module.exports = PictViewDataBeaconIntrospectionControls;
module.exports.default_configuration = _ViewConfiguration;

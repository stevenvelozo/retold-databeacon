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
			<select id="databeacon-introspect-connection" data-databeacon-action="select-connection">
				{~TemplateIfAbsolute:DataBeacon-IntrospectionControls-PlaceholderOption:AppData.Introspection:AppData.Introspection.ShowPlaceholder^TRUE^x~}
				{~TS:DataBeacon-IntrospectionControls-ConnectionOption:AppData.Introspection.ConnectedList~}
			</select>
		</div>
		<div class="form-group">
			<button class="btn btn-primary" data-databeacon-action="run-introspect" data-databeacon-disabled="{~D:AppData.Introspection.RunDisabled~}">
				<span data-databeacon-icon="introspection" data-icon-size="16"></span>
				Introspect
			</button>
		</div>
		<div class="form-group">
			<button class="btn btn-secondary" data-databeacon-action="introspect-all" data-databeacon-disabled="{~D:AppData.Introspection.AllDisabled~}">
				<span data-databeacon-icon="refresh" data-icon-size="16"></span>
				Introspect All
			</button>
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

		this._applyDisabledAttributes();

		let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-IntrospectionControls-Root');
		if (tmpRootList && tmpRootList.length > 0)
		{
			let tmpRoot = tmpRootList[0];
			tmpRoot.addEventListener('click', (pEvent) =>
			{
				let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
				if (!tmpBtn || tmpBtn.tagName !== 'BUTTON') return;
				this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
			});
			tmpRoot.addEventListener('change', (pEvent) =>
			{
				let tmpSelect = pEvent.target.closest('[data-databeacon-action="select-connection"]');
				if (!tmpSelect) return;
				this._handleSelection(tmpSelect.value);
			});
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_applyDisabledAttributes()
	{
		let tmpIntrospection = this.pict.AppData.Introspection || {};
		let tmpRunList = this.pict.ContentAssignment.getElement('[data-databeacon-action="run-introspect"]');
		if (tmpRunList && tmpRunList.length > 0)
		{
			tmpRunList[0].disabled = !!tmpIntrospection.RunDisabled;
		}
		let tmpAllList = this.pict.ContentAssignment.getElement('[data-databeacon-action="introspect-all"]');
		if (tmpAllList && tmpAllList.length > 0)
		{
			tmpAllList[0].disabled = !!tmpIntrospection.AllDisabled;
		}
	}

	_handleAction(pAction)
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpSelectedID = this.pict.AppData.SelectedConnectionID;

		if (pAction === 'run-introspect')
		{
			if (tmpSelectedID) tmpProvider.introspect(tmpSelectedID);
		}
		else if (pAction === 'introspect-all')
		{
			this._introspectAll();
		}
	}

	_handleSelection(pRawValue)
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

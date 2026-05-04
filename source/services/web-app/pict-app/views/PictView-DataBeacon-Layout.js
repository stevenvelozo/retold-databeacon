/**
 * DataBeacon Layout View
 *
 * Shell: fixed left sidebar with navigation, plus a set of mount-point
 * panels for each page view. Each page view renders into its dedicated
 * `#DataBeacon-View-<Name>` panel.
 *
 * Navigation, active-state tracking, and CSS injection live here (the
 * layout is the only view that owns the chrome).
 */
const libPictView = require('pict-view');

const _NavItems =
[
	{ View: 'Dashboard',     Slug: 'dashboard',     Label: 'Dashboard',     Icon: 'dashboard' },
	{ View: 'Connections',   Slug: 'connections',   Label: 'Connections',   Icon: 'connections' },
	{ View: 'Introspection', Slug: 'introspection', Label: 'Introspection', Icon: 'introspection' },
	{ View: 'Endpoints',     Slug: 'endpoints',     Label: 'Endpoints',     Icon: 'endpoints' },
	{ View: 'Records',       Slug: 'records',       Label: 'Records',       Icon: 'records' },
	{ View: 'SQL',           Slug: 'sql',           Label: 'SQL',           Icon: 'terminal' }
];

const _ViewConfiguration =
{
	ViewIdentifier: 'Layout',
	DefaultRenderable: 'DataBeacon-Layout',
	DefaultDestinationAddress: '#DataBeacon-App',
	AutoRender: false,

	CSS: /*css*/`
		.sidebar-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
		.sidebar-header-text { flex: 1 1 auto; min-width: 0; }
		.sidebar-header-controls { flex: 0 0 auto; }
		.nav-item { display: flex; align-items: center; gap: 10px; }
		.nav-icon { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; }
		.nav-icon svg { display: block; }
		.nav-label { line-height: 1; }
		.btn [data-databeacon-icon] { display: inline-flex; align-items: center; margin-right: 6px; vertical-align: middle; }
		.btn [data-databeacon-icon] svg { display: block; }
		.actions-cell .btn { display: inline-flex; align-items: center; }
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-Layout-Shell',
			Template: /*html*/`
<div class="app-container">
	<div class="sidebar">
		<div class="sidebar-header">
			<div class="sidebar-header-text">
				<h2>DataBeacon{~D:AppData.Dashboard.BeaconNameDisplay~}</h2>
				<span class="version">v0.0.1</span>
			</div>
			<div class="sidebar-header-controls" id="DataBeacon-ThemeSwitcher-Slot"></div>
		</div>
		<nav class="sidebar-nav" id="DataBeacon-Sidebar-Nav">{~TS:DataBeacon-Layout-NavItem:AppData.Layout.NavItems~}</nav>
	</div>
	<div class="main-content">
		<div id="DataBeacon-View-Dashboard" class="view-panel"></div>
		<div id="DataBeacon-View-Connections" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Introspection" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Endpoints" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Records" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-SQL" class="view-panel" style="display:none;"></div>
	</div>
</div>`
		},
		{
			Hash: 'DataBeacon-Layout-NavItem',
			Template: /*html*/`
<a class="nav-item" href="#/view/{~D:Record.Slug~}" data-view-nav="{~D:Record.View~}">
	<span class="nav-icon" data-databeacon-icon="{~D:Record.Icon~}" data-icon-size="20"></span>
	<span class="nav-label">{~D:Record.Label~}</span>
</a>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Layout',
			TemplateHash: 'DataBeacon-Layout-Shell',
			ContentDestinationAddress: '#DataBeacon-App',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconLayout extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onBeforeRender(pRenderable)
	{
		// Publish the nav-item list so the template can iterate over it.
		if (!this.pict.AppData.Layout) this.pict.AppData.Layout = {};
		this.pict.AppData.Layout.NavItems = _NavItems;
		return super.onBeforeRender(pRenderable);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		// Fill SVG icon placeholders in the sidebar (and anywhere else the layout owns).
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-App');

		// Mount the theme-switcher widget into its sidebar-header slot.
		if (this.pict.views.ThemeSwitcher) this.pict.views.ThemeSwitcher.render();

		// Ensure every view's CSS (including pict-section-modal's) is in the DOM.
		if (this.pict.CSSMap && typeof this.pict.CSSMap.injectCSS === 'function')
		{
			this.pict.CSSMap.injectCSS();
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	/**
	 * Switch the visible page panel and nav highlight, then trigger
	 * the target view's render so it has fresh data on display.
	 * @param {string} pViewName
	 */
	setActiveView(pViewName)
	{
		this.pict.AppData.CurrentView = pViewName;

		// Toggle panel visibility.
		for (let i = 0; i < _NavItems.length; i++)
		{
			let tmpName = _NavItems[i].View;
			let tmpPanelList = this.pict.ContentAssignment.getElement(`#DataBeacon-View-${tmpName}`);
			if (tmpPanelList && tmpPanelList.length > 0)
			{
				tmpPanelList[0].style.display = (tmpName === pViewName) ? 'block' : 'none';
			}
		}

		// Toggle .active on the nav items.
		let tmpNavItems = this.pict.ContentAssignment.getElement('[data-view-nav]');
		if (tmpNavItems && tmpNavItems.length)
		{
			for (let i = 0; i < tmpNavItems.length; i++)
			{
				let tmpName = tmpNavItems[i].getAttribute('data-view-nav');
				if (tmpName === pViewName) tmpNavItems[i].classList.add('active');
				else tmpNavItems[i].classList.remove('active');
			}
		}

		// Render the active page view (container pages cascade to sub-views).
		let tmpView = this.pict.views[pViewName];
		if (tmpView && typeof tmpView.render === 'function')
		{
			tmpView.render();
		}
	}
}

module.exports = PictViewDataBeaconLayout;
module.exports.default_configuration = _ViewConfiguration;

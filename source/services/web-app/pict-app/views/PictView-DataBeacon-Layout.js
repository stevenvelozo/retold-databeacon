/**
 * DataBeacon Layout View
 *
 * Shell layout with sidebar navigation and content container.
 */
const libPictView = require('pict-view');

const _LayoutTemplate = `
<div class="app-container">
	<div class="sidebar">
		<div class="sidebar-header">
			<h2>DataBeacon</h2>
			<span class="version">v0.0.1</span>
		</div>
		<nav class="sidebar-nav">
			<div class="nav-item active" data-view="Dashboard" onclick="window.DataBeaconApp.navigateTo('Dashboard')">
				<span class="nav-icon">&#9632;</span> Dashboard
			</div>
			<div class="nav-item" data-view="Connections" onclick="window.DataBeaconApp.navigateTo('Connections')">
				<span class="nav-icon">&#9672;</span> Connections
			</div>
			<div class="nav-item" data-view="Introspection" onclick="window.DataBeaconApp.navigateTo('Introspection')">
				<span class="nav-icon">&#9881;</span> Introspection
			</div>
			<div class="nav-item" data-view="Endpoints" onclick="window.DataBeaconApp.navigateTo('Endpoints')">
				<span class="nav-icon">&#9889;</span> Endpoints
			</div>
			<div class="nav-item" data-view="Records" onclick="window.DataBeaconApp.navigateTo('Records')">
				<span class="nav-icon">&#9776;</span> Records
			</div>
		</nav>
	</div>
	<div class="main-content">
		<div id="DataBeacon-View-Dashboard" class="view-panel"></div>
		<div id="DataBeacon-View-Connections" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Introspection" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Endpoints" class="view-panel" style="display:none;"></div>
		<div id="DataBeacon-View-Records" class="view-panel" style="display:none;"></div>
	</div>
</div>`;

const _ViewConfiguration =
{
	ViewIdentifier: 'Layout',

	DefaultRenderable: 'DataBeacon-Layout',
	DefaultDestinationAddress: '#DataBeacon-App',

	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-Layout-Template',
			Template: _LayoutTemplate
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Layout',
			TemplateHash: 'DataBeacon-Layout-Template',
			DestinationAddress: '#DataBeacon-App'
		}
	]
};

class PictViewDataBeaconLayout extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}
}

module.exports = PictViewDataBeaconLayout;
module.exports.default_configuration = _ViewConfiguration;

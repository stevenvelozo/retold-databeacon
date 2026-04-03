/**
 * Retold DataBeacon — Pict Application
 *
 * Main web application class for the DataBeacon web UI.
 */
const libPictApplication = require('pict-application');

const libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');

const libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
const libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
const libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
const libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
const libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
const libViewRecords = require('./views/PictView-DataBeacon-Records.js');

class DataBeaconApplication extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'DataBeaconApplication';

		// Register the API provider
		this.pict.addProvider('DataBeaconProvider', libDataBeaconProvider.default_configuration, libDataBeaconProvider);

		// Register views
		this.pict.addView('Layout', libViewLayout.default_configuration, libViewLayout);
		this.pict.addView('Dashboard', libViewDashboard.default_configuration, libViewDashboard);
		this.pict.addView('Connections', libViewConnections.default_configuration, libViewConnections);
		this.pict.addView('Introspection', libViewIntrospection.default_configuration, libViewIntrospection);
		this.pict.addView('Endpoints', libViewEndpoints.default_configuration, libViewEndpoints);
		this.pict.addView('Records', libViewRecords.default_configuration, libViewRecords);
	}

	onAfterInitializeAsync(fCallback)
	{
		// Set up application state
		if (!this.pict.AppData) this.pict.AppData = {};
		this.pict.AppData.Connections = [];
		this.pict.AppData.AvailableTypes = [];
		this.pict.AppData.Tables = [];
		this.pict.AppData.Endpoints = [];
		this.pict.AppData.SelectedConnectionID = null;
		this.pict.AppData.SelectedTableName = null;
		this.pict.AppData.Records = [];
		this.pict.AppData.BeaconStatus = { Connected: false };
		this.pict.AppData.CurrentView = 'Dashboard';

		// Store reference on window for onclick handlers
		window.DataBeaconApp = this;

		// Render layout
		this.pict.views.Layout.render();

		// Load initial data
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		if (tmpProvider)
		{
			tmpProvider.loadConnections();
			tmpProvider.loadAvailableTypes();
			tmpProvider.loadEndpoints();
			tmpProvider.loadBeaconStatus();
		}

		// Show dashboard by default
		this.navigateTo('Dashboard');

		return super.onAfterInitializeAsync(fCallback);
	}

	navigateTo(pViewName)
	{
		this.pict.AppData.CurrentView = pViewName;

		// Hide all content views, show the requested one
		let tmpViews = ['Dashboard', 'Connections', 'Introspection', 'Endpoints', 'Records'];
		for (let i = 0; i < tmpViews.length; i++)
		{
			let tmpEl = document.getElementById(`DataBeacon-View-${tmpViews[i]}`);
			if (tmpEl)
			{
				tmpEl.style.display = (tmpViews[i] === pViewName) ? 'block' : 'none';
			}
		}

		// Update nav active state
		let tmpNavItems = document.querySelectorAll('.nav-item');
		for (let i = 0; i < tmpNavItems.length; i++)
		{
			tmpNavItems[i].classList.remove('active');
			if (tmpNavItems[i].dataset.view === pViewName)
			{
				tmpNavItems[i].classList.add('active');
			}
		}

		// Trigger view-specific refresh
		if (this.pict.views[pViewName] && this.pict.views[pViewName].render)
		{
			this.pict.views[pViewName].render();
		}
	}
}

module.exports = DataBeaconApplication;
module.exports.default_configuration = {};

/**
 * Retold DataBeacon — Pict Application
 *
 * Main web application class for the DataBeacon web UI. Registers
 * providers and views; boots AppData; delegates navigation to the
 * Layout view.
 */
const libPictApplication = require('pict-application');
const libPictSectionModal = require('pict-section-modal');
const libPictSectionCode = require('pict-section-code');

const libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');
const libDataBeaconIconsProvider = require('./providers/Pict-Provider-DataBeacon-Icons.js');
const libDataBeaconThemeProvider = require('./providers/Pict-Provider-DataBeacon-Theme.js');

// Page / container views
const libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
const libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
const libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
const libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
const libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
const libViewRecords = require('./views/PictView-DataBeacon-Records.js');
const libViewSQL = require('./views/PictView-DataBeacon-SQL.js');

// Sub-views composed into the container pages
const libViewConnectionForm = require('./views/PictView-DataBeacon-ConnectionForm.js');
const libViewConnectionList = require('./views/PictView-DataBeacon-ConnectionList.js');
const libViewIntrospectionControls = require('./views/PictView-DataBeacon-IntrospectionControls.js');
const libViewIntrospectionTables = require('./views/PictView-DataBeacon-IntrospectionTables.js');
const libViewRecordBrowser = require('./views/PictView-DataBeacon-RecordBrowser.js');
const libViewQueryPanel = require('./views/PictView-DataBeacon-QueryPanel.js');
const libViewThemeSwitcher = require('./views/PictView-DataBeacon-ThemeSwitcher.js');

class DataBeaconApplication extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'DataBeaconApplication';

		// Providers — Theme comes first so the body data-attributes are
		// applied before any view renders (no flash of un-themed content).
		this.pict.addProvider('DataBeacon-Theme', libDataBeaconThemeProvider.default_configuration, libDataBeaconThemeProvider);
		this.pict.addProvider('DataBeaconProvider', libDataBeaconProvider.default_configuration, libDataBeaconProvider);
		this.pict.addProvider('DataBeacon-Icons', libDataBeaconIconsProvider.default_configuration, libDataBeaconIconsProvider);

		// Shell + page views
		this.pict.addView('Layout', libViewLayout.default_configuration, libViewLayout);
		this.pict.addView('Dashboard', libViewDashboard.default_configuration, libViewDashboard);
		this.pict.addView('Connections', libViewConnections.default_configuration, libViewConnections);
		this.pict.addView('Introspection', libViewIntrospection.default_configuration, libViewIntrospection);
		this.pict.addView('Endpoints', libViewEndpoints.default_configuration, libViewEndpoints);
		this.pict.addView('Records', libViewRecords.default_configuration, libViewRecords);
		this.pict.addView('SQL', libViewSQL.default_configuration, libViewSQL);

		// Sub-views
		this.pict.addView('ConnectionForm', libViewConnectionForm.default_configuration, libViewConnectionForm);
		this.pict.addView('ConnectionList', libViewConnectionList.default_configuration, libViewConnectionList);
		this.pict.addView('IntrospectionControls', libViewIntrospectionControls.default_configuration, libViewIntrospectionControls);
		this.pict.addView('IntrospectionTables', libViewIntrospectionTables.default_configuration, libViewIntrospectionTables);
		this.pict.addView('RecordBrowser', libViewRecordBrowser.default_configuration, libViewRecordBrowser);
		this.pict.addView('QueryPanel', libViewQueryPanel.default_configuration, libViewQueryPanel);
		this.pict.addView('ThemeSwitcher', libViewThemeSwitcher.default_configuration, libViewThemeSwitcher);

		// SQL code editor (pict-section-code + CodeJar) — registered separately so the
		// QueryPanel view can mount it into its editor slot each time it renders.
		this.pict.addView('SQLEditor',
		{
			ViewIdentifier: 'SQLEditor',
			TargetElementAddress: '#DataBeacon-QueryPanel-Editor',
			Language: 'sql',
			LineNumbers: true,
			ReadOnly: false,
			CodeDataAddress: 'AppData.QueryPanel.SQL',
			DefaultCode: '',
			AutoRender: false
		}, libPictSectionCode);

		// Modal service (pict-section-modal exposes show/confirm/toast via pict.views.PictSectionModal)
		this.pict.addView('PictSectionModal', libPictSectionModal.default_configuration, libPictSectionModal);
	}

	onAfterInitializeAsync(fCallback)
	{
		// Set up application state.
		if (!this.pict.AppData) this.pict.AppData = {};
		this.pict.AppData.Connections = [];
		this.pict.AppData.AvailableTypes = [];
		this.pict.AppData.AvailableTypesForForm = [];
		this.pict.AppData.Tables = [];
		this.pict.AppData.Endpoints = [];
		this.pict.AppData.SelectedConnectionID = null;
		this.pict.AppData.SelectedTableName = null;
		this.pict.AppData.Records = [];
		this.pict.AppData.BeaconStatus = { Connected: false };
		this.pict.AppData.CurrentView = 'Dashboard';

		// Seed the view-shape AppData branches so the first render of each
		// screen has something to bind against (providers overwrite these
		// as soon as API responses arrive).
		this.pict.AppData.Dashboard =
		{
			TotalConnections: 0,
			ActiveConnections: 0,
			TotalEndpoints: 0,
			BeaconStatusLabel: 'Unknown',
			BeaconBadgeClass: 'badge-neutral',
			BeaconName: 'retold-databeacon',
			ConnectionSummary: []
		};
		this.pict.AppData.Introspection =
		{
			ConnectedList: [],
			ShowPlaceholder: true,
			HasSelection: false,
			SelectedBanner: null,
			RunDisabled: true,
			AllDisabled: true,
			State: 'NoConnections',
			TablesView: [],
			TablesHeader: null,
			DetailModalColumns: []
		};
		this.pict.AppData.QueryPanel = { SQL: '' };
		this.pict.AppData.RecordBrowser =
		{
			TableOptions: [],
			PageSizeOptions: [],
			SelectedTableName: '',
			TableName: '',
			CursorStart: 0,
			PageSize: 50,
			PrevDisabled: true,
			NextDisabled: true,
			LoadDisabled: true,
			RangeLabel: '',
			State: 'NoSelection',
			ColumnList: [],
			Rows: []
		};

		// Keep a window handle for legacy/debug access only; views do NOT rely on it.
		if (typeof window !== 'undefined') window.DataBeaconApp = this;

		// Render the shell.
		this.pict.views.Layout.render();

		// Load initial data.
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		if (tmpProvider)
		{
			tmpProvider.loadConnections();
			tmpProvider.loadAvailableTypes();
			tmpProvider.loadEndpoints();
			tmpProvider.loadBeaconStatus();
		}

		// Land on the dashboard.
		this.navigateTo('Dashboard');

		return super.onAfterInitializeAsync(fCallback);
	}

	/**
	 * Public navigation hook (also exposed on `window.DataBeaconApp` for legacy).
	 * Delegates to the Layout view which owns the active-panel state.
	 * @param {string} pViewName
	 */
	navigateTo(pViewName)
	{
		if (this.pict.views.Layout && typeof this.pict.views.Layout.setActiveView === 'function')
		{
			this.pict.views.Layout.setActiveView(pViewName);
		}
	}
}

module.exports = DataBeaconApplication;
module.exports.default_configuration = {};

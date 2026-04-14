/**
 * Retold DataBeacon — Browser Bundle Entry
 *
 * This file is the entry point for the Pict web application bundle.
 * Quackage (browserify) processes this file to produce retold-databeacon.js.
 */
let libPictApplication = require('pict-application');
let libPictView = require('pict-view');
let libPictRouter = require('pict-router');
let libPictSectionCode = require('pict-section-code');

// Application
let libDataBeaconApplication = require('./Pict-Application-DataBeacon.js');

// Providers
let libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');
let libDataBeaconIconsProvider = require('./providers/Pict-Provider-DataBeacon-Icons.js');
let libDataBeaconThemeProvider = require('./providers/Pict-Provider-DataBeacon-Theme.js');
let libDataBeaconExportProvider = require('./providers/Pict-Provider-DataBeacon-Export.js');
let libDataBeaconSavedQueriesProvider = require('./providers/Pict-Provider-DataBeacon-SavedQueries.js');

// Views — Layout + page/container views
let libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
let libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
let libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
let libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
let libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
let libViewRecords = require('./views/PictView-DataBeacon-Records.js');
let libViewSQL = require('./views/PictView-DataBeacon-SQL.js');

// Views — sub-views that make up the page containers
let libViewConnectionForm = require('./views/PictView-DataBeacon-ConnectionForm.js');
let libViewConnectionList = require('./views/PictView-DataBeacon-ConnectionList.js');
let libViewIntrospectionControls = require('./views/PictView-DataBeacon-IntrospectionControls.js');
let libViewIntrospectionTables = require('./views/PictView-DataBeacon-IntrospectionTables.js');
let libViewRecordBrowser = require('./views/PictView-DataBeacon-RecordBrowser.js');
let libViewQueryPanel = require('./views/PictView-DataBeacon-QueryPanel.js');
let libViewThemeSwitcher = require('./views/PictView-DataBeacon-ThemeSwitcher.js');
let libViewSavedQueriesList = require('./views/PictView-DataBeacon-SavedQueriesList.js');

// Expose the application class on window for Pict.safeLoadPictApplication
window.DataBeaconApplication = libDataBeaconApplication;

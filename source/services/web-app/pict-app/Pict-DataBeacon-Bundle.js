/**
 * Retold DataBeacon — Browser Bundle Entry
 *
 * This file is the entry point for the Pict web application bundle.
 * Quackage (browserify) processes this file to produce retold-databeacon.js.
 */
let libPictApplication = require('pict-application');
let libPictView = require('pict-view');
let libPictRouter = require('pict-router');

// Application
let libDataBeaconApplication = require('./Pict-Application-DataBeacon.js');

// Provider
let libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');

// Views
let libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
let libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
let libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
let libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
let libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
let libViewRecords = require('./views/PictView-DataBeacon-Records.js');

// Expose the application class on window for Pict.safeLoadPictApplication
window.DataBeaconApplication = libDataBeaconApplication;

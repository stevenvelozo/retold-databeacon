/**
 * Retold DataBeacon — API Provider
 *
 * Pict provider for making REST API calls to the DataBeacon server.
 */
const libPictProvider = require('pict-view');

class DataBeaconProvider extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.serviceType = 'DataBeaconProvider';
	}

	_apiCall(pMethod, pPath, pBody, fCallback)
	{
		let tmpOptions =
		{
			method: pMethod,
			headers: { 'Content-Type': 'application/json' }
		};

		if (pBody && pMethod !== 'GET')
		{
			tmpOptions.body = JSON.stringify(pBody);
		}

		fetch(pPath, tmpOptions)
			.then((pResponse) => pResponse.json())
			.then((pData) =>
			{
				if (fCallback) fCallback(null, pData);
			})
			.catch((pError) =>
			{
				if (fCallback) fCallback(pError);
			});
	}

	// ================================================================
	// Connections
	// ================================================================

	loadConnections(fCallback)
	{
		this._apiCall('GET', '/beacon/connections', null,
			(pError, pData) =>
			{
				if (!pError && pData)
				{
					this.pict.AppData.Connections = pData.Connections || [];
				}
				if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
				if (this.pict.views.Connections) this.pict.views.Connections.render();
				if (fCallback) fCallback(pError, pData);
			});
	}

	createConnection(pConnectionData, fCallback)
	{
		this._apiCall('POST', '/beacon/connection', pConnectionData,
			(pError, pData) =>
			{
				if (!pError && pData && pData.Success)
				{
					this.loadConnections();
				}
				if (fCallback) fCallback(pError, pData);
			});
	}

	updateConnection(pID, pConnectionData, fCallback)
	{
		this._apiCall('PUT', `/beacon/connection/${pID}`, pConnectionData,
			(pError, pData) =>
			{
				if (!pError && pData && pData.Success)
				{
					this.loadConnections();
				}
				if (fCallback) fCallback(pError, pData);
			});
	}

	deleteConnection(pID, fCallback)
	{
		this._apiCall('DELETE', `/beacon/connection/${pID}`, null,
			(pError, pData) =>
			{
				if (!pError && pData && pData.Success)
				{
					this.loadConnections();
				}
				if (fCallback) fCallback(pError, pData);
			});
	}

	testConnection(pID, fCallback)
	{
		this._apiCall('POST', `/beacon/connection/${pID}/test`, null,
			(pError, pData) =>
			{
				this.loadConnections();
				if (fCallback) fCallback(pError, pData);
			});
	}

	connectConnection(pID, fCallback)
	{
		this._apiCall('POST', `/beacon/connection/${pID}/connect`, null,
			(pError, pData) =>
			{
				this.loadConnections();
				if (fCallback) fCallback(pError, pData);
			});
	}

	disconnectConnection(pID, fCallback)
	{
		this._apiCall('POST', `/beacon/connection/${pID}/disconnect`, null,
			(pError, pData) =>
			{
				this.loadConnections();
				if (fCallback) fCallback(pError, pData);
			});
	}

	loadAvailableTypes(fCallback)
	{
		this._apiCall('GET', '/beacon/connection/available-types', null,
			(pError, pData) =>
			{
				if (!pError && pData)
				{
					this.pict.AppData.AvailableTypes = pData.Types || [];
				}
				if (fCallback) fCallback(pError, pData);
			});
	}

	// ================================================================
	// Introspection
	// ================================================================

	introspect(pConnectionID, fCallback)
	{
		this._apiCall('POST', `/beacon/connection/${pConnectionID}/introspect`, null,
			(pError, pData) =>
			{
				if (!pError && pData && pData.Success)
				{
					this.loadTables(pConnectionID);
				}
				if (fCallback) fCallback(pError, pData);
			});
	}

	loadTables(pConnectionID, fCallback)
	{
		this._apiCall('GET', `/beacon/connection/${pConnectionID}/tables`, null,
			(pError, pData) =>
			{
				if (!pError && pData)
				{
					this.pict.AppData.Tables = pData.Tables || [];
					this.pict.AppData.SelectedConnectionID = pConnectionID;
				}
				if (this.pict.views.Introspection) this.pict.views.Introspection.render();
				if (fCallback) fCallback(pError, pData);
			});
	}

	loadTableDetails(pConnectionID, pTableName, fCallback)
	{
		this._apiCall('GET', `/beacon/connection/${pConnectionID}/table/${pTableName}`, null,
			(pError, pData) =>
			{
				if (fCallback) fCallback(pError, pData);
			});
	}

	executeQuery(pConnectionID, pSQL, fCallback)
	{
		this._apiCall('POST', `/beacon/connection/${pConnectionID}/query`, { SQL: pSQL },
			(pError, pData) =>
			{
				if (fCallback) fCallback(pError, pData);
			});
	}

	// ================================================================
	// Endpoints
	// ================================================================

	enableEndpoint(pConnectionID, pTableName, fCallback)
	{
		this._apiCall('POST', `/beacon/endpoint/${pConnectionID}/${pTableName}/enable`, null,
			(pError, pData) =>
			{
				this.loadEndpoints();
				this.loadTables(pConnectionID);
				if (fCallback) fCallback(pError, pData);
			});
	}

	disableEndpoint(pConnectionID, pTableName, fCallback)
	{
		this._apiCall('POST', `/beacon/endpoint/${pConnectionID}/${pTableName}/disable`, null,
			(pError, pData) =>
			{
				this.loadEndpoints();
				this.loadTables(pConnectionID);
				if (fCallback) fCallback(pError, pData);
			});
	}

	loadEndpoints(fCallback)
	{
		this._apiCall('GET', '/beacon/endpoints', null,
			(pError, pData) =>
			{
				if (!pError && pData)
				{
					this.pict.AppData.Endpoints = pData.Endpoints || [];
				}
				if (this.pict.views.Endpoints) this.pict.views.Endpoints.render();
				if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
				if (fCallback) fCallback(pError, pData);
			});
	}

	// ================================================================
	// Records
	// ================================================================

	loadRecords(pTableName, pCap, fCallback)
	{
		this._apiCall('GET', `/1.0/${pTableName}s/0/${pCap || 50}`, null,
			(pError, pData) =>
			{
				if (!pError && pData)
				{
					this.pict.AppData.Records = Array.isArray(pData) ? pData : (pData.Records || []);
					this.pict.AppData.SelectedTableName = pTableName;
				}
				if (this.pict.views.Records) this.pict.views.Records.render();
				if (fCallback) fCallback(pError, pData);
			});
	}

	// ================================================================
	// Beacon
	// ================================================================

	connectBeacon(pConfig, fCallback)
	{
		this._apiCall('POST', '/beacon/ultravisor/connect', pConfig,
			(pError, pData) =>
			{
				this.loadBeaconStatus();
				if (fCallback) fCallback(pError, pData);
			});
	}

	disconnectBeacon(fCallback)
	{
		this._apiCall('POST', '/beacon/ultravisor/disconnect', null,
			(pError, pData) =>
			{
				this.loadBeaconStatus();
				if (fCallback) fCallback(pError, pData);
			});
	}

	loadBeaconStatus(fCallback)
	{
		this._apiCall('GET', '/beacon/ultravisor/status', null,
			(pError, pData) =>
			{
				if (!pError && pData)
				{
					this.pict.AppData.BeaconStatus = pData;
				}
				if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
				if (fCallback) fCallback(pError, pData);
			});
	}
}

module.exports = DataBeaconProvider;
module.exports.default_configuration =
{
	ProviderIdentifier: 'DataBeaconProvider',
	AutoInitialize: true,
	AutoRender: false
};

/**
 * Retold DataBeacon — API Provider
 *
 * Calls the DataBeacon REST API, stores results in AppData, and pre-computes
 * render-ready view data (status labels, badge classes, per-row flags, etc.)
 * so the Pict templates can stay declarative. After each API response the
 * appropriate sub-views are re-rendered.
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
					this.pict.AppData.Connections = this._decorateConnections(pData.Connections || []);
				}
				this._recomputeDashboard();
				this.refreshIntrospectionViewData();
				this.refreshRecordBrowserViewData();
				this._renderConnectionViews();
				this._renderDashboard();
				this._renderIntrospectionViews();
				if (fCallback) fCallback(pError, pData);
			});
	}

	createConnection(pConnectionData, fCallback)
	{
		this._apiCall('POST', '/beacon/connection', pConnectionData,
			(pError, pData) =>
			{
				if (!pError && pData && pData.Success) this.loadConnections();
				if (fCallback) fCallback(pError, pData);
			});
	}

	updateConnection(pID, pConnectionData, fCallback)
	{
		this._apiCall('PUT', `/beacon/connection/${pID}`, pConnectionData,
			(pError, pData) =>
			{
				if (!pError && pData && pData.Success) this.loadConnections();
				if (fCallback) fCallback(pError, pData);
			});
	}

	deleteConnection(pID, fCallback)
	{
		this._apiCall('DELETE', `/beacon/connection/${pID}`, null,
			(pError, pData) =>
			{
				if (!pError && pData && pData.Success) this.loadConnections();
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
					this.pict.AppData.AvailableTypesForForm = this._buildAvailableTypesForForm(this.pict.AppData.AvailableTypes);
				}
				if (this.pict.views.ConnectionForm) this.pict.views.ConnectionForm.render();
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
				this.refreshIntrospectionViewData();
				this._renderIntrospectionViews();
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
					this.pict.AppData.Endpoints = this._decorateEndpoints(pData.Endpoints || []);
				}
				this._recomputeDashboard();
				this.refreshRecordBrowserViewData();
				if (this.pict.views.Endpoints) this.pict.views.Endpoints.render();
				this._renderDashboard();
				if (this.pict.views.RecordBrowser) this.pict.views.RecordBrowser.render();
				if (fCallback) fCallback(pError, pData);
			});
	}

	// ================================================================
	// Records
	// ================================================================

	loadRecords(pTableName, pStart, pCap, pFilterOrCallback, fCallback)
	{
		// Backwards-compatible signature: callers that pre-date filter support
		// pass `(table, start, cap, fCallback)`.  New callers pass
		// `(table, start, cap, filter, fCallback)`.
		let tmpFilter = '';
		let tmpCallback = fCallback;
		if (typeof pFilterOrCallback === 'function') { tmpCallback = pFilterOrCallback; }
		else if (typeof pFilterOrCallback === 'string') { tmpFilter = pFilterOrCallback.trim(); }

		let tmpStart = this._toNonNegativeInt(pStart, 0);
		let tmpCap = this._toPositiveInt(pCap, 50);

		if (!this.pict.AppData.RecordBrowser) this.pict.AppData.RecordBrowser = {};
		this.pict.AppData.RecordBrowser.CursorStart = tmpStart;
		this.pict.AppData.RecordBrowser.PageSize = tmpCap;
		this.pict.AppData.RecordBrowser.FilterString = tmpFilter;

		// Dynamic endpoints are namespaced under the connection's sanitized
		// name (see DataBeacon-DynamicEndpointManager.js).  Filtered reads
		// route to /{Scope}s/FilteredTo/<filter>/<begin>/<cap>; unfiltered
		// to /{Scope}s/<begin>/<cap>.  Filter values go in the URL per the
		// meadow-endpoints convention (FBL expression, URL-encoded).
		let tmpPrefix = this._routeHashForSelectedConnection();
		let tmpPathBase = tmpPrefix ? `/1.0/${tmpPrefix}` : '/1.0';
		let tmpPath = tmpFilter
			? `${tmpPathBase}/${pTableName}s/FilteredTo/${encodeURIComponent(tmpFilter)}/${tmpStart}/${tmpCap}`
			: `${tmpPathBase}/${pTableName}s/${tmpStart}/${tmpCap}`;

		this._apiCall('GET', tmpPath, null,
			(pError, pData) =>
			{
				if (!pError && pData)
				{
					this.pict.AppData.Records = Array.isArray(pData) ? pData : (pData.Records || []);
					this.pict.AppData.SelectedTableName = pTableName;
				}
				this.refreshRecordBrowserViewData();
				if (this.pict.views.RecordBrowser) this.pict.views.RecordBrowser.render();
				if (tmpCallback) tmpCallback(pError, pData);
			});
	}

	/**
	 * Non-blocking count fetch.  Updates AppData.RecordBrowser.TotalCount
	 * and re-renders the RecordBrowser so the page strip + badge refresh
	 * whenever the server answers.  Failures are swallowed (leaves
	 * TotalCount null; UI falls back to the "no count, probe with Next"
	 * behavior).
	 */
	loadRecordCount(pTableName, pFilter, fCallback)
	{
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.TotalCount = null;
		this.pict.AppData.RecordBrowser.CountIsLoading = true;

		let tmpPrefix = this._routeHashForSelectedConnection();
		let tmpPathBase = tmpPrefix ? `/1.0/${tmpPrefix}` : '/1.0';
		let tmpFilter = (pFilter || '').trim();
		let tmpPath = tmpFilter
			? `${tmpPathBase}/${pTableName}s/Count/FilteredTo/${encodeURIComponent(tmpFilter)}`
			: `${tmpPathBase}/${pTableName}s/Count`;

		this._apiCall('GET', tmpPath, null,
			(pError, pData) =>
			{
				let tmpCount = null;
				if (!pError && pData != null)
				{
					// meadow-endpoints returns { Count: N } or just N.
					if (typeof pData === 'number') { tmpCount = pData; }
					else if (typeof pData === 'object' && typeof pData.Count === 'number') { tmpCount = pData.Count; }
				}
				this.pict.AppData.RecordBrowser.TotalCount = tmpCount;
				this.pict.AppData.RecordBrowser.CountIsLoading = false;
				this.refreshRecordBrowserViewData();
				if (this.pict.views.RecordBrowser) this.pict.views.RecordBrowser.render();
				if (fCallback) fCallback(pError, tmpCount);
			});
	}

	/**
	 * Full-set fetch for export.  Hits the unpaginated endpoint (no begin/cap)
	 * which meadow-endpoints exposes for filtered reads.  For unfiltered we
	 * fall back to a large single page -- servers should cap this themselves
	 * but callers should treat it as "up to the server's hard limit" rather
	 * than a guaranteed full enumeration of million-row tables.
	 */
	loadRecordsAll(pTableName, pFilter, fCallback)
	{
		let tmpPrefix = this._routeHashForSelectedConnection();
		let tmpPathBase = tmpPrefix ? `/1.0/${tmpPrefix}` : '/1.0';
		let tmpFilter = (pFilter || '').trim();
		let tmpPath = tmpFilter
			? `${tmpPathBase}/${pTableName}s/FilteredTo/${encodeURIComponent(tmpFilter)}`
			: `${tmpPathBase}/${pTableName}s/0/100000`;
		this._apiCall('GET', tmpPath, null,
			(pError, pData) =>
			{
				if (pError) { return fCallback(pError); }
				let tmpRows = Array.isArray(pData) ? pData : (pData && pData.Records) || [];
				return fCallback(null, tmpRows);
			});
	}

	/**
	 * Client-side equivalent of meadow-connection-manager's
	 * sanitizeConnectionName -- lowercases and replaces non-URL-safe chars
	 * (notably underscores) with hyphens.  Must stay in sync with the
	 * server's sanitizer so route-hash matching works end-to-end.  Returns
	 * '' when no connection is selected so callers can fall back to the
	 * unprefixed /1.0/<Table> path.
	 */
	_routeHashForSelectedConnection()
	{
		let tmpCID = this.pict.AppData.SelectedConnectionID;
		if (!tmpCID) { return ''; }
		let tmpConns = this.pict.AppData.Connections || [];
		let tmpConn = tmpConns.find((pC) => pC.IDBeaconConnection === tmpCID);
		if (!tmpConn || !tmpConn.Name) { return ''; }
		return String(tmpConn.Name).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
	}

	_toNonNegativeInt(pValue, pDefault)
	{
		let tmpN = parseInt(pValue, 10);
		if (isNaN(tmpN) || tmpN < 0) return pDefault;
		return tmpN;
	}

	_toPositiveInt(pValue, pDefault)
	{
		let tmpN = parseInt(pValue, 10);
		if (isNaN(tmpN) || tmpN < 1) return pDefault;
		return tmpN;
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
				if (!pError && pData) this.pict.AppData.BeaconStatus = pData;
				this._recomputeDashboard();
				this._renderDashboard();
				if (fCallback) fCallback(pError, pData);
			});
	}

	// ================================================================
	// View data computation (public helpers + internal)
	// ================================================================

	/**
	 * Recompute AppData.Introspection based on current Connections/Tables.
	 * Auto-selects the sole connected database when nothing is selected.
	 * Safe to call repeatedly and in response to any data change.
	 */
	refreshIntrospectionViewData()
	{
		let tmpConns = this.pict.AppData.Connections || [];
		let tmpTables = this.pict.AppData.Tables || [];
		let tmpCID = this.pict.AppData.SelectedConnectionID;

		// Connected-only list for the picker.
		let tmpConnectedList = [];
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].Connected) tmpConnectedList.push(tmpConns[i]);
		}

		// Auto-select sole connection.
		if (!tmpCID && tmpConnectedList.length === 1)
		{
			tmpCID = tmpConnectedList[0].IDBeaconConnection;
			this.pict.AppData.SelectedConnectionID = tmpCID;
		}

		// Decorate connection list with SelectedAttr for the dropdown.
		let tmpListForTemplate = [];
		for (let i = 0; i < tmpConnectedList.length; i++)
		{
			let tmpConn = tmpConnectedList[i];
			tmpListForTemplate.push(
			{
				IDBeaconConnection: tmpConn.IDBeaconConnection,
				Name: tmpConn.Name,
				Type: tmpConn.Type,
				SelectedAttr: (tmpConn.IDBeaconConnection === tmpCID) ? 'selected' : ''
			});
		}

		let tmpSelectedConn = null;
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].IDBeaconConnection === tmpCID) { tmpSelectedConn = tmpConns[i]; break; }
		}

		let tmpBanner = null;
		if (tmpSelectedConn)
		{
			tmpBanner =
			{
				Name: tmpSelectedConn.Name,
				Type: tmpSelectedConn.Type,
				StatusLabel: tmpSelectedConn.StatusLabel,
				StatusBadgeClass: tmpSelectedConn.StatusBadgeClass,
				Description: tmpSelectedConn.Description || '',
				HasDescription: !!tmpSelectedConn.Description
			};
		}

		// Table rows view shape.
		let tmpTablesView = [];
		for (let i = 0; i < tmpTables.length; i++)
		{
			let tmpTable = tmpTables[i];
			tmpTablesView.push(
			{
				ConnectionID: tmpCID,
				TableName: tmpTable.TableName,
				ColumnCount: tmpTable.ColumnCount,
				RowCountDisplay: (tmpTable.RowCountEstimate === null || tmpTable.RowCountEstimate === undefined) ? '--' : tmpTable.RowCountEstimate,
				EndpointsEnabled: !!tmpTable.EndpointsEnabled
			});
		}

		let tmpState;
		if (tmpConnectedList.length === 0) tmpState = 'NoConnections';
		else if (!tmpCID) tmpState = 'NoSelection';
		else if (tmpTablesView.length === 0) tmpState = 'Empty';
		else tmpState = 'HasTables';

		let tmpTablesHeader = null;
		if (tmpState === 'HasTables' && tmpSelectedConn)
		{
			let tmpCount = tmpTablesView.length;
			tmpTablesHeader =
			{
				ConnectionName: tmpSelectedConn.Name,
				Subline: `${tmpSelectedConn.Type} \u00B7 ${tmpCount} table${tmpCount !== 1 ? 's' : ''} discovered`
			};
		}

		let tmpShowPlaceholder = (tmpConnectedList.length !== 1) || !tmpCID;

		let tmpRunDisabled = !tmpCID;
		let tmpAllDisabled = tmpConnectedList.length === 0;
		this.pict.AppData.Introspection =
		{
			ConnectedList: tmpListForTemplate,
			ShowPlaceholder: tmpShowPlaceholder,
			HasSelection: !!tmpSelectedConn,
			SelectedBanner: tmpBanner,
			RunDisabled: tmpRunDisabled,
			AllDisabled: tmpAllDisabled,
			// Template-friendly class names; anchor elements don't honor
			// `disabled` so we swap visual state via CSS classes.
			RunDisabledClass: tmpRunDisabled ? 'disabled' : '',
			AllDisabledClass: tmpAllDisabled ? 'disabled' : '',
			State: tmpState,
			TablesView: tmpTablesView,
			TablesHeader: tmpTablesHeader,
			DetailModalColumns: (this.pict.AppData.Introspection && this.pict.AppData.Introspection.DetailModalColumns) || []
		};
	}

	/**
	 * Recompute AppData.RecordBrowser based on current Endpoints/Records
	 * and the persisted CursorStart / PageSize. Preserves the caller's
	 * cursor/size preferences across fetches.
	 */
	refreshRecordBrowserViewData()
	{
		let tmpEndpoints = this.pict.AppData.Endpoints || [];
		let tmpRecords = this.pict.AppData.Records || [];
		let tmpSelectedTable = this.pict.AppData.SelectedTableName || '';

		let tmpPrev = this.pict.AppData.RecordBrowser || {};
		let tmpCursorStart = this._toNonNegativeInt(tmpPrev.CursorStart, 0);
		let tmpPageSize = this._toPositiveInt(tmpPrev.PageSize, 50);
		let tmpFilter = (typeof tmpPrev.FilterString === 'string') ? tmpPrev.FilterString : '';
		let tmpTotalCount = (typeof tmpPrev.TotalCount === 'number') ? tmpPrev.TotalCount : null;
		let tmpCountIsLoading = !!tmpPrev.CountIsLoading;

		let tmpTableOptions = [];
		for (let i = 0; i < tmpEndpoints.length; i++)
		{
			tmpTableOptions.push(
			{
				TableName: tmpEndpoints[i].TableName,
				SelectedAttr: (tmpEndpoints[i].TableName === tmpSelectedTable) ? 'selected' : ''
			});
		}

		let tmpPageSizeOptions = this._buildPageSizeOptions(tmpPageSize);

		let tmpState;
		let tmpColumnList = [];
		let tmpRows = [];
		let tmpFetched = tmpRecords.length;

		if (!tmpSelectedTable) tmpState = 'NoSelection';
		else if (tmpFetched === 0) tmpState = 'Empty';
		else
		{
			tmpState = 'HasRows';
			let tmpColumnNames = Object.keys(tmpRecords[0] || {});
			for (let c = 0; c < tmpColumnNames.length; c++) tmpColumnList.push({ Name: tmpColumnNames[c] });
			for (let r = 0; r < tmpFetched; r++)
			{
				let tmpCells = [];
				for (let c = 0; c < tmpColumnNames.length; c++)
				{
					tmpCells.push({ CellHTML: this._formatCellValue(tmpRecords[r][tmpColumnNames[c]]) });
				}
				tmpRows.push({ Cells: tmpCells });
			}
		}

		let tmpCurrentPage = Math.floor(tmpCursorStart / tmpPageSize) + 1;
		let tmpPageCount = (tmpTotalCount === null || tmpTotalCount <= 0) ? 0 : Math.max(1, Math.ceil(tmpTotalCount / tmpPageSize));

		// Prev/Next:
		//   With a count known: both bounded by the count-derived page range.
		//   Without a count: fall back to probe-next-if-page-was-full heuristic.
		let tmpPrevDisabled = !tmpSelectedTable || tmpCurrentPage <= 1;
		let tmpNextDisabled;
		if (tmpPageCount > 0) { tmpNextDisabled = !tmpSelectedTable || tmpCurrentPage >= tmpPageCount; }
		else                  { tmpNextDisabled = !tmpSelectedTable || tmpFetched < tmpPageSize; }

		let tmpRangeLabel;
		if (!tmpSelectedTable)
		{
			tmpRangeLabel = '';
		}
		else if (tmpFetched === 0)
		{
			tmpRangeLabel = tmpFilter
				? `No records match the current filter.`
				: `No records at start ${tmpCursorStart}.`;
		}
		else
		{
			let tmpRangeEnd = tmpCursorStart + tmpFetched;
			tmpRangeLabel = `Showing records ${tmpCursorStart + 1}–${tmpRangeEnd} · Page size ${tmpPageSize}`;
			if (tmpPageCount > 0) { tmpRangeLabel += ` · Page ${tmpCurrentPage} of ${tmpPageCount}`; }
		}

		// Label for the "Export all" action and the count badge.  Phrased as
		// "N filtered records" or "N records" so the user can see the full
		// scope of the download before clicking.
		let tmpTotalCountLabel = '';
		let tmpFullExportLabel = 'records';
		if (tmpCountIsLoading)
		{
			tmpTotalCountLabel = 'counting…';
			tmpFullExportLabel = tmpFilter ? 'filtered records (counting…)' : 'records (counting…)';
		}
		else if (tmpTotalCount !== null)
		{
			tmpTotalCountLabel = `${tmpTotalCount.toLocaleString()} total`;
			tmpFullExportLabel = tmpFilter
				? `${tmpTotalCount.toLocaleString()} filtered records`
				: `${tmpTotalCount.toLocaleString()} records`;
		}

		// Route-href builders.  Emitting the full hash URL in AppData means
		// the template can bind {~D:...Href~} directly without computing paths.
		let tmpHrefBase = '#/records/page/';
		let tmpPrevHref = tmpCurrentPage > 1 ? `${tmpHrefBase}${tmpCurrentPage - 1}` : `${tmpHrefBase}${tmpCurrentPage}`;
		let tmpNextHref = (tmpPageCount === 0 || tmpCurrentPage < tmpPageCount) ? `${tmpHrefBase}${tmpCurrentPage + 1}` : `${tmpHrefBase}${tmpCurrentPage}`;

		let tmpPageLinks = this._buildPageLinks(tmpCurrentPage, tmpPageCount, tmpHrefBase);

		let tmpLoadDisabled = !tmpSelectedTable;
		let tmpHasTotalCount = (tmpTotalCount !== null) || tmpCountIsLoading;
		this.pict.AppData.RecordBrowser =
		{
			TableOptions: tmpTableOptions,
			PageSizeOptions: tmpPageSizeOptions,
			SelectedTableName: tmpSelectedTable,
			TableName: tmpSelectedTable,
			CursorStart: tmpCursorStart,
			PageSize: tmpPageSize,
			Page: tmpCurrentPage,
			PageCount: tmpPageCount,
			PageLinks: tmpPageLinks,
			ShowPagination: tmpPageCount > 1 || (tmpPageCount === 0 && (tmpCurrentPage > 1 || !tmpNextDisabled)),
			PrevHref: tmpPrevHref,
			NextHref: tmpNextHref,
			FilterString: tmpFilter,
			FilterClearClass: tmpFilter ? '' : 'disabled',
			TotalCount: tmpTotalCount,
			TotalCountLabel: tmpTotalCountLabel,
			HasTotalCount: tmpHasTotalCount,
			FullExportLabel: tmpFullExportLabel,
			CountIsLoading: tmpCountIsLoading,
			PrevDisabled: tmpPrevDisabled,
			NextDisabled: tmpNextDisabled,
			LoadDisabled: tmpLoadDisabled,
			// Anchor-friendly class mirrors (pict imperative-first replaces
			// delegated click handlers with `<a href="#/..."/>`; buttons-as-
			// anchors don't honor the native `disabled` attribute).
			PrevDisabledClass: tmpPrevDisabled ? 'disabled' : '',
			NextDisabledClass: tmpNextDisabled ? 'disabled' : '',
			LoadDisabledClass: tmpLoadDisabled ? 'disabled' : '',
			RangeLabel: tmpRangeLabel,
			State: tmpState,
			ColumnList: tmpColumnList,
			Rows: tmpRows
		};
	}

	/**
	 * Produce a pagination record list for the template.
	 *
	 * Shape (each entry is one of):
	 *   { Kind: 'link', Label, Href, CurrentClass }
	 *   { Kind: 'ellipsis' }
	 *
	 * Elides middle pages for large sets so the strip stays compact:
	 *   1  2  3  …  42  43  44  45  46  …  98  99  100    (when current=44)
	 *
	 * If PageCount is 0 (no count yet), returns an empty list; the template
	 * falls back to Prev/Next-only navigation.
	 */
	_buildPageLinks(pCurrent, pPageCount, pHrefBase)
	{
		if (pPageCount <= 0) { return []; }

		let tmpOut = [];
		let tmpAdd = (pPage) =>
		{
			tmpOut.push(
				{
					Kind: 'link',
					Label: String(pPage),
					Href: `${pHrefBase}${pPage}`,
					CurrentClass: (pPage === pCurrent) ? 'current' : ''
				});
		};
		let tmpEllipsis = () => tmpOut.push({ Kind: 'ellipsis' });

		if (pPageCount <= 9)
		{
			for (let i = 1; i <= pPageCount; i++) { tmpAdd(i); }
			return tmpOut;
		}

		// Always show first two + last two + a window around the current page.
		let tmpShown = new Set([1, 2, pPageCount - 1, pPageCount, pCurrent - 1, pCurrent, pCurrent + 1]);
		// Clamp window to valid range.
		let tmpSorted = Array.from(tmpShown).filter((n) => n >= 1 && n <= pPageCount).sort((a, b) => a - b);
		let tmpPrev = 0;
		for (let i = 0; i < tmpSorted.length; i++)
		{
			let tmpPg = tmpSorted[i];
			if (tmpPg - tmpPrev > 1) { tmpEllipsis(); }
			tmpAdd(tmpPg);
			tmpPrev = tmpPg;
		}
		return tmpOut;
	}

	_buildPageSizeOptions(pCurrent)
	{
		let tmpChoices = [ 10, 25, 50, 100, 200, 500 ];
		if (tmpChoices.indexOf(pCurrent) === -1) tmpChoices.push(pCurrent);
		tmpChoices.sort((a, b) => a - b);
		let tmpResult = [];
		for (let i = 0; i < tmpChoices.length; i++)
		{
			tmpResult.push(
			{
				Value: tmpChoices[i],
				SelectedAttr: (tmpChoices[i] === pCurrent) ? 'selected' : ''
			});
		}
		return tmpResult;
	}

	/**
	 * Build a view-ready AppData.QueryPanel structure from raw rows returned
	 * by executeQuery(). Called by the QueryPanel view after a successful
	 * response.
	 * @param {Array<Object>} pRows
	 * @returns {Object}
	 */
	buildQueryResultViewData(pRows)
	{
		let tmpColumnList = [];
		let tmpRowList = [];
		let tmpColumnNames = (pRows && pRows.length > 0) ? Object.keys(pRows[0]) : [];
		for (let c = 0; c < tmpColumnNames.length; c++) tmpColumnList.push({ Name: tmpColumnNames[c] });
		let tmpLimit = Math.min(pRows.length, 100);
		for (let r = 0; r < tmpLimit; r++)
		{
			let tmpCells = [];
			for (let c = 0; c < tmpColumnNames.length; c++)
			{
				tmpCells.push({ CellHTML: this._formatCellValue(pRows[r][tmpColumnNames[c]]) });
			}
			tmpRowList.push({ Cells: tmpCells });
		}
		return {
			ColumnList: tmpColumnList,
			Rows: tmpRowList,
			// RawRows keeps the unformatted response so the export provider
			// can serialize to JSON/CSV/TSV without having to reverse the
			// cell-HTML formatting. Limited to the same display window the
			// user actually sees.
			RawRows: pRows.slice(0, tmpLimit),
			DisplayCount: tmpLimit,
			TotalCount: pRows.length,
			IsTruncated: pRows.length > 100
		};
	}

	/**
	 * HTML-escape a string. Exposed so views can safely interpolate error
	 * messages into error banners.
	 * @param {string} pValue
	 * @returns {string}
	 */
	escapeHTML(pValue)
	{
		let tmpStr = (pValue === null || pValue === undefined) ? '' : String(pValue);
		return tmpStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}

	// ================================================================
	// Private decorators
	// ================================================================

	_decorateConnections(pConnections)
	{
		let tmpResult = [];
		for (let i = 0; i < pConnections.length; i++)
		{
			let tmpConn = pConnections[i];
			let tmpIsConnected = !!tmpConn.Connected;
			let tmpStatusLabel;
			let tmpStatusBadgeClass;
			if (tmpIsConnected)
			{
				tmpStatusLabel = 'Connected';
				tmpStatusBadgeClass = 'badge-success';
			}
			else if (tmpConn.Status === 'OK')
			{
				tmpStatusLabel = 'OK';
				tmpStatusBadgeClass = 'badge-info';
			}
			else if (tmpConn.Status === 'Failed')
			{
				tmpStatusLabel = 'Failed';
				tmpStatusBadgeClass = 'badge-error';
			}
			else
			{
				tmpStatusLabel = tmpConn.Status || 'Unknown';
				tmpStatusBadgeClass = 'badge-neutral';
			}

			tmpResult.push(Object.assign({}, tmpConn,
			{
				Connected: tmpIsConnected,
				StatusLabel: tmpStatusLabel,
				StatusBadgeClass: tmpStatusBadgeClass,
				Description: tmpConn.Description || ''
			}));
		}
		return tmpResult;
	}

	_decorateEndpoints(pEndpoints)
	{
		let tmpResult = [];
		for (let i = 0; i < pEndpoints.length; i++)
		{
			let tmpEP = pEndpoints[i];
			let tmpBase = tmpEP.EndpointBase || '';
			tmpResult.push(Object.assign({}, tmpEP,
			{
				EndpointAPIURL: `${tmpBase}s/0/50`
			}));
		}
		return tmpResult;
	}

	_buildAvailableTypesForForm(pTypes)
	{
		let tmpInstalled = [];
		for (let i = 0; i < pTypes.length; i++)
		{
			if (pTypes[i].Installed) tmpInstalled.push({ Type: pTypes[i].Type });
		}
		if (tmpInstalled.length === 0)
		{
			tmpInstalled = [ { Type: 'MySQL' }, { Type: 'PostgreSQL' }, { Type: 'MSSQL' }, { Type: 'SQLite' } ];
		}
		return tmpInstalled;
	}

	_recomputeDashboard()
	{
		let tmpConns = this.pict.AppData.Connections || [];
		let tmpEndpoints = this.pict.AppData.Endpoints || [];
		let tmpBeaconStatus = this.pict.AppData.BeaconStatus || {};

		let tmpActive = 0;
		let tmpSummary = [];
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].Connected) tmpActive++;
			tmpSummary.push(
			{
				Name: tmpConns[i].Name,
				Type: tmpConns[i].Type,
				StatusLabel: tmpConns[i].StatusLabel,
				StatusBadgeClass: tmpConns[i].StatusBadgeClass,
				Description: tmpConns[i].Description
			});
		}

		this.pict.AppData.Dashboard =
		{
			TotalConnections: tmpConns.length,
			ActiveConnections: tmpActive,
			TotalEndpoints: tmpEndpoints.length,
			BeaconStatusLabel: tmpBeaconStatus.Connected ? 'Connected' : 'Not Connected',
			BeaconBadgeClass: tmpBeaconStatus.Connected ? 'badge-success' : 'badge-neutral',
			BeaconName: tmpBeaconStatus.BeaconName || 'retold-databeacon',
			ConnectionSummary: tmpSummary
		};
	}

	_formatCellValue(pValue)
	{
		if (pValue === null || pValue === undefined)
		{
			return '<span class="null-value">NULL</span>';
		}
		if (typeof pValue === 'object')
		{
			let tmpText = JSON.stringify(pValue);
			if (tmpText.length > 80) tmpText = tmpText.substring(0, 80) + '...';
			return `<code>${this.escapeHTML(tmpText)}</code>`;
		}
		let tmpStr = String(pValue);
		if (tmpStr.length > 100) tmpStr = tmpStr.substring(0, 100) + '...';
		return this.escapeHTML(tmpStr);
	}

	_renderConnectionViews()
	{
		if (this.pict.views.ConnectionList) this.pict.views.ConnectionList.render();
	}

	_renderDashboard()
	{
		if (this.pict.views.Dashboard) this.pict.views.Dashboard.render();
	}

	_renderIntrospectionViews()
	{
		if (this.pict.views.IntrospectionControls) this.pict.views.IntrospectionControls.render();
		if (this.pict.views.IntrospectionTables) this.pict.views.IntrospectionTables.render();
	}
}

module.exports = DataBeaconProvider;
module.exports.default_configuration =
{
	ProviderIdentifier: 'DataBeaconProvider',
	AutoInitialize: true,
	AutoRender: false
};

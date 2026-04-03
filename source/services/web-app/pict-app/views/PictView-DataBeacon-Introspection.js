/**
 * DataBeacon Introspection View
 *
 * Schema browser showing tables and columns per connection,
 * with endpoint enable/disable toggles.
 *
 * Supports multiple connections: shows which connection the
 * tables belong to and allows switching between them.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Introspection',
	DefaultRenderable: 'DataBeacon-Introspection',
	DefaultDestinationAddress: '#DataBeacon-View-Introspection',
	AutoRender: false,
	Templates: [{ Hash: 'DataBeacon-Introspection-Template', Template: '<div id="DataBeacon-Introspection-Content" class="introspection-view"></div>' }],
	Renderables: [{ RenderableHash: 'DataBeacon-Introspection', TemplateHash: 'DataBeacon-Introspection-Template', DestinationAddress: '#DataBeacon-View-Introspection' }]
};

class PictViewDataBeaconIntrospection extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	/**
	 * Find the connection record matching the selected ID.
	 */
	_getSelectedConnection()
	{
		let tmpCID = this.pict.AppData.SelectedConnectionID;
		if (!tmpCID) return null;

		let tmpConns = this.pict.AppData.Connections || [];
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].IDBeaconConnection === tmpCID)
			{
				return tmpConns[i];
			}
		}
		return null;
	}

	onAfterRender()
	{
		let tmpCID = this.pict.AppData.SelectedConnectionID;
		let tmpTables = this.pict.AppData.Tables || [];
		let tmpConns = this.pict.AppData.Connections || [];
		let tmpSelectedConn = this._getSelectedConnection();

		// Build connection dropdown — only show connected databases
		let tmpConnectedList = [];
		let tmpOpts = '';
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].Connected)
			{
				tmpConnectedList.push(tmpConns[i]);
				let tmpSelected = (tmpConns[i].IDBeaconConnection === tmpCID) ? ' selected' : '';
				tmpOpts += `<option value="${tmpConns[i].IDBeaconConnection}"${tmpSelected}>${tmpConns[i].Name} (${tmpConns[i].Type})</option>`;
			}
		}

		// If no connection is selected but there's only one connected, auto-select it
		if (!tmpCID && tmpConnectedList.length === 1)
		{
			tmpCID = tmpConnectedList[0].IDBeaconConnection;
			this.pict.AppData.SelectedConnectionID = tmpCID;
			tmpSelectedConn = tmpConnectedList[0];
			tmpOpts = `<option value="${tmpCID}" selected>${tmpConnectedList[0].Name} (${tmpConnectedList[0].Type})</option>`;
		}

		// Prepend the placeholder only if there are multiple options or none selected
		if (tmpConnectedList.length !== 1 || !tmpCID)
		{
			tmpOpts = '<option value="">-- Select Connection --</option>' + tmpOpts;
		}

		// Connection info banner
		let tmpConnectionBanner = '';
		if (tmpSelectedConn)
		{
			let tmpStatusClass = tmpSelectedConn.Connected ? 'badge-success' : 'badge-neutral';
			let tmpStatusLabel = tmpSelectedConn.Connected ? 'Connected' : tmpSelectedConn.Status;
			tmpConnectionBanner = `
		<div class="connection-banner">
			<span class="connection-banner-name">${tmpSelectedConn.Name}</span>
			<span class="badge ${tmpStatusClass}">${tmpStatusLabel}</span>
			<span class="connection-banner-type">${tmpSelectedConn.Type}</span>
			${tmpSelectedConn.Description ? `<span class="connection-banner-desc">${tmpSelectedConn.Description}</span>` : ''}
		</div>`;
		}

		// Table list with connection context
		let tmpTableHTML = '';
		if (tmpTables.length > 0 && tmpSelectedConn)
		{
			tmpTableHTML = this._renderTables(tmpTables, tmpCID, tmpSelectedConn);
		}
		else if (tmpCID && tmpTables.length === 0)
		{
			tmpTableHTML = '<p class="empty-state">No tables discovered yet. Click <strong>Introspect</strong> to scan the database.</p>';
		}
		else if (tmpConnectedList.length === 0)
		{
			tmpTableHTML = '<p class="empty-state">No databases connected. Go to <a href="javascript:void(0)" onclick="window.DataBeaconApp.navigateTo(\'Connections\')">Connections</a> to add and connect a database first.</p>';
		}
		else
		{
			tmpTableHTML = '<p class="empty-state">Select a connected database above and click Introspect.</p>';
		}

		let tmpHTML = `
	<h1>Schema Introspection</h1>
	<div class="section">
		<div class="form-row">
			<div class="form-group">
				<label>Connection</label>
				<select id="introspect-connection" onchange="DataBeacon_selectIntConn(this.value)">${tmpOpts}</select>
			</div>
			<div class="form-group">
				<button class="btn btn-primary" onclick="DataBeacon_runIntrospect()" ${tmpCID ? '' : 'disabled'}>Introspect</button>
			</div>
			<div class="form-group">
				<button class="btn btn-secondary" onclick="DataBeacon_introspectAll()" ${tmpConnectedList.length > 0 ? '' : 'disabled'}>Introspect All</button>
			</div>
		</div>
		${tmpConnectionBanner}
	</div>
	${tmpTableHTML}
	<div id="DataBeacon-TableDetail" class="section" style="display:none;"></div>`;

		let tmpEl = document.getElementById('DataBeacon-Introspection-Content');
		if (tmpEl) tmpEl.innerHTML = tmpHTML;

		// Wire event handlers
		window.DataBeacon_selectIntConn = (pID) =>
		{
			let tmpNewID = parseInt(pID, 10) || null;
			this.pict.AppData.SelectedConnectionID = tmpNewID;
			// Hide table detail when switching connections
			let tmpDetailEl = document.getElementById('DataBeacon-TableDetail');
			if (tmpDetailEl) tmpDetailEl.style.display = 'none';

			if (tmpNewID)
			{
				this.pict.providers.DataBeaconProvider.loadTables(tmpNewID);
			}
			else
			{
				this.pict.AppData.Tables = [];
				this.render();
			}
		};

		window.DataBeacon_runIntrospect = () =>
		{
			if (this.pict.AppData.SelectedConnectionID)
			{
				this.pict.providers.DataBeaconProvider.introspect(this.pict.AppData.SelectedConnectionID);
			}
		};

		window.DataBeacon_introspectAll = () =>
		{
			// Introspect all connected databases sequentially
			let tmpConnected = [];
			for (let i = 0; i < tmpConns.length; i++)
			{
				if (tmpConns[i].Connected) tmpConnected.push(tmpConns[i].IDBeaconConnection);
			}
			let tmpIdx = 0;
			let tmpDoNext = () =>
			{
				if (tmpIdx >= tmpConnected.length)
				{
					// Reload tables for the selected connection
					if (this.pict.AppData.SelectedConnectionID)
					{
						this.pict.providers.DataBeaconProvider.loadTables(this.pict.AppData.SelectedConnectionID);
					}
					return;
				}
				this.pict.providers.DataBeaconProvider.introspect(tmpConnected[tmpIdx],
					() =>
					{
						tmpIdx++;
						tmpDoNext();
					});
			};
			tmpDoNext();
		};

		window.DataBeacon_enableEndpoint = (pCID, pTableName) =>
		{
			this.pict.providers.DataBeaconProvider.enableEndpoint(pCID, pTableName);
		};

		window.DataBeacon_disableEndpoint = (pCID, pTableName) =>
		{
			this.pict.providers.DataBeaconProvider.disableEndpoint(pCID, pTableName);
		};

		window.DataBeacon_viewTableDetail = (pCID, pTableName) =>
		{
			this._showDetail(pCID, pTableName);
		};

		return super.onAfterRender();
	}

	_renderTables(pTables, pCID, pConnection)
	{
		let tmpRows = '';
		for (let i = 0; i < pTables.length; i++)
		{
			let tmpTable = pTables[i];
			let tmpBtn = tmpTable.EndpointsEnabled
				? `<button class="btn btn-small btn-warning" onclick="DataBeacon_disableEndpoint(${pCID},'${tmpTable.TableName}')">Disable</button>`
				: `<button class="btn btn-small btn-primary" onclick="DataBeacon_enableEndpoint(${pCID},'${tmpTable.TableName}')">Enable</button>`;
			let tmpBadge = tmpTable.EndpointsEnabled ? '<span class="badge badge-success">Active</span>' : '';

			tmpRows += `<tr>
				<td><a href="javascript:void(0)" onclick="DataBeacon_viewTableDetail(${pCID},'${tmpTable.TableName}')">${tmpTable.TableName}</a></td>
				<td>${tmpTable.ColumnCount}</td>
				<td>${tmpTable.RowCountEstimate || '--'}</td>
				<td>${tmpBadge}</td>
				<td class="actions-cell">${tmpBtn}</td>
			</tr>`;
		}

		let tmpHeading = `Tables from <strong>${pConnection.Name}</strong>`;
		let tmpSubline = `<span class="section-subline">${pConnection.Type} &middot; ${pTables.length} table${pTables.length !== 1 ? 's' : ''} discovered</span>`;

		return `
	<div class="section">
		<h2>${tmpHeading}</h2>
		${tmpSubline}
		<table class="data-table" style="margin-top:12px;">
			<thead>
				<tr><th>Table</th><th>Columns</th><th>Est. Rows</th><th>Endpoint</th><th>Actions</th></tr>
			</thead>
			<tbody>${tmpRows}</tbody>
		</table>
	</div>`;
	}

	_showDetail(pCID, pTableName)
	{
		let tmpConn = this._getSelectedConnection();
		let tmpConnLabel = tmpConn ? ` <span class="section-subline">(${tmpConn.Name})</span>` : '';

		this.pict.providers.DataBeaconProvider.loadTableDetails(pCID, pTableName,
			(pError, pData) =>
			{
				let tmpEl = document.getElementById('DataBeacon-TableDetail');
				if (!tmpEl) return;

				if (pError || !pData || !pData.Columns)
				{
					tmpEl.innerHTML = '<p class="error">Failed to load table details.</p>';
					tmpEl.style.display = 'block';
					return;
				}

				let tmpRows = '';
				for (let i = 0; i < pData.Columns.length; i++)
				{
					let tmpCol = pData.Columns[i];
					let tmpPK = tmpCol.IsPrimaryKey ? '<span class="badge badge-info">PK</span>' : '';
					let tmpAuto = tmpCol.IsAutoIncrement ? '<span class="badge badge-neutral">AUTO</span>' : '';

					tmpRows += `<tr>
						<td><strong>${tmpCol.Name}</strong> ${tmpPK} ${tmpAuto}</td>
						<td>${tmpCol.NativeType}${tmpCol.MaxLength ? '(' + tmpCol.MaxLength + ')' : ''}</td>
						<td>${tmpCol.MeadowType}</td>
						<td>${tmpCol.Nullable ? 'YES' : 'NO'}</td>
						<td>${tmpCol.DefaultValue || '--'}</td>
					</tr>`;
				}

				tmpEl.innerHTML = `
				<h2>${pTableName}${tmpConnLabel}</h2>
				<table class="data-table">
					<thead><tr><th>Column</th><th>Native Type</th><th>Meadow Type</th><th>Nullable</th><th>Default</th></tr></thead>
					<tbody>${tmpRows}</tbody>
				</table>`;
				tmpEl.style.display = 'block';
			});
	}
}

module.exports = PictViewDataBeaconIntrospection;
module.exports.default_configuration = _ViewConfiguration;

/**
 * DataBeacon Introspection View
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

	onAfterRender()
	{
		let tmpCID = this.pict.AppData.SelectedConnectionID;
		let tmpTables = this.pict.AppData.Tables || [];
		let tmpConns = this.pict.AppData.Connections || [];

		let tmpOpts = '<option value="">-- Select Connection --</option>';
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].Connected)
			{
				let sel = (tmpConns[i].IDBeaconConnection === tmpCID) ? ' selected' : '';
				tmpOpts += `<option value="${tmpConns[i].IDBeaconConnection}"${sel}>${tmpConns[i].Name} (${tmpConns[i].Type})</option>`;
			}
		}

		let tmpTableHTML = tmpTables.length > 0 ? this._renderTables(tmpTables, tmpCID) : '<p class="empty-state">Select a connected database and click Introspect.</p>';

		let tmpHTML = `
	<h1>Schema Introspection</h1>
	<div class="section">
		<div class="form-row">
			<div class="form-group"><label>Connection</label><select id="introspect-connection" onchange="DataBeacon_selectIntConn(this.value)">${tmpOpts}</select></div>
			<div class="form-group"><button class="btn btn-primary" onclick="DataBeacon_runIntrospect()" ${tmpCID?'':'disabled'}>Introspect</button></div>
		</div>
	</div>
	${tmpTableHTML}
	<div id="DataBeacon-TableDetail" class="section" style="display:none;"></div>`;

		let tmpEl = document.getElementById('DataBeacon-Introspection-Content');
		if (tmpEl) tmpEl.innerHTML = tmpHTML;

		window.DataBeacon_selectIntConn = (id) => { this.pict.AppData.SelectedConnectionID=parseInt(id,10)||null; if(id) this.pict.providers.DataBeaconProvider.loadTables(parseInt(id,10)); };
		window.DataBeacon_runIntrospect = () => { if(this.pict.AppData.SelectedConnectionID) this.pict.providers.DataBeaconProvider.introspect(this.pict.AppData.SelectedConnectionID); };
		window.DataBeacon_enableEndpoint = (cid,t) => { this.pict.providers.DataBeaconProvider.enableEndpoint(cid,t); };
		window.DataBeacon_disableEndpoint = (cid,t) => { this.pict.providers.DataBeaconProvider.disableEndpoint(cid,t); };
		window.DataBeacon_viewTableDetail = (cid,t) => { this._showDetail(cid,t); };

		return super.onAfterRender();
	}

	_renderTables(pTables, pCID)
	{
		let rows = '';
		for (let i = 0; i < pTables.length; i++)
		{
			let t = pTables[i];
			let btn = t.EndpointsEnabled
				? `<button class="btn btn-small btn-warning" onclick="DataBeacon_disableEndpoint(${pCID},'${t.TableName}')">Disable</button>`
				: `<button class="btn btn-small btn-primary" onclick="DataBeacon_enableEndpoint(${pCID},'${t.TableName}')">Enable</button>`;
			let badge = t.EndpointsEnabled ? '<span class="badge badge-success">Active</span>' : '';
			rows += `<tr><td><a href="javascript:void(0)" onclick="DataBeacon_viewTableDetail(${pCID},'${t.TableName}')">${t.TableName}</a></td><td>${t.ColumnCount}</td><td>${t.RowCountEstimate||'--'}</td><td>${badge}</td><td class="actions-cell">${btn}</td></tr>`;
		}
		return `<div class="section"><h2>Discovered Tables (${pTables.length})</h2><table class="data-table"><thead><tr><th>Table</th><th>Columns</th><th>Est. Rows</th><th>Endpoint</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
	}

	_showDetail(pCID, pTableName)
	{
		this.pict.providers.DataBeaconProvider.loadTableDetails(pCID, pTableName,
			(e, d) =>
			{
				let el = document.getElementById('DataBeacon-TableDetail');
				if (!el) return;
				if (e || !d || !d.Columns) { el.innerHTML='<p class="error">Failed.</p>'; el.style.display='block'; return; }
				let rows = '';
				for (let i = 0; i < d.Columns.length; i++)
				{
					let c = d.Columns[i];
					let pk = c.IsPrimaryKey ? '<span class="badge badge-info">PK</span>' : '';
					let ai = c.IsAutoIncrement ? '<span class="badge badge-neutral">AUTO</span>' : '';
					rows += `<tr><td><strong>${c.Name}</strong> ${pk} ${ai}</td><td>${c.NativeType}${c.MaxLength?'('+c.MaxLength+')':''}</td><td>${c.MeadowType}</td><td>${c.Nullable?'YES':'NO'}</td><td>${c.DefaultValue||'--'}</td></tr>`;
				}
				el.innerHTML = `<h2>Table: ${pTableName}</h2><table class="data-table"><thead><tr><th>Column</th><th>Native Type</th><th>Meadow Type</th><th>Nullable</th><th>Default</th></tr></thead><tbody>${rows}</tbody></table>`;
				el.style.display = 'block';
			});
	}
}

module.exports = PictViewDataBeaconIntrospection;
module.exports.default_configuration = _ViewConfiguration;

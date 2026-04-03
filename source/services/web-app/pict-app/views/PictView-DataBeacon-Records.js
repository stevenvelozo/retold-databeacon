/**
 * DataBeacon Records View
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Records',
	DefaultRenderable: 'DataBeacon-Records',
	DefaultDestinationAddress: '#DataBeacon-View-Records',
	AutoRender: false,
	Templates: [{ Hash: 'DataBeacon-Records-Template', Template: '<div id="DataBeacon-Records-Content" class="records-view"></div>' }],
	Renderables: [{ RenderableHash: 'DataBeacon-Records', TemplateHash: 'DataBeacon-Records-Template', DestinationAddress: '#DataBeacon-View-Records' }]
};

class PictViewDataBeaconRecords extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender()
	{
		let tmpRecords = this.pict.AppData.Records || [];
		let tmpTableName = this.pict.AppData.SelectedTableName || '';
		let tmpEndpoints = this.pict.AppData.Endpoints || [];

		let tmpOpts = '<option value="">-- Select Table --</option>';
		for (let i = 0; i < tmpEndpoints.length; i++)
		{
			let sel = (tmpEndpoints[i].TableName === tmpTableName) ? ' selected' : '';
			tmpOpts += `<option value="${tmpEndpoints[i].TableName}"${sel}>${tmpEndpoints[i].TableName}</option>`;
		}

		let tmpTableContent = tmpRecords.length > 0
			? `<div class="section"><h2>${tmpTableName} (${tmpRecords.length} records)</h2>${this._buildTable(tmpRecords)}</div>`
			: (tmpTableName ? '<p class="empty-state">No records found.</p>' : '<p class="empty-state">Select an enabled table and click Load Records.</p>');

		let tmpHTML = `
	<h1>Record Browser</h1>
	<div class="section">
		<div class="form-row">
			<div class="form-group"><label>Table</label><select id="records-table" onchange="DataBeacon_selectRecordTable(this.value)">${tmpOpts}</select></div>
			<div class="form-group"><button class="btn btn-primary" onclick="DataBeacon_loadRecords()" ${tmpTableName?'':'disabled'}>Load Records</button></div>
		</div>
	</div>
	${tmpTableContent}
	<div id="DataBeacon-QueryPanel" class="section">
		<h2>Query Panel</h2>
		<div class="form-group"><label>SQL (SELECT only)</label><textarea id="query-sql" rows="3" placeholder="SELECT * FROM tablename LIMIT 50" class="query-input"></textarea></div>
		<div class="button-row"><button class="btn btn-primary" onclick="DataBeacon_executeQuery()">Execute</button></div>
		<div id="DataBeacon-QueryResults"></div>
	</div>`;

		let tmpEl = document.getElementById('DataBeacon-Records-Content');
		if (tmpEl) tmpEl.innerHTML = tmpHTML;

		window.DataBeacon_selectRecordTable = (t) => { this.pict.AppData.SelectedTableName=t; if(t) this.pict.providers.DataBeaconProvider.loadRecords(t,50); };
		window.DataBeacon_loadRecords = () => { let t=this.pict.AppData.SelectedTableName; if(t) this.pict.providers.DataBeaconProvider.loadRecords(t,50); };
		window.DataBeacon_executeQuery = () =>
		{
			let sql = document.getElementById('query-sql').value;
			let cid = this.pict.AppData.SelectedConnectionID;
			if(!sql){alert('Enter SQL');return;}
			if(!cid){alert('Select a connection in Introspection first');return;}
			this.pict.providers.DataBeaconProvider.executeQuery(cid, sql, (e,d) =>
			{
				let el = document.getElementById('DataBeacon-QueryResults');
				if(!el)return;
				if(e||!d||!d.Success){el.innerHTML=`<p class="error">${d?d.Error:'Error'}</p>`;return;}
				el.innerHTML = d.Rows && d.Rows.length > 0 ? this._buildTable(d.Rows) : '<p class="empty-state">No results.</p>';
			});
		};

		return super.onAfterRender();
	}

	_buildTable(pRows)
	{
		if (!pRows || pRows.length === 0) return '';
		let keys = Object.keys(pRows[0]);
		let hdr = '<tr>' + keys.map((k) => `<th>${k}</th>`).join('') + '</tr>';
		let body = '';
		let limit = Math.min(pRows.length, 100);
		for (let r = 0; r < limit; r++)
		{
			body += '<tr>';
			for (let c = 0; c < keys.length; c++)
			{
				let v = pRows[r][keys[c]];
				if (v === null || v === undefined) v = '<span class="null-value">NULL</span>';
				else if (typeof v === 'object') v = '<code>' + JSON.stringify(v).substring(0,80) + '</code>';
				else { let s = String(v); if (s.length > 100) s = s.substring(0,100)+'...'; v = s; }
				body += `<td>${v}</td>`;
			}
			body += '</tr>';
		}
		return `<div class="table-scroll"><table class="data-table"><thead>${hdr}</thead><tbody>${body}</tbody></table></div>${pRows.length>100?'<p class="help-text">Showing 100 of '+pRows.length+'</p>':''}`;
	}
}

module.exports = PictViewDataBeaconRecords;
module.exports.default_configuration = _ViewConfiguration;

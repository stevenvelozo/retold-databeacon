/**
 * DataBeacon Connections View
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Connections',
	DefaultRenderable: 'DataBeacon-Connections',
	DefaultDestinationAddress: '#DataBeacon-View-Connections',
	AutoRender: false,
	Templates: [{ Hash: 'DataBeacon-Connections-Template', Template: '<div id="DataBeacon-Connections-Content" class="connections-view"></div>' }],
	Renderables: [{ RenderableHash: 'DataBeacon-Connections', TemplateHash: 'DataBeacon-Connections-Template', DestinationAddress: '#DataBeacon-View-Connections' }]
};

class PictViewDataBeaconConnections extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender()
	{
		let tmpConnections = this.pict.AppData.Connections || [];
		let tmpTypes = this.pict.AppData.AvailableTypes || [];

		let tmpTypeOptions = '';
		for (let i = 0; i < tmpTypes.length; i++)
		{
			if (tmpTypes[i].Installed) tmpTypeOptions += `<option value="${tmpTypes[i].Type}">${tmpTypes[i].Type}</option>`;
		}
		if (!tmpTypeOptions) tmpTypeOptions = '<option value="MySQL">MySQL</option><option value="PostgreSQL">PostgreSQL</option><option value="MSSQL">MSSQL</option><option value="SQLite">SQLite</option>';

		let tmpHTML = `
	<h1>Database Connections</h1>
	<div class="section">
		<h2>Add Connection</h2>
		<div class="form-grid">
			<div class="form-group"><label>Name</label><input type="text" id="conn-name" placeholder="My Database" /></div>
			<div class="form-group"><label>Type</label><select id="conn-type">${tmpTypeOptions}</select></div>
			<div class="form-group"><label>Host</label><input type="text" id="conn-host" placeholder="localhost" /></div>
			<div class="form-group"><label>Port</label><input type="number" id="conn-port" placeholder="3306" /></div>
			<div class="form-group"><label>Database</label><input type="text" id="conn-database" placeholder="mydb" /></div>
			<div class="form-group"><label>Username</label><input type="text" id="conn-user" placeholder="root" /></div>
			<div class="form-group"><label>Password</label><input type="password" id="conn-password" /></div>
			<div class="form-group"><label>Description</label><input type="text" id="conn-description" /></div>
			<div class="form-group checkbox-group"><label><input type="checkbox" id="conn-autoconnect" /> Auto-connect on startup</label></div>
		</div>
		<div class="button-row"><button class="btn btn-primary" onclick="DataBeacon_createConnection()">Add Connection</button></div>
	</div>
	<div class="section">
		<h2>Saved Connections (${tmpConnections.length})</h2>
		${this._renderList(tmpConnections)}
	</div>`;

		let tmpEl = document.getElementById('DataBeacon-Connections-Content');
		if (tmpEl) tmpEl.innerHTML = tmpHTML;

		window.DataBeacon_createConnection = () => { this._createConnection(); };
		window.DataBeacon_testConnection = (id) => { this.pict.providers.DataBeaconProvider.testConnection(id, (e,d) => { alert(d && d.Success ? 'Test OK!' : 'Failed: '+(d?d.Error:'?')); }); };
		window.DataBeacon_connectConnection = (id) => { this.pict.providers.DataBeaconProvider.connectConnection(id); };
		window.DataBeacon_disconnectConnection = (id) => { this.pict.providers.DataBeaconProvider.disconnectConnection(id); };
		window.DataBeacon_deleteConnection = (id) => { if(confirm('Delete?')) this.pict.providers.DataBeaconProvider.deleteConnection(id); };
		window.DataBeacon_introspectConnection = (id) => { this.pict.providers.DataBeaconProvider.introspect(id, (e,d) => { if(d&&d.Success){this.pict.AppData.SelectedConnectionID=id;window.DataBeaconApp.navigateTo('Introspection');} else alert('Failed: '+(d?d.Error:'?')); }); };

		return super.onAfterRender();
	}

	_renderList(pConnections)
	{
		if (pConnections.length === 0) return '<p class="empty-state">No connections yet.</p>';
		let tmpRows = '';
		for (let i = 0; i < pConnections.length; i++)
		{
			let c = pConnections[i];
			let cls = c.Connected ? 'badge-success' : (c.Status==='OK'?'badge-info':(c.Status==='Failed'?'badge-error':'badge-neutral'));
			let lbl = c.Connected ? 'Connected' : c.Status;
			let acts = c.Connected
				? `<button class="btn btn-small btn-secondary" onclick="DataBeacon_introspectConnection(${c.IDBeaconConnection})">Introspect</button><button class="btn btn-small btn-warning" onclick="DataBeacon_disconnectConnection(${c.IDBeaconConnection})">Disconnect</button>`
				: `<button class="btn btn-small btn-primary" onclick="DataBeacon_connectConnection(${c.IDBeaconConnection})">Connect</button><button class="btn btn-small btn-secondary" onclick="DataBeacon_testConnection(${c.IDBeaconConnection})">Test</button>`;
			acts += `<button class="btn btn-small btn-danger" onclick="DataBeacon_deleteConnection(${c.IDBeaconConnection})">Delete</button>`;
			tmpRows += `<tr><td><strong>${c.Name}</strong></td><td>${c.Type}</td><td><span class="badge ${cls}">${lbl}</span></td><td>${c.Description||''}</td><td class="actions-cell">${acts}</td></tr>`;
		}
		return `<table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead><tbody>${tmpRows}</tbody></table>`;
	}

	_createConnection()
	{
		let t = document.getElementById('conn-type').value;
		let cfg = t === 'SQLite'
			? { SQLiteFilePath: document.getElementById('conn-database').value }
			: { host: document.getElementById('conn-host').value||'localhost', port: parseInt(document.getElementById('conn-port').value,10)||undefined, database: document.getElementById('conn-database').value, user: document.getElementById('conn-user').value, password: document.getElementById('conn-password').value };
		this.pict.providers.DataBeaconProvider.createConnection({ Name: document.getElementById('conn-name').value||'Untitled', Type: t, Config: cfg, AutoConnect: document.getElementById('conn-autoconnect').checked, Description: document.getElementById('conn-description').value });
	}
}

module.exports = PictViewDataBeaconConnections;
module.exports.default_configuration = _ViewConfiguration;

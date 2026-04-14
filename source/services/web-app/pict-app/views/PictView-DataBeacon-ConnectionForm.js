/**
 * DataBeacon ConnectionForm View
 *
 * Renders the "Add Connection" form. Iterates over AppData.AvailableTypesForForm
 * (computed by the provider from loadAvailableTypes) for the Type dropdown.
 * On submit, reads inputs via ContentAssignment and delegates to the provider.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'ConnectionForm',
	DefaultRenderable: 'DataBeacon-ConnectionForm',
	DefaultDestinationAddress: '#DataBeacon-ConnectionForm-Slot',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-ConnectionForm-Template',
			Template: /*html*/`
<div id="DataBeacon-ConnectionForm-Root" class="section">
	<h2>Add Connection</h2>
	<div class="form-grid">
		<div class="form-group"><label>Name</label><input type="text" id="databeacon-connform-name" placeholder="My Database" /></div>
		<div class="form-group">
			<label>Type</label>
			<select id="databeacon-connform-type">{~TS:DataBeacon-ConnectionForm-TypeOption:AppData.AvailableTypesForForm~}</select>
		</div>
		<div class="form-group"><label>Host</label><input type="text" id="databeacon-connform-host" placeholder="localhost" /></div>
		<div class="form-group"><label>Port</label><input type="number" id="databeacon-connform-port" placeholder="3306" /></div>
		<div class="form-group"><label>Database</label><input type="text" id="databeacon-connform-database" placeholder="mydb" /></div>
		<div class="form-group"><label>Username</label><input type="text" id="databeacon-connform-user" placeholder="root" /></div>
		<div class="form-group"><label>Password</label><input type="password" id="databeacon-connform-password" /></div>
		<div class="form-group"><label>Description</label><input type="text" id="databeacon-connform-description" /></div>
		<div class="form-group checkbox-group"><label><input type="checkbox" id="databeacon-connform-autoconnect" /> Auto-connect on startup</label></div>
	</div>
	<div class="button-row">
		<button class="btn btn-primary" data-databeacon-action="create-connection">
			<span data-databeacon-icon="plus" data-icon-size="16"></span>
			Add Connection
		</button>
	</div>
</div>`
		},
		{
			Hash: 'DataBeacon-ConnectionForm-TypeOption',
			Template: `<option value="{~D:Record.Type~}">{~D:Record.Type~}</option>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-ConnectionForm',
			TemplateHash: 'DataBeacon-ConnectionForm-Template',
			ContentDestinationAddress: '#DataBeacon-ConnectionForm-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconConnectionForm extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ConnectionForm-Root');

		let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-ConnectionForm-Root');
		if (tmpRootList && tmpRootList.length > 0)
		{
			tmpRootList[0].addEventListener('click', (pEvent) =>
			{
				let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
				if (!tmpBtn) return;
				this._handleAction(tmpBtn.getAttribute('data-databeacon-action'));
			});
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_handleAction(pAction)
	{
		if (pAction === 'create-connection') this._createConnection();
	}

	_readValue(pSelector)
	{
		let tmpList = this.pict.ContentAssignment.getElement(pSelector);
		if (!tmpList || tmpList.length === 0) return '';
		return tmpList[0].value;
	}

	_readChecked(pSelector)
	{
		let tmpList = this.pict.ContentAssignment.getElement(pSelector);
		if (!tmpList || tmpList.length === 0) return false;
		return !!tmpList[0].checked;
	}

	_createConnection()
	{
		let tmpType = this._readValue('#databeacon-connform-type');
		let tmpName = this._readValue('#databeacon-connform-name') || 'Untitled';
		let tmpDescription = this._readValue('#databeacon-connform-description');
		let tmpAutoConnect = this._readChecked('#databeacon-connform-autoconnect');

		let tmpConfig;
		if (tmpType === 'SQLite')
		{
			tmpConfig = { SQLiteFilePath: this._readValue('#databeacon-connform-database') };
		}
		else
		{
			let tmpPort = parseInt(this._readValue('#databeacon-connform-port'), 10);
			tmpConfig =
			{
				host: this._readValue('#databeacon-connform-host') || 'localhost',
				port: isNaN(tmpPort) ? undefined : tmpPort,
				database: this._readValue('#databeacon-connform-database'),
				user: this._readValue('#databeacon-connform-user'),
				password: this._readValue('#databeacon-connform-password')
			};
		}

		this.pict.providers.DataBeaconProvider.createConnection(
			{ Name: tmpName, Type: tmpType, Config: tmpConfig, AutoConnect: tmpAutoConnect, Description: tmpDescription }
		);
	}
}

module.exports = PictViewDataBeaconConnectionForm;
module.exports.default_configuration = _ViewConfiguration;

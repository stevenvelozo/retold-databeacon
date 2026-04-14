/**
 * DataBeacon ConnectionList View
 *
 * Renders saved connections as a table with per-row actions. The provider
 * pre-computes per-row display flags (StatusLabel, StatusBadgeClass, etc.)
 * into AppData.Connections so this template stays declarative.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'ConnectionList',
	DefaultRenderable: 'DataBeacon-ConnectionList',
	DefaultDestinationAddress: '#DataBeacon-ConnectionList-Slot',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-ConnectionList-Template',
			Template: /*html*/`
<div id="DataBeacon-ConnectionList-Root" class="section">
	<h2>Saved Connections ({~D:AppData.Connections.length:0~})</h2>
	{~TemplateIfAbsolute:DataBeacon-ConnectionList-Empty:AppData.Connections:AppData.Connections.length^==^0~}
	{~TemplateIfAbsolute:DataBeacon-ConnectionList-Table:AppData.Connections:AppData.Connections.length^>^0~}
</div>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Empty',
			Template: `<p class="empty-state">No connections yet.</p>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Table',
			Template: /*html*/`
<table class="data-table">
	<thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Description</th><th>Actions</th></tr></thead>
	<tbody>{~TS:DataBeacon-ConnectionList-Row:AppData.Connections~}</tbody>
</table>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Row',
			Template: /*html*/`
<tr>
	<td><strong>{~D:Record.Name~}</strong></td>
	<td>{~D:Record.Type~}</td>
	<td><span class="badge {~D:Record.StatusBadgeClass~}">{~D:Record.StatusLabel~}</span></td>
	<td>{~D:Record.Description~}</td>
	<td class="actions-cell">
		{~TIf:DataBeacon-ConnectionList-Row-ConnectedActions::Record.Connected^TRUE^x~}
		{~TIf:DataBeacon-ConnectionList-Row-DisconnectedActions::Record.Connected^FALSE^x~}
		<button class="btn btn-small btn-danger" data-databeacon-action="delete" data-connection-id="{~D:Record.IDBeaconConnection~}">
			<span data-databeacon-icon="trash" data-icon-size="14"></span> Delete
		</button>
	</td>
</tr>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Row-ConnectedActions',
			Template: /*html*/`
<button class="btn btn-small btn-secondary" data-databeacon-action="introspect" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="introspection" data-icon-size="14"></span> Introspect
</button>
<button class="btn btn-small btn-warning" data-databeacon-action="disconnect" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="disconnect" data-icon-size="14"></span> Disconnect
</button>`
		},
		{
			Hash: 'DataBeacon-ConnectionList-Row-DisconnectedActions',
			Template: /*html*/`
<button class="btn btn-small btn-primary" data-databeacon-action="connect" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="connect" data-icon-size="14"></span> Connect
</button>
<button class="btn btn-small btn-secondary" data-databeacon-action="test" data-connection-id="{~D:Record.IDBeaconConnection~}">
	<span data-databeacon-icon="test" data-icon-size="14"></span> Test
</button>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-ConnectionList',
			TemplateHash: 'DataBeacon-ConnectionList-Template',
			ContentDestinationAddress: '#DataBeacon-ConnectionList-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconConnectionList extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ConnectionList-Root');

		let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-ConnectionList-Root');
		if (tmpRootList && tmpRootList.length > 0)
		{
			tmpRootList[0].addEventListener('click', (pEvent) =>
			{
				let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
				if (!tmpBtn) return;
				this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
			});
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_handleAction(pAction, pData)
	{
		let tmpID = parseInt(pData.connectionId, 10);
		if (isNaN(tmpID)) return;

		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpModal = this.pict.views.PictSectionModal;

		switch (pAction)
		{
			case 'test':
				tmpProvider.testConnection(tmpID, (pError, pData) =>
				{
					if (pData && pData.Success)
					{
						tmpModal.toast('Connection test succeeded.', { type: 'success' });
					}
					else
					{
						tmpModal.toast('Connection test failed: ' + (pData ? pData.Error : 'Unknown error'), { type: 'error' });
					}
				});
				break;

			case 'connect':
				tmpProvider.connectConnection(tmpID);
				break;

			case 'disconnect':
				tmpProvider.disconnectConnection(tmpID);
				break;

			case 'delete':
				tmpModal.confirm('Are you sure you want to delete this connection?',
				{
					title: 'Delete Connection',
					confirmLabel: 'Delete',
					cancelLabel: 'Cancel',
					dangerous: true
				}).then((pConfirmed) =>
				{
					if (pConfirmed) tmpProvider.deleteConnection(tmpID);
				});
				break;

			case 'introspect':
				tmpProvider.introspect(tmpID, (pError, pData) =>
				{
					if (pData && pData.Success)
					{
						this.pict.AppData.SelectedConnectionID = tmpID;
						if (this.pict.views.Layout) this.pict.views.Layout.setActiveView('Introspection');
					}
					else
					{
						tmpModal.toast('Introspection failed: ' + (pData ? pData.Error : 'Unknown error'), { type: 'error' });
					}
				});
				break;
		}
	}
}

module.exports = PictViewDataBeaconConnectionList;
module.exports.default_configuration = _ViewConfiguration;

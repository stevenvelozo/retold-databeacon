/**
 * DataBeacon ThemeSwitcher View
 *
 * Sidebar-header widget with two icon buttons:
 *   - mode toggle  (sun / moon / monitor, cycles light/dark/system)
 *   - palette      (opens a pict-section-modal with theme tiles)
 *
 * Selecting a theme tile in the modal applies it via the Theme provider
 * and dismisses the modal. All DOM/event work flows through ContentAssignment
 * and data-databeacon-action delegation.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'ThemeSwitcher',
	DefaultRenderable: 'DataBeacon-ThemeSwitcher',
	DefaultDestinationAddress: '#DataBeacon-ThemeSwitcher-Slot',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-theme-switcher
		{
			display: inline-flex;
			align-items: center;
			gap: 4px;
		}
		.databeacon-theme-switcher-btn
		{
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 28px;
			height: 28px;
			padding: 0;
			border: 1px solid var(--border-color);
			background: var(--bg-card);
			color: var(--text-secondary);
			border-radius: 4px;
			cursor: pointer;
			transition: background 0.12s, color 0.12s, border-color 0.12s;
		}
		.databeacon-theme-switcher-btn:hover
		{
			background: var(--bg-input);
			color: var(--text-primary);
			border-color: var(--accent-primary);
		}
		.databeacon-theme-switcher-btn svg { display: block; }

		.databeacon-theme-picker
		{
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 12px;
		}
		.databeacon-theme-tile
		{
			display: flex;
			flex-direction: column;
			gap: 6px;
			padding: 12px;
			border: 1px solid var(--border-color);
			background: var(--bg-card);
			color: var(--text-primary);
			border-radius: 6px;
			cursor: pointer;
			text-align: left;
			transition: border-color 0.12s, transform 0.12s;
		}
		.databeacon-theme-tile:hover
		{
			border-color: var(--accent-primary);
			transform: translateY(-1px);
		}
		.databeacon-theme-tile.is-current
		{
			border-color: var(--accent-primary);
			box-shadow: inset 0 0 0 1px var(--accent-primary);
		}
		.databeacon-theme-tile-header
		{
			display: flex;
			align-items: baseline;
			justify-content: space-between;
			gap: 8px;
		}
		.databeacon-theme-tile-name
		{
			font-weight: 600;
			font-size: 14px;
			color: var(--text-primary);
		}
		.databeacon-theme-tile-era
		{
			font-size: 11px;
			color: var(--text-muted);
		}
		.databeacon-theme-tile-swatches
		{
			display: flex;
			gap: 4px;
		}
		.databeacon-theme-tile-swatch
		{
			flex: 1;
			height: 24px;
			border: 1px solid var(--border-color);
			border-radius: 3px;
		}
		.databeacon-theme-tile-current-badge
		{
			font-size: 10px;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--accent-primary);
		}
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-ThemeSwitcher-Template',
			Template: /*html*/`
<div id="DataBeacon-ThemeSwitcher-Root" class="databeacon-theme-switcher">
	<button type="button" class="databeacon-theme-switcher-btn" data-databeacon-action="cycle-mode" title="{~D:AppData.ThemeSwitcher.ModeTitle~}">
		<span data-databeacon-icon="{~D:AppData.ThemeSwitcher.ModeIcon~}" data-icon-size="16"></span>
	</button>
	<button type="button" class="databeacon-theme-switcher-btn" data-databeacon-action="open-theme-picker" title="Choose theme">
		<span data-databeacon-icon="palette" data-icon-size="16"></span>
	</button>
</div>`
		},
		{
			Hash: 'DataBeacon-ThemeSwitcher-Modal',
			Template: /*html*/`
<div class="databeacon-theme-picker">{~TS:DataBeacon-ThemeSwitcher-Tile:AppData.ThemeSwitcher.Themes~}</div>`
		},
		{
			Hash: 'DataBeacon-ThemeSwitcher-Tile',
			Template: /*html*/`
<button type="button" class="databeacon-theme-tile {~D:Record.SelectedClass~}" data-databeacon-action="apply-theme" data-theme-key="{~D:Record.Key~}">
	<div class="databeacon-theme-tile-header">
		<span class="databeacon-theme-tile-name">{~D:Record.Label~}</span>
		{~TIf:DataBeacon-ThemeSwitcher-Tile-CurrentBadge::Record.IsCurrent^TRUE^x~}
	</div>
	<div class="databeacon-theme-tile-era">{~D:Record.EraLabel~}</div>
	<div class="databeacon-theme-tile-swatches">
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch1~};"></span>
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch2~};"></span>
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch3~};"></span>
		<span class="databeacon-theme-tile-swatch" style="background: {~D:Record.Swatch4~};"></span>
	</div>
</button>`
		},
		{
			Hash: 'DataBeacon-ThemeSwitcher-Tile-CurrentBadge',
			Template: `<span class="databeacon-theme-tile-current-badge">Current</span>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-ThemeSwitcher',
			TemplateHash: 'DataBeacon-ThemeSwitcher-Template',
			ContentDestinationAddress: '#DataBeacon-ThemeSwitcher-Slot',
			RenderMethod: 'replace'
		}
	]
};

const _ModeIcons =
{
	'light':  { Icon: 'sun',     Next: 'dark',   Title: 'Light mode (click for dark)' },
	'dark':   { Icon: 'moon',    Next: 'system', Title: 'Dark mode (click for system)' },
	'system': { Icon: 'monitor', Next: 'light',  Title: 'System mode (click for light)' }
};

class PictViewDataBeaconThemeSwitcher extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this._ModalListenerAttached = false;
	}

	onBeforeRender(pRenderable)
	{
		let tmpTheme = this.pict.providers['DataBeacon-Theme'];
		if (tmpTheme)
		{
			let tmpMode = tmpTheme.getCurrentMode();
			let tmpModeInfo = _ModeIcons[tmpMode] || _ModeIcons.system;
			if (!this.pict.AppData.ThemeSwitcher) this.pict.AppData.ThemeSwitcher = {};
			this.pict.AppData.ThemeSwitcher.ModeIcon = tmpModeInfo.Icon;
			this.pict.AppData.ThemeSwitcher.ModeTitle = tmpModeInfo.Title;
			this.pict.AppData.ThemeSwitcher.Themes = tmpTheme._buildThemeViewData();
		}
		return super.onBeforeRender(pRenderable);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-ThemeSwitcher-Root');

		let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-ThemeSwitcher-Root');
		if (tmpRootList && tmpRootList.length > 0)
		{
			tmpRootList[0].addEventListener('click', (pEvent) =>
			{
				let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
				if (!tmpBtn) return;
				this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
			});
		}

		// Delegate clicks on theme tiles inside the pict-section-modal.
		// The modal dialog lives at document.body level and is re-created on
		// each open/close, but its container element stays around; attaching
		// once on document is the most robust wiring.
		if (!this._ModalListenerAttached && typeof document !== 'undefined')
		{
			document.addEventListener('click', (pEvent) =>
			{
				let tmpTile = pEvent.target.closest('[data-databeacon-action="apply-theme"]');
				if (!tmpTile) return;
				let tmpKey = tmpTile.getAttribute('data-theme-key');
				this._applyThemeFromTile(tmpKey);
			});
			this._ModalListenerAttached = true;
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_handleAction(pAction)
	{
		let tmpTheme = this.pict.providers['DataBeacon-Theme'];
		if (!tmpTheme) return;
		if (pAction === 'cycle-mode') tmpTheme.cycleMode();
		else if (pAction === 'open-theme-picker') this._openPicker();
	}

	_openPicker()
	{
		let tmpModal = this.pict.views.PictSectionModal;
		if (!tmpModal) return;
		let tmpContent = this.pict.parseTemplateByHash('DataBeacon-ThemeSwitcher-Modal', null);
		tmpModal.show(
		{
			title: 'Choose Theme',
			content: tmpContent,
			closeable: true,
			width: '560px'
		});
	}

	_applyThemeFromTile(pKey)
	{
		let tmpTheme = this.pict.providers['DataBeacon-Theme'];
		if (!tmpTheme || !pKey) return;
		tmpTheme.setTheme(pKey);
		let tmpModal = this.pict.views.PictSectionModal;
		if (tmpModal && typeof tmpModal.dismissModals === 'function')
		{
			tmpModal.dismissModals();
		}
	}
}

module.exports = PictViewDataBeaconThemeSwitcher;
module.exports.default_configuration = _ViewConfiguration;

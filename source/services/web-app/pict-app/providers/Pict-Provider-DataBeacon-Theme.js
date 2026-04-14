/**
 * Retold DataBeacon — Theme Provider
 *
 * Owns the palette registry, the (theme, mode) state, and the body
 * data-attributes that drive the CSS variable cascade defined in
 * Pict-Provider-DataBeacon-Theme-CSS.js. Listens to the OS
 * prefers-color-scheme media query so "system" mode stays live.
 *
 * Exposes public methods that the ThemeSwitcher view calls:
 *   getThemes(), getCurrentTheme(), getCurrentMode(), getEffectiveMode(),
 *   setTheme(key), setMode(mode), cycleMode().
 */
const libPictProvider = require('pict-provider');
const libThemeCSS = require('./Pict-Provider-DataBeacon-Theme-CSS.js');

const _ProviderConfiguration =
{
	ProviderIdentifier: 'DataBeacon-Theme',
	AutoInitialize: true,
	AutoInitializeOrdinal: -10   // run before everything else so the body attrs are set
};

const _StorageKeyTheme = 'databeacon.theme';
const _StorageKeyMode = 'databeacon.mode';

const _DefaultThemeKey = 'nineteen-97';
const _DefaultMode = 'system';

const _Modes = [ 'light', 'dark', 'system' ];

const _Themes =
[
	{
		Key: 'nineteen-97',
		Label: '1997',
		EraLabel: 'Windows 95 / 98',
		LightSwatch: [ '#ece9d8', '#808080', '#000080', '#800000' ],
		DarkSwatch:  [ '#1e1e2e', '#80a0ff', '#ff8080', '#ece9d8' ]
	},
	{
		Key: 'mac-classic',
		Label: 'Mac Classic',
		EraLabel: 'Mac OS 8 / 9 Platinum',
		LightSwatch: [ '#dddddd', '#999999', '#4080ff', '#cc0000' ],
		DarkSwatch:  [ '#202020', '#60a0ff', '#ff4060', '#dddddd' ]
	},
	{
		Key: 'next',
		Label: 'NeXT',
		EraLabel: 'NeXTSTEP',
		LightSwatch: [ '#e8e6dd', '#9a96a6', '#6a3fa0', '#aa2c3a' ],
		DarkSwatch:  [ '#1a1420', '#b090e0', '#ff6a80', '#e8e6dd' ]
	},
	{
		Key: 'beos',
		Label: 'BeOS',
		EraLabel: 'BeOS R5',
		LightSwatch: [ '#e0e8ec', '#8ba3b0', '#3a7a8a', '#cc5530' ],
		DarkSwatch:  [ '#0a1a22', '#60b0c0', '#ffc860', '#ff8060' ]
	},
	{
		Key: 'sgi',
		Label: 'SGI',
		EraLabel: 'SGI Indy / IRIX',
		LightSwatch: [ '#c8c8c8', '#c82080', '#3080c0', '#202020' ],
		DarkSwatch:  [ '#1a1a1a', '#ff60b0', '#60c0ff', '#e0e0e0' ]
	}
];

class PictProviderDataBeaconTheme extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this.serviceType = 'PictProviderDataBeaconTheme';

		this._CurrentTheme = _DefaultThemeKey;
		this._CurrentMode = _DefaultMode;
		this._MediaQueryList = null;
		this._MediaQueryHandler = null;
	}

	onAfterInitialize()
	{
		// Register the palette CSS. Priority 100 is below the default 500
		// so the variable definitions are injected early in the cascade.
		if (this.pict && this.pict.CSSMap && typeof this.pict.CSSMap.addCSS === 'function')
		{
			this.pict.CSSMap.addCSS('DataBeacon-Themes', libThemeCSS, 100);
		}

		// Restore persisted choice (if any) before any view renders.
		this._CurrentTheme = this._readStorage(_StorageKeyTheme, _DefaultThemeKey);
		this._CurrentMode = this._readStorage(_StorageKeyMode, _DefaultMode);
		if (!this._isValidThemeKey(this._CurrentTheme)) this._CurrentTheme = _DefaultThemeKey;
		if (_Modes.indexOf(this._CurrentMode) === -1) this._CurrentMode = _DefaultMode;

		// Subscribe to OS preference changes so "system" mode stays live.
		if (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
		{
			this._MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
			this._MediaQueryHandler = () =>
			{
				if (this._CurrentMode === 'system') this._applyToDOM();
			};
			if (typeof this._MediaQueryList.addEventListener === 'function')
			{
				this._MediaQueryList.addEventListener('change', this._MediaQueryHandler);
			}
			else if (typeof this._MediaQueryList.addListener === 'function')
			{
				// Safari < 14 fallback.
				this._MediaQueryList.addListener(this._MediaQueryHandler);
			}
		}

		// Expose the theme list to AppData so templates can iterate via {~TS:~}.
		if (!this.pict.AppData.ThemeSwitcher) this.pict.AppData.ThemeSwitcher = {};
		this.pict.AppData.ThemeSwitcher.Themes = this._buildThemeViewData();

		// Paint the body immediately so the first render is already themed.
		this._applyToDOM();

		return super.onAfterInitialize();
	}

	// ================================================================
	// Public accessors
	// ================================================================

	getThemes()
	{
		return _Themes;
	}

	getCurrentTheme()
	{
		return this._CurrentTheme;
	}

	getCurrentMode()
	{
		return this._CurrentMode;
	}

	getEffectiveMode()
	{
		return this._resolveEffectiveMode();
	}

	// ================================================================
	// Public mutators
	// ================================================================

	setTheme(pKey)
	{
		if (!this._isValidThemeKey(pKey)) return false;
		this._CurrentTheme = pKey;
		this._writeStorage(_StorageKeyTheme, pKey);
		this.pict.AppData.ThemeSwitcher.Themes = this._buildThemeViewData();
		this._applyToDOM();
		if (this.pict.views.ThemeSwitcher) this.pict.views.ThemeSwitcher.render();
		return true;
	}

	setMode(pMode)
	{
		if (_Modes.indexOf(pMode) === -1) return false;
		this._CurrentMode = pMode;
		this._writeStorage(_StorageKeyMode, pMode);
		this._applyToDOM();
		if (this.pict.views.ThemeSwitcher) this.pict.views.ThemeSwitcher.render();
		return true;
	}

	cycleMode()
	{
		let tmpIdx = _Modes.indexOf(this._CurrentMode);
		let tmpNext = _Modes[(tmpIdx + 1) % _Modes.length];
		return this.setMode(tmpNext);
	}

	// ================================================================
	// Internal helpers
	// ================================================================

	_isValidThemeKey(pKey)
	{
		for (let i = 0; i < _Themes.length; i++)
		{
			if (_Themes[i].Key === pKey) return true;
		}
		return false;
	}

	_resolveEffectiveMode()
	{
		if (this._CurrentMode === 'system')
		{
			if (this._MediaQueryList && typeof this._MediaQueryList.matches === 'boolean')
			{
				return this._MediaQueryList.matches ? 'dark' : 'light';
			}
			return 'dark';
		}
		return this._CurrentMode;
	}

	_applyToDOM()
	{
		if (typeof document === 'undefined' || !document.body) return;
		document.body.setAttribute('data-theme', this._CurrentTheme);
		document.body.setAttribute('data-mode-effective', this._resolveEffectiveMode());
		document.body.setAttribute('data-mode', this._CurrentMode);
	}

	_readStorage(pKey, pDefault)
	{
		try
		{
			if (typeof localStorage === 'undefined') return pDefault;
			let tmpValue = localStorage.getItem(pKey);
			return (tmpValue === null || tmpValue === undefined) ? pDefault : tmpValue;
		}
		catch (pError)
		{
			return pDefault;
		}
	}

	_writeStorage(pKey, pValue)
	{
		try
		{
			if (typeof localStorage === 'undefined') return;
			localStorage.setItem(pKey, pValue);
		}
		catch (pError)
		{
			// Ignore — quota errors, privacy mode, etc. Theme still applies in-memory.
		}
	}

	/**
	 * Build the template-ready theme list. Each entry has:
	 *  - Key, Label, EraLabel
	 *  - Swatch1..Swatch4 (flat for easy template binding)
	 *  - IsCurrent (boolean — view uses TRUE/FALSE conditional)
	 *  - SelectedClass (space-appended class name for CSS)
	 */
	_buildThemeViewData()
	{
		let tmpEffectiveMode = this._resolveEffectiveMode();
		let tmpResult = [];
		for (let i = 0; i < _Themes.length; i++)
		{
			let tmpTheme = _Themes[i];
			let tmpSwatch = (tmpEffectiveMode === 'dark') ? tmpTheme.DarkSwatch : tmpTheme.LightSwatch;
			let tmpIsCurrent = (tmpTheme.Key === this._CurrentTheme);
			tmpResult.push(
			{
				Key: tmpTheme.Key,
				Label: tmpTheme.Label,
				EraLabel: tmpTheme.EraLabel,
				Swatch1: tmpSwatch[0],
				Swatch2: tmpSwatch[1],
				Swatch3: tmpSwatch[2],
				Swatch4: tmpSwatch[3],
				IsCurrent: tmpIsCurrent,
				SelectedClass: tmpIsCurrent ? 'is-current' : ''
			});
		}
		return tmpResult;
	}
}

module.exports = PictProviderDataBeaconTheme;
module.exports.default_configuration = _ProviderConfiguration;

/**
 * PictView-DataBeacon-Login
 *
 * Thin host wrapper around pict-section-login.  The section view
 * renders into `#Pict-Login-Container`; this wrapper paints that
 * mount point inside the databeacon's Login panel and delegates the
 * render to the section.  Modeled after PictView-Ultravisor-Login.js
 * so the experience matches Ultravisor's login screen 1:1.
 *
 * The section ships its own theme-neutral CSS; this file only adds
 * layout chrome (centered card in the content panel).
 */

const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Login',
	AutoInitialize: true,
	AutoRender: false,

	DefaultRenderable: 'DataBeacon-Login-Content',
	DefaultDestinationAddress: '#DataBeacon-View-Login',

	Templates:
	[
		{
			Hash: 'DataBeacon-Login-Template',
			Template: /*html*/`
<div class="databeacon-login-page">
	<div id="Pict-Login-Container"></div>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Login-Content',
			TemplateHash: 'DataBeacon-Login-Template',
			ContentDestinationAddress: '#DataBeacon-View-Login',
			RenderMethod: 'replace'
		}
	],

	CSS: /*css*/`
		.databeacon-login-page
		{
			min-height: calc(100vh - 56px);
			display: flex;
			align-items: center;
			justify-content: center;
			padding: 32px 16px;
		}
	`
};

class DataBeaconLoginView extends libPictView
{
	onAfterRender(pRenderable, pAddress, pRecord, pContent)
	{
		// Render pict-section-login into the freshly-painted mount point.
		// The section tracks its own DefaultDestinationAddress (#Pict-
		// Login-Container), so a plain render() call routes correctly.
		let tmpInner = this.pict && this.pict.views && this.pict.views['Pict-Section-Login'];
		if (tmpInner) { tmpInner.render(); }
		this.pict.CSSMap.injectCSS();
		return super.onAfterRender
			? super.onAfterRender(pRenderable, pAddress, pRecord, pContent)
			: undefined;
	}
}

module.exports = DataBeaconLoginView;
module.exports.default_configuration = _ViewConfiguration;

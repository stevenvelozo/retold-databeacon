/**
 * Retold DataBeacon — Theme CSS
 *
 * Defines the CSS custom-property palette for every (theme x mode) combo.
 * Component styles in databeacon.css reference the variables defined here,
 * so swapping the body[data-theme][data-mode-effective] attributes re-tints
 * the entire UI instantly.
 *
 * Variables every theme must define:
 *   --bg-primary, --bg-secondary, --bg-card, --bg-input
 *   --text-primary, --text-secondary, --text-muted, --text-on-accent
 *   --accent-primary, --accent-primary-hover
 *   --accent-success, --accent-warning, --accent-danger, --accent-info
 *   --border-color
 */
module.exports = /*css*/`
/* ──────────────────────────────────────────────────────────────────────
 * 1997 — Windows 95 / 98 retro
 * Light: beige / grey / navy / maroon
 * Dark : indigo-grey / sky / coral / cream
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="nineteen-97"][data-mode-effective="light"]
{
	--bg-primary: #ece9d8;
	--bg-secondary: #d8d3b8;
	--bg-card: #fffbf0;
	--bg-input: #ffffff;
	--text-primary: #1a1a1a;
	--text-secondary: #4a4a4a;
	--text-muted: #7a7a7a;
	--text-on-accent: #ffffff;
	--accent-primary: #000080;
	--accent-primary-hover: #0000cc;
	--accent-success: #008000;
	--accent-warning: #808000;
	--accent-danger: #800000;
	--accent-info: #000080;
	--border-color: #808080;
}

body[data-theme="nineteen-97"][data-mode-effective="dark"]
{
	--bg-primary: #1e1e2e;
	--bg-secondary: #26263a;
	--bg-card: #2a2a3a;
	--bg-input: #343450;
	--text-primary: #ece9d8;
	--text-secondary: #b8b6a8;
	--text-muted: #7e7c70;
	--text-on-accent: #1a1a1a;
	--accent-primary: #80a0ff;
	--accent-primary-hover: #a0b8ff;
	--accent-success: #80ff80;
	--accent-warning: #ffcc00;
	--accent-danger: #ff8080;
	--accent-info: #80c0ff;
	--border-color: #4e4e68;
}

/* ──────────────────────────────────────────────────────────────────────
 * Mac Classic — Mac OS 8 / 9 Platinum
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="mac-classic"][data-mode-effective="light"]
{
	--bg-primary: #dddddd;
	--bg-secondary: #cccccc;
	--bg-card: #f0f0f0;
	--bg-input: #ffffff;
	--text-primary: #000000;
	--text-secondary: #444444;
	--text-muted: #777777;
	--text-on-accent: #ffffff;
	--accent-primary: #4080ff;
	--accent-primary-hover: #60a0ff;
	--accent-success: #339933;
	--accent-warning: #cc6600;
	--accent-danger: #cc0000;
	--accent-info: #4080ff;
	--border-color: #999999;
}

body[data-theme="mac-classic"][data-mode-effective="dark"]
{
	--bg-primary: #202020;
	--bg-secondary: #2a2a2a;
	--bg-card: #2e2e2e;
	--bg-input: #3a3a3a;
	--text-primary: #dddddd;
	--text-secondary: #b0b0b0;
	--text-muted: #777777;
	--text-on-accent: #0a0a0a;
	--accent-primary: #60a0ff;
	--accent-primary-hover: #80b8ff;
	--accent-success: #60cc60;
	--accent-warning: #ff9933;
	--accent-danger: #ff4060;
	--accent-info: #60a0ff;
	--border-color: #555555;
}

/* ──────────────────────────────────────────────────────────────────────
 * NeXT — NeXTSTEP stone + purple
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="next"][data-mode-effective="light"]
{
	--bg-primary: #e8e6dd;
	--bg-secondary: #d6d3c8;
	--bg-card: #f5f3ed;
	--bg-input: #ffffff;
	--text-primary: #1e1a26;
	--text-secondary: #4c465a;
	--text-muted: #7a7488;
	--text-on-accent: #ffffff;
	--accent-primary: #6a3fa0;
	--accent-primary-hover: #8557c0;
	--accent-success: #3a7a3a;
	--accent-warning: #b88a00;
	--accent-danger: #aa2c3a;
	--accent-info: #6a3fa0;
	--border-color: #9a96a6;
}

body[data-theme="next"][data-mode-effective="dark"]
{
	--bg-primary: #1a1420;
	--bg-secondary: #221a2c;
	--bg-card: #251c2e;
	--bg-input: #2f253a;
	--text-primary: #e8e6dd;
	--text-secondary: #b8b4c6;
	--text-muted: #7a7488;
	--text-on-accent: #1a1420;
	--accent-primary: #b090e0;
	--accent-primary-hover: #c8aef0;
	--accent-success: #7acc7a;
	--accent-warning: #ffcf4a;
	--accent-danger: #ff6a80;
	--accent-info: #b090e0;
	--border-color: #5e5468;
}

/* ──────────────────────────────────────────────────────────────────────
 * BeOS — teal + orange
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="beos"][data-mode-effective="light"]
{
	--bg-primary: #e0e8ec;
	--bg-secondary: #c8d6de;
	--bg-card: #f0f4f6;
	--bg-input: #ffffff;
	--text-primary: #101820;
	--text-secondary: #40525e;
	--text-muted: #6e828e;
	--text-on-accent: #ffffff;
	--accent-primary: #3a7a8a;
	--accent-primary-hover: #4e98aa;
	--accent-success: #2a7a4a;
	--accent-warning: #cc9930;
	--accent-danger: #cc5530;
	--accent-info: #3a7a8a;
	--border-color: #8ba3b0;
}

body[data-theme="beos"][data-mode-effective="dark"]
{
	--bg-primary: #0a1a22;
	--bg-secondary: #102530;
	--bg-card: #142430;
	--bg-input: #1b313f;
	--text-primary: #b0d0e0;
	--text-secondary: #7a98a8;
	--text-muted: #556a78;
	--text-on-accent: #0a1a22;
	--accent-primary: #60b0c0;
	--accent-primary-hover: #80ccdc;
	--accent-success: #4ac06a;
	--accent-warning: #ffc860;
	--accent-danger: #ff8060;
	--accent-info: #60b0c0;
	--border-color: #466070;
}

/* ──────────────────────────────────────────────────────────────────────
 * SGI — Indy / IRIX magenta + cyan
 * ────────────────────────────────────────────────────────────────────── */

body[data-theme="sgi"][data-mode-effective="light"]
{
	--bg-primary: #c8c8c8;
	--bg-secondary: #b8b8b8;
	--bg-card: #dcdcdc;
	--bg-input: #ffffff;
	--text-primary: #202020;
	--text-secondary: #4a4a4a;
	--text-muted: #6e6e6e;
	--text-on-accent: #ffffff;
	--accent-primary: #c82080;
	--accent-primary-hover: #e040a0;
	--accent-success: #208040;
	--accent-warning: #e8a818;
	--accent-danger: #e83018;
	--accent-info: #3080c0;
	--border-color: #808080;
}

body[data-theme="sgi"][data-mode-effective="dark"]
{
	--bg-primary: #1a1a1a;
	--bg-secondary: #232323;
	--bg-card: #252525;
	--bg-input: #2e2e2e;
	--text-primary: #e0e0e0;
	--text-secondary: #a8a8a8;
	--text-muted: #707070;
	--text-on-accent: #0a0a0a;
	--accent-primary: #ff60b0;
	--accent-primary-hover: #ff80c8;
	--accent-success: #50d080;
	--accent-warning: #ffd050;
	--accent-danger: #ff6060;
	--accent-info: #60c0ff;
	--border-color: #505050;
}
`;

const libPuppeteer = require('puppeteer');
const libChildProcess = require('child_process');

const REPO   = '/Users/steven/Code/retold/modules/apps/retold-databeacon';
const ORIGIN = 'http://localhost:8389';

(async () => {
  let server = libChildProcess.spawn('node', [ 'test/dev-server.js' ], { cwd: REPO, stdio: 'pipe' });
  await new Promise((resolve) => {
    server.stdout.on('data', (d) => { if (d.toString().includes('listening on')) setTimeout(resolve, 800); });
  });

  let browser = await libPuppeteer.launch({ headless: 'new' });
  let page = await browser.newPage();
  page.on('console', (m) => console.log('[browser ' + m.type() + ']', m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));

  console.log('--- title:', await page.title());
  console.log('--- body length:', (await page.evaluate(() => document.body.innerHTML)).length);
  console.log('--- has window.pict:', await page.evaluate(() => typeof window.pict));
  console.log('--- views:', await page.evaluate(() => window.pict ? Object.keys(window.pict.views) : 'no pict'));

  console.log('--- nav to Connections');
  await page.evaluate(() => { window.location.hash = '#/view/Connections'; });
  await new Promise((r) => setTimeout(r, 1000));

  console.log('--- after nav, look for slot:');
  console.log(await page.evaluate(() => {
    let r = {};
    r.formSlot = !!document.querySelector('#DataBeacon-ConnectionForm-Slot');
    r.fieldsSlot = !!document.querySelector('#DataBeacon-ConnectionForm-FieldsSlot');
    r.formViewExists = !!(window.pict && window.pict.views && window.pict.views['PictSection-ConnectionForm']);
    r.connectionFormView = !!(window.pict && window.pict.views && window.pict.views['ConnectionForm']);
    r.appData_AvailableTypes = (window.pict && window.pict.AppData) ? (window.pict.AppData.AvailableTypes || []).length : 0;
    r.appData_FormSchemas = (window.pict && window.pict.AppData && window.pict.AppData.PictSectionConnectionForm) ?
      (window.pict.AppData.PictSectionConnectionForm.ProviderForms || []).length : 'n/a';
    return r;
  }));

  console.log('--- look for any element with "databeacon-conn" in id:');
  console.log(await page.evaluate(() =>
    Array.from(document.querySelectorAll('[id*="databeacon-conn"]')).map((el) => el.id).slice(0, 10)
  ));

  console.log('--- snippet of body html:');
  let html = await page.evaluate(() => document.body.innerHTML);
  // Find ConnectionForm slot
  let idx = html.indexOf('DataBeacon-ConnectionForm');
  if (idx >= 0) console.log(html.substring(idx, idx + 600));

  await browser.close();
  server.kill('SIGTERM');
})();

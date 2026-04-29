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
  page.on('response', (pRes) => {
    if (pRes.status() >= 400) console.log(`  ${pRes.status()} ${pRes.url()}`);
  });
  await page.goto(ORIGIN + '/', { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1000));
  await browser.close();
  server.kill('SIGTERM');
})();

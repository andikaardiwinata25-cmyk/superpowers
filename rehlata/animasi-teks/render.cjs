// Render each scene to PNG frames with transparency.
// usage: node render.js OUTDIR [scene] [onlyTimeSeconds]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2];
  const only = process.argv[3];
  const tOnly = process.argv[4];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => window.ready);
  const durs = await page.evaluate(() => window.DUR);
  for (const id of Object.keys(durs)) {
    if (only && only !== id) continue;
    const dir = path.join(out, id); fs.mkdirSync(dir, { recursive: true });
    const n = Math.round(durs[id] * 30);
    const frames = tOnly ? tOnly.split(',').map(s => Math.round(parseFloat(s) * 30)) : [...Array(n).keys()];
    for (const f of frames) {
      await page.evaluate(([id, t]) => window.render(id, t), [id, f / 30]);
      await page.screenshot({ path: path.join(dir, String(f).padStart(4, '0') + '.png'), omitBackground: true });
    }
    console.log(id, frames.length, 'frames');
  }
  await browser.close();
})();

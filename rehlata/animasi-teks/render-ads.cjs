// Render the ad title overlay as a transparent PNG sequence covering the whole video.
// usage: node render-ads.cjs OUTDIR [t1,t2,...]   (times in seconds = preview frames only)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2];
  const only = process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'ads-scenes.json'), 'utf8'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'ads.html'));
  await page.evaluate(c => window.init(c), cfg);
  const fps = 30, n = Math.round(cfg.duration * fps);
  const frames = only ? only.split(',').map(s => Math.round(parseFloat(s) * fps)) : [...Array(n).keys()];
  const blank = path.join(out, 'blank.png');
  let haveBlank = false;
  for (const f of frames) {
    const file = path.join(out, String(f).padStart(5, '0') + '.png');
    const any = await page.evaluate(t => window.renderAt(t), f / fps);
    if (!any && haveBlank && !only) { fs.copyFileSync(blank, file); continue; }
    await page.screenshot({ path: file, omitBackground: true });
    if (!any && !haveBlank) { fs.copyFileSync(file, blank); haveBlank = true; }
  }
  console.log(frames.length, 'frames');
  await browser.close();
})();

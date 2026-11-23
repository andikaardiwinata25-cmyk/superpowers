import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, renderMedia} from '@remotion/renderer';
import path from 'node:path';
const mode = process.argv[2];
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell';
const composition = await selectComposition({serveUrl, id: 'JejakIbadah', browserExecutable});
if (mode === 'stills') {
  for (const fr of process.argv.slice(3).map(Number)) {
    await renderStill({serveUrl, composition, frame: fr, output: `out/s_${fr}.png`, browserExecutable, scale: 0.5});
    console.log('still', fr);
  }
} else {
  await renderMedia({serveUrl, composition, codec: 'h264', crf: 18, outputLocation: process.argv[3], browserExecutable,
    concurrency: 4, audioBitrate: '192k', onProgress: ({progress}) => { if (Math.round(progress*100)%10===0) process.stdout.write(`\r${Math.round(progress*100)}%`); }});
  console.log('\ndone');
}

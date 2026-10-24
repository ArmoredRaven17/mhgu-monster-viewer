// one headless live soak per Beam Test type (dev/effect-live-soak.mjs --rock beam:N), 3 at a time; prints each result line
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const VIEWER = 'C:/MHGU-Extract/MHGU-Monster-Viewer';
const OUT = process.argv[2];
const ids = process.argv.slice(3).length ? process.argv.slice(3).map(Number) : [...Array(44).keys()];
fs.mkdirSync(OUT, { recursive: true });
const run = i => new Promise(res => {
  const log = fs.openSync(`${OUT}/beam${i}.log`, 'w');
  const p = spawn('node', ['dev/effect-live-soak.mjs', 'em004_00', 'Beam Test', '--rock', 'beam:' + i], { cwd: VIEWER, stdio: ['ignore', log, log] });
  p.on('exit', code => { fs.closeSync(log); res([i, code]); });
});
const queue = ids.slice(); const results = [];
async function worker(){ while (queue.length){ const i = queue.shift(); const r = await run(i); results.push(r); console.log('beam:' + r[0], r[1] === 0 ? 'clean' : 'REFUSED/exit ' + r[1]); } }
await Promise.all([worker(), worker(), worker()]);
console.log('done', results.filter(r => r[1] === 0).length, 'clean of', results.length);

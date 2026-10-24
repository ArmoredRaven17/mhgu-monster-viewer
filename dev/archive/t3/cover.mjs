// cover.mjs: which of the transcription's instructions the t3diff cases execute (per function)
import fs from 'fs';
const m = await import('./hit-type3-trace.mjs');
const cs = JSON.parse(fs.readFileSync(new URL('./t3diff.json', import.meta.url)));
const hit = new Set();
for (const c of cs){ m.type3VsHunter({ p0: c.A[0], p1: c.A[1], r: c.A[2] }, { p0: c.B[0], p1: c.B[1], r: c.B[2] }); const M = m.MACHINE(); for (const t of M.T) hit.add(t[0]); M.T.length = 0; }
const src = fs.readFileSync(new URL('./rom_t3.js', import.meta.url), 'utf8');
let fn = null; const tot = {}, got = {}, miss = {};
for (const l of src.split('\n')){
  const f = l.match(/^function F_([0-9a-f]+)/); if (f) fn = f[1];
  const c = l.match(/^    case 0x([0-9a-f]+):/); if (c && fn){ const a = parseInt(c[1], 16); tot[fn] = (tot[fn] || 0) + 1; if (hit.has(a)) got[fn] = (got[fn] || 0) + 1; else (miss[fn] = miss[fn] || []).push(c[1]); }
}
let T = 0, G = 0;
for (const k of Object.keys(tot)){ T += tot[k]; G += got[k] || 0; console.log(k, (got[k] || 0) + '/' + tot[k]); }
console.log('ALL', G + '/' + T);
fs.writeFileSync(new URL('./miss.json', import.meta.url), JSON.stringify(miss));

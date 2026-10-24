import { readFileSync } from 'node:fs';
import { Mem } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/mem.js';
import { distanceFade } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/bridge.js';
const cases = JSON.parse(readFileSync('C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/anglegrid.json', 'utf8'));
const m = new Mem();
const P = 0x60000000, A = 0x60001000, B = 0x60002000;
const f4 = v => { const b = new Uint8Array(16), d = new DataView(b.buffer); v.forEach((x, i) => d.setFloat32(4 * i, x === 'nan' ? NaN : x, true)); return b; };
let bad = 0;
for (const c of cases){
  m.load(P, Uint8Array.from(c.p.match(/../g).map(h => parseInt(h, 16))));
  m.load(A, f4(c.a)); m.load(B, f4(c.b));
  const js = distanceFade(m, P, A, B, c.mul, Math.fround(c.d)) >>> 0;
  if (js !== c.rom){ if (bad++ < 8) console.log('MISMATCH', JSON.stringify({ a: c.a, b: c.b, p: c.p.slice(0, 16), lohi: c.p.slice(64, 80), rom: c.rom, js })); }
}
console.log(cases.length, 'cases,', bad, 'mismatches');

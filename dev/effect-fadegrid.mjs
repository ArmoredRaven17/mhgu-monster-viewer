// The distance fade 0xca6874 (bridge.js distanceFade) against the ROM's own routine run under the emulator:
//   python C:\MHGU-Extract\efxadegrid.py   (writes the cases)   then   node dev/effect-fadegrid.mjs
import { readFileSync } from 'node:fs';
import { distanceFade } from '../docs/render/rom/effect/bridge.js';
const cases = JSON.parse(readFileSync('C:/MHGU-Extract/efx/logs/fadegrid.json', 'utf8'));
let bad = 0;
for (const c of cases){
  const buf = new DataView(new ArrayBuffer(0x40));
  buf.setUint32(0, c.flags, true);
  [100, 300, 600, 900].forEach((v, i) => buf.setFloat32(0x10 + 4 * i, v, true));
  buf.setFloat32(0x28, c.f28, true);
  const m = { u32: a => buf.getUint32(a, true), f32: a => buf.getFloat32(a, true) };
  const d = c.d === 'nan' ? NaN : c.d;
  const js = distanceFade(m, 0, 0, 0, c.mul, Math.fround(d)) >>> 0;
  if (js !== c.rom){ bad++; if (bad < 10) console.log('MISMATCH', JSON.stringify(c), 'js', js); }
}
console.log(cases.length, 'cases,', bad, 'mismatches');

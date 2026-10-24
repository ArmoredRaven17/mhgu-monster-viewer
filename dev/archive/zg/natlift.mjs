const cpu = await import('file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/cpu.js');
const nat = new Map(), lif = new Map();
const rn = cpu.registerNative, rl = cpu.registerLifted;
// wrap by monkeypatching is impossible on ESM exports; instead read the sources
import { readFileSync, readdirSync } from 'node:fs';
const dir = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/rom/effect/';
const natives = new Set(), lifted = new Set();
for (const f of readdirSync(dir)){
  const s = readFileSync(dir + f, 'utf8');
  for (const m of s.matchAll(/registerNative\((0x[0-9a-f]+)/g)) natives.add(parseInt(m[1], 16) + ':' + f);
  for (const m of s.matchAll(/^  (0x[0-9a-f]+): L_[0-9a-f]+,/gm)) lifted.add(parseInt(m[1], 16) + ':' + f);
}
const L = new Map([...lifted].map(x => { const [a, f] = x.split(':'); return [+a, f]; }));
for (const x of natives){ const [a, f] = x.split(':'); if (L.has(+a)) console.log('both', (+a).toString(16), f, L.get(+a)); }

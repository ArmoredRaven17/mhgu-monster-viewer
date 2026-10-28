// khezuaoe/tiredrows.mjs (Khezu AoE lane, 2026-10-27): every MOTION_STATES row marked `tired`, against the ROM's action -> motion census
// (docs/action-motions.json: each class's action main under unicorn, every setMotion recorded). A row is the tired idle when the clip
// is played by (0, 2) -- the shared idle chooser's tired arm (vt+0x3dc 0x75168: (0, 2) with P+0x1a8 bit 6, the stamina state) -- and
// lists every OTHER action that plays the same clip (a clip shared with a non-tired action does not say the monster is tired).
//   node dev/archive/khezuaoe/tiredrows.mjs > tiredrows.out
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const D = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/';
const MS = await import(pathToFileURL(D + 'render/motion-states.js').href);
const AM = JSON.parse(fs.readFileSync(D + 'action-motions.json', 'utf8'));
const HA = JSON.parse(fs.readFileSync(D + 'hyper-auras.json', 'utf8'));
let n = 0; const mons = new Set();
for (const [mon, rows] of Object.entries(MS.MOTION_STATES)){
  for (const [key, spec] of Object.entries(rows)){
    const arms = spec && spec.cycle ? spec.cycle : [spec];
    if (!arms.some(a => a && a.tired)) continue;
    n++; mons.add(mon);
    const base = key.split('#')[0];
    const c = AM[mon] || AM[mon.slice(0, 6) + '00'];
    const acts = c && c.motions ? (c.motions[base] || c.motions[base.replace(/_(start|loop)$/, '')] || null) : null;
    const idle = acts ? acts.includes('0:0x02') : null;
    const other = acts ? acts.filter(a => a !== '0:0x02') : null;
    console.log([mon, key, HA[mon] ? 'hyper' : '-', acts ? (idle ? 'TIRED-IDLE' : 'NO-(0,2)') : 'no census', acts ? acts.join(' ') : '', other && other.length ? 'others: ' + other.join(' ') : ''].join('\t'));
  }
}
console.log('# rows', n, 'monsters', mons.size);

import { BEAM_SPAWNS } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-spawns.js';
import { BEAM_MODES } from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/beam-types.js';
import fs from 'fs';
const M = JSON.parse(fs.readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/monsters.json', 'utf8'));
const arr = M.monsters || M;
let bad = 0;
for (const [mon, rows] of Object.entries(BEAM_SPAWNS)) {
  const e = arr.find(x => x.id === mon);
  if (!e) { console.log(mon, 'NOT IN monsters.json'); bad++; continue; }
  const lists = Object.values(e.lists);
  for (const r of rows) {
    const L = lists.find(l => l.id === r.list);
    const t = BEAM_MODES.find(x => x.id === r.type);
    const probs = [];
    if (!t) probs.push('no BEAM_MODES ' + r.type);
    if (!L) probs.push('no list ' + r.list);
    let total = null;
    if (L) for (const c of [r.clip, ...(r.partners || [])]) {
      const parts = L.clips.filter(k => k.clip === c || k.clip === c + '_start' || k.clip === c + '_loop');
      if (!parts.length) { probs.push('no clip ' + c); continue; }
      const n = Math.round(parts.reduce((s, k) => s + k.dur * 60, 0));
      if (c === r.clip) total = n + ' f (' + parts.map(k => k.clip.replace(/^Motion\[\d+\]/, '') || 'whole').join('+') + ')';
      if (!r.atStart && r.frame >= n) probs.push(c + ' has ' + n + ' f, spawn at ' + r.frame);
    }
    if (probs.length) bad++;
    console.log((probs.length ? 'BAD ' : 'ok  ') + mon, 'L' + r.list, r.clip, r.atStart ? 'start' : 'f' + r.frame, r.type, r.variant, JSON.stringify(r.when || {}), total || '', probs.join('; '));
  }
}
console.log('bad rows:', bad);

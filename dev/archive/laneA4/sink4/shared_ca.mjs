// laneA4/sink4/shared_ca.mjs (lane A4, 2026-10-26): for every SINK4 row, does psl-mask.js CLIP_ACTIONS give the clip a sink action
// (so a play of it sinks), and which non-shared rows exist. node shared_ca.mjs
import { pathToFileURL } from 'node:url';
const D = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/';
const MS = await import(pathToFileURL(D + 'motion-states.js'));
const PM = await import(pathToFileURL(D + 'psl-mask.js'));
const CA = PM.CLIP_ACTIONS || {};
let n = 0, ns = 0, reach = 0;
for (const [id, rows] of Object.entries(MS.SINK4)){
  const line = [];
  for (const [clip, r] of Object.entries(rows)){
    n++;
    const ca = (CA[id] || {})[clip] || [];
    const acts = ca.map(x => x.action ? x.action[0] + ',' + x.action[1] : null).filter(Boolean);
    const hit = acts.filter(a => r.acts.includes(a));
    if (!r.shared){ ns++; line.push(clip + ' (any play)'); }
    else if (hit.length){ reach++; line.push(clip + ' (CLIP_ACTIONS ' + hit.join(' ') + ')'); }
    else line.push(clip + ' [shared, no sink action in CLIP_ACTIONS' + (acts.length ? ': has ' + acts.join(' ') : '') + ']');
  }
  console.log(id, '|', line.join('; '));
}
console.log('rows', n, 'any-play', ns, 'shared+CLIP_ACTIONS', reach);

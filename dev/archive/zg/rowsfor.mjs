// MOTION_STATES rows + CLIP_ACTIONS + CLIP_VARIANTS for one clip, and the actions the tracer finds playing it
import fs from 'node:fs';
const R = 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/';
const { MOTION_STATES, CLIP_VARIANTS } = await import(R + 'motion-states.js');
const { CLIP_ACTIONS } = await import(R + 'psl-mask.js');
const [mon, key] = process.argv.slice(2);
const ms = MOTION_STATES[mon] || {};
for (const k of Object.keys(ms)) if (k === key || k.startsWith(key + '#')) console.log('ROW', k, JSON.stringify(ms[k]));
console.log('CA', JSON.stringify((CLIP_ACTIONS[mon] || {})[key]));
console.log('CV', JSON.stringify((CLIP_VARIANTS[mon] || {})[key]));
const m = /^(\d+)\|Motion\[(\d+)\]/.exec(key), clip = 'L' + m[1] + ' M' + m[2];
const f = 'sweep/r3_' + mon + '.jsonl';
if (fs.existsSync(f)) console.log('PLAYED BY', fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(JSON.parse)
  .filter(j => j.mot.includes(clip) || j.scr.includes(clip)).map(j => '(' + j.a[0] + ', 0x' + j.a[1].toString(16) + ')').join(' '));

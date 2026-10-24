// CLIP_ACTIONS / copies vs the fully hooked tracer (sweep/r3_<mon>.jsonl from sweep2.py).
//   node cmpactions.mjs [mon ...]
// FORWARD: every CLIP_ACTIONS entry's action must play its clip (a setMotion of it, its status script naming it, or an
//   op-0xfe follow action that does). BACKWARD (info): the actions the tracer finds playing each clip that has a CLIP_ACTIONS
//   key or a MOTION_STATES row, which CLIP_ACTIONS does not list.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const R = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/';
const { CLIP_ACTIONS } = await import(pathToFileURL(R + 'psl-mask.js').href);
const { MOTION_STATES } = await import(pathToFileURL(R + 'motion-states.js').href);
const HERE = 'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/zg/';
const mons = process.argv.slice(2);
const hex = a => '(' + a[0] + ', 0x' + a[1].toString(16) + ')';
for (const mon of mons){
  const f = HERE + 'sweep/r3_' + mon + '.jsonl';
  if (!fs.existsSync(f)){ console.log('==', mon, 'no sweep'); continue; }
  const rows = new Map();
  for (const l of fs.readFileSync(f, 'utf8').split('\n')) if (l.trim()){ const j = JSON.parse(l); rows.set(j.a.join(','), j); }
  const plays = (a, seen = new Set()) => {
    const k = a.join(','); if (seen.has(k)) return new Set(); seen.add(k);
    const j = rows.get(k); if (!j) return new Set();
    const s = new Set([...j.mot, ...j.scr]);
    for (const fo of j.follow) for (const x of plays(fo, seen)) s.add(x);
    return s;
  };
  const direct = a => { const j = rows.get(a.join(',')); return j ? new Set([...j.mot, ...j.scr]) : new Set(); };
  const byClip = new Map();
  for (const [k, j] of rows) for (const m of new Set([...j.mot, ...j.scr])){ if (!byClip.has(m)) byClip.set(m, []); byClip.get(m).push(j.a); }
  const ca = CLIP_ACTIONS[mon] || {};
  const ms = MOTION_STATES[mon] || {};
  const bad = [], info = [];
  const clipOf = key => { const m = /^(\d+)\|Motion\[(\d+)\]/.exec(key); return m ? 'L' + m[1] + ' M' + m[2] : null; };
  for (const [key, list] of Object.entries(ca)){
    const clip = clipOf(key); if (!clip) continue;
    for (const e of (Array.isArray(list) ? list : [list])){
      if (!e || !Array.isArray(e.action)) continue;
      const p = plays(e.action);
      if (!rows.has(e.action.join(','))) bad.push(key + ' ' + hex(e.action) + ': the tracer finds no motion for this action');
      else if (!p.has(clip)) bad.push(key + ' ' + hex(e.action) + ' plays ' + [...p].join(' ') + ', not ' + clip);
      else if (!direct(e.action).has(clip)) info.push(key + ' ' + hex(e.action) + ' reaches ' + clip + ' only through a follow');
    }
  }
  const keyed = new Set([...Object.keys(ca), ...Object.keys(ms)].map(k => k.replace(/#.*$/, '')));
  for (const key of keyed){
    const clip = clipOf(key); if (!clip) continue;
    const listed = new Set((Array.isArray(ca[key]) ? ca[key] : ca[key] ? [ca[key]] : []).filter(e => e && Array.isArray(e.action)).map(e => e.action.join(',')));
    const found = (byClip.get(clip) || []).filter(a => !listed.has(a.join(',')));
    if (ca[key] && found.length) info.push(key + ' also played by ' + found.map(hex).join(' '));
    if (!ca[key] && ms[key] && (byClip.get(clip) || []).length > 1) info.push(key + ' (row, no CLIP_ACTIONS) played by ' + byClip.get(clip).map(hex).join(' '));
  }
  console.log('==', mon, Object.keys(ca).length, 'CLIP_ACTIONS keys;', bad.length, 'mismatches');
  for (const b of bad) console.log('  MISMATCH', b);
  if (process.env.INFO) for (const b of info) console.log('  info', b);
}

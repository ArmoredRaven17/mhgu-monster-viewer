// psltest.mjs <id> <pel|key> ... (effects coverage census, 2026-10-24): for a clip-bound record that never started, every CLIP_EFFECTS
// binding (clip, bit) and whether the viewer's PSL enable word (render/psl-mask.js pslMask, the ROM's vt+0x13c transcription) can set
// that bit at all -- over every action (status 0..13 x number 0..255, and none) and a sampled set of the states the class functions
// read. Prints, per binding, an (action, state) that enables it, or 'never' (the ROM's word never enables it under any input).
//   node psltest.mjs em001_02 em001_02u|522
import { pathToFileURL } from 'url';
const DOCS = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/';
// monster.js pulls three.js: read CLIP_EFFECTS from its text
import fs from 'fs';
const src = fs.readFileSync(DOCS + 'monster.js', 'utf8');
const s0 = src.indexOf('export const CLIP_EFFECTS = {');
let depth = 0, i = src.indexOf('{', s0), j = i;
for (; j < src.length; j++){ const c = src[j]; if (c === '{') depth++; else if (c === '}'){ depth--; if (!depth) break; } }
const CLIP_EFFECTS = Function('return ' + src.slice(i, j + 1))();
const PM = await import(pathToFileURL(DOCS + 'psl-mask.js').href);
const [mon, ...want] = process.argv.slice(2);
const exp = JSON.parse(fs.readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/effects/' + mon + '.json', 'utf8'));
const KEYS = { sunk: [0, 1], severed: [0, 1], rank: [0, 1, 3, 5], tired: [0, 1], posture: [0, 1, 2, 3, 4], backBroken: [0, 1], phase: [0, 1, 2, 3, 4],
  charged: [0, 1], breakLevel7: [0, 1, 2, 3], b5f8: [0, 1, 2], windAura: [0, 1, 2], questLevel: [0, 3, 5, 10], item: [0, 1, 2, 3], heat: [0, 1, 2, 3],
  gas: [0, 1, 2, 3], fireAura: [0, 1, 2], fangsBroken: [0, 1], fangThreshold: [0, 1, 2], fangLevel: [0, 1, 2, 3], diedCharged: [0, 1], crestBroken: [0, 1],
  charge: [0, 1, 2, 3, 4], carry: [0, 1, 2, 4], boulder: [0, 1], aura5e08: [0, 1, 2, 3], asleep: [0, 1], armEmpty: [0, 1], tusksBroken: [0, 1],
  soulFlame: [0, 1], snowMap: [0, 1], skullForm: [0, 1], shellType: [0, 1, 2], shellBroken2: [0, 1], seltasLink: [0, 1], rage: [0, 1],
  part2Broken: [0, 1], part: [0, 1, 2, 3, 4], mud: [0, 1, 2], motionIs19: [0, 1], floorFlag8: [0, 1], depth: [0, 1, 2], claw6Off: [0, 1],
  claw5Off: [0, 1], claw5Broken: [0, 1], cad0: [0, 1], bellyBroken: [0, 1], beardOff: [0, 1], armForm: [0, 1, 2] };
let seed = 7; const rnd = n => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
const states = [{}];
for (let k = 0; k < 400; k++){ const s = {}; for (const [key, vals] of Object.entries(KEYS)) s[key] = vals[rnd(vals.length)]; states.push(s); }
for (const [key] of Object.entries(KEYS)) for (const v of KEYS[key]){ states.push({ [key]: v }); }
const actions = [null]; for (let st = 0; st < 14; st++) for (let n = 0; n < 256; n++) actions.push([st, n]);
for (const w of want){
  const [pel, key] = w.split('|');
  const rec = exp.effects.find(e => e.record && e.record.pel === pel && String(e.record.key) === key);
  const efl = rec ? rec.efl.replace(/^files\//, '') : null;
  const binds = [];
  for (const id of [mon]) for (const [ck, v] of Object.entries(CLIP_EFFECTS[id] || {})) for (const b of v.bits || [])
    if (String(b.key) === key && (!efl || b.efl === efl)) binds.push({ ck, bit: b.bit, on: b.on });
  if (!binds.length){ console.log(w, efl, 'NO CLIP_EFFECTS binding'); continue; }
  for (const b of binds){
    const m = /^L(\S+) Motion\[(\d+)\]$/.exec(b.ck);
    if (!m){ console.log(w, b.ck, 'unparsed clip'); continue; }
    let hit = null, tried = 0;
    for (const a of actions){
      for (const s of states){
        tried++;
        const word = PM.pslMask(mon, m[1], +m[2], a, s);
        if (word == null){ hit = 'no class mask (the base word only)'; break; }
        if ((word >>> b.bit) & 1){ hit = { action: a, state: Object.fromEntries(Object.entries(s).filter(([, v]) => v)) }; break; }
      }
      if (hit) break;
    }
    console.log(w, b.ck, 'bit', b.bit, 'on', JSON.stringify(b.on), '->', hit ? JSON.stringify(hit).slice(0, 300) : 'NEVER (' + tried + ' tries)');
  }
}

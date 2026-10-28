// laneB2/levelaudit.mjs (lane B2, 2026-10-26): every levels ladder the viewer evaluates with motion-states.js userLevel, old rule vs new.
// A rung k is REACHABLE when the parts the ROM shows at that rung -- rung 0's sets, then each rung's sets up to k laid over them
// (the part pass applies the rung's sets over the monster's state) -- read back as level k. Old rule: a rung's own part must be
// `false` at the rung below; new rule: not `true` there (absent = not drawn by that rung).
//   node levelaudit.mjs   (from anywhere; reads docs/monsters.json and docs/render/motion-states.js)
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const D = 'C:/MHGU-Extract/MHGU-Monster-Viewer/docs';
globalThis.window = globalThis.window || {}; globalThis.document = globalThis.document || { getElementById: () => null };
const MS = await import(pathToFileURL(D + '/render/motion-states.js').href);
const MON = JSON.parse(fs.readFileSync(D + '/monsters.json', 'utf8'));
const mons = Array.isArray(MON) ? MON : MON.monsters;
function level(levels, table, drawn, rule){
  const at = levels.map(sets => { const m = new Map(); for (const s of sets) for (const [p, v] of table[s] || []) m.set(p, v); return m; });
  let lv = 0;
  for (let k = 1; k < at.length; k++){
    const own = [...at[k]].filter(([p, v]) => v && (rule === 'old' ? at[k - 1].get(p) === false : at[k - 1].get(p) !== true)).map(([p]) => p);
    if (own.some(p => drawn.get(p) === true)) lv = k;
  }
  return lv;
}
function shown(levels, table, k){
  const d = new Map();
  for (const sets of [levels[0], levels[k]]) for (const s of sets) for (const [p, v] of table[s] || []) d.set(p, !!v);
  return d;
}
const ladders = [];   // [monId, where, levels]
const walk = (monId, where, spec) => {
  if (!spec || typeof spec !== 'object') return;
  const add = (w, L) => { if (Array.isArray(L) && L.length && L.every(Array.isArray)) ladders.push([monId, w, L]); };
  if (spec.levels){ if (Array.isArray(spec.levels)) add(where, spec.levels); else { add(where + ' calm', spec.levels.calm); add(where + ' enraged', spec.levels.enraged); } }
  if (spec.cycle) spec.cycle.forEach((c, i) => walk(monId, where + ' cycle[' + i + ']', c));
  if (spec.tables) spec.tables.forEach((t, i) => add(where + ' tables[' + i + '].calm', t.calm));
};
for (const [monId, rows] of Object.entries(MS.MOTION_STATES || {})) for (const [clip, spec] of Object.entries(rows || {})) walk(monId, clip, spec);
// the inline ladders of motion-states.js's input helpers (the userLevel call sites, read off the file)
const INLINE = [['em037_00|em037_04 hornBroken', [[4], [5], [6]]], ['em082_00 headBroken', [[4], [5], [5], [6]]], ['em082_04 headBroken', [[5], [5], [6]]],
                ['em066_00 / em066_04 tusks', [[3], [4], [5]]], ['em070_00 part', [[9, 12], [10, 12], [11, 13]]]];
const inlineMon = { 'em037_00|em037_04 hornBroken': ['em037_00', 'em037_04'], 'em082_00 headBroken': ['em082_00'], 'em082_04 headBroken': ['em082_04'],
                    'em066_00 / em066_04 tusks': ['em066_00', 'em066_04'], 'em070_00 part': ['em070_00'] };
for (const [w, L] of INLINE) for (const m of inlineMon[w]) ladders.push([m, 'inline ' + w, L]);
let changed = 0, rows = 0;
const out = [];
for (const [monId, where, L] of ladders){
  const m = mons.find(x => x.id === monId); if (!m || !m.groups) continue;
  const table = m.groups;
  const r = { old: [], new: [] };
  for (let k = 0; k < L.length; k++){ const d = shown(L, table, k); if (level(L, table, d, 'old') === k) r.old.push(k); if (level(L, table, d, 'new') === k) r.new.push(k); }
  rows++;
  const diff = r.old.join() !== r.new.join();
  if (diff) changed++;
  out.push((diff ? 'CHANGED ' : '        ') + monId + ' ' + where + ' ' + JSON.stringify(L) + ' reachable old [' + r.old + '] new [' + r.new + ']');
}
console.log(out.join('\n'));
console.log('ladders', rows, 'changed', changed, '(named consts S_LEG_L / S_HEAD / NAKARKOS084 / SNOW083_* / ladder tables not exported are not listed)');

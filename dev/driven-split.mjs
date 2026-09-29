// EXPORTED / DRIVEN / UNDRIVEN, per monster, per layer.
//
// PM, 2026-09-29: "'wired' in your reports has meant 'exported to the json', and residue 0 has meant
// 'every record has a firing site IN THE ROM'. Both are true and neither says the viewer shows it."
// So this asks the third question: for every record the viewer LOADS, is there anything in the viewer
// that ever fires it?
//
//   exported   a record in docs/effects/<id>.json
//   driven     something in the viewer fires it -- its `when` layer (clip / shell / ragePuff), or, for
//              `event` records, a MOTION_STATES / RAGE_BY_LEVEL / RAGE_PUFF / CUT_TAIL entry or the
//              shared-state panel
//   undriven   exported, nothing fires it
//
// The driver tables are ENUMERATED by importing the viewer's own modules, never grepped: a table is the
// authority on what it contains, and a regex over it answers the question you typed instead.
//
// A record is identified by (pel, key). That is NOT unique in general -- em004_00c key 0 exists twice,
// a PSL record on joint 90 (cm202_001) and a shell-carried one on joint -1 (cm200_040) -- so a pair that
// matches several exported records marks ALL of them driven and the collision is reported, rather than
// silently crediting one record with another's driver.
//
//   node dev/driven-split.mjs [emNNN_NN ...]        one or more monsters, or all of them
//   node dev/driven-split.mjs --undriven            only the undriven, named
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(HERE, '..', 'docs');
const EFFECTS = path.join(DOCS, 'effects');

const { MOTION_STATES, RAGE_BY_LEVEL, RAGE_PUFF } = await import(pathToFileURL(path.join(DOCS, 'render/motion-states.js')).href);
const { SHELL_DATA } = await import(pathToFileURL(path.join(DOCS, 'render/shells.js')).href);
const { CUT_TAIL } = await import(pathToFileURL(path.join(DOCS, 'render/tail-option.js')).href);
const SS = await import(pathToFileURL(path.join(DOCS, 'render/rom/effect/shared-states.js')).href);

// The shared-state panel's own bands, from shared-states.js rather than from a list written here.
const BLAST = new Set(Array.from({ length: SS.BLAST_PARTS }, (_, i) => SS.BLAST_PART_BASE + i));
const HYPER = new Set([SS.HYPER_GROUP0, ...SS.HYPER_GROUP1, ...SS.HYPER_BURSTS]);
// THE PANEL IS WHAT THE UI ACTUALLY OFFERS, not what SHARED_STATES contains. index.html's
// SHARED_TOGGLES is the only thing that calls setSharedState, and it lists c1100 and c1108 alone.
// Two traps this avoids, both found by checking instead of assuming:
//   * collecting every number in SHARED_STATES sweeps up `period: 90` / `frames: 3600` and would credit
//     any record keyed 90 or 36 with a driver it has not got;
//   * SHARED_STATES also holds c1200 / c1201, and the runtime has `combat(from, to)` and `blast(part)`
//     for them and for the blast band -- but NOTHING CALLS EITHER. `blastPart` has no caller anywhere in
//     the tree and `combat` only its own wrapper in live.js, so those records are runtime-ready and
//     still undriven. They are reported as 'runtime, no control', which is a different and much cheaper
//     gap than one needing a new driver.
const IDX = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
const togglesSrc = (IDX.match(/const SHARED_TOGGLES = \{([^}]*)\}/) || [, ''])[1];
const PANEL = new Set([...togglesSrc.matchAll(/'c(\d+)'/g)].map(m => +m[1]));
// runtime support exists but no caller invokes it
const RUNTIME_ONLY = new Set([...BLAST, ...Object.values(SS.SHARED_STATES || {})
  .filter(v => v && v.once).map(v => v.key)]);

// Deep-walk any structure for the viewer's universal record pair: ['<pel>', <key>].
function walkPairs(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    if (node.length === 2 && typeof node[0] === 'string' && typeof node[1] === 'number'
        && /^(em|cm)\w+$/.test(node[0])) out.push(node[0] + '|' + node[1]);
    for (const v of node) walkPairs(v, out);
    return out;
  }
  for (const v of Object.values(node)) walkPairs(v, out);
  return out;
}

const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const undrivenOnly = process.argv.includes('--undriven');
const ids = (only.length ? only : fs.readdirSync(EFFECTS).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)))
  .filter(id => /^em\d{3}_\d{2}$/.test(id)).sort();

const totals = { exported: 0, driven: 0, undriven: 0, hyper: 0 };
for (const id of ids) {
  const p = path.join(EFFECTS, id + '.json');
  if (!fs.existsSync(p)) { console.log(`${id}  NO EXPORT`); continue; }
  const def = JSON.parse(fs.readFileSync(p, 'utf8'));
  const recs = def.effects || [];

  // every (pel,key) any viewer table names for this monster
  const named = new Set([
    ...walkPairs(MOTION_STATES[id]),
    ...walkPairs(RAGE_BY_LEVEL[id]),
    ...walkPairs(RAGE_PUFF[id]),
    ...walkPairs(CUT_TAIL && CUT_TAIL[id]),
    ...walkPairs(SHELL_DATA[id]),
  ]);

  const byWhen = {};
  const undriven = [];
  let hyperCount = 0, driven = 0;
  const seen = new Map();
  for (const r of recs) {
    const { pel, key } = r.record;
    seen.set(pel + '|' + key, (seen.get(pel + '|' + key) || 0) + 1);
    byWhen[r.when] = (byWhen[r.when] || 0) + 1;
    let how = null;
    if (r.when === 'clip') how = 'clip';
    else if (r.when === 'shell') how = 'shell';
    else if (r.when === 'ragePuff') how = 'ragePuff';
    else if (named.has(pel + '|' + key)) how = 'state';
    else if (PANEL.has(key)) how = 'panel';
    if (how) driven++;
    else {
      if (HYPER.has(key)) hyperCount++;
      undriven.push({ pel, key, efl: (r.efl || '').split('/').pop(),
                      why: HYPER.has(key) ? 'hyper' : RUNTIME_ONLY.has(key) ? 'runtime, no control' : '' });
    }
  }
  const dupes = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
  totals.exported += recs.length; totals.driven += driven;
  totals.undriven += undriven.length; totals.hyper += hyperCount;

  const layers = Object.entries(byWhen).map(([k, v]) => `${k} ${v}`).join(', ');
  console.log(`\n=== ${id}   exported ${recs.length}  driven ${driven}  undriven ${undriven.length}`
              + (hyperCount ? ` (of which hyper ${hyperCount}, deliberately never fired)` : ''));
  console.log(`    layers: ${layers}`);
  if (dupes.length) console.log(`    DUPLICATE (pel,key): ${dupes.join(', ')}`);
  if (undriven.length) {
    const byEfl = {};
    for (const u of undriven) (byEfl[u.pel] ||= []).push(u.key + (u.why ? '(' + u.why + ')' : ''));
    for (const [pel, keys] of Object.entries(byEfl))
      console.log(`    undriven ${pel}: ${keys.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}`);
  }
}
console.log(`\n==== ${ids.length} monsters: exported ${totals.exported}, driven ${totals.driven}, `
            + `undriven ${totals.undriven} (hyper ${totals.hyper})`);

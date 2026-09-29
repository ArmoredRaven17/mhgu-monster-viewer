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
// monster.js imports three.js, which does not resolve outside the browser, so CLIP_EFFECTS is sliced
// out of its source and evaluated on its own. Brace-matched rather than regexed: the table is tens of
// thousands of characters and a non-greedy match would stop at the first nested close.
const CLIP_EFFECTS = (() => {
  const src = fs.readFileSync(path.join(DOCS, 'render/monster.js'), 'utf8');
  const at = src.indexOf('export const CLIP_EFFECTS = {');
  if (at < 0) throw new Error('CLIP_EFFECTS not found in monster.js');
  const open = src.indexOf('{', at);
  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error('CLIP_EFFECTS braces unbalanced');
  return Function('return ' + src.slice(open, end + 1))();
})();
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

// ---- REACHABILITY -------------------------------------------------------------------------------
// The layer rule below ("every `when` except 'event' is driven by its own layer") was too generous
// twice over, and both were found the same way: a record is named by a table, and is still never
// fired. Two tests replace the trust.
//
// SHELLS. A `shell` record is driven only if BOTH hold:
//   (a) THE MODE IS REACHABLE -- some ACTION names that (shell, mode). Not merely that the mode is
//       transcribed in the entry's `shells` block: em001_00 transcribes shell01 modes 13, 14, 15 and
//       20, and no action names any of them, so c 30 and c 31 are loaded and never fire (Render).
//       Modes reached indirectly count: an action's `modes`, and each `spawns[]` entry's `modes`
//       (the 'seq' form, where one action spawns several modes at several frames).
//   (b) THE EF PARAMETER IS SELECTABLE. Param 0 is the flight, always started. Params 1/2/3 are the
//       landing chosen by hit type -- `landing()` does `[1,2,3][hit.type]` and `hitType()` returns
//       ONLY 0 or 1, so PARAM 3 IS NEVER SELECTED. (Type 2 is a hit on a hunter; the viewer has no
//       hunters. That is the viewer's limitation, not the ROM's, and it is why em001_00 u 36 never
//       fires.) Params 4/5 are the bounces, reachable only where the shell bounces at all.
// The spawner must also have a branch in stepShells: Basarios showed an entry can name a spawner
// address the runtime has no case for, in which case nothing spawns however good the data is.
const SPAWNER_SRC = fs.readFileSync(path.join(DOCS, 'render/shells.js'), 'utf8');
const SPAWNERS = new Set([...SPAWNER_SRC.matchAll(/a\.spawner === (0x[0-9a-f]+)/g)].map(m => parseInt(m[1], 16)));

function shellReach(D) {
  const modes = new Set(), spawners = new Set();
  for (const a of D.actions || []) {
    const add = (shell, list) => { for (const mo of list || []) modes.add((shell || a.shell) + ':' + mo); };
    add(a.shell, a.modes);
    for (const sp of a.spawns || []) add(sp.shell, sp.modes);
    if (a.spawner != null) spawners.add(a.spawner);
  }
  return { modes, spawners };
}
// Where a (pel,key) is named in the shells block, and whether any of those places can fire it.
function shellDriven(D, pel, key, mon) {
  if (!D) return { ok: false, why: 'no SHELL_DATA entry' };
  const { modes, spawners } = shellReach(D);
  // THE DEFAULT LIST MAP. Most entries carry `lists`, but several (em037_00, em003_00) omit it and rely
  // on the default {0: u, 1: c}. Resolving to null there matched nothing and reported four of
  // Nargacuga's spike records as "named by no shell mode" -- a matching bug wearing a finding's clothes.
  const listPel = id => (D.lists && D.lists[id] && D.lists[id].pel)
                     || (id === 0 ? mon + 'u' : id === 1 ? mon + 'c' : null);
  const seen = [];
  for (const [name, sh] of Object.entries(D.shells || {})) {
    for (const [mode, def] of Object.entries(sh.modes || {})) {
      (def.ef || []).forEach((e, i) => {
        if (!Array.isArray(e) || listPel(e[0]) !== pel || e[1] !== key) return;
        const reachable = modes.has(name + ':' + mode);
        const selectable = i === 0 || i === 1 || i === 2 || i >= 4;   // param 3 is never selected
        seen.push({ name, mode, i, reachable, selectable });
      });
    }
  }
  if (!seen.length) return { ok: false, why: 'named by no shell mode' };
  // MODE REACHABILITY IS NOT STATICALLY DECIDABLE, and claiming it was cost a wrong re-report.
  // `ctx.create` (shells.js, "the shells its shells make", 0x48b884) spawns a SECOND GENERATION whose
  // mode is computed at runtime, so a record can fire on a mode no action row names: Render watched
  // one shell00 mode-8 action on em001_00 L4 Motion[16] produce u 31 / u 32 / u 33 / u 34, which live
  // on shell01 modes 6 / 7 / 8 / 9. An enumeration over action modes cannot see that generation and
  // produced seven false negatives on Rathian alone.
  // So `reachable` is reported as a NOTE and never decides. Only the ef-parameter test decides, because
  // that one IS sound statically: `landing()` does [1,2,3][hit.type] and `hitType()` returns only 0 or 1.
  if (seen.some(s => s.selectable)) {
    const unreached = seen.filter(s => !s.reachable).map(s => s.name + ' mode ' + s.mode);
    return { ok: true, note: unreached.length && unreached.length === seen.length
      ? 'no action row names ' + unreached.join(', ') + ' (may be a second-generation spawn)' : '' };
  }
  const at = seen.map(s => 'ef param ' + s.i).join(', ');
  return { ok: false, why: at + ' never selected (hit type 2 = a hit on a hunter; none in the viewer)' };
}

// CLIPS. A `clip` record is driven only if the clip it is bound to exists in monsters.json for that
// list. CLIP_EFFECTS is generated from the PSL and a clip can be named there that the viewer's own
// glb does not carry, in which case nothing ever plays it.
const MONS = JSON.parse(fs.readFileSync(path.join(DOCS, 'monsters.json'), 'utf8')).monsters;
function clipsOf(id) {
  const e = MONS.find(x => x.id === id);
  const out = new Set();
  for (const L of (e && e.lists) || []) for (const c of L.clips || []) out.add(L.id + '|' + c.clip);
  return out;
}
function clipDriven(id, ceEntry, have) {
  // No CLIP_EFFECTS bit found for this (efl, key) is NOT proof that nothing fires it -- a family member's
  // table can name it, and the match is on the efl basename. Reported as a note, never counted undriven.
  if (!ceEntry) return { ok: true, note: 'no CLIP_EFFECTS binding found (not checked further)' };
  const mm = /^L(\d+) (.+)$/.exec(ceEntry);
  if (!mm) return { ok: true };                       // an unrecognised key shape: do not invent a failure
  const [, list, clip] = mm;
  const base = clip.replace(/_(start|loop)$/, '');
  if (have.has(list + '|' + clip) || have.has(list + '|' + base)
      || have.has(list + '|' + base + '_start')) return { ok: true };
  return { ok: false, why: 'clip ' + ceEntry + ' is not in monsters.json' };
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

  // (pel, key) is not a record's identity -- 45 groups tree-wide share one. It only MISLEADS where two
  // records both fall to the pair match, i.e. two `event` records with the same pair: a driver naming it
  // fires one of them and would credit both. Measured: no such group exists today (the 45 are 34
  // clip+shell, 6 clip+event, 3 clip+rage, 2 clip+rageStart, and the non-event half of each is credited
  // by its own layer, never by the pair). Flagged rather than trusted, so it is caught if one appears.
  const eventPairs = {};
  for (const r of recs) if (r.when === 'event') {
    const k = r.record.pel + '|' + r.record.key;
    eventPairs[k] = (eventPairs[k] || 0) + 1;
  }
  const eventDupes = new Set(Object.keys(eventPairs).filter(k => eventPairs[k] > 1));

  // the CLIP_EFFECTS key that names each clip record, by (efl basename, key)
  const ce = CLIP_EFFECTS[id] || {};
  const clipOwner = {};
  for (const [clipKey, spec] of Object.entries(ce))
    for (const b of (spec && spec.bits) || [])
      clipOwner[(b.efl || '').replace(/\.efl$/, '') + '|' + b.key] = clipKey;
  const clipKeyOf = r => clipOwner[(r.efl || '').split('/').pop().replace(/\.efl$/, '') + '|' + r.record.key];
  const haveClips = clipsOf(id);

  const byWhen = {};
  const undriven = [];
  let hyperCount = 0, driven = 0;
  const seen = new Map();
  for (const r of recs) {
    const { pel, key } = r.record;
    seen.set(pel + '|' + key, (seen.get(pel + '|' + key) || 0) + 1);
    byWhen[r.when] = (byWhen[r.when] || 0) + 1;
    // EVERY `when` EXCEPT 'event' IS DRIVEN BY ITS OWN LAYER. The export writes a record's `when` from
    // whatever names it, so a clip / shell / ragePuff / rage / rageStart / calm record is there because
    // that layer named it. 'event' is the broad one -- it holds both records a viewer state table names
    // AND shared-band records exported because the ROM's shared code fires them with nothing in the
    // viewer behind it -- so it, and only it, has to be matched against the driver tables.
    // (An earlier version listed four layers by hand and let `rage`, `rageStart` and `calm` fall through
    // to the state check, which called 16 driven records undriven.)
    let how = null, why = '';
    if (r.when === 'shell') {
      const v = shellDriven(SHELL_DATA[id], pel, key, id);
      if (v.ok) how = 'shell'; else why = v.why;
    } else if (r.when === 'clip') {
      const v = clipDriven(id, clipKeyOf(r), haveClips);
      if (v.ok) how = 'clip'; else why = v.why;
    } else if (r.when !== 'event') how = r.when;
    else if (named.has(pel + '|' + key)) how = eventDupes.has(pel + '|' + key) ? 'state(AMBIGUOUS)' : 'state';
    else if (PANEL.has(key)) how = 'panel';
    if (how) driven++;
    else {
      if (HYPER.has(key)) hyperCount++;
      undriven.push({ pel, key, efl: (r.efl || '').split('/').pop(),
                      why: why || (HYPER.has(key) ? 'hyper'
                                 : RUNTIME_ONLY.has(key) ? 'runtime, no control' : '') });
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

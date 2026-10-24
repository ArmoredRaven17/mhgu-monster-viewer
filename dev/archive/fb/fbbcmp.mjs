// fbbcmp.mjs (2026-10-19): the Flying / Brute / Bird cengen11 re-run (cen11r_<mon>_v<var>_?.txt) against the viewer's SHELL_DATA rows --
// every (action, id, mode) the census creates that no row of that monster names (a row: a.shell + a.mode / a.modes, each spawn's shell +
// mode / modes / modesG). What a row cannot show (beam-spawns.js beams, the per-frame makers, dust) comes out as a CANDIDATE to triage, not
// as a miss. Usage: node fbbcmp.mjs [mon..]
import { readFileSync, existsSync, readdirSync } from 'fs';
const V = 'C:/MHGU-Extract/MHGU-Monster-Viewer/';
const D = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const S = await import('file:///' + V + 'docs/render/shells.js');
const BS = await import('file:///' + V + 'docs/render/beam-spawns.js');
const list = readFileSync(D + '../neset/fbb_list.txt', 'utf8').split('\n').filter(l => l.startsWith('em')).map(l => l.split(' ')[0]);
const only = process.argv.slice(2);
const KEY = /'(0x[0-9a-f]+) m(\d+) f([^ ]+) (0x[0-9a-f]+)': \[([^\]]*)\]/g;
const MJ0 = JSON.parse(readFileSync(V + 'docs/monsters.json', 'utf8'));
const MJ = Array.isArray(MJ0) ? MJ0 : (Array.isArray(MJ0.monsters) ? MJ0.monsters : Object.values(MJ0.monsters || MJ0));
const EMC = JSON.parse(readFileSync(D + 'emcreach.json', 'utf8'));  // the actions his table can issue for his variant (emcreach.py: op 0x92 evaluated): the filter
// the shell table (id -> class) and each monster's .shl modes (shl.py -> shl_<mon>.txt): what a create's mode would start
const SHT = Object.fromEntries(JSON.parse(readFileSync('C:/MHGU-Extract/efx/agents/narga-shell-scratch/shelltable.json', 'utf8')).map(r => [r.id, r.cls.name || '']));
function shlModes(mon){
  const p = D + 'shl_' + mon + '.txt', out = {};
  if (!existsSync(p)) return null;
  let nn = null;
  for (const l of readFileSync(p, 'utf8').split(/\r?\n/)){
    const h = l.match(/^== \S+ shell\\em\\\S+_shell(\w+)\\/); if (h){ nn = h[1]; out[nn] = out[nn] || {}; continue; }
    const m = l.match(/^\s+mode (\d+) (\{.*\})\s*$/); if (!m || nn == null) continue;
    try { const d = JSON.parse(m[2]); out[nn][+m[1]] = (d.ef || []).flatMap(e => e.arr || []).filter(([li, k]) => li <= 7 && k >= 0 && k < 0x80000000); } catch (e) {}
  }
  return out;
}
const hex2 = n => '0x' + n.toString(16).padStart(2, '0');
for (const mon of (only.length ? only : list)){
  const v = parseInt(mon.slice(6, 8), 10);
  const files = readdirSync(D).filter(f => f.startsWith('cen11r_' + mon + '_v' + v + '_') && f.endsWith('.txt'));
  if (!files.length){ console.log(mon, ': no re-run'); continue; }
  const census = new Map(), motsOf = {};
  for (const f of files) for (const l of readFileSync(D + f, 'utf8').split('\n')){
    const p = l.split(' '); if (p.length < 3) continue;
    const act = p[1], rest = l.slice(l.indexOf('{'));
    const mm = l.match(/^\S+ \S+ (\[.*?\]) /); if (mm) for (const x of (mm[1].match(/L\d+ M\d+/g) || [])) (motsOf[act] = motsOf[act] || new Set()).add(x);
    for (const m of rest.matchAll(KEY)){
      const k = act + ' ' + m[1] + ' m' + m[2];
      if (!census.has(k)) census.set(k, new Set());
      census.get(k).add('f' + m[3] + ' ' + m[4] + ' [' + m[5] + ']');
    }
  }
  const clips = new Set();
  // (2026-10-19) the monster's lists as monsters.json gives them: a variant's lists 0..3 are often its base's files (Grimclaw plays
  // em032_00_0..3.glb) -- reading only <mon>_N.glb filed every create on a shared list as "no clip of his"
  const ent = MJ.find(m => m && m.id === mon);
  for (const li of (ent ? ent.lists || [] : []).filter(li => /^\d+$/.test(String(li.id)))){
    const L = String(li.id), buf = readFileSync(V + 'docs/' + li.file), n = buf.readUInt32LE(12);
    const J = JSON.parse(buf.slice(20, 20 + n).toString('utf8'));
    for (const an of J.animations || []){ const m = String(an.name || '').match(/Motion\[(\d+)\]/); if (m) clips.add('L' + L + ' M' + m[1]); }
  }
  const hasClip = k => { const ms = motsOf[k.split(' ')[0]]; return !ms || !ms.size || [...ms].some(x => clips.has(x)); };
  const errs = files.map(f => f.replace('.txt', '.err')).filter(f => existsSync(D + f) && /Traceback|Error/.test(readFileSync(D + f, 'utf8')));
  const Dm = S.SHELL_DATA[mon];
  const ids = Dm ? Object.fromEntries(Object.entries(Dm.shells || {}).map(([k, s]) => [k, s.id])) : {};
  const rows = new Set();
  const anyId = new Set(), beamAct = new Set();   // (the census's id 0: the class reads its ids from enemy fields the tracer leaves 0 -- matched on action + mode)
  const add = (act, sh, modes) => { if (sh && ids[sh] != null) for (const md of modes){ rows.add(act + ' 0x' + ids[sh].toString(16) + ' m' + md); anyId.add(act + ' m' + md); } };
  const rowClips = {};          // the clips (list, clip + partners) each action's rows play, for the motion check
  for (const a of (Dm && Dm.actions) || []){
    if (!a.action) continue;
    const ms = x => [].concat(x.mode != null ? [x.mode] : [], x.modes || [], x.modesG || [], x.sev != null ? [x.sev] : [], x.broken != null ? [x.broken] : []);   // (sev / broken: a row's severed / part-broken mode, Seregios's)
    for (const ac of [a.action].concat(a.also || [])){          // an `also` action shares the row
      const act = ac[0] + ':' + hex2(ac[1]);
      add(act, a.shell, ms(a));
      for (const sp of a.spawns || []) add(act, (sp.kind === 'poison' || (sp.kind === 'ground' && !sp.shell)) ? 'shell01' : (sp.shell || a.shell), sp.kind === 'poison' ? [0x10, 0x17, 0x18] : ms(sp));   // (the Rath line's poison: poison001 picks shell01 16 / 23 / 24)
      const cs = rowClips[act] = rowClips[act] || new Set();
      for (const c of [a.clip].concat(a.partners || [])) if (c){ const m = String(c).match(/Motion\[(\d+)\]/); if (m) cs.add('L' + a.list + ' M' + m[1]); }
    }
  }
  // the beam rows (render/beam-spawns.js): a row fires its type's beam shell, mode = the type's number -- matched on action + mode
  for (const r of (BS.BEAM_SPAWNS[mon] || [])){
    if (!r.action || !r.type) continue;
    const md = +String(r.type).split(':')[1];
    for (const ac of [r.action].concat(r.also || [])){ const act = ac[0] + ':' + hex2(ac[1]); anyId.add(act + ' m' + md); beamAct.add(act + ' m' + md); }
  }
  const zero = k => k.split(' ')[1] === '0x0' || beamAct.has(k.split(' ')[0] + ' ' + k.split(' ')[2]);
  // the table's reach, closed over the class code's own changes (cengen11's CHG lines: 0x768c8 / 0x75230 / 0x76098 / vt+0x3d0 --
  // an action entered that way is issued by no table op, Bloodbath's (7, 0x62)); chg_<mon>_* files add a chain-only pass
  const edges = {};
  let chgSeen = false;
  for (const f of readdirSync(D).filter(f => (f.startsWith('cen11r_' + mon + '_v' + v + '_') || f.startsWith('chg_' + mon + '_')) && f.endsWith('.txt')))
    for (const l of readFileSync(D + f, 'utf8').split(/\r?\n/)){
      const m = l.match(/^CHG (\S+) \[(.*)\]$/); if (!m) continue;
      chgSeen = true;
      (edges[m[1]] = edges[m[1]] || []).push(...m[2].split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean));
    }
  const issued = EMC[mon] ? new Set(EMC[mon]) : null;
  if (issued){ const q = [...issued]; while (q.length){ const a = q.pop(); for (const b of edges[a] || []) if (!issued.has(b)){ issued.add(b); q.push(b); } } }
  if (!chgSeen) console.log('   (no CHG lines for', mon, '-- its reach is the table walk alone: a chained action can be missed)');
  const inEmc = k => !issued || issued.has(k.split(' ')[0]);
  const miss0 = [...census.keys()].filter(k => inEmc(k) && (zero(k) ? !anyId.has(k.split(' ')[0] + ' ' + k.split(' ')[2]) : !rows.has(k))).sort();
  // a mode no shell of his carries files for draws nothing (in the game too: shells-em001.md 2.1's "no em001_00 files"); the id's own
  // shell when the census names it, any shell of his when it logs 0
  const byId = Dm ? Object.fromEntries(Object.values(Dm.shells || {}).map(sh => [sh.id, sh])) : {};
  const hasFiles = k => { const [, id, m] = k.split(' '), md = +m.slice(1), n = parseInt(id, 16);
    if (n && byId[n]) return !!(byId[n].modes || {})[md];
    if (n) return true;                                    // a shell id his SHELL_DATA does not carry: kept (a candidate)
    return Object.values(byId).some(sh => (sh.modes || {})[md]); };
  const miss1 = miss0.filter(hasClip), noClip = miss0.length - miss1.length;
  const miss = Dm ? miss1.filter(hasFiles) : miss1, noFiles = miss1.length - miss.length;
  const offEmc = [...census.keys()].filter(k => !inEmc(k)).length;
  // a row whose action the census plays on a motion its clip / partners do not name: the row may fire on the wrong clip
  const clipWarn = [...new Set([...census.keys()].map(k => k.split(' ')[0]))].filter(act => rowClips[act] && motsOf[act] && motsOf[act].size &&
    ![...motsOf[act]].some(x => rowClips[act].has(x)) && [...motsOf[act]].some(x => clips.has(x)) &&
    // (the census's motions are phase 0's: only an action whose creates all come in phase 1 can be held to them)
    [...census.keys()].filter(k => k.split(' ')[0] === act).every(k => [...census.get(k)].every(v => /\['p1 /.test(v))));
  for (const act of clipWarn) console.log('    CHECK CLIP (phase-1 creates)', act, 'census plays', [...motsOf[act]].join(','), '| the row plays', [...rowClips[act]].join(','));
  const SH = shlModes(mon);
  const draws = k => { const [, id] = k.split(' '), md = +k.split(' ')[2].slice(1), n = parseInt(id, 16);
    if (!n || !SH) return '';
    const nm = SHT[n] || '', mm = nm.match(/_sp_(\w+)$/); if (!mm) return '(' + nm + ')';
    const blk = SH[mm[1]]; if (!blk) return '(' + nm + ': no .shl of his)';
    const ef = blk[md]; if (ef == null) return '(' + nm + ' mode ' + md + ': NO FILES)';
    return '(' + nm + ' ef ' + (ef.length ? ef.map(([li, k]) => li + ':' + k).join(' ') : 'none: starts nothing') + ')'; };
  const missD = miss.filter(k => !/starts nothing|NO FILES/.test(draws(k)));
  console.log('==', mon, 'census', census.size, '| rows', rows.size, '| not in a row (draws)', missD.length, '| (starts nothing)', miss.length - missD.length, '| outside his EMC', offEmc, '| no clip of his', noClip, '| no files', noFiles, errs.length ? '| ERR ' + errs.join(',') : '', Dm ? '' : '| NO SHELL_DATA');
  for (const k of missD) console.log('   ', k, draws(k), [...(motsOf[k.split(' ')[0]] || [])].join(','), '|', [...census.get(k)].slice(0, 2).join('; '));
}

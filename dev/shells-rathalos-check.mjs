// The Rathalos line's shells in render/shells.js -- Dreadking Rathalos (em002_04), which runs Rathian's class uEm001_00
// with the em byte +0xb5f4 = 2, the variant byte +0xb5f5 = 4, its own shell ids (0xd09918: 0x59 / 0x5f / 0x64) and files
// -- against the ROM.
//
//   1. THE FILES: SHELL_DATA.em002_04 against the values read from its own .arc, as the reference JSON carries them (vdata.py:
//      every ShellInfoList mode's sh ints / floats / vecs, ef, hit ints; the hitdata records): bit for bit.
//   2. THE ROM'S REFERENCE RUNS: C:\MHGU-Extract\efx\agents\rathian-variants-scratch\rathalos-dk-reference.json (env
//      RATHALOS_REF overrides), made by vrefs.py --dk on the Unicorn harness: uEm001_00's own action code (the action main's
//      status switch 0xcee3d8, the case bodies, every spawn helper, frame by frame -- arun.py) or its per-frame handler
//      0xcf1a5c, then every create's setup run as its shell (ctor, init, moves) with every shell it creates (the landing
//      0xd0dc9c's em-2 branches, sp_11's 0xd0efc0, sp_01's end create 0xd0eb20). Each scenario runs through stepShells as the
//      viewer steps it: the clip one frame per step from 0, input.rock.variant = the action ('7:0x02' ... '3:0x4d'), the
//      scenario's joints, owner block (words, and at each create the position / ground the ROM had), target, floor, rank,
//      input.questLevel. Every shell, in the reference's order, is compared field by field (setup, reader params, spawn
//      state, init effect starts, every move, every event) and its canonical text with the ROM's (and sha256).
//   3. THE CHAINS: the landing of mode 0x1f (0x1b, or 0x11 above quest 6) and sp_01's end create, gate by gate.
//   4. The contract: pickVariantsFor per clip, not tired / tired; the inputs (refusals); the gates (quest, rank); the
//      shared hover turns / dust rows; the pel names the starts carry.
//   5. CONTROLS: deliberately wrong inputs and a corrupted text must FAIL -- so a PASS above is not blind.
//   6. --rom [n] [seed]: n random plays (default 30) run by the ROM's own action code on the harness (python + unicorn; env
//      RATHIAN_VARIANTS_SCRATCH overrides its folder) and through stepShells, every shell's canonical text line by line.
//   7. --emc: every status-7 pick action's op-0x24 mark against the monster's own command table (the state agent's EMC
//      reader, env RATHIAN_EMC_SCRATCH overrides its folder).
//
//   node dev/shells-rathalos-check.mjs [--rom [n] [seed]] [--emc] [--print <scenario> <index>]
//
// Exit code 1 when anything fails.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createShellState, stepShells, pickVariantsFor, variantActionFor, SHELL_DATA } from '../docs/render/shells.js';

const REF = process.env.RATHALOS_REF || String.raw`C:\MHGU-Extract\efx\agents\rathian-variants-scratch\rathalos-dk-reference.json`;
const ref = JSON.parse(readFileSync(REF, 'utf8'));
const MONS = ['em002_04'];

const f = Math.fround;
const DV = new DataView(new ArrayBuffer(4));
const bits = x => { DV.setFloat32(0, x, true); return DV.getUint32(0, true); };
const hx = x => bits(x).toString(16).padStart(8, '0');
const w8 = x => (x >>> 0).toString(16).padStart(8, '0');
const v3 = v => v.map(hx).join(',');
const a3 = v => v.map(w8).join(',');
const sameF = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => bits(x) === bits(b[i]));
const sameW = (a, b) => !!a && !!b && a.length === b.length && a.every((x, i) => (x >>> 0) === (b[i] >>> 0));
const sha = s => createHash('sha256').update(s).digest('hex');
const eq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

let pass = 0, fail = 0;
function check(name, ok, detail){
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  -- ' + detail : ''));
}
const actionName = a => `${a[0]}:0x${a[1].toString(16).padStart(2, '0')}`;
const pelOf = mon => ({ 0: SHELL_DATA[mon].lists[0].pel, 1: SHELL_DATA[mon].lists[1].pel });
const LIST = { 0: 'c', 1: 'u' };

// ---- 1. the files ---------------------------------------------------------------------------------------------------------
console.log(`== 1. SHELL_DATA against the monster's own files (${REF})`);
for (const mon of MONS){
  const D = SHELL_DATA[mon], F = ref.files[mon];
  for (const [fo, name] of [['00', 'shell00'], ['01', 'shell01'], ['11', 'shell11']]){
    const want = F[fo].modes, got = D.shells[name].modes;
    const bad = [];
    const keys = [...new Set([...Object.keys(want), ...Object.keys(got)])].sort((a, b) => a - b);
    for (const m of keys){
      const w = want[m], g = got[m];
      if (!w || !g){ bad.push(`mode ${m}: ${!w ? 'no file' : 'not in SHELL_DATA'}`); continue; }
      const ok = eq(g.sh.ints, w.sh.ints) && sameF(g.sh.floats.map(f), w.sh.floats) && g.sh.vecs.length === w.sh.vecs.length &&
                 g.sh.vecs.every((v, i) => sameF(v.map(f), w.sh.vecs[i])) && JSON.stringify(g.ef) === JSON.stringify(w.ef) &&
                 eq(g.hit, w.hit) && g.scale === 1.0;
      if (!ok) bad.push(`mode ${m}`);
    }
    check(`${mon} ${name}: ${keys.length} modes = the files (sh ints / floats / vecs, ef, hit, scale 1.0)`, bad.length === 0, bad.join('; '));
  }
  check(`${mon} shell01 hitdata = ${mon}_01_hitdata (${F['01'].hitdata.length} records)`, JSON.stringify(D.shells.shell01.hitdata) === JSON.stringify(F['01'].hitdata));
}
{
  const K = SHELL_DATA.em002_04;
  check('ids (0xd09918, em 2 variant 4: 0xd09a00..0xd09a1c) 0x59 / 0x5f / 0x64; em byte 2, variant byte 4; lists c em002_00c + its own em002_04u',
        K.shells.shell00.id === 0x59 && K.shells.shell01.id === 0x5f && K.shells.shell11.id === 0x64 && K.em === 2 && K.variant === 4 &&
        K.lists[0].pel === 'em002_00c' && K.lists[0].list === 'c' && K.lists[1].pel === 'em002_04u' && K.lists[1].list === 'u');
  // the helpers that take a frame from the actiontune (0x6f618) -- L9 M7's dust, float 24 (0xd04680 / 0xd048fc / 0xd04aa0),
  // and (7, 0xf2)'s, floats 19 / 26..28 -- read 0.0 past the end of Dreadking's 6 floats (0x3cb330): a frame their motions
  // never pass, so no listed action reads it; no poison (0xd09b84's modes 16 / 23 / 24 have no em002_04 file)
  check('Dreadking\'s actiontune is 6 floats (em002_04_actiontune): no listed action takes a frame from it; no poison; SHELL_DATA has neither',
        ref.files.em002_04.actiontune.floats.length === 6 && ref.files.em002_04.actiontune.ints.length === 0 &&
        !K.tune && !K.poison && !K.actions.some(a => (a.spawns || []).some(s => s.tune || s.kind === 'poison')) &&
        [16, 23, 24, 21, 36, 48, 49, 50].every(m => !K.shells.shell01.modes[m]));
}

// ---- a scenario through stepShells, as the viewer steps it ------------------------------------------------------------------
function jointsOf(J){
  const M = {};
  for (const [g, m] of Object.entries(J)) M[Number(g)] = m.map(f);
  const first = Math.min(...Object.keys(M).map(Number));
  return gid => M[gid] || (gid === 0 ? M[first] : null);
}
// opts: { variant, clip, steps, joints, owner (partial block), target, floor, rank, questLevel, noRock, noOwner, noPos,
// noTarget, hitLife, posture, loop (the clip's frame count: the viewer's looping play, frame = (step * rate) % loop),
// rate (the frames the clip advances per step, 1 by default: a pose clock slower or faster than the steps), monId,
// effectAlive (step, S, param, h) }
function run(sc, opts = {}){
  const mon = opts.monId || sc.monster;
  const st = createShellState(mon);
  const inp = sc.inputs;
  const own = Object.assign({}, inp.owner, opts.owner || {});
  const floor = opts.floor !== undefined ? opts.floor : inp.floorY;
  const J = opts.joints || jointsOf(inp.joints);
  const T = opts.noTarget ? null : opts.target !== undefined ? opts.target : (inp.target || null);
  const variant = opts.variant !== undefined ? opts.variant : (sc.action ? actionName(sc.action) : null);
  const clip = opts.clip || sc.clip.motion, list = sc.clip.list;
  const steps = opts.steps || stepsFor(sc);
  // the owner the ROM had at each create (its own travel / posture height moved it: vrefs.py records them): until a
  // create's step, that create's position and ground; after the last, the last's
  const cr = (sc.creates || []).slice().sort((a, b) => a.pair[1] - b.pair[1]);
  const ownerAt = step => { const c = cr.find(x => x.pair[1] + 1 >= step) || cr[cr.length - 1]; return c && c.owner_pos ? c : null; };
  const rec = { shells: [], outs: [], refused: [], acc: [] };
  for (let step = 0; step < steps; step++){
    const oc = opts.owner && opts.owner.pos ? null : ownerAt(step);
    const pos = oc ? oc.owner_pos : own.pos, ground = oc ? oc.ground : (opts.ground !== undefined ? opts.ground : own.ground);
    const input = { monId: mon, list, clip, frame: opts.loop ? f(f(step * (opts.rate || 1)) % opts.loop) : step, joints: J, rage: false,
                    rock: opts.noRock ? undefined : { variant, target: T ? { x: T[0], y: T[1], z: T[2] } : null, floorY: floor },
                    owner: opts.noOwner ? undefined : { x: own.X, y: own.Y, z: own.Z },
                    ownerPos: opts.noPos ? undefined : { x: pos[0], y: pos[1], z: pos[2] },
                    ground, size: own.sc, baseScale: own.base, y5c: oc ? oc.y5c : own.y5c,
                    rank: opts.rank !== undefined ? opts.rank : inp.rank, stepCount: step + 1 };
    // (null: the input not given at all)
    const q = opts.questLevel !== undefined ? opts.questLevel : inp.questLevel;
    if (q != null) input.questLevel = q;
    if (opts.hitLife) input.hitLife = true;
    if (opts.posture != null) input.posture = opts.posture;
    if (opts.effectAlive) input.effectAlive = (S, p, h) => opts.effectAlive(step, S, p, h);
    const pairCur = st.hist ? st.hist[1] : null;
    const out = stepShells(st, input);
    rec.outs.push(out);
    rec.acc.push(st.acc5c58);
    for (const r of out.refused) rec.refused.push(Object.assign({ step }, r));
    for (const S of out.spawned) rec.shells.push({ S, spawnStep: step, pairCur, moves: [], endMove: null, endStep: null, firstMoveStep: null });
    for (const r of rec.shells){
      const S = r.S;
      if (r.endMove == null && S.moves > r.moves.length){
        if (r.firstMoveStep == null) r.firstMoveStep = step;
        r.moves.push({ k: S.moves, step, state: S.state, position: S.position.slice(), angles: S.angles.slice(), timer: S.timer,
                       velocity: S.velocity ? S.velocity.slice() : null, anchor: S.anchor.slice(), elapsed: S.elapsed,
                       events: S.events.slice(), started: out.started.filter(e => e.shell === S).map(e => e.start) });
        if (S.state !== 1){ r.endMove = S.moves; r.endStep = step; }
      }
    }
  }
  for (const r of rec.shells) r.text = textOf(r);
  rec.ordered = ordered(rec);
  return rec;
}
// the last create's frame, the fireball's flight (<= 180), a landing shell's life (<= 300) and the one its end makes
function stepsFor(sc){
  const fr = (sc.creates || []).length ? Math.max(...sc.creates.map(c => c.pair[1])) : 130;
  return Math.min(fr, 400) + 2 + 470 + 205 + 340;
}
function ordered(rec){
  const out = [];
  const walk = r => { out.push(r); for (const c of rec.shells) if (c.S.creator === r.S.id) walk(c); };
  for (const r of rec.shells) if (r.S.creator == null) walk(r);
  return out;
}
function evLine(S, e){
  switch (e.ev){
    case 'hit': return `  hit at=${v3(e.point)}`;
    case 'camera': return `  quake ${e.id}`;
    case 'create': return `  create id=${e.id.toString(16)} mode=${e.mode} at=${v3(e.position)} ang=${a3(e.angles)}`;
    case 'start': return `  start list=${e.start.listId} key=${e.start.key} at=${v3(e.start.requester.position)}`;
    case 'refused': { const p = e.listId != null ? [e.listId, e.key] : S.mode.ef[e.param]; return `  refused list=${p[0]} key=${p[1]}`; }
    case 'stop': return `  stop flag=${e.flag}`;
    default: return `  ?? ${e.ev}`;
  }
}
const st2 = s => s.toString(16).padStart(2, '0');
function textOf(r){
  const S = r.S, L = [], id = S.globalId.toString(16);
  if (S.base === 'base00'){
    const l = S.launch;
    L.push(`spawn id=${id} mode=${S.modeIndex} pos=${v3(l.position)} vel=${v3(l.velocity)} anchor=${v3(l.anchor)} ang=${a3(l.angles)} timer=${hx(l.timer)}`);
  } else L.push(`spawn id=${id} mode=${S.modeIndex} pos=${v3(S.position)} ang=${a3(S.angles)} timer=${hx(S.timer)}`);
  for (const e of S.initEvents) L.push(evLine(S, e));
  for (const m of r.moves){
    L.push(S.base === 'base00'
      ? `m${m.k} st=${st2(m.state)} pos=${v3(m.position)} vel=${v3(m.velocity)} anchor=${v3(m.anchor)} ang=${a3(m.angles)} timer=${hx(m.timer)}`
      : `m${m.k} st=${st2(m.state)} elapsed=${hx(m.elapsed)}`);
    for (const e of m.events) L.push(evLine(S, e));
  }
  return L.join('\n') + '\n';
}

// one shell against the ROM's: { setup, params, spawn, init, moves, events, text }, '' when identical
function compareShell(s, r, PEL){
  const res = {};
  const S = r && r.S;
  if (!S){ for (const k of ['setup', 'params', 'spawn', 'init', 'moves', 'events', 'text']) res[k] = 'no such shell'; return res; }
  const su = s.setup, mine = S.setup;
  res.setup = (su.id === S.globalId && su.mode === S.modeIndex && (s.kind === 'shell00' || (sameF(mine.position, su.pos) && sameW(mine.angles, su.angles30))))
    ? '' : `setup id ${S.globalId.toString(16)} mode ${S.modeIndex} ${v3(mine.position)} ${a3(mine.angles)} vs ROM ${su.id.toString(16)} ${su.mode} ${v3(su.pos)} ${a3(su.angles30)}`;
  if (s.parent != null && S.createdAtMove !== s.created_at_move) res.setup += ` created at move ${S.createdAtMove} vs ROM ${s.created_at_move}`;
  const P = s.params, k = S.k, bad = [];
  if (s.kind === 'shell00'){
    if (k.flags !== P.flags15e8) bad.push(`flags 0x${k.flags.toString(16)} vs 0x${P.flags15e8.toString(16)}`);
    if (k.joint !== P.joint15dc) bad.push(`joint ${k.joint} vs ${P.joint15dc}`);
    if (k.i1 !== P.i15e0 || k.i2 !== P.i15e4) bad.push(`camera ids ${k.i1} ${k.i2} vs ${P.i15e0} ${P.i15e4}`);
    for (const [n, v] of [['x_deg15ec', k.xDeg], ['y_deg15f0', k.yDeg], ['speed15f4', k.vz], ['vy15f8', k.vy], ['flight15fc', k.flight],
                          ['xmin1600', k.xLo], ['xmax1604', k.xHi], ['aim_y1664', k.aimOff[1]]]) if (bits(v) !== bits(P[n])) bad.push(n);
  } else if (S.state !== undefined && k){
    if (k.flags !== P.flags15ec) bad.push(`flags 0x${k.flags.toString(16)} vs 0x${P.flags15ec.toString(16)}`);
    if (bits(k.timer) !== bits(P.timer15f0)) bad.push(`timer ${k.timer} vs ${P.timer15f0}`);
    if (s.kind === 'shell01' && k.joint !== P.joint15e4) bad.push(`joint ${k.joint} vs ${P.joint15e4}`);
    const hit = S.mode ? S.mode.hit : [-1, -1];
    if (s.kind === 'shell01' && (hit[0] !== P.hit15d8 || hit[1] !== P.hit15dc)) bad.push(`hit ints ${hit} vs ${P.hit15d8},${P.hit15dc}`);
  }
  res.params = bad.join('; ');
  const sp = s.spawn, b2 = [];
  if (s.kind === 'shell00'){
    const l = S.launch;
    if (!sameF(l.position, sp.pos)) b2.push(`pos ${v3(l.position)} vs ${v3(sp.pos)}`);
    if (!sameF(l.velocity, sp.vel)) b2.push(`vel ${v3(l.velocity)} vs ${v3(sp.vel)}`);
    if (!sameF(l.gravity, sp.acc)) b2.push(`acc ${v3(l.gravity)} vs ${v3(sp.acc)}`);
    if (!sameF(l.anchor, sp.anchor)) b2.push(`anchor ${v3(l.anchor)} vs ${v3(sp.anchor)}`);
    if (!sameW(l.angles, sp.angles)) b2.push(`angles ${a3(l.angles)} vs ${a3(sp.angles)}`);
    if (bits(l.timer) !== bits(sp.timer)) b2.push(`timer ${l.timer} vs ${sp.timer}`);
    if (!l.target1640 || !sameF(l.target1640, sp.target1640)) b2.push(`+0x1640 ${l.target1640 && v3(l.target1640)} vs ${v3(sp.target1640)}`);
  } else {
    if (!sameF(S.position, sp.pos)) b2.push(`pos ${v3(S.position)} vs ${v3(sp.pos)}`);
    if (!sameF(S.anchor, sp.anchor)) b2.push(`anchor ${v3(S.anchor)} vs ${v3(sp.anchor)}`);
    if (!sameW(S.angles, sp.angles)) b2.push(`angles ${a3(S.angles)} vs ${a3(sp.angles)}`);
    if (bits(S.timer) !== bits(sp.timer1614)) b2.push(`timer ${S.timer} vs ${sp.timer1614}`);
  }
  res.spawn = b2.join('; ');
  const got = S.initEvents, want = s.events_init, b3 = [];
  if (got.length !== want.length) b3.push(`${got.length} vs ROM ${want.length}: ${JSON.stringify(want)}`);
  else want.forEach((w, i) => {
    const g = got[i];
    if (w.ev === 'start'){
      const q = g.start;
      if (!(g.ev === 'start' && q && q.listId === w.list && q.key === w.key && q.pel === PEL[w.list] && q.list === LIST[w.list] &&
            sameF(q.requester.position, w.at) && q.requester.parent === 'shell' && q.requester.rotationDeg === null))
        b3.push(`start ${g.ev} ${q && q.pel} ${q && q.key} vs ${PEL[w.list]} ${w.key} at ${v3(w.at)}`);
    } else if (!(g.ev === 'refused' && g.listId === w.list && g.key === w.key)) b3.push(`refused ${g.ev} ${g.listId} ${g.key} vs ${w.list} ${w.key}`);
  });
  res.init = b3.join('; ');
  res.moves = '';
  if (r.moves.length !== s.moves.length) res.moves = `${r.moves.length} moves vs ROM ${s.moves.length}`;
  for (let i = 0; i < Math.min(r.moves.length, s.moves.length) && !res.moves; i++){
    const a = r.moves[i], b = s.moves[i], d = [];
    if (a.k !== b.k) d.push(`k ${a.k} vs ${b.k}`);
    if (a.state !== b.state) d.push(`state ${a.state} vs ${b.state}`);
    if (s.kind === 'shell00'){
      if (!sameF(a.position, b.pos)) d.push(`pos ${v3(a.position)} vs ${v3(b.pos)}`);
      if (!sameF(a.velocity, b.vel)) d.push(`vel ${v3(a.velocity)} vs ${v3(b.vel)}`);
      if (!sameF(a.anchor, b.anchor)) d.push(`anchor ${v3(a.anchor)} vs ${v3(b.anchor)}`);
      if (!sameW(a.angles, b.angles)) d.push(`angles ${a3(a.angles)} vs ${a3(b.angles)}`);
      if (bits(a.timer) !== bits(b.timer)) d.push(`timer ${a.timer} vs ${b.timer}`);
    } else if (bits(a.elapsed) !== bits(b.elapsed)) d.push(`elapsed ${a.elapsed} vs ${b.elapsed}`);
    if (d.length) res.moves = `move ${b.k}: ${d.join('; ')}`;
  }
  res.events = '';
  for (let i = 0; i < Math.min(r.moves.length, s.moves.length) && !res.events; i++){
    const got = r.moves[i].events, want = s.moves[i].events, d = [];
    if (got.length !== want.length) d.push(`${got.map(e => e.ev).join(',') || 'none'} vs ROM ${want.map(e => e.ev).join(',') || 'none'}`);
    else want.forEach((w, j) => {
      const g = got[j];
      if (w.ev === 'hit'){ if (!(g.ev === 'hit' && sameF(g.point, w.at) && g.type === w.type)) d.push(`hit ${g.ev} vs ${v3(w.at)}`); }
      else if (w.ev === 'quake'){ if (!(g.ev === 'camera' && g.id === w.id)) d.push(`camera ${g.ev} ${g.id} vs ${w.id}`); }
      else if (w.ev === 'create'){
        if (!(g.ev === 'create' && g.id === w.id && g.mode === w.mode && sameF(g.position, w.pos) && sameW(g.angles, w.angles30)))
          d.push(`create ${g.ev} ${g.id} ${g.mode} ${g.position && v3(g.position)} vs ${w.id} ${w.mode} ${v3(w.pos)}`);
      } else if (w.ev === 'start'){
        const q = g.start;
        if (!(g.ev === 'start' && q && q.listId === w.list && q.key === w.key && q.pel === PEL[w.list] && sameF(q.requester.position, w.at)))
          d.push(`start ${g.ev} ${q && q.key} vs ${w.key} at ${v3(w.at)}`);
      } else if (w.ev === 'refused'){
        const p = g.listId != null ? [g.listId, g.key] : (S.mode.ef[g.param] || []);
        if (!(g.ev === 'refused' && p[0] === w.list && p[1] === w.key)) d.push(`refused ${g.ev} vs ${w.list} ${w.key}`);
      } else if (w.ev === 'stop'){ if (!(g.ev === 'stop' && g.flag === w.flag)) d.push(`stop ${g.ev} flag ${g.flag} vs ${w.flag}`); }
      else d.push('unknown ROM event ' + w.ev);
    });
    if (d.length) res.events = `move ${s.moves[i].k}: ${d.join('; ')}`;
  }
  const a = r.text.split('\n'), b = s.canonical.split('\n'), j = a.findIndex((x, i) => x !== b[i]);
  res.text = (r.text === s.canonical && sha(r.text) === s.sha256) ? '' : `line ${j + 1}:\n     js  ${a[j]}\n     rom ${b[j]}`;
  return res;
}
// a shell the ROM's init deleted (0x48b884 made it, its init refused: no moves) -- the JS's make001 returns no shell
const deletedAtInit = s => s.init_alive === false;
const identical = (sc, rec) => {
  const want = sc.shells.filter(s => !deletedAtInit(s));
  return rec.ordered.length === want.length && want.every((s, i) => rec.ordered[i].text === s.canonical);
};

// ---- 2. the reference runs --------------------------------------------------------------------------------------------------
console.log('== 2. the ROM\'s reference runs');
const runs = {};
let nShells = 0, nMoves = 0;
const scenarios = ref.scenarios.filter(sc => MONS.includes(sc.monster));
// the flight dust (kind 'flight'): the clip once from frame 0, the handler's every call (P+0x5c58 after each: the ROM's
// frame f is the step whose F[k-1] = f, the step after the fresh one testing [0, 0]), every create's frame, and the first
// shells' texts
function flightCheck(sc){
  const rec = runs[sc.name] = run(sc, { steps: sc.frames + 1 });
  const tag0 = `${sc.name} ${sc.monster} L${sc.clip.list} ${sc.clip.motion} (posture ${sc.posture}, ${sc.frames} frames)`;
  const acc = rec.acc.slice(1);
  check(`${tag0}: P+0x5c58 after each of the handler's ${sc.frames} calls = the ROM's`, acc.length === sc.acc5c58.length && sameF(acc, sc.acc5c58),
        (() => { const i = acc.findIndex((x, j) => bits(x) !== bits(sc.acc5c58[j])); return i < 0 ? '' : `frame ${i}: ${acc[i]} vs ${sc.acc5c58[i]}`; })());
  const alive = sc.shells.every(x => !deletedAtInit(x)), dead = sc.shells.every(deletedAtInit);
  const made = rec.shells.filter(r => r.S.creator == null).map(r => r.pairCur);
  if (alive || dead){
    const want = alive ? sc.spawns_at : [];
    check(`${tag0}: shells made at ${want.join(' ') || 'none'}${alive ? '' : ` (the ROM's inits delete those at ${sc.spawns_at.join(' ')}: the owner 900 over its ground)`}`,
          eq(made, want), made.join(' '));
  } else check(`${tag0}: the reference mixes kept and deleted shells`, false);
  sc.shells.forEach((s, i) => {
    if (deletedAtInit(s)) return;
    const r = rec.ordered[i], c = compareShell(s, r, pelOf(sc.monster)), tag = `${sc.name} #${i} ${s.kind} mode ${s.mode}`;
    nShells++; nMoves += s.moves.length;
    check(`${tag}: setup, reader params, spawn state, init effects`, c.setup === '' && c.params === '' && c.spawn === '' && c.init === '', [c.setup, c.params, c.spawn, c.init].filter(Boolean).join(' | '));
    check(`${tag}: ${s.moves.length} moves and their events; canonical text = the ROM's`, c.moves === '' && c.events === '' && c.text === '', c.moves || c.events || c.text);
  });
}
for (const sc of scenarios){
  if (sc.kind === 'flight'){ flightCheck(sc); continue; }
  const rec = runs[sc.name] = run(sc);
  const want = sc.shells.filter(s => !deletedAtInit(s)), dead = sc.shells.filter(deletedAtInit);
  const PEL = pelOf(sc.monster);
  const tag0 = `${sc.name} ${sc.monster} ${sc.action ? `(${sc.action[0]}, 0x${sc.action[1].toString(16)}) ` : ''}L${sc.clip.list} ${sc.clip.motion}`;
  const inputs = sc.inputs;
  const note = [inputs.rank !== 5 ? `rank ${inputs.rank}` : '', inputs.questLevel ? `quest ${inputs.questLevel}` : ''].filter(Boolean).join(', ');
  if (dead.length)
    check(`${tag0}: ${dead.length} create(s) the ROM's init deletes (${dead.map(s => `${s.kind.slice(5)}m${s.mode}`).join(' ')}) make no shell here`,
          !rec.ordered.some(r => dead.some(s => s.mode === r.S.modeIndex && s.id === r.S.globalId && r.S.creator == null && r.pairCur === s.spawn_frame)));
  check(`${tag0}${note ? ' (' + note + ')' : ''}: ${want.length} shells in the ROM's order (${want.map(s => `${s.kind.slice(5)}m${s.mode}`).join(' ') || 'none'})`,
        rec.ordered.length === want.length && want.every((s, i) => rec.ordered[i] && rec.ordered[i].S.modeIndex === s.mode && rec.ordered[i].S.globalId === s.id),
        rec.ordered.map(r => `${r.S.shell.slice(5)}m${r.S.modeIndex}`).join(' ') + (rec.refused.length ? ' refused ' + JSON.stringify(rec.refused) : ''));
  want.forEach((s, i) => {
    const r = rec.ordered[i], c = compareShell(s, r, PEL), tag = `${sc.name} #${i} ${s.kind} mode ${s.mode}`;
    nShells++; nMoves += s.moves.length;
    if (s.parent == null && s.spawn_frame != null)
      check(`${tag}: made at the step whose frame pair is (${s.spawn_frame - 1}, ${s.spawn_frame}]`, !!r && r.pairCur === s.spawn_frame, r && `F[k-1] = ${r.pairCur}`);
    check(`${tag}: setup, reader params, spawn state`, c.setup === '' && c.params === '' && c.spawn === '', [c.setup, c.params, c.spawn].filter(Boolean).join(' | '));
    check(`${tag}: init effects (${s.events_init.map(e => e.ev === 'start' ? `${LIST[e.list]} ${e.key}` : 'refused').join(', ') || 'none'})`, c.init === '', c.init);
    check(`${tag}: ${s.moves.length} moves and their events identical`, c.moves === '' && c.events === '', c.moves || c.events);
    check(`${tag}: canonical text = the ROM's (sha256 ${s.sha256.slice(0, 16)}...)`, c.text === '', c.text);
  });
}
console.log(`   (${nShells} shells, ${nMoves} moves compared)`);
const pr = process.argv.indexOf('--print');
if (pr > 0){
  const rec = runs[process.argv[pr + 1]], i = Number(process.argv[pr + 2]);
  if (rec && rec.ordered[i]) process.stdout.write(rec.ordered[i].text);
}
const N = Object.fromEntries(scenarios.map(sc => [sc.name, sc]));

// ---- 3. the chains ----------------------------------------------------------------------------------------------------------
console.log('== 3. the landings\' em-2 branches and sp_01\'s end create');
{
  const chain = rec => rec.ordered.map(r => `${r.S.shell.slice(5)}m${r.S.modeIndex}${r.S.creator == null ? '' : '<' + rec.ordered.findIndex(x => x.S.id === r.S.creator)}`).join(' ');
  // the quest gate of mode 0x1f's landing (0xd0e170..0xd0e238): 0x49930(owner) > 6 -> 0x11, else 0x1b; each ends into its pair
  const q = n => chain(run(N.KF9, { questLevel: n }));
  const got = [0, 6, 7, 40].map(q);
  check('mode 0x1f\'s landing by quest: 0 / 6 -> shell01 27 (0x1b) -> 28 at its end; 7 / 40 -> 17 (0x11) -> 18 (0x49930 > 6, unsigned)',
        eq(got, ['00m31 01m27<0 01m28<1', '00m31 01m27<0 01m28<1', '00m31 01m17<0 01m18<1', '00m31 01m17<0 01m18<1']), got.join(' | '));
  // the end create: at the creator's point (+0x40..), angle words (0, 0, 0) from 0x1620e60, after its stops, in its end move
  const r9 = runs.KF9, a = r9.ordered[1], b = r9.ordered[2], last = a.moves[a.moves.length - 1];
  check('sp_01\'s end create (0xd0eb20): 27 ends at move 301 (timer 300) with its stop, then creates 28 at its own point with angles (0, 0, 0)',
        a.endMove === 301 && eq(last.events.map(e => e.ev), ['stop', 'create']) && sameF(b.S.setup.position, a.S.position) && sameW(b.S.setup.angles, [0, 0, 0]) &&
        b.S.createdAtMove === 301, `end ${a.endMove}, events ${last.events.map(e => e.ev)}`);
  const r11 = chain(runs.KF11);
  check('(7, 0xec): 0x22 / 0x23 / 0x24 land into shell01 29 / 52 / 54 (no ground fire), each ending into 30 / 53 / 55',
        r11 === '00m34 01m29<0 01m30<1 00m35 01m52<3 01m53<4 00m36 01m54<6 01m55<7', r11);
  const r5 = chain(runs.KF5), r7 = chain(runs.KF7);
  check('the take-off\'s 0x15 lands as the mask\'s modes (em 2 variant 4: shell11 + the ground fire); (9, 3)\'s 0x20 makes shell01 1, 19 and the ground fire',
        r5 === '00m21 11m0<0 01m6<1 01m7<1 01m8<1 01m9<1 01m2<0' && r7 === '00m32 01m1<0 01m19<0 01m2<0', `${r5} | ${r7}`);
  // L9 M1's shell is made at the MOTION'S END (0xb09c8), which a looping viewer never reaches as a frame: its play ends
  // at the wrap (endWrap001). The reference KF13 played to its end and looping must make the same shells -- the scenario's
  // joints are the same every step, so the ROM's text is the text of a wrap-made one too
  {
    const n = 126;                                     // the frames a looping play reports: 0..125, then back to 0
    const r = run(N.KF13, { steps: 3 * n + 8, loop: n });
    const fb = r.shells.filter(x => x.S.creator == null);
    const want = N.KF13.shells[0].canonical.split('\n'), got = fb[0] ? fb[0].text.split('\n') : [];
    const j = got.findIndex((x, i) => x !== want[i]);
    check('L9 M1 looping (frames 0..125, the viewer\'s default): one shell00 0x1f per loop, made on the wrap step, with the ROM\'s spawn state and moves',
          fb.length === 3 && eq(fb.map(x => x.pairCur), [125, 125, 125]) && fb.every(x => x.S.modeIndex === 0x1f) &&
          got.length > 30 && (j < 0 || j > 30), `${fb.length} shells at ${fb.map(x => x.pairCur).join(' ')}` +
          (j >= 0 && j <= 30 ? `; line ${j + 1}:\n     js  ${got[j]}\n     rom ${want[j]}` : ''));
    // the pose clock against the steps: a clip that advances a quarter of a frame per step (the same frame sampled four
    // times, so the advance just before the wrap is 0.25) and one that advances three (the last sample 123)
    for (const rate of [0.25, 0.5, 3]){
      const q = run(N.KF13, { steps: Math.ceil(2.2 * n / rate), loop: n, rate });
      const made = q.shells.filter(x => x.S.creator == null);
      check(`L9 M1 looping at ${rate} frames a step: one shell00 0x1f per loop, on the wrap (its last sample ${made[0] ? made[0].pairCur : '-'}), with the ROM's spawn state`,
            made.length === 2 && made.every(x => x.S.modeIndex === 0x1f && x.text.split('\n')[0] === want[0]),
            `${made.length} shells at ${made.map(x => x.pairCur).join(' ')}` + (made[0] ? `\n     js  ${made[0].text.split('\n')[0]}\n     rom ${want[0]}` : ''));
    }
    const half = run(N.KF13, { steps: 200, loop: 60 });          // a play that never nears the end: no shell
    check('a play that goes back well before the end (frames 0..59) makes none: its last sample plus its advance is under 126 (the clip\'s last frame)',
          half.shells.length === 0, half.shells.map(x => x.S.modeIndex).join(' '));
  }
  // only sp_01 makes the end create: the shells of the siblings' modes end without one
  const ends = Object.values(runs).flatMap(r => r.ordered).filter(r => r.S.shell === 'shell01' && r.endMove != null);
  check('no end create for any other shell01 mode (0x1b / 0x11 / 0x1d / 0x34 / 0x36 only)',
        ends.every(r => r.moves[r.moves.length - 1].events.some(e => e.ev === 'create') === [0x1b, 0x11, 0x1d, 0x34, 0x36].includes(r.S.modeIndex)));
}

// ---- 4. the contract ------------------------------------------------------------------------------------------------------
console.log('== 4. picks, inputs, gates');
{
  const cases = {
    em002_04: [
      ['2', 'Motion[5]', ['7:0x02'], ['7:0x0f']], ['2', 'Motion[18]', ['7:0x0a'], ['7:0x0b']],
      ['2', 'Motion[1]', ['7:0x4d', '7:0x75', '7:0x00', '7:0x74'], ['7:0x4d', '7:0x75', '7:0x00', '7:0x74']],
      ['2', 'Motion[13]', ['7:0x4e', '7:0x11'], ['7:0x4e', '7:0x11']],
      ['4', 'Motion[22]', ['7:0x23', '7:0x2e'], ['7:0x30', '7:0x41']],
      ['4', 'Motion[29]', ['7:0x24', '7:0x26', '7:0x27', '7:0x28', '7:0x3b', '7:0x65', '7:0x67', '7:0x33', '7:0x34'],
                          ['7:0x27', '7:0x28', '7:0x65', '7:0x67', '7:0x31', '7:0x32', '7:0x33', '7:0x34', '7:0x3c']],
      ['4', 'Motion[32]', ['7:0x03', '7:0x29', '7:0x2b', '7:0x2c', '7:0x48', '7:0x49', '9:0x03', '9:0x04'],
                          ['7:0x29', '9:0x03', '7:0x35', '7:0x36', '7:0x37', '7:0x38', '9:0x04']],
      ['4', 'Motion[38]', ['7:0x43', '7:0x45', '7:0x46', '7:0xf5'], ['7:0x45']],
      ['4', 'Motion[18]', ['7:0xec', '7:0xf9'], ['7:0xf9']], ['4', 'Motion[45]', ['3:0x4d'], ['3:0x4d']],
      ['9', 'Motion[1]', ['7:0xfa', '7:0xfb'], ['7:0xfb']],
      ['9', 'Motion[4]', ['7:0xed', '7:0xee', '7:0xf6', '7:0xf7', '7:0xf8'], ['7:0xed', '7:0xee', '7:0xf6', '7:0xf7', '7:0xf8']],
      ['9', 'Motion[5]', ['7:0xed', '7:0xee', '7:0xf6', '7:0xf7', '7:0xf8'], ['7:0xed', '7:0xee', '7:0xf6', '7:0xf7', '7:0xf8']],
      ['4', 'Motion[8]', [], []], ['4', 'Motion[16]', [], []], ['4', 'Motion[65]', [], []], ['4', 'Motion[6]', [], []],
      ['9', 'Motion[2]', [], []], ['9', 'Motion[7]', [], []], ['9', 'Motion[9]', [], []],
    ],
  };
  for (const [mon, list] of Object.entries(cases))
    for (const [l, c, calm, tired] of list){
      const a = pickVariantsFor(mon, l, c), b = pickVariantsFor(mon, l, c, { tired: true }), r = pickVariantsFor(mon, l, c, { tired: true, rage: true });
      check(`pickVariantsFor(${mon}, ${l}, ${c}) = ${calm.join(' ') || 'none'}; tired ${tired.join(' ') || 'none'}; tired + enraged = not tired`,
            eq(a, calm) && eq(b, tired) && eq(r, calm), `${a.join(' ')} | ${b.join(' ')} | ${r.join(' ')}`);
    }
  const K = SHELL_DATA.em002_04, R = SHELL_DATA.em001_00;
  const hov = K.actions.filter(a => a.pick === 'hover');
  const own = K.dust.filter(r => !R.dust.includes(r));
  check('Dreadking\'s hover turns are Rathian\'s objects, its dust rows hers plus the flight rows 0x419 / 0x41a / 0x41b, its postures hers plus L4 M25..M27 = 3; none of its fire actions is hers',
        hov.length > 0 && hov.every(a => R.actions.includes(a)) && R.dust.every(r => K.dust.includes(r)) && K.dust.length === R.dust.length + 3 &&
        eq(own.map(r => r.ids.join()), [String(0x419), String(0x41a), String(0x41b)]) && own.every(r => r.mode === 15 && r.posture === 3 && r.period === 16) &&
        Object.entries(R.postures).every(([k, v]) => K.postures[k] === v) && ['25', '26', '27'].every(m => K.postures[`4|Motion[${m}]`] === 3) &&
        !R.dust.some(r => r.ids.some(i => i >= 0x419 && i <= 0x41b)) && K.actions.filter(a => a.pick !== 'hover').every(a => !R.actions.includes(a)));
  check('Rathian\'s own SHELL_DATA unchanged: 16 actions; the siblings\' actions do not include Dreadking\'s',
        R.actions.length === 16 && !SHELL_DATA.em001_02.actions.some(a => K.actions.includes(a) && a.pick !== 'hover') &&
        !SHELL_DATA.em001_04.actions.some(a => K.actions.includes(a) && a.pick !== 'hover'));
}
{
  // THE INPUTS
  const q = run(N.KF9, { questLevel: null });
  check('mode 0x1f\'s landing without input.questLevel: the fireball flies, its landing refuses shell01 0x1b / 0x11 (0x49930 is the quest\'s: no default)',
        q.ordered.length === 1 && q.ordered[0].S.modeIndex === 31 && q.refused.length === 1 && eq(q.refused[0].modes, [0x1b, 0x11]) &&
        /quest level/.test(q.refused[0].why) && q.refused[0].creator === q.ordered[0].S.id, JSON.stringify(q.refused));
  const q2 = run(N.KF11, { questLevel: null, steps: 400 });
  check('the other landings do not read the quest: (7, 0xec)\'s 0x22..0x24 land without it', q2.refused.length === 0 && q2.ordered.length === 6, JSON.stringify(q2.refused));
  const nt = run(N.KF12, { noTarget: true, steps: 60 });
  check('mode 0x17 (flags 1 | 2: aimed on X and Y) without a target: refused', nt.shells.length === 0 && nt.refused.length === 1 && /target/.test(nt.refused[0].why), JSON.stringify(nt.refused));
  const np = run(N.KF12, { noPos: true, steps: 60 });
  check('mode 0x17 without the owner position (its aim starts from the owner, flag 4 clear): refused', np.shells.length === 0 && np.refused.length === 1 && /position/.test(np.refused[0].why), JSON.stringify(np.refused));
  const nf = run(N.KF1, { floor: null, steps: 90 });
  check('a fireball without a floor: refused', nf.shells.length === 0 && nf.refused.length === 1 && /floor/.test(nf.refused[0].why), JSON.stringify(nf.refused));
  const no = run(N.KF1, { noOwner: true, steps: 90 });
  check('a fireball without the owner facing: refused', no.shells.length === 0 && no.refused.length === 1 && /facing/.test(no.refused[0].why), JSON.stringify(no.refused));
  const fp = [0, 1, 3].map(p => run(N.KD3, { steps: N.KD3.frames + 1, posture: p }).shells.length);
  check('the flight dust by posture (input.posture over the clip\'s 3): 0 / 1 -> none; 3 -> its five (P+0x1ba == 3, 0xcf1f7c..0xcf1f84)', eq(fp, [0, 0, 5]), fp.join(' '));
  const fq = run(N.KD4, { steps: N.KD4.frames + 1, noPos: true });
  check('the flight dust without the owner position: refused at its period (the owner\'s (x, ground, z))', fq.shells.length === 0 && fq.refused.length === 1 && /position/.test(fq.refused[0].why), JSON.stringify(fq.refused));
  // gates
  const rk = [1, 3, 5].map(n => run(N.KB1, { rank: n, steps: 80 }).shells.map(r => r.S.modeIndex).join());
  check('L2 M1\'s puffs by rank: 1 / 3 -> 3, 4, 5; 5 -> 38, 39, 40 (0x3a8430 > 4)', eq(rk, ['3,4,5', '3,4,5', '38,39,40']), rk.join(' | '));
  const seq = run(N.KF11, { steps: 240 });
  check('(7, 0xec): 34 / 35 / 36 at 116 / 168 / 226, in its phases', eq(seq.shells.filter(r => r.S.creator == null).map(r => `${r.S.modeIndex}@${r.pairCur}`), ['34@116', '35@168', '36@226']));
  const L9 = run(N.KF13, { steps: 140 });
  check('L9 M1 (7, 0xfa): shell00 0x1f at the motion\'s end, frame 126', eq(L9.shells.filter(r => r.S.creator == null).map(r => `${r.S.modeIndex}@${r.pairCur}`), ['31@126']));
  // what the schedule reads: the pel names of the starts
  const pels = Object.values(runs).flatMap(r => r.shells.flatMap(x => x.S.starts || (x.S.start ? [x.S.start] : []))).map(s => s.pel);
  check('every start names em002_00c or em002_04u', pels.length > 0 && pels.every(p => ['em002_00c', 'em002_04u'].includes(p)), [...new Set(pels)].join(' '));
  // the records the viewer can request: every mode its actions, dust rows, landings (floor contacts: the plane stand-in has
  // no steep or hunter contact), shell11 and end creates make, its init effects (shell00 param 0, shell01 params 0 / 1)
  // and a fireball's floor-contact param 2; every start of the reference runs is one of them
  const K = SHELL_DATA.em002_04, reach = { shell00: new Set(), shell01: new Set(), shell11: new Set() };
  for (const a of K.actions) for (const sp of (a.spawns || [])) for (const m of [...(sp.modes || []), ...(sp.modesG || [])]) reach[sp.shell].add(m);
  for (const a of K.actions) if (a.shell && a.modes) for (const m of a.modes) reach[a.shell].add(m);
  for (const r of K.dust) reach.shell01.add(r.mode);
  const m8 = m => (m - 8) >>> 0, inMask = m => m8(m) <= 0x1d && ((0x227f000f >>> m8(m)) & 1) === 1;
  for (const m of [...reach.shell00]){
    if (inMask(m) || m === 0x15){ reach.shell11.add(0); reach.shell01.add(2); }
    else if (m === 0x1f){ reach.shell01.add(0x1b); reach.shell01.add(0x11); }
    else if (m >= 0x22 && m <= 0x24) reach.shell01.add(m === 0x22 ? 0x1d : m === 0x23 ? 0x34 : 0x36);
    else { reach.shell01.add(1); reach.shell01.add(2); if (m === 0x20) reach.shell01.add(0x13); }
  }
  if (reach.shell11.size) for (const m of K.shells.shell11.modes01) reach.shell01.add(m);
  const END = { 0x1b: 0x1c, 0x11: 0x12, 0x1d: 0x1e, 0x34: 0x35, 0x36: 0x37 };
  for (const m of [...reach.shell01]) if (END[m] != null) reach.shell01.add(END[m]);
  const need = new Set();
  const add = (sh, m, params) => { const md = K.shells[sh].modes[m]; if (md) for (const i of params){ const e = md.ef[i]; if (e && e[0] !== 999 && e[1] >= 0 && K.lists[e[0]]) need.add(K.lists[e[0]].pel + '|' + e[1]); } };
  for (const m of reach.shell00) add('shell00', m, [0, 2]);
  for (const m of reach.shell01) add('shell01', m, [0, 1]);
  const got = new Set(Object.values(runs).flatMap(r => r.shells.flatMap(x => [...(x.S.starts || []), ...x.moves.flatMap(mv => mv.events.filter(e => e.ev === 'start').map(e => e.start))])).map(q => q.pel + '|' + q.key));
  const order = [...need].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  check(`the records the viewer can request: ${need.size}; every start of the reference runs is one of them (${got.size} seen)`, [...got].every(k => need.has(k)),
        [...got].filter(k => !need.has(k)).join(' '));
  try {
    const J = JSON.parse(readFileSync(new URL('../docs/effects/em002_04.json', import.meta.url), 'utf8'));
    const have = new Set((J.effects || []).filter(e => e.when === 'shell' && e.record).map(e => e.record.pel + '|' + e.record.key));
    console.log(`INFO docs/effects/em002_04.json 'shell' records: ${order.map(k => k + (have.has(k) ? ' yes' : ' MISSING')).join(', ')}`);
  } catch (e) { console.log(`INFO docs/effects/em002_04.json not read (${e.code || e.message}); the records its shells request: ${order.join(', ')}`); }
}

// ---- 5. controls --------------------------------------------------------------------------------------------------------
console.log('== 5. controls: wrong inputs must fail');
const ctl = (name, sc, opts) => {
  const r = run(sc, opts);
  const ok = !identical(sc, r);
  check(`control ${name}: detected`, ok, ok ? '' : 'identical to the ROM');
};
ctl('facing (KF1, Y + 1)', N.KF1, { owner: { Y: N.KF1.inputs.owner.Y + 1 } });
ctl('joint 3 (KF3, one float)', N.KF3, { joints: (() => { const J = jointsOf(N.KF3.inputs.joints); return gid => { const m = J(gid); return m && gid === 3 ? m.map((x, i) => i === 13 ? f(x + 0.5) : x) : m; }; })() });
ctl('joint 4 (KB3)', N.KB3, { joints: (() => { const J = jointsOf(N.KB3.inputs.joints); return gid => { const m = J(gid); return m && gid === 4 ? m.map((x, i) => i === 12 ? f(x + 1) : x) : m; }; })() });
ctl('the action (KF5 as 7:0x48)', N.KF5, { variant: '7:0x48' });
ctl('the quest (KF10, 3 for 9)', N.KF10, { questLevel: 3 });
ctl('the quest (KF9, 7 for 3)', N.KF9, { questLevel: 7 });
ctl('the rank (KB1, 1 for 5)', N.KB1, { rank: 1 });
ctl('the floor (KF6, +1)', N.KF6, { floor: N.KF6.inputs.floorY + 1 });
ctl('the target (KF12, x + 1)', N.KF12, { target: [N.KF12.inputs.target[0] + 1, N.KF12.inputs.target[1], N.KF12.inputs.target[2]] });
ctl('the owner words (KB3, Z + 0x100)', N.KB3, { owner: { Z: N.KB3.inputs.owner.Z + 0x100 } });
ctl('the owner position (KF12, x + 1)', N.KF12, { owner: { pos: [N.KF12.inputs.owner.pos[0] + 1, N.KF12.inputs.owner.pos[1], N.KF12.inputs.owner.pos[2]] } });
ctl('the monster (KF1 run as Dreadqueen)', N.KF1, { monId: 'em001_04' });
{
  const r = run(N.KD3, { steps: N.KD3.frames + 1, clip: 'Motion[26]' });
  const made = r.shells.filter(x => x.S.creator == null).map(x => x.pairCur);
  check('control the flight row (KD3\'s play on L4 M26: from 70): detected', !eq(made, N.KD3.spawns_at), made.join(' '));
}
{
  const rec = run(N.KF9), s = N.KF9.shells[1];
  const bad = Object.assign({}, s, { canonical: s.canonical.replace(/\nm5 /, '\nm5  '), sha256: s.sha256 });
  const c = compareShell(bad, rec.ordered[1], pelOf('em002_04'));
  check('control a corrupted text (KF9 shell01 27, move 5): detected', c.text !== '');
}

// ---- 6. --rom [n] [seed]: random scenarios on the ROM harness ------------------------------------------------------------
// n random plays (default 30): one of Dreadking's drawing actions, random joints 3 / 4 / 145, owner words / position / size /
// base scale, floor, rank, quest number -- the action run by the ROM's own action code (vrefs.py / arun.py, python +
// unicorn; env RATHIAN_VARIANTS_SCRATCH overrides the folder), every create on the entry's clip run as its shell, and the
// same play through stepShells: every shell's canonical text line by line.
const ROM_PY = String.raw`
import sys, os, json
sys.path.insert(0, os.environ.get('RATHIAN_VARIANTS_SCRATCH', r'C:\MHGU-Extract\efx\agents\rathian-variants-scratch'))
import vrefs as VR
arun, V, H, R = VR.arun, VR.V, VR.H, VR.R
out = {}
for sc in json.load(sys.stdin):
    v = sc['monster']
    var, ids = V.IDS[v]
    V.use(v)
    o = sc['owner']
    VR.SNAP.clear()
    def prep(sc=sc):
        H.w16(H.BLOCK + 0x3b4, 0)
    J = {int(g): m for g, m in sc['joints'].items()}
    r = arun.run(v, sc['action'][1], steps=sc['steps'], rank=sc['rank'], quest=sc['quest'], slot7=0,
                 owner=dict(X=o['X'], Y=o['Y'], Z=o['Z'], pos=o['pos'], sc=o['sc'], base=o['base'], y5c=o['y5c']),
                 joints=J, target=sc['target'], floor=o['ground'], status=sc['action'][0], prep=prep)
    snaps = list(VR.SNAP)
    rec = {'texts': [], 'made': [], 'owners': [], 'faults': [str(x) for x in r['faults']]}
    scd = {'v': v, 'o': dict(o, pos=tuple(o['pos']), sc=tuple(o['sc'])), 'T': tuple(sc['target']), 'ground': o['ground'], 'J': J, 'rank': sc['rank']}
    shells = []
    for (k, mid, p, c, s), sn in zip(r['creates'], snaps):
        if mid != sc['mid']: continue
        rec['made'].append([s['id'], s['mode'], c])
        rec['owners'].append({'pair': [p, c], 'owner_pos': sn['pos'], 'ground': sn['ground'], 'y5c': sn['y5c']})
        VR.setup_for_shells(scd)
        H.uc.mem_write(H.OWNER, sn['mem'][0]); H.uc.mem_write(H.BLOCK, sn['mem'][1])
        VR.KIND.clear(); VR.KIND.update({ids[0]: 'shell00', ids[1]: 'shell01', ids[2]: 'shell11'})
        VR.run_any(s, sc['floor'], shells)
    rec['texts'] = [x['canonical'] for x in shells if x.get('init_alive') is not False]
    out[sc['name']] = rec
print(json.dumps(out))
`;
const ri = process.argv.indexOf('--rom');
if (ri > 0){
  const n = Number(process.argv[ri + 1]) || 30, seed = Number(process.argv[ri + 2]) || 1;
  console.log(`== 6. ${n} random plays (seed ${seed}) on the ROM harness, every shell's canonical text line by line`);
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const uni = (a, b) => a + (b - a) * rnd(), pick = L => L[Math.floor(rnd() * L.length)], int = (a, b) => a + Math.floor(rnd() * (b - a));
  const matrix = (lo = 50, hi = 1400) => {
    const yw = uni(-3.2, 3.2), pt = uni(-1.5, 1.5), rl = uni(-3.2, 3.2), sc = pick([1.0, 1.0, uni(0.5, 2.0)]);
    const cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt), cr = Math.cos(rl), sr = Math.sin(rl);
    const R = [[cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr], [-cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr], [sy * cp, -sp, cy * cp]];
    const m = [];
    for (const r of R) m.push(...r.map(c => f(c * sc)), 0);
    m.push(f(uni(-800, 800)), f(uni(lo, hi)), f(uni(-800, 800)), 1);
    return m;
  };
  const acts = {};
  for (const mon of MONS)
    acts[mon] = SHELL_DATA[mon].actions.filter(a => a.pick === 'ai' && ((a.spawns && a.spawns.length) || (a.frames && a.frames.length)));
  const list = [];
  for (let i = 0; i < n; i++){
    const mon = MONS[i % MONS.length];
    const A = acts[mon], a = A[i < A.length ? i : int(0, A.length)];
    const floor = pick([0.0, 0.0, f(uni(-300, 400))]);
    const owner = { X: pick([0, 0, int(0, 0x10000)]), Y: int(0, 0x10000), Z: pick([0, 0, int(0, 0x10000)]),
                    pos: [f(uni(-1000, 1000)), pick([0.0, f(uni(-200, 900))]), f(uni(-1000, 1000))],
                    sc: [pick([1.0, f(uni(0.8, 1.3))]), pick([1.0, f(uni(0.9, 1.2))])], base: pick([1.0, f(uni(0.8, 1.2))]),
                    y5c: pick([0.0, 0.0, f(uni(-60, 60))]), ground: 0.0 };
    owner.ground = floor;
    const joints = { 3: matrix(), 4: matrix(), 145: matrix() };
    const T = [f(uni(-3000, 3000)), f(uni(-300, 600)), f(uni(-3000, 3000))];
    const m = /^Motion\[(\d+)\]$/.exec(a.clip);
    list.push({ name: 'R' + i, monster: mon, action: a.action, variant: a.variant, mid: (Number(a.list) << 8) | Number(m[1]),
                clip: { list: a.list, motion: a.clip }, owner, joints, floor, target: T, rank: pick([1, 3, 5, 5]),
                quest: pick([0, 3, 6, 7, 9, 12, 40]), steps: 1000 });
  }
  const dir = mkdtempSync(join(tmpdir(), 'shells-rathalos-'));
  const py = join(dir, 'romrathalos.py');
  writeFileSync(py, ROM_PY);
  const r = spawnSync('python', [py], { input: JSON.stringify(list), encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) check('the ROM harness runs', false, (r.stderr || String(r.error)).slice(-1500));
  else {
    const rom = JSON.parse(r.stdout);
    let nS = 0, nM = 0;
    const cover = {};
    for (const c of list){
      const R0 = rom[c.name];
      if (R0.faults.length){ check(`${c.name} ${c.monster} ${c.variant}: the ROM run`, false, R0.faults.join(' ')); continue; }
      const sc = { name: c.name, monster: c.monster, action: c.action, clip: c.clip, creates: R0.owners,
                   inputs: { joints: c.joints, owner: c.owner, target: c.target, floorY: c.floor, rank: c.rank, questLevel: c.quest } };
      const maxF = R0.made.length ? Math.max(...R0.made.map(x => x[2])) : 240;
      const rec = run(sc, { steps: Math.min(maxF, 400) + 2 + 470 + 205 + 345 });
      const want = R0.texts, got = rec.ordered.map(x => x.text);
      for (const x of rec.ordered) cover[x.S.shell + ' ' + x.S.modeIndex] = (cover[x.S.shell + ' ' + x.S.modeIndex] || 0) + 1;
      const madeJ = rec.shells.filter(x => x.S.creator == null).map(x => [x.S.globalId, x.S.modeIndex, x.pairCur]);
      let detail = '';
      if (want.length !== got.length) detail = `${got.length} shells vs ROM ${want.length}; made ${JSON.stringify(madeJ)} vs ROM ${JSON.stringify(R0.made)}`;
      else for (let i = 0; i < want.length && !detail; i++){
        if (want[i] === got[i]) continue;
        const a = got[i].split('\n'), b = want[i].split('\n'), j = a.findIndex((x, k) => x !== b[k]);
        detail = `shell ${i}, line ${j + 1}:\n     js  ${a[j]}\n     rom ${b[j]}`;
      }
      nS += want.length;
      nM += got.reduce((t, x) => t + (x.match(/^m\d+ /gm) || []).length, 0);
      check(`${c.name} ${c.monster} ${c.variant} L${c.clip.list} ${c.clip.motion}, rank ${c.rank}, quest ${c.quest}, floor ${c.floor}: ${want.length} shells identical to the ROM`,
            !detail, detail);
    }
    console.log(`   (${nS} shells, ${nM} moves compared)`);
    console.log('   shells by kind and mode: ' + Object.entries(cover).sort().map(([k, v]) => `${k}: ${v}`).join(', '));
  }
}

// ---- 7. --emc: the op-0x24 marks from the command table ----------------------------------------------------------------
// every site of a status-7 action in the monster's .emc and the op-0x24 branch around it (group-1 streams no op 0x14
// calls are not issued); an action's mark is the one branch all its issued sites share, none when they mix or sit
// outside any op 0x24, none when no stream issues it
const EMC_PY = String.raw`
import sys, os, json, collections
sys.path.insert(0, os.environ.get('RATHIAN_EMC_SCRATCH', r'C:\MHGU-Extract\efx\agents\state-scratch'))
import emc
out = {}
for name, path in json.load(sys.stdin).items():
    ver, groups = emc.load(path)
    called = set()
    for ss in groups:
        for s in ss:
            for o in emc.parse(s):
                b = o.split(' ')
                if b[0] == '14' and len(b) == 2: called.add(int(b[1], 16))
    sites = collections.defaultdict(list)
    for g, ss in enumerate(groups):
        for k, s in enumerate(ss):
            stack = []
            for o in emc.parse(s):
                b = o.split(' ')
                op = int(b[0], 16)
                if op == 0xff and len(b) == 1: continue
                if len(b) >= 2 and op not in (0x00, 0x14):
                    a = int(b[1], 16)
                    if a == 0x00 and len(b) <= 3: stack.append([op, 'if' if op == 0x24 else 'open']); continue
                    if a == 0x01 and stack and stack[-1][0] == op: stack[-1][1] = 'case'; continue
                    if a == 0x02 and stack and stack[-1][0] == op: stack[-1][1] = 'else' if op == 0x24 else 'default'; continue
                    if a == 0xff and stack and stack[-1][0] == op: stack.pop(); continue
                if op == 0x00 and len(b) == 3 and int(b[1], 16) == 7:
                    c24 = [x[1] for x in stack if x[0] == 0x24]
                    sites[int(b[2], 16)].append({'at': 'g%d s%d' % (g, k), 'branch': c24[-1] if c24 else 'none',
                                                 'called': g != 1 or k in called})
    out[name] = sites
print(json.dumps(out))
`;
if (process.argv.includes('--emc')){
  console.log('== 7. the op-0x24 branch of every status-7 pick action, from the monster\'s own command table');
  const files = { em002_04: String.raw`C:\MHGU-Extract\scratch-em\em002_04\enemy\cmd_tbl\em001_00_cmdtbl.emc` };
  const dir = mkdtempSync(join(tmpdir(), 'shells-rathalos-emc-'));
  const py = join(dir, 'emcbranch.py');
  writeFileSync(py, EMC_PY);
  const r = spawnSync('python', [py], { input: JSON.stringify(files), encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) check('the EMC scan runs', false, (r.stderr || String(r.error)).slice(-800));
  else {
    const E = JSON.parse(r.stdout);
    const branchOf = (id, n) => {
      const S = (E[id][n] || []).filter(x => x.called);
      if (!S.length) return 'no stream';
      const b = [...new Set(S.map(x => x.branch))];
      return b.length === 1 && b[0] !== 'none' ? b[0] : undefined;
    };
    const where = (id, n) => (E[id][n] || []).map(x => `${x.at}${x.called ? '' : ' (uncalled)'} ${x.branch}`).join(', ');
    const seen = new Set();
    for (const a of SHELL_DATA.em002_04.actions.filter(x => x.action[0] === 7 && x.pick === 'ai')){
      if (seen.has(a.variant)) continue;
      seen.add(a.variant);
      const n = a.action[1], b = branchOf('em002_04', n);
      const want = b === 'no stream' ? undefined : b;
      check(`(7, 0x${n.toString(16).padStart(2, '0')}) ${a.variant}: op24 ${a.op24 || 'none'} = the command table's (${b || 'mixed / none'})`,
            a.op24 === want, where('em002_04', n) || 'issued by no stream');
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

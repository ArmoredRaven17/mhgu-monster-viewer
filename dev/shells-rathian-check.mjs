// Rathian's shells in render/shells.js -- em001_00: shell00 = uShellEm001_sp_00 : uShellEmBase00 (the fireballs), shell01 =
// uShellEm001_sp_01 : uShellEmBase01 (ground fire, explosions, landing dust, breath puffs, hit volumes), shell11 =
// uShellEm001_sp_11 : uShellEmBase11 : uShellEmBase01 (the explosion timer) -- against the ROM.
//
//   1. THE ROM'S REFERENCE RUNS: C:\MHGU-Extract\efx\agents\rathian-shell-scratch\rathian-shell-reference.json (env
//      RATHIAN_REF overrides), made by rrefs.py on the Unicorn harness rharness.py + rspawn.py: the ROM's own spawn helpers
//      (0xd0a134 / 0xd0a394 / 0xd0a614 / 0xd0b638 / 0xd0b0b8 / 0xd0baec) and per-frame handler 0xcf1a5c, every shell's ctor,
//      init (vtable +0x13c) and move (+0x24) to its end, every shell a shell creates. 21 scenarios, 66 shells. Each
//      scenario runs through stepShells as the viewer steps it: the clip one frame per step from 0, input.rock.variant =
//      the action ('7:0x02' ...), the scenario's joints, owner block (words, position, size, base scale, block +0x5c,
//      ground), target, floor and rank. Every shell -- in the reference's order: each root in spawn order, then the shells
//      it made, depth first -- is compared field by field (setup, reader params, spawn state, init effect starts, every move,
//      every event) bit for bit (float32 hex), and its canonical text against the reference's text and sha256.
//   2. The module's contract: pickVariantsFor per clip, not tired / tired (the op-0x24 if / else, 0x86fac / 0x81634) and
//      variantActionFor (blend partners included; Savage's and Nargacuga's unchanged whatever the opts), the spawn step and the joints each spawn reads, the line-18 rule for shells made by shells,
//      what render/rom/effect/schedule.js reads, the inputs that are not read (refusals), the rank switch, the flag-driven
//      dust, the hit-slot life (input.hitLife), the endings.
//   3. CONTROLS: deliberately wrong inputs (facing, joints, action, floor, target, owner words, position, size, base
//      scale, block +0x5c, rank, hit life) and a corrupted text must FAIL the comparison -- so a PASS above is not blind.
//   4. --rom [n] [seed]: n random scenarios (default 40) run on the ROM harness itself (python + unicorn; env
//      RATHIAN_SCRATCH overrides its folder) and through stepShells, every shell's canonical text compared line by line.
//   5. --emc: every pick action's op-0x24 branch (tired / not) derived from the command tables themselves (python + the
//      EMC agent's emc.py) against SHELL_DATA's op24 marks; Savage's and Nargacuga's picks shown not to depend on it.
//
//   node dev/shells-rathian-check.mjs [--rom [n] [seed]] [--emc] [--print <scenario> <index>]
//
// Exit code 1 when anything fails.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createShellState, stepShells, pickVariantsFor, variantActionFor, actionFor, rockActionFor, ROCK_VARIANTS, SHELL_DATA }
  from '../docs/render/shells.js';

const REF = process.env.RATHIAN_REF || String.raw`C:\MHGU-Extract\efx\agents\rathian-shell-scratch\rathian-shell-reference.json`;
const ref = JSON.parse(readFileSync(REF, 'utf8'));

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

const PEL = { 0: 'em001_00c', 1: 'em001_00u' }, LIST = { 0: 'c', 1: 'u' };
const actionName = a => '7:0x' + a[1].toString(16).padStart(2, '0');

// ---- a scenario through stepShells, as the viewer steps it ------------------------------------------------------------
// the joint lookup the harness builds (set_joints): mapped gids; gid 0, unmapped, is the first mapped one (0xc15a4 falls
// back to gid 0, which the harness maps to index 0)
function jointsOf(J){
  const M = {};
  for (const [g, m] of Object.entries(J)) M[Number(g)] = m.map(f);
  const first = Math.min(...Object.keys(M).map(Number));
  return gid => M[gid] || (gid === 0 ? M[first] : null);
}

// the inputs of a reference scenario (sc.inputs), with overrides: { variant, action, clip, clipAt, frameAt, steps, joints
// (gid => m) | jointsAt (step => gid => m), owner (partial owner block), target, floor, ground, rank, hitLife, stepCount
// (step => n: the schedule's step counter, default step + 1; null = not given), posture (the checks' override of P+0x1ba),
// noRock, noOwner, noPos, effectAlive (step, S, param, h) }
function run(sc, opts = {}){
  const st = createShellState('em001_00');
  const inp = sc.inputs;
  const own = Object.assign({}, inp.owner, opts.owner || {});
  const floor = opts.floor !== undefined ? opts.floor : inp.floorY;
  // block +0x5b4: the harness writes floorY there unless there is no floor (-1e9), then the owner's own ground
  const ground = opts.ground !== undefined ? opts.ground : (floor < -1e8 ? own.ground : floor);
  const J = opts.joints || jointsOf(inp.joints);
  const T = opts.target !== undefined ? opts.target : (inp.target || null);
  const variant = opts.variant !== undefined ? opts.variant : (sc.action ? actionName(sc.action) : null);
  const clip = opts.clip || sc.clip.motion, list = sc.clip.list;
  const steps = opts.steps || stepsFor(sc);
  const rec = { shells: [], outs: [], refused: [], byId: new Map() };
  for (let step = 0; step < steps; step++){
    const input = { monId: 'em001_00', list, clip: opts.clipAt ? opts.clipAt(step) : clip, frame: opts.frameAt ? opts.frameAt(step) : step,
                    joints: opts.jointsAt ? opts.jointsAt(step) : J, rage: false,
                    rock: opts.noRock ? undefined : { variant, target: T ? { x: T[0], y: T[1], z: T[2] } : null, floorY: floor },
                    owner: opts.noOwner ? undefined : { x: own.X, y: own.Y, z: own.Z },
                    ownerPos: opts.noPos ? undefined : { x: own.pos[0], y: own.pos[1], z: own.pos[2] },
                    ground, size: own.sc, baseScale: own.base, y5c: own.y5c,
                    rank: opts.rank !== undefined ? opts.rank : inp.rank };
    if (opts.action) input.action = opts.action;
    // the viewer's step count since mount, this step included (the schedule's `frame`): the hover dust's timer
    const n = opts.stepCount === null ? null : opts.stepCount ? opts.stepCount(step) : step + 1;
    if (n != null) input.stepCount = n;
    if (opts.posture != null) input.posture = opts.posture;
    if (opts.hitLife) input.hitLife = true;
    if (opts.effectAlive) input.effectAlive = (S, p, h) => opts.effectAlive(step, S, p, h);
    const pairCur = st.hist ? st.hist[1] : null;          // F[k-1]: the frame the spawn tests read this step
    const out = stepShells(st, input);
    rec.outs.push(out);
    for (const r of out.refused) rec.refused.push(Object.assign({ step }, r));
    for (const S of out.spawned){
      const r = { S, spawnStep: step, pairCur, moves: [], endMove: null, endStep: null, removedStep: null, firstMoveStep: null };
      rec.shells.push(r);
      rec.byId.set(S.id, r);
    }
    for (const r of rec.shells){
      const S = r.S;
      if (out.removed.includes(S) && r.removedStep == null) r.removedStep = step;
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
function stepsFor(sc){
  const fr = sc.spawner && sc.spawner.frames ? Math.max(...sc.spawner.frames) : 100;
  return Math.min(fr, 400) + 2 + 180 + 205 + 40;
}

// the reference's order: each root (made by no shell) in spawn order, followed by the shells it made, depth first
function ordered(rec){
  const out = [];
  const walk = r => { out.push(r); for (const c of rec.shells) if (c.S.creator === r.S.id) walk(c); };
  for (const r of rec.shells) if (r.S.creator == null) walk(r);
  return out;
}

// the canonical text (rrefs.py's lines)
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

// ---- one shell against the ROM's -----------------------------------------------------------------------------------------
// returns { setup, params, spawn, init, moves, events, text }: each '' when identical, else the first difference
function compareShell(s, r, parentIdx){
  const res = {};
  const S = r && r.S;
  if (!S){ for (const k of ['setup', 'params', 'spawn', 'init', 'moves', 'events', 'text']) res[k] = 'no such shell'; return res; }
  const su = s.setup, mine = S.setup;
  res.setup = (su.id === S.globalId && su.mode === S.modeIndex && (s.kind === 'shell00' || (sameF(mine.position, su.pos) && sameW(mine.angles, su.angles30))))
    ? '' : `setup id ${S.globalId.toString(16)} mode ${S.modeIndex} ${v3(mine.position)} ${a3(mine.angles)} vs ROM ${su.id.toString(16)} ${su.mode} ${v3(su.pos)} ${a3(su.angles30)}`;
  if (parentIdx !== undefined && s.parent != null){
    const want = s.created_at_move;
    if (S.createdAtMove !== want) res.setup += ` created at move ${S.createdAtMove} vs ROM ${want}`;
  }
  const P = s.params, k = S.k, bad = [];
  if (s.kind === 'shell00'){
    if (k.flags !== P.flags15e8) bad.push(`flags 0x${k.flags.toString(16)} vs 0x${P.flags15e8.toString(16)}`);
    if (k.joint !== P.joint15dc) bad.push(`joint ${k.joint} vs ${P.joint15dc}`);
    if (k.i1 !== P.i15e0 || k.i2 !== P.i15e4) bad.push(`camera ids ${k.i1} ${k.i2} vs ${P.i15e0} ${P.i15e4}`);
    for (const [n, v] of [['x_deg15ec', k.xDeg], ['y_deg15f0', k.yDeg], ['speed15f4', k.vz], ['vy15f8', k.vy], ['flight15fc', k.flight],
                          ['xmin1600', k.xLo], ['xmax1604', k.xHi], ['aim_y1664', k.aimOff[1]]]) if (bits(v) !== bits(P[n])) bad.push(n);
  } else {
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
  // the init's effect starts, in order: the list and key the ROM started (or refused), the requester's point, and the
  // pel the list names (EffectLists[0] = em001_00c, [1] = em001_00u)
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
  // every move
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
  // every event, in ROM order
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
const refShells = sc => sc.shells.filter(s => s.canonical);
const identical = (sc, rec) => {
  const want = refShells(sc);
  if (sc.name === 'D5') return rec.ordered.length > 0 && rec.ordered.every(r => r.text === want[0].canonical);
  const got = sc.name === 'D6' ? rec.ordered.slice(0, want.length) : rec.ordered;
  return got.length === want.length && want.every((s, i) => got[i].text === s.canonical);
};

// ---- 1. the reference runs --------------------------------------------------------------------------------------------
console.log(`== 1. the ROM's reference runs (${REF})`);
const runs = {};
let nShells = 0, nMoves = 0;
for (const sc of ref.scenarios){
  // D6 is the harness's L2 M12 run with posture 3 forced (block +0x1ba); in Rathian's play L2 M12 has posture 1 (section 2)
  const rec = runs[sc.name] = run(sc, sc.name === 'D6' ? { posture: 3 } : {});
  const want = refShells(sc);
  const tag0 = `${sc.name} ${sc.action ? `(7, 0x${sc.action[1].toString(16)}) ` : ''}${sc.clip.list === '0' ? 'L0' : 'L' + sc.clip.list} ${sc.clip.motion}`;
  if (sc.name === 'B3'){
    // rank 3: 0xd0baec makes modes 31 / 32 / 33 (0x1f..0x21), which have no ShellInfoList files: they read -1 / 0.0 / the
    // zero vector and start nothing (the reference records their setups only)
    const got = rec.ordered;
    check(`${tag0}: rank 3 -> shell01 modes ${sc.shells.map(s => s.mode).join(' ')} at frames ${sc.shells.map(s => s.spawn_frame).join(' ')} (no files: nothing started)`,
          got.length === sc.shells.length && sc.shells.every((s, i) => {
            const r = got[i];
            return r.S.modeIndex === s.mode && r.S.globalId === s.id && r.pairCur === s.spawn_frame && sameF(r.S.setup.position, s.setup.pos) &&
                   sameW(r.S.setup.angles, s.setup.angles30) && r.S.start === null && r.S.initEvents.length === 0 && r.S.mode === null;
          }), got.map(r => `m${r.S.modeIndex}@${r.pairCur} start ${!!r.S.start}`).join(', '));
    continue;
  }
  if (sc.name === 'D4'){
    check(`${tag0}: the owner 1000 above its ground -> 0xd09e28 makes nothing (block +0x44 > block +0x5b4 + 900)`,
          rec.shells.length === 0 && want.length === 0 && rec.refused.length === 0, `${rec.shells.length} shells`);
    continue;
  }
  let got = rec.ordered;
  if (sc.name === 'D5'){
    // L1 M1: mode 13 whenever block +0x74 (ctl+0x14) is set -- the harness set it for its one call; here it is the ROM's
    // pulse, one step in 100 (stepCount 100, 200, ...), and every pulse's shell is the reference's (the owner does not move)
    const at = rec.shells.map(r => r.spawnStep + 1);
    check(`${tag0}: the pulse -> one mode-13 dust at steps ${at.join(' ')} (every 100th), each the ROM's text`,
          at.length === Math.floor(rec.outs.length / 100) && at.every((n, i) => n === 100 * (i + 1)) &&
          rec.shells.every(r => r.S.modeIndex === 13 && r.text === want[0].canonical), at.join(' '));
    got = got.slice(0, 1);
  }
  if (sc.name === 'D6'){
    const at = rec.shells.map(r => r.pairCur);
    check(`${tag0}: posture 3 (forced, as the harness did) -> mode 15 every 16 frames from frame 24: at ${sc.spawns_at.join(' ')} (the ROM's)`,
          eq(at.filter(x => x <= 90), sc.spawns_at), at.join(' '));
    got = got.slice(0, want.length);
  }
  check(`${tag0}: ${want.length} shells in the ROM's order (${want.map(s => `${s.kind.slice(5)}m${s.mode}`).join(' ')})`,
        got.length === want.length && want.every((s, i) => got[i] && got[i].S.modeIndex === s.mode && got[i].S.globalId === s.id),
        got.map(r => `${r.S.shell.slice(5)}m${r.S.modeIndex}`).join(' '));
  want.forEach((s, i) => {
    const r = got[i], c = compareShell(s, r, i), tag = `${sc.name} #${i} ${s.kind} mode ${s.mode}`;
    nShells++; nMoves += s.moves.length;
    // (D5's row has no frame test: its pulse, not the clip's frame, decides the step -- checked above)
    if (s.parent == null && s.spawn_frame != null && sc.name !== 'D5')
      check(`${tag}: made at the step whose frame pair is (${s.spawn_frame - 1}, ${s.spawn_frame}]`, !!r && r.pairCur === s.spawn_frame, r && `F[k-1] = ${r.pairCur}`);
    check(`${tag}: setup (id 0x${s.setup.id.toString(16)}, mode, point, angle words${s.parent != null ? ', made at move ' + s.created_at_move : ''})`, c.setup === '', c.setup);
    check(`${tag}: reader params`, c.params === '', c.params);
    check(`${tag}: spawn state (init)`, c.spawn === '', c.spawn);
    check(`${tag}: init effects (${s.events_init.map(e => e.ev === 'start' ? `${LIST[e.list]} ${e.key}` : 'refused').join(', ') || 'none'})`, c.init === '', c.init);
    check(`${tag}: ${s.moves.length} moves identical`, c.moves === '', c.moves);
    const last = s.moves[s.moves.length - 1];
    check(`${tag}: events (${s.moves.flatMap(m => m.events.map(e => e.ev)).filter((x, j, A) => A.indexOf(x) === j).join(', ') || 'none'}) to move ${last ? last.k : 0}`, c.events === '', c.events);
    check(`${tag}: canonical text = the ROM's (sha256 ${s.sha256.slice(0, 16)}...)`, c.text === '', c.text);
  });
}
console.log(`   (${nShells} shells, ${nMoves} moves compared)`);
const pr = process.argv.indexOf('--print');
if (pr > 0){
  const rec = runs[process.argv[pr + 1]], i = Number(process.argv[pr + 2]);
  if (rec && rec.ordered[i]) process.stdout.write(rec.ordered[i].text);
}

// ---- 2. the module's contract -------------------------------------------------------------------------------------------
console.log('== 2. variants, spawn step and joints, the line-18 rule, schedule fields, inputs, rank, dust, hit life, endings');
const N = Object.fromEntries(ref.scenarios.map(sc => [sc.name, sc]));
{
  // THE PICK LISTS. The command table's op 0x24 if / else (0x86fac: the `24 00` body when 0x81634 != 0 -- not enraged and
  // +0x505 in {1, 2, 3}) chooses each fire action or its no-fire twin: not tired -> the fire actions, tired (and not
  // enraged) -> the twins. L4 M16's (7, 0x3a) / (7, 0x47) are the else bodies of g1 s59 / s91, whose if bodies issue (7,
  // 0x10) on another clip: none while tired. L4 M65's choice is not op 0x24's (not read): all four either way.
  const pv = (l, c, o) => pickVariantsFor('em001_00', l, c, o);
  const TIRED = { tired: true };
  const cases = [
    ['2', 'Motion[5]', ['7:0x02'], ['7:0x0f']], ['2', 'Motion[15]', ['7:0x02'], ['7:0x0f']], ['2', 'Motion[16]', ['7:0x02'], ['7:0x0f']],
    ['2', 'Motion[18]', ['7:0x0a'], ['7:0x0b']], ['2', 'Motion[17]', ['7:0x0a'], ['7:0x0b']],
    ['4', 'Motion[8]', ['7:0x08', '7:0x6b'], ['7:0x22', '7:0x6c']], ['4', 'Motion[53]', ['7:0x6b'], ['7:0x6c']], ['4', 'Motion[54]', ['7:0x6b'], ['7:0x6c']],
    ['4', 'Motion[16]', ['7:0x3a', '7:0x47'], []],
    ['4', 'Motion[65]', ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a'], ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a']],
  ];
  for (const [l, c, calm, tired] of cases){
    check(`pickVariantsFor(em001_00, ${l}, ${c}) not tired = ${calm.join(' ')} (default and { tired: false })`,
          eq(pv(l, c), calm) && eq(pv(l, c, {}), calm) && eq(pv(l, c, { tired: false }), calm), pv(l, c).join(' '));
    check(`pickVariantsFor(em001_00, ${l}, ${c}, { tired: true }) = ${tired.join(' ') || 'none'}`, eq(pv(l, c, TIRED), tired), pv(l, c, TIRED).join(' ') || 'none');
    check(`pickVariantsFor(em001_00, ${l}, ${c}, { tired: true, rage: true }) = the not-tired list (0x81634 is 0 while enraged)`,
          eq(pv(l, c, { tired: true, rage: true }), calm) && eq(pv(l, c, { tired: false, rage: true }), calm), pv(l, c, { tired: true, rage: true }).join(' '));
  }
  check('pickVariantsFor takes _start / _loop, tired or not; the dust clips and other clips have none (L1 M4, L4 M9, L2 M12, L4 M7, L0 M1)',
        eq(pv('2', 'Motion[5]_loop'), ['7:0x02']) && eq(pv('2', 'Motion[5]_loop', TIRED), ['7:0x0f']) &&
        eq(pv('4', 'Motion[65]_start'), ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a']) &&
        ['1:Motion[4]', '4:Motion[9]', '2:Motion[12]', '4:Motion[7]', '0:Motion[1]', '2:Motion[8]'].every(x => { const [l, c] = x.split(':'); return pv(l, c).length === 0 && pv(l, c, TIRED).length === 0; }));
  // the table's marks: each twin is the 'if' branch of the same helper, clip and frames as its fire action, which is 'else'
  const A = SHELL_DATA.em001_00.actions, byNo = n => A.find(a => a.action[1] === n);
  const pairs = [[0x0f, 0x02], [0x0b, 0x0a], [0x22, 0x08], [0x6c, 0x6b]];
  check('SHELL_DATA: the twins (7, 0x0f / 0x0b / 0x22 / 0x6c) are op24 \'if\', each on its fire action\'s helper (r1 1 for r1 0), clip, partners and frames; the fire actions \'else\'',
        pairs.every(([t, fa]) => { const x = byNo(t), y = byNo(fa);
          return x.op24 === 'if' && y.op24 === 'else' && x.spawner === y.spawner && x.spawnArgs[0] === 1 && y.spawnArgs[0] === 0 &&
                 x.clip === y.clip && x.list === y.list && eq(x.partners, y.partners) && eq(x.frames, y.frames) && x.shell === 'shell01' && y.shell === 'shell00'; }));
  check('SHELL_DATA: (7, 0x3a) / (7, 0x47) op24 \'else\' (g1 s59 / s91); the L4 M65 actions carry no op24 (not an op-0x24 choice)',
        byNo(0x3a).op24 === 'else' && byNo(0x47).op24 === 'else' && [0x77, 0x7b, 0x76, 0x7a].every(n => byNo(n).op24 === undefined));
  // the tired pick drives the viewer: F1 with the tired variant makes only the hit volume (shell01 mode 0, nothing drawn)
  const tiredF1 = run(N.F1, { variant: pv('2', 'Motion[5]', TIRED)[0], steps: 90 });
  check('F1 with the tired pick (7:0x0f): only shell01 mode 0 at frame 78, no fireball, nothing started',
        tiredF1.shells.length === 1 && tiredF1.shells[0].S.shell === 'shell01' && tiredF1.shells[0].S.modeIndex === 0 && tiredF1.shells[0].pairCur === 78 &&
        !tiredF1.shells[0].S.start, tiredF1.shells.map(r => `${r.S.shell} m${r.S.modeIndex}@${r.pairCur}`).join(' '));
  // Savage and Nargacuga: the same lists, tired, enraged or not (Savage's op-0x24 branches throw the same rock; no op 0x24
  // issues Nargacuga's spikes)
  const clipsOf = id => [...new Set(SHELL_DATA[id].actions.flatMap(a => [a.clip, ...(a.partners || [])].map(c => a.list + '|' + c)))];
  const optsList = [undefined, {}, { tired: false }, { tired: true }, { tired: true, rage: true }, { rage: true }];
  check('Savage and Nargacuga: pickVariantsFor is the same for every clip of theirs whatever opts (tired / rage)',
        ['em043_05', 'em037_00'].every(id => clipsOf(id).every(k => { const [l, c] = k.split('|'); const base = pickVariantsFor(id, l, c);
          return optsList.every(o => eq(pickVariantsFor(id, l, c, o), base)); })) &&
        SHELL_DATA.em043_05.actions.every(a => a.op24 === undefined) && SHELL_DATA.em037_00.actions.every(a => a.op24 === undefined));
  const main = (l, c, v) => variantActionFor('em001_00', l, c, v);
  check('a blend partner clip names its main clip\'s action (M15 / M16 -> (7, 0x02); M17 -> (7, 0x0a); M53 -> (7, 0x6b)); (7, 0x08) has no partner',
        main('2', 'Motion[15]', '7:0x02') === main('2', 'Motion[5]', '7:0x02') && main('2', 'Motion[16]', '7:0x0f') === main('2', 'Motion[5]', '7:0x0f') &&
        main('2', 'Motion[17]', '7:0x0a') === main('2', 'Motion[18]', '7:0x0a') && main('4', 'Motion[53]', '7:0x6b') === main('4', 'Motion[8]', '7:0x6b') &&
        main('4', 'Motion[53]', '7:0x08') === null && main('2', 'Motion[5]', '7:0x08') === null && !!main('2', 'Motion[5]', '7:0x02'));
  check('actionFor(em001_00, ...) is null without a force (the AI\'s pick is NOT READ); a forced action is found on a partner clip',
        actionFor('em001_00', '2', 'Motion[5]', false) === null && actionFor('em001_00', '2', 'Motion[15]', true) === null &&
        actionFor('em001_00', '2', 'Motion[16]', false, [7, 0x02]) === main('2', 'Motion[5]', '7:0x02'));
  const eqs = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  check('Savage and Nargacuga unchanged: ROCK_VARIANTS, rock clips, spike clip, rockActionFor = variantActionFor',
        eqs(ROCK_VARIANTS, ['shell00_0', 'shell00_8', 'shell54_0']) && eqs(pickVariantsFor('em043_05', '2', 'Motion[24]'), ROCK_VARIANTS) &&
        eqs(pickVariantsFor('em043_05', '2', 'Motion[23]'), ROCK_VARIANTS) && pickVariantsFor('em043_05', '2', 'Motion[25]').length === 0 &&
        eqs(pickVariantsFor('em037_00', '2', 'Motion[8]'), ['7:0x28', '7:0x29', '7:0x2a', '7:0x2b', '7:0x2c', '7:0x35', '7:0x3a', '7:0x82', '7:0x84']) &&
        ['Motion[23]', 'Motion[24]'].every(c => ROCK_VARIANTS.every(v => rockActionFor('em043_05', '2', c, v) === variantActionFor('em043_05', '2', c, v))));
  // the partner clips give the main clip's flights
  const same = (a, b) => a.ordered.length === b.ordered.length && a.ordered.every((r, i) => r.text === b.ordered[i].text);
  check('F1 played on L2 Motion[15] and Motion[16] (the blend partners) = the Motion[5] run, text for text',
        same(run(N.F1, { clip: 'Motion[15]' }), runs.F1) && same(run(N.F1, { clip: 'Motion[16]' }), runs.F1));
  check('F7 on L4 Motion[53] / Motion[54] = on Motion[8]; F5 on L2 Motion[17] = on Motion[18]',
        same(run(N.F7, { clip: 'Motion[53]' }), runs.F7) && same(run(N.F7, { clip: 'Motion[54]' }), runs.F7) && same(run(N.F5, { clip: 'Motion[17]' }), runs.F5));
}
{
  // the spawn reads the joints of the pose before the one shown (the action code runs before the advance): a joint 3 that
  // moves with the frame launches F1's fireball from pose 78's (spawn step 79)
  const I = N.F1.inputs.joints['3'];
  const moving = step => gid => (gid === 3 || gid === 0) ? I.map((x, i) => i === 14 ? f(300 + step) : f(x)) : null;
  const r = run(N.F1, { jointsAt: moving, steps: 82 });
  const p = r.shells[0] && r.shells[0].S.launch.point;
  check('the fireball\'s init reads joint 3 of pose 78 (spawn step 79): launch z = (300 + 78) + 80', !!p && p[2] === f(f(300 + 78) + 80), p && `z ${p[2]}`);
  const I4 = N.B1.inputs.joints['4'];
  const moving4 = step => gid => gid === 4 ? I4.map((x, i) => i === 12 ? f(40 + step) : f(x)) : (gid === 3 || gid === 0) ? N.B1.inputs.joints['3'].map(f) : null;
  const b = run(N.B1, { jointsAt: moving4, steps: 72 });
  const q = b.shells[0] && b.shells[0].S.position, q0 = runs.B1.ordered[0].S.position;
  check('a breath puff\'s init reads joint 4 of pose 68 (spawn step 69): x = B1\'s + 68', !!q && q[0] === f(q0[0] + 68), q && `x ${q[0]} vs ${q0[0]}`);
  check('every action spawn happens at the step after its frame (pair (F-1, F]) and moves in that step (line 4 before line 18)',
        ['F1', 'F4', 'F5', 'F7', 'F8', 'B1', 'N1'].every(n => runs[n].shells.filter(r => r.S.creator == null).every(r => r.spawnStep === r.pairCur + 1 && r.firstMoveStep === r.spawnStep)));
}
{
  // THE LINE-18 RULE (0xc03670 appends at the tail; 0xc04728 reads next before running the unit): F1's single fireball is
  // the last unit when it lands, so the shells it makes first move the next step; with another shell after it, the same step
  const r = runs.F1, fb = r.shells[0], kids = r.shells.filter(x => x.S.creator === fb.S.id);
  check('F1: the fireball (the last unit) lands at step ' + fb.endStep + '; its shell01 modes 1 / 2 are made then and first move the next step',
        kids.length === 2 && kids.every(k => k.spawnStep === fb.endStep && k.firstMoveStep === fb.endStep + 1), kids.map(k => `m${k.S.modeIndex} made ${k.spawnStep} moves ${k.firstMoveStep}`).join(', '));
  const r4 = runs.F4, f1 = r4.shells.find(x => x.S.modeIndex === 1 && x.S.shell === 'shell00');
  const k4 = r4.shells.filter(x => x.S.creator === f1.S.id);
  check('F4: fireball mode 1 lands with mode 2 flying after it in the list: its shells move in the landing step',
        k4.length === 2 && k4.every(k => k.spawnStep === f1.endStep && k.firstMoveStep === f1.endStep), k4.map(k => `m${k.S.modeIndex} made ${k.spawnStep} moves ${k.firstMoveStep}`).join(', '));
  const r8 = runs.F8, s11 = r8.shells.find(x => x.S.shell === 'shell11'), x6 = r8.shells.find(x => x.S.creator === s11.S.id && x.S.modeIndex === 6);
  const fire = r8.shells.find(x => x.S.shell === 'shell01' && x.S.modeIndex === 2);
  check('F8: shell11 and the fire move first the step after the landing; the explosion shell11 makes at its move 1 moves in that step (the fire is after shell11)',
        s11.firstMoveStep === s11.spawnStep + 1 && fire.firstMoveStep === s11.spawnStep + 1 && x6.spawnStep === s11.firstMoveStep && x6.firstMoveStep === x6.spawnStep,
        `shell11 made ${s11.spawnStep} moves ${s11.firstMoveStep}; mode 6 made ${x6.spawnStep} moves ${x6.firstMoveStep}`);
  const x9 = r8.shells.find(x => x.S.creator === s11.S.id && x.S.modeIndex === 9);
  check('F8: explosions at shell11 moves 1 / 17 / 27 / 37 (0x40308c: times 0 / 16 / 26 / 36 < elapsed), shell11 ends at 37',
        eq(r8.shells.filter(x => x.S.creator === s11.S.id).map(x => x.S.createdAtMove), [1, 17, 27, 37]) && s11.endMove === 37 && !!x9);
}
{
  // what render/rom/effect/schedule.js reads (stepShells): out.spawned's sh.start (pel / key / requester), sh.position /
  // sh.angles (the parent), sh.place (null), out.started (a landing's effect; sh.effect2), out.ended's sh.stop
  const r = runs.F1, fb = r.shells[0].S, st = fb.start;
  check('fireball: start = c.pel em001_00c key 0 at the launch point, parent shell, scale 1, no rotation (flags 0x40000000)',
        st.pel === 'em001_00c' && st.list === 'c' && st.key === 0 && st.requester.parent === 'shell' && st.requester.rotationDeg === null &&
        st.requester.scale.every(x => x === 1) && sameF(st.requester.position, fb.launch.position) && st.requester.flags14 === 0x40000000);
  const m8 = runs.F8.shells[0].S.start;
  check('fireball mode 8: start = u.pel em001_00u key 30', m8.pel === 'em001_00u' && m8.list === 'u' && m8.key === 30);
  check('never placed: every shell\'s place is null on every step (no 0x329c9c / 0x329d04 in 0xd0d928..0xd0f400)',
        Object.values(runs).every(x => x.outs.every(o => o.alive.every(s => s.place === null && !!s.position && !!s.angles))));
  const land = r.shells[0].moves[r.shells[0].moves.length - 1], ls = land.started[0], hit = land.events.find(e => e.ev === 'hit');
  check('landing: out.started has c 1 (em001_00c, em001_00_006) at the contact; effect2 holds it; out.ended has the fireball with stop { param 0, key 0 }',
        !!ls && ls.pel === 'em001_00c' && ls.key === 1 && ls.kind === 'landing' && ls.param === 2 && sameF(ls.requester.position, hit.point) &&
        fb.effect2 && fb.effect2.key === 1 && r.outs[r.shells[0].endStep].ended.includes(fb) && fb.stop && fb.stop.key === 0 && fb.stop.param === 0);
  const fire = r.shells.find(x => x.S.modeIndex === 2).S, fs = fire.start;
  check('the ground fire: in out.spawned at the landing step, start = c 3 (em001_00c) at the contact; out.ended at its move 201 with stop c 3',
        r.outs[r.shells[0].endStep].spawned.includes(fire) && fs.pel === 'em001_00c' && fs.key === 3 && sameF(fs.requester.position, hit.point) &&
        fire.stop && fire.stop.key === 3 && r.outs[r.shells.find(x => x.S === fire).endStep].ended.includes(fire));
  const ex = runs.F8.shells.filter(x => x.S.shell === 'shell01' && x.S.modeIndex >= 6 && x.S.modeIndex <= 9).map(x => x.S.start);
  check('the explosions: starts u 31 / 34 / 33 / 32 (em001_00u) at their points', eq(ex.map(q => q.pel + ' ' + q.key), ['em001_00u 31', 'em001_00u 34', 'em001_00u 33', 'em001_00u 32']));
  const d = runs.D1.shells[0].S.start, p = runs.B1.shells.map(x => x.S.start);
  check('dust mode 13: c 30 (em001_00c); puffs 44 / 45 / 46: u 61 / 61 / 62 (em001_00u)', d.pel === 'em001_00c' && d.key === 30 &&
        eq(p.map(q => q.pel + ' ' + q.key), ['em001_00u 61', 'em001_00u 61', 'em001_00u 62']));
  check('a created shell is not in out.created (it is stepped); refused params never start', Object.values(runs).every(x => x.outs.every(o => o.created.length === 0)));
}
{
  const sc = N.F2;
  const r1 = run(sc, { variant: null, steps: 110 });
  check('no variant: no fireball, nothing refused (the AI\'s pick is the viewer\'s)', r1.shells.length === 0 && r1.refused.length === 0);
  const r2 = run(sc, { floor: null, steps: 90 });
  check('no floor: refused', r2.shells.length === 0 && r2.refused.length === 1 && /floor/.test(r2.refused[0].why), r2.refused[0] && r2.refused[0].why);
  const r3 = run(sc, { noOwner: true, steps: 90 });
  check('no owner facing: refused', r3.shells.length === 0 && r3.refused.length === 1 && /facing/.test(r3.refused[0].why), r3.refused[0] && r3.refused[0].why);
  const r4 = run(sc, { target: null, steps: 90 });
  check('an aimed mode (0) without a target: refused', r4.shells.length === 0 && r4.refused.length === 1 && /target/.test(r4.refused[0].why), r4.refused[0] && r4.refused[0].why);
  const r5 = run(sc, { noPos: true, steps: 90 });
  check('an aimed mode without the owner position: refused', r5.shells.length === 0 && r5.refused.length === 1 && /position/.test(r5.refused[0].why), r5.refused[0] && r5.refused[0].why);
  const r6 = run(N.F4, { target: null, noPos: true });
  check('modes 1 / 2 / 3 (not aimed) read neither the target nor the owner position: the same flights without them',
        r6.ordered.length === runs.F4.ordered.length && r6.ordered.every((x, i) => x.text === runs.F4.ordered[i].text));
  const r7 = run(N.D1, { noPos: true, steps: 6 });
  check('dust without the owner position: refused', r7.shells.length === 0 && r7.refused.length === 1 && /position/.test(r7.refused[0].why), r7.refused[0] && r7.refused[0].why);
  const r8 = run(N.D1, { floor: null, ground: null, steps: 6 });
  check('dust without a ground: refused', r8.shells.length === 0 && r8.refused.length === 1 && /ground/.test(r8.refused[0].why), r8.refused[0] && r8.refused[0].why);
  const r9 = run(N.F2, { variant: 'shell00_0', steps: 90 });
  check('a Savage variant on Rathian: nothing', r9.shells.length === 0 && r9.refused.length === 0);
}
{
  // the rank switch (0x3a8430 > 4) and its default
  const noRank = run(N.B1, { rank: undefined });
  const b1 = runs.B1;
  check('input.rank absent = 5 (G rank): puffs 44 / 45 / 46, as B1', noRank.ordered.map(r => r.S.modeIndex).join() === '44,45,46' &&
        noRank.ordered.every((r, i) => r.text === b1.ordered[i].text));
  const r1 = run(N.B1, { rank: 1 });
  check('rank 1: modes 31 / 32 / 33 (no files: nothing drawn)', r1.ordered.map(r => r.S.modeIndex).join() === '31,32,33' && r1.ordered.every(r => !r.S.start));
  const r76 = run(N.B1, { variant: '7:0x76' }), r7a = run(N.B1, { variant: '7:0x7a' }), r7b = run(N.B1, { variant: '7:0x7b' });
  check('(7, 0x76) / (7, 0x7a) make no shell; (7, 0x7b) the same puffs as (7, 0x77)', r76.shells.length === 0 && r7a.shells.length === 0 &&
        r7b.ordered.length === 3 && r7b.ordered.every((r, i) => r.text === b1.ordered[i].text));
  const tw = ['7:0x22', '7:0x6c'].map(v => run(N.F4, { variant: v, steps: 170 }));
  check('the no-fire twins (7, 0x22) / (7, 0x6c) on L4 M8: shell01 mode 0 at 82 / 122 / 162 and 76 / 114 / 156, nothing drawn',
        eq(tw[0].shells.map(r => `${r.S.modeIndex}@${r.pairCur}`), ['0@82', '0@122', '0@162']) &&
        eq(tw[1].shells.map(r => `${r.S.modeIndex}@${r.pairCur}`), ['0@76', '0@114', '0@156']) && tw.every(t => t.shells.every(r => !r.S.start)),
        tw.map(t => t.shells.map(r => `${r.S.modeIndex}@${r.pairCur}`).join(' ')).join(' | '));
}
{
  // THE HOVER DUST (shared-state-effects.md 10): block +0x74 = ctl+0x14, the one-frame pulse of 0xcee250 every 100 moves of
  // a timer from the setup (the viewer's step count, input.stepCount); L1 M2 / M11 / M12 skip it in (4, 0x15) (0x6fe88);
  // L2 M12's needs posture 3, and its posture in Rathian's play is 1 (0xcff66c)
  const pv = (l, c, o) => pickVariantsFor('em001_00', l, c, o), TIRED = { tired: true };
  const D5text = N.D5.shells[0].canonical, hover = ['Motion[1]', 'Motion[2]', 'Motion[11]', 'Motion[12]'];
  const at100 = r => r.shells.map(x => x.spawnStep + 1);
  const pulses = hover.map(c => run(N.D5, { clip: c, steps: 450 }));
  check('the hover dust: on L1 M1 / M2 / M11 / M12, one mode-13 shell at steps 100 / 200 / 300 / 400 (the pulse), each D5\'s ROM text',
        pulses.every(r => eq(at100(r), [100, 200, 300, 400]) && r.shells.every(x => x.S.modeIndex === 13 && x.text === D5text && x.S.start && x.S.start.key === 30)),
        pulses.map((r, i) => `${hover[i]}: ${at100(r).join(' ')}`).join('; '));
  const phase = run(N.D5, { steps: 450, stepCount: step => step + 1 + 37 });
  check('the phase is the viewer\'s step count, not the clip: stepCount = step + 38 -> pulses at steps 63 / 163 / 263 / 363',
        eq(at100(phase), [63, 163, 263, 363]), at100(phase).join(' '));
  const own = run(N.D5, { steps: 450, stepCount: null });
  check('without input.stepCount: the module\'s own count of its calls (state.frames) -- the same pulses', eq(at100(own), [100, 200, 300, 400]), at100(own).join(' '));
  const t415 = ['Motion[2]', 'Motion[11]', 'Motion[12]'].map(c => run(N.D5, { clip: c, steps: 450, variant: '4:0x15' }));
  const f415 = ['Motion[2]', 'Motion[11]', 'Motion[12]'].map(c => run(N.D5, { clip: c, steps: 450, variant: null, action: [4, 0x15] }));
  const t404 = ['Motion[2]', 'Motion[11]', 'Motion[12]'].map(c => run(N.D5, { clip: c, steps: 450, variant: '4:0x04' }));
  check('(4, 0x15) named on L1 M2 / M11 / M12 (variant \'4:0x15\' or action [4, 0x15]): no dust; (4, 0x04) named: the pulses',
        t415.every(r => r.shells.length === 0) && f415.every(r => r.shells.length === 0) && t404.every(r => eq(at100(r), [100, 200, 300, 400])));
  const m1415 = run(N.D5, { clip: 'Motion[1]', steps: 450, variant: '4:0x15' });
  check('L1 M1 has no 0x6fe88 test (and no (4, 0x15)): the pulses whatever is named', eq(at100(m1415), [100, 200, 300, 400]));
  check('the hover turns are named only: pickVariantsFor(L1 M2 / M11 / M12) lists nothing, tired or not; variantActionFor finds 4:0x04 / 4:0x15',
        ['Motion[2]', 'Motion[11]', 'Motion[12]'].every(c => pv('1', c).length === 0 && pv('1', c, TIRED).length === 0 &&
          !!variantActionFor('em001_00', '1', c, '4:0x15') && !!variantActionFor('em001_00', '1', c, '4:0x04')) &&
        variantActionFor('em001_00', '1', 'Motion[1]', '4:0x15') === null);
  const high = run(N.D5, { steps: 450, owner: { pos: [55, 1000, 66] } });
  check('the hover dust keeps 0xd09e28\'s height test: the owner 1000 above its ground makes none', high.shells.length === 0);
  const m12 = run(N.D6, { steps: 450 }), m12p = run(N.D6, { steps: 450, posture: 3 });
  check('L2 M12: none in Rathian\'s play (posture 1 while it plays, 0xcff66c), pulses or not; with posture 3 forced, the ROM\'s D6 path (39, 55, 71, ...)',
        m12.shells.length === 0 && eq(m12p.shells.slice(0, 4).map(r => r.pairCur), [39, 55, 71, 87]) &&
        SHELL_DATA.em001_00.postures['2|Motion[12]'] === 1, `${m12.shells.length} / ${m12p.shells.slice(0, 4).map(r => r.pairCur).join(' ')}`);
  const hl = run(N.D5, { steps: 450, hitLife: true });
  check('with hitLife the hover dust (slot 1, record 12: 14, 10) lives 26 moves per pulse', hl.shells.every(r => r.endMove === 26) && hl.shells.length === 4);
  // the old input: a dustFlags object that asked for every-frame hover dust and posture 3 is ignored now
  const withFlags = (clip, list, steps) => { const st = createShellState('em001_00'); let n = 0;
    for (let i = 0; i < steps; i++) n += stepShells(st, { monId: 'em001_00', list, clip, frame: i, joints: jointsOf(N.D5.inputs.joints),
      rock: { variant: null, target: null, floorY: 0 }, owner: { x: 0, y: 0x9000, z: 0 }, ownerPos: { x: 55, y: 120, z: 66 },
      stepCount: i + 1, dustFlags: { block74: 1, block1ba: 3, flag6fe88: 0 } }).spawned.length; return n; };
  check('input.dustFlags is gone: { block74: 1, block1ba: 3 } makes no dust on L1 M1 (steps 1..99) nor on L2 M12 (200 steps)',
        withFlags('Motion[1]', '1', 99) === 0 && withFlags('Motion[12]', '2', 200) === 0);
  // the frame-tested dust needs no pick and no flag
  const d1 = run(N.D1, { steps: 8 });
  check('L1 M4 dust (frame 2) needs no pick and no flag', d1.shells.length === 1 && d1.shells[0].pairCur === 2);
}
{
  // THE HIT-SLOT LIFE (input.hitLife): a timer-0 shell01 lives while its slots count down (delay, then duration, by dt,
  // once per step after the moves); made and moved in the same step it ends at move delay + duration + 2
  const life = (rec, mode) => rec.shells.filter(r => r.S.modeIndex === mode && r.S.shell === 'shell01').map(r => r.endMove);
  const d1 = run(N.D1, { hitLife: true, steps: 40 });
  check('hitLife: dust mode 13 (slot 1, record 12: delay 14, duration 10) ends at move 26', eq(life(d1, 13), [26]), life(d1, 13).join());
  const d3 = run(N.D3, { hitLife: true, steps: 10 });
  check('hitLife: dust mode 20 (no hit) still ends at move 1', eq(life(d3, 20), [1]), life(d3, 20).join());
  const b1 = run(N.B1, { hitLife: true, steps: 100 });
  check('hitLife: puffs 44 / 45 / 46 (records 16 / 17 / 17: 2, 10) end at move 14', eq(life(b1, 44).concat(life(b1, 45), life(b1, 46)), [14, 14, 14]));
  const n1 = run(N.N1, { hitLife: true, steps: 100 });
  check('hitLife: the no-fire hit volume, mode 0 (record 8: 6, 4), ends at move 12', eq(life(n1, 0), [12]), life(n1, 0).join());
  const f1 = run(N.F1, { hitLife: true });
  check('hitLife: the landing\'s mode 1 (slots 0 / 1: records 0 (10, 10) and 2 (0, 10)) lives while slot 0 does: made by the last unit, it ends at move 21; the fire (timer 200) at 201',
        eq(life(f1, 1), [21]) && eq(life(f1, 2), [201]), `${life(f1, 1)} / ${life(f1, 2)}`);
  const f8 = run(N.F8, { hitLife: true });
  const ex = f8.shells.filter(r => r.S.shell === 'shell01' && r.S.modeIndex >= 6 && r.S.modeIndex <= 9);
  check('hitLife: explosions 6 (10, 20) / 7..9 (6, 16), made and moved in the same step: moves 32 / 24 / 24 / 24',
        eq(ex.map(r => r.endMove), [32, 24, 24, 24]) && ex.every(r => r.firstMoveStep === r.spawnStep), ex.map(r => `${r.S.modeIndex}:${r.endMove}`).join(' '));
  check('without hitLife every timer-0 shell01 ends at move 1 (the ROM-run harness, no hit registered)',
        Object.values(runs).every(x => x.shells.filter(r => r.S.base === 'base01' && !(r.S.timer > 0) && r.endMove != null).every(r => r.endMove === 1)));
}
{
  // THE ENDINGS. A shell01 waits for its handles, at most 1800 steps (0x3fafd0..0x3fb03c); with no handle (mode 1) it is
  // deleted the step after its end
  const r = runs.F1, m1 = r.shells.find(x => x.S.modeIndex === 1), fire = r.shells.find(x => x.S.modeIndex === 2);
  check('shell01 mode 1 (no effect started) is removed the step after its end', m1.removedStep === m1.endStep + 1, `end ${m1.endStep}, removed ${m1.removedStep}`);
  const long = run(N.F1, { steps: 368 + 1801 + 5 });
  const fl = long.shells.find(x => x.S.modeIndex === 2);
  check('the fire, its effect alive: removed 1801 steps after its end (+0x1618 > 1800)', fl.removedStep === fl.endStep + 1801, `end ${fl.endStep}, removed ${fl.removedStep}`);
  let endAt = null;
  const dead = run(N.F1, { steps: 368 + 5, effectAlive: (step, S, p) => { if (S.modeIndex === 2 && S.shell === 'shell01' && S.state === 0xfe && endAt == null) endAt = step; return !(S.modeIndex === 2 && S.shell === 'shell01' && endAt != null); } });
  const fd = dead.shells.find(x => x.S.modeIndex === 2);
  check('the fire, its effect gone after the end: removed the next step', fd.removedStep === fd.endStep + 1, `end ${fd.endStep}, removed ${fd.removedStep}`);
  const c = run(N.F2, { clipAt: step => step <= 100 ? 'Motion[5]' : 'Motion[1]' });
  check('a clip change during the flight changes nothing (base00 / base01 read no motion)', c.ordered.length === runs.F2.ordered.length &&
        c.ordered.every((x, i) => x.text === runs.F2.ordered[i].text));
}
{
  // the viewer's effect data names the records these shells request (docs/effects/em001_00.json, the Effects Agent's):
  // information only -- not counted
  try {
    const J = JSON.parse(readFileSync(new URL('../docs/effects/em001_00.json', import.meta.url), 'utf8'));
    const have = new Set((J.effects || []).filter(e => e.when === 'shell' && e.record).map(e => e.record.pel + '|' + e.record.key));
    const need = ['em001_00c|0', 'em001_00c|1', 'em001_00c|3', 'em001_00c|30', 'em001_00c|31', 'em001_00u|30', 'em001_00u|31', 'em001_00u|32',
                  'em001_00u|33', 'em001_00u|34', 'em001_00u|61', 'em001_00u|62'];
    console.log(`INFO docs/effects/em001_00.json 'shell' records: ${need.map(k => k + (have.has(k) ? ' yes' : ' MISSING')).join(', ')}`);
  } catch (e) { console.log('INFO docs/effects/em001_00.json not read: ' + e.message); }
}

// ---- 3. controls ----------------------------------------------------------------------------------------------------------
console.log('== 3. controls: a deliberately wrong input must FAIL the comparison');
function control(name, sc, opts){
  const rec = run(sc, opts);
  const same = identical(sc, rec);
  check(`control ${name}: detected`, !same, same ? 'NOT detected -- the comparison is blind here' : '');
}
{
  const up = (m, i, n = 1) => { const x = m.map(f); DV.setFloat32(0, x[i], true); DV.setUint32(0, DV.getUint32(0, true) + n, true); x[i] = DV.getFloat32(0, true); return x; };
  const withJ = (sc, g, m) => jointsOf(Object.assign({}, sc.inputs.joints, { [g]: m }));
  const o = sc => sc.inputs.owner;
  control('owner facing + 1 (F4, Y 0xc001: the velocity turn)', N.F4, { owner: { Y: 0xc001 } });
  control('owner facing + 0x100 (F2: the aim-from point turns)', N.F2, { owner: { Y: 0x3100 } });
  control('joint 3 row 3 z one ulp off (F1)', N.F1, { joints: withJ(N.F1, 3, up(N.F1.inputs.joints['3'], 14)) });
  control('joint 3 m9 4096 ulps off (F2, rotated: z x m9 in the launch offset; smaller changes round away in y)', N.F2, { joints: withJ(N.F2, 3, up(N.F2.inputs.joints['3'], 9, 4096)) });
  control('joint 4 row 3 x one ulp off (B1, the puffs)', N.B1, { joints: withJ(N.B1, 4, up(N.B1.inputs.joints['4'], 12)) });
  control('the wrong action (F4 thrown as 7:0x6b)', N.F4, { variant: '7:0x6b' });
  control('floor 0.5 higher (F1)', N.F1, { floor: 0.5 });
  control('target 1 unit off (F2, aimed)', N.F2, { target: [N.F2.inputs.target[0] + 1, N.F2.inputs.target[1], N.F2.inputs.target[2]] });
  control('owner X word + 1 (F11)', N.F11, { owner: { X: 0xff01 } });
  control('owner Z word + 1 (N1: the hit volume\'s turn)', N.N1, { owner: { Z: 0x101 } });
  control('owner position y + 50 (F2: the height of the aim-from point; a 1-unit x shift does not move the u16 pitch)', N.F2, { owner: { pos: [300, 50, -200] } });
  control('owner position x + 1 (D2: the dust point)', N.D2, { owner: { pos: [-299, 250, 60] } });
  control('the size unscaled (F2: (1, 1) for (1.1, 1.05))', N.F2, { owner: { sc: [1, 1] } });
  control('the base scale 1 for 1.5 (D5: 0xbec34)', N.D5, { owner: { base: 1.0 } });
  control('block +0x5c 0 for 12.5 (F5: the aim-from height)', N.F5, { owner: { y5c: 0 } });
  control('rank 3 for 5 (B1)', N.B1, { rank: 3 });
  control('the ground 1 higher (D1: the dust height)', N.D1, { ground: 1 });
  control('hitLife on (D1: the dust lives 26 moves)', N.D1, { hitLife: true });
  control('hitLife on (F8: the explosions live longer)', N.F8, { hitLife: true });
  // the comparator itself: one hex digit of one move flipped in the JS text
  const r = run(N.F1), s = N.F1.shells[0], x = r.ordered[0];
  x.text = x.text.replace(/^(m5 st=01 pos=)(.)/m, (m0, a, b) => a + (b === '0' ? '1' : '0'));
  check('control a corrupted text (F1 fireball, move 5): detected', compareShell(s, x).text !== '');
  void o;
}

// ---- 4. --rom: random scenarios on the ROM harness ----------------------------------------------------------------------
const ROM_PY = String.raw`
import sys, os, json, struct
sys.path.insert(0, os.environ.get('RATHIAN_SCRATCH', r'C:\MHGU-Extract\efx\agents\rathian-shell-scratch'))
import rrefs as RR
R, H = RR.R, RR.H
out = {}
for sc in json.load(sys.stdin):
    J = {int(g): m for g, m in sc['joints'].items()}
    o = dict(sc['owner']); o['pos'] = tuple(o['pos']); o['sc'] = tuple(o['sc'])
    shells = []
    made = []
    if sc['kind'] == 'dust':
        RR.setup_owner(o, J, (0.0, 0.0, 2100.0), sc['floor'], sc['rank'], sc['mid'])
        H.w8(H.BLOCK + 0x74, sc['b74']); H.w8(H.BLOCK + 0x1ba, 0)
        R.motion(float(sc['frames'][0] - 1), mid=sc['mid'])
        H.CREATED.clear(); H.LOG.clear(); H.next_setup[0] = H.SETUPS
        H.E.call(0xcf1a5c, (H.OWNER,))
        assert H.E.fault is None
        made = [H.parse_setup(c) for c in H.CREATED]
        for c in made: RR.run_any(c, sc['floor'], shells)
    else:
        for fr in sc['frames']:
            RR.setup_owner(o, J, tuple(sc['target']), sc['floor'], sc['rank'])
            R.motion(float(fr - 1))
            H.CREATED.clear(); H.LOG.clear(); H.next_setup[0] = H.SETUPS
            H.E.call(int(sc['fn'], 16), tuple([H.OWNER] + sc['args']))
            assert H.E.fault is None
            for c in [H.parse_setup(c) for c in H.CREATED]:
                made.append(c)
                RR.run_any(c, sc['floor'], shells)
    out[sc['name']] = {'texts': [s['canonical'] for s in shells], 'made': [[c['id'], c['mode']] for c in made]}
print(json.dumps(out))
`;
const ri = process.argv.indexOf('--rom');
if (ri > 0){
  const n = Number(process.argv[ri + 1]) || 40, seed = Number(process.argv[ri + 2]) || 1;
  console.log(`== 4. ${n} random scenarios (seed ${seed}) on the ROM harness, every shell's canonical text line by line`);
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const uni = (a, b) => a + (b - a) * rnd(), pick = L => L[Math.floor(rnd() * L.length)], int = (a, b) => a + Math.floor(rnd() * (b - a));
  const matrix = (lo = 50, hi = 1400) => {       // rows = axes (row-vector convention), any orthonormal basis times a scale, then row 3
    const yw = uni(-3.2, 3.2), pt = uni(-1.5, 1.5), rl = uni(-3.2, 3.2), sc = pick([1.0, 1.0, uni(0.5, 2.0)]);
    const cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt), cr = Math.cos(rl), sr = Math.sin(rl);
    const R = [[cy * cr + sy * sp * sr, cp * sr, -sy * cr + cy * sp * sr], [-cy * sr + sy * sp * cr, cp * cr, sy * sr + cy * sp * cr], [sy * cp, -sp, cy * cp]];
    const m = [];
    for (const r of R) m.push(...r.map(c => f(c * sc)), 0);
    m.push(f(uni(-800, 800)), f(uni(lo, hi)), f(uni(-800, 800)), 1);
    return m;
  };
  const D = SHELL_DATA.em001_00;
  const acts = D.actions.filter(a => a.frames.length);
  const dustRows = D.dust.filter(r => r.frame != null);
  const list = [];
  for (let i = 0; i < n; i++){
    const floor = pick([0.0, 0.0, f(uni(-300, 400)), -1e9]);
    const owner = { X: pick([0, 0, int(0, 0x10000), 0x1f000 + int(0, 0x1000)]), Y: pick([0, int(0, 0x10000), int(0, 0x1000000)]),
                    Z: pick([0, 0, int(0, 0x10000)]),
                    pos: [f(uni(-1000, 1000)), pick([0.0, f(uni(-200, 1200))]), f(uni(-1000, 1000))],
                    sc: [pick([1.0, f(uni(0.8, 1.3))]), pick([1.0, f(uni(0.9, 1.2))])], base: pick([1.0, f(uni(0.8, 1.2))]),
                    y5c: pick([0.0, 0.0, f(uni(-60, 60))]), ground: 0.0 };
    owner.ground = floor > -1e8 ? floor : f(uni(-300, 300));
    const joints = { 3: matrix(), 4: matrix() };
    const T = [f(uni(-3000, 3000)), pick([f(uni(-300, 900)), f(uni(-300, 150))]), f(uni(-3000, 3000))];
    if (i % 4 === 3){
      const row = pick(dustRows), mid = pick(row.ids.filter(x => x !== 0x422 && x !== 0x425));
      // the owner near its ground, or far above it (refused), for the 900 tests
      if (rnd() < 0.8) owner.pos[1] = f(owner.ground + pick([0, uni(-50, 850), uni(850, 950)]));
      list.push({ name: 'R' + i, kind: 'dust', mid, frames: [row.frame], owner, joints, floor, rank: 1, b74: 0, target: T,
                  clip: { list: String(mid >> 8), motion: `Motion[${mid & 0xff}]` } });
    } else {
      const a = acts[i < acts.length * 2 ? i % acts.length : int(0, acts.length)];
      list.push({ name: 'R' + i, kind: 'action', action: a.action, variant: a.variant, fn: '0x' + a.spawner.toString(16), args: a.spawnArgs,
                  frames: a.spawner === 0xd0baec ? [68, 72, 76] : a.frames.slice(), owner, joints, floor, rank: pick([1, 3, 5, 5]), target: T,
                  clip: { list: a.list, motion: a.clip } });
    }
  }
  const dir = mkdtempSync(join(tmpdir(), 'shells-rathian-'));
  const py = join(dir, 'romrathian.py');
  writeFileSync(py, ROM_PY);
  const r = spawnSync('python', [py], { input: JSON.stringify(list), encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) check('the ROM harness runs', false, (r.stderr || String(r.error)).slice(-1200));
  else {
    const rom = JSON.parse(r.stdout);
    let nS = 0, nM = 0, nLand = 0, nRef = 0;
    const cover = {};
    for (const c of list){
      const sc = { name: c.name, kind: c.kind === 'dust' ? 'dust' : 'fire', action: c.action || null, clip: c.clip,
                   spawner: { frames: c.frames }, inputs: { joints: c.joints, owner: c.owner, target: c.target, floorY: c.floor, rank: c.rank, block74: 0, block1ba: 0 } };
      const maxF = Math.max(...c.frames);
      const rec = run(sc, { variant: c.variant || null, steps: maxF + 2 + 180 + 205 + 45 });
      const want = rom[c.name].texts;
      // the ROM ran each spawn from its setup; the JS made the same shells in one world (a mode with no files, 31..33 at
      // ranks 1 / 3, included: the ROM runs it as a plain shell at the setup's point that starts nothing)
      const got = rec.ordered.map(x => x.text);
      for (const x of rec.ordered) cover[x.S.shell + ' ' + x.S.modeIndex] = (cover[x.S.shell + ' ' + x.S.modeIndex] || 0) + 1;
      nLand += rec.ordered.filter(x => x.S.shell === 'shell00' && x.moves.some(m => m.events.some(e => e.ev === 'hit'))).length;
      nRef += rec.refused.length;
      const madeJ = rec.shells.filter(x => x.S.creator == null).map(x => [x.S.globalId, x.S.modeIndex]);
      let detail = '';
      if (JSON.stringify(madeJ) !== JSON.stringify(rom[c.name].made)) detail = `made ${JSON.stringify(madeJ)} vs ROM ${JSON.stringify(rom[c.name].made)}`;
      else if (want.length !== got.length) detail = `${got.length} shells vs ROM ${want.length}`;
      else for (let i = 0; i < want.length && !detail; i++){
        if (want[i] === got[i]) continue;
        const a = got[i].split('\n'), b = want[i].split('\n'), j = a.findIndex((x, k) => x !== b[k]);
        detail = `shell ${i}, line ${j + 1}:\n     js  ${a[j]}\n     rom ${b[j]}`;
      }
      nS += want.length;
      nM += got.reduce((t, x) => t + (x.match(/^m\d+ /gm) || []).length, 0);
      const what = c.kind === 'dust' ? `dust 0x${c.mid.toString(16)} f${c.frames[0]}` : `(7, 0x${c.action[1].toString(16)}) rank ${c.rank}`;
      check(`${c.name} ${what}, owner (0x${c.owner.X.toString(16)}, 0x${c.owner.Y.toString(16)}, 0x${c.owner.Z.toString(16)}) at y ${c.owner.pos[1].toFixed(1)}, floor ${c.floor}: ${want.length} shells identical to the ROM`,
            !detail, detail);
    }
    console.log(`   (${nS} shells, ${nM} moves compared; ${nLand} fireball landings; ${nRef} refusals)`);
    console.log('   shells by kind and mode: ' + Object.entries(cover).sort().map(([k, v]) => `${k}: ${v}`).join(', '));
  }
}

// ---- 5. --emc: the op-0x24 branch of every action, from the command table itself -------------------------------------------
// Every op-0x00 (7, n) site in em001_00_cmdtbl.emc (the EMC agent's parser, efx\agents\state-scratch\emc.py; env
// RATHIAN_EMC_SCRATCH overrides) with the op-0x24 branch around it ('if' = the `24 00` body, 'else' = after `24 02`,
// 'none' = no op 0x24). A site in a group-1 stream no op 0x14 calls is left out (g1 s127, which issues (7, 0x02)). An
// action is 'if' / 'else' when every called site is; SHELL_DATA's op24 must say the same (no op24 = mixed or none).
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
  console.log('== 5. the op-0x24 branch of every pick action, from the command tables (em001_00_cmdtbl, em043_00_cmdtbl, em037_00_cmdtbl)');
  const files = { em001_00: String.raw`C:\MHGU-Extract\scratch-em\em001_00\enemy\cmd_tbl\em001_00_cmdtbl.emc`,
                  em043_05: String.raw`C:\MHGU-Extract\scratch-em\em043_05\enemy\cmd_tbl\em043_00_cmdtbl.emc`,
                  em037_00: String.raw`C:\MHGU-Extract\scratch-em\em037_00\enemy\cmd_tbl\em037_00_cmdtbl.emc` };
  const dir = mkdtempSync(join(tmpdir(), 'shells-emc-'));
  const py = join(dir, 'emcbranch.py');
  writeFileSync(py, EMC_PY);
  const r = spawnSync('python', [py], { input: JSON.stringify(files), encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) check('the EMC scan runs', false, (r.stderr || String(r.error)).slice(-800));
  else {
    const E = JSON.parse(r.stdout);
    const branchOf = (id, n) => {
      const S = (E[id][n] || []).filter(s => s.called);
      if (!S.length) return 'no stream';
      const b = [...new Set(S.map(s => s.branch))];
      return b.length === 1 && b[0] !== 'none' ? b[0] : undefined;
    };
    const where = (id, n) => (E[id][n] || []).map(s => `${s.at}${s.called ? '' : ' (uncalled)'} ${s.branch}`).join(', ');
    for (const a of SHELL_DATA.em001_00.actions.filter(x => x.action[0] === 7)){   // (the scan lists status-7 sites)
      const n = a.action[1], b = branchOf('em001_00', n);
      const want = b === 'no stream' ? undefined : b;
      check(`(7, 0x${n.toString(16).padStart(2, '0')}) ${a.variant}: op24 ${a.op24 || 'none'} = the command table's (${b || 'mixed / none'})`,
            a.op24 === want, where('em001_00', n) || 'issued by no stream');
    }
    // Savage: the rock actions' branches (info: r1 2 / 3 'if', r1 0 / 1 'else' -- the same rocks, so no op24 marks)
    const sv = SHELL_DATA.em043_05.actions.filter(a => a.pick === 'rock');
    check('Savage: the tired (op 0x24 if) and calm (else) rock actions of each stream throw the same rock on the same clip (so the picks are the same)',
          sv.every(a => { const b = branchOf('em043_05', a.action[1]);
            const twin = sv.find(x => x !== a && x.variant === a.variant && x.clip === a.clip && branchOf('em043_05', x.action[1]) !== b);
            return (b === 'if' || b === 'else') && !!twin && twin.frame === a.frame && twin.shell === a.shell && twin.mode === a.mode; }),
          sv.map(a => `0x${a.action[1].toString(16)} ${branchOf('em043_05', a.action[1])}`).join(', '));
    const nv = SHELL_DATA.em037_00.actions.filter(a => a.variant);
    check('Nargacuga: no op 0x24 around any spike action the viewer picks',
          nv.every(a => (E.em037_00[a.action[1]] || []).every(s => s.branch === 'none')), nv.map(a => `0x${a.action[1].toString(16)} ${branchOf('em037_00', a.action[1]) || 'none'}`).join(', '));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

// Rathian's siblings' shells in render/shells.js -- Gold Rathian (em001_02) and Dreadqueen Rathian (em001_04), which run
// Rathian's class uEm001_00 with their own shell ids, files, variant byte, actiontune and .dtp -- against the ROM.
//
//   1. THE FILES: SHELL_DATA.em001_02 / em001_04 (and em001_00) against the values read from each monster's own .arc, as the
//      reference JSON carries them (vdata.py: every ShellInfoList mode's sh ints / floats / vecs, ef, hit ints; the hitdata
//      records; the actiontune floats; the .dtp break rows): bit for bit.
//   2. THE ROM'S REFERENCE RUNS: C:\MHGU-Extract\efx\agents\rathian-variants-scratch\rathian-variants-reference.json (env
//      RATHIAN_VARIANTS_REF overrides), made by vrefs.py on the Unicorn harness: uEm001_00's own action code (the action
//      main's status switch 0xcee3d8, the case bodies, every spawn helper, frame by frame -- arun.py) or its per-frame handler
//      0xcf1a5c, then every create's setup run as its shell (ctor, init, moves) with every shell it creates. Each scenario runs
//      through stepShells as the viewer steps it: the clip one frame per step from 0, input.rock.variant = the action ('7:0x42'
//      ... '1:0xff'), the scenario's joints, owner block (words, and at each create the position / ground the ROM had),
//      target, floor, rank, input.questLevel / breakLevel7 / tailSevered. Every shell, in the reference's order, is compared
//      field by field (setup, reader params, spawn state, init effect starts, every move, every event) and its canonical text
//      with the ROM's (and sha256).
//   3. THE POISON RING: the ROM's 0xd09b84(e, 0x10) with fake units (which one each create retires; 0xcee250 dropping a dead
//      handle) against stepShells playing the same sequence.
//   4. The contract: pickVariantsFor per clip, not tired / tired; the inputs (refusals); the gates (quest, rank, sever,
//      part 7); the hit-slot life of the siblings' dust; Rathian's own data unchanged.
//   5. CONTROLS: deliberately wrong inputs and a corrupted text must FAIL -- so a PASS above is not blind.
//   6. --rom [n] [seed]: n random plays (default 30; 160 covers every drawing action of both twice) run by the ROM's own
//      action code on the harness (python + unicorn; env RATHIAN_VARIANTS_SCRATCH overrides its folder) and through
//      stepShells, every shell's canonical text compared line by line.
//
//   node dev/shells-rathian-variants-check.mjs [--rom [n] [seed]] [--print <scenario> <index>]
//
// Exit code 1 when anything fails.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { createShellState, stepShells, pickVariantsFor, variantActionFor, SHELL_DATA } from '../docs/render/shells.js';

const REF = process.env.RATHIAN_VARIANTS_REF || String.raw`C:\MHGU-Extract\efx\agents\rathian-variants-scratch\rathian-variants-reference.json`;
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
const actionName = a => `${a[0]}:0x${a[1].toString(16).padStart(2, '0')}`;
const pelOf = mon => ({ 0: 'em001_00c', 1: mon + 'u' });
const LIST = { 0: 'c', 1: 'u' };

// ---- 1. the files ---------------------------------------------------------------------------------------------------------
console.log(`== 1. SHELL_DATA against each monster's own files (${REF})`);
for (const mon of ['em001_00', 'em001_02', 'em001_04']){
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
  const Q = SHELL_DATA.em001_04, F = ref.files.em001_04;
  check('em001_04 tune = em001_04_actiontune floats (29)', sameF(Q.tune.map(f), F.actiontune.floats) && F.actiontune.ints.length === 0);
  const row = F.dtp_break_rows[4];
  check(`em001_04 poison = em001_04_dtbparts.dtp break row 4 (part ${row[0]}, levels ${row[1]} / ${row[2]})`,
        Q.poison.part === row[0] && Q.poison.levels[0] === row[1] && Q.poison.levels[1] === row[2]);
  check('em001_02 / em001_00 have no fifth break row (0xd09b84\'s variant-4 path is the only reader) and Gold\'s actiontune is two floats',
        ref.files.em001_02.dtp_break_rows.length === 4 && ref.files.em001_00.dtp_break_rows.length === 4 && ref.files.em001_02.actiontune.floats.length === 2 &&
        !SHELL_DATA.em001_02.poison && !SHELL_DATA.em001_00.poison);
  check('ids (0xd09918): Gold 0x55 / 0x5b / 0x61, Dreadqueen 0x56 / 0x5c / 0x62; variant bytes 2 / 4; lists c em001_00c + their own u.pel',
        SHELL_DATA.em001_02.shells.shell00.id === 0x55 && SHELL_DATA.em001_02.shells.shell01.id === 0x5b && SHELL_DATA.em001_02.shells.shell11.id === 0x61 &&
        Q.shells.shell00.id === 0x56 && Q.shells.shell01.id === 0x5c && Q.shells.shell11.id === 0x62 && SHELL_DATA.em001_02.variant === 2 && Q.variant === 4 &&
        SHELL_DATA.em001_02.lists[0].pel === 'em001_00c' && SHELL_DATA.em001_02.lists[1].pel === 'em001_02u' && Q.lists[1].pel === 'em001_04u');
}

// ---- a scenario through stepShells, as the viewer steps it ------------------------------------------------------------------
function jointsOf(J){
  const M = {};
  for (const [g, m] of Object.entries(J)) M[Number(g)] = m.map(f);
  const first = Math.min(...Object.keys(M).map(Number));
  return gid => M[gid] || (gid === 0 ? M[first] : null);
}
// opts: { variant, clip, steps, joints, owner (partial block), target, floor, rank, questLevel, breakLevel7, tailSevered,
// noRock, noOwner, noPos, hitLife, monId, effectAlive (step, S, param, h) }
function run(sc, opts = {}){
  const mon = opts.monId || sc.monster;
  const st = createShellState(mon);
  const inp = sc.inputs;
  const own = Object.assign({}, inp.owner, opts.owner || {});
  const floor = opts.floor !== undefined ? opts.floor : inp.floorY;
  const J = opts.joints || jointsOf(inp.joints);
  const T = opts.target !== undefined ? opts.target : (inp.target || null);
  const variant = opts.variant !== undefined ? opts.variant : (sc.action ? actionName(sc.action) : null);
  const clip = opts.clip || sc.clip.motion, list = sc.clip.list;
  const steps = opts.steps || stepsFor(sc);
  // the owner the ROM had at each create (its own travel / posture height moved it: vrefs.py records them): until a
  // create's step, that create's position and ground; after the last, the last's
  const cr = (sc.creates || []).slice().sort((a, b) => a.pair[1] - b.pair[1]);
  const ownerAt = step => { const c = cr.find(x => x.pair[1] + 1 >= step) || cr[cr.length - 1]; return c && c.owner_pos ? c : null; };
  const rec = { shells: [], outs: [], refused: [] };
  for (let step = 0; step < steps; step++){
    const oc = opts.owner && opts.owner.pos ? null : ownerAt(step);
    const pos = oc ? oc.owner_pos : own.pos, ground = oc ? oc.ground : (opts.ground !== undefined ? opts.ground : own.ground);
    const input = { monId: mon, list, clip, frame: step, joints: J, rage: false,
                    rock: opts.noRock ? undefined : { variant, target: T ? { x: T[0], y: T[1], z: T[2] } : null, floorY: floor },
                    owner: opts.noOwner ? undefined : { x: own.X, y: own.Y, z: own.Z },
                    ownerPos: opts.noPos ? undefined : { x: pos[0], y: pos[1], z: pos[2] },
                    ground, size: own.sc, baseScale: own.base, y5c: oc ? oc.y5c : own.y5c,
                    rank: opts.rank !== undefined ? opts.rank : inp.rank, stepCount: step + 1 };
    const q = opts.questLevel !== undefined ? opts.questLevel : inp.questLevel;
    if (q != null) input.questLevel = q;
    // (null: the input not given at all)
    const b7 = opts.breakLevel7 !== undefined ? opts.breakLevel7 : inp.breakLevel7, sv = opts.tailSevered !== undefined ? opts.tailSevered : inp.tailSevered;
    if (b7 !== null) input.breakLevel7 = b7;
    if (sv !== null) input.tailSevered = sv;
    if (opts.hitLife) input.hitLife = true;
    if (opts.effectAlive) input.effectAlive = (S, p, h) => opts.effectAlive(step, S, p, h);
    const pairCur = st.hist ? st.hist[1] : null;
    const out = stepShells(st, input);
    rec.outs.push(out);
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
function stepsFor(sc){
  const fr = (sc.creates || []).length ? Math.max(...sc.creates.map(c => c.pair[1])) : 130;
  return Math.min(fr, 400) + 2 + 470 + 205 + 40;
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
for (const sc of ref.scenarios){
  const rec = runs[sc.name] = run(sc);
  const want = sc.shells.filter(s => !deletedAtInit(s)), dead = sc.shells.filter(deletedAtInit);
  const PEL = pelOf(sc.monster);
  const tag0 = `${sc.name} ${sc.monster} ${sc.action ? `(${sc.action[0]}, 0x${sc.action[1].toString(16)}) ` : ''}L${sc.clip.list} ${sc.clip.motion}`;
  const inputs = sc.inputs;
  const note = [inputs.rank !== 5 ? `rank ${inputs.rank}` : '', inputs.questLevel ? `quest ${inputs.questLevel}` : '',
                inputs.breakLevel7 ? `part 7 level ${inputs.breakLevel7}` : '', inputs.tailSevered ? 'severed' : ''].filter(Boolean).join(', ');
  // creates the ROM's init deleted: in the JS no shell (make001 returns null) -- the create is at the same frame
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
const N = Object.fromEntries(ref.scenarios.map(sc => [sc.name, sc]));

// ---- 3. the poison ring ---------------------------------------------------------------------------------------------------
console.log('== 3. the poison ring (ctl+0xa0 / +0xa4) against the ROM\'s');
{
  // the ROM: A made; A's unit dead, vtable +0x1dc drops it; B, C, D, E made -- D retires B, E retires C (vtable +0x148, 0)
  const R = ref.ring.steps;
  check('the ROM\'s ring: ' + R.map(s => `${s.op} -> [${s.a0}, ${s.a4}]${s.ended.length ? ' retires ' + s.ended.map(e => `${e[0]} (${e[1]})`).join(' ') : ''}`).join('; '),
        R.length === 6 && R[3].ended.length === 0 && R[4].ended[0][0] === 'B' && R[5].ended[0][0] === 'C' && R.every(s => s.mode === undefined || s.mode === 16 || s.mode === null));
  // stepShells: '7:0x05' on L4 M6 (quest 0: mode 16 at frame 12) played five times; between A and B the viewer steps on
  // until A has ended (its timer, 450) and gone (its effect reported dead) -- the ROM's "A dead"
  const sc = N.QP1, mon = 'em001_04', st = createShellState(mon);
  const J = jointsOf(sc.inputs.joints);
  const made = [], retired = [];
  let step = 0, dead = false;
  const play = (frames, clip, variant) => {
    for (let fr = 0; fr < frames; fr++, step++){
      const out = stepShells(st, { monId: mon, list: '4', clip, frame: fr, joints: J, rage: false,
        rock: { variant, target: null, floorY: 0 }, owner: { x: 0, y: 0x6000, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 }, ground: 0, questLevel: 0,
        stepCount: step + 1, effectAlive: (S) => !(dead && S === made[0]) });
      for (const S of out.spawned) if (S.modeIndex === 16) made.push(S);
      for (const S of out.ended) if (S.modeIndex === 16 && S.state === 0xfe && S.moves < 451) retired.push([made.indexOf(S), made.length]);
    }
  };
  play(20, 'Motion[6]', '7:0x05');                    // A
  dead = true;
  play(470, 'Motion[5]', null);                       // A runs out its 450 and, its effect dead, is removed
  const aGone = made[0].state === 0xff;
  const ringA = [st.poison.older, st.poison.newer];
  for (let i = 0; i < 4; i++) play(20, 'Motion[6]', '7:0x05');    // B, C, D, E
  const names = 'ABCDE';
  const got = retired.map(([who, n]) => `${names[who]} at ${names[n - 1]}`);
  check(`stepShells: A gone (removed) and dropped from the ring; D retires B, E retires C (vtable +0x148 with 0: state 0xfe) -- ${got.join(', ')}`,
        made.length === 5 && aGone && ringA[0] === null && ringA[1] === null && eq(got, ['B at D', 'C at E']) &&
        st.poison.older === made[3] && st.poison.newer === made[4], `made ${made.length}, ring after A ${ringA.map(x => x && x.id)}`);
  // a retired poison stops its effect in the retiring step (the stop is that step's move's first event) and is in out.ended
  const b = made[1];
  check('the retired poison: its u 40 stopped (flag 0) at the retirement, before its own move, then the ending (0xfe) waits for the effect',
        b.state === 0xfe || b.state === 0xff, `state ${b.state}`);
}

// ---- 4. the contract ------------------------------------------------------------------------------------------------------
console.log('== 4. picks, inputs, gates, hit life, Rathian unchanged');
{
  const cases = {
    em001_02: [
      ['2', 'Motion[5]', ['7:0x02'], ['7:0x0f']], ['2', 'Motion[18]', ['7:0x0a'], ['7:0x0b']],
      ['4', 'Motion[8]', ['7:0x08', '7:0x6b'], ['7:0x22', '7:0x6c']], ['4', 'Motion[16]', ['7:0x3a', '7:0x47'], []],
      ['4', 'Motion[65]', ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a'], ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a']],
      ['2', 'Motion[1]', ['7:0x4d', '7:0x75', '7:0x00', '7:0x74'], ['7:0x4d', '7:0x75', '7:0x00', '7:0x74']],
      ['4', 'Motion[18]', ['7:0x42', '7:0x4a', '7:0x5a', '7:0x5b', '7:0xef'], []],
      ['2', 'Motion[13]', [], []], ['4', 'Motion[6]', [], []], ['9', 'Motion[1]', [], []],
    ],
    em001_04: [
      ['2', 'Motion[5]', ['7:0x02'], ['7:0x0f']], ['2', 'Motion[18]', ['7:0x0a'], ['7:0x0b']],
      ['4', 'Motion[8]', ['7:0x08', '7:0x6b'], ['7:0x22', '7:0x6c']], ['4', 'Motion[16]', ['7:0x3a', '7:0x47'], []],
      ['4', 'Motion[65]', ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a'], ['7:0x77', '7:0x7b', '7:0x76', '7:0x7a']],
      ['2', 'Motion[1]', ['7:0x4d', '7:0x75', '7:0x00', '7:0x74'], ['7:0x4d', '7:0x75', '7:0x00', '7:0x74']],
      ['4', 'Motion[18]', ['7:0x42', '7:0x4a', '7:0x5a', '7:0x5b', '7:0xef'], []],
      ['4', 'Motion[6]', ['7:0x05', '7:0x3d', '7:0x09', '7:0x0e', '7:0x1e', '7:0x4a', '7:0x73', '7:0x6d'], ['7:0x05', '7:0x3d', '7:0x09', '7:0x0e', '7:0x1e', '7:0x73', '7:0x6d']],
      ['2', 'Motion[13]', ['7:0x4e', '7:0x11'], ['7:0x4e', '7:0x11']],
      ['9', 'Motion[1]', ['1:0xff'], ['1:0xff']], ['9', 'Motion[2]', ['7:0xff'], ['7:0xff']],
      ['9', 'Motion[4]', ['7:0xed', '7:0xee', '7:0xf8'], ['7:0xed', '7:0xee', '7:0xf8']], ['9', 'Motion[5]', ['7:0xed', '7:0xee', '7:0xf8'], ['7:0xed', '7:0xee', '7:0xf8']],
      ['9', 'Motion[7]', ['7:0xef', '7:0xf0', '7:0xf1'], ['7:0xf0', '7:0xf1']], ['9', 'Motion[9]', ['7:0xf2'], ['7:0xf2']],
    ],
  };
  for (const [mon, list] of Object.entries(cases))
    for (const [l, c, calm, tired] of list){
      const a = pickVariantsFor(mon, l, c), b = pickVariantsFor(mon, l, c, { tired: true }), r = pickVariantsFor(mon, l, c, { tired: true, rage: true });
      check(`pickVariantsFor(${mon}, ${l}, ${c}) = ${calm.join(' ') || 'none'}; tired ${tired.join(' ') || 'none'}; tired + enraged = not tired`,
            eq(a, calm) && eq(b, tired) && eq(r, calm), `${a.join(' ')} | ${b.join(' ')} | ${r.join(' ')}`);
    }
  check('Rathian\'s SHELL_DATA unchanged: 16 actions, her L2 M1 / L4 M18 / L4 M6 / L9 have no picks',
        SHELL_DATA.em001_00.actions.length === 16 && ['2:Motion[1]', '4:Motion[18]', '4:Motion[6]', '9:Motion[1]', '2:Motion[13]'].every(k => { const [l, c] = k.split(':'); return pickVariantsFor('em001_00', l, c).length === 0; }));
  check('the siblings\' shared entries are Rathian\'s objects (the same case bodies and helpers) and the dust rows / postures hers',
        ['7:0x02', '7:0x0f', '7:0x08', '7:0x3a'].every(v => variantActionFor('em001_02', v === '7:0x08' || v === '7:0x3a' ? '4' : '2', v === '7:0x08' ? 'Motion[8]' : v === '7:0x3a' ? 'Motion[16]' : 'Motion[5]', v) ===
                                                           variantActionFor('em001_00', v === '7:0x08' || v === '7:0x3a' ? '4' : '2', v === '7:0x08' ? 'Motion[8]' : v === '7:0x3a' ? 'Motion[16]' : 'Motion[5]', v)) &&
        SHELL_DATA.em001_02.dust === SHELL_DATA.em001_00.dust && SHELL_DATA.em001_04.dust === SHELL_DATA.em001_00.dust &&
        SHELL_DATA.em001_04.postures === SHELL_DATA.em001_00.postures &&
        variantActionFor('em001_04', '4', 'Motion[65]', '7:0x77') !== variantActionFor('em001_00', '4', 'Motion[65]', '7:0x77'));
}
{
  // THE INPUTS
  const q = run(N.QP1, { questLevel: null, steps: 30 });
  check('the poison without input.questLevel: refused (0x49930 is the quest\'s: no default)', q.shells.length === 0 && q.refused.length === 1 &&
        /quest level/.test(q.refused[0].why), JSON.stringify(q.refused));
  const q7 = run(N.QB7, { questLevel: null, steps: 130 });
  check('(7, 0xf2) without input.questLevel: 48..50 refused at each of their frames (24 / 26 / 28), 36 still made at 122 (not gated)',
        q7.shells.length === 1 && q7.shells[0].S.modeIndex === 36 && eq(q7.refused.map(r => r.step - 1), [24, 26, 28]) &&
        q7.refused.every(r => eq(r.modes, [0x30, 0x31, 0x32]) && /quest level/.test(r.why)), JSON.stringify(q7.refused));
  const nf = run(N.QP1, { floor: null, steps: 30 });
  check('the poison without a floor: refused (its ground snap queries the stage)', nf.shells.length === 0 && nf.refused.length === 1 && /floor/.test(nf.refused[0].why));
  const np = run(N.QG1, { noPos: true, steps: 60 });
  check('the L9 M7 ground dust without the owner position: refused', np.shells.length === 0 && np.refused.length === 1 && /position/.test(np.refused[0].why));
  const d = run(N.QP1, { breakLevel7: null, tailSevered: null });
  check('input.breakLevel7 / tailSevered not given = 0 / false (the setup\'s): QP1\'s poison, text for text', d.ordered.length === 1 && d.ordered[0].text === runs.QP1.ordered[0].text);
  // gates
  const modes = (sc, o) => run(sc, Object.assign({ steps: 30 }, o)).shells.map(r => r.S.modeIndex);
  check('the poison\'s mode by quest (n > 8: 24, 4..8: 23, < 4: 16) and part 7 (at level 2 one step down; 16 stays)',
        eq(modes(N.QP1, { questLevel: 3 }), [16]) && eq(modes(N.QP1, { questLevel: 4 }), [23]) && eq(modes(N.QP1, { questLevel: 8 }), [23]) &&
        eq(modes(N.QP1, { questLevel: 9 }), [24]) && eq(modes(N.QP1, { questLevel: 50 }), [24]) &&
        eq(modes(N.QP1, { questLevel: 9, breakLevel7: 1 }), [24]) && eq(modes(N.QP1, { questLevel: 9, breakLevel7: 2 }), [23]) &&
        eq(modes(N.QP1, { questLevel: 5, breakLevel7: 2 }), [16]) && eq(modes(N.QP1, { questLevel: 0, breakLevel7: 9 }), [16]));
  check('severed (P+0x3b4 & 1): no poison, nothing refused', run(N.QP1, { tailSevered: true, steps: 30 }).shells.length === 0 &&
        run(N.QP1, { tailSevered: true, steps: 30 }).refused.length === 0);
  const g = run(N.GB1, { monId: 'em001_02', variant: '7:0x77' }), g76 = run(N.GB1, { variant: '7:0x76' });
  check('Gold (7, 0x77): no poison at 116 (the extra is variant 4\'s); (7, 0x76) makes nothing', g.shells.every(r => r.S.modeIndex !== 16 && r.S.modeIndex !== 23) &&
        g76.shells.length === 0);
  const rk = [1, 3, 5].map(n => run(N.GB3, { rank: n, steps: 80 }).shells.map(r => r.S.modeIndex).join());
  check('L2 M1\'s puffs by rank: 1 / 3 -> 3, 4, 5; 5 -> 38, 39, 40 (0x3a8430 > 4)', eq(rk, ['3,4,5', '3,4,5', '38,39,40']), rk.join(' | '));
  const seq = run(N.QF6, { steps: 240 });
  check('(7, 0x42): 9 / 10 / 11 at 116 / 168 / 226, in its phases', eq(seq.shells.filter(r => r.S.creator == null).map(r => `${r.S.modeIndex}@${r.pairCur}`), ['9@116', '10@168', '11@226']));
  // the phase machine: a replay from frame 150 (a new action from its start) makes 10 and 11 only after 9 -- here nothing
  // until 116 of the new play
  // hit life of the siblings' dust (their mode 20 registers slot 0 / 1): Gold record 15 (14, 10), Dreadqueen record 16 (14, 10)
  const h2 = run(N.GD1, { hitLife: true, steps: 40 }), h4 = run(N.QD1, { hitLife: true, steps: 40 });
  check('input.hitLife: the dust mode 20 lives while its slot counts down -- Gold record 15 (14, 10), Dreadqueen 16 (14, 10): end at move 26',
        h2.shells[0].endMove === 26 && h4.shells[0].endMove === 26, `${h2.shells[0].endMove} / ${h4.shells[0].endMove}`);
  const t9 = run(N.GN1, { hitLife: true, steps: 100 });
  check('the siblings\' no-fire hit volume (shell01 mode 0) has timer 9.0: it ends at move 10 whatever the slots', t9.shells[0].endMove === 10 && runs.GN1.ordered[0].S.timer === 9);
  // what the schedule reads: the pel names of the starts
  const pels = Object.values(runs).flatMap(r => r.shells.map(x => x.S.start).filter(Boolean)).map(s => s.pel);
  check('every start names em001_00c or the monster\'s own u.pel (em001_02u / em001_04u)', pels.length > 0 && pels.every(p => ['em001_00c', 'em001_02u', 'em001_04u'].includes(p)));
}

// ---- 5. controls --------------------------------------------------------------------------------------------------------
console.log('== 5. controls: wrong inputs must fail');
const ctl = (name, sc, opts) => {
  const r = run(sc, opts);
  const ok = !identical(sc, r);
  check(`control ${name}: detected`, ok, ok ? '' : 'identical to the ROM');
};
ctl('facing (QF1, Y + 1)', N.QF1, { owner: { Y: N.QF1.inputs.owner.Y + 1 } });
ctl('joint 3 (GF2, one float)', N.GF2, { joints: (() => { const J = jointsOf(N.GF2.inputs.joints); return gid => { const m = J(gid); return m && gid === 3 ? m.map((x, i) => i === 13 ? f(x + 0.5) : x) : m; }; })() });
ctl('joint 4 (QB3)', N.QB3, { joints: (() => { const J = jointsOf(N.QB3.inputs.joints); return gid => { const m = J(gid); return m && gid === 4 ? m.map((x, i) => i === 12 ? f(x + 1) : x) : m; }; })() });
ctl('joint 145 (QP1)', N.QP1, { joints: (() => { const J = jointsOf(N.QP1.inputs.joints); return gid => { const m = J(gid); return m && gid === 145 ? m.map((x, i) => i === 12 ? f(x + 1) : x) : m; }; })() });
ctl('the action (QB1 as 7:0x76)', N.QB1, { variant: '7:0x76' });
ctl('the quest (QP3, 8 for 9)', N.QP3, { questLevel: 8 });
ctl('part 7 (QP4, level 1 for 2)', N.QP4, { breakLevel7: 1 });
ctl('the sever (QP1)', N.QP1, { tailSevered: true });
ctl('the rank (GB2, 5 for 1)', N.GB2, { rank: 5 });
ctl('the floor (QF5, +1)', N.QF5, { floor: N.QF5.inputs.floorY + 1 });
ctl('the owner words (QB4, Z + 0x100)', N.QB4, { owner: { Z: N.QB4.inputs.owner.Z + 0x100 } });
ctl('the owner position (QG1, x + 1)', N.QG1, { owner: { pos: [N.QG1.inputs.owner.pos[0] + 1, N.QG1.inputs.owner.pos[1], N.QG1.inputs.owner.pos[2]] } });
ctl('the monster (QB1 run as Gold)', N.QB1, { monId: 'em001_02' });
{
  const rec = run(N.QF6), s = N.QF6.shells[0];
  const bad = Object.assign({}, s, { canonical: s.canonical.replace(/\nm5 /, '\nm5  '), sha256: s.sha256 });
  const c = compareShell(bad, rec.ordered[0], pelOf('em001_04'));
  check('control a corrupted text (QF6 fireball, move 5): detected', c.text !== '');
}

// ---- 6. --rom [n] [seed]: random scenarios on the ROM harness ------------------------------------------------------------
// n random plays (default 30): a sibling, one of its drawing actions, random joints 3 / 4 / 145, owner words / position /
// size / base scale, floor, rank, quest number, part-7 level and sever -- the action run by the ROM's own action code
// (vrefs.py / arun.py, python + unicorn; env RATHIAN_VARIANTS_SCRATCH overrides the folder), every create on the entry's
// clip run as its shell, and the same play through stepShells: every shell's canonical text line by line.
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
        H.w16(H.BLOCK + 0x3b4, 1 if sc['severed'] else 0)
    J = {int(g): m for g, m in sc['joints'].items()}
    r = arun.run(v, sc['action'][1], steps=sc['steps'], rank=sc['rank'], quest=sc['quest'], slot7=sc['level7'],
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
        before = len(shells)
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
  for (const mon of ['em001_02', 'em001_04'])
    acts[mon] = SHELL_DATA[mon].actions.filter(a => a.pick === 'ai' && ((a.spawns && a.spawns.length) || (a.frames && a.frames.length)));
  const list = [];
  for (let i = 0; i < n; i++){
    const mon = i % 2 ? 'em001_04' : 'em001_02';
    const A = acts[mon], a = A[i < A.length * 2 ? Math.floor(i / 2) % A.length : int(0, A.length)];
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
                quest: pick([0, 3, 4, 8, 9, 12, 13, 40]), level7: pick([0, 0, 1, 2, 3]), severed: rnd() < 0.15, steps: 1000 });
  }
  const dir = mkdtempSync(join(tmpdir(), 'shells-rathian-variants-'));
  const py = join(dir, 'romvariants.py');
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
                   inputs: { joints: c.joints, owner: c.owner, target: c.target, floorY: c.floor, rank: c.rank, questLevel: c.quest,
                             breakLevel7: c.level7, tailSevered: c.severed } };
      const maxF = R0.made.length ? Math.max(...R0.made.map(x => x[2])) : 240;
      const rec = run(sc, { steps: Math.min(maxF, 400) + 2 + 470 + 205 + 45 });
      const want = R0.texts, got = rec.ordered.map(x => x.text);
      for (const x of rec.ordered) cover[x.S.shell + ' ' + x.S.modeIndex] = (cover[x.S.shell + ' ' + x.S.modeIndex] || 0) + 1;
      const madeJ = rec.shells.filter(x => x.S.creator == null).map(x => [x.S.globalId, x.S.modeIndex, x.pairCur]);
      // (a create whose init the ROM deleted has no text there and no shell here)
      let detail = '';
      if (want.length !== got.length) detail = `${got.length} shells vs ROM ${want.length}; made ${JSON.stringify(madeJ)} vs ROM ${JSON.stringify(R0.made)}`;
      else for (let i = 0; i < want.length && !detail; i++){
        if (want[i] === got[i]) continue;
        const a = got[i].split('\n'), b = want[i].split('\n'), j = a.findIndex((x, k) => x !== b[k]);
        detail = `shell ${i}, line ${j + 1}:\n     js  ${a[j]}\n     rom ${b[j]}`;
      }
      nS += want.length;
      nM += got.reduce((t, x) => t + (x.match(/^m\d+ /gm) || []).length, 0);
      check(`${c.name} ${c.monster} ${c.variant} L${c.clip.list} ${c.clip.motion}, rank ${c.rank}, quest ${c.quest}, part 7 ${c.level7}${c.severed ? ', severed' : ''}, floor ${c.floor}: ${want.length} shells identical to the ROM`,
            !detail, detail);
    }
    console.log(`   (${nS} shells, ${nM} moves compared)`);
    console.log('   shells by kind and mode: ' + Object.entries(cover).sort().map(([k, v]) => `${k}: ${v}`).join(', '));
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

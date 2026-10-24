// Ahtal-Ka's shell57 (uShellEm088_sp_57 : uShellEmBase57) in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/sh88/emu57.py (env AHTAL57_EMU overrides) runs base57 on unicorn -- the ctor
//      0x42ecb8, the init 0x42f070 and the move 0x4303a8 every frame, with the base57 band (0x42ec00..0x433700) and the
//      engine's pure math native (0x7c3a38 Euler, 0x232404 words -> matrix, 0x1ebe8 multiply, 0x539224 the flight step);
//      the reader's fields written from the .shl (em088_00.arc, ahtal/shl088.txt), the owner / joint 130 / G stubbed with
//      the case's values, every other call a logged stub (the effect starts and stops, the camera, the spot write
//      0x10ae90c logged). Each case then runs through stepShells as the viewer steps it -- the action's clip one frame a
//      step, the throw at L2 M17 160 ('7:0x10'), the drops at their clip's start ('1:0x06' L2 M28 = behaviour 4, L3 M3 =
//      behaviour 2), the pull at L2 M19 92 from the session's spot -- and every move (state, phase, sub, position, angle
//      words, velocity, acceleration) is compared bit for bit (float32) until the shell's end, with the end's rest point,
//      its spot write, and the effect starts (the trail at the first move, ef 0 at the landing / the rest, ef 4 on the pull).
//   2. The contract: the pick names (pickVariantsFor), heldUntil088, pullClip088, the refusals (nothing carried, no spot,
//      no target), the model each shell names.
//   3. CONTROLS: a wrong target, a wrong joint and a wrong object must FAIL the comparison.
//
//   node dev/shells-ahtal-check.mjs
//
// Exit code 1 when anything fails.
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/gapE/render/shells.js').href);
const EMU = process.env.AHTAL57_EMU ||
  'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/sh88/emu57.py';
const f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, detail = '') => { if (c){ pass++; console.log('PASS ' + msg + (detail ? '  -- ' + detail : '')); } else { fail++; console.log('FAIL ' + msg + (detail ? '  -- ' + detail : '')); } };

// a joint 130 world matrix: a rotation (yaw a, pitch b, roll c) and a point, rows = axes (the game's memory order)
function jointOf(a, b, c, t){
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
  const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
  const R = mul(mul(Rz, Rx), Ry);
  return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
}
const J1 = jointOf(0.7, -0.3, 0.2, [120.0, 650.0, 380.0]);
const J2 = jointOf(-2.1, 0.45, -0.6, [-340.5, 410.25, 905.75]);
const RAD = f(10430.3779296875), DEG = f(182.04444885253906);
const word = a => (Math.trunc(f(f(0.5) + f(f(a) * RAD))) & 0xffff);

// the cases (each also what stepShells is given)
const cases = [];
for (const k of [0, 1, 2]){
  cases.push({ name: 'throw' + k, kind: 'throw', k, mode: k, behaviour: 1, placement: 1, b54: 1, joint: J1, ownerPos: [10.0, -90.0, -20.0],
               ownerY: 0x1234, target: [300.0 + 400 * k, 0.0, 2500.0 - 900 * k] });
  cases.push({ name: 'throwB' + k, kind: 'throw', k, mode: k, behaviour: 1, placement: 1, b54: 1, joint: J2, ownerPos: [-500.0, -90.0, 700.0],
               ownerY: 0xc000, target: [-2500.0, 100.0, -300.0 * k] });
  cases.push({ name: 'drop2_' + k, kind: 'drop2', k, mode: k + 0xc, behaviour: 2, placement: 1, b54: 1, joint: k === 1 ? J2 : J1,
               ownerPos: [55.0, -90.0, -75.0], ownerY: 0x2222 * (k + 1) });
  const T = [[-1000.0, -2000.0, 180.0], [-3200.0, -3000.0, 180.0], [3500.0, -1000.0, 180.0]][k];
  cases.push({ name: 'drop4_' + k, kind: 'drop4', k, mode: k + 0x10, behaviour: 4, placement: 1, b54: 1, joint: k === 2 ? J2 : J1,
               ownerPos: [0.0, -90.0, 0.0], ownerY: 0x4000, ptr14: [T[0], -90.0, T[1]], w18: [0x444, Math.trunc(f(f(0.5) + f(f(T[2]) * DEG))) & 0xffff, 0x16c] });
  const sp = [[-1000.0 + 300 * k, -90.0, -2000.0], [f(0.1), f(2.0 + k), f(0.3)]];
  const Jp = k === 0 ? J1 : J2;
  cases.push({ name: 'pull' + k, kind: 'pull', k, mode: k + 8, behaviour: 3, placement: 2, b54: 2, b50: 1, joint: Jp, spot: sp,
               ownerPos: [0.0, -90.0, 0.0], ownerY: 0, ptr14: [Jp[12], Jp[13], Jp[14]] });
}
// the pull's words +0x18.. are the action code's (0x10bfd64, 0x7c3a38 on joint 130): the module's own Euler (the placement-1
// cases above check it against the ROM's) hands the same words to the run
const eulerJS = M => { const H = f(1.5707963705062866);
  if (!(M[9] < 1.0)) return [f(-H), 0, f(-Math.atan2(M[2], M[0]))];
  if (M[9] <= -1.0) return [H, 0, f(Math.atan2(M[8], M[0]))];
  return [f(-Math.asin(M[9])), f(-Math.atan2(f(-M[8]), M[10])), f(-Math.atan2(f(-M[1]), M[5]))]; };
for (const c of cases) if (c.kind === 'pull') c.w18 = eulerJS(c.joint).map(word);

const dir = mkdtempSync(join(tmpdir(), 'ahtal57-'));
writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases.map(c => Object.assign({ frames: 700 }, c))));
const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'rom.json')], { encoding: 'utf8' });
if (py.status !== 0){ console.log(py.stdout, py.stderr); process.exit(1); }
const ROM = JSON.parse(readFileSync(join(dir, 'rom.json'), 'utf8'));

// one case through stepShells as the viewer steps it; returns the shell's per-move snapshots from its spawn step on
function runJS(c, over = {}){
  const st = S.createShellState('em088_00');
  const J = gid => (over.joint || c.joint);
  const base = { monId: 'em088_00', joints: J, rage: false, dt: 1, carry: over.k != null ? over.k : c.k,
                 owner: { x: 0, y: c.ownerY, z: 0 }, ownerPos: { x: c.ownerPos[0], y: c.ownerPos[1], z: c.ownerPos[2] },
                 effectAlive: () => true };
  const tgt = over.target || c.target || [0, 0, 1000];
  const rock = v => ({ variant: v, target: { x: tgt[0], y: tgt[1], z: tgt[2] }, floorY: 0 });
  let clip, list, variant, from = 0;
  if (c.kind === 'throw'){ list = '2'; clip = 'Motion[17]'; variant = '7:0x10'; from = 150; }
  else if (c.kind === 'drop4'){ list = '2'; clip = 'Motion[28]'; variant = '1:0x06'; }
  else if (c.kind === 'drop2'){ list = '3'; clip = 'Motion[3]'; variant = null; }
  else { list = '2'; clip = 'Motion[19]'; variant = null; from = 85;
         st.spots088 = { [c.k]: { pos: c.spot[0].map(f), angles: c.spot[1].map(f) } }; }
  // a step of another clip first, so the action's start reads last frame's joints (prevJoints) as the game's does
  S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[1]', frame: 0, rock: rock(null) }));
  const snaps = []; let sh = null, outs = [];
  for (let fr = from; fr < from + 900; fr++){
    const out = S.stepShells(st, Object.assign({}, base, { list, clip, frame: fr, rock: rock(variant) }));
    outs.push(out);
    if (!sh && out.spawned.length) sh = out.spawned[0];
    if (sh){
      snaps.push({ state: sh.state, phase: sh.phase, sub: sh.sub, pos: sh.position.slice(), words: sh.angles.map(w => w >>> 0),
                   vel: sh.velocity.slice(), acc: sh.gravity.slice(), started: out.started.filter(x => x.shell === sh).map(x => x.start.key),
                   start: out.spawned.includes(sh) && sh.start ? sh.start.key : null, refused: out.refused.slice() });
      if (sh.state === 0xfe) break;
    }
  }
  return { sh, snaps, outs, st };
}
const eq = (a, b) => a.length === b.length && a.every((x, i) => Object.is(f(x), f(b[i])) || (f(x) === 0 && f(b[i]) === 0));
function compare(c, js, rom){
  const R = rom.slice(1);                             // [0] is the init alone; the viewer's spawn step holds init + move 1
  if (!js.sh) return 'no shell spawned';
  for (let i = 0; i < js.snaps.length; i++){
    const a = js.snaps[i], b = R[i];
    if (!b) return 'the ROM run ended before move ' + (i + 1);
    if (a.state !== b.state) return 'move ' + (i + 1) + ': state ' + a.state + ' / ROM ' + b.state;
    if (a.state === 2 && (a.phase !== b.phase || a.sub !== b.sub)) return 'move ' + (i + 1) + ': phase / sub ' + a.phase + '/' + a.sub + ' ROM ' + b.phase + '/' + b.sub;
    if (!eq(a.pos, b.pos)) return 'move ' + (i + 1) + ': position ' + a.pos + ' / ROM ' + b.pos;
    if (!eq(a.words, b.words)) return 'move ' + (i + 1) + ': words ' + a.words + ' / ROM ' + b.words;
    if (a.state === 2 && !eq(a.vel, b.vel)) return 'move ' + (i + 1) + ': velocity ' + a.vel + ' / ROM ' + b.vel;
    if (a.state === 2 && !eq(a.acc, b.acc)) return 'move ' + (i + 1) + ': acceleration ' + a.acc + ' / ROM ' + b.acc;
    // the effect starts: the ROM's 0x4a11e4 calls this move (param = the ef handle's index), the module's started / spawned start
    const romStarts = b.log.filter(x => x[0] === 'start').map(x => x[1]).sort();
    const md = js.sh.mode.ef, jsStarts = [];
    if (a.start != null) jsStarts.push(md.findIndex(e => e[1] === a.start));
    for (const key of a.started) jsStarts.push(md.findIndex((e, p) => e[1] === key && (p === 0 || p === 4)));
    if (romStarts.join() !== jsStarts.sort().join()) return 'move ' + (i + 1) + ': effect starts ' + jsStarts + ' / ROM ' + romStarts;
    if (a.state === 0xfe){
      const spot = b.log.filter(x => x[0] === 'spot');
      if (!spot.length) return 'the ROM wrote no spot at the end';
      return { moves: i + 1, end: a.pos };
    }
  }
  return 'the module never ended (' + js.snaps.length + ' moves)';
}
for (const c of cases){
  const js = runJS(c), r = compare(c, js, ROM[c.name]);
  ok(typeof r === 'object', c.name + ' (mode ' + c.mode + ', behaviour ' + c.behaviour + '): every move bit for bit, to the end',
     typeof r === 'object' ? r.moves + ' moves, rest at ' + r.end.map(v => v.toFixed(1)).join(', ') : r);
  if (c.kind === 'pull'){
    const sp = js.st.spots088[c.k];
    ok(!!sp && eq(sp.pos, js.sh.fin), c.name + ': its end writes the spot (0x10ae90c) at the rest point', sp ? sp.pos.join(', ') : 'none');
  }
  ok(!!js.sh && js.sh.model && js.sh.model.part === ['em087_00_rubble_01', 'em087_00_rubble_02', 'em087_00_rubble_03'][c.k],
     c.name + ': draws object ' + c.k + "'s model (0x10bb5d0)", js.sh && js.sh.model ? js.sh.model.part : 'none');
}
// THE WEB ANCHORS (shell60 / shell61): each L2 M30 wind-up's anchors, made on the play's wrap (the hold's start), every move
// against the ROM run (emu60.py: base60 / base61 ctor, init, move native), through the hang; then a release (an L3 clip's
// start) and the end it makes (u 311)
const EMU60 = EMU.replace(/emu57\.py$/, 'emu60.py');
const webCases = [];
const wv = [['1:0x1e', 61, [0, 1, 2]], ['1:0x24', 61, [0, 1, 2, 3]], ['1:0x1c', 60, [6]], ['1:0x22', 60, [11, 12, 8, 9, 0]]];
const OWN = { pos: [150.0, -90.0, -260.0], y: 0x3456, target: [1200.0, 0.0, 3800.0] };
for (const [v, cls, ms] of wv) for (const m of ms){
  const md = S.SHELL_DATA.em088_00.shells['shell' + cls].modes[m];
  webCases.push({ name: v + '_' + m, cls, mode: m, aimed: cls === 60 && m >= 6, R: 2500.0, ownerPos: OWN.pos, ownerY: OWN.y, target: OWN.target,
                  sh: { ints: md.sh.ints, floats: md.sh.floats, vecs: md.sh.vecs, ef: md.ef, hit: md.hit }, frames: 400, releaseAt: 300 });
}
writeFileSync(join(dir, 'web.json'), JSON.stringify(webCases));
const py60 = spawnSync('python', [EMU60, join(dir, 'web.json'), join(dir, 'webrom.json')], { encoding: 'utf8' });
if (py60.status !== 0){ console.log(py60.stdout, py60.stderr); process.exit(1); }
const WROM = JSON.parse(readFileSync(join(dir, 'webrom.json'), 'utf8'));
const webBase = v => ({ monId: 'em088_00', joints: () => J1, dt: 1, carry: 4, owner: { x: 0, y: OWN.y, z: 0 },
                        ownerPos: { x: OWN.pos[0], y: OWN.pos[1], z: OWN.pos[2] }, effectAlive: () => true,
                        rock: { variant: v, target: { x: OWN.target[0], y: OWN.target[1], z: OWN.target[2] }, floorY: 0 } });
// the wind-up played to its end and wrapped (the anchors made), 299 more frames of it, then an L3 clip (the release)
function webSeq(v, hold = 300){
  const seq = [];
  for (let fr = 50; fr < 60; fr++) seq.push(['2', 'Motion[30]', fr]);
  for (let fr = 0; fr < hold; fr++) seq.push(['2', 'Motion[30]', fr]);
  for (let fr = 0; fr < 3; fr++) seq.push(['3', 'Motion[2]', fr]);
  return seq;
}
for (const [v, cls, ms] of wv){
  for (const m of ms){
    const R = WROM[v + '_' + m].slice(1), st = S.createShellState('em088_00'), base = webBase(v);
    let me = null, n = 0, bad = null;
    for (const [l, c, fr] of webSeq(v)){
      const out = S.stepShells(st, Object.assign({}, base, { list: l, clip: c, frame: fr }));
      if (!me) me = out.spawned.find(x => x.modeIndex === m && x.shell === 'shell' + cls) || null;
      if (!me) continue;
      const b = R[n++];
      if (!b){ bad = 'the ROM ran out at move ' + n; break; }
      if (me.state !== b.state || (me.state === 1 && (me.sub !== b.sub || me.phase !== b.phase))){ bad = 'move ' + n + ': state ' + [me.state, me.sub, me.phase] + ' / ROM ' + [b.state, b.sub, b.phase]; break; }
      if (!eq(me.position, b.pos)){ bad = 'move ' + n + ': position ' + me.position + ' / ROM ' + b.pos; break; }
      if (!eq(me.angles.map(w => w >>> 0), b.words)){ bad = 'move ' + n + ': words ' + me.angles + ' / ROM ' + b.words; break; }
      if (me.state === 1 && !eq(me.velocity, b.vel)){ bad = 'move ' + n + ': velocity ' + me.velocity + ' / ROM ' + b.vel; break; }
      const romStarts = b.log.filter(x => x[0] === 'start').map(x => x[1]).sort().join();
      const jsStarts = out.started.filter(x => x.shell === me).map(x => x.start.param)
                         .concat(out.spawned.includes(me) && me.start ? [0] : []).sort().join();
      if (romStarts !== jsStarts){ bad = 'move ' + n + ': effect starts ' + jsStarts + ' / ROM ' + romStarts; break; }
      if (me.state === 0xfe) break;
    }
    ok(!bad && me && me.state === 0xfe, v + ' shell' + cls + ' mode ' + m + ': every move bit for bit, the hang, the release (u 311 at the end)',
       bad || (me ? n + ' moves, hung at ' + me.H.map(x => x.toFixed(1)).join(', ') : 'not made'));
  }
}
{
  const st = S.createShellState('em088_00'), base = webBase('1:0x24');
  for (const [l, c, fr] of webSeq('1:0x24', 200).slice(0, -3)) S.stepShells(st, Object.assign({}, base, { list: l, clip: c, frame: fr }));
  const A = S.webAnchors088(st);
  ok(A.d450.every(x => x && x.point.length === 3) && A.d450.map(x => x.thread).join() === 'true,true,true,false' && A.d420.every(x => x === null),
     'webAnchors088: the four d450 anchors at their points, threads on p 0..2 only (0x10b98a8)', A.d450.map(x => x && x.point.map(q => q.toFixed(0)).join('/')).join('  '));
  S.stepShells(st, Object.assign({}, base, { list: '3', clip: 'Motion[2]', frame: 0 }));
  ok(S.webAnchors088(st).d450.every(x => x === null), 'an L3 clip\'s start releases them (the handles emptied)');
}
// THE SILK BALLS (shell00 = sp_00 on base00, fired by the motion event table's type-8 rows on L2 M26): each ball's spawn (the
// row's kind and frame / clock, its yaw offset), every move to its split against the ROM run (emu00.py: sp_00 ctor / init / move
// with base00 native), the split child's request (point and words), and the child's own flight to its landing at world y 0
const EMU00 = EMU.replace(/emu57\.py$/, 'emu00.py');
const SH00 = S.SHELL_DATA.em088_00.shells.shell00;
const B00 = { pos: [40.0, -90.0, -60.0], y: 0x2345, target: [800.0, 0.0, 3100.0] };
const b00base = v => ({ monId: 'em088_00', joints: () => J1, dt: 1, carry: 4, owner: { x: 0, y: B00.y, z: 0 },
                        ownerPos: { x: B00.pos[0], y: B00.pos[1], z: B00.pos[2] }, effectAlive: () => true,
                        rock: { variant: v, target: { x: B00.target[0], y: B00.target[1], z: B00.target[2] }, floorY: 0 } });
function runBalls(v, plays = 1){
  const st = S.createShellState('em088_00'), base = b00base(v), log = [];
  S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[1]', frame: 0 }));
  for (let pl = 0; pl < plays; pl++){
    S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[1]', frame: 0 }));
    for (let fr = 0; fr < 260; fr++){
      const out = S.stepShells(st, Object.assign({}, base, { list: '2', clip: 'Motion[26]', frame: fr }));
      log.push({ fr, out, snap: st.shells.filter(x => x.shell === 'shell00').map(x => ({ id: x.id, m: x.modeIndex, state: x.state, pos: x.position.slice(),
                 words: x.angles.map(w => w >>> 0), vel: x.velocity.slice(), split: x.split, sel: x.selector, creator: x.creator })) });
    }
  }
  return log;
}
const ballCases = [], ballPlan = [];
for (const [v, plays] of [['7:0x0f', 1], ['7:0x15', 2]]){
  const log = runBalls(v, plays);
  const made = log.flatMap(L => L.out.spawned.filter(x => x.shell === 'shell00' && x.modeIndex === 0).map(x => ({ x, fr: L.fr })));
  ballPlan.push({ v, log, made });
  for (const { x } of made)
    ballCases.push({ name: v + '_' + x.id, mode: 0, yaw: x.k.yDeg, ownerPos: B00.pos, ownerWords: [0, B00.y, 0], target: B00.target, joint: J1,
                     sh: { ints: SH00.modes[0].sh.ints, floats: SH00.modes[0].sh.floats, vecs: SH00.modes[0].sh.vecs, ef: SH00.modes[0].ef, hit: SH00.modes[0].hit } });
}
// the children, from what the module made (their request is compared against the ROM's create below)
for (const { v, log } of ballPlan){
  const kids = log.flatMap(L => L.out.spawned.filter(x => x.shell === 'shell00' && x.modeIndex === 1));
  for (const x of kids)
    ballCases.push({ name: v + '_child_' + x.id, mode: 1, yaw: 0, ownerPos: B00.pos, ownerWords: [0, B00.y, 0], target: B00.target, joint: J1,
                     reqPos: x.launchReq.pos, reqWords: x.launchReq.words, frames: 400,
                     sh: { ints: SH00.modes[1].sh.ints, floats: SH00.modes[1].sh.floats, vecs: SH00.modes[1].sh.vecs, ef: SH00.modes[1].ef, hit: SH00.modes[1].hit } });
}
writeFileSync(join(dir, 'balls.json'), JSON.stringify(ballCases));
const py00 = spawnSync('python', [EMU00, join(dir, 'balls.json'), join(dir, 'ballsrom.json')], { encoding: 'utf8' });
if (py00.status !== 0){ console.log(py00.stdout, py00.stderr); process.exit(1); }
const BROM = JSON.parse(readFileSync(join(dir, 'ballsrom.json'), 'utf8'));
for (const { v, log, made } of ballPlan){
  // kind 1 on the frame pair the action code reads (pass001: F[k-2] < 8 <= F[k-1], the step showing 9); kind 5 on the clock, 0 on
  // the clip's first step and one a step after (cad4 <= f0 < cad0: the step showing f0 + 1)
  const want = v === '7:0x0f' ? '8' : '12,44,78,44';
  ok(made.map(m => m.fr).join() === (v === '7:0x0f' ? '9' : '13,45,79,45'), v + ': the balls on their rows (kind 1 crossing f8 / kind 5 the clock crossing ' + want + ')',
     made.map(m => 'f' + m.fr + ' sel ' + m.x.selector + ' yaw ' + m.x.k.yDeg).join(', '));
  const all = log.flatMap(L => L.snap.map(s => Object.assign({ fr: L.fr }, s)));
  for (const { x } of made.concat(log.flatMap(L => L.out.spawned.filter(y => y.shell === 'shell00' && y.modeIndex === 1).map(y => ({ x: y }))))){
    const name = x.modeIndex === 0 ? v + '_' + x.id : v + '_child_' + x.id;
    const mine = all.filter(s => s.id === x.id);
    // a child made by the LAST shell of the move line is not moved until the next frame (0xc04728's next pointer: shells.js
    // stepShells), so its first snapshot is its init
    const R = BROM[name].slice(mine.length && eq(mine[0].pos, BROM[name][0].pos) && eq(mine[0].vel, BROM[name][0].vel) ? 0 : 1);
    let bad = null, n = 0;
    for (const a of mine){
      const b = R[n++];
      if (!b){ bad = 'the ROM ran out at move ' + n; break; }
      const st = a.state === 0xfe ? 254 : a.state;
      if (st !== b.state){ bad = 'move ' + n + ': state ' + st + ' / ROM ' + b.state; break; }
      if (!eq(a.pos, b.pos)){ bad = 'move ' + n + ': position ' + a.pos + ' / ROM ' + b.pos; break; }
      if (!eq(a.words, b.words)){ bad = 'move ' + n + ': words ' + a.words + ' / ROM ' + b.words; break; }
      if (a.state === 1 && !eq(a.vel, b.vel)){ bad = 'move ' + n + ': velocity ' + a.vel + ' / ROM ' + b.vel; break; }
      if (a.state === 1 && x.modeIndex === 0 && !eq([a.split], [b.split])){ bad = 'move ' + n + ': split ' + a.split + ' / ROM ' + b.split; break; }
      if (b.creates.length){
        const kid = all.find(s => s.creator === x.id);
        const req = kid && log.flatMap(L => L.out.spawned).find(y => y.id === kid.id).launchReq;
        if (!req || !eq(req.pos, b.creates[0].pos) || !eq(req.words, b.creates[0].words)){ bad = 'move ' + n + ': the split request ' + JSON.stringify(req) + ' / ROM ' + JSON.stringify(b.creates[0]); break; }
      }
      if (a.state !== 1) break;
    }
    ok(!bad && n > 0 && mine[mine.length - 1].state !== 1, name + ': every move bit for bit, to its ' + (x.modeIndex === 0 ? 'split' : 'landing'),
       bad || (n + ' moves, ends at ' + mine[mine.length - 1].pos.map(q => q.toFixed(1)).join(', ')));
  }
}
// THE ARENA SILK LINES (shell01 modes 0 / 1 at L2 M33's start, by d3fc 1 / 2 / 3, each play the next): at the world origin, angle
// 0 (0x10b6320's request: the zero vector, 0x1620e60), living while hit slot 0 is on (90 + 1800), an old line ended by the new
{
  const st = S.createShellState('em088_00');
  const base = { monId: 'em088_00', joints: () => J1, dt: 1, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 10, y: -90, z: 5 }, hitLife: true,
                 effectAlive: () => true, rock: { variant: '1:0x19', target: { x: 0, y: 0, z: 1000 }, floorY: 0 } };
  S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[1]', frame: 0 }));
  const made = [], ended = [];
  for (let fr = 0; fr < 2400; fr++){
    const o = S.stepShells(st, Object.assign({}, base, { list: fr < 600 ? '2' : '0', clip: fr < 600 ? 'Motion[33]' : 'Motion[1]', frame: fr % 200 }));
    for (const x of o.spawned) made.push([fr, x.modeIndex, x.position.join('/'), x.angles.join('/'), x.start && x.start.key]);
    for (const x of o.ended) ended.push([fr, x.id]);
  }
  ok(made.map(m => m[0] + ':' + m[1]).join() === '0:0,200:1,400:0,400:1' && made.every(m => m[2] === '0/0/0' && m[3] === '0/0/0'),
     '(1, 0x19): the lines at each L2 M33 start by d3fc 1 / 2 / 3, at the world origin, angle 0, u 90 / u 91', made.map(m => 'f' + m[0] + ' mode ' + m[1] + ' u ' + m[4]).join(', '));
  const last = ended[ended.length - 1];
  ok(ended.length === 4 && last[0] >= 400 + 1880 && last[0] <= 400 + 1900, 'the lines live while slot 0 is on (90 + 1800) -- the old ones ended by the new',
     ended.map(e => 'f' + e[0]).join(', '));
}
// CONTROLS: a wrong target, joint and object must fail
{
  const c = cases.find(x => x.name === 'throw0');
  ok(typeof compare(c, runJS(c, { target: [310.0, 0.0, 2500.0] }), ROM[c.name]) === 'string', 'control: a target 10 off fails the throw');
  ok(typeof compare(c, runJS(c, { joint: J2 }), ROM[c.name]) === 'string', 'control: another joint matrix fails the throw');
  const d = cases.find(x => x.name === 'drop4_0');
  ok(typeof compare(d, runJS(d, { k: 1 }), ROM[d.name]) === 'string', 'control: another object fails the drop');
}
// the contract
ok(S.pickVariantsFor('em088_00', '2', 'Motion[17]').join() === '2:0x0f,7:0x10,7:0x32', 'L2 M17 picks: the move and the two throws', S.pickVariantsFor('em088_00', '2', 'Motion[17]').join());
ok(S.pickVariantsFor('em088_00', '2', 'Motion[28]').join() === '1:0x10,1:0x06', 'L2 M28 picks: the rage end and (1, 6)');
ok(S.pickVariantsFor('em088_00', '3', 'Motion[3]').length === 0 && S.actionFor('em088_00', '3', 'Motion[3]').spawns[0].drop === 2,
   'L3 M3: no pick (every action drops), the always row');
ok(S.heldUntil088('2', 'Motion[17]', [7, 0x10]) === 160 && S.heldUntil088('2', 'Motion[17]', [2, 0x0f]) === null, 'heldUntil088: the throw 160, the move none');
ok(S.pullClip088('2', 'Motion[19]') && S.pullClip088('2', 'Motion[37]_loop') && !S.pullClip088('2', 'Motion[17]'), 'pullClip088: L2 M19 / M37');
{
  const c = cases.find(x => x.name === 'throw0');
  const none = runJS(c, { k: 4 });
  ok(!none.sh && none.outs.some(o => o.refused.some(r => /carrying nothing/.test(r.why))), 'carrying nothing: no shell, refused by name');
  const p = cases.find(x => x.name === 'pull0'), st = S.createShellState('em088_00');
  const out = S.stepShells(st, { monId: 'em088_00', list: '2', clip: 'Motion[19]', frame: 91, joints: () => p.joint, carry: 0, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 } });
  const out2 = S.stepShells(st, { monId: 'em088_00', list: '2', clip: 'Motion[19]', frame: 92, joints: () => p.joint, carry: 0, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 } });
  const out3 = S.stepShells(st, { monId: 'em088_00', list: '2', clip: 'Motion[19]', frame: 93, joints: () => p.joint, carry: 0, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 } });
  const all = [out, out2, out3].flatMap(o => o.refused);
  ok(all.some(r => /no spot for object 0/.test(r.why)) && ![out, out2, out3].some(o => o.spawned.length), 'a pull with no spot this session: refused by name', all.map(r => r.why).join(' | '));
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

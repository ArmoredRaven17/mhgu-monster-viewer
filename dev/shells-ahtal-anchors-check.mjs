// Gap E replay: Ahtal-Ka's web anchors through sub-states 2 / 3 in the PATCHED COPY of shells.js (gapE/render/shells.js, made by
// patch.py), against the ROM run (gapE/emu60x.py: base60 / base61 ctor, init, move native; 0x4380e4 / 0x43a374 called before the
// move on which the viewer's action start lands).
//   node replay.mjs           (python patch.py first)
// Plays: a wind-up's L2 M30 to its wrap (the anchors made, web088), a hold, then the throw / orbit clip by its variant:
//   (7, 0x2c) L2 M16 / (7, 0x2f) L2 M3 / (7, 0x36) L2 M2 / (7, 0x31) L2 M17 at their start -> anchors088 -> reaim60 (shell60);
//   (7, 0x33) L2 M35 crossing f86 ((7, 0x34)'s start) -> anchors088 -> sub-state 2 (shell61);
// then L0 M1 (no row) until every anchor has ended. Every move is compared bit for bit (float32): state / sub / phase, +0x40,
// the words, the velocity (state 1) and the effect starts; u 301 (shell60 ef 7) / u 360 (shell61 ef 4) are reported where they start.
import { writeFileSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const HERE = 'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/gapE';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const f = Math.fround;
const eq = (a, b) => a.length === b.length && a.every((x, i) => Object.is(f(x), f(b[i])) || (f(x) === 0 && f(b[i]) === 0));
let pass = 0, fail = 0;
const ok = (c, msg, detail = '') => { if (c) pass++; else fail++; console.log((c ? 'PASS ' : 'FAIL ') + msg + (detail ? '  -- ' + detail : '')); };
function jointOf(a, b, c, t){
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
  const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
  const R = mul(mul(Rz, Rx), Ry);
  return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
}
const J1 = jointOf(0.7, -0.3, 0.2, [120.0, 650.0, 380.0]);
const OWN = { pos: [150.0, -90.0, -260.0], y: 0x3456, target: [1200.0, 0.0, 3800.0] };
const base = v => ({ monId: 'em088_00', joints: () => J1, dt: 1, carry: 4, owner: { x: 0, y: OWN.y, z: 0 },
                     ownerPos: { x: OWN.pos[0], y: OWN.pos[1], z: OWN.pos[2] }, effectAlive: () => true,
                     rock: { variant: v, target: { x: OWN.target[0], y: OWN.target[1], z: OWN.target[2] }, floorY: 0 } });
// the plays: [wind-up variant, hold frames, throw variant, its clip, its frames, idle frames after]
const PLAYS = [
  { name: 'A', cls: 60, web: '1:0x22', hold: 300, act: '7:0x2c', clip: 'Motion[16]', n: 120, idle: 700 },
  { name: 'B', cls: 60, web: '1:0x1c', hold: 300, act: '7:0x2f', clip: 'Motion[3]', n: 120, idle: 700 },
  { name: 'C', cls: 60, web: '1:0x22', hold: 60, act: '7:0x36', clip: 'Motion[2]', n: 120, idle: 700 },   // re-aimed mid sub-state 0
  { name: 'D', cls: 61, web: '1:0x24', hold: 300, act: '7:0x33', clip: 'Motion[35]', n: 150, idle: 1200 },
  { name: 'E', cls: 61, web: '1:0x1e', hold: 300, act: '7:0x33', clip: 'Motion[35]', n: 150, idle: 1200 },
];
const runs = [];
for (const P of PLAYS){
  const st = S.createShellState('em088_00');
  const seq = [];
  for (let fr = 50; fr < 60; fr++) seq.push([P.web, '2', 'Motion[30]', fr]);
  for (let fr = 0; fr < P.hold; fr++) seq.push([P.web, '2', 'Motion[30]', fr]);
  for (let fr = 0; fr < P.n; fr++) seq.push([P.act, '2', P.clip, fr]);
  for (let fr = 0; fr < P.idle; fr++) seq.push([null, '0', 'Motion[1]', fr % 60]);
  const mine = new Map();                       // id -> { S, s0, log: [] }
  let trigger = null;
  seq.forEach(([v, l, c, fr], step) => {
    const before = new Map([...mine.values()].map(m => [m.S.id, m.S.sub]));
    const out = S.stepShells(st, Object.assign({}, base(v), { list: l, clip: c, frame: fr }));
    for (const x of out.spawned) if (x.shell === 'shell' + P.cls) mine.set(x.id, { S: x, s0: step, log: [] });
    for (const m of mine.values()){
      if (m.done) continue;
      const me = m.S;
      if (trigger == null && before.has(me.id) && l === '2' && c === P.clip && me.sub === 2 && before.get(me.id) !== 2) trigger = step;
      const starts = out.started.filter(x => x.shell === me).map(x => x.start.param).concat(out.spawned.includes(me) && me.start ? [0] : []);
      m.log.push({ step, state: me.state, sub: me.sub, phase: me.phase, pos: me.position.slice(), words: me.angles.map(w => w >>> 0),
                   vel: me.velocity.slice(), starts: starts.sort(), keys: out.started.filter(x => x.shell === me).map(x => x.start.key) });
      if (me.state === 0xfe) m.done = true;
    }
  });
  runs.push({ P, mine: [...mine.values()], trigger });
}
// the ROM cases
const cases = [];
for (const { P, mine, trigger } of runs) for (const m of mine){
  const md = S.SHELL_DATA.em088_00.shells['shell' + P.cls].modes[m.S.modeIndex];
  // a d420 slot re-made by a later web is released (not this replay's subject): only anchors alive at the trigger
  const c = { name: P.name + '_' + m.S.id, cls: P.cls, mode: m.S.modeIndex, aimed: P.cls === 60 && m.S.modeIndex >= 6, R: 2500.0,
              ownerPos: OWN.pos, ownerY: OWN.y, target: OWN.target, frames: P.cls === 60 ? 1200 : 1800,
              sh: { ints: md.sh.ints, floats: md.sh.floats, vecs: md.sh.vecs, ef: md.ef, hit: md.hit } };
  if (trigger != null){ if (P.cls === 60) c.reaimAt = trigger - m.s0; else c.orbitAt = trigger - m.s0; }
  cases.push(c); m.case = c;
}
writeFileSync(join(HERE, 'replay_cases.json'), JSON.stringify(cases));
const py = spawnSync('python', [join(HERE, 'emu60x.py'), join(HERE, 'replay_cases.json'), join(HERE, 'replay_rom.json')], { encoding: 'utf8' });
if (py.status !== 0){ console.log(py.stdout, py.stderr); process.exit(1); }
const ROM = JSON.parse(readFileSync(join(HERE, 'replay_rom.json'), 'utf8'));
for (const { P, mine, trigger } of runs){
  ok(trigger != null, P.name + ' ' + P.act + ' ' + P.clip + ': the action start moves the anchors to sub-state 2 (anchors088)',
     trigger != null ? 'step ' + trigger : 'never');
  for (const m of mine){
    const R = ROM[m.case.name].slice(1);
    let bad = null, n = 0, u301 = null, u360 = null, u310 = null, ef4 = null;
    for (const b of m.log){
      const r = R[n++];
      if (!r){ bad = 'the ROM ran out at move ' + n; break; }
      if (b.state !== r.state || (b.state === 1 && (b.sub !== r.sub || b.phase !== r.phase))){ bad = 'move ' + n + ': state ' + [b.state, b.sub, b.phase] + ' / ROM ' + [r.state, r.sub, r.phase]; break; }
      if (!eq(b.pos, r.pos)){ bad = 'move ' + n + ' (' + [r.sub, r.phase] + '): position ' + b.pos + ' / ROM ' + r.pos; break; }
      if (!eq(b.words, r.words)){ bad = 'move ' + n + ' (' + [r.sub, r.phase] + '): words ' + b.words + ' / ROM ' + r.words; break; }
      if (b.state === 1 && !eq(b.vel, r.vel)){ bad = 'move ' + n + ' (' + [r.sub, r.phase] + '): velocity ' + b.vel + ' / ROM ' + r.vel; break; }
      const rs = r.log.filter(x => x[0] === 'start').map(x => x[1]).sort().join(), js = b.starts.join();
      if (rs !== js){ bad = 'move ' + n + ': effect starts ' + js + ' / ROM ' + rs; break; }
      const key = (p) => b.keys[b.starts.indexOf(p)];
      if (P.cls === 60 && b.starts.includes(7)) u301 = 'step ' + b.step + ' (move ' + (n - 1) + ', u ' + m.S.mode.ef[7][1] + ')';
      if (P.cls === 60 && b.starts.includes(4)) ef4 = 'u ' + m.S.mode.ef[4][1];
      if (P.cls === 61 && b.starts.includes(4)) u360 = 'step ' + b.step + ' (move ' + (n - 1) + ', u ' + m.S.mode.ef[4][1] + ')';
      if (b.state === 0xfe) u310 = b.starts.map(p => 'u ' + m.S.mode.ef[p][1]).join('/') + ' at ' + b.pos.map(x => x.toFixed(1)).join(', ');
    }
    const last = m.log[m.log.length - 1], romLast = R[R.length - 1];
    // shell61 mode 3: floats 13 / 14 = 0 -- its orbit's spin never changes sign, so 0x43a1f4 never answers 1: it stays in sub-state
    // 2 phase 1 (at O) until a release; the ROM run the same (it never ends in its frames)
    const parked = !bad && last.state === 1 && romLast.state === 1 && romLast.sub === 2 && romLast.phase === 1 && last.sub === 2 && last.phase === 1;
    if (parked) u310 = 'none: parked in sub-state 2 phase 1 at ' + last.pos.map(x => x.toFixed(1)).join(', ') + ' (the ROM the same through ' + R.length + ' moves)';
    ok(!bad && (last.state === 0xfe || parked), P.name + ' shell' + P.cls + ' mode ' + m.S.modeIndex + ': every move bit for bit through sub-states 2 / 3 to the end',
       bad || (m.log.length + ' moves; ' + (P.cls === 60 ? 'u 301 ' + (u301 || 'NOT STARTED') + ', ef 4 ' + (ef4 || '-') : 'u 360 ' + (u360 || 'NOT STARTED')) + '; end ' + u310));
    if (P.cls === 60) ok(!!u301, P.name + ' shell60 mode ' + m.S.modeIndex + ': u 301 (em088_00u:301, ef 7) starts at the throw (sub-state 3)', u301 || 'none');
    else ok(!!u360, P.name + ' shell61 mode ' + m.S.modeIndex + ': u 360 (em088_00u:360, ef 4) starts at the orbit (sub-state 2)', u360 || 'none');
  }
}
// CONTROLS: the same ROM runs against a JS run whose re-aim is one move late, and one whose orbit row is dropped, must FAIL
{
  const P = PLAYS[0], m = runs[0].mine[0], R = ROM[m.case.name].slice(1);
  const late = JSON.parse(JSON.stringify(m.case)); late.name = 'ctl_late'; late.reaimAt += 1;
  writeFileSync(join(HERE, 'ctl_cases.json'), JSON.stringify([late, Object.assign({}, runs[3].mine[0].case, { name: 'ctl_noorbit', orbitAt: -1 })]));
  spawnSync('python', [join(HERE, 'emu60x.py'), join(HERE, 'ctl_cases.json'), join(HERE, 'ctl_rom.json')], { encoding: 'utf8' });
  const C = JSON.parse(readFileSync(join(HERE, 'ctl_rom.json'), 'utf8'));
  const first = (log, rom) => { for (let i = 0; i < log.length; i++){ const r = rom[i]; if (!r || !eq(log[i].pos, r.pos) || log[i].sub !== r.sub || log[i].phase !== r.phase) return i; } return -1; };
  const a = first(m.log, C.ctl_late.slice(1)), b = first(runs[3].mine[0].log, C.ctl_noorbit.slice(1));
  ok(a >= 0, 'control: the ROM re-aimed one move later differs from the viewer', 'first difference at move ' + a);
  ok(b >= 0, 'control: the ROM with no orbit-on differs from the viewer', 'first difference at move ' + b);
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

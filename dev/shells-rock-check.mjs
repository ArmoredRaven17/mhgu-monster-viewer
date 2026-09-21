// Savage Deviljho's rock shells in render/shells.js -- shell00 modes 0 / 8, shell54 modes 0 / 4 -- against the ROM.
//
//   1. THE DECODE'S REFERENCE FLIGHTS (E:\offline\decode\notes\shells-em043.md section 9.10): every value it lists,
//      float32 bit patterns where it gives them and its printed digits elsewhere; the hit / bounce moves and points,
//      the effect keys started there, the rock effect's stop; the no-hit timeouts.
//   2. WHOLE FLIGHTS, EVERY MOVE, BIT FOR BIT, against the ROM itself: the Unicorn harness in
//      C:\MHGU-Extract\efx\agents\rock-scratch (flight.py: the real ctor, init and move; hooked there are only the .shl
//      param readers, the hit registration, the stage query 0x183490 -- answered by the same plane -- and the effect
//      start / stop, logged). The ROM's trace digests are embedded below; --rom runs the harness again (python with
//      unicorn, env ROCK_SCRATCH overrides its folder) and compares line by line.
//   3. The module's contract: the spawn test and the joints it reads, the inputs that are not read (no rock without
//      them), the ending (waits for its effects, at most 1800 steps), a clip change not ending a flight.
//
//   node dev/shells-rock-check.mjs [--rom] [--print <scenario>]
//
// Joint 4 in the reference flights is the identity rotation at (0, 300, 400); the owner's X angle is 0; the floor is
// at 0 unless a scenario says otherwise. Exit code 1 when anything fails.
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createShellState, stepShells } from '../docs/render/shells.js';

const f = Math.fround;
const DV = new DataView(new ArrayBuffer(4));
const bits = x => { DV.setFloat32(0, x, true); return DV.getUint32(0, true); };
const hx = x => bits(x).toString(16).padStart(8, '0');
const w8 = x => (x >>> 0).toString(16).padStart(8, '0');
const v3 = v => v.map(hx).join(',');
const a3 = v => v.map(w8).join(',');

let pass = 0, fail = 0;
function check(name, ok, detail){
  if (ok) pass++; else fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  -- ' + detail : ''));
}
const fmt = v => '(' + v.map(x => +x.toFixed(6)).join(', ') + ')';
// a value printed with `d` decimals in the notes: the float32 must round to it
const digits = (x, want, d) => Math.abs(x - want) <= 0.5 * Math.pow(10, -d) + 1e-9;
const vecDigits = (v, want, d) => v.length === want.length && v.every((x, i) => digits(x, want[i], d));

// ---- the scenarios (shared with the ROM harness run) -------------------------------------------------------------
const I4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 300, 400, 1].map(f);
const R4 = [0.9, 0.1, -0.35, 0, -0.05, 0.98, 0.12, 0, 0.36, -0.1, 0.92, 0, -120.5, 355.25, 610.75, 1.0].map(f);
const SC = {
  // section 9.10's three reference flights
  A:  { variant: 'shell00_0', kind: 'shell00', mode: 0, m: I4, T: [0, 0, 2000], oX: 0, oY: 0, floor: 0, frames: 100 },
  B:  { variant: 'shell00_8', kind: 'shell00', mode: 8, m: I4, T: [800, 0, 2600], oX: 0, oY: 0, floor: 0, frames: 200 },
  C:  { variant: 'shell54_0', kind: 'shell54', mode: 0, m: I4, T: [0, 0, 2000], oX: 0, oY: 0x3000, floor: 0, frames: 200 },
  // no floor to hit (timeout_check.py): the flight times out
  At: { variant: 'shell00_0', kind: 'shell00', mode: 0, m: I4, T: [0, 0, 2000], oX: 0, oY: 0, floor: -1e9, frames: 100 },
  Bt: { variant: 'shell00_8', kind: 'shell00', mode: 8, m: I4, T: [0, 0, 2000], oX: 0, oY: 0, floor: -1e9, frames: 260 },
  Ct: { variant: 'shell54_0', kind: 'shell54', mode: 0, m: I4, T: [0, 0, 2000], oX: 0, oY: 0, floor: -1e9, frames: 260 },
  // beyond 9.10: a rotated, scaled joint, owner angles that are not 0 (X words past 16 bits), a raised floor, the held rock
  R0: { variant: 'shell00_0', kind: 'shell00', mode: 0, m: R4, T: [300, 0, 2400], oX: 0, oY: 0x1c00, floor: 0, frames: 260 },
  R8: { variant: 'shell00_8', kind: 'shell00', mode: 8, m: R4, T: [300, 0, 2400], oX: 0xff00, oY: 0x1c00, floor: 0, frames: 260 },
  R54: { variant: 'shell54_0', kind: 'shell54', mode: 0, m: R4, T: [300, 0, 2400], oX: 0xf000, oY: 0x1c00, floor: 0, frames: 260 },
  F54: { variant: 'shell54_0', kind: 'shell54', mode: 0, m: I4, T: [0, 0, 2000], oX: 0, oY: 0x3000, floor: 150.5, frames: 260 },
  H4: { force: [7, 0x7f], clip: 'Motion[23]', kind: 'shell54', mode: 4, m: I4, T: [0, 0, 2000], oX: 0, oY: 0, floor: 0, frames: 260,
        motion: { id: 0x217, spawn: 108 } },
};

// The ROM harness's trace of each scenario, as SHA-256 of the canonical text (the serializer below; the harness side
// is ROM_PY). Produced by `node dev/shells-rock-check.mjs --rom` on 2026-09-21.
const ROM_SHA256 = {
  A: 'e37c3e1d4b9ac803292bf67d46fbcd396672198e51a3665a758ae9354137cc95',
  B: 'abafbdfbf4c0944d080beeaa3d4f21e54553f163d8fbd6846eb051321ede2e72',
  C: 'd35b3b91e4a1b57f537b1e356a553e2d2e6d2d94afc335c833229c484125fba6',
  At: 'e858a8dd6e516405997cf7d539193b4d73248a601d1390c14d2d4001ca27c738',
  Bt: 'a22de73cba09f0d37fba8d667d8e6f8384ce1dd4edb36e29b2e79699cb8ac088',
  Ct: '082213eaeb965b9f5d5fe0877c708097619a09a5dc862bdbbb20c25ba1134591',
  R0: 'ddc1fb32619ff1bb96d91b1c6a368e5d55e07c66af0686e23f996615e888ebf8',
  R8: '8889868bfa983049d4e3740b895804273c27e3ac65377c600f8eea161d52815d',
  R54: '1d72c3f64b7f6047b2234a873924d995d23324267be2b3d067dfe1839f12cbe4',
  F54: '8c01baed811d0f1a971369e9d79e72f0216218ffa958f3b1b316648073873227',
  H4: 'f12f85c70c396f477173038253a7c1fc9ba8868bd175da97c5820d81fe394422',
};

// ---- a scenario through stepShells, as the viewer steps it: one step per pose frame 0, 1, 2 ... -------------------
function fly(sc, opts = {}){
  const st = createShellState('em043_05');
  const clip = sc.clip || 'Motion[24]';
  const joints = opts.joints || (() => gid => gid === 4 ? sc.m : null);
  const rec = { spawnStep: null, S: null, lines: [], moves: [], endMove: null, endStep: null, removedStep: null, refused: [], outs: [] };
  const steps = opts.steps || ((sc.motion ? sc.motion.spawn : 114) + 2 + sc.frames);
  for (let step = 0; step < steps; step++){
    const input = { monId: 'em043_05', list: '2', clip: opts.clipAt ? opts.clipAt(step) : clip, frame: step, joints: joints(step),
                    rock: opts.rock ? opts.rock(step) : { variant: sc.variant || null, target: { x: sc.T[0], y: sc.T[1], z: sc.T[2] }, floorY: sc.floor },
                    owner: opts.owner ? opts.owner(step) : { x: sc.oX || 0, y: sc.oY || 0, z: 0 } };
    if (sc.force) input.action = sc.force;
    if (opts.effectAlive) input.effectAlive = (S, param, h) => opts.effectAlive(step, S, param, h);
    const out = stepShells(st, input);
    rec.outs.push(out);
    for (const r of out.refused) rec.refused.push(Object.assign({ step }, r));
    if (!rec.S && out.spawned.length){
      const S = rec.S = out.spawned[0];
      rec.spawnStep = step;
      rec.lines.push(`spawn pos=${v3(S.launch.position)} vel=${v3(S.launch.velocity)} anchor=${v3(S.launch.anchor)} ang=${a3(S.launch.angles)} setup=${a3(S.launch.setup)}`);
      if (S.start) rec.lines.push(`  start list=${S.start.listId} key=${S.start.key} at=${v3(S.start.requester.position)}`);
    }
    const S = rec.S;
    if (!S) continue;
    if (out.removed.includes(S) && rec.removedStep == null) rec.removedStep = step;
    if (rec.endMove == null && S.moves > rec.moves.length){
      // this step's move
      rec.moves.push({ k: S.moves, step, state: S.state, position: S.position.slice(), velocity: S.velocity.slice(),
                       anchor: S.anchor.slice(), angles: S.angles.slice(), timer: S.timer, bounces: S.bounces,
                       held: S.held, events: S.events.slice(), started: out.started.filter(e => e.shell === S).map(e => e.start) });
      rec.lines.push(`m${S.moves} st=${S.state.toString(16).padStart(2, '0')} pos=${v3(S.position)} vel=${v3(S.velocity)} anchor=${v3(S.anchor)} ang=${a3(S.angles)} timer=${hx(S.timer)}`);
      for (const e of S.events){
        if (e.ev === 'hit') rec.lines.push(`  hit at=${v3(e.point)}`);
        else if (e.ev === 'start') rec.lines.push(`  start list=${e.start.listId} key=${e.start.key} at=${v3(e.start.requester.position)}`);
        else if (e.ev === 'refused') rec.lines.push('  refused');
        else if (e.ev === 'stop') rec.lines.push(`  stop flag=${e.flag}`);
      }
      if (S.state !== 1){ rec.endMove = S.moves; rec.endStep = step; }
    }
  }
  rec.text = rec.lines.join('\n') + '\n';
  rec.move = k => rec.moves[k - 1];
  return rec;
}
const sha = s => createHash('sha256').update(s).digest('hex');

// ---- 1. the reference flights of 9.10 ----------------------------------------------------------------------------
console.log('== 1. notes 9.10 reference flights (joint 4 = identity + (0, 300, 400), owner X 0, floor y0 = 0)');
const runs = {};
for (const name of Object.keys(SC)) runs[name] = fly(SC[name]);
{
  const r = runs.A, S = r.S, L = S && S.launch;
  check('A spawn: when the motion passes 114.0 (the step showing pose 115), first move in the same step',
        r.spawnStep === 115 && r.move(1).step === 115, 'spawn step ' + r.spawnStep);
  check('A spawn position (0, 500, 460)', L && L.position[0] === 0 && L.position[1] === 500 && L.position[2] === 460, L && fmt(L.position));
  check('A spawn angles (0x0c5b, 0, 0)', L && L.angles[0] === 0x0c5b && L.angles[1] === 0 && L.angles[2] === 0, L && L.angles.map(a => '0x' + a.toString(16)).join(' '));
  check('A spawn velocity (0, -3.001476, 51.451347)', L && vecDigits(L.velocity, [0, -3.001476, 51.451347], 6), L && fmt(L.velocity));
  const st = S && S.start;
  check('A spawn start: EffectParam 0 = u 0 (em043_05u), at the spawn position, no rotation, scale 1, parent shell',
        !!st && st.param === 0 && st.list === 'u' && st.pel === 'em043_05u' && st.key === 0 && st.requester.rotationDeg === null &&
        st.requester.scale.every(s => s === 1) && st.requester.parent === 'shell' && v3(st.requester.position) === v3(L.position),
        st && `u ${st.key} at ${fmt(st.requester.position)}`);
  const m1 = r.move(1);
  check('A move 1 position (0, 496.6235, 511.4514) = [0, 0x43f84fd0, 0x43ffb9c6]',
        bits(m1.position[0]) === 0 && bits(m1.position[1]) === 0x43f84fd0 && bits(m1.position[2]) === 0x43ffb9c6, v3(m1.position));
  check('A move 1 angle X 0x2f7', m1.angles[0] === 0x2f7, '0x' + m1.angles[0].toString(16));
  check('A move 10 position (0, 432.4854, 974.5135)', vecDigits(r.move(10).position, [0, 432.4854, 974.5135], 4), fmt(r.move(10).position));
  const m33 = r.move(33), hit = m33 && m33.events.find(e => e.ev === 'hit'), land = m33 && m33.started[0];
  check('A move 33 hit (0, 0, 2143.942)', !!hit && vecDigits(hit.point, [0, 0, 2143.942], 3) && r.endMove === 33, hit && fmt(hit.point));
  check('A move 33 landing effect u 10 at the contact, placed (no rotation, scale 1)',
        !!land && land.kind === 'landing' && land.key === 10 && v3(land.requester.position) === v3(hit.point) && land.requester.rotationDeg === null,
        land && `u ${land.key} (${land.kind}) at ${fmt(land.requester.position)}`);
  const stop = m33 && m33.events.find(e => e.ev === 'stop');
  check('A move 33 rock effect (u 0) stopped gracefully (0x329c40(h, 0)), ending timer 1800',
        !!stop && stop.key === 0 && stop.flag === 0 && m33.state === 0xfe && m33.timer === 1800, stop && `stop u ${stop.key} flag ${stop.flag}, timer ${m33.timer}`);
}
{
  const r = runs.B, L = r.S && r.S.launch;
  check('B spawn pitch 0xce26 (-70.1 degrees), angles (0xce26, 0, 0)', L && L.angles[0] === 0xce26 && L.angles[1] === 0 && L.angles[2] === 0,
        L && '0x' + L.angles[0].toString(16));
  check('B spawn velocity (0, 47.015518, 17.015909)', L && vecDigits(L.velocity, [0, 47.015518, 17.015909], 6), L && fmt(L.velocity));
  const m = r.move(136), hit = m && m.events.find(e => e.ev === 'hit'), land = m && m.started[0];
  check('B move 136 hit (0, 0, 2761.107)', !!hit && vecDigits(hit.point, [0, 0, 2761.107], 3) && r.endMove === 136, hit && fmt(hit.point) + ' at move ' + r.endMove);
  check('B landing effect u 10 at the contact', !!land && land.key === 10 && land.kind === 'landing', land && 'u ' + land.key);
  check('B rock effect stopped at move 136', !!(m && m.events.find(e => e.ev === 'stop' && e.key === 0)));
  check('B angles never change (flag 0x40)', r.moves.every(x => x.angles[0] === L.angles[0] && x.angles[1] === L.angles[1] && x.angles[2] === L.angles[2]),
        r.moves.length + ' moves');
}
{
  const r = runs.C, L = r.S && r.S.launch;
  check('C spawn angles (0x0c5b, 0x3000, 0)', L && L.angles[0] === 0x0c5b && L.angles[1] === 0x3000 && L.angles[2] === 0, L && L.angles.map(a => '0x' + a.toString(16)).join(' '));
  check('C spawn velocity (47.534843, -3.001476, 19.689577)', L && vecDigits(L.velocity, [47.534843, -3.001476, 19.689577], 6), L && fmt(L.velocity));
  const b1 = r.move(33), h1 = b1 && b1.events.find(e => e.ev === 'hit'), s1 = b1 && b1.started[0];
  check('C move 33 bounce at (1555.76, 0, 1104.417)', !!h1 && vecDigits(h1.point, [1555.76, 0, 1104.417], 3) && b1.state === 1 && b1.bounces === 1, h1 && fmt(h1.point));
  check('C move 33 bounce effect u 20 at the contact', !!s1 && s1.key === 20 && s1.kind === 'bounce' && s1.param === 4 && v3(s1.requester.position) === v3(h1.point),
        s1 && `u ${s1.key} (param ${s1.param})`);
  check('C move 33 position y 10.0, velocity (14.2605, 24.0, 5.9069)', !!b1 && b1.position[1] === 10 && vecDigits(b1.velocity, [14.2605, 24.0, 5.9069], 4),
        b1 && `y ${b1.position[1]}, v ${fmt(b1.velocity)}`);
  const b2 = r.move(98), h2 = b2 && b2.events.find(e => e.ev === 'hit'), s2 = b2 && b2.started[0];
  check('C move 98 bounce at (2474.282, 0, 1484.879), u 20, vy 19.2', !!h2 && vecDigits(h2.point, [2474.282, 0, 1484.879], 3) && !!s2 && s2.key === 20 &&
        s2.param === 5 && digits(b2.velocity[1], 19.2, 4) && b2.state === 1, h2 && `${fmt(h2.point)} u ${s2 && s2.key} (param ${s2 && s2.param}) vy ${b2.velocity[1]}`);
  const between = r.moves.filter(x => x.k !== 33 && x.k !== 98 && x.k < 150 && x.events.some(e => e.ev === 'hit'));
  check('C no other floor contact before move 150', between.length === 0, between.map(x => x.k).join(' '));
  const m = r.move(150), h3 = m && m.events.find(e => e.ev === 'hit'), s3 = m && m.started[0];
  check('C move 150 lands at (2695.508, 0, 1576.517), u 10, rock effect stopped', !!h3 && vecDigits(h3.point, [2695.508, 0, 1576.517], 3) && !!s3 &&
        s3.key === 10 && s3.kind === 'landing' && r.endMove === 150 && !!m.events.find(e => e.ev === 'stop' && e.key === 0),
        h3 && `${fmt(h3.point)} u ${s3 && s3.key} at move ${r.endMove}`);
}
for (const [name, want, label] of [['At', 72, 'shell00 mode 0'], ['Bt', 216, 'shell00 mode 8'], ['Ct', 240, 'shell54 mode 0']]){
  const r = runs[name], m = r.move(want);
  const onlyStop = !!m && m.state === 0xfe && m.started.length === 0 && m.events.some(e => e.ev === 'stop' && e.key === 0 && e.flag === 0) &&
                   !r.moves.some(x => x.events.some(e => e.ev === 'hit' || e.ev === 'start'));
  check(`no floor hit: ${label} ends at move ${want} with the graceful stop only`, r.endMove === want && onlyStop, 'ended at move ' + r.endMove);
}

// ---- 2. every move against the ROM harness ------------------------------------------------------------------------
console.log('== 2. whole flights against the ROM (Unicorn harness, efx\\agents\\rock-scratch), every move bit-exact');
const ROM_PY = String.raw`
import sys, os, json, struct
sys.path.insert(0, os.environ.get('ROCK_SCRATCH', r'C:\MHGU-Extract\efx\agents\rock-scratch'))
import flight as FL
from romrun import w32, wf, w8, OWNER
hx = lambda x: '%08x' % struct.unpack('<I', struct.pack('<f', x))[0]
v3 = lambda v: ','.join(hx(x) for x in v)
a3 = lambda v: ','.join('%08x' % (x & 0xffffffff) for x in v)
def ser(r):
    L = []
    s = r['spawn']
    L.append('spawn pos=%s vel=%s anchor=%s ang=%s setup=%s' % (v3(s['pos']), v3(s['vel']), v3(s['anchor']), a3(s['ang']), a3(r['setup20'])))
    def events(log):
        req = None
        for e in log:
            if e[0] == 'request': req = e[1]
            elif e[0] == 'start': L.append('  start list=%d key=%d at=%s' % (e[2], e[4], v3(req)))
            elif e[0] == 'start refused': L.append('  refused')
            elif e[0] == 'hit': L.append('  hit at=%s' % v3(e[1]))
            elif e[0] == 'stop': L.append('  stop flag=%d' % e[2])
    events(r['log_init'])
    for fr in r['frames']:
        L.append('m%d st=%02x pos=%s vel=%s anchor=%s ang=%s timer=%s' % (fr['k'], fr['state'], v3(fr['pos']), v3(fr['vel']), v3(fr['anchor']), a3(fr['ang']), hx(fr['timer'])))
        events(fr['log'])
        if fr['state'] != 1: break
    return '\n'.join(L) + '\n'
out = {}
for sc in json.load(sys.stdin):
    mo = sc.get('motion')
    def motion(k, mo=mo):
        w32(OWNER + 0x4b4, mo['id'])
        F1 = mo['spawn'] + k - 1
        wf(OWNER + 0x13ac, F1 - 1.0); wf(OWNER + 0x13b4, 1.0); wf(OWNER + 0x13bc, 400.0); wf(OWNER + 0x508, 0.0)
        wf(OWNER + 0x4f4, 0.0); w8(OWNER + 0x13c0, 0)
    r = FL.run(sc['kind'], sc['mode'], sc['m'], sc['T'], sc['oX'], sc['oY'], sc['floor'], sc['frames'], motion if mo else None)
    out[sc['name']] = ser(r)
print(json.dumps(out))
`;
let romTexts = null;
if (process.argv.includes('--rom')){
  const dir = mkdtempSync(join(tmpdir(), 'shells-rock-'));
  const py = join(dir, 'romtrace.py');
  writeFileSync(py, ROM_PY);
  const list = Object.entries(SC).map(([name, s]) => ({ name, kind: s.kind, mode: s.mode, m: s.m, T: s.T, oX: s.oX || 0, oY: s.oY || 0,
                                                         floor: s.floor, frames: s.frames, motion: s.motion || null }));
  const r = spawnSync('python', [py], { input: JSON.stringify(list), encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0){ console.log('the ROM harness did not run:\n' + (r.stderr || r.error)); fail++; }
  else romTexts = JSON.parse(r.stdout);
}
for (const [name, rec] of Object.entries(runs)){
  const got = sha(rec.text), moves = rec.moves.length;
  if (romTexts){
    const rom = romTexts[name], a = rec.text.split('\n'), b = (rom || '').split('\n');
    const i = a.findIndex((x, j) => x !== b[j]);
    check(`${name}: ${moves} moves identical to the ROM run (--rom)`, rom === rec.text,
          rom === rec.text ? 'sha256 ' + got : `first difference, line ${i + 1}:\n   js  ${a[i]}\n   rom ${b[i]}`);
    if (rom && ROM_SHA256[name] && sha(rom) !== ROM_SHA256[name]) console.log(`   (the embedded digest of ${name} is stale: the harness now gives ${sha(rom)})`);
  } else if (ROM_SHA256[name]){
    check(`${name}: ${moves} moves identical to the ROM run (embedded digest)`, got === ROM_SHA256[name], got === ROM_SHA256[name] ? '' : 'sha256 ' + got);
  } else {
    check(`${name}: a ROM digest exists`, false, 'none embedded; run with --rom');
  }
}
const pr = process.argv.indexOf('--print');
if (pr > 0 && runs[process.argv[pr + 1]]) process.stdout.write(runs[process.argv[pr + 1]].text);

// ---- 3. the module's contract ----------------------------------------------------------------------------------------
console.log('== 3. spawn test, inputs not read, ending, clip change');
{
  // the init reads the joints built for the pose BEFORE the one shown (section 1): joint 4 moves with the frame
  const moving = step => gid => gid === 4 ? I4.map((x, i) => i === 14 ? f(400 + step) : x) : null;
  const r = fly(SC.A, { joints: moving, steps: 120 });
  const p = r.S && r.S.launch.point;
  check('the init reads joint 4 as built for pose 114 (spawn step 115)', r.spawnStep === 115 && !!p && p[2] === f(400 + 114 + 60),
        p && `launch z ${p[2]} = 400 + 114 + 60`);
}
{
  const r = fly(Object.assign({}, SC.A, { clip: 'Motion[23]' }), { steps: 120 });
  check('shell00 mode 0 is thrown from Motion[23] as well ((7, 0x09))', !!r.S && r.S.action[1] === 0x09 && r.S.modeIndex === 0 && r.spawnStep === 115,
        r.S && `(7, 0x${r.S.action[1].toString(16)}) mode ${r.S.modeIndex}`);
  const b = fly(SC.B, { steps: 120 }), c = fly(SC.C, { steps: 120 });
  check('the variants give (7, 0x08) shell00 0, (7, 0x4e) shell00 8, (7, 0x5e) shell54 0 on Motion[24]',
        runs.A.S.action[1] === 0x08 && b.S.action[1] === 0x4e && b.S.shell === 'shell00' && b.S.modeIndex === 8 &&
        c.S.action[1] === 0x5e && c.S.shell === 'shell54' && c.S.modeIndex === 0);
}
{
  const none = (rock, owner) => fly(SC.A, { steps: 120, rock: () => rock, owner: owner ? () => owner : undefined });
  const t = { x: 0, y: 0, z: 2000 };
  const r1 = none({ variant: null, target: t, floorY: 0 });
  check('no variant: no rock', !r1.S && r1.refused.length === 0);
  const r2 = none({ variant: 'shell00_0', target: null, floorY: 0 });
  check('no target: no rock (refused)', !r2.S && r2.refused.length === 1 && /target/.test(r2.refused[0].why), r2.refused[0] && r2.refused[0].why);
  const r3 = none({ variant: 'shell00_0', target: t });
  check('no floor: no rock (refused)', !r3.S && r3.refused.length === 1 && /floor/.test(r3.refused[0].why), r3.refused[0] && r3.refused[0].why);
  const r4 = none({ variant: 'shell00_0', target: t, floorY: 0 }, { x: 0, z: 0 });
  check('no owner facing: no rock (refused)', !r4.S && r4.refused.length === 1 && /facing/.test(r4.refused[0].why), r4.refused[0] && r4.refused[0].why);
  const r5 = none(null);
  check('no input.rock at all: no rock', !r5.S && r5.refused.length === 0);
}
{
  // the ending waits for the effects: with them alive (no effectAlive) until its timer runs out, 1800 steps
  const r = fly(SC.A, { steps: 115 + 33 + 1800 + 2 });
  check('ending: effects alive -> removed 1800 steps after the end', r.endStep != null && r.removedStep === r.endStep + 1800,
        `end at step ${r.endStep}, removed at ${r.removedStep}`);
  // both handles gone -> removed at the next move (timeout_check.py on the ROM)
  let endStep = null;
  const r2 = fly(SC.A, { steps: 115 + 33 + 10, effectAlive: (step, S) => { if (endStep == null && S.state === 0xfe) endStep = step; return endStep == null; } });
  check('ending: both effects gone -> removed on the next step', r2.removedStep === r2.endStep + 1, `end at step ${r2.endStep}, removed at ${r2.removedStep}`);
  // only the landing effect still running: the rock waits for it
  let e3 = null;
  const r3 = fly(SC.A, { steps: 115 + 33 + 20, effectAlive: (step, S, param) => { if (e3 == null && S.state === 0xfe) e3 = step; return e3 == null || param !== 0; } });
  check('ending: flying effect gone, landing effect alive -> still waiting', r3.removedStep == null && r3.S.state === 0xfe);
}
{
  // base00 has no motion test: a clip change does not end the flight
  const r = fly(SC.A, { clipAt: step => step <= 130 ? 'Motion[24]' : 'Motion[1]' });
  const same = r.endMove === 33 && r.text === runs.A.text;
  check('a clip change during the flight changes nothing (base00 reads no motion)', same, 'landed at move ' + r.endMove);
  check('a rock is never placed by the shell (place stays null)', r.outs.every(o => o.alive.every(S => S.place == null)));
}
{
  const h = runs.H4, heldTo = h.moves.filter(x => x.held).length;
  check('held rock (shell54 mode 4, forced (7, 0x7f)): spawns at 108, held while the frame is below 124 (moves 1..16)',
        h.spawnStep === 109 && heldTo === 16 && !h.move(17).held, `spawn step ${h.spawnStep}, held for ${heldTo} moves`);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

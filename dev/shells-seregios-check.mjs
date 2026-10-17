// Seregios's c 30 / c 32 shell (em077_00 shell01 0x13c, uShellEm077_sp_01 : base01) in render/shells.js against the ROM.
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/sw77/emu77.py (env SW77_EMU overrides) -- the whole executable on unicorn after its
//      static initialisers (sw37/emu37.py's machine), the getters answered with em077_00.arc's shell01 files: the frame
//      handler's setup (0xfde1e0..0xfde26c: P+0x40.. at +0x10, P+0x50.. at +0x30), the sp_01 ctor 0xfeeb78, the init 0x3fa498
//      with the class's own reader 0xfeeb98 run for real, the move 0x3faec4. Each case runs through stepShells as the viewer
//      steps the clip whose row makes it, and the shell -- deleted or not, its flags, point, words, the effect start (c 30 /
//      c 32) and the refused ef 1, every move's state and stops -- is compared bit for bit. No hit registration on either
//      side (input.hitLife false; the harness hooks 0x4a1ad8): a timer-0 shell ends at its first move.
//   2. The spawn table: each row's frames on its clip (pass001), the pulse STAND-IN's cadence (the clip's first step, then every
//      100.0, across the clip's loops; reset by another motion), the refusals, the hit-slot life with input.hitLife (14 + 10),
//      c 32 exported `when: 'shell'`.
//   3. CONTROLS: the ground, the facing and the size one notch off must FAIL.
//
//   node dev/shells-seregios-check.mjs
//
// Exit code 1 when anything fails.
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const EMU = process.env.SW77_EMU ||
  'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/sw77/emu77.py';
const f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, detail = '') => { if (c){ pass++; console.log('PASS ' + msg + (detail ? '  -- ' + detail : '')); } else { fail++; console.log('FAIL ' + msg + (detail ? '  -- ' + detail : '')); } };
const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

// the cases: a row's clip, the owner block the base01 0x80 arm reads, the expected mode
const C = (name, list, clip, mode, x = {}) => Object.assign({ name, list, clip, mode, owner: [0x0100, 0x3000, 0x0040], ownerPos: [120.5, 340.0, -80.25],
  ground: 10.0, size: [1.2, 1.1], base: 0.9, steps: 80 }, x);
const cases = [
  C('L1M4_mode0', '1', 'Motion[4]', 0),
  C('L1M20_mode0_yaw', '1', 'Motion[20]', 0, { owner: [0, 0xc123, 0], ownerPos: [-2400.75, 25.5, 1300.0], ground: -12.25, size: [0.85, 1.0], base: 1.0 }),
  C('L1M5_mode1', '1', 'Motion[5]', 1, { owner: [0x0200, 0x9000, 0], size: [1.3, 0.95], base: 1.1 }),
  C('L0M24_mode1', '0', 'Motion[24]', 1, { ownerPos: [0.0, 909.9, 0.0], ground: 10.0 }),          // 899.9 above: kept
  C('L1M62_mode1_high', '1', 'Motion[62]', 1, { ownerPos: [0.0, 910.0, 0.0], ground: 10.0 }),     // 900 above: deleted
  C('L1M1_pulse_mode0', '1', 'Motion[1]', 0, { owner: [0xfff0, 0x7777, 0x0123] }),
  C('L1M12_pulse_high', '1', 'Motion[12]', 0, { ownerPos: [50.0, 2000.0, 50.0], ground: 0.0 }),  // deleted by the init
];
const romCase = (c, over = {}) => ({ name: c.name, mode: c.mode, owner: over.owner || c.owner, ownerPos: c.ownerPos, ground: over.ground != null ? over.ground : c.ground,
  size: over.size || c.size, base: c.base, target: [0, 0, 0], joint: I, frames: 6 });
const dir = mkdtempSync(join(tmpdir(), 'sw77-'));
writeFileSync(join(dir, 'cases.json'), JSON.stringify(cases.map(c => romCase(c))));
const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'rom.json')], { encoding: 'utf8', maxBuffer: 1 << 26 });
if (py.status !== 0){ console.log(py.stdout, py.stderr); process.exit(1); }
const ROM = JSON.parse(readFileSync(join(dir, 'rom.json'), 'utf8'));

const inputOf = (c, over = {}) => { const ow = over.owner || c.owner;
  return { monId: 'em077_00', joints: () => I, rage: false, dt: 1, hitLife: !!over.hitLife,
           owner: { x: ow[0], y: ow[1], z: ow[2] }, ownerPos: { x: c.ownerPos[0], y: c.ownerPos[1], z: c.ownerPos[2] },
           ground: over.ground != null ? over.ground : c.ground, size: over.size || c.size, baseScale: c.base,
           rock: { variant: null, floorY: 0 }, effectAlive: () => true }; };
// the clip from frame 0 (one other clip's step first, so the clip's start is a new motion); every shell's moves
function runJS(c, over = {}){
  const st = S.createShellState('em077_00'), base = inputOf(c, over);
  S.stepShells(st, Object.assign({}, base, { list: '0', clip: 'Motion[3]', frame: 0 }));
  const made = [], snaps = new Map(), refused = [];
  for (let fr = 0; fr < (over.steps || c.steps); fr++){
    const out = S.stepShells(st, Object.assign({}, base, { list: c.list, clip: c.clip, frame: over.frameOf ? over.frameOf(fr) : fr,
                                                           loopStart: over.loopStart }));
    refused.push(...out.refused);
    for (const sh of out.spawned) made.push({ sh, step: fr });
    for (const { sh } of made){
      const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
      if (sh.state === 0xff || (L.length && L[L.length - 1].moves === sh.moves)) continue;
      L.push({ moves: sh.moves, state: sh.state, pos: sh.position.slice(), words: sh.angles.map(w => w >>> 0), timer: sh.timer,
               events: (sh.events || []).slice() });
    }
  }
  return { st, made, snaps, refused };
}
const same = (a, b) => Object.is(f(a), f(b));
const eq = (a, b) => a.length === b.length && a.every((x, i) => same(x, b[i]));
function compare(c, over = {}){
  const js = runJS(c, over), R = ROM[over.rom || c.name];
  const deleted = !(R.spawn.state === 1 && R.log.some(x => x[0] === 'start'));
  const first = js.made[0];
  if (deleted) return first ? 'the module made a shell the ROM deleted' : 'deleted, as the ROM';
  if (!first) return 'no shell made' + (js.refused.length ? ' (' + js.refused.map(r => r.why).join('; ') + ')' : '');
  const sh = first.sh;
  if (sh.k.flags !== R.flags) return 'flags ' + sh.k.flags.toString(16) + ' / ROM ' + R.flags.toString(16);
  const ri = R.log.filter(x => x[0] === 'start').map(x => x[1] + ':' + x[2]).concat(R.log.filter(x => x[0] === 'refused').map(x => 'r' + x[1])).join();
  const ji = sh.initEvents.map(e => e.ev === 'start' ? e.start.listId + ':' + e.start.key : 'r' + e.listId).join();
  if (ri !== ji) return 'init effects ' + ji + ' / ROM ' + ri;
  const startAt = R.log.find(x => x[0] === 'start')[3];
  if (!eq(sh.start.requester.position, startAt)) return 'start point ' + sh.start.requester.position + ' / ROM ' + startAt;
  if (!eq(sh.prevPosition, R.spawn.pos)) return 'init position ' + sh.prevPosition + ' / ROM ' + R.spawn.pos;
  const L = js.snaps.get(sh.id);
  for (let i = 0; i < R.frames.length; i++){
    const b = R.frames[i], a = L[i];
    if (!a){ if (b.state === 0xfe && L[L.length - 1].state === 0xfe) break; return 'move ' + b.k + ': none'; }
    if (a.state !== b.state) return 'move ' + b.k + ': state ' + a.state + ' / ROM ' + b.state;
    if (!eq(a.pos, b.pos)) return 'move ' + b.k + ': position ' + a.pos + ' / ROM ' + b.pos;
    if (!eq(a.words, b.ang)) return 'move ' + b.k + ': words ' + a.words + ' / ROM ' + b.ang;
    if (!same(a.timer, b.timer)) return 'move ' + b.k + ': timer ' + a.timer + ' / ROM ' + b.timer;
    const rs = b.log.filter(x => x[0] === 'stop').map(x => 'x' + x[1]).join(), js_ = a.events.filter(e => e.ev === 'stop').map(e => 'x' + e.flag).join();
    if (rs !== js_) return 'move ' + b.k + ': stops ' + js_ + ' / ROM ' + rs;
    if (b.state === 0xfe) return { step: first.step, mode: sh.modeIndex, key: sh.start.key, pos: sh.prevPosition, moves: b.k };
  }
  return 'never ended';
}
for (const c of cases){
  const r = compare(c);
  ok(typeof r === 'object' || r === 'deleted, as the ROM', c.name + ' (' + c.list + ' ' + c.clip + '): the shell bit for bit -- flags, point, words, effects, moves',
     typeof r === 'object' ? 'step ' + r.step + ', mode ' + r.mode + ' c ' + r.key + ' at ' + r.pos.map(v => v.toFixed(3)).join(', ') + ', ended at move ' + r.moves : r);
}

// 2. THE SPAWN TABLE
const stepsOf = (list, clip, n, x = {}) => runJS(C('t', list, clip, 0, { steps: n }), x).made.map(m => m.step);
const rows = [['1', 'Motion[4]', [2]], ['1', 'Motion[20]', [52]], ['1', 'Motion[5]', [46]], ['1', 'Motion[19]', [2]], ['1', 'Motion[29]', [2]],
              ['1', 'Motion[32]', [2]], ['1', 'Motion[34]', [2]], ['1', 'Motion[62]', [4]], ['0', 'Motion[24]', [2]], ['0', 'Motion[27]', [2]], ['0', 'Motion[30]', [2]]];
for (const [l, c, frs] of rows){
  const got = stepsOf(l, c, 120);
  // the crossing test on the action code's pair (F[k-2], F[k-1]]: frame F's shell comes on step F + 1
  ok(got.join() === frs.map(F => F + 1).join(), 'L' + l + ' ' + c + ': one shell, frame ' + frs.join(', '), 'steps ' + got.join(', '));
}
for (const c of ['Motion[1]', 'Motion[2]', 'Motion[12]', 'Motion[13]']){
  const got = stepsOf('1', c, 350);
  ok(got.join() === '0,100,200,300', 'L1 ' + c + ': the pulse stand-in -- the clip\'s first step, then every 100.0', 'steps ' + got.join(', '));
}
{
  // across the clip's own loops (a 60-frame loop: the frame wraps, the clock does not)
  const got = stepsOf('1', 'Motion[1]', 250, { frameOf: fr => fr % 60, loopStart: 0 });
  ok(got.join() === '0,100,200', 'the stand-in clock runs across the clip\'s loops', 'steps ' + got.join(', '));
  const none = ['Motion[3]', 'Motion[6]', 'Motion[18]'].map(c => stepsOf('1', c, 120).length).join();
  ok(none === '0,0,0', 'L1 M3 / M6 / M18: no site, no shell', none);
  const st = S.createShellState('em077_00'), b = inputOf(cases[0]); let why = [];
  for (let fr = 0; fr < 10; fr++) why.push(...S.stepShells(st, Object.assign({}, b, { ground: undefined, rock: { variant: null }, list: '1', clip: 'Motion[4]', frame: fr })).refused.map(r => r.why));
  ok(why.length === 1 && /no ground/.test(why[0]), 'no ground: refused by name', why.join(' | '));
  const life = runJS(cases[0], { hitLife: true, steps: 60 }), sh = life.made[0].sh, L = life.snaps.get(sh.id);
  const end = L.find(s => s.state === 0xfe);
  ok(end && end.moves === 26, 'with input.hitLife: hit slot 0 (14, 10) keeps it to move 14 + 10 + 2', end ? 'ended at move ' + end.moves : 'never ended');
}
{
  const d = JSON.parse(readFileSync('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/effects/em077_00.json', 'utf8'));
  const sh = d.effects.filter(e => e.when === 'shell' && e.record.pel === 'em077_00c').map(e => e.record.key + '@' + e.record.index + ':' + e.efl).sort().join(' ');
  ok(sh === '30@0:files/cm200_040.efl 32@2:files/cm200_040.efl', 'c 30 and c 32 (UNIQUE 0 / 2, cm200_040) exported `when: shell`', sh);
  const D = S.SHELL_DATA.em077_00;
  ok(D.actions.length === 0 && S.pickVariantsFor('em077_00', '1', 'Motion[4]').length === 0 && D.shells.shell01.id === 0x13c,
     'no picks: every spawn is the frame handler\'s (the clip and its frame)');
}

// 3. CONTROLS
const ctl = [['L1M4_mode0', { ground: 10.5 }, 'the ground 0.5 off'], ['L1M20_mode0_yaw', { owner: [0, 0xc124, 0] }, 'the facing one unit off'],
             ['L1M5_mode1', { size: [1.3, 0.96] }, 'the size 0.01 off (mode 1: vec 0 is zero -- only the ground and the words can move it)'],
             ['L1M4_mode0', { size: [1.21, 1.1] }, 'the size 0.01 off']];
for (const [n, over, what] of ctl){
  const r = compare(cases.find(c => c.name === n), over);
  const moved = typeof r !== 'object';
  ok(n === 'L1M5_mode1' ? !moved : moved, (n === 'L1M5_mode1' ? 'CONTROL (null) ' : 'CONTROL ') + n + ' with ' + what + (n === 'L1M5_mode1' ? ' still PASSES' : ' FAILS the comparison'),
     typeof r === 'object' ? 'it passed' : r);
}
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

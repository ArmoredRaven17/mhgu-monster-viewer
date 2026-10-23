// replay.mjs -- the gapA rows on a PATCHED COPY of docs/render/shells.js (gapA/shells.js, built by patch_copy.py; the repo file is not
// touched). 1. pitch013_49 against the ROM's own instructions (emu49.json: 0xd8716c phase 1 under unicorn, sin / cos / atan2 / sqrt in
// float32, joint 3 answered); 2. (7, 0x49) end to end: L2 M25 makes sp_00 0x8a mode 1 at f146 with X + the pitch; 3. strike013 on the
// ROM's draws against emu50.json (0xd87a18 phase 4: the RNG and the ray answered); 4. (7, 0x50) L4 M4 end to end: the storm's sp_01 9
// strikes and their records; controls: no floor -> no strike, another clip -> no storm, a wrong pitch input -> a mismatch.
//   python patch_copy.py && node replay.mjs
import { readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = 'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/gapA';   // the ROM runs (emu49 / emu50 json)
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const G = S.SHELLS_TEST_013, f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, d = '') => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + msg + (d ? '  -- ' + d : '')); };
const mat = (t, R = [1, 0, 0, 0, 1, 0, 0, 0, 1]) => [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
const ownOf = (words, target, extra = {}) => Object.assign({ facing: true, ownerX: words[0] >>> 0, ownerY: words[1] >>> 0, ownerZ: words[2] >>> 0,
  ownerPos: [f(0), f(0), f(0)], target: target.map(f), floorY: f(0), ground: f(0), ownerMatrix: null, size: [f(1), f(1)], base: f(1), y5c: f(0),
  rank: 5, hitLife: false, questLevel: null, breakLevel7: 0, tailSevered: false, trunkSnow083: null }, extra);

// ---- 1. the pitch against the ROM -------------------------------------------------------------------------------------------------
const E49 = JSON.parse(readFileSync(join(HERE, 'emu49.json'), 'utf8')).filter(c => c.words);
for (const c of E49){
  const J = gid => gid === 3 ? mat(c.joint) : null;
  const u = G.pitch013_49(J, ownOf(c.words, c.target));
  const romW = c.creates[0][3];
  ok(u === c.cac0 && c.joints[0] === 3 && c.creates[0][0] === '0x8a' && c.creates[0][1] === 1 && ((c.words[0] + u) >>> 0) === romW[0] && romW[1] === c.words[1],
     'pitch words ' + JSON.stringify(c.words) + ' joint ' + JSON.stringify(c.joint) + ' target ' + JSON.stringify(c.target),
     'module 0x' + u.toString(16) + ', ROM [e+0xcac0] 0x' + c.cac0.toString(16) + ', ROM setup +0x20 ' + JSON.stringify(romW));
}
{ // control: the joint moved 200 down must change the pitch (case 0)
  const c = E49[0], J = gid => gid === 3 ? mat([c.joint[0], c.joint[1] - 200, c.joint[2]]) : null;
  ok(G.pitch013_49(J, ownOf(c.words, c.target)) !== c.cac0, 'control: joint 3 moved 200 down -> another pitch');
  ok(typeof G.pitch013_49(J, ownOf(c.words, c.target, { target: null })) === 'string', 'control: no target -> a named refusal');
}

// ---- driving stepShells -----------------------------------------------------------------------------------------------------------
function play(list, clip, variant, frames, { joints = { 0: mat([0, 300, 0]), 3: mat([0.0, 600.0, 400.0]) }, owner = [0, 0, 0],
                                              target = [0, 0, 3000], floorY = 0.0, state = null } = {}){
  const st = state || S.createShellState('em013_02'), J = gid => joints[gid] || joints[0];
  const spawned = [], started = [], refused = [];
  for (let fr = 0; fr <= frames; fr++){
    const out = S.stepShells(st, { monId: 'em013_02', list, clip, frame: fr, joints: J,
      rock: { variant, target: { x: target[0], y: target[1], z: target[2] }, floorY },
      owner: { x: owner[0], y: owner[1], z: owner[2] }, ownerPos: { x: 0, y: 0, z: 0 }, ground: floorY, size: [1, 1], baseScale: 1,
      hitLife: false, rank: 5, questLevel: 10 });
    for (const sh of out.spawned) spawned.push({ fr, sh, id: sh.globalId, shell: sh.shell, mode: sh.modeIndex, pos: sh.position && sh.position.slice(),
                                                 ang: sh.angles && sh.angles.map(w => w >>> 0) });
    for (const x of out.started) started.push({ fr, id: x.shell.id, key: x.start.key, list: x.start.list, kind: x.start.kind });
    for (const r of out.refused) refused.push({ fr, r });
  }
  return { st, spawned, started, refused };
}

// ---- 2. (7, 0x49) end to end ------------------------------------------------------------------------------------------------------
{
  const c = E49[1];
  const R = play('2', 'Motion[25]', '7:0x49', 150, { joints: { 0: mat([0, 300, 0]), 3: mat(c.joint) }, owner: c.words, target: c.target });
  const sp = R.spawned.filter(x => x.shell === 'shell00');
  // the action code reads the PREVIOUS pose's joints: joints fixed here, so the pitch is the emu's
  // the file's convention (pass001: the test on the pair (F[k-2], F[k-1]]): a frame-F row is made at the step with input frame F + 1 --
  // the control is an existing row, (7, 0x02) f102, made at 103
  const C02 = play('2', 'Motion[7]', '7:0x02', 110).spawned.filter(x => x.shell === 'shell00').map(x => x.fr);
  ok(sp.length === 1 && sp[0].fr === 147 && sp[0].id === 0x8a && sp[0].mode === 1 && C02[0] === 103,
     '(7, 0x49) L2 M25: one sp_00 0x8a mode 1 at f146 (step 147; control (7, 0x02) f102 at step ' + C02[0] + ')', JSON.stringify(sp.map(x => [x.fr, x.id, x.mode])));
  ok(sp.length === 1 && sp[0].ang[0] === ((c.words[0] + c.cac0) >>> 0) && sp[0].ang[1] === c.words[1],
     '(7, 0x49) the fireball\'s words = (X + the ROM pitch, Y, Z)', JSON.stringify(sp[0] && sp[0].ang) + ' vs X + 0x' + c.cac0.toString(16));
  ok(R.refused.length === 0, '(7, 0x49) no refusals', JSON.stringify(R.refused.slice(0, 3)));
  ok(sp.length === 1 && sp[0].sh.start && sp[0].sh.start.list === 'u' && sp[0].sh.start.key === 13, '(7, 0x49) the fireball starts em013_02u u13 (sp_00 mode 1 ef 0)',
     JSON.stringify(sp[0] && sp[0].sh.start && [sp[0].sh.start.list, sp[0].sh.start.key, sp[0].sh.start.kind]));
}

// ---- 3. strike013 on the ROM's draws ----------------------------------------------------------------------------------------------
{
  const E50 = JSON.parse(readFileSync(join(HERE, 'emu50.json'), 'utf8'));
  for (const [name, floor] of [['a_hit', 0.0], ['e_box', 900.0], ['c_box', 900.0], ['b_nohit', 5000.0]]){
    const c = E50[name], draws = c.log.filter(e => e[0] === 'rng').map(e => e[1]);
    const st = S.createShellState('em013_02'), D = S.SHELL_DATA.em013_02;
    const out = { spawned: [], refused: [], started: [], alive: [], ended: [], removed: [] };
    const ctx = { out, dt: f(1), speed: f(1), own001: ownOf([0, 0xd556, 0], [0, 0, 0]), stage: { floorY: f(floor), wall: null }, J: () => null,
                  motion: 'test', ownerMotion: 0 };
    st.shells = st.shells || [];
    const it = draws[Symbol.iterator](), draw = () => it.next().value;
    const got = [G.strike013(st, D, { action: [7, 0x50] }, ctx, out, draw), G.strike013(st, D, { action: [7, 0x50] }, ctx, out, draw)].filter(Boolean);
    const mod = got.map(x => [x.globalId, x.modeIndex, x.position.map(v => +v.toFixed(3))]);
    const rom = c.creates.map(x => [parseInt(x.id, 16), x.mode, x.p10]);
    ok(JSON.stringify(mod) === JSON.stringify(rom), 'strike013 ' + name + ' (floor ' + floor + ') = the ROM\'s creates', JSON.stringify(mod) + ' vs ROM ' + JSON.stringify(rom));
  }
}

// ---- 4. (7, 0x50) L4 M4 end to end ------------------------------------------------------------------------------------------------
{
  const R = play('4', 'Motion[4]', '7:0x50', 200);
  const st9 = R.spawned.filter(x => x.shell === 'shell01' && x.mode === 9);
  console.log('     storm strikes (frame, position):', JSON.stringify(st9.map(x => [x.fr, x.pos.map(v => +v.toFixed(1))])));
  ok(st9.length > 0 && st9.every(x => x.id === 0x8b), '(7, 0x50) L4 M4: sp_01 0x8b mode 9 strikes', st9.length + ' strikes');
  ok(!st9.some(x => x.fr === 0) && st9.filter(x => x.fr === 1).length === 2, 'the first update after the setMotion: two strikes (P+0x1bc and ctl+0x3c both at 0)');
  const fr = st9.map(x => x.fr), exp = [];
  { let a = 0, b = 0; for (let k = 1; k <= 200; k++){ if (!(a > 0) || f(a - 1) <= 0){ exp.push(k); a = 90; } else a = f(a - 1);
                                                       if (!(b > 0) || f(b - 1) <= 0){ exp.push(k); b = f(27.46666717529297); } else b = f(b - 1); } }
  // (a strike whose point has no floor is not made: the floor is 0 here, every point hits)
  ok(JSON.stringify(fr) === JSON.stringify(exp), 'the strike frames follow the two timers (90.0 / 27.466667, dt 1)', JSON.stringify(fr));
  ok(st9.every(x => x.pos[1] === 0 && x.pos[0] >= -2500 && x.pos[0] < 6000 && x.pos[2] >= -700 && x.pos[2] < 6500 && x.ang.every(w => w === 0)),
     'every strike on the floor inside 0xd87630\'s boxes, words 0');
  const keys = [...new Set(R.started.map(x => x.list + ' ' + x.key + ' ' + x.kind))];
  console.log('     records reported through out.started by the strikes (the switch\'s; none without hit slots):', JSON.stringify(keys));
  // the records: ef 0 at the init (S.start, as the meteors' mode 5 starts u103 -- the control); ef 1 (u110) is base01's 0x20 switch, as
  // mode 5's u100: neither reaches out.started in this harness (no hit slots, input.hitLife) -- parity with the existing mode 5
  ok(st9.every(x => x.sh.start && x.sh.start.list === 'u' && x.sh.start.key === 111 && x.sh.start.kind === 'init'), 'every strike starts em013_02u u111 at its init (mode 9 ef 0)');
  const M5 = play('2', 'Motion[2]', '7:0x0e', 100).spawned.filter(x => x.shell === 'shell01' && x.mode === 5);
  ok(M5.length > 0 && M5[0].sh.start && M5[0].sh.start.key === 103, 'control: the meteors\' lightning (mode 5) starts u103 the same way', M5.length + ' made');
  ok(R.refused.length === 0, '(7, 0x50) L4 M4: no refusals', JSON.stringify(R.refused.slice(0, 3)));
  // controls
  const N = play('4', 'Motion[4]', '7:0x50', 60, { floorY: 5000.0 });
  ok(N.spawned.filter(x => x.mode === 9 && x.shell === 'shell01').length === 0, 'control: the floor above the ray\'s start (no hit byte) -> no strike');
  const M1 = play('4', 'Motion[1]', '7:0x50', 60);
  ok(M1.spawned.filter(x => x.mode === 9 && x.shell === 'shell01').length === 0, 'control: L4 M1 of the same action -> no storm');
  // a second play keeps ctl+0x3c's remainder (the ROM keeps the control block): the second play's first ctl strike is not at its first update
  const st = R.st, left = st.ctl3c013;
  const R2 = play('4', 'Motion[4]', '7:0x50', 40, { state: st });
  const first2 = R2.spawned.filter(x => x.mode === 9).map(x => x.fr);
  ok(left > 0 && first2.filter(x => x === 1).length === 1, 'a replay: P+0x1bc reset (a strike at once), ctl+0x3c carried (' + left.toFixed(3) + ' left)', JSON.stringify(first2));
}
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);

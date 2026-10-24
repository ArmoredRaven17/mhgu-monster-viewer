// replay.mjs (gapJ, 2026-10-21): Ahtal-Neset's requests of Ahtal-Ka's shell57 in a PATCHED COPY of render/shells.js
// (gapJ/shells.patched.js, made by patch_shells.py; the repo file is untouched). Three plays of em087_00:
//   (1, 0x15) L0 M9 -> the lifts k 0 / 1 (modes 24 / 25, behaviour 6): u 320 (the trail, ef 2) and u 70 (ef 4) after the 60 delay
//   (1, 8)    L0 M9 -> the lift k 1 (mode 25)
//   (10, 0x8e) L3 M12, G+0x32 == 2 -> the drops k 0 / 1 (modes 20 / 21, behaviour 2): u 320 at once (ef 2), u 321 at the landing (ef 0)
// Controls: the unpatched shells.js makes nothing for the same plays (no such rows); the joint 131 missing refuses mode 21.
//   node <gapJ>/replay.mjs
import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const P = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const O = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const f = Math.fround;
let pass = 0, fail = 0;
const ok = (c, msg, d = '') => { (c ? pass++ : fail++); console.log((c ? 'PASS ' : 'FAIL ') + msg + (d ? '  -- ' + d : '')); };
const T = (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1].map(f);
const JOINTS = { 0: T(0, 0, 0), 130: T(-300.0, 2400.0, 150.0), 131: T(320.0, 2350.0, 140.0), 132: T(0.0, 2500.0, -200.0) };
function play(S, variant, list, clip, frames, joints = JOINTS){
  const st = S.createShellState('em087_00');
  const log = { spawned: [], started: [], refused: [], ended: [] };
  for (let i = 0; i <= frames; i++){
    const out = S.stepShells(st, { monId: 'em087_00', list, clip, frame: i, joints: g => joints[g] || null,
      rock: { variant, target: { x: 0, y: 0, z: 2000 }, floorY: -90.0 }, owner: { x: 0, y: 0, z: 0 }, ownerPos: { x: 0, y: 0, z: 0 },
      ground: -90.0, size: [1, 1], baseScale: 1, rank: 5, questLevel: 10, effectAlive: () => true });
    for (const s of out.spawned){
      log.spawned.push({ frame: i, shell: s.shell, mode: s.modeIndex, b: s.behaviour, state: s.state, pos: s.position.slice(),
                         list: s.start ? s.start.pel + ':' + s.start.key : null, at: s.start ? s.start.requester.position.slice() : null, model: s.model && s.model.part });
      if (s.start) log.started.push({ frame: i, mode: s.modeIndex, rec: s.start.pel + ':' + s.start.key, kind: s.start.kind || 'trail@make' });
    }
    for (const e of out.started) log.started.push({ frame: i, mode: e.shell.modeIndex, rec: e.start.pel + ':' + e.start.key, kind: e.start.kind });
    for (const r of out.refused) log.refused.push({ frame: i, ...r });
    for (const s of out.ended) log.ended.push({ frame: i, mode: s.modeIndex, pos: s.position.slice() });
  }
  return log;
}
const show = (name, L) => { console.log('--- ' + name); for (const k of ['spawned', 'started', 'ended', 'refused']) for (const x of L[k]) console.log('  ' + k + ' ' + JSON.stringify(x)); };

// 1. (1, 0x15)
const A = play(P, '1:0x15', '0', 'Motion[9]', 240);
show('(1, 0x15) L0 M9', A);
ok(A.spawned.length === 2 && A.spawned[0].mode === 24 && A.spawned[0].frame === 2 && A.spawned[1].mode === 25 && A.spawned[1].frame === 42,
   '(1, 0x15): shell57 modes 24 / 25 made by the rows at action frames 1 / 41 (viewer steps 2 / 42: line 4 tests the previous advance)');
ok(A.spawned.every(s => s.b === 6 && s.state === 1 && s.model), 'behaviour 6, state 1 (the 60.0 delay), the rubble model', A.spawned.map(s => s.model).join(' '));
ok(A.spawned[0].pos.join() === [1800, -90, 1600].join(), 'mode 24 starts at G spot 0 (0x21328b0)', JSON.stringify(A.spawned[0].pos));
const u320 = A.started.filter(s => s.rec === 'em088_00u:320'), u70 = A.started.filter(s => s.rec === 'em088_00u:70');
ok(u320.length === 2 && u320[0].frame === 62 && u320[1].frame === 102, 'em088_00u:320 starts on each lift\'s first move (frames 62 / 102: made + 60 delay + 1)', JSON.stringify(u320));
ok(u70.length === 2, 'em088_00u:70 (ef 4) with each', JSON.stringify(u70));
ok(A.ended.length === 2 && A.ended[0].pos.join() === JOINTS[130].slice(12, 15).join() && A.ended[1].pos.join() === JOINTS[131].slice(12, 15).join(),
   'each ends on Neset\'s joint 130 / 131 (t = 1 after 50 moves)', JSON.stringify(A.ended));
ok(A.ended[0].frame === 2 + 60 + 50, 'mode 24 ends 110 steps after it is made (the 60 delay, then 50 moves at 1 / float 0 = 0.02)', String(A.ended[0].frame));

// 2. (1, 8)
const B = play(P, '1:0x08', '0', 'Motion[9]', 200);
show('(1, 8) L0 M9', B);
ok(B.spawned.length === 1 && B.spawned[0].mode === 25 && B.spawned[0].frame === 2, '(1, 8): mode 25 by the row at action frame 1 (step 2)');

// 3. (10, 0x8e) G+0x32 == 2
const C = play(P, '10:0x8e/g2', '3', 'Motion[12]', 300);
show('(10, 0x8e) L3 M12, G+0x32 == 2', C);
ok(C.spawned.length === 2 && C.spawned.map(s => s.mode).join() === '20,21' && C.spawned.every(s => s.frame === 0 && s.b === 2),
   '(10, 0x8e): modes 20 / 21 at its start, behaviour 2');
ok(C.spawned[0].at.join() === JOINTS[130].slice(12, 15).join() && C.spawned[1].at.join() === JOINTS[131].slice(12, 15).join(),
   'placement 3: made at joints 130 / 131 (the trail point at the make)');
const E = m => (C.ended.find(e => e.mode === m) || { pos: [] }).pos.join();
ok(E(20) === [1500, -90, -1000].join() && E(21) === [-1500, -90, -1000].join(), 'each rests at his position + vec 3 (mode 20 (1500, 0, -1000), 21 (-1500, 0, -1000)), y -90');
const c320 = C.started.filter(s => s.rec === 'em088_00u:320'), c321 = C.started.filter(s => s.rec === 'em088_00u:321');
ok(c320.length === 2 && c320.every(s => s.frame === 0), 'em088_00u:320 (the trail) at the drop', JSON.stringify(c320));
ok(c321.length === 2 && c321.every(s => s.kind === 'landing' && s.frame > 0), 'em088_00u:321 (ef 0) at each landing', JSON.stringify(c321));

// CONTROLS
const A0 = play(O, '1:0x15', '0', 'Motion[9]', 120), C0 = play(O, '10:0x8e/g2', '3', 'Motion[12]', 120);
ok(A0.spawned.length === 0 && C0.spawned.length === 0, 'control: the unpatched shells.js makes no shell57 for these plays');
const C1 = play(P, '10:0x8e/g2', '3', 'Motion[12]', 10, { 0: JOINTS[0], 130: JOINTS[130] });
ok(C1.spawned.length === 1 && C1.refused.some(r => r.mode === 21), 'control: joint 131 missing refuses mode 21', JSON.stringify(C1.refused));
console.log(pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);

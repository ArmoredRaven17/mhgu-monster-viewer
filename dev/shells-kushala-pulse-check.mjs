// replay024.mjs -- Kushala's frame-handler sp_01 creates (gapF) replayed through a PATCHED COPY of render/shells.js
// (gapF/shells.patched.mjs, built by mkpatched.py; the repo file is not touched). Each case plays clips frame by frame (60/s) and lists
// the sp_01 shells made, their modes and the records their inits start (list + key). Expected values are the ROM's (emu208.py); the
// controls must make nothing (or the named refusal). Exit 1 on any mismatch. The number after the clip is the STEP (= input.frame):
// line 4 tests the previous advance (F[k-2], F[k-1]] (pass001), so a crossing of F makes its shell on step F + 1; the pulse clock
// counts the steps whose frame pair moved (state.hist), i.e. from a play's step 2 -- 80 counted steps per pulse, across plays.
//   node replay024.mjs
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const f = Math.fround;
const jointOf = (t) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t[0], t[1], t[2], 1].map(f);
const JOINTS = { 0: jointOf([118.0, 210.5, -60.25]), 3: jointOf([30.0, 610.0, 420.0]) };
const LEN = { '0|Motion[8]': 61, '0|Motion[1]': 165, '0|Motion[5]': 257, '1|Motion[16]': 103, '1|Motion[2]': 67, '2|Motion[18]': 259,
              '2|Motion[2]': 111, '2|Motion[9]': 72, '0|Motion[22]': 0, '2|Motion[20]': 0 };
function play(seq, opt){
  const st = S.createShellState('em024_00');
  const made = [], refused = [];
  for (const q of seq){
    const len = q.len || LEN[q.list + '|' + q.clip];
    for (let i = 0; i <= len; i++){
      const out = S.stepShells(st, { monId: 'em024_00', list: q.list, clip: q.clip, frame: i, joints: g => JOINTS[g] || JOINTS[0],
        rock: { variant: q.variant || null, target: { x: 900, y: 40, z: 2400 }, floorY: 0.0 },
        owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: opt.y == null ? 15.25 : opt.y, z: -80.75 }, ground: 0.0,
        size: [1, 1], baseScale: 1, rank: 5, windAura024: opt.aura, poisoned024: !!opt.poisoned, loopStart: q.loopStart });
      for (const sh of out.spawned) if (sh.shell === 'shell01')
        made.push({ clip: q.list + '|' + q.clip, frame: i, mode: sh.modeIndex, perFrame: sh.perFrame,
                    records: (sh.starts || []).map(r => r.list + ' ' + r.key) });
      for (const r of out.refused) if (r.perFrame != null) refused.push(r.why);
    }
  }
  return { made, refused };
}
let pass = 0, fail = 0;
function check(name, seq, opt, want, wantRefused = null){
  const r = play(seq, opt);
  const got = r.made.filter(m => m.perFrame != null).map(m => m.mode + '@' + m.clip + ':' + m.frame + ' [' + m.records.join(', ') + ']');
  const ok = JSON.stringify(got) === JSON.stringify(want) && (wantRefused == null || (r.refused.length > 0) === wantRefused);
  ok ? pass++ : fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name + '\n     got  ' + JSON.stringify(got) + (r.refused.length ? '\n     refused ' + JSON.stringify([...new Set(r.refused)]) : '') +
              (ok ? '' : '\n     want ' + JSON.stringify(want)));
}
// THE PULSE: every 80 frames of a pulse play (the clock runs across plays; a step on which the frame did not move is not counted)
// L0 M8 is 61 frames: 60 steps counted in play 1, so the first pulse falls on play 2's step 21, the next 80 later on play 3's step 41
const walk = n => Array.from({ length: n }, () => ({ list: '0', clip: 'Motion[8]' }));          // (2, 8..0xd): posture 0, a clean clip
const fly = n => Array.from({ length: n }, () => ({ list: '1', clip: 'Motion[16]' }));         // (4, 0xd) phase 0: posture 3
check('pulse L0 M8 level 1 (posture 0) -> mode 9 (c 30)', walk(3), { aura: 1 }, ['9@0|Motion[8]:21 [c 30]', '9@0|Motion[8]:41 [c 30]']);
check('pulse L0 M8 level 2 -> mode 12 (c 30)', walk(2), { aura: 2 }, ['12@0|Motion[8]:21 [c 30]']);
check('pulse L0 M8 level 3 -> mode 2 (c 31 + c 34)', walk(2), { aura: 3 }, ['2@0|Motion[8]:21 [c 31, c 34]']);
check('pulse L1 M16 level 1 (posture 3) -> mode 10 (c 29)', fly(1), { aura: 1 }, ['10@1|Motion[16]:81 [c 29]']);
check('pulse L1 M16 level 2 -> mode 13 (c 29)', fly(1), { aura: 2 }, ['13@1|Motion[16]:81 [c 29]']);
check('pulse L1 M16 level 3 -> mode 1 (c 30 + c 33)', fly(1), { aura: 3 }, ['1@1|Motion[16]:81 [c 30, c 33]']);
check('pulse level 3 Poisoned (ctl+0x18: -> 2) -> mode 12', walk(2), { aura: 3, poisoned: true }, ['12@0|Motion[8]:21 [c 30]']);
check('pulse on (7, 0x0f)\'s L2 M9 row (posture 3), level 2 -> mode 13', [{ list: '2', clip: 'Motion[9]', variant: '7:0x0f', len: 200 }], { aura: 2 },
      ['13@2|Motion[9]:81 [c 29]', '13@2|Motion[9]:161 [c 29]']);
// THE MOTION SWITCH
check('L2 M18 f184 level 1 -> mode 4 (c 32)', [{ list: '2', clip: 'Motion[18]' }], { aura: 1 }, ['4@2|Motion[18]:185 [c 32]']);
check('L2 M18 f184 level 3 -> mode 3 (c 32 + c 35)', [{ list: '2', clip: 'Motion[18]' }], { aura: 3 }, ['3@2|Motion[18]:185 [c 32, c 35]']);
check('L0 M5 f184 level 2 -> mode 4 (c 32)', [{ list: '0', clip: 'Motion[5]' }], { aura: 2 }, ['4@0|Motion[5]:185 [c 32]']);
check('L0 M5 f184 level 3 Poisoned -> mode 4', [{ list: '0', clip: 'Motion[5]' }], { aura: 3, poisoned: true }, ['4@0|Motion[5]:185 [c 32]']);
check('L2 M2 f50 -> mode 0 (no record)', [{ list: '2', clip: 'Motion[2]' }], { aura: 0 }, ['0@2|Motion[2]:51 []']);
// CONTROLS (must make nothing)
check('control: level 0 -- no pulse, no L2 M18 shell', [...walk(3), { list: '2', clip: 'Motion[18]' }], { aura: 0 }, []);
check('control: pulse 1000 above the ground (y < ground + 1000 strictly)', walk(3), { aura: 2, y: 1000.0 }, []);
check('control: L2 M2 1000.5 above the ground', [{ list: '2', clip: 'Motion[2]' }], { aura: 0, y: 1000.5 }, []);
check('control: L2 M9 under (7, 0x2c) -- not a pulse action', [{ list: '2', clip: 'Motion[9]', variant: '7:0x2c', len: 200 }], { aura: 2 }, []);
check('control: L0 M1, played by (0, 0) and (1, 1), no action named -- refused by name', [{ list: '0', clip: 'Motion[1]' }], { aura: 2 }, [], true);
check('control: L3 M3 (no pulse action plays it)', [{ list: '3', clip: 'Motion[3]', len: 200 }], { aura: 3 }, []);
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);

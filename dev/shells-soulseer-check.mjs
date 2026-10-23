// Soulseer's (em082_04) bubbles in render/shells.js against the ROM -- uEm082_00's sp_12 (0x15c, NEW base12 through its reader 0x104f15c), made
// by the chooser 0x104b540 and the makers 0x104a298 / 0x104a840 (dev/leviathan-shells-spec.md 5).
//
//   1. THE ROM'S OWN RUNS: <scratchpad>/fb/emu_fb.py -- the whole executable on unicorn, the class's action main 0x1035b58 with the
//      action at e+0x73e0, the shell-id fields e+0xcac0.. and the .dtp array filled, the phase and the frame tests answered one at a time.
//   2. The contract: the pick lists.
//   3. CONTROLS: a wrong joint, a wrong facing, a moved target (the tilt), a dropped gate must FAIL the comparison.
//   4. IN THE VIEWER (pageCheck, through the scratchpad's run-check.mjs): the clips spawn their bubbles; the records run out.
//
//   node dev/shells-soulseer-check.mjs   /   node <scratchpad>/run-check.mjs dev/shells-soulseer-check.mjs
//
// Exit code 1 when anything fails.
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
const MAIN = !!process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
async function nodeMain(){
  const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
  const EMU = process.env.FB_EMU ||
    'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/fb/emu_fb.py';
  const f = Math.fround;
  let pass = 0, fail = 0;
  const ok = (c, msg, detail = '') => { if (c){ pass++; console.log('PASS ' + msg + (detail ? '  -- ' + detail : '')); } else { fail++; console.log('FAIL ' + msg + (detail ? '  -- ' + detail : '')); } };
  function jointOf(a, b, c, t){
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
    const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
    const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
    const R = mul(mul(Rz, Rx), Ry);
    return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
  }
  const JOINTS = { 0: jointOf(0.2, 0.0, 0.0, [118.0, 210.5, -60.25]), 1: jointOf(0.1, 0.3, 0.0, [120.0, 220.0, 60.0]), 2: jointOf(0.9, -0.45, 0.25, [160.25, 260.5, 140.75]),
                   7: jointOf(-0.3, 0.6, 0.1, [90.0, 150.0, 30.0]), 12: jointOf(0.4, 0.2, -0.2, [100.0, 140.0, -20.0]), 144: jointOf(0.0, -1.0, 0.3, [130.0, 300.0, 250.0]),
                   255: jointOf(0.5, 0.5, 0.5, [140.0, 320.0, 280.0]), 20: jointOf(0.3, -0.2, 0.6, [125.0, 330.0, 210.0]), 18: jointOf(-0.2, 0.1, 0.4, [110.0, 280.0, 200.0]) };
  const J2b = jointOf(-0.4, 0.3, 0.1, [150.0, 250.0, 130.0]);
  const OW = [0, 0x3000, 0], OP = [120.5, 15.25, -80.75], TG = [900.0, 40.0, 2400.0];
  const F083 = {"348": ["em082_04", "12"], "351": ["em082_04", "13"], "349": ["em082_04", "01"], "352": ["em082_04", "26"]};
  const v = n => '7:0x' + n.toString(16).padStart(2, '0');
  const C = (name, n, phase, frame, win, seq, x = {}) => Object.assign({ name, mon: 'em082_04', n,
    steps: [{ fn: '1035b58', phase, win, frame }], seq, owner: OW, ownerPos: OP, target: TG,
    floorY: 0.0, ground: 0.0, size: [1.0, 1.0], base: 1.0, rank: 5, quest: 10, emVariant: 4, hitLife: false,
    owner_bytes: Object.assign({ '0x73e0': [x.st == null ? 7 : x.st, n] }, {"0xcac0": [93, 1, 0, 0], "0xcac4": [94, 1, 0, 0], "0xcac8": [92, 1, 0, 0], "0xcacc": [95, 1, 0, 0], "0xcad0": [96, 1, 0, 0]}), joints: JOINTS }, x);
  const Q = (clip, n, len, list = '2', st = 7) => [{ list, clip, variant: st + ':0x' + n.toString(16).padStart(2, '0'), len }];
  const cases = [
    C('b00', 0x00, 1, 94.0, 0, Q('Motion[42]', 0x00, 130, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 94.0, winFrames: [94.0] }, { fn: '1035b58', phase: 1, frame: 100.0, winFrames: [100.0] }, { fn: '1035b58', phase: 1, frame: 104.0, winFrames: [104.0] }] }),
    C('b01', 0x01, 3, 46.0, 0, Q('Motion[37]', 0x01, 80, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 3, frame: 46.0, winFrames: [46.0] }] }),
    C('b09_tilt', 0x09, 1, 43.0, 0, Q('Motion[20]', 0x09, 90, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 0, frame: 0.0, winFrames: [] }, { fn: '1035b58', phase: 1, frame: 43.0, winFrames: [43.0] }, { fn: '1035b58', phase: 1, frame: 48.0, winFrames: [48.0] }, { fn: '1035b58', phase: 1, frame: 56.0, winFrames: [56.0] }], target: [900.0, 1400.0, 2400.0] }),
    C('b0a', 0x0a, 1, 42.0, 0, Q('Motion[64]', 0x0a, 80, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 42.0, winFrames: [42.0] }, { fn: '1035b58', phase: 1, frame: 44.0, winFrames: [44.0] }] }),
    C('b0c', 0x0c, 1, 43.0, 0, Q('Motion[20]', 0x0c, 90, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 43.0, winFrames: [43.0] }, { fn: '1035b58', phase: 1, frame: 48.0, winFrames: [48.0] }, { fn: '1035b58', phase: 1, frame: 56.0, winFrames: [56.0] }], owner: [0, 0x9123, 0] }),
    C('b0d', 0x0d, 1, 74.0, 0, Q('Motion[21]', 0x0d, 170, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 74.0, winFrames: [74.0] }, { fn: '1035b58', phase: 1, frame: 82.0, winFrames: [82.0] }, { fn: '1035b58', phase: 1, frame: 136.0, winFrames: [136.0] }, { fn: '1035b58', phase: 1, frame: 138.0, winFrames: [138.0] }, { fn: '1035b58', phase: 1, frame: 150.0, winFrames: [150.0] }] }),
    C('b0d_head', 0x0d, 1, 74.0, 0, Q('Motion[21]', 0x0d, 170, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 74.0, winFrames: [74.0] }, { fn: '1035b58', phase: 1, frame: 82.0, winFrames: [82.0] }, { fn: '1035b58', phase: 1, frame: 136.0, winFrames: [136.0] }, { fn: '1035b58', phase: 1, frame: 138.0, winFrames: [138.0] }, { fn: '1035b58', phase: 1, frame: 150.0, winFrames: [150.0] }], block_bytes: { '0x3bc': [2, 0] }, mizu082: { headBroken: true } }),
    C('b0d_tired', 0x0d, 1, 74.0, 0, Q('Motion[21]', 0x0d, 170, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 74.0, winFrames: [74.0] }, { fn: '1035b58', phase: 1, frame: 82.0, winFrames: [82.0] }, { fn: '1035b58', phase: 1, frame: 136.0, winFrames: [136.0] }, { fn: '1035b58', phase: 1, frame: 138.0, winFrames: [138.0] }, { fn: '1035b58', phase: 1, frame: 150.0, winFrames: [150.0] }], tired: true, block_bytes: { '0x505': [2] } }),
    C('b2a', 0x2a, 1, 114.0, 0, Q('Motion[89]', 0x2a, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 114.0, winFrames: [114.0] }, { fn: '1035b58', phase: 1, frame: 120.0, winFrames: [120.0] }, { fn: '1035b58', phase: 1, frame: 124.0, winFrames: [124.0] }] }),
    C('b2a_tail', 0x2a, 1, 114.0, 0, Q('Motion[89]', 0x2a, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 114.0, winFrames: [114.0] }, { fn: '1035b58', phase: 1, frame: 120.0, winFrames: [120.0] }, { fn: '1035b58', phase: 1, frame: 124.0, winFrames: [124.0] }], severed: true, tailSevered: true }),
    C('s06', 0x06, 2, 36.0, 0, Q('Motion[40]', 0x06, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 36.0, winFrames: [36.0] }] }),
    C('s34', 0x34, 2, 36.0, 0, Q('Motion[40]', 0x34, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 36.0, winFrames: [36.0] }] }),
    C('s07', 0x07, 2, 26.0, 0, Q('Motion[11]', 0x07, 50, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 26.0, winFrames: [26.0] }] }),
    C('t10', 0x10, 3, 1.0, 0, Q('Motion[24]', 0x10, 30, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 0.0, ended: 1, winFrames: [], blockPos: [120.5, 15.25, -80.75] }, { fn: '1035b58', phase: 3, frame: 1.0, winFrames: [], blockPos: [120.5, 15.25, -20.75] }, { fn: '1035b58', phase: 3, frame: 2.0, winFrames: [], blockPos: [120.5, 15.25, 39.25] }, { fn: '1035b58', phase: 3, frame: 3.0, winFrames: [], blockPos: [120.5, 15.25, 99.25] }, { fn: '1035b58', phase: 3, frame: 4.0, winFrames: [], blockPos: [120.5, 15.25, 159.25] }, { fn: '1035b58', phase: 3, frame: 5.0, winFrames: [], blockPos: [120.5, 15.25, 219.25] }, { fn: '1035b58', phase: 3, frame: 6.0, winFrames: [], blockPos: [120.5, 15.25, 279.25] }, { fn: '1035b58', phase: 3, frame: 7.0, winFrames: [], blockPos: [120.5, 15.25, 339.25] }, { fn: '1035b58', phase: 3, frame: 8.0, winFrames: [], blockPos: [120.5, 15.25, 399.25] }, { fn: '1035b58', phase: 3, frame: 9.0, winFrames: [], blockPos: [120.5, 15.25, 459.25] }, { fn: '1035b58', phase: 3, frame: 10.0, winFrames: [], blockPos: [120.5, 15.25, 519.25] }, { fn: '1035b58', phase: 3, frame: 11.0, winFrames: [], blockPos: [120.5, 15.25, 579.25] }, { fn: '1035b58', phase: 3, frame: 12.0, winFrames: [], blockPos: [120.5, 15.25, 639.25] }, { fn: '1035b58', phase: 3, frame: 13.0, winFrames: [], blockPos: [120.5, 15.25, 699.25] }, { fn: '1035b58', phase: 3, frame: 14.0, winFrames: [], blockPos: [120.5, 15.25, 759.25] }, { fn: '1035b58', phase: 3, frame: 15.0, winFrames: [], blockPos: [120.5, 15.25, 819.25] }, { fn: '1035b58', phase: 3, frame: 16.0, winFrames: [], blockPos: [120.5, 15.25, 879.25] }, { fn: '1035b58', phase: 3, frame: 17.0, winFrames: [], blockPos: [120.5, 15.25, 939.25] }, { fn: '1035b58', phase: 3, frame: 18.0, winFrames: [], blockPos: [120.5, 15.25, 999.25] }, { fn: '1035b58', phase: 3, frame: 19.0, winFrames: [], blockPos: [120.5, 15.25, 1059.25] }, { fn: '1035b58', phase: 3, frame: 20.0, winFrames: [], blockPos: [120.5, 15.25, 1119.25] }, { fn: '1035b58', phase: 3, frame: 21.0, winFrames: [], blockPos: [120.5, 15.25, 1179.25] }, { fn: '1035b58', phase: 3, frame: 22.0, winFrames: [], blockPos: [120.5, 15.25, 1239.25] }], ownerPath: fr => [120.5, 15.25, -80.75 + 60.0 * Math.min(fr, 22)] }),
    C('b7d', 0x7d, 1, 44.0, 0, Q('Motion[64]', 0x7d, 70, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 44.0, winFrames: [44.0] }] }),
    C('s07_tired', 0x07, 2, 26.0, 0, Q('Motion[11]', 0x07, 50, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 26.0, winFrames: [26.0] }], tired: true, block_bytes: { '0x505': [2] } }),
    C('b64', 0x64, 1, 110.0, 0, Q('Motion[72]', 0x64, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 110.0, winFrames: [110.0] }] }),
    C('b65_tired', 0x65, 1, 110.0, 0, Q('Motion[71]', 0x65, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 110.0, winFrames: [110.0] }], tired: true, block_bytes: { '0x505': [2] } }),
    C('b69', 0x69, 2, 110.0, 0, Q('Motion[72]', 0x64, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 110.0, winFrames: [110.0] }] }),
    C('w04', 0x04, 2, 10.0, 0, Q('Motion[56]', 0x04, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w1e', 0x1e, 2, 10.0, 0, Q('Motion[56]', 0x1e, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w2a', 0x2a, 2, 10.0, 0, Q('Motion[56]', 0x2a, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w2c', 0x2c, 2, 10.0, 0, Q('Motion[56]', 0x2c, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w05', 0x05, 2, 10.0, 0, Q('Motion[59]', 0x05, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w08', 0x08, 2, 10.0, 0, Q('Motion[56]', 0x08, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w09', 0x09, 2, 10.0, 0, Q('Motion[59]', 0x09, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w22', 0x22, 2, 10.0, 0, Q('Motion[56]', 0x22, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w32', 0x32, 2, 10.0, 0, Q('Motion[56]', 0x32, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w33', 0x33, 2, 10.0, 0, Q('Motion[59]', 0x33, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }] }),
    C('w04_tail', 0x04, 2, 10.0, 0, Q('Motion[56]', 0x04, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }], severed: true, tailSevered: true }),
    C('w04_tired', 0x04, 2, 10.0, 0, Q('Motion[56]', 0x04, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }], tired: true, block_bytes: { '0x505': [2] } }),
    C('w1e_far', 0x1e, 2, 10.0, 0, Q('Motion[56]', 0x1e, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }], target: [-3000.0, 0.0, 2600.0] }),
    C('f26', 0x26, 1, 78.0, 0, Q('Motion[69]', 0x26, 130, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 78.0, winFrames: [78.0] }, { fn: '1035b58', phase: 1, frame: 98.0, winFrames: [98.0] }], slot0: [0], slot0Ids: [0x160], hitLife: true, slotsOnly: 'shell26', slotsHold: 'shell26', slot0Modes: [0, 1, 2, 3, 4, 5] }),
    C('f26_turn', 0x26, 1, 78.0, 0, Q('Motion[69]', 0x26, 130, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 78.0, winFrames: [78.0] }, { fn: '1035b58', phase: 1, frame: 98.0, winFrames: [98.0] }], slot0: [0], slot0Ids: [0x160], hitLife: true, slotsOnly: 'shell26', slotsHold: 'shell26', slot0Modes: [0, 1, 2, 3, 4, 5], owner: [0, 0x9123, 0] }),
    C('f13', 0x13, 1, 30.0, 0, Q('Motion[38]', 0x13, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 30.0, winFrames: [30.0] }, { fn: '1035b58', phase: 1, frame: 110.0, winFrames: [110.0] }], slot0: [0], slot0Ids: [0x160], hitLife: true, slotsOnly: 'shell26', slotsHold: 'shell26', slot0Modes: [10, 11, 12, 13] }),
    C('f13_tired', 0x13, 1, 30.0, 0, Q('Motion[38]', 0x13, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 30.0, winFrames: [30.0] }, { fn: '1035b58', phase: 1, frame: 110.0, winFrames: [110.0] }], slot0: [0], slot0Ids: [0x160], hitLife: true, slotsOnly: 'shell26', slotsHold: 'shell26', slot0Modes: [10, 11, 12, 13], tired: true, block_bytes: { '0x505': [2] } }),
    C('f36', 0x36, 1, 0.0, 0, Q('Motion[4]', 0x36, 30, '0', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 0.0, winFrames: [0.0] }], slot0: [0], slot0Ids: [0x160], hitLife: true, slotsOnly: 'shell26', slotsHold: 'shell26', slot0Modes: [14, 15] }),
    C('r16', 0x16, 2, 1.0, 0, Q('Motion[15]', 0x16, 620, '0', 1), { st: 1, noTurn: 1, steps: [{ fn: '1035b58', phase: 0, frame: 0.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 1.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 2.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 3.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 4.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 5.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 6.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 7.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 8.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 9.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 10.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 11.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 12.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 13.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 14.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 15.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 16.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 17.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 18.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 19.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 21.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 22.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 23.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 24.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 25.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 26.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 27.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 28.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 29.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 31.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 32.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 33.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 34.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 35.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 36.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 37.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 38.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 39.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 40.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 41.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 42.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 43.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 44.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 45.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 46.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 47.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 48.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 49.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 50.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 51.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 52.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 53.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 54.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 55.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 56.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 57.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 58.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 59.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 60.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 61.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 62.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 63.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 64.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 65.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 66.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 67.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 68.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 69.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 70.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 71.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 72.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 73.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 74.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 75.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 76.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 77.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 78.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 79.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 80.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 81.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 82.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 83.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 84.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 85.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 86.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 87.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 88.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 89.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 90.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 91.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 92.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 93.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 94.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 95.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 96.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 97.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 98.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 99.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 100.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 101.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 102.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 103.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 104.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 105.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 106.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 107.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 108.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 109.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 110.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 111.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 112.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 113.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 114.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 115.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 116.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 117.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 118.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 119.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 120.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 121.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 122.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 123.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 124.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 125.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 126.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 127.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 128.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 129.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 130.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 131.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 132.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 133.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 134.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 135.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 136.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 137.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 138.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 139.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 140.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 141.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 142.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 143.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 144.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 145.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 146.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 147.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 148.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 149.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 150.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 151.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 152.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 153.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 154.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 155.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 156.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 157.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 158.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 159.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 160.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 161.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 162.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 163.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 164.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 165.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 166.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 167.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 168.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 169.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 170.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 171.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 172.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 173.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 174.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 175.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 176.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 177.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 178.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 179.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 180.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 181.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 182.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 183.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 184.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 185.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 186.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 187.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 188.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 189.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 190.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 191.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 192.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 193.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 194.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 195.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 196.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 197.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 198.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 199.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 200.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 201.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 202.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 203.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 204.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 205.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 206.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 207.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 208.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 209.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 210.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 211.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 212.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 213.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 214.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 215.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 216.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 217.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 218.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 219.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 220.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 221.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 222.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 223.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 224.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 225.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 226.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 227.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 228.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 229.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 230.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 231.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 232.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 233.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 234.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 235.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 236.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 237.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 238.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 239.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 240.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 241.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 242.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 243.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 244.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 245.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 246.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 247.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 248.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 249.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 250.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 251.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 252.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 253.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 254.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 255.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 256.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 257.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 258.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 259.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 260.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 261.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 262.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 263.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 264.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 265.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 266.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 267.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 268.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 269.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 270.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 271.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 272.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 273.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 274.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 275.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 276.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 277.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 278.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 279.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 280.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 281.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 282.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 283.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 284.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 285.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 286.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 287.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 288.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 289.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 290.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 291.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 292.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 293.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 294.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 295.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 296.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 297.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 298.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 299.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 300.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 301.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 302.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 303.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 304.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 305.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 306.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 307.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 308.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 309.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 310.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 311.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 312.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 313.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 314.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 315.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 316.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 317.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 318.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 319.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 320.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 321.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 322.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 323.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 324.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 325.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 326.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 327.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 328.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 329.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 330.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 331.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 332.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 333.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 334.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 335.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 336.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 337.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 338.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 339.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 340.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 341.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 342.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 343.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 344.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 345.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 346.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 347.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 348.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 349.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 350.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 351.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 352.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 353.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 354.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 355.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 356.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 357.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 358.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 359.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 360.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 361.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 362.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 363.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 364.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 365.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 366.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 367.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 368.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 369.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 370.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 371.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 372.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 373.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 374.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 375.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 376.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 377.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 378.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 379.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 380.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 381.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 382.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 383.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 384.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 385.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 386.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 387.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 388.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 389.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 390.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 391.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 392.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 393.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 394.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 395.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 396.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 397.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 398.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 399.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 400.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 401.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 402.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 403.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 404.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 405.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 406.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 407.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 408.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 409.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 410.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 411.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 412.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 413.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 414.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 415.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 416.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 417.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 418.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 419.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 420.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 421.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 422.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 423.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 424.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 425.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 426.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 427.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 428.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 429.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 430.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 431.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 432.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 433.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 434.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 435.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 436.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 437.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 438.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 439.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 440.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 441.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 442.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 443.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 444.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 445.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 446.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 447.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 448.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 449.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 450.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 451.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 452.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 453.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 454.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 455.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 456.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 457.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 458.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 459.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 460.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 461.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 462.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 463.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 464.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 465.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 466.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 467.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 468.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 469.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 470.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 471.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 472.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 473.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 474.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 475.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 476.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 477.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 478.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 479.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 480.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 481.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 482.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 483.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 484.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 485.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 486.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 487.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 488.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 489.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 490.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 491.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 492.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 493.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 494.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 495.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 496.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 497.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 498.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 499.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 500.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 501.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 502.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 503.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 504.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 505.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 506.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 507.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 508.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 509.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 510.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 511.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 512.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 513.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 514.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 515.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 516.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 517.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 518.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 519.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 520.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 521.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 522.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 523.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 524.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 525.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 526.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 527.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 528.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 529.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 530.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 531.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 532.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 533.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 534.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 535.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 536.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 537.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 538.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 539.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 540.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 541.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 542.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 543.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 544.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 545.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 546.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 547.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 548.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 549.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 550.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 551.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 552.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 553.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 554.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 555.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 556.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 557.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 558.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 559.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 560.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 561.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 562.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 563.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 564.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 565.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 566.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 567.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 568.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 569.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 570.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 571.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 572.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 573.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 574.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 575.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 576.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 577.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 578.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 579.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 580.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 581.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 582.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 583.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 584.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 585.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 586.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 587.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 588.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 589.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 590.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 591.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 592.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 593.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 594.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 595.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 596.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 597.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 598.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 599.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 600.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 601.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 602.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 603.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 604.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 605.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 606.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 607.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 608.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 609.0, winFrames: [] }, { fn: '1035b58', phase: 2, frame: 610.0, winFrames: [] }], slot0: [0], slot0Ids: [0x160], hitLife: true, slotsOnly: 'shell26', slotsHold: 'shell26', slot0Modes: [6, 7, 8, 9], frames: 300, unstub: ['0x7206c'], tailQ: { list: '0', clip: 'Motion[1]', variant: null, len: 0 } }),
    C('f26_end', 0x26, 1, 78.0, 0, Q('Motion[69]', 0x26, 130, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 78.0, winFrames: [78.0] }, { fn: '1035b58', phase: 1, frame: 98.0, winFrames: [98.0] }] }),
    C('L09', 0x09, 1, 43.0, 0, Q('Motion[20]', 0x09, 90, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 0, frame: 0.0, winFrames: [] }, { fn: '1035b58', phase: 1, frame: 43.0, winFrames: [43.0] }, { fn: '1035b58', phase: 1, frame: 48.0, winFrames: [48.0] }, { fn: '1035b58', phase: 1, frame: 56.0, winFrames: [56.0] }], target: [900.0, 1400.0, 2400.0], soulFlame082: true, block_bytes: { '0x1bb': [2] } }),
    C('L0c', 0x0c, 1, 43.0, 0, Q('Motion[20]', 0x0c, 90, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 43.0, winFrames: [43.0] }, { fn: '1035b58', phase: 1, frame: 48.0, winFrames: [48.0] }, { fn: '1035b58', phase: 1, frame: 56.0, winFrames: [56.0] }], owner: [0, 0x9123, 0], soulFlame082: true, block_bytes: { '0x1bb': [2] } }),
    C('L0d', 0x0d, 1, 74.0, 0, Q('Motion[21]', 0x0d, 170, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 74.0, winFrames: [74.0] }, { fn: '1035b58', phase: 1, frame: 136.0, winFrames: [136.0] }, { fn: '1035b58', phase: 1, frame: 142.0, winFrames: [142.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] } }),
    C('L06', 0x06, 2, 36.0, 0, Q('Motion[40]', 0x06, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 36.0, winFrames: [36.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] } }),
    C('L07', 0x07, 2, 26.0, 0, Q('Motion[11]', 0x07, 50, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 26.0, winFrames: [26.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] } }),
    C('L04', 0x04, 2, 0.0, 0, Q('Motion[56]', 0x04, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 0.0, winFrames: [0.0] }, { fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] } }),
    C('L05', 0x05, 2, 0.0, 0, Q('Motion[59]', 0x05, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 0.0, winFrames: [0.0] }, { fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] } }),
    C('L08', 0x08, 2, 10.0, 0, Q('Motion[56]', 0x08, 60, '2', 2), { st: 2, noTurn: 1, steps: [{ fn: '1035b58', phase: 2, frame: 10.0, winFrames: [10.0] }, { fn: '1035b58', phase: 2, frame: 20.0, winFrames: [20.0] }, { fn: '1035b58', phase: 2, frame: 30.0, winFrames: [30.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] }, none: 1 }),
    C('L00', 0x00, 1, 94.0, 0, Q('Motion[42]', 0x00, 130, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 94.0, winFrames: [94.0] }, { fn: '1035b58', phase: 1, frame: 100.0, winFrames: [100.0] }, { fn: '1035b58', phase: 1, frame: 104.0, winFrames: [104.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] }, none: 1 }),
    C('L2a', 0x2a, 1, 114.0, 0, Q('Motion[89]', 0x2a, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 114.0, winFrames: [114.0] }, { fn: '1035b58', phase: 1, frame: 120.0, winFrames: [120.0] }, { fn: '1035b58', phase: 1, frame: 124.0, winFrames: [124.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] }, none: 1 }),
    C('L64', 0x64, 1, 110.0, 0, Q('Motion[72]', 0x64, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 110.0, winFrames: [110.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] }, none: 1 }),
    C('L26', 0x26, 1, 78.0, 0, Q('Motion[69]', 0x26, 130, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 78.0, winFrames: [78.0] }, { fn: '1035b58', phase: 1, frame: 98.0, winFrames: [98.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] }, none: 1 }),
    C('L13', 0x13, 1, 30.0, 0, Q('Motion[38]', 0x13, 140, '2', 7), { st: 7, noTurn: 1, steps: [{ fn: '1035b58', phase: 1, frame: 30.0, winFrames: [30.0] }, { fn: '1035b58', phase: 1, frame: 110.0, winFrames: [110.0] }], soulFlame082: true, block_bytes: { '0x1bb': [2] }, none: 1 }),
  ];
  for (const c of cases) c.folders = F083;

  // ---- the module ---------------------------------------------------------------------------------------------------------------
  function runJS(c, over = {}){
    const x = Object.assign({}, c, over);
    const st = S.createShellState(x.mon);
    const J = gid => x.joints[gid] || x.joints[0];
    const snaps = new Map(), info = new Map(), refused = [];
    const marks = { thrown: new Map() };
    let k = 0;
    const steps = [];
    for (const q of x.seq) for (let i = 0; i <= q.len; i++) steps.push({ q, frame: i });
    const last = steps[steps.length - 1];
    for (let i = 0; i < (x.frames || 460) + 500; i++) steps.push(x.tailQ ? { q: x.tailQ, frame: 0 } : { q: last.q, frame: last.q.len });   // (tailQ: another clip, the action over)   // (a child made late still gets its 460 moves)
    for (const { q, frame } of steps){
      const out = S.stepShells(st, { monId: x.mon, list: q.list, clip: q.clip, frame, joints: J,
        rock: { variant: q.variant, target: { x: x.target[0], y: x.target[1], z: x.target[2] }, floorY: x.floorY },
        owner: { x: x.owner[0], y: x.owner[1], z: x.owner[2] }, ownerPos: (P => ({ x: P[0], y: P[1], z: P[2] }))(x.ownerPath ? x.ownerPath(frame) : x.ownerPos),
        ground: x.ground, size: x.size, baseScale: x.base, hitLife: !!x.hitLife, rank: x.rank, questLevel: x.quest, trunkSnow083: x.trunk, tired: !!x.tired, tailSevered: !!x.tailSevered, mizu082: x.mizu082, soulFlame082: !!x.soulFlame082 });
      for (const r of out.refused) refused.push(r);
      if (x.slotsOnly) for (const sh of out.spawned) if (sh.shell !== x.slotsOnly) sh.slots = null;
      // (slotsHold: the ROM run holds that shell's slot-0 byte on: its slot here never runs out either)
      if (x.slotsHold) for (const sh of out.spawned) if (sh.shell === x.slotsHold && sh.slots) for (const sl of sh.slots) sl.duration = Infinity;
      for (const sh of out.spawned) info.set(sh.id, { S: sh, step: k, starts: [], children: [] });
      for (const sh of out.spawned) if (sh.creator != null && info.has(sh.creator)) info.get(sh.creator).children.push(sh.id);
      for (const sh of out.alive.concat(out.ended, out.removed)){
        const I = info.get(sh.id); if (!I) continue;
        if (sh.throw && !marks.thrown.has(sh.id)) marks.thrown.set(sh.id, sh.moves);
        const L = snaps.get(sh.id) || []; snaps.set(sh.id, L);
        if (L.length && L[L.length - 1].moves === sh.moves) continue;
        L.push({ moves: sh.moves, state: sh.state, pos: sh.position && sh.position.slice(), vel: sh.velocity && sh.velocity.slice(),
                 anchor: sh.anchor && sh.anchor.slice(), ang: sh.angles && sh.angles.map(w => w >>> 0),
                 timer: sh.base === 'base13' ? sh.lifetime : sh.timer });
      }
      for (const { shell: sh, start } of out.started){ const I = info.get(sh.id); if (I) I.starts.push(start); }
      k++;
    }
    return { info, snaps, refused, state: st, marks };
  }
  // the ROM run's own inputs that follow the module: e+0xcb0c = 1 before the snowball's first update, 2 before its throw's
  function emuCase(c, J){
    const o = { name: c.name, mon: c.mon, folders: c.folders, variant: c.emVariant, owner: c.owner, ownerPos: c.ownerPos, target: c.target,
      floorY: c.floorY, ground: c.ground, size: c.size, base: c.base, rank: c.rank, quest: c.quest, owner_bytes: c.owner_bytes,
      joints: Object.fromEntries(Object.entries(c.joints).map(([g, m]) => [g, Array.from(m)])), steps: c.steps, frames: c.frames || 460 };
    if (c.snow){
      o.post28 = 1;
      const top = [...J.info.values()].find(I => I.S.base === 'base13' && I.S.creator == null);
      o.pokes = { 1: { '0xcb0c': [1, 0, 0, 0] } };
      if (top && J.marks.thrown.has(top.S.id)) o.pokes[J.marks.thrown.get(top.S.id)] = { '0xcb0c': [2, 0, 0, 0] };
    }
    // (the pieces' hit-side loop 0x10632bc runs on slot 0: no other em083 in the run -- 0x5cdf8 answers none)
    if (c.precall) o.precall = c.precall;
    if (c.block_bytes) o.block_bytes = c.block_bytes;
    if (c.severed) o.severed = 1;
    o.dtp = [0, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 3, 5, 1, 1, 4, 6, 1, 1, 5];
    if (c.slot0Ids) o.slot0Ids = c.slot0Ids;
    if (c.unstub) o.unstub = c.unstub;
    if (c.slot0Modes) o.slot0Modes = c.slot0Modes;
    if (c.trunk != null){ o.owner_bytes = Object.assign({}, c.owner_bytes, { '0xcb64': [c.trunk, 0, 0, 0] }); o.block_bytes = { '0x3cc': [50, 0] }; }
    if (c.noTurn) o.noTurn = 1;
    // (his pieces' init 0x106128c draws the RNG twice, each draw times a zero float of his files: the run answers the draws 0)
    if (c.snow) o.rng0 = 1;
    if (c.slot0){ o.slot0 = 1; o.slot0Depths = c.slot0; o.noEm = 1; }
    return o;
  }
  const JS = new Map(cases.map(c => [c.name, runJS(c)]));

  // ---- the ROM ------------------------------------------------------------------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'gmshells-'));
  const runEmu = list => {
    writeFileSync(join(dir, 'cases.json'), JSON.stringify(list));
    const py = spawnSync('python', [EMU, join(dir, 'cases.json'), join(dir, 'out.json')], { encoding: 'utf8', maxBuffer: 1 << 28 });
    if (py.status !== 0){ console.log(py.stdout, py.stderr); throw new Error('emu_fb.py failed'); }
    return JSON.parse(readFileSync(join(dir, 'out.json'), 'utf8'));
  };
  const ROM = runEmu(cases.map(c => emuCase(c, JS.get(c.name))));

  const eq = (a, b) => a === b || (a !== a && b !== b);
  const eqv = (a, b) => !!a && !!b && a.length === b.length && a.every((v, i) => eq(f(v), f(b[i])));
  const BASE = { 0x15c: "base12", 0x15f: "base13", 0x15d: "base01", 0x160: "base26" };
  const FULL = new Set(['base00', 'base13']);
  function diffShell(R, I, snaps, base){
    const S0 = I.S, L = snaps.get(S0.id) || [];
    if (!R.init) return 'the ROM init deleted it, the module made it';
    const sp = R.spawn;
    if (FULL.has(base)){
      const ln = S0.launch;
      if (!eqv(ln.position || ln.point, sp.pos)) return 'init position ' + JSON.stringify(ln.position || ln.point) + ' vs ROM ' + JSON.stringify(sp.pos);
      if (!eqv(ln.velocity, sp.vel)) return 'init velocity ' + JSON.stringify(ln.velocity) + ' vs ROM ' + JSON.stringify(sp.vel);
      if (!eqv(ln.gravity || S0.gravity, sp.acc)) return 'gravity ' + JSON.stringify(ln.gravity || S0.gravity) + ' vs ' + JSON.stringify(sp.acc);
      if (!eqv((ln.angles || [0, 0, 0]).map(w => w & 0xffff), sp.ang.map(w => w & 0xffff))) return 'init words ' + JSON.stringify(ln.angles) + ' vs ROM ' + JSON.stringify(sp.ang);
      if (!eq(f(base === 'base13' ? ln.life : ln.timer), f(sp.timer))) return 'init timer ' + (base === 'base13' ? ln.life : ln.timer) + ' vs ' + sp.timer;
    }
    for (const fr of R.frames){
      const s = L.find(x => x.moves === fr.k);
      if (!s){ if (fr.state >= 0xfe && L.length && L[L.length - 1].state >= 0xfe) break; return 'no module move ' + fr.k + ' (ROM state ' + fr.state + ')'; }
      if (s.state !== fr.state) return 'move ' + fr.k + ' state ' + s.state + ' vs ROM ' + fr.state;
      if (fr.state === 0xff) break;
      if (!eqv(s.pos, fr.pos)) return 'move ' + fr.k + ' position ' + JSON.stringify(s.pos) + ' vs ROM ' + JSON.stringify(fr.pos);
      if (FULL.has(base)){
        if (!eqv(s.vel, fr.vel)) return 'move ' + fr.k + ' velocity ' + JSON.stringify(s.vel) + ' vs ROM ' + JSON.stringify(fr.vel);
        if (!eqv(s.anchor, fr.anchor)) return 'move ' + fr.k + ' anchor ' + JSON.stringify(s.anchor) + ' vs ROM ' + JSON.stringify(fr.anchor);
        if (!eq(f(s.timer), f(fr.timer)) && (s.state === 1 || (base === 'base13' && s.state === 2))) return 'move ' + fr.k + ' timer ' + s.timer + ' vs ' + fr.timer;
      }
      if (!eqv(s.ang.map(w => w & 0xffff), fr.ang.map(w => w & 0xffff))) return 'move ' + fr.k + ' words ' + JSON.stringify(s.ang) + ' vs ROM ' + JSON.stringify(fr.ang);
    }
    const romStarts = R.log.concat(...R.frames.map(x => x.log)).filter(e => e[0] === 'start');
    const jsStarts = (S0.start ? [S0.start] : []).concat(I.starts);
    if (romStarts.length !== jsStarts.length) return 'starts ' + jsStarts.length + ' ' + JSON.stringify(jsStarts.map(q => q.key)) + ' vs ROM ' + romStarts.length + ' ' + JSON.stringify(romStarts.map(e => e.slice(1, 3)));
    for (let i = 0; i < romStarts.length; i++){
      const r = romStarts[i], q = jsStarts[i];
      if (r[1] !== q.listId || r[2] !== q.key) return 'start ' + i + ' (' + q.listId + ', ' + q.key + ') vs ROM (' + r[1] + ', ' + r[2] + ')';
      if (!eqv(q.requester.position, r[3])) return 'start ' + i + ' point ' + JSON.stringify(q.requester.position) + ' vs ROM ' + JSON.stringify(r[3]);
    }
    // the split's stop: the ROM's 0x329c40(h, 1) once, exactly when the module split (S0.split083)
    const romAtOnce = R.frames.some(x => x.log.some(e => e[0] === 'stop' && e[1] === 1));
    if (romAtOnce !== !!S0.split083) return 'the flight stopped at once (the split): module ' + !!S0.split083 + ' vs ROM ' + romAtOnce;
    return null;
  }
  function diffTree(R, I, J){
    const d = diffShell(R, I, J.snaps, BASE[I.S.globalId]);
    if (d) return { d, n: 1 };
    const kids = R.children;
    if (kids.length !== I.children.length) return { d: 'children ' + I.children.length + ' vs ROM ' + kids.length + ' ' + JSON.stringify(kids.map(k => k.id)), n: 1 };
    let n = 1;
    for (let j = 0; j < kids.length; j++){
      const K = J.info.get(I.children[j]);
      if (K.S.globalId !== kids[j].id) return { d: 'child ' + j + ' id ' + K.S.globalId + ' vs ROM ' + kids[j].id, n };
      const setupMode = parseInt(kids[j].run.setup.slice(16, 18), 16);
      if (K.S.modeIndex !== setupMode) return { d: 'child ' + j + ' mode ' + K.S.modeIndex + ' vs ROM ' + setupMode, n };
      const r = diffTree(kids[j].run, K, J);
      n += r.n;
      if (r.d) return { d: 'child ' + j + ' (' + K.S.shell + ' ' + K.S.modeIndex + '): ' + r.d, n };
    }
    return { d: null, n };
  }
  function compare(c, R, J){
    const mine = [...J.info.values()].filter(I => I.S.creator == null);
    // state 0 is base12's DEFERRED init (0x403854: +0x15e0 bit 1, the lit modes) -- live, its real init on the first move (2026-10-20)
    const isLive = s => !!s.run && !!s.run.init && (s.run.spawn.state === 0 || s.run.spawn.state === 1 || s.run.spawn.state === 2);
    const live = R.shells.filter(isLive), dead = R.shells.length - live.length;
    if (mine.length !== live.length) return { why: 'shells ' + mine.length + ' vs ROM ' + live.length + ' (' + dead + ' dead)' + (J.refused.length ? ' (refused ' + JSON.stringify(J.refused[0]) + ')' : '') };
    let n = 0;
    for (let i = 0; i < live.length; i++){
      const r = live[i], I = mine[i];
      if (I.S.globalId !== r.id || I.S.modeIndex !== r.mode) return { why: 'shell ' + i + ' id/mode ' + I.S.globalId + '/' + I.S.modeIndex + ' vs ROM ' + r.id + '/' + r.mode };
      const t = diffTree(r.run, I, J);
      n += t.n;
      if (t.d) return { why: 'shell ' + i + ' (' + I.S.shell + ' ' + I.S.modeIndex + '): ' + t.d };
    }
    return { why: null, n };
  }
  const count = R => R.shells.reduce((a, s) => a + (s.run ? 1 + (function k(x){ return x.children.reduce((b, c) => b + 1 + k(c.run), 0); })(s.run) : 0), 0);
  const movesOf = R => R.shells.reduce((a, s) => a + (s.run ? (function m(x){ return x.frames.length + x.children.reduce((b, c) => b + m(c.run), 0); })(s.run) : 0), 0);
  for (const c of cases){
    const R = ROM[c.name], J = JS.get(c.name);
    const { why } = compare(c, R, J);
    ok(!why && (c.none ? R.shells.length === 0 : R.shells.length > 0), c.name + ': ' + R.shells.length + ' shell(s), ' + count(R) + ' with their children, ' + movesOf(R) + ' moves equal to the ROM', why || '');
  }
  // ---- 2. the contract ----------------------------------------------------------------------------------------------------------
  const pv = (m, l, c) => JSON.stringify(S.pickVariantsFor(m, l, c, {}));
  ok(pv('em082_04', '2', 'Motion[21]') === '["7:0x0d"]', 'L2 M21 picks its bubble action', pv('em082_04', '2', 'Motion[21]'));

  // ---- 3. CONTROLS ----------------------------------------------------------------------------------------------------------------
  const byName = n => cases.find(c => c.name === n);
  const controls = [
    ['b0c', { joints: Object.assign({}, JOINTS, { 2: J2b }) }, 'another joint 2'],
    ['b0c', { owner: [0, 0x9124, 0] }, 'the facing one word off'],
    ['b09_tilt', { target: [900.0, 1500.0, 2400.0] }, 'the target 100 higher (the tilt e+0xcb9c)'],
    ['b0d_head', { mizu082: { headBroken: false } }, 'the head read intact'],
    ['b0d_tired', { tired: false }, 'the tired gate dropped'],
    ['b2a_tail', { tailSevered: false }, 'the tail read intact'],
    ['w04', { target: [930.0, 40.0, 2400.0] }, 'the target 30 over (the throws)'],
    ['w04_tail', { tailSevered: false }, 'the throw tail cancel dropped'],
    ['L06', { soulFlame082: false }, 'the soul flame read out (lit 174..176)'],
    ['L08', { soulFlame082: false }, 'the soul flame read out (the throws)'],
    ['L26', { soulFlame082: false }, 'the soul flame read out (the ghost flames)'],
    ['w1e', { joints: Object.assign({}, JOINTS, { 18: J2b }) }, 'another joint 18'],
  ];
  const CR = runEmu(controls.map(([n]) => emuCase(byName(n), JS.get(n))));
  for (let i = 0; i < controls.length; i++){
    const [n, over, what] = controls[i];
    const c = byName(n), J = runJS(c, over);
    const { why } = compare(c, CR[n], J);
    ok(!!why, 'CONTROL ' + n + ' with ' + what + ' fails', why || 'it matched');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  return fail ? 1 : 0;
}
if (MAIN) process.exit(await nodeMain());

// ---- 4. IN THE VIEWER: run by run-check.mjs, serialised with .toString() and evaluated IN THE PAGE (closes over nothing here) ----
export const args = [];
export async function pageCheck(){
  const out = [];
  const check = (ok, label, detail) => out.push([!!ok, 'Soulseer shells: ' + label, detail === undefined ? '' : JSON.stringify(detail)]);
  const V = window.__view;
  const M = await import('/render/monster.js');
  const frames = n => new Promise(r => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  const until = async (test, n = 600) => { for (let i = 0; i < n; i++){ if (test()) return true; await frames(1); } return false; };
  V.pose.clock.getDelta = () => 1 / 60;
  const monSel = document.getElementById('monSel'), listSel = document.getElementById('monList'), clipSel = document.getElementById('monClip');
  const body = () => M.effectRuntimeInstance();
  const MON = 'em082_04';
  const open = async () => {
    if (![...monSel.options].some(o => o.value === MON)) monSel.add(new Option(MON, MON));
    monSel.value = MON; await monSel.onchange();
    await V.effects(false); await V.effects(true);
    return until(() => body() && body().monsterId === MON && body().schedule);
  };
  const OLD = new Set();
  const pick = async (list, name) => {
    if (V.state.list !== list){ listSel.value = list; await listSel.onchange(); }
    const o = [...clipSel.options].find(x => x.value === name) || [...clipSel.options].find(x => x.value === name + '_start') || [...clipSel.options].find(x => x.value === name + '_loop');
    if (!o){ check(false, 'list ' + list + ' has ' + name, [...clipSel.options].slice(0, 5).map(x => x.value)); return false; }
    OLD.clear();
    const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
    for (const s of (st ? st.shells : [])) OLD.add(s);
    clipSel.value = o.value; await clipSel.onchange();
    return true;
  };
  const watch = async (n, stop) => {
    const seen = new Map();
    for (let i = 0; i < n; i++){
      await frames(1);
      const st = body() && body().schedule && body().schedule.shells && body().schedule.shells.state;
      for (const s of (st ? st.shells : [])){
        if (seen.has(s) || OLD.has(s)) continue;
        seen.set(s, { shell: s.shell, mode: s.modeIndex, key: s.start && s.start.key, req: !!s.request });
      }
      if (stop && stop([...seen.values()])) break;
    }
    return [...seen.values()];
  };
  check(await open(), 'the runtime is up');
  {
    await pick('2', 'Motion[21]');
    const w = await watch(400);
    check(w.some(x => x.shell === 'shell12' && x.req), 'L2 M21: bubbles, shell12, started', w);
    check(!body().failed, 'L2 M21 played out: the runtime still up', body().failed ? String(body().failed) : null);
    if (body().failed) await open();
  }
  for (const [l, c, n, sh] of [['2', 'Motion[56]', 200, 'shell13']].concat([['2', 'Motion[69]', 140, 'shell26']])){
    // (200 frames: the viewer LOOPS this one-shot action, a volley a pass, and some twenty 300-frame puddles at once fill the effect
    // runtime's slot pool -- its full path 0x418d4 is unlifted (dev/leviathan-shells-spec.md 5, the effects lane's))
    await open();
    await pick(l, c);
    const w = await watch(n);
    check(w.some(x => x.shell === sh && x.req), 'L' + l + ' ' + c + ': ' + sh + ' started', w.slice(0, 4));
    check(!body().failed, 'L' + l + ' ' + c + ' played out: the runtime still up', body().failed ? String(body().failed) : null);
    if (body().failed) await open();
  }
  // THE LOOPING PLAY (off until the effects lane lifts the slot pool's full path 0x418d4 -- dev/leviathan-shells-spec.md 5f): the
  // viewer loops these one-shot actions, a volley a pass; switch LOOPS on and each clip plays 1500 frames with the runtime up
  const LOOPS = true;   // (2026-10-18: the pool's 0x418d4 READ -- not a full pool; the effects lane switched Soulseer's on)
  if (LOOPS) for (const [l, c, sh] of [['2', 'Motion[56]', 'shell13'], ['2', 'Motion[59]', 'shell13']].concat([['2', 'Motion[69]', 'shell26'], ['0', 'Motion[15]', 'shell26']])){
    await open();
    await pick(l, c);
    const w = await watch(1500);
    check(w.some(x => x.shell === sh && x.req), 'LOOPING L' + l + ' ' + c + ': ' + sh + ' started', w.length);
    check(!body().failed, 'LOOPING L' + l + ' ' + c + ' for 1500 frames: the runtime still up', body().failed ? String(body().failed) : null);
  }
  if (!LOOPS) check(true, 'the looping play is off (LOOPS = false: the effect pool, 0x418d4)');
  {
    // THE SOUL FLAME ON (the Soul Flame control, state.classCtl 1 -> shellExtra soulFlame082): L2 M20's lit bubbles 188..190 (u 200 / 210)
    await open();
    const cs = document.getElementById('monClassCtl'); cs.value = '1'; cs.onchange({ target: cs });
    check(V.shellExtra && V.shellExtra().soulFlame082 === true, 'the Soul Flame control reaches the shells', V.shellExtra && V.shellExtra().soulFlame082);
    await pick('2', 'Motion[20]');
    const w = await watch(200, x => x.some(y => y.shell === 'shell12'));
    check(w.some(x => x.shell === 'shell12' && x.mode >= 185 && x.key === 200 && x.req), 'L2 M20 lit: a flame bubble (185..190), u 200 started', w.slice(0, 4));
    cs.value = '0'; cs.onchange({ target: cs });
  }
  await open();   // (a fresh runtime for the records: the play-outs' long effects off the pool)
  const S = body().schedule;
  for (const key of [0, 1, 2, 10, 11, 12, 20, 21, 22, 30, 31, 32, 40, 41, 42, 50, 51, 52, 60, 61, 80, 81, 100, 101, 150, 200, 201, 210]){
    const e = S.entries.find(x => x.when === 'shell' && x.def.record && x.def.record.pel === 'em082_04u' && x.def.record.key === key);
    if (!e){ check(false, 'em082_04u ' + key + ' exported as a shell record'); continue; }
    let started = 0, maxRun = 0;
    for (let rep = 0; rep < 2; rep++){
      try { S.start(e); started++; } catch (err){ check(false, 'u ' + key + ' start', String(err)); }
      for (let i = 0; i < 240; i++){ await frames(1); maxRun = Math.max(maxRun, e.requests.length); if (body().failed) break; }
    }
    check(!body().failed && started === 2, 'record u ' + key + ': started twice, run out, no refusal', { failed: body().failed ? String(body().failed) : null, maxRun });
    if (body().failed) await open();
  }
  return out;
}

// The leg snow replayed through a PATCHED COPY of render/shells.js (gapG/shells.patched.js, written by patch_legsnow.py; the repo file
// untouched): each case plays one clip frame by frame through stepShells and lists the shells made (mode, frame) and the records
// they start. Expected = the ROM census (cen_legsnow.py / frames_legsnow.py / dur_check.py, durability > 0). Controls must not make.
//   python patch_legsnow.py && node replay.mjs          exit 1 on any mismatch
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));
const S = await import(pathToFileURL('C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/shells.js').href);
const f = Math.fround;
function jointOf(a, b, c, t){
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  const Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca], Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb], Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1];
  const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++){ let s = 0; for (let k = 0; k < 3; k++) s += A[i * 3 + k] * B[k * 3 + j]; o.push(s); } return o; };
  const R = mul(mul(Rz, Rx), Ry);
  return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1].map(f);
}
const JOINTS = { 0: jointOf(0.2, 0, 0, [118, 210.5, -60.25]), 7: jointOf(-0.3, 0.4, -0.15, [-95.25, 120.5, 140.75]),
                 11: jointOf(0.5, -0.1, 0.2, [140.5, 118.25, 20.5]), 14: jointOf(-0.6, 0.35, 0.05, [40.5, 60.25, -120.75]),
                 17: jointOf(1.1, 0.2, -0.3, [150.25, 60.5, -118]), 157: jointOf(0.9, -0.45, 0.25, [160.25, 260.5, -40.75]) };
const J = g => JOINTS[g] || JOINTS[0];
function play(mon, list, clip, n, len, legs){
  const st = S.createShellState(mon), made = [], starts = [], refused = [], byId = new Map();
  for (let frame = 0; frame <= len + 60; frame++){
    const out = S.stepShells(st, { monId: mon, list, clip, frame: Math.min(frame, len), joints: J,
      rock: { variant: '7:0x' + n.toString(16).padStart(2, '0'), target: { x: 900, y: 40, z: 2400 }, floorY: 0 },
      owner: { x: 0, y: 0x3000, z: 0 }, ownerPos: { x: 120.5, y: 15.25, z: -80.75 }, ground: 0, size: [1, 1], baseScale: 1, rank: 5,
      questLevel: 10, legSnow083: legs, trunkSnow083: 0 });
    for (const sh of out.spawned){ byId.set(sh.id, sh); made.push('m' + sh.modeIndex + '@' + sh.spawnFrame);
      if (sh.start) starts.push('m' + sh.modeIndex + ' ' + sh.start.listId + ':' + sh.start.key); }
    for (const { shell: sh, start } of out.started) if (byId.has(sh.id)) starts.push('m' + sh.modeIndex + ' ' + start.listId + ':' + start.key);
    for (const r of out.refused) refused.push('m' + r.mode + ' ' + r.why);
  }
  return { made, starts: [...new Set(starts)], refused: [...new Set(refused)] };
}
let fail = 0;
function C(name, mon, list, clip, n, len, legs, want, x = {}){
  const r = play(mon, list, clip, n, len, legs);
  const got = r.made.filter(m => x.all || /^m[3-6]@/.test(m));
  const ok = JSON.stringify(got) === JSON.stringify(want) && (!x.refused || r.refused.some(q => q.includes(x.refused)));
  if (!ok) fail++;
  console.log((ok ? 'PASS ' : 'FAIL ') + name.padEnd(26) + ' made ' + JSON.stringify(got) + (ok ? '' : '  want ' + JSON.stringify(want)));
  if (r.starts.length) console.log('       records started: ' + r.starts.join(', '));
  if (r.refused.length) console.log('       refused: ' + r.refused.join(' | '));
}
// (the rows' `also` numbers -- (7, 0x32) under (7, 0), (7, 6) under (7, 5) -- are listing aliases: the row is picked by its own variant)
// Gammoth (variant 0): the ROM's makes with every leg at level 2 and the durability > 0
C('g L2M1 (7,0)',      'em083_00', '2', 'Motion[1]', 0x00, 291, [2, 2, 2, 2], ['m3@116']);
C('g L2M2 (7,1)',      'em083_00', '2', 'Motion[2]', 0x01, 277, [2, 2, 2, 2], ['m4@100']);
C('g L2M6 (7,5)',      'em083_00', '2', 'Motion[6]', 0x05, 539, [2, 2, 2, 2], ['m4@208', 'm5@230', 'm6@268', 'm3@310']);
C('g L2M6 lvl3',       'em083_00', '2', 'Motion[6]', 0x05, 539, [3, 3, 3, 3], ['m4@208', 'm5@230', 'm6@268', 'm3@310']);
C('g L2M6 lvl1',       'em083_00', '2', 'Motion[6]', 0x05, 539, [1, 1, 1, 1], ['m4@208', 'm5@230', 'm6@268', 'm3@310']);
C('g L2M37 (7,0x5a)',  'em083_00', '2', 'Motion[37]', 0x5a, 289, [2, 2, 2, 2], ['m3@170', 'm37@172', 'm4@172'], { all: true });
C('g L2M37 (7,0x5c)',  'em083_00', '2', 'Motion[37]', 0x5c, 289, [2, 2, 2, 2], ['m3@170', 'm38@172', 'm4@172'], { all: true });
// Elderfrost (variant 4): slots 0 / 1 only (his slots 2 / 3 are 0: legSnow083 gives 0)
C('e L2M6 (7,5) lvl2',  'em083_04', '2', 'Motion[6]', 0x05, 539, [2, 2, 0, 0], ['m4@208', 'm3@310']);
C('e L2M6 (7,5) lvl1',  'em083_04', '2', 'Motion[6]', 0x05, 539, [1, 1, 0, 0], ['m4@208', 'm3@216']);
C('e L2M1 (7,0)',       'em083_04', '2', 'Motion[1]', 0x00, 291, [2, 2, 0, 0], ['m3@116']);
C('e L9M11 (7,0x70)',   'em083_04', '9', 'Motion[11]', 0x70, 183, [2, 2, 0, 0], ['m3@30', 'm30@30'], { all: true });
C('e L9M14 (7,0x71)',   'em083_04', '9', 'Motion[14]', 0x71, 183, [2, 2, 0, 0], ['m4@30', 'm31@30'], { all: true });
// controls: bare (0) and broken (4) legs make nothing; no input is a named refusal
C('ctl g L2M6 bare',    'em083_00', '2', 'Motion[6]', 0x05, 539, [0, 0, 0, 0], []);
C('ctl g L2M6 broken',  'em083_00', '2', 'Motion[6]', 0x05, 539, [4, 4, 4, 4], []);
C('ctl g L2M6 one leg', 'em083_00', '2', 'Motion[6]', 0x05, 539, [0, 0, 2, 0], ['m5@230']);
C('ctl g no input',     'em083_00', '2', 'Motion[6]', 0x05, 539, null, [], { refused: 'no leg snow levels' });
C('ctl e L9M11 bare',   'em083_04', '9', 'Motion[11]', 0x70, 183, [0, 0, 0, 0], ['m30@30'], { all: true });
console.log(fail ? fail + ' FAILED' : 'all pass');
process.exit(fail ? 1 : 0);

// SHELLS: the objects a monster's ACTION code spawns (a breath's body, thrown rocks, debris), translated from the ROM.
//
// Decode notes (every address below is explained there): E:\offline\decode\notes\shells-em043.md.
// ROM: C:\MHGU-ROM\exefs main.text (VA 0), main.rodata (VA 0x13ef000), main.data (VA 0x1728000). Data: the monster's
// .arc (C:\MHGU-Extract\scratch-em\em043_05\em043_05.arc), folder shell\em\em043_05_shellNN.
//
// WHAT THIS MODULE IS. A step function the effect runtime calls once per game frame (1/60 s, the same step as
// render/rom/effect/schedule.js). It reproduces, from the clip the viewer plays, what the monster's code does:
//   * WHEN a shell spawns: the attack action tests "the motion passed frame F" (0xb0974 -> 0x72714) in the enemy's
//     action code, which runs BEFORE that game frame's motion advance (enemy frame 0xada80: action main 0xadddc,
//     advance 0xae10c -> 0x71984 -> 0x94e1a0, joint build 0xae16c -> 0xa807c). The test reads the PREVIOUS advance:
//     prev = motion +0x500 (the frame before it), cur = +0x500 + step (+0x13b8) = the frame the pose now shows.
//     So at step k (pose F[k]) the test is F[k-2] < F <= F[k-1], and the shell's init reads the joint matrices built
//     for pose F[k-1]. The shell is then appended to unit move line 18 (0x48ba04: (r2 & 1) | 9 << 1), which the unit
//     manager walks after the enemy's line 4 (0xc0437c walks lines 0..n in order; enemies 0x4ec18), so its first
//     move runs in the SAME game frame, on the joints built for F[k].
//   * WHERE it is and how it moves: the class's init (vtable +0x13c) and per-frame move (+0x24), line by line,
//     in float32 as the ARM code computes them (Math.fround on every VFP result, trunc for vcvt.s32).
//   * WHICH effect it starts, where, and when it stops it: the .shl's per-mode rShellEffectParam (listId, uniqueId);
//     listId 0 = the .shl EffectLists[0] = effect\pel\em\em043_05u (u.pel). The request is handed to the caller as
//     data (the requester fields the ROM fills); the caller (the Effects Agent's runtime) starts, places and stops
//     the effect. This module never touches render/rom/effect/*.
//
// UNITS AND FRAMES. Positions are GAME units in world space (the viewer's world is game units / 100: live.js
// MT_TO_VIEW). Joint matrices are the game's: 16 floats in memory order (row-vector convention, rows = axes, row 3 =
// translation) -- exactly three.js `matrixWorld.elements` with the translation multiplied by 100, the array live.js
// hands host.setJointMatrix. Angles are the ROM's u16 binary angles (65536 = one turn) where the ROM keeps them, and
// degrees where the ROM hands degrees to the effect. Frames are motion frames at 60/s (index.html driveClipEffects:
// action.time * 60 plus a _loop clip's _start length).
//
// NOT MODELLED (the viewer has no such state; see the notes):
//   * the owner's special state +0xb720 (enemy vtable +0x170 sets it, 0xca664): with it on, base04 multiplies its
//     beam length by a per-kind factor from tables at enemy +0xca98 / +0xcaac (0x43aa78). Off on a normal monster.
//   * base55's extra end test 0xc99a4: [[owner+0x1428]+0x5ea7] > 0 ends the shell (meaning not read).
//   * hit, sound and the unit's own draw: not visual here (hit vtable +0x140, sound 0x3fffcc / 0x42d29c).
//   * the effect's liveness is the caller's (input.effectAlive); without it the effect counts as alive.
const f = Math.fround;

// ---- ROM constants (float literals as stored) -------------------------------------------------------------------
const RAD_TO_U16 = f(10430.3779296875);      // 0x4622f983 = 65536 / 2pi (0x3ff8cc, 0x3ffec0)
const U16_TO_RAD = f(9.58738019107841e-05);  // 0x38c90fdb = 2pi / 65536 (0x3ff578)
const U16_TO_DEG = f(0.0054931640625);       // 0x3bb40000 = 360 / 65536 (0x3ff774, 0x3fffc8)
const DEG_TO_U16 = f(182.04444885253906);    // 0x43360b61 = 65536 / 360 (0x3ff574)
const HALF_PI = f(1.5707963705062866);       // 0x3fc90fdb (0x7c3af0 / 0x7c3acc, negated)
const ENDING_FRAMES = f(f(30.0) * f(60.0));  // [0x162493c] = 30.0 times 60.0 (end 0x400280 / 0x42d550)
const SNAP = f(0.0005);                      // 0x3a03126f: a frame this close under an integer is that integer

const sinf = x => f(Math.sin(x)), cosf = x => f(Math.cos(x)), atan2f = (y, x) => f(Math.atan2(y, x));
const asinf = x => f(Math.asin(x)), acosf = x => f(Math.acos(x)), sqrtf = x => f(Math.sqrt(x));
// vcvt.s32.f32: round toward zero, saturating; NaN -> 0
const s32 = x => (x !== x) ? 0 : x >= 2147483647 ? 2147483647 : x <= -2147483648 ? -2147483648 : Math.trunc(x);
const u16 = x => x & 0xffff;
const mla = (acc, a, b) => f(acc + f(a * b));        // vmla.f32 (not fused): round the product, then the sum
const mls = (acc, a, b) => f(acc - f(a * b));        // vmls.f32
const nmls = (acc, a, b) => f(f(a * b) - acc);       // vnmls.f32: d = n*m - d

// ---- the data read from the ROM and the .arc ---------------------------------------------------------------------
// Per mode, the .shl (XFS 4aa69872, class rShell::cShellInfo 0x32003f1c: ShellScale f32, EffectParam, SoundParam,
// HitParam, ShellParam; the mode indexes ShellInfoList, 0x4a22f0..0x4a2584) names four files. `sh` is the ShellParam
// rFreeUseParam (FUP: ints / floats / vec3s; getters +0x44 / +0x4c / +0x54 = 0x3cb30c / 0x3cb330 / 0x3cb35c, an index
// past the end reads 0 / 0.0 / the zero vector). `ef` is the rShellEffectParam list (listId, uniqueId); `scale` is
// ShellScale. Values are the files' own, em043_05.arc.
export const SHELL_DATA = {
  em043_05: {
    name: 'Savage Deviljho',
    // the monster's effect lists by listId: the .shl EffectLists (rProofEffectList), index 0 in every em043_05 .shl
    lists: { 0: { list: 'u', pel: 'em043_05u' } },
    shells: {
      // global shell id 0xda (ctor 0xe727d0 stores it at enemy +0xcacc for variant 5); table 0x175c3e8[0xda] =
      // {uShellEm043_sp_04 DTI 0x188c928, uShellEmBase04::cSetupParamEmBase04 DTI 0x1885bf8, resource 0x8a2d};
      // class size 0x1650, ctor 0xe82924 (base 0x3ff080), vtable 0x17c0ff4 -- only slots 1, 5 and 83 (+0x14c, the
      // param reader 0xe82944) are its own, the rest is uShellEmBase04.
      shell04: {
        id: 0xda, cls: 'uShellEm043_sp_04', base: 'base04', folder: 'shell\\em\\em043_05_shell04',
        modes: {
          // em043_05_04_sh001 / _ef001 (mode 0 has no files: ShellInfoList[0] is all null)
          1: { scale: 1.0, ef: [[0, 60], [999, -1]],
               sh: { ints: [3, 6, 0, 0, -1], floats: [1200.0, 98.0, 200.0], vecs: [[0.0, -60.0, 60.0], [20.0, 0.0, 0.0]] } },
          // em043_05_04_sh002 / _ef002: only the beam length differs
          2: { scale: 1.0, ef: [[0, 70], [999, -1]],
               sh: { ints: [3, 6, 0, 0, -1], floats: [1700.0, 98.0, 200.0], vecs: [[0.0, -60.0, 60.0], [20.0, 0.0, 0.0]] } },
        },
      },
      // global shell id 0xdc (enemy +0xcad4); uShellEm043_sp_55 DTI 0x188c968 : uShellEmBase55 (setup DTI 0x18878a8),
      // size 0x1670, ctor 0xe83188 (base 0x42c484), vtable 0x17c12cc, param reader 0xe831a8 (+0x14c)
      shell55: {
        id: 0xdc, cls: 'uShellEm043_sp_55', base: 'base55', folder: 'shell\\em\\em043_05_shell55',
        modes: {
          // em043_05_55_sh000 / _ef000
          0: { scale: 1.0, ef: [[0, 70], [999, -1]],
               sh: { ints: [3, -1], floats: [1700.0, 42.0, 100.0], vecs: [[0.0, -120.0, 80.0], [0.0, 0.0, 0.0]] } },
        },
      },
    },
    // The attack actions that spawn them (status 7 switch 0xe7b1d4, table 0xe7b200), each read to its spawn.
    // `pick` is how the monster's command table chooses it (em043_00_cmdtbl in em043_05.arc; op 0x6f switch value
    // is enemy vtable +0x214 = 0xe80d28, arg 1 = 0xe80e30: on variant 5 it is 2 when ENRAGED (0x81670) else 1):
    //   'calm' / 'rage' = group 1 stream 3 (M25) or 8 (M26): switch(v1) { case 2: rage action; default: calm action }
    //   'chain' = only reached from another action's code, never from a clip start (see the notes).
    actions: [
      // 0xe78a24(e, r1, r2): phase 0 setMotion 0x219 (r1 0) / 0x21a (r1 1), blend 6 (r2 != 2); phase 1 spawns shell04
      // when the motion passes 130.0 (r1 0) / 136.0 (r1 1); variant 5: mode 1 when r2 == 0, else 2 (0xe78c38..0xe78da8)
      { action: [7, 0x06], code: 0xe78a24, args: [0, 0], list: '2', clip: 'Motion[25]', frame: 130.0, shell: 'shell04', mode: 1, pick: 'calm' },
      { action: [7, 0x31], code: 0xe78a24, args: [0, 1], list: '2', clip: 'Motion[25]', frame: 130.0, shell: 'shell04', mode: 2, pick: 'rage' },
      { action: [7, 0x07], code: 0xe78a24, args: [1, 0], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 1, pick: 'calm' },
      { action: [7, 0x32], code: 0xe78a24, args: [1, 1], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 2, pick: 'rage' },
      // chained from 0xe77650 when its motion passes 130 (0xe7796c); starts M26 at max(int(prev - 130) + 38, 0)
      { action: [7, 0x34], code: 0xe78a24, args: [1, 2], list: '2', clip: 'Motion[26]', frame: 136.0, shell: 'shell04', mode: 2, pick: 'chain' },
      // 0xe7af24(e, r1): setMotion 0x229 (r1 0) / 0x22a (r1 1), blend 2; spawns shell55 mode 0 when the motion passes
      // 86.0 (0xe7b0fc..0xe7b184). Chained from 0xe7a9f8's end: 0xe7ae28(e, 0) == 1 ? (7, 0x93) : (7, 0x94) (0xe7ad50)
      { action: [7, 0x93], code: 0xe7af24, args: [0], list: '2', clip: 'Motion[41]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
      { action: [7, 0x94], code: 0xe7af24, args: [1], list: '2', clip: 'Motion[42]', frame: 86.0, shell: 'shell55', mode: 0, pick: 'chain' },
    ],
  },
};

// The action the monster would be playing this clip in. A clip reached only by 'chain' has one action; a clip the
// command table picks by rage has two, and rage decides (the switch is evaluated when the action is chosen, i.e. at
// the motion's start). `force` = [status, number] overrides. Returns null when nothing in the table plays the clip.
export function actionFor(monId, list, clip, rage, force){
  const D = SHELL_DATA[monId];
  if (!D) return null;
  const cands = D.actions.filter(a => a.list === String(list) && a.clip === clip);
  if (force) return cands.find(a => a.action[0] === force[0] && a.action[1] === force[1]) || null;
  const byRage = cands.filter(a => a.pick === (rage ? 'rage' : 'calm'));
  if (byRage.length === 1) return byRage[0];
  const chained = cands.filter(a => a.pick === 'chain');
  // a clip played from its start is never the mid-motion (7, 0x34) entry
  const whole = chained.filter(a => !(a.action[0] === 7 && a.action[1] === 0x34));
  return whole.length === 1 ? whole[0] : null;
}

// ---- joint reads -------------------------------------------------------------------------------------------------
// 0xc15a4(enemy, gid, out): the joint's world matrix (joint + 0x10, 0x539db0: index byte [[e+0x498] + gid], joint =
// [e+0x494] + index * 0xa0); a gid the model does not map falls back to gid 0.
function jointMatrix(joints, gid){
  const m = joints(gid);
  if (m) return m;
  return joints(0) || null;
}

// 0x7c3a38(out, m): Euler angles (radians) from a row-vector matrix
function eulerOf(m){
  if (!(m[9] < 1.0)) return { x: f(-HALF_PI), y: 0, z: f(-atan2f(m[2], m[0])) };            // 0x7c3ab4
  if (m[9] <= -1.0) return { x: HALF_PI, y: 0, z: atan2f(m[8], m[0]) };                      // 0x7c3ad8
  return { x: f(-asinf(m[9])), y: f(-atan2f(f(-m[8]), m[10])), z: f(-atan2f(f(-m[1]), m[5])) };
}

// 0x72dec(q, m): quaternion (x, y, z, w) from a matrix (Shoemake; next-axis table 0x159c504 = [1, 2, 0])
function quatOf(m){
  const q = [0, 0, 0, 0];
  const tr = f(f(m[0] + m[5]) + m[10]);
  if (tr > 0){
    let s = sqrtf(f(tr + 1.0));
    q[3] = f(s * 0.5);
    s = f(0.5 / s);
    q[0] = f(s * f(m[6] - m[9]));
    q[1] = f(s * f(m[8] - m[2]));
    q[2] = f(s * f(m[1] - m[4]));
    return q;
  }
  let i = m[5] > m[0] ? 1 : 0;
  if (m[10] > m[i * 5]) i = 2;
  const NEXT = [1, 2, 0], j = NEXT[i], k = NEXT[j];
  let s = sqrtf(f(f(f(m[i * 5] - m[j * 5]) - m[k * 5]) + 1.0));
  q[i] = f(s * 0.5);
  s = f(0.5 / s);
  q[3] = f(s * f(m[j * 4 + k] - m[k * 4 + j]));
  q[j] = f(s * f(m[i * 4 + j] + m[j * 4 + i]));
  q[k] = f(s * f(m[i * 4 + k] + m[k * 4 + i]));
  return q;
}

// 0x3ff778 (base04) / 0x42c950 (base55): the joint point and its angles. vec0 is transformed by the whole joint
// matrix (homogeneous, divided by w; w == 0 gives 0); angles: the matrix's Euler angles as u16, plus `angOff` on X --
// or, when the angle-mode int is 1, X = owner X angle + angOff, Y = atan2f(m[8], m[10]), Z = owner Z angle.
function jointPoint(M, vec0, angOff, angleMode, owner){
  const [x, y, z] = vec0;
  let w = f(y * M[7]); w = mla(w, x, M[3]); w = mla(w, z, M[11]); w = f(M[15] + w);
  const inv = w === 0 ? 0 : f(1.0 / w);
  let px = f(y * M[4]); px = mla(px, x, M[0]); px = mla(px, z, M[8]);
  let py = f(y * M[5]); py = mla(py, x, M[1]); py = mla(py, z, M[9]);
  let pz = f(y * M[6]); pz = mla(pz, x, M[2]); pz = mla(pz, z, M[10]);
  const P = [f(inv * f(M[12] + px)), f(inv * f(M[13] + py)), f(inv * f(M[14] + pz))];
  let A;
  if (angleMode === 1){
    const Y = atan2f(M[8], M[10]);                                           // 0x3ff8b4 (s0 = m[8], s1 = m[10])
    A = [u16((owner.x >>> 0) + angOff), u16(s32(mla(0.5, Y, RAD_TO_U16))), owner.z >>> 0];
  } else {
    const e = eulerOf(M);
    A = [u16(s32(mla(0.5, e.x, RAD_TO_U16)) + angOff), u16(s32(mla(0.5, e.y, RAD_TO_U16))), u16(s32(mla(0.5, e.z, RAD_TO_U16)))];
  }
  return { P, A };
}

// the direction the init and the moves build from the u16 angles: (0, 0, 1) turned by Z, X, Y as the compiler left
// it (the x and y terms multiply by the literal 0.0 and stay in, 0x3ff334 / 0x3ffb28 / 0x42c724)
function dirOf(A){
  const az = f(u16(A[2]) * U16_TO_RAD), ax = f(u16(A[0]) * U16_TO_RAD), ay = f(u16(A[1]) * U16_TO_RAD);
  const sz = sinf(az), cz = cosf(az), sx = sinf(ax), cx = cosf(ax), sy = sinf(ay), cy = cosf(ay);
  const a = f(sz * 0.0), b = f(cz * 0.0);
  const s = f(a + b), d = f(b - a);                         // (sin z * 0) + (cos z * 0), (cos z * 0) - (sin z * 0)
  const c = mla(cx, s, sx);                                 // cos x + s * sin x
  const dx = mla(f(d * cy), c, sy);                         // d*cos y + c*sin y
  const dy = nmls(sx, s, cx);                               // s*cos x - sin x
  const dz = mls(f(c * cy), d, sy);                         // c*cos y - d*sin y
  return [dx, dy, dz];
}

// 0x3ffe38 / 0x42d108: the effect aimed from the anchor E at the shell's position, in degrees for 0x329d04
function aimOf(pos, E, ownerZ){
  const dxz = f(pos[0] - E[0]), dzz = f(pos[2] - E[2]);
  const yaw = u16(s32(mla(0.5, atan2f(dxz, dzz), RAD_TO_U16)));
  const horiz = sqrtf(mla(f(dzz * dzz), dxz, dxz));
  const pitch = u16(s32(mla(0.5, atan2f(f(-f(pos[1] - E[1])), horiz), RAD_TO_U16)));
  return [f(pitch * U16_TO_DEG), f(yaw * U16_TO_DEG), f((ownerZ >>> 0) * U16_TO_DEG)];
}

// ---- the requester the ROM fills to start a shell's effect param (init 0x3ff648..0x3ff700, 0x42c80c..0x42c8c8) ----
// 0x4a10c8: +0x1c |= 3; +0xc0 = position (the anchor, shell +0x1000); +0xd0 = parent = shell vtable +0x130 = the
// shell's own model interface (shell +0xfd0, vtable 0x1764cd8, forwards to the shell's uModel slots); +0x14 |=
// 0x40000000 with +0x40..+0x48 = ShellScale; +4 = 0; byte +0xc = byte shell +0x1054 (not read). The init then sets
// +0x14 |= 2 with +0x30..+0x38 = (X deg, Y deg, 0). 0x4a11e4: listId must be <= 7 and uniqueId >= 0 (else no
// effect); +8 = 3; start = shell vtable +0x138 (0x4a119c -> 0x53a7d8(shell, list, 2, uniqueId, req, ...)).
function effectRequest(D, mode, param, E, A){
  const p = mode.ef[param];
  if (!p || p[0] > 7 || p[1] < 0) return null;
  const L = D.lists[p[0]];
  if (!L) return null;
  return { param, listId: p[0], list: L.list, pel: L.pel, key: p[1],
           requester: { position: E.slice(), rotationDeg: [f(A[0] * U16_TO_DEG), f(A[1] * U16_TO_DEG), 0.0],
                        scale: [f(mode.scale), f(mode.scale), f(mode.scale)], parent: 'shell',
                        flags14: 0x40000002, flags1c: 3, type8: 3 } };
}

// ---- base04 (uShellEmBase04): init 0x3ff1a0, move 0x3ff938 -> 0x3ffa10, end 0x400234 ----------------------------
function params04(sh){          // sp_04's reader 0xe82944 (its vtable +0x14c)
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  return { joint: I(0),                       // +0x1624
           count: I(1),                       // +0x1628: trail entries
           angleMode: I(2),                   // +0x1630: 1 = owner angles + yaw from the matrix
           flags: (I(3) !== -1 ? 1 : 0) | (I(4) !== -1 ? 2 : 0),   // +0x162c (0xe82a14..0xe82a64)
           length: F(0),                      // +0x1634 (0x43aa78's factor: not modelled, see the header)
           life: F(1),                        // +0x1638 -> timer +0x15cc
           start: F(2),                       // +0x163c: the anchor's distance along the direction
           vec0: V(0), vec1: V(1) };          // +0x1640 offset in joint space, +0x1644 .x = pitch offset (degrees)
}

function init04(S, sh, J, owner){
  const k = params04(S.mode.sh);
  S.k = k;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const [dx, dy, dz] = dirOf(A);
  const f2 = k.start;
  const ox = f(f2 * dx), oy = f(dy * f2), oz = f(f2 * dz);
  S.position = [f(P[0] + ox), f(oy + P[1]), f(oz + P[2])];           // +0x40
  if (k.count <= 0) return false;                                    // 0x3ff3d8: no trail -> delete
  const len = f(k.length - f2);
  const tx = f(dx * len), ty = f(dy * len), tz = f(dz * len);
  S.trail = [];                                                      // +0x15dc, count +0x15e0 (16-byte entries)
  for (let i = 0; i < k.count; i++){
    const t = f(f(k.count - i) / f(k.count));
    S.trail.push([mla(ox, tx, t), mla(oy, ty, t), mla(oz, tz, t)]);
  }
  S.timer = k.life;                                                  // +0x15cc
  S.shift = 0;                                                       // +0x15d0
  S.anchor = S.position.slice();                                     // +0x1000
  S.angles = A.slice();
  S.jointPoint = P;
  return true;
}

function move04(S, J, input, D){
  const k = S.k, owner = input.owner;
  S.prevPosition = S.position.slice();                               // +0x15f0
  const M = jointMatrix(J, k.joint);
  if (!M) return 'end';
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const [dx, dy, dz] = dirOf(A);
  const last = S.trail[S.trail.length - 1];
  S.position = [f(P[0] + last[0]), f(P[1] + last[1]), f(P[2] + last[2])];      // 0x3ffb80..0x3ffba0
  let ex, ey, ez;
  if (!(k.flags & 1)){ ex = f(dx * k.start); ey = f(dy * k.start); ez = f(dz * k.start); }
  else {                                                                       // 0x3ffbf4: along the oldest entry
    let s = f(last[1] * last[1]); s = mla(s, last[0], last[0]); s = mla(s, last[2], last[2]);
    const r = f(k.start * f(1.0 / sqrtf(s)));
    ex = f(last[0] * r); ey = f(last[1] * r); ez = f(last[2] * r);
  }
  S.anchor = [f(ex + P[0]), f(ey + P[1]), f(ez + P[2])];                       // +0x1000
  const len = k.length;                     // +0x15d4; flag 2 calls vtable +0x158 = 0x400564 (bx lr): unchanged
  S.trail[0] = [f(dx * len), f(dy * len), f(dz * len)];
  S.shift = mla(S.shift, input.dt, 0.5);                                       // 0x3ffcec
  while (S.shift >= 1.0){                                                      // 0x3ffd10: every entry moves one down
    for (let i = S.trail.length - 1; i >= 1; i--) S.trail[i] = S.trail[i - 1].slice();
    S.shift = f(S.shift + -1.0);
  }
  S.angles = A.slice();                                                        // +0xfe8
  S.jointPoint = P;
  return lifetime(S, input, D);
}

// ---- base55 (uShellEmBase55): init 0x42c5cc, move 0x42cb28 -> 0x42cc34, end 0x42d504 ---------------------------
function params55(sh){          // sp_55's reader 0xe831a8
  const I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : 0;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  return { joint: I(0),                       // +0x1644
           angleMode: I(1),                   // +0x164c
           length: F(0),                      // +0x1650
           life: F(1),                        // +0x1654 -> timer +0x15cc
           start: F(2),                       // +0x1658
           vec0: V(0), vec1: V(1) };          // +0x165c, +0x1660
}

function init55(S, sh, J, owner){
  const k = params55(S.mode.sh);
  S.k = k;
  const M = jointMatrix(J, k.joint);
  if (!M) return false;
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  S.quat = quatOf(M);                                                // 0x42c950 -> 0x72dec(shell +0x1620, m)
  const [dx, dy, dz] = dirOf(A);
  S.position = [mla(P[0], k.start, dx), mla(P[1], dy, k.start), mla(P[2], k.start, dz)];   // 0x42c7a4
  S.timer = k.life;
  S.grow = 0;                                                        // +0x1610
  S.acc = 0;                                                         // +0x1614
  S.anchor = S.position.slice();
  S.angles = A.slice();
  S.jointPoint = P;
  return true;
}

function move55(S, J, input, D){
  const k = S.k, owner = input.owner;
  S.prevPosition = S.position.slice();
  const M = jointMatrix(J, k.joint);
  if (!M) return 'end';
  const angOff = u16(s32(mla(0.5, k.vec1[0], DEG_TO_U16)));
  const { P, A } = jointPoint(M, k.vec0, angOff, k.angleMode, owner);
  const qj = quatOf(M);
  const [dx, dy, dz] = dirOf(A);
  const step = f(input.dt * input.speed);                                    // 0xb0910: owner +0x1c * +0x50c
  S.grow = Math.min(mla(S.grow, step, 0.125), 1.0);                          // 0x42cd90 (vmin with 1.0)
  S.acc = f(step + S.acc);                                                   // 0x42cdd0
  if (S.acc >= 8.0){                                                         // 0x42ce3c: slerp toward the joint
    const t = f(8.0 / S.acc), q = S.quat;
    let dot = f(qj[1] * q[1]); dot = mla(dot, qj[0], q[0]); dot = mla(dot, qj[2], q[2]); dot = mla(dot, qj[3], q[3]);
    const neg = 0 > dot, c = neg ? f(-dot) : dot, sign = neg ? -1.0 : 1.0;
    let w1, w2 = t;
    if (c < f(0.9999998807907104)){                                          // 0x3f7ffffe
      const th = acosf(c);
      const inv = f(1.0 / sinf(th));
      w1 = f(sinf(f(f(1.0 - t) * th)) * inv);
      w2 = f(inv * sinf(f(t * th)));
    } else w1 = f(1.0 - t);
    const a = f(sign * w1);
    S.quat = [mla(f(qj[0] * a), q[0], w2), mla(f(qj[1] * a), q[1], w2), mla(f(qj[2] * a), q[2], w2), mla(f(qj[3] * a), q[3], w2)];
    S.acc = 8.0;
  }
  const [x, y, z, w] = S.quat;
  const lg = f(k.length * S.grow);                                           // +0x15d4
  const lgg = f(lg * S.grow);
  S.anchor = [mla(P[0], dx, k.start), mla(P[1], dy, k.start), mla(P[2], dz, k.start)];   // 0x42cfac..0x42cfe0
  const y2 = f(y + y), z2 = f(z + z), x2 = f(x + x);
  const ax = mla(f(y2 * w), x, z2);                                          // 2yw + 2xz
  const ay = mls(f(y * z2), x2, w);                                          // 2yz - 2xw
  const az = f(1.0 - mla(f(y * y2), x, x2));                                 // 1 - (2y^2 + 2x^2)
  S.position = [mla(P[0], ax, lgg), mla(P[1], ay, lgg), mla(P[2], az, lgg)];
  S.angles = A.slice();
  S.jointPoint = P;
  return lifetime(S, input, D);
}

// the end test both bases share (0x3ffd98 / 0x42d044): the timer runs on the OWNER's step (0xb0910); the shell ends
// when it runs out or the owner's motion is no longer the one it spawned in (+0x15d8 vs enemy +0x4b4)
function lifetime(S, input){
  let T = S.timer;
  if (T > 0){ T = f(T - f(input.dt * input.speed)); if (S.base === 'base04') T = T > 0 ? T : 0; else if (T < 0){ S.timer = 0; return 'end'; } S.timer = T; }
  if (!(T > 0)) return 'end';
  if (S.motion !== input.motion) return 'end';
  return 'keep';
}

// ---- the step ------------------------------------------------------------------------------------------------------
export function createShellState(monId){
  return { monId, data: SHELL_DATA[monId] || null, motion: null, action: null, hist: null, prevJoints: null,
           shells: [], nextId: 1, frames: 0 };
}

// a frame within 0.0005 under an integer is that integer (0x94ef64..0x94ef94, the motion advance; 0x72854 the test)
function snapFrame(x){
  const a = s32(f(x + SNAP)), b = s32(x);
  return a !== b ? f(a) : f(x);
}

// input: { monId, list, clip (base name, no _start/_loop), frame (60/s, _loop clips offset by their _start),
//          loopStart? (for a _loop clip: its _start clip's length in frames, where the motion loops back to),
//          joints: gid => 16 floats (game convention, this step's pose) or null,
//          rage (the viewer's Enraged state), action?: [status, number] to force, speed? (motion speed, 1),
//          dt? (unit step, 1), owner?: { x, z } (u16 angles, 0 for the viewer's untilted monster),
//          effectAlive?: (shell, param) => bool }
// returns { spawned, ended, removed, alive } -- shells; each carries `start` (spawned: the effect request), `place`
// (each moving step: what 0x329c9c / 0x329d04 give the effect) and `stop` (ended: 0x329c40(h, 0) when 0x43b058 says)
export function stepShells(state, input){
  const out = { spawned: [], ended: [], removed: [], alive: [] };
  const D = state.data;
  if (!D) return out;
  state.frames++;
  const ctx = { dt: f(input.dt == null ? 1.0 : input.dt), speed: f(input.speed == null ? 1.0 : input.speed),
                owner: input.owner || { x: 0, z: 0 }, motion: input.clip ? input.monId + '|' + input.list + '|' + input.clip : null };
  const J = typeof input.joints === 'function' ? input.joints : (() => null);
  const frame = input.clip ? snapFrame(input.frame) : 0;
  // THE MOTION. A new clip is a new motion id. A frame that went back is either the motion's own loop -- a _loop
  // clip wrapping to its start (input.loopStart, the _start clip's length as driveClipEffects computes it) -- or the
  // viewer replaying a clip that does not loop, which for the game is the same action issued again (same motion
  // id, so a live shell is not ended by it).
  let fresh = false;
  const back = !!(state.hist && frame < state.hist[1]);
  if (ctx.motion !== state.motion || (back && input.loopStart == null)){
    state.motion = ctx.motion;
    state.action = ctx.motion ? actionFor(input.monId, input.list, input.clip, !!input.rage, input.action) : null;
    state.hist = [frame, frame];
    fresh = true;
  }
  state.loopStart = input.loopStart == null ? null : snapFrame(input.loopStart);
  // 1. line 4, the enemy: its action code tests the previous advance, (F[k-2], F[k-1]], on last frame's joints
  const a = state.action;
  if (a && !fresh && state.prevJoints){
    const [prev, cur] = state.hist, F = a.frame;
    // 0x72b1c: cur >= f && prev < f; after the motion looped (0x7294c): (loopStart <= f && cur >= f) || prev < f
    const passed = prev <= cur ? (!(cur < F) && prev < F)
                               : ((state.loopStart != null && state.loopStart <= F && !(cur < F)) || prev < F);
    if (passed){
      const S = spawn(state, D, a, state.prevJoints, ctx);
      if (S){ out.spawned.push(S); state.shells.push(S); }
    }
  }
  // 2. line 18, the shells, in the order they were made: each one's move (vtable +0x24) on this frame's joints
  for (const S of state.shells){
    const alive = p => (input.effectAlive ? !!input.effectAlive(S, p) : true);
    if (S.state === 1){
      if (S.effect && !alive(0)) S.effect.gone = true;                // 0x3ff944: a dead handle is cleared
      const r = S.base === 'base04' ? move04(S, J, ctx, D) : move55(S, J, ctx, D);
      S.place = (S.effect && !S.effect.gone) ? { param: 0, position: S.anchor.slice(), rotationDeg: aimOf(S.position, S.anchor, ctx.owner.z) } : null;
      if (r === 'end'){ end(S); out.ended.push(S); }
    } else if (S.state === 0xfe){                                     // 0x3ff998 / 0x42cbbc: waiting for the effect
      S.place = null;
      let T = S.timer;
      if (!(T > 0)){ S.timer = 0; S.state = 0xff; }
      else {
        T = f(T - ctx.dt); S.timer = 0 >= T ? 0 : T;
        const any = (S.effect && !S.effect.gone && alive(0)) || (S.effect2 && alive(1));
        if (!(T > 0) || !any) S.state = 0xff;
      }
    }
  }
  for (const S of state.shells) if (S.state === 0xff) out.removed.push(S);
  state.shells = state.shells.filter(S => S.state !== 0xff);
  out.alive = state.shells.slice();
  state.hist = [state.hist[1], frame];
  // the joint matrices this step's pose was built with: the next step's action code reads these
  const snap = new Map();
  state.prevJoints = gid => { if (!snap.has(gid)){ const m = J(gid); snap.set(gid, m ? Array.from(m) : null); } return snap.get(gid); };
  // eager copy of the joints a shell may ask for, so the snapshot is this step's even if the caller reuses arrays
  for (const sh of Object.values(D.shells)) for (const m of Object.values(sh.modes)) state.prevJoints(m.sh.ints[0]);
  state.prevJoints(0);
  return out;
}

function spawn(state, D, a, J, ctx){
  const def = D.shells[a.shell], mode = def && def.modes[a.mode];
  if (!mode) return null;                                             // no ShellInfoList entry for the mode
  const S = { id: state.nextId++, monId: state.monId, shell: a.shell, cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: a.mode, action: a.action, spawnFrame: a.frame, motion: ctx.motion, state: 1,
              position: null, prevPosition: null, anchor: null, angles: null, trail: null, timer: 0,
              effect: null, effect2: null, start: null, place: null, stop: null };
  const ok = def.base === 'base04' ? init04(S, mode.sh, J, ctx.owner) : init55(S, mode.sh, J, ctx.owner);
  if (!ok) return null;                                               // the init's own refusals delete the shell
  S.prevPosition = S.position.slice();
  S.start = effectRequest(D, mode, 0, S.anchor, S.angles);            // _ef param 0, on the shell itself
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  S.folder = def.folder;
  // every effect param the mode names, as (list, key); only param 0 is ever started (param 1 is (999, -1), which
  // 0x4a11e4 refuses: listId > 7)
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (D.lists[listId] || {}).list || null, key,
                                                       started: param === 0 && !!S.start }));
  return S;
}

// vtable +0x148 with 0 (0x400234 / 0x42d504): stop the effect gracefully, wait up to 30 x 60 frames for it. The move
// placed the effect first (0x3ffd70 / 0x42d020 run before the end test), so this step's `place` stands.
function end(S){
  S.state = 0xfe;
  S.timer = ENDING_FRAMES;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;   // 0x43b058 -> 0x329c40(h, 0)
}

// game-convention joint matrix from a three.js matrixWorld (viewer units): translation times 100, as live.js does
export function gameJointFrom(elements){
  const m = Array.from(elements);
  m[12] = f(m[12] / 0.01); m[13] = f(m[13] / 0.01); m[14] = f(m[14] / 0.01);
  for (let i = 0; i < 16; i++) m[i] = f(m[i]);
  return m;
}

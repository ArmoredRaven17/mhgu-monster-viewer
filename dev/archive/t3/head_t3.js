// hit-type3.js -- THE THIRD HIT-SHAPE TYPE (hit-size codes 4 / 6), shared by the monster's attack shapes (render/attack-hitboxes.js)
// and the shells' hunter pass (render/shells.js shellHitShapes / hunterPass): one transcription, one place (effects lane, 2026-10-22;
// dev/attack-hitshapes.md 4, dev/effect-runtime-engine.md E20, rom-map "Monster attack shapes").
//
// THE BUILD (both builders leave the shape type 3 at 0x170160; R = s x the record's radius, s the builder's scale):
//   the enemy's joints (0x16ddd0, table 0x16deac): code 4 -> 0x16e89c, code 6 -> 0x16ec78
//   the unit / a shell, j0 255 (0x16dbd4, table 0x16dbf4): code 4 -> 0x16e368 (tail 0x16fcbc), code 6 -> 0x16e470 (tail 0x170058)
//   P = the frame's point for s x o0 (the joint matrix's rows, or the unit's +0x40 + its angle words' rows -- as codes 0..2 place o0)
//   code 4: p0 = P + (0, s x o1.x, 0), p1 = P + (0, s x o1.y, 0)  -- straight along the WORLD's Y
//   code 6: p0 = P + Y x s x o1.x,   p1 = P + Y x s x o1.y        -- along the frame's own Y row (a joint: enemy vt+0x54 `0xc156c`,
//           that joint's world matrix; the unit: the angle words' row 1); the X / Z rows' factor is the literal 0.0 (0x16e964 /
//           0x170238), so o1.z is unused
//   codes 3 / 5: no shape (type 0)
// THE TEST (the hunter pass 0x16b6cc: the attack shape's type byte +0x2030 == 3 -> 0x16b88c -> 0x167f70(attack, hunter capsule, out)):
//   0x167f70 -> 0x7dda24 -> 0x7dc9a0, with 0x7dc9a0's callees 0x806ce4 / 0x7db964 / 0x7ebfd8 / 0x80017c / 0x80448c / 0x8060ac /
//   0x8069d8 and sqrtf 0x13ecc14. TRANSCRIBED LINE BY LINE below (the GENERATED block): every instruction of the ten functions that
//   the code can reach, one statement each under its own address, by <scratchpad>/t3/arm2js.py from main.text:
//     - the float registers are a Float32Array, so every VFP result rounds to f32 as the VFP does; vmla / vmls are unfused (the
//       product rounded, then the sum); vsqrt / vdiv correctly rounded (the f64 result rounded once: exact for f32);
//     - the flags N Z C V come from vcmpe (unordered: 0011) and cmp; the conditions as ARM's;
//     - the stack and the caller's blocks live in a 64 KB DataView; the BSS axis constants the routine reads through the GOT
//       (0x1832134 -> 0x19176e0 = X (1, 0, 0), 0x1832130 -> 0x19176f0 = Y, 0x1832184 -> 0x1917700 = Z: written by the static
//       initialiser 0x7c4708..0x7c473c) are the table AXES.
//   The blocks: a shape = p0 (x, y, z, w) +0, p1 +0x10, r +0x20. 0x167f70(a = the attack's type-3 shape, b = the hunter capsule,
//   out): 0x7dda24 -> 0x7dc9a0(a, b, &info, &t) fills info (point +0x10.., normal +0x20.., distance +0x30); meets when the
//   distance <= b.r (0x7dda88, movwls); out = point + (distance - b.r) x normal (0x7ddadc..), the w 0 (0x167fd0).
//   CHECKED against the ROM run natively on the whole executable after its static initialisers (<scratchpad>/t3/t3diff.py,
//   t3hunt.py, t3hunt2.py -> t3diff.mjs): 1537 cases (the first check's 480 -- 20 aligned, 60 + 400 random -- plus 300 with the
//   hunter's axis through the cylinder, 300 skimming a rim, 150 parallel, 100 degenerate, 200 game-sized, 7 targeted): meet / no-meet
//   agrees on all 1537 and every contact point is BIT-EXACT (max error 0, max ulp 0). Coverage (cover.mjs): 2240 of the 2392
//   transcribed instructions run; the rest are 118 sqrtf-on-NaN fallbacks (bvc after vsqrt: never for finite inputs), 21 that this
//   caller cannot reach (0x7dda24's r2 != 0 block 0x7dda84..0x7ddad0, 0x7dc9a0's r3 == 0 load 0x7dcf20) and 13 not reached
//   (0x7dd57c..0x7dd5ac: the axis-crossing path with R^2 under the 1.19e-7 epsilon).
// WHAT 0x7dc9a0 DOES (the structure; the code below is the authority):
//   - the cylinder's axis and the hunter's, normalised (0x7dc9c8..0x7dcacc);
//   - 0x806ce4(A, B, &s, &t, eps 0.001): the closest points of the two axes (lengths along each) -> C = A.p0 + s x axis (sp+0x50),
//     the plane through C across the axis (sp+0x40);
//   - axes not perpendicular (|dot| > 1.19e-7): 0x7ebfd8 -> 0x80017c, the hunter's line through that plane at P, kept when
//     |P - C| < R: the hunter's axis PASSES THROUGH the cylinder; the normal (P - C) / |P - C|, or, with P on the axis
//     (|P - C|^2 <= 1.19e-7, 0x7dd3d0), the world axis X / Y / Z least along the cylinder's (dot < 0.999), the point C + n x R,
//     and the depth from 0x7db964 / 0x80448c;
//   - else 0x806ce4 again: the hunter's nearest point beside the SIDE (s within 0.001 of neither end, 0x7dcdb4..0x7dcdc8): normal
//     from the axis point to it, point = axis point + n x R, distance = |d| - R (0x7dcf0c);
//   - near an END (0x7dd030..): the nearer end's disk (p0 or p1, 0x7dd068), 0x8069d8 (the hunter's segment to that point), then
//     three cases on the projected distances (r3 0 / 1 / 2, 0x7dd320..0x7dd380): the face (0x7dd384), or the rim through
//     0x7db964 (0x7dd5b0 / 0x7dd634).

// the ends from the placed point P (o0 already placed by the caller's frame), the axis (world up for code 4, the frame's Y row for
// code 6 -- a unit vector or the row as the frame gives it), the scale s and the record's o1 / radius. Returns { type: 3, p0, p1, r }
export function type3Shape(code, P, yRow, s, o1, radius){
  const Y = code === 4 ? [0, 1, 0] : yRow;
  const f = Math.fround;
  return { type: 3, code, p0: [f(P[0] + f(Y[0] * f(s * o1[0]))), f(P[1] + f(Y[1] * f(s * o1[0]))), f(P[2] + f(Y[2] * f(s * o1[0])))],
           p1: [f(P[0] + f(Y[0] * f(s * o1[1]))), f(P[1] + f(Y[1] * f(s * o1[1]))), f(P[2] + f(Y[2] * f(s * o1[1])))], r: f(s * radius) };
}
export const TYPE3_CODES = [4, 6];

// ---- the machine the transcription runs on ----
const HEAP = 0x10000, STACK_TOP = 0xff00, A_BLK = 0x100, B_BLK = 0x140, OUT_BLK = 0x180;
const AXES_LO = 0x19176e0;
const AXES = new DataView(new ArrayBuffer(0x30));
AXES.setFloat32(0x00, 1, true); AXES.setFloat32(0x14, 1, true); AXES.setFloat32(0x28, 1, true);
function machine(){
  const buf = new ArrayBuffer(HEAP), DV = new DataView(buf);
  const U = new Uint32Array(1), F = new Float32Array(U.buffer);
  const view = a => (a >= AXES_LO && a < AXES_LO + 0x30) ? [AXES, a - AXES_LO] : (a < HEAP - 3 ? [DV, a] : null);
  const bad = a => { throw new Error('hit-type3 ROM: an address outside the blocks: 0x' + (a >>> 0).toString(16)); };
  const M = { R: new Uint32Array(16), S: new Float32Array(32), N: 0, Z: 0, C: 0, V: 0, FP: 0, U, F, DV,
    ld32: a => { const v = view(a) || bad(a); return v[0].getUint32(v[1], true); },
    st32: (a, x) => { if (a >= HEAP - 3) bad(a); DV.setUint32(a, x >>> 0, true); },
    ld8: a => { const v = view(a) || bad(a); return v[0].getUint8(v[1]); },
    st8: (a, x) => { if (a >= HEAP) bad(a); DV.setUint8(a, x & 0xff); },
    ldf: a => { const v = view(a) || bad(a); return v[0].getFloat32(v[1], true); },
    stf: (a, x) => { if (a >= HEAP - 3) bad(a); DV.setFloat32(a, x, true); } };
  return M;
}
let MACH = null;
function putShape(M, at, C){
  for (let k = 0; k < 3; k++){ M.DV.setFloat32(at + 4 * k, C.p0[k], true); M.DV.setFloat32(at + 0x10 + 4 * k, C.p1[k], true); }
  M.DV.setFloat32(at + 0xc, 0, true); M.DV.setFloat32(at + 0x1c, 0, true);
  M.DV.setFloat32(at + 0x20, C.r, true); M.DV.setFloat32(at + 0x24, 0, true); M.DV.setFloat32(at + 0x28, 0, true); M.DV.setFloat32(at + 0x2c, 0, true);
}
// 0x167f70(attack type-3 shape A, hunter capsule cap, out): null, or { point } -- the ROM's own test, as transcribed
export function type3VsHunter(A, cap){
  const M = MACH || (MACH = machine());
  const mem = new Uint8Array(M.DV.buffer); mem.fill(0, 0, 0x200); mem.fill(0, 0xe000, HEAP);   // the blocks and the stack
  M.R.fill(0); M.S.fill(0); M.N = M.Z = M.C = M.V = M.FP = 0;
  putShape(M, A_BLK, A); putShape(M, B_BLK, cap);
  for (let k = 0; k < 4; k++) M.DV.setUint32(OUT_BLK + 4 * k, 0xeeeeeeee, true);
  M.R[0] = A_BLK; M.R[1] = B_BLK; M.R[2] = OUT_BLK; M.R[13] = STACK_TOP;
  F_167f70(M);
  if (M.R[0] !== 1) return null;
  return { point: [0, 4, 8].map(o => M.DV.getFloat32(OUT_BLK + o, true)) };
}
// the same, with the routine's raw answer (for the checks): { meets, out, info } from 0x7dc9a0 / 0x7dda24
export function type3Raw(A, cap){
  const r = type3VsHunter(A, cap), M = MACH;
  return { meets: !!r, point: r && r.point };
}


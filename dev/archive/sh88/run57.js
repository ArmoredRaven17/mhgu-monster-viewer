// ---- BASE57: Ahtal-Ka's carried object in flight (shell57) -----------------------------------------------------------------
// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole: ctor 0x42ecb8, init 0x42f070, move 0x4303a8, after-move 0x430694,
// vt+0x98 0x430714, end 0x433180; helpers 0x42fc78 (the throw's aim), 0x430160 (the launch), 0x4307e0 / 0x430e04 / 0x431244 /
// 0x4314c8 (behaviours 1 / 2 / 3 / 4), 0x432470 (the trail), 0x43252c (the spin), 0x432c58 (the throw's landing), 0x432efc
// (the turn to rest); vtable 0x1809c94, base57 is uShellEm088_sp_57's alone). Checked against the ROM run on unicorn (scratchpad
// sh88/emu57.py: the band and the engine's pure math native) by dev/shells-ahtal-check.mjs.
// THE READER 0x10c4598 (READ whole): +0x15c8 = cmn vec 0 (a pointer); ef 0..4 -> +0x15cc..+0x15dc; hit 0 / 1 -> +0x15e0 / +0x15e4;
// int 0 -> +0x15e8 (the joint), int 2 -> +0x15ec, int 1 -> +0x15f0 (the camera request's id); floats 0..8 -> +0x15f4..+0x1614;
// vec 1 -> +0x1618, vec 0 -> +0x161c, vec 2 -> +0x1620, vec 3 -> +0x1624, vec 4 -> +0x1628 (pointers).
const FLOOR57 = f(-90.0);                    // 0xc2b40000: the height every resting object is put at (0x430ba0, 0x430fe8, ...)
const REST_RATE57 = f(0.05000000074505806);  // 0x3d4ccccd: +0x16e0, the turn to rest over 20 frames (init 0x42f938 / 0x42f5b0)
const DEG_RAD57 = f(0.01745329238474369);    // 0x3c8efa35 (0x432630)
const HALF_TURN_TABLE57 = f(651.8986206054688);  // 0x4422f983 = 4096 / 2pi (0x43263c)
const ROUND57 = f(12582912.0);               // 0x4b400000 = 1.5 x 2^23: x + it leaves round(x) in the low mantissa bits
// the engine's sine table 0x190f568 (.bss, filled at boot by 0x7c4408: T[i] = sinf(f(f(i) x f(2pi)) x f(1/4096)), 4096 entries)
let SIN_TABLE57 = null;
function sinTable57(){
  if (SIN_TABLE57) return SIN_TABLE57;
  SIN_TABLE57 = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) SIN_TABLE57[i] = sinf(f(f(f(i) * f(6.2831854820251465)) * f(0.000244140625)));
  return SIN_TABLE57;
}
function params57(def, mode){
  const sh = mode.sh, F = i => f(sh.floats[i] || 0), V = i => (sh.vecs[i] || ZERO3).map(f);
  return { joint: sh.ints[0], camera: sh.ints[1], ground: sh.ints[2], fl: [0, 1, 2, 3, 4, 5, 6, 7, 8].map(F),
           vec: [0, 1, 2, 3, 4].map(V), cmn: ((def.cmn && def.cmn.vecs[0]) || ZERO3).map(f) };
}
const word57 = a => u16(s32(mla(0.5, a, RAD_TO_U16)));     // 0.5 + a x 10430.378, vcvt.s32, uxth
// 0x232404(m, words): m = m x R, R the rotation the three words make (sin / cos of each x 9.58738e-05), READ
function rotWords57(W){
  const ax = f(u16(W[0]) * U16_TO_RAD), ay = f(u16(W[1]) * U16_TO_RAD), az = f(u16(W[2]) * U16_TO_RAD);
  const sx = sinf(ax), sy = sinf(ay), sz = sinf(az), cx = cosf(ax), cy = cosf(ay), cz = cosf(az);
  const sxy = f(sx * sy);
  return [mla(f(cy * cz), sxy, sz), f(sz * cx), mls(f(f(sx * sz) * cy), sy, cz), 0,
          mls(f(sy * f(sx * cz)), sz, cy), f(cx * cz), mla(f(f(sx * cy) * cz), sy, sz), 0,
          f(sy * cx), f(-sx), f(cx * cy), 0,
          0, 0, 0, 1];
}
// 0x1ebe8(A, B): A = A x B, each element A[i][1]B[1][j] first, then + A[i][0]B[0][j], + A[i][2]B[2][j], + A[i][3]B[3][j]
function mul57(A, B){
  const o = new Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){
    let s = f(A[i * 4 + 1] * B[4 + j]);
    s = mla(s, A[i * 4], B[j]); s = mla(s, A[i * 4 + 2], B[8 + j]); s = mla(s, A[i * 4 + 3], B[12 + j]);
    o[i * 4 + j] = s;
  }
  return o;
}
// 0x430160(shell, &T, &from, &v, &a): the launch. The unit direction from `from` to T (normalised unless shorter than
// 2^-23); v turned by Z (the zero vector's word: 0), then X by its pitch atan2f(-dy, |d|_xz), then Y by its yaw
// atan2f(dx, dz) (each as the u16 word, back to radians) -> the velocity +0x1010; a turned by that yaw alone -> +0x1020
function launch57(T, from, v, a){
  let dx = f(T[0] - from[0]), dy = f(T[1] - from[1]), dz = f(T[2] - from[2]);
  const n = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
  if (!(n < SEG_EPS)){ const inv = f(f(1.0) / n); dz = f(dz * inv); dy = f(dy * inv); dx = f(dx * inv); }
  const yawW = s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16));
  const h = sqrtf(mla(f(dz * dz), dx, dx));
  const pitchW = s32(mla(0.5, atan2f(f(-dy), h), RAD_TO_U16));
  // Z by u16(0): sin 0, cos 1
  const rz = f(0 * U16_TO_RAD), sz = sinf(rz), cz = cosf(rz);
  const x1 = mls(f(v[0] * cz), v[1], sz), y1 = mla(f(v[1] * cz), v[0], sz);
  const rx = f(u16(pitchW) * U16_TO_RAD), sx = sinf(rx), cx = cosf(rx);
  const y2 = mls(f(y1 * cx), v[2], sx), z2 = mla(f(v[2] * cx), y1, sx);
  const ry = f(u16(yawW) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
  const vel = [mla(f(x1 * cy), z2, sy), y2, mls(f(z2 * cy), x1, sy)];
  const acc = [mla(f(a[0] * cy), a[2], sy), f(a[1]), mls(f(a[2] * cy), a[0], sy)];
  return { vel, acc };
}
// the rest point and words every behaviour ends on (0x42fff4..0x43013c for the throw; the drops' own below): the end point
// +0x16c0 = P + vec 3 turned by the yaw from `from` to P, y -90; the words +0x16d0 = (cmn x, atan2f(owner - end) + cmn y,
// cmn z) in degrees to u16
function restOf57(k, P, from, owner){
  const yw = u16(s32(mla(0.5, atan2f(f(P[0] - from[0]), f(P[2] - from[2])), RAD_TO_U16)));
  const r = f(yw * U16_TO_RAD), sn = sinf(r), cs = cosf(r), v3 = k.vec[3];
  const ex = f(P[0] + mla(f(v3[0] * cs), v3[2], sn)), ez = f(mls(f(v3[2] * cs), v3[0], sn) + P[2]);
  const end = [ex, FLOOR57, ez];
  const a = atan2f(f(owner[0] - ex), f(owner[2] - ez));
  const words = [u16(s32(mla(0.5, k.cmn[0], DEG_TO_U16))), u16(s32(mla(0.5, a, RAD_TO_U16)) + s32(mla(0.5, k.cmn[1], DEG_TO_U16))),
                 u16(s32(mla(0.5, k.cmn[2], DEG_TO_U16)))];
  return { end, words };
}
// 0x42fc78 placement 1 (the throw's target, +0x1650): T = the owner's target slot (block +0x1d0 + 16 x setup byte +0x10; 0
// here); the yaw from him to T, vec 1 turned by it and added; the yaw to that from him clamped into [float 2, float 3] degrees
// of his facing (the nearer bound when outside, by the far arc's midpoint); the distance max(float 4, |d|_xz) along the
// clamped yaw from him, at HIS height
function throwTarget57(k, own){
  const P = own.ownerPos, T = own.target, Py = own.ownerY >>> 0;
  const a0 = u16(s32(mla(0.5, atan2f(f(T[0] - P[0]), f(T[2] - P[2])), RAD_TO_U16)));
  const r0 = f(a0 * U16_TO_RAD), sn0 = sinf(r0), cs0 = cosf(r0), v1 = k.vec[1];
  const tx = f(T[0] + mla(f(v1[0] * cs0), v1[2], sn0)), tz = f(T[2] + mls(f(v1[2] * cs0), v1[0], sn0));
  let dx = f(tx - P[0]), dy = f(FLOOR57 - P[1]), dz = f(tz - P[2]);
  const n = sqrtf(mla(mla(f(dx * dx), dy, dy), dz, dz));
  if (!(n < SEG_EPS)){ const inv = f(f(1.0) / n); dz = f(inv * dz); dy = f(dy * inv); dx = f(inv * dx); }
  const yawW = s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16));
  const lo = s32(mla(0.5, k.fl[2], DEG_TO_U16)), hi = s32(mla(0.5, k.fl[3], DEG_TO_U16));
  const span = u16(hi - lo), rel = (yawW - Py) | 0, off = u16(rel - lo);
  let c = rel;
  if (off > span) c = ((0x8000 | (span >>> 1)) > off) ? hi : lo;
  const yaw = (c + Py) | 0;
  const d = sqrtf(mla(mla(0.0, f(P[0] - tx), f(P[0] - tx)), f(P[2] - tz), f(P[2] - tz)));
  const r = f(u16(yaw) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const reach = k.fl[4] > d ? k.fl[4] : d;
  return [f(P[0] + mla(f(cs * 0.0), sn, reach)), f(P[1] + 0.0), f(P[2] + mls(f(reach * cs), sn, 0.0))];
}
// THE INIT 0x42f070 (after the ctor's +0x1670 = identity, +0x16b0.. = 0, +0x16dc / +0x16e0 = 0, +0x1748 = 0): +0x1644 = 3600;
// the model (owner byte +0xb5f4 != 0x57: 0x10bb5d0(owner, k), the object's rModel); the placement (+0x163c = setup +0x18):
// 1 the joint int 0's world point (0xc164c) and its matrix's Euler words (0x7c3a38), 2 the object's spot in G (+0x50 + 16k)
// and its angles (+0x80 + 16k, radians), 3 the setup's +0x30 / +0x40; +0x16f0.. / +0x1700.. keep them; then the behaviour
// (+0x1640 = setup +0x1c); +0x1670 = R(words) (0x232404); delay +0x4c > 0 -> state 1 (and G slot k = 1), else state 2
function make57(state, D, req, J, own, ctx){
  const def = D.shells.shell57, mode = def.modes[req.mode];
  if (!mode) return { why: 'shell57 mode ' + req.mode + ': no files' };
  const k = params57(def, mode);
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell57', cls: def.cls, globalId: def.id, base: 'base57', mode,
              modeIndex: req.mode, action: req.action, spawnFrame: req.frame, motion: ctx.motion, obj: req.k, behaviour: req.behaviour,
              placement: req.placement, trailParam: req.trail === 2 ? 3 : req.trail === 1 ? 2 : null, k, state: 2, phase: 0, sub: 0,
              position: null, anchor: null, angles: [0, 0, 0], velocity: [0, 0, 0], gravity: [0, 0, 0], timer: f(3600.0),
              target: [0, 0, 0], end: [0, 0, 0], endWords: [0, 0, 0], lerpT: f(0.0), lerpRate: f(0.0), startWords: [0, 0, 0],
              fin: [0, 0, 0], finWords: [0, 0, 0], spin: [f(0), f(0), f(0)], base: null, floorDone: false, arrived: false,
              delay: f(req.delay || 0), events: [], start: null, effect: null, effect2: null, place: null, stop: null,
              model: null, drawn: true };
  S.base = 'base57';
  const R = D.rubble;
  if (R && req.k >= 0 && req.k <= 2) S.model = { source: R.source, part: R.models[req.k] };   // 0x10bb5d0: none for k 4
  if (req.placement === 1){
    const M = J(k.joint);
    if (!M) return { why: 'no matrix for joint ' + k.joint };
    S.position = [f(M[12]), f(M[13]), f(M[14])];                 // 0xc164c: the joint's world point
    const e = eulerOf(M);                                         // 0x7c3a38 on the joint record's matrix
    S.angles = [word57(e.x), word57(e.y), word57(e.z)];
  } else if (req.placement === 2){
    const sp = req.spot;                                          // G+0x50+16k / +0x80+16k
    S.position = sp.pos.map(f);
    S.angles = sp.angles.map(a => word57(f(a)));
  } else {
    S.position = req.pos.map(f); S.angles = req.words.map(w => w >>> 0);
  }
  S.anchor = S.position.slice();
  const pos = S.position, P = own.ownerPos;
  const b = req.behaviour;
  if (b === 1){
    S.phase = 1;
    S.target = throwTarget57(k, own);                             // 0x42fc78
    const rest = restOf57(k, S.target, P, P);                     // 0x42fff4 from the owner's x / z
    S.end = rest.end; S.endWords = rest.words;
    const L = launch57(S.target, pos, [0, 0, k.fl[0]], [0, k.vec[0][1], k.vec[0][2]]);
    S.velocity = L.vel; S.gravity = L.acc;
    S.fin = S.end.slice(); S.finWords = S.endWords.slice();
  } else if (b === 2 || b === 4){
    S.phase = 1;
    if (b === 2){
      // 0x42f4ec: the end = his block +0x40 + vec 3 turned by his facing (ldrh +0x54), y -90; the words (0x444, the yaw from
      // the end to him + cmn y, 0x16c)
      const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), v3 = k.vec[3];
      S.end = [f(P[0] + mla(f(v3[0] * cs), v3[2], sn)), FLOOR57, f(P[2] + mls(f(v3[2] * cs), v3[0], sn))];
      const a = atan2f(f(P[0] - S.end[0]), f(P[2] - S.end[2]));
      S.endWords = [0x444, u16(s32(mla(0.5, a, RAD_TO_U16)) + s32(mla(0.5, k.cmn[1], DEG_TO_U16))), 0x16c];
    } else {
      S.end = req.point.map(f);                                   // 0x42f71c: the setup's point and words
      S.endWords = req.words18.map(w => w >>> 0);
    }
    S.lerpRate = REST_RATE57;
    const d = sqrtf(mla(mla(0.0, f(pos[0] - S.end[0]), f(pos[0] - S.end[0])), f(pos[2] - S.end[2]), f(pos[2] - S.end[2])));
    const L = launch57(S.end, pos, [0, k.fl[1], f(d / k.fl[6])], [0, k.vec[4][1], 0]);
    S.velocity = L.vel; S.gravity = L.acc;
    S.fin = S.end.slice(); S.finWords = S.endWords.slice();
  } else if (b === 3){
    S.phase = 1;
    S.target = req.point.map(f);                                  // setup +0x20: joint 130's point
    S.end = S.target.slice(); S.endWords = req.words18.map(w => w >>> 0);
    S.lerpRate = REST_RATE57;
    if (req.b51 && k.fl[6] > 0){
      S.velocity = [f(f(S.target[0] - pos[0]) / k.fl[6]), f(f(S.target[1] - pos[1]) / k.fl[6]), f(f(S.target[2] - pos[2]) / k.fl[6])];
      S.gravity = [0, 0, 0];
    } else {
      const rate = req.b50 ? f(ctx.speed) : f(1.0);              // 0xb0900(owner) = [e+0x50c] when byte +0x50
      const L = launch57(S.target, pos, [0, 0, f(k.fl[0] * rate)], [0, f(rate * k.vec[0][1]), f(rate * k.vec[0][2])]);
      S.velocity = L.vel; S.gravity = L.acc;
    }
    S.fin = S.target.slice(); S.finWords = S.endWords.slice();
  } else return { why: 'shell57 behaviour ' + b + ': not his' };
  S.base1670 = rotWords57(S.angles);                              // 0x232404(+0x1670 = identity, words)
  if (S.delay > 0) S.state = 1;
  return { S };
}
// the trail (0x432470, on the first move): setup +0x54 1 -> ef 2, 2 -> ef 3, at +0x40 on the shell -> +0x1630
function trail57(D, S){
  if (S.trailParam == null) return null;
  return rockRequest(D, S.mode, S.trailParam, S.position, 'trail');
}
// 0x43252c, the throw's tumble (behaviour 1 in flight): the three degree angles +0x16b4 / +0x16b8 / +0x16b0 += vec 2 (y, z, x)
// x dt, kept in [0, 360); each a half-angle quaternion about the base matrix +0x1670's row 1 / row 2 / row 0 (sine table
// 0x190f568, index round(h x 651.899) & 0xfff, cosine +0x400), made a matrix (block 1's m00 = 1 + (yy+zz) x -2, the others
// 1 - 2(..)); words = Euler(+0x1670 x Ry x Rz x Rx)
function spin57(S, dt){
  const T = sinTable57(), v2 = S.k.vec[2];
  const wrap = a => (a < 0) ? f(a + 360.0) : (!(a < 360.0) ? f(a + -360.0) : a);
  S.spin[1] = wrap(mla(S.spin[1], v2[1], dt));
  S.spin[2] = wrap(mla(S.spin[2], v2[2], dt));
  S.spin[0] = wrap(mla(S.spin[0], v2[0], dt));
  const sc = deg => {
    const h = f(f(deg * DEG_RAD57) * 0.5), x = mla(ROUND57, h, HALF_TURN_TABLE57);
    const bits = new Uint32Array(new Float32Array([x]).buffer)[0];
    return [T[bits & 0xfff], T[(bits + 0x400) & 0xfff]];
  };
  const B = S.base1670, one = f(1.0);
  const quatMat = (axis, sn, w, first) => {
    const x = f(axis[0] * sn), y = f(axis[1] * sn), z = f(axis[2] * sn);
    const xx = f(x * x), yy = f(y * y), zz = f(z * z), wz = f(w * z), wy = f(w * y), xy = f(x * y), xz = f(x * z), yz = f(y * z), wx = f(w * x);
    const m00 = first ? mla(one, f(yy + zz), f(-2.0)) : f(one - f(f(yy + zz) + f(yy + zz)));
    return [m00, f(f(xy + wz) + f(xy + wz)), f(f(xz - wy) + f(xz - wy)), 0,
            f(f(xy - wz) + f(xy - wz)), f(one - f(f(xx + zz) + f(xx + zz))), f(f(wx + yz) + f(wx + yz)), 0,
            f(f(wy + xz) + f(wy + xz)), f(f(yz - wx) + f(yz - wx)), f(one - f(f(xx + yy) + f(xx + yy))), 0,
            0, 0, 0, one];
  };
  const [s1, c1] = sc(S.spin[1]), [s2, c2] = sc(S.spin[2]), [s3, c3] = sc(S.spin[0]);
  const M1 = quatMat([B[4], B[5], B[6]], s1, c1, true);
  const M2 = quatMat([B[8], B[9], B[10]], s2, c2, false);
  const M3 = quatMat([B[0], B[1], B[2]], s3, c3, false);
  const R = mul57(mul57(mul57(B.slice(), M1), M2), M3);
  const e = eulerOf(R);
  S.angles = [word57(e.x), word57(e.y), word57(e.z)];
}
// 0x432c58(shell, 20.0), the throw's landing: the velocity (0, float 1, |v|) turned by X = the pitch and Y = the yaw toward the
// end point +0x16c0 (y -90), the acceleration (0, vec 4 y, vec 4 z) turned by that yaw; +0x16e0 = 1 / 20
function land57(S){
  const p = S.position, k = S.k;
  let dx = f(S.end[0] - p[0]), dy = f(S.end[1] - p[1]), dz = f(S.end[2] - p[2]);
  const n = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
  if (!(n < SEG_EPS)){ const inv = f(f(1.0) / n); dz = f(dz * inv); dy = f(dy * inv); dx = f(dx * inv); }
  const yawW = s32(mla(0.5, atan2f(dx, dz), RAD_TO_U16));
  const pitchW = s32(mla(0.5, atan2f(f(-dy), sqrtf(mla(f(dz * dz), dx, dx))), RAD_TO_U16));
  const v = S.velocity, speed = sqrtf(mla(mla(f(v[1] * v[1]), v[0], v[0]), v[2], v[2]));
  const vy = k.fl[1];
  const rz = f(0 * U16_TO_RAD), sz = sinf(rz), cz = cosf(rz);
  const x1 = mls(f(cz * 0.0), vy, sz), y1 = mla(f(vy * cz), sz, 0.0);
  const rx = f(u16(pitchW) * U16_TO_RAD), sx = sinf(rx), cx = cosf(rx);
  const y2 = mls(f(y1 * cx), speed, sx), z2 = mla(f(speed * cx), y1, sx);
  const ry = f(u16(yawW) * U16_TO_RAD), sy = sinf(ry), cy = cosf(ry);
  S.velocity = [mla(f(x1 * cy), z2, sy), y2, mls(f(z2 * cy), x1, sy)];
  const a4 = k.vec[4];
  S.gravity = [mla(f(cy * 0.0), a4[2], sy), a4[1], mls(f(a4[2] * cy), sy, 0.0)];
  S.lerpRate = f(f(1.0) / f(20.0));
}
// 0x432efc, the turn to rest: t = min(t + rate x dt, 1); at 1 the words are the rest words; else each axis from its start word
// (+0x16e4..) the shorter way round toward its rest word (+0x16d0..), in degrees, by t
function turn57(S, dt){
  const t = Math.min(mla(S.lerpT, S.lerpRate, dt), f(1.0));
  S.lerpT = f(t);
  if (!(t < 1.0)){ S.angles = S.endWords.slice(); return; }
  for (let i = 0; i < 3; i++){
    const a = f(f(S.startWords[i] >>> 0) * U16_TO_DEG);
    let d = nmls(a, f(S.endWords[i] >>> 0), U16_TO_DEG);              // vnmls: end x k - a
    if (d < 0) d = f(d + 360.0); else if (!(d < 360.0)) d = f(d + -360.0);
    const far = d > 180.0, w = far ? f(-t) : f(t), span = far ? f(360.0 - d) : d;
    let r = mla(a, w, span);
    if (r < 0) r = f(r + 360.0); else if (!(r < 360.0)) r = f(r + -360.0);
    S.angles[i] = u16(s32(mla(0.5, r, DEG_TO_U16)));
  }
}
// "passed the point" (0x430a20.., 0x430c50.., 0x431098.., 0x4317e0..): the unit direction to P on the ground plane against the
// unit step from the last position (+0x1000): <= 0 once it has gone by (y terms 0 x inv)
function passedXZ57(S, P){
  const p = S.position, q = S.anchor;
  let a = f(P[0] - p[0]), b = f(P[2] - p[2]), ay = f(0.0);
  const n = sqrtf(mla(mla(0.0, a, a), b, b));
  let c = f(p[0] - q[0]), e = f(p[2] - q[2]), cy = f(0.0);
  if (n < SEG_EPS) ay = f(0.0); else { const inv = f(f(1.0) / n); b = f(b * inv); a = f(a * inv); ay = f(inv * 0.0); }
  const m = sqrtf(mla(mla(0.0, c, c), e, e));
  if (m < SEG_EPS) cy = f(0.0); else { const inv = f(f(1.0) / m); e = f(e * inv); c = f(c * inv); cy = f(inv * 0.0); }
  return !(mla(mla(f(a * c), ay, cy), b, e) > 0);
}
// the same in 3D (0x431398.., behaviour 3)
function passed3D57(S, P){
  const p = S.position, q = S.anchor;
  let dy = f(P[1] - p[1]), dx = f(P[0] - p[0]), dz = f(P[2] - p[2]);
  const n = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
  let ez = f(p[2] - q[2]), ey = f(p[1] - q[1]), ex = f(p[0] - q[0]);
  if (!(n < SEG_EPS)){ const inv = f(f(1.0) / n); dz = f(dz * inv); dy = f(dy * inv); dx = f(dx * inv); }
  const m = sqrtf(mla(mla(f(ey * ey), ex, ex), ez, ez));
  if (!(m < SEG_EPS)){ const inv = f(f(1.0) / m); ez = f(ez * inv); ey = f(ey * inv); ex = f(ex * inv); }
  return !(mla(mla(f(dx * ex), dy, ey), dz, ez) > 0);
}
// the slow-down to a slide (sub 0 of the rest phase): below `lim` on the ground plane the velocity becomes lim along it, its
// y 0 (inv x 0 x lim), the acceleration's x and z 0; then sub 1
function slide57(S, lim){
  const v = S.velocity;
  let x = v[0], z = v[2];
  const m = sqrtf(mla(mla(0.0, x, x), z, z));
  if (!(m < lim)) return;
  let y = f(0.0);
  if (!(m < SEG_EPS)){ const inv = f(f(1.0) / m); const y0 = f(inv * 0.0); z = f(z * inv); x = f(x * inv); y = f(y0 * lim); }
  S.velocity = [f(x * lim), y, f(z * lim)];
  S.gravity = [0, S.gravity[1], 0];
  S.sub = (S.sub + 1) & 0xff;
}
// the rest checks, 0x430b8c.. (shared by behaviours 1 (phase 3), 2 and 4): the floor at -90 (y, its velocity and acceleration
// held), the end point passed on the ground plane (x / z put on it, the x / z motion stopped), the turn; both done -> the
// camera request (int 1), ef 0 at +0x40 -> +0x1634, the end
function rest57(S, D, ctx, out){
  if (!S.floorDone && !(S.position[1] > FLOOR57)){
    S.position[1] = FLOOR57; S.floorDone = true; S.velocity[1] = 0; S.gravity[1] = 0;
  }
  if (!S.arrived && passedXZ57(S, S.end)){
    S.arrived = true; S.position[0] = S.end[0]; S.position[2] = S.end[2];
    S.velocity[0] = 0; S.velocity[2] = 0; S.gravity[0] = 0; S.gravity[2] = 0;
  }
  turn57(S, ctx.dt);
  if (S.arrived && S.floorDone){ landEffect57(S, D, out); end57(S, out, ctx, 0); }
}
function landEffect57(S, D, out){
  if (S.k.camera !== -1) S.events.push({ ev: 'camera', id: S.k.camera });       // 0x43ac04(shell, int 1)
  const st = rockRequest(D, S.mode, 0, S.position.slice(), 'landing');          // ef 0 -> +0x1634
  if (st){ S.effect2 = { param: 0, key: st.key }; out.started.push({ shell: S, start: st }); S.events.push({ ev: 'start', param: 0, key: st.key }); }
}
// 0x433180(shell, flag): (states 1 / 2) +0x40 = the rest point +0x1710, the words +0x1720; ef +0x1630 (the trail) stopped
// gracefully; state 0xfe, the wait 30 x 60; then G's slot k = (that point, the words in radians), state 1 (0x10ae90c,
// flag 0) -- the session's spot here (state.spots088), what the next pull of k starts from
function end57(S, out, ctx, flag){
  if ((S.state & 0xfe) === 0xfe) return;
  S.position = S.fin.slice(); S.angles = S.finWords.slice();
  S.stop = S.effect ? { param: S.effect.param, request: 0, key: S.effect.key } : null;
  S.state = 0xfe; S.timer = ENDING_FRAMES; S.drawn = false;
  out.ended.push(S);
  if (ctx && ctx.spots088 && S.obj >= 0 && S.obj <= 2)
    ctx.spots088[S.obj] = { pos: S.position.slice(), angles: S.angles.map(w => f(f(w >>> 0) * U16_TO_RAD)), from: S.id };
}
// the move 0x4303a8: state 0xfe -- the draw bit cleared, the wait (+0x1644) until 0 or both handles (+0x1630, +0x1634) are gone;
// state 2 -- +0x1000 = +0x40, the behaviour's move, then the life +0x1644 (3600) counted down, the end at 0; state 1 -- the delay
// +0x1730 counted down, then state 2 (and G slot k = 3)
function step57(S, ctx, input, D, out){
  const dt = ctx.dt;
  S.place = null;
  if (S.state === 0xfe){
    S.drawn = false;
    const T = S.timer;
    if (!(T > 0)){ S.timer = 0; S.state = 0xff; return; }
    const t = f(T - dt);
    S.timer = (0 >= t) ? 0 : t;
    const alive = (input.effectAlive ? (input.effectAlive(S, 0) || (S.effect2 && input.effectAlive(S, 1, S.effect2))) : false);
    if (!(t > 0) || !alive) S.state = 0xff;
    return;
  }
  if (S.state === 1){
    const t = f(S.delay - dt);
    S.delay = (0 >= t) ? 0 : t;
    if (!(t > 0)){ S.delay = 0; S.state = 2; }
    return;
  }
  if (S.state !== 2) return;
  S.anchor = S.position.slice();                                  // +0x1000 = +0x40
  S.events = [];
  const b = S.behaviour;
  if (b === 1) move57throw(S, D, ctx, out);
  else if (b === 2 || b === 4) move57drop(S, D, ctx, out);
  else if (b === 3) move57pull(S, D, ctx, out);
  // the owner active (0x4a0f38; always here): the life +0x1644 -- run after the behaviour's move whatever it did, so a move that
  // ended the shell has its 1800 wait counted once here and its end (a no-op past the spot write) asked again at 0
  const L = S.timer;
  if (L > 0){
    const t = f(L - dt);
    S.timer = (0 >= t) ? 0 : t;
    if (t > 0) return;
  } else S.timer = 0;
  end57(S, out, ctx, 0);
}
// behaviour 1 (0x4307e0): phase 1 -> 2 (the trail started); 2: the step, the tumble, until the target +0x1650 is passed on the
// ground plane -> 3: y = -90, the landing (0x432c58), the camera, ef 0 at +0x40, 0x4a15d4 (k, 1: not visual), the start words
// kept; 3: sub 0 the step and the slide (below 5), sub 1 the step; then the rest checks
function move57throw(S, D, ctx, out){
  if (S.phase === 1){ S.phase = 2; }
  if (S.phase === 2){
    stepFlight(S, ctx.dt);
    spin57(S, ctx.dt);
    if (!passedXZ57(S, S.target)) return;
    S.phase = 3; S.position[1] = FLOOR57;
    land57(S);
    if (S.k.camera !== -1) S.events.push({ ev: 'camera', id: S.k.camera });
    const st = rockRequest(D, S.mode, 0, S.position.slice(), 'landing');
    if (st){ S.effect2 = { param: 0, key: st.key }; out.started.push({ shell: S, start: st }); S.events.push({ ev: 'start', param: 0, key: st.key }); }
    S.startWords = S.angles.slice();
    return;
  }
  if (S.phase === 3){
    if (S.sub === 0){ stepFlight(S, ctx.dt); slide57(S, f(5.0)); }
    else if (S.sub === 1) stepFlight(S, ctx.dt);
    rest57(S, D, ctx, out);
  }
}
// behaviours 2 and 4 (0x430e04 / 0x4314c8, the same code): phase 1 -> 2 (the trail, the start words kept); sub 0 the step and the
// slide (below 15), sub 1 the step; the rest checks
function move57drop(S, D, ctx, out){
  if (S.phase === 1){ S.phase = 2; S.startWords = S.angles.slice(); }
  if (S.sub === 0){ stepFlight(S, ctx.dt); slide57(S, f(15.0)); }
  else if (S.sub === 1) stepFlight(S, ctx.dt);
  rest57(S, D, ctx, out);
}
// behaviour 3 (0x431244): phase 1 -> 2 (the trail; ef 4 at +0x40 -> +0x1638; the start words kept); the step, the turn, the end
// once the target (joint 130's point) is passed in 3D
function move57pull(S, D, ctx, out){
  if (S.phase === 1){
    S.phase = 2;
    const st = rockRequest(D, S.mode, 4, S.position.slice(), 'pull');
    if (st){ S.effect3 = { param: 4, key: st.key }; out.started.push({ shell: S, start: st }); S.events.push({ ev: 'start', param: 4, key: st.key }); }
    S.startWords = S.angles.slice();
  }
  stepFlight(S, ctx.dt);
  turn57(S, ctx.dt);
  if (passed3D57(S, S.target)) end57(S, out, ctx, 0);
}
// the request a row makes (the CU record, per caller above) from the viewer's state: k = input.carry (the Carrying control as
// e+0xcb0c -- for the pull, as e+0xd471, the pending pick: INFERRED, the viewer has one control for both), the joints
function spawn088(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  const carry = input.carry === 0 || input.carry === 1 || input.carry === 2 ? input.carry : 4;
  for (const sp of a.spawns){
    const due = sp.atStart ? fresh : (!fresh && !!state.hist && !!state.prevJoints && pass001(state, f(sp.frame)));
    if (!due) continue;
    const at = sp.atStart ? 0 : sp.frame;
    if (carry === 4){ out.refused.push({ action: a.action, shell: 'shell57', why: 'carrying nothing (e+0xcb0c = 4): 0x10aebac makes nothing' }); continue; }
    const J = state.prevJoints || ctx.J;
    let req;
    if (sp.throw){
      if (!own.ownerPos || !own.facing) { out.refused.push({ action: a.action, shell: 'shell57', why: 'no owner position / facing' }); continue; }
      if (!own.target){ out.refused.push({ action: a.action, shell: 'shell57', why: 'no target (input.rock.target): the throw aims at block +0x1d0' }); continue; }
      req = { k: carry, mode: carry, placement: 1, behaviour: 1, trail: 1 };
    } else if (sp.pull){
      const spot = ctx.spots088 && ctx.spots088[carry];
      if (!spot){ out.refused.push({ action: a.action, shell: 'shell57', why: 'no spot for object ' + carry + ' (G+0x50+16k: written by a shell57 end, 0x4332d0, or the fight -- none this session)' }); continue; }
      const M = J(130);
      if (!M){ out.refused.push({ action: a.action, shell: 'shell57', why: 'no matrix for joint 130' }); continue; }
      const e = eulerOf(M);
      req = { k: carry, mode: carry + 8, placement: 2, behaviour: 3, trail: 2, spot, b50: 1, b51: 0,
              point: [M[12], M[13], M[14]], words18: [word57(e.x), word57(e.y), word57(e.z)] };
    } else if (sp.drop === 4){
      const T = DROP_TUNE088[carry];
      req = { k: carry, mode: carry + 0x10, placement: 1, behaviour: 4, trail: 1, point: [T.v[0], -90.0, T.v[2]],
              words18: [0x444, u16(s32(mla(0.5, f(T.w[1]), DEG_TO_U16))), 0x16c] };
    } else if (sp.drop === 2){
      if (!own.ownerPos || !own.facing){ out.refused.push({ action: a.action, shell: 'shell57', why: 'no owner position / facing' }); continue; }
      req = { k: carry, mode: carry + 0xc, placement: 1, behaviour: 2, trail: 1 };
    } else continue;
    req.action = a.action; req.frame = at;
    const r = make57(state, D, req, J, own, ctx);
    if (!r.S){ out.refused.push({ action: a.action, shell: 'shell57', mode: req.mode, why: r.why }); continue; }
    r.S.start = trail57(D, r.S);                                   // the first move's trail, the same game frame
    r.S.effect = r.S.start ? { param: r.S.trailParam, key: r.S.start.key } : null;
    state.shells.push(r.S); out.spawned.push(r.S);
  }
}
// (1, 6) / (1, 0x20)'s points: Ahtal-Ka's action tune vecs 4 / 6 / 8 (the point, y replaced by -90.0) and 5 / 7 / 9 (y: the rest
// yaw in degrees) for k 0 / 1 / 2 (0x10b613c: 0x6f640(E, 4 / 6 / 8) then (E, 5 / 7 / 9); em088_00_actiontune.fup, READ)
const DROP_TUNE088 = [{ v: [-1000.0, 0.0, -2000.0], w: [5.0, 180.0, 2.0] }, { v: [-3200.0, 0.0, -3000.0], w: [5.0, 180.0, 2.0] },
                      { v: [3500.0, 0.0, -1000.0], w: [5.0, 180.0, 2.0] }];
// THE HELD PIECE'S LAST FRAME on a play (index.html carryNow): the throw's own play starts L2 M17 at 160 (above), so the viewer,
// which plays the clip from 0, shows the piece held until 160 and the shell from there; null where the play's action drops it
// at its start (em088Drops) or keeps it
export function heldUntil088(list, clip, action){
  const D = SHELL_DATA.em088_00;
  if (!action) return null;
  const a = D.actions.find(r => r.list === String(list) && r.clip === String(clip).replace(/_(start|loop)$/, '') &&
                                ((r.action[0] === action[0] && r.action[1] === action[1]) || (r.also || []).some(x => x[0] === action[0] && x[1] === action[1])));
  const sp = a && a.spawns.find(s => s.throw);
  return sp ? sp.frame : null;
}
// THE PULL'S PLAY (index.html carryNow): the object a pull brings is at its spot (G slot state 1), not carried -- so during
// L2 M19 / M37 under a pull the piece is not in his claw until the shell has brought it (the pull sets e+0xcb0c at L2 M20 /
// M38's start, 0x10c00e0)
export function pullClip088(list, clip){
  const D = SHELL_DATA.em088_00, base = String(clip).replace(/_(start|loop)$/, '');
  return D.actions.some(r => r.list === String(list) && r.clip === base && r.spawns.some(s => s.pull));
}

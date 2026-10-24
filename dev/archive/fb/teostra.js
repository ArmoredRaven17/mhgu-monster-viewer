
// ---- TEOSTRA (em027_00): uEm027_00's sp_01 0xb9 (base01: the blasts, the dust of his steps), sp_04 0xba (base04: the fire breath),
// sp_20 0xbb (BASE20: the nova's ring of fire pillars) and sp_21 0xbc (BASE21: the blast powder, the flame line, the dive's flare) ----
// READ 2026-10-18 (dev/elder-dragon-shells-spec.md 6). His class block [e+0xcac0]; the hit group his makers hand on is ctl+0x12 (or
// the block's +0xb0a), not visual. Which actions he plays: em027_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls
// (fb/chain027.py: (7, 0x2c) -> (7, 0x2e), (7, 0x2a) -> (7, 0x2d)). The makers (cengen11; fb/motqx.py the phases' clips; the status-7
// table 0xe193a8 read for the helpers' arguments):
//   (4, 0x06) L1 M7 f70: sp_01 4 (the owner's point and words).
//   (2, 0x1f) / (2, 0x20) L4 M16 f56 (0xe12f5c(e, 0 / 1)): sp_21 9 / 10 -- 10 is a LEADER (setup +0x12 = 1, +0x14 = e+0x73e8:
//     H73E8_STANDIN) and its phase 2 hands to (7, 0x2d).
//   (7, 0x03) / (7, 0x21) / (7, 0x26) L4 M6 f104 (0xe17758(e, side, kind)): sp_04 0 / 1 / 1; (7, 0x25) L4 M6: sp_21 2 / 3 / 4 at f100 /
//     115 / 130 (0xe13168: +0x12 0) and sp_04 3 at f180.
//   (7, 0x05 / 0x07 / 0x1a / 0x23 / 0x24) phase 2, L4 M10 f50 (0xe17ce8(e, sel)): sp_20 0 / 1 / 2 / 5 / 6, index 0 (the ring's leader).
//   (7, 0x0a / 0x15 / 0x16) phase 2, L2 M8 f24 (0xe18a08): sp_04 2.
//   (7, 0x2a) L4 M4 f36 and f40 (0xe18588(e, 2)): sp_21 8 (G rank; 11 below), leaders; at f84.. it hands to (7, 0x2d).
//   (7, 0x2b) / (7, 0x2c) L2 M10 / L2 M11 f44 and f48 (0xe173e0(e, side, 2)): sp_21 0 / 1 (G; 12 / 13 below), leaders; at f120.. it
//     hands to (7, 0x2e). (The same helper with kind 1, (7, 0x1e / 0x1f), makes them not leading; kind 0, (7, 0 / 1), none.)
//   The class's vt+0x208 0xe10f7c (every frame, by the motion id; fb/probe208.py): L2 M2 f52 sp_01 2, 400 x the size ahead on the
//     ground, while block +0x44 <= the ground + 1000 and e+0x1054 == G+0x49 (the monster in the loaded area: true here); L0 M5 f186
//     sp_01 1 at the owner's point while the fire aura is on (P+0x1bb not 0 / 0xff, P+0x5e08 bit 1 clear -- not held) or the action
//     is (1, 7). L0 M5 is (1, 7)'s clip and the rage roar (1, 0x1b)'s.
// THE BLAST: a leading sp_21 waits for the owner's action (7, 0x2d) / (7, 0x2e) (0x6fe88), then 60 frames later ends and makes sp_01 0
// (u 152) at its anchor; mode 10's class move makes one more at 50 frames (vt+0x154 0xe1b794, its count ctl ... +0x1630).
// NOT LISTED (named): (7, 0x1b / 0x1d / 0x1e / 0x1f / 0x20 / 0x22 / 0x28 / 0x29), (4, 0x0a) -- no EMC stream or set-action call
// issues them.
const F15P = (() => { const v = new DataView(new ArrayBuffer(4)); v.setUint32(0, 0x3783126f); return v.getFloat32(0); })();   // 0xe1ad50
const F15N = -F15P;                                                                                                           // 0xe1ad54

// sp_01's reader 0xe1ad60 (READ whole): ef 0 -> +0x15c8, ef 1 -> +0x15cc (base01's init starts both); hit 0 -> +0x15d8; +0x15ec (bfc /
// orrne over the ctor's 0): 0x80 int 0, 0x800 int 1, 4 int 2, 8 int 3; vec 0 -> +0x1608. Joint, timer, reaches: the ctor's. Past a file's
// end: -1. His modes: 0..3 flags 0 (the setup's point), 4 0x80 (the owner's ground)
function params027s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 0x80 : 0) | (I(1) !== -1 ? 0x800 : 0) | (I(2) !== -1 ? 4 : 0) | (I(3) !== -1 ? 8 : 0);
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm027_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: 1, 0x15d0: null } };
}
READERS01[0xe1ad60] = sh => params027s01(sh);
// sp_01's init 0xe1ac9c (READ whole): base01's 0x3fa498 (its effects started at that point), then +0x40 moved by the setup's halfword
// +0x3e (h): x += 400 x (h & 0x100 ? + : -)1.5625e-5 x u16(h << 8), z += 400 x (h & 4 ? + : -)1.5625e-5 x u16(h << 2), y += 0. Every
// maker but sp_21 mode 10's second blast writes h = 0; that one writes the leader's +0x1634 = e+0x73e8 (H73E8_STANDIN 0)
function post027s01(S, h){
  h &= 0xffff;
  const sx = (h & 0x100) ? F15P : F15N, sz = (h & 4) ? F15P : F15N;
  const ox = mla(f(0.0), f(sx * f(u16(h << 8))), f(400.0));
  const oz = mla(f(0.0), f(sz * f(u16(h << 2))), f(400.0));
  S.position = [f(S.position[0] + ox), f(S.position[1] + f(0.0)), f(S.position[2] + oz)];
}

// sp_04 (base04): the reader 0xe1af84 is Savage's 0xe82944 INSTRUCTION FOR INSTRUCTION (fb/sw.py over both, diffed: none) -- params04.
// Its +0x158 0xe1b128 (READ whole; base04's move calls it with flag 2 -- mode 3 only): the shell's mode (0x4a0ee4) 3 and the life
// +0x15cc below 30 -> the length times max((life - 6) / 30, 0)
function len027s04(S, len){
  if (S.modeIndex !== 3) return len;
  const T = S.timer;
  if (!(T < f(30.0))) return len;
  let q = f(f(T + f(-6.0)) / f(30.0));
  q = q !== q ? q : (q > 0 ? q : f(0.0));                         // vmax.f32 with 0.0
  return f(q * len);
}
LEN04.uShellEm027_sp_04 = (S, len) => len027s04(S, len);

// ---- BASE20 (uShellEmBase20: ctor 0x409544, init 0x40968c, step 0x409d68, move 0x409e30, end 0x409f3c; +0x150 0x409fec `bx lr`) --
// Teostra's ring of fire pillars. sp_20's reader 0xe1b2f0 (READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15cc; ints 0 / 1 / 2 -> +0x15d0 /
// +0x15d4 / +0x15d8 (the count); floats 0 / 1 / 2 -> +0x15dc (the radius) / +0x15e0 (the scatter) / +0x15e4 (the interval); vec 0 ->
// +0x15ec; +0x15e8 = float(the turn table[+0x1624]) -- 0x161f21c (0, 0x2000, .. 0xe000) when int 1 is -1, else 0x161f23c (0, 0x8000,
// 0x2000, 0xa000, 0xe000, 0x6000, 0xc000, 0x4000)
const T20_SEQ = [0, 0x2000, 0x4000, 0x6000, 0x8000, 0xa000, 0xc000, 0xe000];
const T20_ALT = [0, 0x8000, 0x2000, 0xa000, 0xe000, 0x6000, 0xc000, 0x4000];
function params020(mode, index){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const T = I(1) === -1 ? T20_SEQ : T20_ALT;
  return { i0: I(0), i1: I(1), count: I(2), radius: F(0), spread: F(1), every: F(2), vec: (sh.vecs[0] || ZERO3).map(f),
           turn: index >= 0 && index < 8 ? f(T[index]) : null };
}
// base20's init 0x40968c (READ whole): +0x1624 = setup +0x24 (the index), +0x1620 = setup +0x20 (the hit group), +0x1628 = (index == 0)
// (the leader); the reader; +0x1610.. = the target (int 0 == 0) or the zero vector; +0x15f4 = float(block +0x54); +0x1600.. = the
// owner's +0x40. The point:
//   int 0 != 0: the owner's point + (R sin a, 0, R cos a), a = u16(table + the Y word), + the scatter (sx, 0, sz) turned Z, X, Y by the
//     owner's words + vec 0 turned the same; the scatter s x (+-1.5625e-5 x u16(n << 8) / u16(n << 2)) by n = e+0x73e8 x the index;
//   int 0 == 0: the target + (x, y, -100) turned Z, X, Y; (x, y) the scatter by n (index != 0) or vec 0's x / y (index 0).
// Then ef 0 at +0x40 -> +0x162c, the hit (vt+0x140, group +0x1620), state 1. The words +0xfe8.. are not written (the base's 0)
function init020(S, own, h73e8){
  const k = S.k;
  if (k.turn == null) return 'shell20: index ' + S.index + ' past the turn table';
  if (!own.ownerPos || !own.facing) return 'shell20: no owner position / facing';
  let base;
  if (k.i0 !== 0) base = [f(0.0), f(0.0), f(0.0)];
  else { if (!own.target) return 'shell20: no target (input.rock.target)'; base = own.target.slice(); }
  S.f1610 = base;
  const K = U16_TO_RAD, O = own.ownerPos, Z0 = f(0.0);
  const rZ = f(f(u16(own.ownerZ)) * K), rX = f(f(u16(own.ownerX)) * K), rY = f(f(u16(own.ownerY)) * K);
  const sinZ = sinf(rZ), cosZ = cosf(rZ), sinX = sinf(rX), cosX = cosf(rX), sinY = sinf(rY), cosY = cosf(rY);
  const n = Math.imul(h73e8 & 0xffff, S.index) >>> 0;
  let pos;
  if (k.i0 !== 0){
    const a = u16(cvtU32(f(k.turn + f(own.ownerY >>> 0))));
    const rA = f(f(a) * K), sinA = sinf(rA), cosA = cosf(rA);
    const sx = f(k.spread * f(((n & 0x100) ? F15P : F15N) * f(u16(n << 8))));
    const sz = f(k.spread * f(((n & 4) ? F15P : F15N) * f(u16(n << 2))));
    const s16 = mla(f(sinZ * sx), cosZ, Z0);
    const s29 = mla(f(cosA * Z0), k.radius, sinA);
    const s25 = mla(f(sinX * s16), sz, cosX);
    const s27 = mls(f(cosZ * sx), sinZ, Z0);
    const [vx, vy, vz] = k.vec;
    const s17 = mls(f(vx * cosZ), vy, sinZ);
    const s23 = mla(f(vy * cosZ), vx, sinZ);
    const s22 = f(mls(f(k.radius * cosA), sinA, Z0) + O[2]);
    const s24 = mls(f(cosX * s16), sz, sinX);
    const s19 = mla(f(vz * cosX), s23, sinX);
    const s20 = mls(f(s25 * cosY), s27, sinY);
    const s30 = mla(f(s27 * cosY), sinY, s25);
    const s26 = mls(f(s23 * cosX), vz, sinX);
    const s2 = mls(f(s19 * cosY), s17, sinY);
    const s6 = mla(f(s17 * cosY), s19, sinY);
    pos = [f(f(f(O[0] + s29) + s30) + s6), f(f(f(O[1] + Z0) + s24) + s26), f(f(s22 + s20) + s2)];
  } else {
    let x0, y0;
    if (S.index !== 0){
      x0 = f(k.spread * f(((n & 0x100) ? F15P : F15N) * f(u16(n << 8))));
      y0 = f(k.spread * f(((n & 4) ? F15P : F15N) * f(u16(n << 2))));
    } else { x0 = k.vec[0]; y0 = k.vec[1]; }
    const H = f(100.0);
    const s19 = mla(f(y0 * sinZ === 0 ? y0 * cosZ : y0 * cosZ), x0, sinZ);
    const s25 = mls(f(x0 * cosZ), y0, sinZ);
    const s23 = mls(f(s19 * sinX), cosX, H);
    const s18 = mla(f(s19 * cosX), sinX, H);
    const s2 = mls(f(s23 * cosY), s25, sinY);
    const s4 = mla(f(s25 * cosY), s23, sinY);
    pos = [f(base[0] + s4), f(base[1] + s18), f(base[2] + s2)];
  }
  S.position = pos;
  S.anchor = pos.slice();
  S.angles = [0, 0, 0];
  S.clock = f(0.0);                                               // +0x15f0
  S.launch = { point: pos.slice(), index: S.index, lead: S.lead, n, base: base.slice() };
  return null;
}
// sp_20's +0x158 0xe1b418 (READ whole; the leader's move): a setup (0x409508(0x30)) id 0xbb, the shell's mode (0x4a0ee4), the owner,
// +0x10.. = +0x1610.., +0x20 = +0x1620, +0x24 = +0x1624 (the new index) -> 0x48b884 (its init at once)
function make020(st, D, m, setup, own, ctx, creator){
  const def = D.shells.shell20, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell20 mode ' + m + ': no files' };
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell20', cls: def.cls, globalId: def.id, base: 'base20', mode, modeIndex: m,
              action: setup.action || (creator ? creator.action : null), spawnFrame: setup.frame != null ? setup.frame : (creator ? creator.spawnFrame : null),
              motion: ctx.motion, state: 1, creator: creator ? creator.id : null, createdAtMove: creator ? creator.moves : null,
              index: setup.index >>> 0, group: setup.group & 0xffff, lead: (setup.index >>> 0) === 0,
              position: null, prevPosition: null, anchor: null, angles: null, clock: 0, moves: 0, launch: null, events: [],
              folder: def.folder, effect: null, start: null, place: null, stop: null, slots: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params020(mode, S.index);
  const why = init020(S, own, H73E8_STANDIN);
  if (why) return { why };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return { S };
}
// base20's end 0x409f3c (vt+0x148(flag)): not ending already -> ef 0 stopped (0x43b058(h, flag)), the hits off, vt+0x150, state 0xfe,
// the clock +0x15f0 = 0; flag 1 deletes it
function end20(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
  S.state = 0xfe; S.clock = f(0.0);
  out.ended.push(S);
}
// base20's move 0x409e30 (READ whole): the anchor = +0x40; the owner inactive -> the end (never here); the clock += the step. THE
// LEADER (+0x1628): once the clock reaches the interval x (index + 1), the index goes up and vt+0x158 makes the next pillar; at the
// count - 1-th it ends. The others: alive while a hit slot is on (+0x13ad / +0x1465: S.slots, input.hitLife), else the end
function move020(S, ctx, D, own){
  S.anchor = S.position.slice();
  S.clock = f(ctx.dt + S.clock);
  if (S.lead){
    const nx = (S.index + 1) | 0;
    if (S.clock < f(S.k.every * f(nx))) return 'keep';
    S.index = nx;
    const r = make020(ctx.shellState, D, S.modeIndex, { index: nx, group: S.group }, own, ctx, S);
    S.events.push({ ev: 'create', stepped: true, shell: 'shell20', id: 0xbb, mode: S.modeIndex, index: nx, child: r.S ? r.S.id : null, deleted: !r.S });
    if (r.S){ ctx.shellState.shells.push(r.S); ctx.out.spawned.push(r.S); } else ctx.out.refused.push({ shell: 'shell20', mode: S.modeIndex, why: r.why });
    return nx < S.k.count - 1 ? 'keep' : 'end';
  }
  return (S.slots && S.slots.some(sl => sl.on)) ? 'keep' : 'end';
}
// base20's step 0x409d68 (READ whole): the handle +0x162c dropped when its unit left states 1 / 2; state 1 the move (vt+0x154); 0xfe:
// the clock += the step, deleted past [0x162493c] x 60 or with the handle gone
function step20(S, ctx, input, D, out){
  S.events = [];
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.state === 1){
    if (move020(S, ctx, D, ctx.own001) === 'end') end20(S, out);
  } else if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    if (S.clock > ENDING_FRAMES || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}

// ---- BASE21 (uShellEmBase21: ctor 0x40a214, init 0x40a318, step 0x40a7bc, move 0x40a8b8, end 0x40aa74; +0x150 0x40ab38 `bx lr`) --
// sp_21's reader 0xe1b650 (READ whole): ef 0 / 1 -> +0x15d0 / +0x15d4; hit 0 -> +0x15d8; ints 0 / 1 / 2 -> +0x15dc (the joint) / +0x15e0
// (0: the reach) / +0x15e4 (0: the anchor's vec); floats 0..3 -> +0x15e8 (the follow) / +0x15ec (the life) / +0x15f0 (degrees on the Y
// word) / +0x15f4 (the reach); vec 0 COPIED to +0x1600.. (+0x160c = 0)
function params021(mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), i1: I(1), i2: I(2), t0: F(0), t1: F(1), deg: F(2), dist: F(3), vec: (sh.vecs[0] || ZERO3).map(f) };
}
// base21's init 0x40a318 (READ whole) and sp_21's 0xe1b60c after it (+0x1634 = setup +0x14): +0x1620 = setup +0x10 (the hit group),
// +0x1624 = setup +0x12 (THE LEADER); the reader; the point: the joint's position (0xc164c) or, joint -1, the owner unit's +0xe0.. (its
// world matrix's row 3); the anchor +0x1000 = that point; the words = the owner's block +0x50 / +0x54 / +0x58, the Y word +=
// u16(s32(0.5 + float 2 x 182.04445)); int 1 == 0: +0x40 += (0, 0, float 3) turned Z, X, Y by the words (the GOT's zero vector's x / y
// with it: 0x19176b0), sub-state 1; int 2 == 0: the anchor += vec 0 turned by the Y word; +0x1614 / +0x1618 = floats 0 / 1; ef 0 and ef 1
// at +0x40 -> +0x1628 / +0x162c; the hit; state 1
function init021(S, own, J){
  const k = S.k;
  if (!own.ownerPos || !own.facing) return 'shell21: no owner position / facing';
  let P;
  if (k.joint !== -1){ const M = J(k.joint) || J(0); if (!M) return 'shell21: no joint ' + k.joint; P = [f(M[12]), f(M[13]), f(M[14])]; }
  else P = own.ownerPos.slice();
  let anchor = P.slice();
  const A = [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];
  A[1] = (A[1] + u16(s32(mla(f(0.5), k.deg, DEG_TO_U16)))) >>> 0;
  S.sub = 0;
  if (k.i1 === 0){
    const K = U16_TO_RAD, gx = f(0.0), gy = f(0.0);
    const rZ = f(f(u16(A[2])) * K), rX = f(f(u16(A[0])) * K), rY = f(f(u16(A[1])) * K);
    const sinZ = sinf(rZ), cosZ = cosf(rZ), sinX = sinf(rX), cosX = cosf(rX), sinY = sinf(rY), cosY = cosf(rY);
    const s17 = mla(f(gy * cosZ), gx, sinZ), s19 = mls(f(gx * cosZ), gy, sinZ);
    const s28 = mla(f(k.dist * cosX), s17, sinX);
    const s4 = mla(f(s19 * cosY), s28, sinY), s0 = mls(f(s28 * cosY), s19, sinY);
    const y4 = mls(f(s17 * cosX), k.dist, sinX);
    P = [f(P[0] + s4), f(y4 + P[1]), f(s0 + P[2])];
    S.sub = 1;
  }
  if (k.i2 === 0){
    const rY = f(f(u16(A[1])) * U16_TO_RAD), sn = sinf(rY), cs = cosf(rY), [vx, vy, vz] = k.vec;
    const s4 = mla(f(vx * cs), vz, sn), s0 = mls(f(vz * cs), vx, sn);
    anchor = [f(anchor[0] + s4), f(vy + anchor[1]), f(s0 + anchor[2])];
  }
  S.position = P; S.anchor = anchor; S.angles = A;
  S.t1614 = k.t0; S.t1618 = k.t1; S.t161c = f(0.0); S.b6 = 0; S.n1630 = 0; S.b1636 = 0; S.clock = f(0.0);
  S.launch = { point: P.slice(), anchor: anchor.slice(), angles: A.slice(), sub: S.sub, lead: S.lead };
  return null;
}
function make021(st, D, m, setup, own, J, ctx){
  const def = D.shells.shell21, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell21 mode ' + m + ': no files' };
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell21', cls: def.cls, globalId: def.id, base: 'base21', mode, modeIndex: m,
              action: setup.action, spawnFrame: setup.frame, motion: ctx.motion, state: 1,
              group: setup.group & 0xffff, lead: setup.lead & 0xff, h1634: setup.h14 & 0xffff,
              position: null, prevPosition: null, anchor: null, angles: null, timer: 0, moves: 0, launch: null, events: [],
              folder: def.folder, effect: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params021(mode);
  const why = init021(S, own, J);
  if (why) return { why };
  S.prevPosition = S.position.slice();
  // ef 0 then ef 1 at +0x40 (each of his modes names one live param: 0 / 1 / 9 / 10 ef 1, the others ef 0; (999, -1) is refused)
  for (const param of [0, 1]){
    const rq = rockRequest(D, mode, param, S.position, 'flight', lists);
    if (!rq) continue;
    S.effects[param].started = true;
    if (!S.start){ S.start = rq; S.effect = { param, key: rq.key, kind: 'flight' }; }
  }
  return { S };
}
// sp_21's +0x158 0xe1b844(shell, point) (READ whole): the owner active; mode 10 -> by the count +0x1630: 0 -> sp_01 0 (h 0), 1 -> sp_01 0
// with h = +0x1634, then the count + 1; other modes -> sp_01 0 (h 0, +0x3c the shell's +0x13dc). The setup: the point, the shell's
// words +0xfe8.., +0x20.. the zero vector
function blast021(S, ctx){
  let h = 0;
  if (S.modeIndex === 10){
    const n = S.n1630; S.n1630 = n + 1;
    if (n > 1) return;
    h = n === 1 ? S.h1634 : 0;
  }
  ctx.create(S, 'shell01', { mode: 0, position: S.anchor.slice(), angles: S.angles.map(w => w >>> 0), h3e: h });
}
// base21's end 0x40aa74 (vt+0x148(flag)): not ending already -> both handles stopped (0x43b058(h, flag)), the hits off, vt+0x150, state
// 0xfe, +0x1610 = 0
function end21(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: S.effect.param, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: S.effect.param, key: S.stop.key, flag: 0 });
  S.state = 0xfe; S.clock = f(0.0);
  out.ended.push(S);
}
// base21's move 0x40a8b8 (READ whole) and sp_21's vt+0x154 0xe1b794 after it. Sub-state 0: +0x1614 -= the step; above 0 the point
// follows the joint (0xc164c), else sub-state 1 with the overshoot added to +0x1618. Sub-state 1: +0x1618 -= the step; at 0 the end
// (the leader's part skipped). THE LEADER (+0x1624): byte +6 0 -- the owner's action (7, 0x2d) or (7, 0x2e) (0x6fe88) -> 1, +0x161c = 0;
// 1 -- +0x161c += the step; at 60: 2, the end, then vt+0x158 at the anchor, +0x161c = 0. Then sp_21's own, mode 10's leader: byte 6
// 0 -> +0x161c = -10; 1 -> once (+0x1636), at +0x161c >= 50, vt+0x158 at the anchor
function move021(S, ctx, out, J){
  const step = () => {
    if (S.sub === 0){
      const T = f(S.t1614 - ctx.dt); S.t1614 = T;
      if (T > 0){ const M = J(S.k.joint) || J(0); if (M) S.position = [f(M[12]), f(M[13]), f(M[14])]; }
      else { S.sub = 1; S.t1618 = f(T + S.t1618); }
    } else if (S.sub === 1){
      const T = f(S.t1618 - ctx.dt); S.t1618 = T;
      if (!(T > 0)){ end21(S, out); return; }
    }
    if (!S.lead) return;
    if (S.b6 === 0){
      const a = ctx.ownerAction;
      if (a && a[0] === 7 && (a[1] === 0x2d || a[1] === 0x2e)){ S.b6 = 1; S.t161c = f(0.0); }
    } else if (S.b6 === 1){
      const t = f(ctx.dt + S.t161c); S.t161c = t;
      if (t < f(60.0)) return;
      S.b6 = 2;
      end21(S, out);
      blast021(S, ctx);
      S.t161c = f(0.0);
    }
  };
  step();
  if (S.lead && S.modeIndex === 10){
    if (S.b6 === 0) S.t161c = f(-10.0);
    else if (S.b6 === 1 && S.b1636 === 0 && !(S.t161c < f(50.0))){ S.b1636 = 1; blast021(S, ctx); }
  }
}
// base21's step 0x40a7bc (READ whole): both handles dropped when their units left states 1 / 2; state 1 vt+0x154; 0xfe: +0x1610 += the
// step, deleted past [0x162493c] x 60 or with both handles gone
function step21(S, ctx, input, D, out){
  S.events = [];
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, S.effect.param, S.effect)) S.effect.gone = true;
  if (S.state === 1) move021(S, ctx, out, ctx.J);
  else if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    if (S.clock > ENDING_FRAMES || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}

// the spawner (code 'em027'): rows { frame, shell, mode [, low] (the mode below G rank, 0x3a8430 < 5), lead, h14 (setup +0x14 from
// e+0x73e8), aura (vt+0x208's L0 M5 test without (1, 7)), ground (vt+0x208's L2 M2 placement and height test) }
function spawn027(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    const F = f(sp.frame);
    if (!pass001(state, F)) continue;
    const m = sp.low != null && (own.rank | 0) < 5 ? sp.low : sp.mode;
    const refuse = why => out.refused.push({ action: a.action, shell: sp.shell, mode: m, why });
    if (sp.aura){
      // 0xe114dc..0xe11518: the aura (P+0x1bb not 0 / 0xff -- the Fire Aura control; P+0x5e08 bit 1 not held: clear) or the action (1, 7)
      const v = input.fireAura027 | 0;
      if (!(v !== 0 && v !== 0xff)) continue;
    }
    if (sp.shell === 'shell01'){
      if (!own.ownerPos || !own.facing){ refuse('no owner position / facing'); continue; }
      let pos = own.ownerPos.slice();
      if (sp.ground){
        // 0xe11378..0xe11478: block +0x44 <= the ground + 1000, else none; the point 400 x the size ahead (sin / cos of block +0x54), y the
        // ground
        if (own.ground == null){ refuse('no ground (input.ground / input.rock.floorY)'); continue; }
        if (own.ownerPos[1] > f(own.ground + f(1000.0))) continue;
        const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), d = f(size001(own) * f(400.0));
        pos = [f(own.ownerPos[0] + mla(f(cs * f(0.0)), d, sn)), own.ground, f(mls(f(d * cs), sn, f(0.0)) + own.ownerPos[2])];
      }
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: pos,
        angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0], h3e: 0, action: a.action, frame: sp.frame }, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    } else if (sp.shell === 'shell04'){
      if (!own.facing){ refuse('no owner facing (input.owner.y)'); continue; }
      const S = spawn(state, D, { shell: 'shell04', mode: m, frame: sp.frame, action: a.action }, J, ctx);
      if (S){ state.shells.push(S); out.spawned.push(S); } else refuse('no matrix for joint 3');
    } else if (sp.shell === 'shell20'){
      const r = make020(state, D, m, { index: 0, group: 0, action: a.action, frame: sp.frame }, own, ctx, null);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else refuse(r.why);
    } else if (sp.shell === 'shell21'){
      const r = make021(state, D, m, { group: 0, lead: sp.lead ? 1 : 0, h14: sp.h14 ? H73E8_STANDIN : 0, action: a.action, frame: sp.frame },
                        own, J, ctx);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else refuse(r.why);
    }
  }
}
const act027 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em027', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
// vt+0x208's L2 M2 row: no action -- the clip itself (pick 'always')
const timer027 = (list, clip, spawns) => ({ action: [0, 0], code: 'em027', list, clip, pick: 'always', timer: true, spawns });
SHELL_DATA.em027_00 = {
  name: 'Teostra',
  lists: { 0: { list: 'u', pel: 'em027_00u' }, 1: { list: 'c', pel: 'em027_00c' } },
  shells: {
    // (its .shl's EffectLists: em027_00u, em027_00c)
    shell01: { id: 0xb9, cls: 'uShellEm027_sp_01', base: 'base01', reader: 0xe1ad60, folder: 'shell\\em\\em027_00_shell01',
      lists: { 0: { list: 'u', pel: 'em027_00u' }, 1: { list: 'c', pel: 'em027_00c' } },
      modes: {
@@MODES01@@
    shell04: { id: 0xba, cls: 'uShellEm027_sp_04', base: 'base04', folder: 'shell\\em\\em027_00_shell04',
      modes: {
@@MODES04@@
    shell20: { id: 0xbb, cls: 'uShellEm027_sp_20', base: 'base20', folder: 'shell\\em\\em027_00_shell20',
      lists: { 0: { list: 'u', pel: 'em027_00u' } },
      modes: {
@@MODES20@@
    shell21: { id: 0xbc, cls: 'uShellEm027_sp_21', base: 'base21', folder: 'shell\\em\\em027_00_shell21',
      lists: { 0: { list: 'u', pel: 'em027_00u' } },
      modes: {
@@MODES21@@
  },
  actions: [
    act027(4, 0x06, '1', 'Motion[7]', [{ frame: 70, shell: 'shell01', mode: 4 }]),
    act027(2, 0x1f, '4', 'Motion[16]', [{ frame: 56, shell: 'shell21', mode: 9 }]),
    act027(2, 0x20, '4', 'Motion[16]', [{ frame: 56, shell: 'shell21', mode: 10, lead: true, h14: true }]),
    act027(7, 0x03, '4', 'Motion[6]', [{ frame: 104, shell: 'shell04', mode: 0 }]),
    act027(7, 0x21, '4', 'Motion[6]', [{ frame: 104, shell: 'shell04', mode: 1 }]),
    act027(7, 0x26, '4', 'Motion[6]', [{ frame: 104, shell: 'shell04', mode: 1 }]),
    act027(7, 0x25, '4', 'Motion[6]', [{ frame: 100, shell: 'shell21', mode: 2 }, { frame: 115, shell: 'shell21', mode: 3 },
                                       { frame: 130, shell: 'shell21', mode: 4 }, { frame: 180, shell: 'shell04', mode: 3 }]),
    act027(7, 0x05, '4', 'Motion[10]', [{ frame: 50, shell: 'shell20', mode: 0 }]),
    act027(7, 0x07, '4', 'Motion[10]', [{ frame: 50, shell: 'shell20', mode: 1 }]),
    act027(7, 0x1a, '4', 'Motion[10]', [{ frame: 50, shell: 'shell20', mode: 2 }]),
    act027(7, 0x23, '4', 'Motion[10]', [{ frame: 50, shell: 'shell20', mode: 5 }]),
    act027(7, 0x24, '4', 'Motion[10]', [{ frame: 50, shell: 'shell20', mode: 6 }]),
    // (7, 0x2d) / (7, 0x2e) play L4 M10 too (0xe19134): no shell of their own -- the leaders' trigger
    act027(7, 0x2d, '4', 'Motion[10]', []),
    act027(7, 0x2e, '4', 'Motion[10]', []),
    act027(7, 0x0a, '2', 'Motion[8]', [{ frame: 24, shell: 'shell04', mode: 2 }]),
    act027(7, 0x15, '2', 'Motion[8]', [{ frame: 24, shell: 'shell04', mode: 2 }]),
    act027(7, 0x16, '2', 'Motion[8]', [{ frame: 24, shell: 'shell04', mode: 2 }]),
    act027(7, 0x2a, '4', 'Motion[4]', [{ frame: 36, shell: 'shell21', mode: 8, low: 11, lead: true }, { frame: 40, shell: 'shell21', mode: 8, low: 11, lead: true }]),
    act027(7, 0x2b, '2', 'Motion[10]', [{ frame: 44, shell: 'shell21', mode: 0, low: 12, lead: true }, { frame: 48, shell: 'shell21', mode: 0, low: 12, lead: true }]),
    act027(7, 0x2c, '2', 'Motion[11]', [{ frame: 44, shell: 'shell21', mode: 1, low: 13, lead: true }, { frame: 48, shell: 'shell21', mode: 1, low: 13, lead: true }]),
    // vt+0x208's L0 M5 f186: (1, 7) always; (1, 0x1b), the rage roar, only with the fire aura
    act027(1, 0x07, '0', 'Motion[5]', [{ frame: 186, shell: 'shell01', mode: 1 }]),
    act027(1, 0x1b, '0', 'Motion[5]', [{ frame: 186, shell: 'shell01', mode: 1, aura: true }]),
    timer027('2', 'Motion[2]', [{ frame: 52, shell: 'shell01', mode: 2, ground: true }]),
  ],
};

// ---- NAJARALA (em068_00): uEm068_00's scales (sp_36 0x126, NEW base36) and their blast (sp_01 0x125 mode 2) -------------------
// READ 2026-10-18 (dev/snake-wyvern-shells-spec.md 1). Ids 0x125 / 0x126 are immediates (the maker 0xf7a4bc, the blast 0x41a3f8).
// THE OWNER'S SIDE (uEm068_00): [e+0xcac0] = P+0x60 (0xf795ec), a block holding four slot handles +4..+0x10 and a one-frame RING
// broadcast (+0x14 mode, +0x16 an id from 0x16b4b4, +0x20.. the centre, +0x30 the radius), cleared every frame by vt+0x1dc 0xf7ad20
// (before the action main; it also drops a slot whose unit's +0xc & 7 is not 1 / 2: the viewer drops a removed shell's), and the
// two-bit retire marks P+0x1bb (slot k: bits 2k, 2k+1).
//   THE MAKER 0xf7a4bc(e, type, count): count > 4 - the occupied slots -> nothing (all or none); type 0 modes [0, 1], 1 [2, 3],
//   2 [4, 5, 6, 7], 3 [8], 4 [9] (after 0xc460c, the target choice), 5 [10]; the first `count` of the list into the empty slots
//   1..4 in order, each setup (0x418fd0, 0x1c bytes): +4 0x126, +8 the mode, +0xc the owner, +0x10 the slot index (0..3), +0x14 the
//   occupied count + 1 (its ORDER), +0x18 a u16 from 0x16b4b4 (the hit group, not visual).
//   ITS CALLERS (emulated, fb/motq068.py; the vt+0x204 jump tables decoded, fb/jt068.py): vt+0x204 0xf79d60 at the action's start --
//   (7, 0x17) type 0 x 2, (7, 0x1c) type 1 x 2, (7, 0x22) type 2 x 2, (7, 0x24) type 3 x 1, all L2 M60; and 0xf7ab50 (the RETIRE,
//   below) at the start of (7, 0x26 0x27 0x29 0x2a 0x2b 0x2c 0x2e 0x34 0x36 0x38 0x3a 0x3c 0x3d). In the actions, not while tired
//   (0x81614): (7, 0x26 / 0x3c / 0x3d) L2 M62 f32 type 4 x 1 (0xf813f4) and f68 type 5 x 1 (0xf81454); (7, 0x27) L2 M63 f104 type 0
//   x 2 (0xf82b34).
//   THE RETIRE 0xf7ab50: rank 0x3a8430 >= 5 and all four slots full -> per slot: ORDER < 3 -> its marks = 3 and the slot emptied;
//   else ORDER -= 2. Nothing else in the class writes P+0x1bb but its ctor's 0 and 0xf88000 (the clear): mark 2 is never set.
//   THE RING (fb/cenring068.py: every action of all 16 statuses, each frame literal alone; the centre poked, fb/ctrq068.py): mode 1,
//   centre the block point P+0x40, at variant 0 only (e+0xb5f5) -- (1, 0 / 0x16) L0 M50 f190 r 5000 (0xf7b794); (2, 0x1e / 0x4a) L0
//   M27 f35 and (2, 0x1f / 0x4b) L0 M28 f30 r 2500 (0xf7cba4); (2, 0x44) L0 M105 / (2, 0x45) L0 M104 f30 (0xf7d2f4) and (2, 0x46) L0
//   M115 / (2, 0x47) L0 M114 f30 (0xf7da14), phase 2, r 2500; (7, 0x18) L2 M61 f140 / (7, 0x1a) f138 r 3500 (0xf8297c); (7, 0x1e /
//   0x25) phase 2 f50 r 2500 (0xf80780) on the clip the block's +0x44 chose (0, 1 -> L2 M70, 2 -> M73, 3 -> M71: 0xf806fc); (7, 0x1f /
//   0x28) phase 2 f50 r 2500 (0xf82ce0) on L2 M74. Mode 2 (the CALL-OFF), centre the zero vector, r -1: (6, 0 / 0xa) L0 M36 f100
//   (0xf7fa28).
// base36 (READ whole 0x41900c..0x41ab84): ctor 0x41900c, init vt+0x13c 0x419218, update vt+0x24 0x419990, end vt+0x148 0x41a6c0,
// vt+0x150 0x41ab84 `bx lr`, contact vt+0x154 0x41a810; vtable 0x17e0d58. sp_36's reader 0xf88b6c: ef 0, 1, 3, 2, 4, 5, 6 ->
// +0x15c8..+0x15e0; hits 0..3 (not visual); cmn int 0 -> +0x15f4; sh int 0 -> +0x161c (the INDEX); cmn float (rank > 4 ? 1 : 0) ->
// +0x15f8 (the hunter-hit count); cmn float (rank > 4 ? 6 : 5) -> +0x160c (the ring step); cmn floats 2 / 3 / 4 -> +0x1600 (the flight's
// limit) / +0x1604 (the stuck life) / +0x1608 (the fade step); sh floats 0 / 1 -> +0x1620 (a yaw, degrees) / +0x1624 (the aimed speed);
// &sh vecs 0..2 -> +0x1628 (the offset) / +0x162c (the velocity) / +0x1630 (the gravity); sh int 1 != -1 -> +0x1618 = 1 (AIMED).
// +0x1610 / +0x1614 (the spin's base and spread) are the ctor's 0, which no reader writes.
function params068s36(def, mode, rank){
  const sh = mode.sh, c = def.cmn, g = rank > 4;
  const I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const CF = i => i < c.floats.length ? f(c.floats[i]) : f(0), V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { index: I(0), aimed: I(1) !== -1, yawDeg: F(0), speed: F(1), hits: CF(g ? 1 : 0), ringStep: CF(g ? 6 : 5),
           flightMax: CF(2), stuckMax: CF(3), fadeStep: CF(4), spinBase: f(0.0), spinSpread: f(0.0), vec: V(0), vel: V(1), grav: V(2) };
}
// the seven handles +0x1678..+0x1690 by the param each holds: ef 0 (u 0, the flight) / ef 1 (u 3) at the init, ef 3 (+0x15d0, u 1) at
// the landing, ef 4 (+0x15d8, (0, -1)) at a type-2 contact, ef 5 (+0x15dc, u 30) at the ring, ef 6 (+0x15e0, u 2) at the fade's / the
// flight's end; +0x1684 is never started
const H36 = ['h1678', 'h167c', 'h1680', 'h1684', 'h1688', 'h168c', 'h1690'];
// an effect param started at +0x40 (or the contact) into a named handle (0x40a54 / 0x4a10c8 / 0x4a11e4; no rotation override)
function start36(S, D, param, slot, point, out){
  const st = rockRequest(D, S.mode, param, point.slice(), slot);
  if (!st){ S.log.push({ ev: 'refused', param, move: S.moves }); return; }
  st.slot = slot;
  S.live[slot] = true;
  if (slot === 'h1678') S.start = st; else out.started.push({ shell: S, start: st });
  S.log.push({ ev: 'start', param, key: st.key, slot, move: S.moves, start: st });
}
// 0x43b058(S, h, mode): a live handle stopped -- 0 gracefully, 1 at once (the field keeps the handle: only the update's hygiene drops it)
function stop36(S, slot, mode){
  if (!S.live[slot]) return;
  S.stops.push({ slot: slot === 'h1678' ? 'start' : slot, mode });
  S.log.push({ ev: 'stop', slot, mode, move: S.moves });
}
// the init 0x419218 (0x43a850 and the owner unit's byte +0x50 bit 0, which the viewer passes): +0x40 = the owner's +0x40; +0xfe8.. =
// the block's words P+0x50.. (X, Y, Z); +0x1646 / +0x166c / +0x1640 = setup +0x18 / +0x14 / +0x10; the count byte +0x1644 = u8(+0x15f8);
// +0x1638 = the Z word; +0x1000 = +0x40; then +0x40 += vec 0 turned by the words Z, X, Y (0x419348..0x419424: turnByWords). AIMED
// (+0x1618): the velocity = (block +0x1d0 - +0x40), normalised when its length reaches 2^-23 (0x419640), times +0x1624; the gravity the
// GOT vector at 0x419980. Else the velocity = vec 1, the gravity = vec 2, the Y word += int(0.5 + +0x1620 x 182.04) (u16, uxtah) and the
// velocity turned Z, X, Y by the words (0x4194c4..0x419634). Hits (not visual); +0x1648 = 0, +0x164a = 0xffff, +0x1650.. the GOT
// vector, +0x165c = 0, +0x1660 = -1.0, +0x1664 = 0, bytes +0x1645 / +0x1668 / +0x1669 = 0; ef 0 at +0x40 -> +0x1678, ef 1 -> +0x167c;
// 0x8a4b88 -> +0x16a0 (not visual); the spin +0x1670 = +0x1610 + u16 rand x +0x1614 x 2^-16 = 0; state 1, +0x1634 = 0
function make068s36(state, D, m, own, ctx, out, slot, order, action, frame){
  const def = D.shells.shell36, mode = def.modes[m];
  if (!mode) return { why: 'shell36 mode ' + m + ': no files in this arc' };
  if (!own.ownerPos) return { why: 'no owner position (input.ownerPos)' };
  const k = params068s36(def, mode, own.rank), P = own.ownerPos;
  const W = [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];
  const t = turnByWords(k.vec, W.map(u16));
  const position = [f(P[0] + t[0]), f(P[1] + t[1]), f(P[2] + t[2])];
  let velocity, gravity;
  if (k.aimed){
    if (!own.target) return { why: 'no target (input.rock.target): an aimed scale (mode ' + m + ')' };
    const T = own.target, dx = f(T[0] - position[0]), dy = f(T[1] - position[1]), dz = f(T[2] - position[2]);
    const n = sqrtf(mla(mla(f(dy * dy), dx, dx), dz, dz));
    let v = [dx, dy, dz];
    if (!(n < f(1.1920928955078125e-07))){ const inv = f(f(1.0) / n); v = [f(inv * dx), f(inv * dy), f(inv * dz)]; }
    velocity = [f(v[0] * k.speed), f(k.speed * v[1]), f(k.speed * v[2])];
    gravity = ZERO3.slice();
  } else {
    W[1] = (W[1] + u16(s32(mla(0.5, k.yawDeg, DEG_TO_U16)))) >>> 0;
    velocity = turnByWords(k.vel, W.map(u16));
    gravity = k.grav.slice();
  }
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell36', cls: def.cls, globalId: def.id, base: 'base36', mode,
              modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1, k, slot, order, counter: s32(k.hits) & 0xff,
              position, anchor: position.slice(), velocity, gravity, angles: W, z0: u16(W[2]), t: f(0.0), timer: f(0.0),
              stored: 0, centre: ZERO3.slice(), radius: f(-1.0), delay: f(0.0), boom: 0, moves: 0, events: [], stops: [], log: [],
              live: {}, handles: {}, start: null, effect: null, place: null, stop: null };
  S.launch = { position: position.slice(), velocity: velocity.slice(), gravity: gravity.slice(), angles: W.slice(), timer: S.t };
  start36(S, D, 0, 'h1678', position, out);
  start36(S, D, 1, 'h167c', position, out);
  return { S };
}
// the end 0x41a6c0(S, flag) (unless ending): flag 1 -> all seven handles stopped at once, flag 0 -> +0x1678 / +0x167c / +0x1680 / +0x168c
// gracefully (not +0x1684 / +0x1688 / +0x1690); 0x4a1de4 (hit side), vt+0x150 (`bx lr`), state 0xfe, +0x1634 = 0; flag 1 -> vt+0x40,
// +4 |= 0xff (deleted)
function end36(S, flag, out){
  if ((S.state & 0xfe) === 0xfe){ if (flag === 1) S.state = 0xff; return; }
  for (const h of flag === 1 ? H36 : ['h1678', 'h167c', 'h1680', 'h168c']) stop36(S, h, flag === 1 ? 1 : 0);
  S.state = 0xfe; S.t = f(0.0); S.timer = S.t;
  out.ended.push(S);
  if (flag === 1) S.state = 0xff;
}
// the contact vt+0x154 0x41a810(S, point, result, type) from the flight's query: type 0 -> +0x40 x / z = the point's (y kept), the
// bearing word of the normal (result +0x20 / +0x28: int(atan2 x 10430.378 + 0.5), u16) back to radians, velocity (10 sin, -5, 10 cos)
// (each as its vmla / vmls with a 0.0 term), gravity (0, -0.1, 0); state stays 1. Type 1 (the landing) -> state 2, +0x1634 = 0, +0x40 =
// the point, Z = +0x1638, Y += int(0.5 + mode x 80.0 x 182.04) (u16), vt+0xc8, the body / hit registrations (not visual), +0x1645 =
// result byte +3; +0x1678 and +0x167c stopped at once, ef 3 (u 1) at the point -> +0x1680, +0x167c stopped gracefully. Type 2 (a
// hunter's hit -- never here) -> ef 4 at the point -> +0x1688
function contact36(S, D, hit, out){
  const p = hit.point, type = hit.type;
  if (type === 0){
    S.position = [p[0], S.position[1], p[2]];
    const w = u16(s32(mla(0.5, atan2f(hit.normal[0], hit.normal[2]), RAD_TO_U16)));
    const a = f(f(w) * U16_TO_RAD), sn = sinf(a), cs = cosf(a);
    S.velocity = [mla(f(cs * 0.0), sn, f(10.0)), f(-5.0), mls(f(cs * f(10.0)), sn, 0.0)];
    S.gravity = [0, f(-0.10000000149011612), 0];
    S.log.push({ ev: 'bounce', move: S.moves });
  } else if (type === 1){
    S.state = 2; S.t = f(0.0);
    S.position = p.slice();
    S.angles = [S.angles[0], u16(S.angles[1] + s32(mla(0.5, f(f(S.modeIndex) * f(80.0)), DEG_TO_U16))), S.z0];
    stop36(S, 'h1678', 1); stop36(S, 'h167c', 1);
    start36(S, D, 3, 'h1680', p, out);
    stop36(S, 'h167c', 0);
  } else if (type === 2) start36(S, D, 4, 'h1688', p, out);
}
// state 1, the flight 0x419c68: +0x1634 += dt; at +0x1600 (600) -> the end (1), then ef 6 (u 2) at +0x40 -> +0x1690. Else Z +=
// int(0.5 + dt x 77.0 x 182.04) (u16); +0x1000 = +0x40; 0x539224 (stepFlight); the query 0x43ac6c / 0x43ac8c (collide, mask 0x30) ->
// on a hit vt+0x154; then +0x167c live -> Z += u16(int(0.5 + +0x1670 x dt x 182.04)) (uxtah; +0x1670 is 0)
function flight36(S, D, ctx, out){
  S.t = f(S.t + ctx.dt);
  if (S.t >= S.k.flightMax){
    end36(S, 1, out);
    start36(S, D, 6, 'h1690', S.position, out);
    return;
  }
  S.angles[2] = u16(S.angles[2] + s32(mla(0.5, f(ctx.dt * f(77.0)), DEG_TO_U16)));
  S.anchor = S.position.slice();
  stepFlight(S, ctx.dt);
  const hit = collide(S, null, ctx.stage);
  if (hit) contact36(S, D, hit, out);
  if (S.live.h167c) S.angles[2] = (S.angles[2] + u16(s32(mla(0.5, f(S.k.spinBase * ctx.dt), DEG_TO_U16)))) >>> 0;
}
// the owner block's slot holding a state-2 shell with this one's slot index (0x419fe4..0x41a098: [+0xcac0]+4..+0x10, byte +4 == 2,
// +0x1640 equal) -- itself, while it holds its slot
function slotMate36(st, S){
  for (const h of st.slots068 || []) if (h && h.state === 2 && h.slot === S.slot) return h;
  return null;
}
const marks068 = (st, slot) => ((st.marks068 || 0) >> (2 * slot)) & 3;
// 0xf88000(e, slot): the slot's two marks cleared
function clearMarks068(st, slot){ st.marks068 = (st.marks068 || 0) & ~(3 << (2 * slot)); }
// state 2, stuck 0x419ea0: +0x1634 += dt; past +0x1604 (7200) -> state 4, +0x1634 = +0x1608 x float(sh int 0). The stored mode +0x1648
// zero -> the block's ring copied (mode, id, centre, +0x165c = 0, radius) when its +0x14 is set; the owner's area byte +0x1054 against
// the shell's (equal here); stored 1 -> the slot mate (none: nothing more) -- radius < 0 or |centre - its +0x40|^2 <= radius^2 -> THE
// RING: +0x1664 = +0x160c x (its slot + 1), +0x1680 stopped at once, ef 5 (u 30) at +0x40 -> +0x168c, state 3; outside -> the stored
// ring reset (0, 0xffff, the GOT vector, 0, -1.0). Stored 2 -> the count +0x1644 = 0. Then (0x41a238) the count: a hunter's hit
// (+0x151e != 0xff, never here) takes one; the count 0 -> state 4, +0x1634 = float(sh int 0); the marks == 3 -> the same
function stuck36(S, D, ctx, st, out){
  const k = S.k;
  S.t = f(S.t + ctx.dt);
  if (S.t > k.stuckMax){ S.state = 4; S.t = f(k.fadeStep * f(k.index)); return; }
  if (S.stored === 0){
    const B = st.ring068;
    if (B && B.mode){ S.stored = B.mode; S.ringId = B.id; S.centre = B.centre.slice(); S.radius = B.radius; S.log.push({ ev: 'heard', mode: B.mode, move: S.moves }); }
    if (S.stored === 1){
      const me = slotMate36(st, S);
      if (me){
        let inside = S.radius < 0;
        if (!inside){
          const dx = f(S.centre[0] - me.position[0]), dy = f(S.centre[1] - me.position[1]), dz = f(S.centre[2] - me.position[2]);
          inside = mla(mla(f(dy * dy), dx, dx), dz, dz) <= f(S.radius * S.radius);
        }
        if (inside){
          S.delay = f(k.ringStep * f(me.slot + 1));
          stop36(S, 'h1680', 1);
          start36(S, D, 5, 'h168c', S.position, out);
          S.state = 3;
        } else { S.stored = 0; S.ringId = 0xffff; S.centre = ZERO3.slice(); S.radius = f(-1.0); }
      }
    } else if (S.stored === 2) S.counter = 0;
  }
  if (S.counter === 0 || marks068(st, S.slot) === 3){ S.state = 4; S.t = f(k.index); }
}
// state 3, ringing 0x41a2c8: (a hunter's hit takes a count); stored 2 -> the count 0; the delay +0x1664 > 0 -> less dt floored at 0,
// still > 0 -> the check; else 0 and, the count left and the stored mode 1 / 3, the BLAST armed (+0x1668). The check: armed or the marks
// == 2 -> the marks cleared, +0x15c0 = 1, sp_01 (0x125) mode 2 at +0x40 with the words (+0x30.., the setup's +0x20 the GOT vector, +0x3c
// 0xffff), +0x1669 = 1, the end (0); the marks == 3 or the count 0 -> state 4, +0x1634 = float(sh int 0)
function ringing36(S, D, ctx, st, out){
  if (S.stored === 2) S.counter = 0;
  let check = false;
  if (S.delay > 0){
    const d = f(S.delay - ctx.dt);
    S.delay = f(0.0) >= d ? f(0.0) : d;
    if (d > 0) check = true;
  } else S.delay = f(0.0);
  if (!check && S.counter !== 0 && (S.stored | 2) !== 2) S.boom = 1;
  const mk = marks068(st, S.slot);
  if (S.boom || mk === 2){
    clearMarks068(st, S.slot);
    if (ctx.create) ctx.create(S, 'shell01', { mode: 2, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) }, S.log);
    S.log.push({ ev: 'blast', move: S.moves });
    end36(S, 0, out);
    return;
  }
  if (mk === 3 || S.counter === 0){ S.state = 4; S.t = f(S.k.index); }
}
// state 4, the fade 0x41a504: +0x1634 > 0 -> less dt, still > 0 -> wait; else 0, the marks cleared, +0x1669 = 0, every other slot's
// shell whose ORDER is not this one's SLOT INDEX (0x41a57c loads +0x1640, the slot, for the compare -- as read) and not 0 has its ORDER
// less one; ef 6 (u 2) at +0x40 -> +0x1690; the end (0)
function fade36(S, D, ctx, st, out){
  if (S.t > 0){ const t = f(S.t - ctx.dt); if (t > 0){ S.t = t; return; } }
  S.t = f(0.0);
  clearMarks068(st, S.slot);
  for (const h of st.slots068 || []) if (h && h.order !== S.slot && h.order !== 0) h.order--;
  start36(S, D, 6, 'h1690', S.position, out);
  end36(S, 0, out);
}
// the update 0x419990: 0x4a1698 (hit side); the seven handles' hygiene (a unit out of states 1 / 2 -> 0); the owner check 0x7fe88 (here
// always there); states 1..4; 0xfe: +0x1634 += dt, past [0x162493c] x 60 (1800) -> deleted, all seven handles 0 -> +4 = 0xff, deleted
function step36(S, ctx, input, D, out){
  S.moves++; S.stops = [];
  const ea = input.effectAlive;
  for (const h of H36) if (S.live[h] && ea && !ea(S, h === 'h1678' ? 0 : 1, h === 'h1678' ? undefined : { request: S.handles && S.handles[h] })) S.live[h] = false;
  const st = ctx.shellState;
  if (S.state === 0xfe){
    S.t = f(S.t + ctx.dt); S.timer = S.t;
    if (S.t > ENDING_FRAMES){ S.state = 0xff; return; }
    if (!H36.some(h => S.live[h])) S.state = 0xff;
    return;
  }
  if (S.state === 1) flight36(S, D, ctx, out);
  else if (S.state === 2) stuck36(S, D, ctx, st, out);
  else if (S.state === 3) ringing36(S, D, ctx, st, out);
  else if (S.state === 4) fade36(S, D, ctx, st, out);
  S.timer = S.t;
}
// sp_01's reader 0xf889b0 (READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15d8; +0x15ec (bfc / orrne over the ctor's 0): 4 int 0, 8 int 1;
// &vec 0 -> +0x1608. The timer +0x15f0 the ctor's 0: mode 2 lives while its hit slot does (30 + 20)
function params068s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0);
  return { flags, joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm068_sp_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xf889b0] = sh => params068s01(sh);
// the owner's vt+0x1dc 0xf7ad20, every frame before the action: the ring cleared (+0x14 = 0, +0x16 = 0, the centre the GOT vector,
// +0x30 = -1.0) and a slot whose shell is gone emptied
function frame068(state){
  state.ring068 = null;
  if (state.slots068) for (let i = 0; i < 4; i++) if (state.slots068[i] && state.slots068[i].state === 0xff) state.slots068[i] = null;
}
// the maker 0xf7a4bc (above)
const TYPES068 = [[0, 1], [2, 3], [4, 5, 6, 7], [8], [9], [10]];
function maker068(state, D, type, count, ctx, out, action, frame){
  const sl = state.slots068 || (state.slots068 = [null, null, null, null]);
  if (count > sl.filter(h => !h).length) return;
  const modes = TYPES068[type];
  let made = 0;
  for (let i = 0; i < 4 && made < count; i++){
    if (sl[i]) continue;
    const order = 1 + sl.filter(h => h).length;
    const r = make068s36(state, D, modes[made], ctx.own001, ctx, out, i, order, action, frame);
    made++;
    if (!r.S){ out.refused.push({ action, shell: 'shell36', mode: modes[made - 1], why: r.why }); continue; }
    sl[i] = r.S;
    state.shells.push(r.S); out.spawned.push(r.S);
  }
}
// the retire 0xf7ab50 (above)
function retire068(state, own){
  const sl = state.slots068;
  if (!sl || own.rank < 5 || sl.some(h => !h)) return;
  for (let i = 0; i < 4; i++){
    if (sl[i].order < 3){ state.marks068 = ((state.marks068 || 0) & ~(3 << (2 * i))) | (3 << (2 * i)); sl[i] = null; }
    else sl[i].order -= 2;
  }
}
// the spawners (code 'em068'): `start` the action start's maker / retire (vt+0x204, before the action's first update); rows { frame,
// type, count } (not while tired) and { frame, ring: [mode, radius] } by pass001 on the previous pose
function spawn068(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  if (fresh){
    if (a.retire068) retire068(state, own);
    if (a.start068) maker068(state, D, a.start068[0], a.start068[1], ctx, out, a.action, null);
    return;
  }
  if (!state.hist || !state.prevJoints) return;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.ring){
      if (sp.ring[0] === 1 && !own.ownerPos){ out.refused.push({ action: a.action, why: 'the ring: no owner position (input.ownerPos)' }); continue; }
      state.ring068 = { mode: sp.ring[0], id: sp.ring[0] === 2 ? 0xffff : 0x1234, radius: f(sp.ring[1]),
                        centre: sp.ring[0] === 1 ? own.ownerPos.slice() : ZERO3.slice() };
      continue;
    }
    if (ctx.tired) continue;
    maker068(state, D, sp.type, sp.count, ctx, out, a.action, sp.frame);
  }
}
const act068 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em068', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
SHELL_DATA.em068_00 = {
  name: 'Najarala',
  lists: { 0: { list: 'u', pel: 'em068_00u' } },
  shells: {
    // shell01: the hit volumes (modes 0 / 1 (999, -1): (7, 0x18 / 0x1a) L2 M61 f140 / f138 -- NOT BUILT, they draw nothing) and the
    // scale's blast (mode 2, u 31)
    shell01: { id: 0x125, cls: 'uShellEm068_sp_01', base: 'base01', reader: 0xf889b0, folder: 'shell\\em\\em068_00_shell01', modes: {
      0: m057(1.0, [[999, -1]], [0], [-1, -1], [], [[0.0, 0.0, 1100.0]]),
      1: m057(1.0, [[999, -1]], [1], [-1, -1], [], [[0.0, 0.0, 1100.0]]),
      2: m057(1.0, [[0, 31]], [2], [-1, -1], [], [[0.0, 0.0, 0.0]]),
    }, hitdata: [[0, 10], [0, 10], [30, 20]] },
    // shell36: the scales (u 0 flying, u 3 beside it, u 1 stuck, u 30 ringing, u 2 at the fade's end); cmn: em068_00_36's ShellCmnParam
    shell36: { id: 0x126, cls: 'uShellEm068_sp_36', base: 'base36', reader: 0xf88b6c, folder: 'shell\\em\\em068_00_shell36', modes: {
      0: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [0, -1], [4.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.0, 43.5], [0.0, -0.10000000149011612, 0.0]]),
      1: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [1, -1], [32.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.0, 42.5], [0.0, -0.10000000149011612, 0.0]]),
      2: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [0, -1], [-7.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.5, 25.0], [0.0, -0.10000000149011612, 0.0]]),
      3: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [1, -1], [42.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.5, 25.0], [0.0, -0.10000000149011612, 0.0]]),
      4: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [0, -1], [-15.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.5, 26.5], [0.0, -0.10000000149011612, 0.0]]),
      5: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [1, -1], [-7.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.5, 25.0], [0.0, -0.10000000149011612, 0.0]]),
      6: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [2, -1], [42.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.5, 25.0], [0.0, -0.10000000149011612, 0.0]]),
      7: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [3, -1], [60.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.5, 25.5], [0.0, -0.10000000149011612, 0.0]]),
      8: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [0, -1], [-7.0, 0.0], [[-377.0, 434.0, 486.0], [0.0, -8.5, 25.0], [0.0, -0.10000000149011612, 0.0]]),
      9: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [0, 0], [0.0, 25.0], [[407.6000061035156, 226.0, 638.9000244140625], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      10: m057(1.0, [[0, 0], [0, 3], [0, 2], [0, 1], [0, -1], [0, 30], [0, 2]], [2, 0, 1, 0], [1, 0], [0.0, 25.0], [[-179.0, 429.0, 1211.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
    }, cmn: { ints: [0], floats: [1.0, 2.0, 600.0, 7200.0, 30.0, 30.0, 18.0], vecs: [] }, hitdata: [[20, 99], [2, 20], [0, 99]] },
  },
  actions: [
    // the throws: at the action's start (vt+0x204) and in the actions (not tired)
    act068(7, 0x17, '2', 'Motion[60]', [], { start068: [0, 2] }),
    act068(7, 0x1c, '2', 'Motion[60]', [], { start068: [1, 2] }),
    act068(7, 0x22, '2', 'Motion[60]', [], { start068: [2, 2] }),
    act068(7, 0x24, '2', 'Motion[60]', [], { start068: [3, 1] }),
    act068(7, 0x26, '2', 'Motion[62]', [{ frame: 32, type: 4, count: 1 }, { frame: 68, type: 5, count: 1 }], { retire068: true, also: [[7, 0x3c], [7, 0x3d]] }),
    act068(7, 0x27, '2', 'Motion[63]', [{ frame: 104, type: 0, count: 2 }], { retire068: true }),
    // the rings (mode 1, the radius) and the call-off (mode 2)
    act068(1, 0x00, '0', 'Motion[50]', [{ frame: 190, ring: [1, 5000.0] }], { also: [[1, 0x16]] }),
    act068(2, 0x1e, '0', 'Motion[27]', [{ frame: 35, ring: [1, 2500.0] }], { also: [[2, 0x4a]] }),
    act068(2, 0x1f, '0', 'Motion[28]', [{ frame: 30, ring: [1, 2500.0] }], { also: [[2, 0x4b]] }),
    act068(2, 0x44, '0', 'Motion[105]', [{ frame: 30, ring: [1, 2500.0] }]),
    act068(2, 0x45, '0', 'Motion[104]', [{ frame: 30, ring: [1, 2500.0] }]),
    act068(2, 0x46, '0', 'Motion[115]', [{ frame: 30, ring: [1, 2500.0] }]),
    act068(2, 0x47, '0', 'Motion[114]', [{ frame: 30, ring: [1, 2500.0] }]),
    act068(7, 0x18, '2', 'Motion[61]', [{ frame: 140, ring: [1, 3500.0] }]),
    act068(7, 0x1a, '2', 'Motion[61]', [{ frame: 138, ring: [1, 3500.0] }]),
    act068(7, 0x1e, '2', 'Motion[70]', [{ frame: 50, ring: [1, 2500.0] }], { also: [[7, 0x25]] }),
    act068(7, 0x1e, '2', 'Motion[73]', [{ frame: 50, ring: [1, 2500.0] }], { also: [[7, 0x25]] }),
    act068(7, 0x1e, '2', 'Motion[71]', [{ frame: 50, ring: [1, 2500.0] }], { also: [[7, 0x25]] }),
    act068(7, 0x1f, '2', 'Motion[74]', [{ frame: 50, ring: [1, 2500.0] }], { also: [[7, 0x28]] }),
    act068(6, 0x00, '0', 'Motion[36]', [{ frame: 100, ring: [2, -1.0] }], { also: [[6, 0x0a]] }),
  ],
};

// ---- BRACHYDIOS (em063_00) / RAGING BRACHYDIOS (em063_05): uEm063_00, one class (band 0xf35038..0xf47ca0; e+0xb5f5 0 / 5) ---------
// READ 2026-10-25 (shells lane helper; <archive> gapQ/RESULT.md). THE IDS (vt+0x158 0xf35108, immediates): variant 0 -> e+0xcac0 0x110
// uShellEm063_sp_01, e+0xcac4 0x111 sp_11, e+0xcac8 0x112 sp_35; variant 5 -> 0x113 / 0x114 / 0x115 (any other variant: none). Bases by
// vtable: sp_01 0x17da2d8 (base01's init 0x3fa498; reader +0x14c 0xf4815c), sp_11 0x17da448 (base11's 0x402fd8; reader 0xf48350,
// +0x150 0xf489dc, +0x168 0xf484d8), sp_35 0x17da5bc (base35's vtable 0x175169c, +0x13c 0x418888; reader 0xf48bb4, +0x154 0xf48ca0) --
// the table's setup DTIs agree (cSetupParamEmBase01 / 01 / 35). The arcs carry exactly these three folders each.
//   THE MAKERS (every 0x48b884 in the band: 8 sites, all read): the fist 0xf458ec(e, slot, kind, &point, &normal, attr, b2c) -- kind 1 a
// POOL (sp_35 0 / Raging enraged 4), kind 4 an EXPLOSION (sp_01 3; 9 on L2 M22 / M23; Raging enraged 14), kind 3 sp_01 2 (no caller
// passes it: the 23 call sites store -1 or 1), kind < 0 computed (Raging: the slot Red ? 4 : 1; else the slot's arm level > 0 ? (enraged
// ? 4 : 1) : 0), and a Raging slot that is Red is 4 whatever was passed; the both-fists 0xf3b7e8(e, slot, kind) -- the same probe, kind 1
// a pool (+5 up), 3 sp_01 5 / 18, 4 sp_01 4 / 17 (computed: 4 -> 3; Raging: this slot Red -> 3, both arms Red -> 4); the big slam's pool
// 0xf3e984 (sp_35 1 at the ground 400 / 550 x size ahead); the slime lines (sp_11 0 / 1 at the owner); the eruption 0xf46234 (below).
//   NO MAKER: sp_01 modes 2 (kind 3), 8, 10..13, 15, 16, 19, 20, 22 (files in the arc, no create names them: negative with the census
// of the 8 sites as its control); Raging's sp_01 8 names u 21, which em063_05u lacks.
const DTPA063 = [0, 2, 2, 1, 2, 2, 2, 2, 3, 2, 2, 2];   // _dtbparts.dtp array A (both arcs, dtp.py EXACT): bytes 1 / 2 the head, 5 / 6 the arms

// sp_01's reader 0xf4815c (READ whole, ..0xf48254): ef 0 -> +0x15c8; HitParam int 0 -> +0x15d8 (slot 0); sh int 0 -> the joint +0x15e4;
// +0x15ec (bfc / orrne over the ctor's 0): bit 2 = int 2 != -1 (the ground snap), bit 3 = int 3 (the ground angles), bit 0 = int 4 (at
// the joint); int 1 -> +0x15e8 (a camera id, read only under flag 0x40, which this reader never sets); &vec 0 -> +0x1608. The timer
// +0x15f0 stays the ctor's 0: each lives while its hit slot is on (move011's T <= 0 arm; input.hitLife; the HDS pairs below).
function params063s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : 0;
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const why = !sh ? 'uShellEm063_sp_01: a mode with no files in this arc' : null;
  return { flags: (I(4) !== -1 ? 1 : 0) | (I(2) !== -1 ? 4 : 0) | (I(3) !== -1 ? 8 : 0), joint: I(0), i15e8: I(1), timer: f(0.0),
           f1600: f(0.0), f15fc: f(1.0), vec: V(0), up: f(500.0), down: f(500.0), maxH: f(900.0), why,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0xf4815c] = sh => params063s01(sh);

// sp_11's reader 0xf48350 (READ whole, ..0xf484cc): count +0x1658 = int 0 (>= 1), the times +0x1654[k] = float k; +0x1664 = float 12
// and +0x1668 = int 1 (+0x150 0xf489dc: after base11's 0x40308c, 0x43ac04(+0x1668) -- a camera shake -- once per entry whose time +
// +0x1664 the clock +0x1618 has reached: not visual). No base01 field is written (flags 0, timer 0, vec 0) and no EffectParam (its .shl
// efs are empty): the init starts nothing.
function params063s11(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : 0, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const n = I(0) >= 1 ? I(0) : 0, table = [];
  for (let k = 0; k < n; k++) table.push(F(k));
  return { flags: 0, joint: -1, timer: 0, f1600: 0, f15fc: f(1.0), vec: [0, 0, 0], up: f(500.0), down: f(500.0), maxH: f(900.0),
           table, cam: { after: F(12), id: I(1) }, efAt: { 0x15c8: null, 0x15cc: null, 0x15d0: null } };
}
READERS11[0xf48350] = (def, mode) => params063s11(def, mode);

// the drop probe 0xf487f0 (sp_11's) = 0xf3e7a8 (the class's; the same instructions): the stage ray from the point's y + 1000 down
// (0x18154c, to -100000); a hit whose height the owner's ground (block +0x5b4) is within [-500, 500) of puts y = hit + 4 (attribute
// bits 1 / 4 / 0x40 pick another height: a plain floor takes the hit); no hit, or out of the band: nothing is made.
function drop063(p, own, stage){
  const q = stageQuery([p[0], f(-100000.0), p[2]], [p[0], f(p[1] + f(1000.0)), p[2]], stage, 0x10);
  if (!q || own.ground == null) return null;
  const d = f(own.ground - q.point[1]);
  if (!(d >= f(-500.0)) || !(d < f(500.0))) return null;
  return { point: [p[0], f(q.point[1] + f(4.0)), p[2]], normal: q.normal.slice() };
}

// sp_11's +0x168 0xf484d8(shell, k) (READ whole): the owner active (always in the viewer); vec k + 1 (0x4a2584(shell, k + 1)); by the
// shell's mode (0x4a0ee4): MODE 1 -- vec turned by its Y word +0xfec (x cos + z sin, y, z cos - x sin) plus its +0x40, the child mode 1;
// MODE 0 -- the Y word += 0x2000 | (k & 3) << 14, a draw r = rng % 3 (0x3f76d8), x = vx + vz x (-0.4 + 0.4 r), turned by the NEW word,
// the child mode 0; any other mode (none here) mode 0x27 at the zero vector. Then the drop probe from that point (the owner's ground):
// shell01 [owner+0xcac0] of that mode at the probe's point, its words (+0xfe8, the Y word as used, +0xff0), +0x3c = its +0x1588.
function create063s11(S, idx, ctx, D){
  const sh = S.mode.sh, vi = idx + 1, v = vi < sh.vecs.length ? sh.vecs[vi].map(f) : [0, 0, 0];
  const m = S.modeIndex, P = S.position;
  if (m !== 0 && m !== 1){ ctx.out.refused.push({ shell: S.shell, mode: m, why: 'sp_11 +0x168: mode ' + m + ' makes shell01 0x27 (no files)' }); return; }
  let Y = S.angles[1] >>> 0, x, z;
  if (m === 1){
    const r = f(u16(Y) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    x = mla(f(v[0] * cs), v[2], sn); z = mls(f(v[2] * cs), v[0], sn);
  } else {
    Y = (Y + (0x2000 | ((idx & 3) << 14))) >>> 0;
    const lat = mla(f(-0.4), f(rng16(ctx.shellState) % 3), f(0.4)), a = mla(v[0], v[2], lat);
    const r = f(u16(Y) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    x = mla(f(cs * a), v[2], sn); z = f(f(v[2] * cs) - f(sn * a));
  }
  const p = [f(x + P[0]), f(v[1] + P[1]), f(z + P[2])];
  const g = drop063(p, ctx.own001, ctx.stage);
  if (!g){ S.events.push({ ev: 'refused', kind: 'drop', idx, why: 'sp_11 +0x168: no floor within 500 of the owner\'s ground under the point' }); return; }
  ctx.create(S, 'shell01', { mode: m, position: g.point, angles: [S.angles[0] >>> 0, Y, S.angles[2] >>> 0] });
}
CREATE11.uShellEm063_sp_11 = (S, idx, ctx, D) => create063s11(S, idx, ctx, D);

// ---- BASE35 (uShellEmBase35, vtable 0x175169c to +0x15c): the slime pools -------------------------------------------------------------
// READ 2026-10-25 whole (0x4186f0..0x418de4): the 0x30 request 0x41876c (+0x10 the point, +0x20.. the WORDS, +0x2c a byte, +0x2e a
// halfword; its ctor 0x4186d8.. leaves +0x2c 0 / +0x2e 0xffff); ctor 0x4187a8 (0x43a78c; ef +0x15c8 0, hit +0x15cc -1, floats +0x15d0..
// +0x15dc 0, ints +0x15e0 / +0x15e4 -1, +0x15e8 the zero vector, +0x15f0 / +0x15f4 / +0x15ec 0, byte +0x15f8 0, +0x15a8 0x23). sp_35's
// reader 0xf48bb4: ef 0 -> +0x15c8, HitParam int 0 -> +0x15cc, sh ints 0 / 1 -> +0x15e0 / +0x15e4, floats 0..3 -> +0x15d0 (THE LIFE) /
// +0x15d4 / +0x15d8 / +0x15dc, &vec 0 -> +0x15e8.
function params063s35(mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { hit: mode.hit.length ? mode.hit[0] : -1, i15e0: I(0), child: I(1), life: F(0), r0: F(1), r1: F(2), grow: F(3),
           vec: (sh.vecs[0] || ZERO3).map(f) };
}
// the init 0x418888(shell, setup): the gates 0x43a850 / 0x4a100c's byte +0x50 bit 0 (always passed in the viewer); +0x1588 = setup
// +0x2e, byte +0x15f8 = setup +0x2c; the reader; +0x40 = setup +0x10.. plus vec 0 turned by the Y word (+0xfec = setup +0x24: x cos + z
// sin, y, z cos - x sin), the anchor +0x1000 = it; state 1; the timer +0x15f0 = the life +0x15d0; ef +0x15c8 at +0x40 (0x4a10c8 /
// 0x4a11e4, the shell's own unit, joint -1) -> +0x15f4; the hit registration (0x4a1ad8; vt+0x140 slot 0, hit +0x15cc, radius +0x15d4).
function make35(state, D, name, setup, own, ctx, creator){
  const def = D.shells[name], mode = def.modes[setup.mode];
  if (!mode) return { why: name + ' mode ' + setup.mode + ': no files in this arc' };
  const k = params063s35(mode), A = setup.angles.map(w => w >>> 0), v = k.vec, P = setup.position;
  const r = f(u16(A[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const pos = [f(P[0] + mla(f(v[0] * cs), v[2], sn)), f(v[1] + P[1]), f(mls(f(v[2] * cs), v[0], sn) + P[2])];
  const lists = def.lists || D.lists;
  const S = { id: state.nextId++, monId: state.monId, shell: name, cls: def.cls, globalId: def.id, base: 'base35', mode, modeIndex: setup.mode,
              action: setup.action || null, spawnFrame: setup.frame == null ? null : setup.frame, motion: ctx.motion, state: 1, k,
              folder: def.folder, creator: creator ? creator.id : null, position: pos, prevPosition: pos.slice(), anchor: pos.slice(),
              angles: A, timer: k.life, clock: f(0.0), moves: 0, b2c: setup.b2c | 0, h1588: setup.h2e == null ? 0xffff : setup.h2e,
              hitRadius: k.r0, events: [], place: null, start: null, stop: null, effect: null, slots: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.start = rockRequest(D, mode, 0, pos, 'init', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'init' } : null;
  if (S.start) S.effects[0].started = true;
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return { S };
}
// the end 0x418cfc(shell, flag): (state & 0xfe) != 0xfe: ef +0x15f4 stopped (0x43b058, the flag: 0 graceful), 0x4a1de4 (the hit side),
// vt+0x150 (bx lr), state 0xfe, +0x15ec = 0; flag 1 deletes the shell
function end35(S, flag, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key, flag } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag });
  S.state = 0xfe; S.clock = f(0.0);
  if (out) out.ended.push(S);
  if (flag === 1) S.state = 0xff;
}
// sp_35's +0x154 0xf48ca0 (READ): +0x15fc = +0x15e4 (sh int 1); >= 0 -> shell01 [owner+0xcac0] of that mode at +0x40, ITS words
// +0xfe8.., +0x20 the zero vector, +0x3c 0xffff (the owner 0x4a0f00) -- THE POOL'S EXPLOSION: em063_00 0 -> 6 (u 1), 1 -> 7 (u 11);
// em063_05 0 -> 6 (u 1), 1 -> 7 (u 11), 4 -> 21 (u 111)
function child35(S, ctx){
  if (S.k.child < 0) return;
  if (!ctx || !ctx.create) throw new Error('shells.js: sp_35 +0x154 (0xf48ca0) without the create context');
  ctx.create(S, 'shell01', { mode: S.k.child, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) });
}
// the move 0x418af0: 0x4a1698 (deletes when the owner's unit leaves states 1 / 2: never here), the handle's hygiene, then by state.
// STATE 1 (0x418bb8): no owner -> the end (never here). The timer +0x15f0 > 0: t = it - the step (unit +0x1c), kept clamped at 0; while
// t > 0, with sh int 0 == 0 (mode 1's) the hit radius +0x13bc = r0 + (r1 - r0) x min((life - t) / +0x15dc, 1) (not visual), and the
// owner active keeps it. t <= 0 (or the timer already 0): vt+0x148(0) (the end above), vt+0x154 (the explosion), and with byte +0x15f8 == 0
// 0xac030(owner, &+0x40, 2, 0) (the AI's noise event: S.events 'noise', not visual). STATE 0xFE: +0x15ec += the step; deleted (vt+0x40,
// state 0xff) past [0x162493c] x 60 (1800) or once the effect's handle is gone.
//   So THE TIMER IS THE LIFE: em063_00 300 frames (modes 0 / 1), em063_05 150 (modes 0 / 1 / 4). NO WARNING STAGE IN THE SHELL: one ef
// (the pool) runs from the init to the end, nothing else starts until the explosion -- any flash before it is the pool's own efl
// (em063_00_000 / em063_00_003 / em063_05_000 / em063_05_002), its timeline NOT READ.
function step35(S, ctx, input, D, out){
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.state === 1){
    const T = S.timer;
    if (T > 0){
      const t = f(T - ctx.dt), c = (f(0.0) >= t) ? f(0.0) : t;
      S.timer = c;
      if (t > 0){
        if (S.k.i15e0 === 0){
          const a = f(Math.min(f(f(S.k.life - c) / S.k.grow), 1.0));
          S.hitRadius = mla(f(S.k.r0 * f(1.0 - a)), S.k.r1, a);
        }
        return;
      }
    } else S.timer = f(0.0);
    end35(S, 0, out);
    child35(S, ctx);
    if (S.b2c === 0) S.events.push({ ev: 'noise', at: S.position.slice(), kind: 2 });
    return;
  }
  if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    if (S.clock > ENDING_FRAMES || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}

// ---- THE MAKERS ------------------------------------------------------------------------------------------------------------------------
// the viewer's state as these read it: the variant (e+0xb5f5), the rage test 0x81670 (input.rage -- Raging's Red Slime is his rage, as the
// viewer shows it), Brachydios's arm levels [ctl+0x24 + 12k] (input.arm063 = [left, right]: monster.js armSlimeLevels; 0 = Depleted; the
// default 2), Raging's slot states [ctl+0x54 + 8k] (input.slime063 = [left arm, right arm, head, tail]: 2 Red, 0 Yellow -- the viewer's
// Red Slime with the erupted slots Yellow (motion-states.js slime063's `spent`); the default: Red with Red Slime on, else Yellow), the
// quest rank 0x3a8430 (own.rank), the part break levels 0x9d36c (input.breaks063 = { 0: head, 2: right arm, 3: left arm }) and the sever
// (input.tailSevered: 0x9d36c(e, 6) != 0)
function state063(D, input){
  const v5 = D.variant063 === 5, rage = !!input.rage, fin = Number.isFinite;
  const lv = Array.isArray(input.arm063) ? input.arm063 : [2, 2];
  const sl = Array.isArray(input.slime063) && input.slime063.length === 4 ? input.slime063 : [0, 1, 2, 3].map(() => (v5 && rage ? 2 : 0));
  const br = input.breaks063 || {};
  return { v5, rage, levels: [0, 1].map(k => fin(lv[k]) ? lv[k] | 0 : 2), slots: sl.map(x => x | 0),
           breaks: { 0: fin(br[0]) ? br[0] | 0 : 0, 2: fin(br[2]) ? br[2] | 0 : 0, 3: fin(br[3]) ? br[3] | 0 : 0 }, severed: !!input.tailSevered };
}
// the computed kind (0xf458ec / 0xf3b7e8 / the pair tests, kind < 0): Raging -- the slot Red ? 4 : 1; else the arm's level > 0 ? (enraged
// ? 4 : 1) : 0 (the level of slots 0 / 1 only: the fists)
const kind063 = (I, slot) => I.v5 ? (I.slots[slot] === 2 ? 4 : 1) : (I.levels[slot] > 0 ? (I.rage ? 4 : 1) : 0);

// the fist probe 0xf454e0(e, slot, &point, &normal, &attr) (READ whole): joint 0x32 = 50 for slot 1, 0x28 = 40 for any other (0xc164c,
// this action's joints: the previous pose's), y + 1000; the stage ray 0x18154c down to -100000; the hit (else -99996) less the owner's
// ground (block +0x5b4) must be >= -300 and < 300 (a hit) / 500 (none): the point (joint x, hit y, joint z), the hit's normal and its
// attribute halfword (0 on the viewer's floor). The callers then put the normal to (0, 1, 0) (0x19176f0) when its y < 0.75.
function probe063(J, slot, own, stage){
  const M = jointMatrix(J, slot === 1 ? 50 : 40);
  if (!M) return null;
  const x = f(M[12]), z = f(M[14]), y = f(f(M[13]) + f(1000.0));
  const q = stageQuery([x, f(-100000.0), z], [x, y, z], stage, 0x10);
  if (own.ground == null) return null;
  const hy = q ? q.point[1] : f(f(-100000.0) + f(4.0)), lim = q ? f(300.0) : f(500.0);
  const d = f(hy - own.ground);
  if (!(d >= f(-300.0)) || !q || !(d < lim)) return null;
  const n = q.normal[1] < f(0.75) ? [0, 1, 0] : q.normal.slice();
  return { point: [x, hy, z], normal: n, attr: 0 };
}
const words063 = own => [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0];   // block +0x50 / +0x54 / +0x58

// a pool (sp_35 [e+0xcac8]) at a point: words from the ground normal and the owner's yaw (0xf45a40..0xf45b20 / 0xf3ba24..: forward (0, 0,
// 1) 0x1917700 turned by the yaw word P+0x54, the frame 0x232530, its Euler 0x7c3a38 -- groundAngles), +0x2c = b2c, +0x2e = the arm row's
// halfword ctl+0x22 + 12 slot (a hit id; not visual)
function pool063(state, D, ctx, own, point, normal, mode, b2c, a, F, out){
  const r = make35(state, D, 'shell35', { mode, position: point, angles: groundAngles([0, own.ownerY, 0], normal), b2c, h2e: null,
                                          action: a ? a.action : null, frame: F }, own, ctx, null);
  if (r.why){ out.refused.push({ action: a ? a.action : null, shell: 'shell35', mode, why: r.why }); return null; }
  state.shells.push(r.S); out.spawned.push(r.S);
  return r.S;
}
// an explosion (sp_01 [e+0xcac0]) at a point with the owner's words (+0x30.. = block +0x50..), +0x20 the zero vector, +0x3c = P+0xb0a /
// 0xffff (a hit id; not visual)
function blast063(state, D, ctx, own, J, point, mode, a, F, out){
  const def = D.shells.shell01;
  const S = make001(state, D, 'shell01', { id: def.id, mode, position: point.slice(), angles: words063(own), action: a ? a.action : null, frame: F },
                    own, J, ctx, null);
  if (S){ S.motionId = ctx.ownerMotion; state.shells.push(S); out.spawned.push(S); }
  return S;
}
// 0xf458ec(e, slot, kind, ..) (READ whole, ..0xf46230): kind -> pool / explosion (the header comment). kind 1 with the attribute's 0x1040
// bits set makes nothing (0xf45a38). Raging (0xf45d78): status 7 picks the +0x3c halfword only (not visual).
function fist063(state, D, ctx, I, own, J, slot, kind, b2c, a, F, out){
  const hit = probe063(J, slot, own, ctx.stage);
  if (!hit){ out.refused.push({ action: a ? a.action : null, slot, why: 'the fist probe 0xf454e0: no floor within 300 of the owner\'s ground under joint ' + (slot === 1 ? 50 : 40) }); return null; }
  let k = kind >= 0 ? kind : kind063(I, slot);
  if (I.v5 && I.slots[slot] === 2) k = 4;                                      // 0xf459b4
  if (k === 1){
    if (hit.attr & 0x1040) return null;
    return pool063(state, D, ctx, own, hit.point, hit.normal, I.v5 && I.rage ? 4 : 0, b2c, a, F, out);
  }
  if (k === 3) return blast063(state, D, ctx, own, J, hit.point, 2, a, F, out);   // no caller passes 3
  if (k !== 4) return null;
  const m22 = ctx.ownerMotion === 0x216 || ctx.ownerMotion === 0x217;          // (motion >> 1) == 0x10b: L2 M22 / M23
  return blast063(state, D, ctx, own, J, hit.point, m22 ? 9 : (I.v5 && I.rage ? 14 : 3), a, F, out);
}
// 0xf3b7e8(e, slot, kind) (READ whole, ..0xf3bc80): slot > 3 nothing; the probe; kind < 0 computed and 4 -> 3; Raging: this slot Red -> 3,
// both arms Red -> 4 (0xf3b900..); 1 -> a pool 5 higher (+0x2c 0); 3 -> sp_01 5 (Raging enraged 18); 4 -> sp_01 4 (17); +0x3c 0xffff
function fists063(state, D, ctx, I, own, J, slot, kind, a, F, out){
  if (slot > 3) return null;
  const hit = probe063(J, slot, own, ctx.stage);
  if (!hit){ out.refused.push({ action: a ? a.action : null, slot, why: 'the fist probe 0xf454e0: no floor within 300 of the owner\'s ground' }); return null; }
  let k = kind;
  if (k < 0){ k = kind063(I, slot); if (k === 4) k = 3; }
  if (I.v5){ if (I.slots[slot] === 2) k = 3; if (I.slots[0] === 2 && I.slots[1] === 2) k = 4; }
  if (k === 1){
    if (hit.attr & 0x1040) return null;
    return pool063(state, D, ctx, own, [hit.point[0], f(hit.point[1] + f(5.0)), hit.point[2]], hit.normal, I.v5 && I.rage ? 4 : 0, 0, a, F, out);
  }
  if (k === 3) return blast063(state, D, ctx, own, J, hit.point, I.v5 && I.rage ? 0x12 : 5, a, F, out);
  if (k === 4) return blast063(state, D, ctx, own, J, hit.point, I.v5 && I.rage ? 0x11 : 4, a, F, out);
  return null;
}
// THE PAIR TEST (READ): the jump slam's landing (0xf3f02c phase 3 on L2 M3, (7, 0x13 / 0x16 / 0x18), F = 34; 0xf41114, (7, 0xb2), F = 30)
// -- both arms' kinds 4: at F both fists' 0xf3b7e8(k, 4); else each arm alone: kind 1 at 8 -> 0xf3b7e8(k, 1), kind 3 / 4 at F ->
// 0xf3b7e8(k, 3); 0 nothing. L0 M57 ((3, 2) 0xf3b514 / (3, 5) 0xf3c694, f16): both 4 -> (k, 4) each, else (k, -1) each (computed there).
// Each arm spent once (0xf4653c(e, k, -1): the level, not modelled here)
function pair063(state, D, ctx, I, own, J, sp, a, out){
  const k0 = kind063(I, 0), k1 = kind063(I, 1), both = k0 === 4 && k1 === 4;
  if (sp.kind === 'pairL0'){
    if (!pass001(state, f(sp.frame))) return;
    for (const k of [0, 1]) fists063(state, D, ctx, I, own, J, k, both ? 4 : -1, a, sp.frame, out);
    return;
  }
  if (both){ if (pass001(state, f(sp.frame))) for (const k of [0, 1]) fists063(state, D, ctx, I, own, J, k, 4, a, sp.frame, out); return; }
  for (const [k, kk] of [[1, k1], [0, k0]]){
    if (kk === 1 && pass001(state, f(8.0))) fists063(state, D, ctx, I, own, J, k, 1, a, 8, out);
    else if ((kk === 3 || kk === 4) && pass001(state, f(sp.frame))) fists063(state, D, ctx, I, own, J, k, 3, a, sp.frame, out);
  }
}
// THE BIG SLAM's pool (L2 M42 0xf3e5ac.. f90 with 550, L2 M41 0xf3ec44.. f124 with 400; READ): the point = the owner's +0x40 + (0, 0, d x
// size 0xbe518) turned by his yaw (x cos + z sin; the 0.0 literal on x and y), the drop probe (0xf3e7a8) from it, then 0xf3e984: the
// normal to (0, 1, 0) below 0.75, the words groundAngles, sp_35 MODE 1 (no variant / rage test) at the probe's point, +0x2c 0, +0x2e P+0xb0a
function big063(state, D, ctx, own, sp, a, out){
  if (!own.ownerPos){ out.refused.push({ action: a.action, shell: 'shell35', mode: 1, why: 'no owner position (input.ownerPos)' }); return; }
  const sc = size001(own), x0 = f(sc * f(0.0)), z0 = f(sc * f(sp.dist));
  const r = f(u16(own.ownerY) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), P = own.ownerPos;
  const p = [f(P[0] + mla(f(x0 * cs), z0, sn)), f(P[1] + x0), f(P[2] + mls(f(z0 * cs), x0, sn))];
  const g = drop063(p, own, ctx.stage);
  if (!g){ out.refused.push({ action: a.action, shell: 'shell35', mode: 1, why: 'the drop probe 0xf3e7a8: no floor within 500 of the owner\'s ground' }); return; }
  pool063(state, D, ctx, own, g.point, g.normal[1] < f(0.75) ? [0, 1, 0] : g.normal, 1, 0, a, sp.frame, out);
}
// THE SLIME LINES (L2 M42 f125 0xf3e4a0 / 0xf40ef8 mode 1; L2 M41 f190 0xf3edc8 mode 0; READ): sp_11 [e+0xcac4] at the owner's +0x40..,
// his words +0x50.., +0x3c = a draw (0x16b4b4 -> P+0xb0a), the zero vector at +0x20. Its children are made by its own clock (tick11 ->
// create063s11): mode 1 the eight of the line (u 30), mode 0 the twelve scattered (u 31)
function line063(state, D, ctx, own, J, sp, a, out){
  if (!own.ownerPos){ out.refused.push({ action: a.action, shell: 'shell11', mode: sp.mode, why: 'no owner position (input.ownerPos)' }); return; }
  const def = D.shells.shell11;
  const S = make001(state, D, 'shell11', { id: def.id, mode: sp.mode, position: own.ownerPos.slice(), angles: words063(own), action: a.action, frame: sp.frame },
                    own, J, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}
const act063 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em063', list, clip, pick: x.pick || 'always',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
// a fist row: { frame, kind: 'fist', slot, k (the kind passed: -1 / 1), b2c, gate } -- `gate`: the kind-1 sites test the arm's level
// (ctl+0x24 + 12 slot >= 1: 0xf3da28; the census at level 0 makes nothing there) before they probe
const FIST063 = (frame, slot, k, b2c = 0) => ({ frame, kind: 'fist', slot, k, b2c, gate: k === 1 });
function spawn063(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints, I = state063(D, input);
  if (own.ground == null && a.spawns.some(sp => sp.kind !== 'line')){
    if (a.spawns.some(sp => pass001(state, f(sp.frame)))) out.refused.push({ action: a.action, why: 'no ground (input.ground or input.rock.floorY)' });
    return;
  }
  for (const sp of a.spawns){
    if (sp.kind === 'pair' || sp.kind === 'pairL0'){ pair063(state, D, ctx, I, own, J, sp, a, out); continue; }
    if (!pass001(state, f(sp.frame))) continue;
    if (sp.kind === 'fist'){ if (!sp.gate || I.v5 || I.levels[sp.slot] >= 1) fist063(state, D, ctx, I, own, J, sp.slot, sp.k, sp.b2c, a, sp.frame, out); }
    else if (sp.kind === 'big') big063(state, D, ctx, own, sp, a, out);
    else if (sp.kind === 'line') line063(state, D, ctx, own, J, sp, a, out);
  }
}
// the frame handler vt+0x208 0xf3552c (READ whole, ..0xf35870; census of every motion id L0..L4 M0..109: only this): on motion 0x216 (L2
// M22) the crossings of 114 (slot 0), 152 (slot 1) and 180 (slot 0) -> the fist (kind -1, the normal below 0.75 to up, b2c 0), each arm
// spent -- an enraged Brachydios / any Raging Red fist makes sp_01 9 (u 40) there, not 3
const PERFRAME063 = [[114, 0], [152, 1], [180, 0]];
function perFrame063(state, D, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints || ctx.ownerMotion !== 0x216) return;
  const own = ctx.own001, I = state063(D, input);
  for (const [F, slot] of PERFRAME063)
    if (pass001(state, f(F))) fist063(state, D, ctx, I, own, state.prevJoints, slot, -1, 0, null, F, out);
}

// ---- THE ERUPTION: 0xf46234(e, slot) (READ whole, ..0xf46520) -------------------------------------------------------------------------
// the warning handle +0xc0+4k stopped (0x329c40(h, 1): the effects lane's u 200 + slot); with the unit live a slot that is NOT Red returns
// here (no shell); Red -> its countdown -1.0; the trigger cleared; then sp_01 [e+0xcac0] (0x3fa2bc(0x40)), +8 THE MODE by the jump table
// 0xf462cc (slot 0..3; > 3: 0x17): slot 0 the LEFT arm -- part 3's break level (0x9d36c) >= the .dtp byte [6] (rank > 4) / [5] -> 0x21 /
// 0x22, else 0x19 / 0x1a; slot 1 the RIGHT arm -- part 2, the same bytes -> 0x23 / 0x24, else 0x1b / 0x1c; slot 2 the HEAD -- part 0,
// bytes [2] / [1] -> 0x1f / 0x20, else 0x17 / 0x18; slot 3 the TAIL -- part 6's level != 0 (severed) -> 0x25 / 0x26, else 0x1d / 0x1e;
// the second of each pair when enraged (0x81670). +0xc the enemy, +0x10.. the ZERO VECTOR (0x1831a78 -> 0x19176b0), +0x20 the same,
// +0x30.. his words P+0x50.., +0x3c 0xffff -> 0x48b884. THE POINT IS THE FILE'S: every mode 23..38 has sh int 4 = 0 (flag bit 0: at the
// joint) and int 0 the joint -- 3 head, 40 left arm, 50 right arm, 143 tail -- with vec 0 the offset through its matrix (init011's joint
// arm, launchPoint): u 210 (em063_00_001) at ShellScale 0.62 / 0.85 (head, tail), 0.52 / 0.6 (arms), 0.3 broken / severed; hit 21 calm /
// 22 enraged (HDS (10, 10)).
//   THE VIEWER (motion-states.js CLASS_TIMERS em063_05 slime063 holds u 200 + slot for the 30-frame fuse): on the step the fuse burns
// out (its `held` -> `spent`), index.html passes input.erupt063 = { slots: [k, ..] } (k = the slot: 0 left arm, 1 right arm, 2 head, 3
// tail) with the same input.rage / input.slime063 / input.breaks063 / input.tailSevered as the rest. Brachydios has no eruption.
function mode063erupt(I, slot, rank){
  const A = DTPA063, g = rank > 4;
  if (slot === 0) return (I.breaks[3] >= (g ? A[6] : A[5]) ? 0x21 : 0x19) + (I.rage ? 1 : 0);
  if (slot === 1) return (I.breaks[2] >= (g ? A[6] : A[5]) ? 0x23 : 0x1b) + (I.rage ? 1 : 0);
  if (slot === 2) return (I.breaks[0] >= (g ? A[2] : A[1]) ? 0x1f : 0x17) + (I.rage ? 1 : 0);
  if (slot === 3) return (I.severed ? 0x25 : 0x1d) + (I.rage ? 1 : 0);
  return 0x17;
}
export function erupt063(state, D, ctx, input, out, slot){
  if (!D.variant063 || D.variant063 !== 5) return null;
  const I = state063(D, input), own = ctx.own001;
  if (I.slots[slot] !== 2){ out.refused.push({ shell: 'shell01', slot, why: '0xf46234: the slot is not Red at the burn-out (no explosion)' }); return null; }
  const J = state.prevJoints || ctx.J;
  const S = blast063(state, D, ctx, own, J, [0, 0, 0], mode063erupt(I, slot, own.rank), null, null, out);
  if (S) S.erupt063 = slot;
  return S;
}
function eruptStep063(state, D, ctx, input, out){
  const e = input.erupt063, slots = e && Array.isArray(e.slots) ? e.slots : (e && Number.isFinite(e.slot) ? [e.slot] : []);
  for (const k of slots) erupt063(state, D, ctx, input, out, k | 0);
}

// ---- THE DATA (generated from the arcs: <archive> gapQ/gen063.py; the HDS pairs (s16 delay, s16 duration) by record) ------------------
//@@DATA063@@
const SHELLS063 = (v, folder, M01, H01, M11, M35, H35) => ({
  shell01: { id: v ? 0x113 : 0x110, cls: 'uShellEm063_sp_01', base: 'base01', reader: 0xf4815c, folder: folder + '_shell01', modes: M01, hitdata: H01 },
  shell11: { id: v ? 0x114 : 0x111, cls: 'uShellEm063_sp_11', base: 'base11', reader: 0xf48350, folder: folder + '_shell11', modes: M11 },
  shell35: { id: v ? 0x115 : 0x112, cls: 'uShellEm063_sp_35', base: 'base35', reader: 0xf48bb4, folder: folder + '_shell35', modes: M35, hitdata: H35 },
});
// THE ROWS (census <archive> gapQ/cen063.py on trgen063 -- every action of statuses 0..13, phases 0..8, each frame literal alone, rage 0 / 1,
// variant 0 levels 2 / 0 and variant 5 Yellow / Red; the status-3 walks by motion id, st3b.py -- each site then read): the kind-1 sites
// (L2 M28 / M29 / M5 / M8) are gated on the arm's level; the kind -1 ones compute it.
const ACTIONS063 = [
  // L2 M28 / M29, the straight punches: (7, 3 / 0x2f / 0x31 / 0x33 / 0x3f / 0x95 / 0xad) slot 0, (7, 2 / 0x2e / 0x30 / 0x32 / 0x3e / 0x94 / 0xac)
  // slot 1 -- 0xf3dad8 / 0xf4088c at 72, kind 1
  act063(7, 0x03, '2', 'Motion[28]', [FIST063(72, 0, 1)], { also: [[7, 0x2f], [7, 0x31], [7, 0x33], [7, 0x3f], [7, 0x95], [7, 0xad]] }),
  act063(7, 0x02, '2', 'Motion[29]', [FIST063(72, 1, 1)], { also: [[7, 0x2e], [7, 0x30], [7, 0x32], [7, 0x3e], [7, 0x94], [7, 0xac]] }),
  // L2 M11 / M13, the side punches (0xf3f890 / 0xf419a4 at 26, kind -1): slot 0 (7, 0x1a / 0x29 / 0x84 / 0x88 / 0x8c / 0x90 / 0xb3), slot 1
  // (7, 0x1c / 0x27 / 0x86 / 0x8a / 0x8e / 0x92 / 0xb4)
  act063(7, 0x1a, '2', 'Motion[11]', [FIST063(26, 0, -1)], { also: [[7, 0x29], [7, 0x84], [7, 0x88], [7, 0x8c], [7, 0x90], [7, 0xb3]] }),
  act063(7, 0x1c, '2', 'Motion[13]', [FIST063(26, 1, -1)], { also: [[7, 0x27], [7, 0x86], [7, 0x8a], [7, 0x8e], [7, 0x92], [7, 0xb4]] }),
  // L2 M54 (7, 7 / 0x4d): 0xf3e19c at 72, slot 1, kind -1
  act063(7, 0x07, '2', 'Motion[54]', [FIST063(72, 1, -1)], { also: [[7, 0x4d]] }),
  // the turn punches 0xf3fc94 (phase 0 turns on table 0x16a01a4 (slot 0: L2 M5 x3) / 0x16a01e4 (slot 1: L2 M8 x3)), phase 1 at 6, kind 1:
  // slot 0 (7, 0x3c / 0x54 / 0x58 / .. / 0x80 (every 4th from 0x54) / 0xa4 / 0xa9), slot 1 (7, 0x3d / 0x56 / 0x5a / .. / 0x82 / 0xa2 / 0xaa)
  act063(7, 0x3c, '2', 'Motion[5]', [FIST063(6, 0, 1)], { also: [0x54, 0x58, 0x5c, 0x60, 0x64, 0x68, 0x6c, 0x70, 0x74, 0x78, 0x7c, 0x80, 0xa4, 0xa9].map(n => [7, n]) }),
  act063(7, 0x3d, '2', 'Motion[8]', [FIST063(6, 1, 1)], { also: [0x56, 0x5a, 0x5e, 0x62, 0x66, 0x6a, 0x6e, 0x72, 0x76, 0x7a, 0x7e, 0x82, 0xa2, 0xaa].map(n => [7, n]) }),
  // the jump slam: L2 M2 then L2 M3 on landing; the pair test at 8 / 34 ((7, 0x13 / 0x16 / 0x18) 0xf3f02c) or 8 / 30 ((7, 0xb2) 0xf41114)
  ...[0x13, 0x16, 0x18].map(n => act063(7, n, '2', 'Motion[3]', [{ frame: 34, kind: 'pair' }], { pick: 'ai' })),
  act063(7, 0xb2, '2', 'Motion[3]', [{ frame: 30, kind: 'pair' }], { pick: 'ai' }),
  // L2 M42, the big slam: the slime line (sp_11 1) at 125 on (7, 8 / 0x14 / 0xa6 / 0xb0); the big pool (sp_35 1, 550 ahead) at 90 on (7, 0x15 /
  // 0xa5 / 0xb1) -- the plays CLIP_ACTIONS names (the AI's pick NOT READ: the viewer names one a play)
  ...[0x08, 0x14, 0xa6, 0xb0].map(n => act063(7, n, '2', 'Motion[42]', [{ frame: 125, kind: 'line', mode: 1 }], { pick: 'ai' })),
  ...[0x15, 0xa5, 0xb1].map(n => act063(7, n, '2', 'Motion[42]', [{ frame: 90, kind: 'big', dist: 550.0 }], { pick: 'ai' })),
  // L2 M41: the scatter (sp_11 0) at 190 on (7, 9); the big pool 400 ahead at 124 on (7, 0x98)
  act063(7, 0x09, '2', 'Motion[41]', [{ frame: 190, kind: 'line', mode: 0 }], { pick: 'ai' }),
  act063(7, 0x98, '2', 'Motion[41]', [{ frame: 124, kind: 'big', dist: 400.0 }], { pick: 'ai' }),
  // THE STATUS-3 WALKS (0xf3c9f0: n 0 / 1 / 3 -> 0xf3a234(e, 0 / 1 / 2), 2 -> 0xf3b514, 4 -> 0xf3bcb4, 5 -> 0xf3c694; by the motion id they
  // are on, 0xb0944): every fist kind -1 (b2c 1 where the site stores 1)
  act063(3, 0x00, '0', 'Motion[52]', [FIST063(54, 0, -1, 1), FIST063(88, 1, -1, 1)]),
  act063(3, 0x00, '0', 'Motion[54]', [FIST063(30, 0, -1), FIST063(40, 1, -1)]),
  act063(3, 0x02, '0', 'Motion[57]', [{ frame: 16, kind: 'pairL0' }], { also: [[3, 0x05]] }),
  act063(3, 0x01, '0', 'Motion[58]', [FIST063(60, 1, -1, 1), FIST063(80, 0, -1, 1)]),
  act063(3, 0x01, '0', 'Motion[59]', [FIST063(12, 1, -1, 1)]),
  act063(3, 0x01, '0', 'Motion[60]', [FIST063(45, 0, -1), FIST063(54, 1, -1)]),
  act063(3, 0x04, '0', 'Motion[61]', [FIST063(60, 1, -1, 1), FIST063(80, 0, -1, 1)], { also: [[3, 0x03]] }),
  act063(3, 0x04, '0', 'Motion[62]', [FIST063(9, 1, -1, 1), FIST063(29, 0, -1, 1), FIST063(58, 1, -1, 1)], { also: [[3, 0x03]] }),
  act063(3, 0x03, '0', 'Motion[63]', [FIST063(45, 0, -1), FIST063(54, 1, -1)]),
];
SHELL_DATA.em063_00 = { name: 'Brachydios', variant063: 0, lists: { 0: { list: 'u', pel: 'em063_00u' } },
  shells: SHELLS063(0, 'shell\\em\\em063_00', MODES063_00_01, HITDATA063_00_01, MODES063_00_11, MODES063_00_35, HITDATA063_00_35),
  actions: ACTIONS063.map(r => Object.assign({}, r)), perFrame063: PERFRAME063 };
// Raging: the same class and rows; his .shl EffectLists name em063_05u at index 1 (listId 1 in every ef)
SHELL_DATA.em063_05 = { name: 'Raging Brachydios', variant063: 5, lists: { 1: { list: 'u', pel: 'em063_05u' } },
  shells: SHELLS063(5, 'shell\\em\\em063_05', MODES063_05_01, HITDATA063_05_01, MODES063_05_11, MODES063_05_35, HITDATA063_05_35),
  actions: ACTIONS063.map(r => Object.assign({}, r)), perFrame063: PERFRAME063, erupt063: true };

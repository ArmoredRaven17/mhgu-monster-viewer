// ---- NERSCYLLA (em070_00): uEm070_00's sp_00 (0x129), sp_00_02 (0x12a), sp_01 (0x12b), sp_13 (0x12c) -------------------------
// READ 2026-10-18 (dev/temnoceran-shells-spec.md). vt+0x158 0xfab380 registers all four (immediates); res 0x8a7c..0x8a7f; vtables sp_00
// 0x17e3ba0 (base00, reader 0xfac410, landing +0x150 0xfac5e8), sp_00_02 0x17e3d1c (base00, 0xfac844 / 0xfac9e4), sp_01 0x17e3e98
// (base01, 0xfacc70), sp_13 0x17e4008 (base13, 0xface88 / 0xfad064). THE RANK TIER every maker reads (0x3a8430): >= 5 -> 2, >= 2 -> 1,
// else 0 (the cmp #4 / #1 and #5 / #2 pairs of each site).
const tier070 = rank => rank >= 5 ? 2 : rank >= 2 ? 1 : 0;
// sp_00's reader 0xfac410 (READ whole): ef 0 / 1 / 2 -> +0x15c8 / +0x15d4 / +0x15cc; hit 0 -> +0x15d8; int 0 the joint +0x15dc; float 0
// vz +0x15f4, float 1 the flight +0x15fc; &vec 0 -> the offset +0x1610 AND the aim's from-vec +0x1614; +0x15e8 (over the ctor's 0): 0x800
// when int 2 == 0 (no base00 test: rom-map), then bic 0xa4 / orr 0x84 (0x80 the offset x the size, 4 the aim from the launch point),
// 1 when int 1 != -1 (the X aim 0x3f9378); int 2 -> +0x1620; &vec 1 -> the aim offset +0x1618; floats 2 / 3 -> the X clamp +0x1600 /
// +0x1604, float 4 -> degY +0x15f0; byte +0x15c2 = 1 (the stage query mask 0x10: the floor only). vy +0x15f8, degX +0x15ec and the
// gravity +0x161c keep the ctor's 0 / the zero vector
function params070s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 0x84 | (I(1) !== -1 ? 1 : 0) | (I(2) === 0 ? 0x800 : 0), i1620: I(2), vz: F(0), vy: f(0), flight: F(1),
           degX: f(0), xDeg: f(0), degY: F(4), yDeg: F(4), xLo: F(2), xHi: F(3), vec: V(0), from: V(0), aimOff: V(1),
           gravity: ZERO3.slice(), qmask: 0x10 };
}
// its landing +0x150 0xfac5e8 (READ whole; NO base00 contact start): type 1 and mode < 0x24 -> sp_01 [0x16a1120][mode], type 0 and mode
// <= 0x23 -> [0x16a11b0][mode] (0x3fa2bc(0x40): +0x10 the contact, +0x20 the GOT zero vector, +0x30.. this shell's words +0xfe8.., +0x3c
// its +0x13dc); then vt+0x148(0) -- type 2 the end alone
const T1_070s00 = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 0, 1, 2, 0, 0, 0, 1, 1, 1, 2, 2, 2, 0, 0, 0, 1, 1, 1, 2, 2, 2];
const T0_070s00 = [3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 3, 4, 5, 3, 3, 3, 4, 4, 4, 5, 5, 5, 3, 3, 3, 4, 4, 4, 5, 5, 5];
function child070(S, hit, T1, T0, n, ctx){
  const m = S.modeIndex, t = hit.type;
  const c = t === 1 && m < n ? T1[m] : t === 0 && m <= n - 1 ? T0[m] : null;
  if (c != null && ctx && ctx.create) ctx.create(S, 'shell01', { mode: c, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
}
function landing070s00(S, D, hit, ctx){ child070(S, hit, T1_070s00, T0_070s00, 0x24, ctx); }
// sp_00_02's reader 0xfac844 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 the joint; floats 1 / 0 / 2 / 3 / 4 -> degX +0x15ec
// / degY +0x15f0 / vz +0x15f4 / vy +0x15f8 / the flight +0x15fc; &vec 1 -> the offset +0x1610, &vec 0 -> the gravity +0x161c; +0x15e8
// 0x800 when int 1 == 0; int 1 -> +0x1620. No other flag: the owner's words plus the degrees, the joint's point plus the offset
function params070s002(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: I(1) === 0 ? 0x800 : 0, i1620: I(1), degX: F(1), xDeg: F(1), degY: F(0), yDeg: F(0), vz: F(2), vy: F(3),
           flight: F(4), vec: V(1), gravity: V(0) };
}
// its landing 0xfac9e4 (READ whole): type 1 only -- mode 0 -> sp_01 6, 1 -> 7 at the contact (the setup as sp_00's), after, with the
// block's byte +0x2c0 == 1, 0xac030(e, &contact, 0xf, 1) (NOT READ; the viewer's block holds 0 there); then vt+0x148(0)
function landing070s002(S, D, hit, ctx){
  if (hit.type === 1 && (S.modeIndex === 0 || S.modeIndex === 1) && ctx && ctx.create)
    ctx.create(S, 'shell01', { mode: S.modeIndex + 6, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
}
READER00.uShellEm070_00_00 = (def, mode) => params070s00(def, mode);
READER00.uShellEm070_00_00_02 = (def, mode) => params070s002(def, mode);
AIMX00.uShellEm070_00_00 = (S, k, p, got) => xAdjust37(k, p, got);
LANDING.uShellEm070_00_00 = landing070s00;
LANDING.uShellEm070_00_00_02 = landing070s002;
// sp_01's reader 0xfacc70 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15cc; hit 0 -> +0x15d8; float 0 the timer +0x15f0; +0x15ec (bfc / orrne
// over the ctor's 0): 8 int 1 != -1, 4 int 2 != -1, 0x1000 int 0 == 0; int 0 -> +0x1610. Modes 0..2 / 6 / 7: 0xc (the ground snap and
// its angles), 3..5 none, 8 0x1000; every timer 0 (each lives while its hit slot is on)
function params070s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1;
  const flags = (I(1) !== -1 ? 8 : 0) | (I(2) !== -1 ? 4 : 0) | (I(0) === 0 ? 0x1000 : 0);
  return { flags, joint: -1, timer: f(sh && sh.floats.length ? sh.floats[0] : 0), f1600: f(0.0), f15fc: f(1.0), vec: [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), why: !sh ? 'uShellEm070_00_01: a mode its files do not carry' : null,
           efAt: { 0x15c8: 0, 0x15cc: 1, 0x15d0: null } };
}
READERS01[0xfacc70] = sh => params070s01(sh);
// sp_13's reader 0xface88 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15d4; hit 0; int 0 the joint +0x15e4; floats 0 speed +0x15ec, 2 per
// unit +0x160c, 1 gravity +0x15f4, 4 near +0x15fc, 3 far +0x1600, 5 life +0x15f8; &vec 0 -> both points +0x161c / +0x1620, &vec 1 ->
// +0x1624, &vec 2 -> +0x1630 (the velocity's turn in degrees, 0x404984); +0x15e0 0x400 when int 0 == 0 (no mode); int 1 -> +0x1634;
// byte +0x15c2 = (owner and mode <= 8) ? 0xfab5c8(owner) : 0 -- the quest map (vt+0x9c) 13 and area byte e+0x1054 7: the viewer has no
// quest map, so 0 (the query's mask 0x30)
function params070s13(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: I(0) === 0 ? 0x400 : 0, speed0: F(0), speedPer: F(2), gravity: F(1), near: F(4), far: F(3), life: F(5),
           y1614: f(0.0), f15f0: f(0.0), limitA: f(0.0), limitB: f(0.0), vec: V(0), turn: V(2) };
}
// base13's init 0x4044d8 on his flags (0, joint -1): the owner's +0x40 plus the points' midpoint turned by his words, no size (8 clear);
// the thrown point (0x405500, Khezu's arm: the distance from the shell to the target clamped [near, far] along the aim 0x4053e4 from
// the shell -- 0x20 clear, the limits 0 --, the height the target's); the launch, its velocity by the Y word toward that point, then by
// +0x1630's degrees (turnDeg065); the pitch ratio's second pair moves +0x40 by nothing (both points vec 0)
function init070s13(S, own){
  const k = S.k;
  S.centre = ZERO3.slice();                                      // +0x1650 = setup +0x20 (the GOT zero vector)
  S.y1614 = k.y1614;
  S.lifetime = k.life;
  S.angles = [0, 0, 0];
  if (k.joint !== -1 || !own.ownerPos || !own.target) return false;
  const W = [own.ownerX, own.ownerY, own.ownerZ];
  const pair = r => turnByWords([0, 1, 2].map(i => mla(k.vec[i], f(k.vec[i] - k.vec[i]), r)), W);
  const m1 = pair(f(0.5));
  let pos = [f(m1[0] + own.ownerPos[0]), f(m1[1] + own.ownerPos[1]), f(m1[2] + own.ownerPos[2])];
  S.position = pos;
  const T = thrown13(S, k, own);
  const a = wordOf(f(T[0] - pos[0]), f(T[2] - pos[2]));
  const L = launch13(S, k, own);
  const rad = f(u16(a) * U16_TO_RAD), sn = sinf(rad), cs = cosf(rad);
  S.velocity = turnDeg065([f(L.velocity[2] * sn), L.velocity[1], f(L.velocity[2] * cs)], k.turn);
  S.gravity = L.acceleration.slice();
  const h = sqrtf(mla(f(L.velocity[2] * L.velocity[2]), L.velocity[0], L.velocity[0]));
  const w = u16(0x10000 - u16(s32(mla(0.5, atan2f(f(-L.velocity[1]), h), RAD_TO_U16))));
  const ratio = w > 0x8000 ? f(1.0) : w > 0x2000 ? f(0.0) : mla(f(1.0), f(w), f(-0.0001220703125));
  const m2 = pair(ratio);
  pos = [0, 1, 2].map(i => f(m2[i] + f(pos[i] - m1[i])));
  S.position = pos;
  S.anchor = pos.slice();
  S.aim = a;
  S.launch = { point: pos.slice(), thrown: T.slice(), aim: a, dist: L.dist, speed: L.speed, t: L.t, ratio,
               velocity: S.velocity.slice(), gravity: S.gravity.slice(), life: S.lifetime, angles: [0, 0, 0] };
  S.timer = f(0.0);
  return true;
}
function make070s13(state, D, m, own, ctx, action, frame){
  const def = D.shells.shell13, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell13 mode ' + m + ': no files in this arc' };
  if (!own.ownerPos || !own.target) return { why: 'no owner position / target (input.ownerPos, input.rock.target)' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell13', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 2,
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null,
              centre: null, lifetime: 0, timer: 0, clock: 0, moves: 0, aim: 0, launch: null, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.k = params070s13(def, mode);
  if (!init070s13(S, own)) return { why: 'shell13 mode ' + m + ': its init path is not his' };
  S.prevPosition = S.position.slice();
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  return { S };
}
// sp_13's landing 0xfad064 (READ whole; no contact start, no state test): type 1 and mode < 9 -> sp_01 [0x16a1240][mode] = {0, 0, 0, 0,
// 0, 0, 2, 2, 2}, type 0 and mode <= 8 -> [0x16a1270][mode] = {3, 3, 3, 4, 4, 4, 5, 5, 5}, the setup as sp_00's; then vt+0x148(0)
const T1_070s13 = [0, 0, 0, 0, 0, 0, 2, 2, 2], T0_070s13 = [3, 3, 3, 4, 4, 4, 5, 5, 5];
LANDING13.uShellEm070_00_13 = (S, D, ctx, out) => {
  const hit = S.events.find(e => e.ev === 'hit');
  if (hit) child070(S, hit, T1_070s13, T0_070s13, 9, ctx);
};
// THE DRIP (sp_00_02) 0xfa280c, in status 3's walks' phase 1 (0xfa2610 on L0 M8: (3, 0xc / 0xd / 0x1a / 0x1b); 0xfa2930 on L0 M6:
// (3, 0xe..0x19)): skipped while P+0x3b5 bit 5 (P+0x3b4 0x2000: the Back, part 1, at its second break level -- vt+0x1dc 0xf9d350
// against .dtp bytes 5 / 6, input.back070); else the countdown [e+0xcac0]+0x90 by 0x7206c (t <= 0 -> 0 and fire; else t -= dt x 1.0,
// fire at <= 0) -> mode (rank > 4 ? 1 : 0), the setup's point / words the GOT zero vectors (unread: no 0x10 / 0x20), and the
// countdown back to 40.0. Phase 0 sets it to 20.0 (0xfa26fc / 0xfa29fc)
function drip070(state, D, a, ctx, input, out, fresh){
  if (fresh){ state.drip070 = f(20.0); return; }
  if (state.drip070 == null || !state.prevJoints) return;
  if ((input.back070 | 0) >= 2) return;
  let fire = false;
  if (!(state.drip070 > 0)){ state.drip070 = f(0.0); fire = true; }
  else { state.drip070 = f(state.drip070 - f(ctx.dt * f(1.0))); fire = !(state.drip070 > 0); }
  if (!fire) return;
  makePlain(state, D, a, ctx, out, ctx.own001, state.prevJoints, { frame: null, shell: 'shell00_02', mode: ctx.own001.rank > 4 ? 1 : 0 });
  state.drip070 = f(40.0);
}
// the spawners (code 'em070'): rows { frame, tiers: [low, high, G] } (sp_00 or `s13`: sp_13), { frame, k04 } -- (7, 4)'s two shots,
// kind 1 the tier's mode, kind 2 that plus 1 + (e+0x73e8 & 3), the kind at f20 (P+0x1a2 == 0 ? 1 : 2) and at f42 the other, P+0x1a2 =
// e+0x73e8 & 1 (0xfa5100) -- e+0x73e8 the named stand-in H73E8_STANDIN -- and `drip` (above)
function spawn070(state, D, a, ctx, input, out, fresh){
  if (a.drip){ drip070(state, D, a, ctx, input, out, fresh); return; }
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, t = tier070(own.rank);
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    let m;
    if (sp.k04){
      const p1a2 = H73E8_STANDIN & 1, kind = sp.k04 === 1 ? (p1a2 === 0 ? 1 : 2) : (p1a2 === 0 ? 2 : 1);
      m = [0, 5, 10][t] + (kind === 2 ? (H73E8_STANDIN & 3) + 1 : 0);
    } else m = sp.tiers[t];
    if (sp.s13){
      const r = make070s13(state, D, m, own, ctx, a.action, sp.frame);
      if (!r.S){ out.refused.push({ action: a.action, shell: 'shell13', mode: m, why: r.why }); continue; }
      state.shells.push(r.S); out.spawned.push(r.S);
      continue;
    }
    makePlain(state, D, a, ctx, out, own, state.prevJoints, { frame: sp.frame, shell: 'shell00', mode: m });
  }
}
const act070 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em070', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
SHELL_DATA.em070_00 = {
  name: 'Nerscylla',
  lists: { 0: { list: 'u', pel: 'em070_00u' } },
  shells: {
    shell00: { id: 0x129, cls: 'uShellEm070_00_00', base: 'base00', reader: 0xfac410, folder: 'shell\\em\\em070_00_shell00', modes: {
      0: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      1: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 15.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      2: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      3: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -15.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      4: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      5: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      6: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 15.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      7: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      8: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -15.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      9: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      10: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      11: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 15.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      12: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      13: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -15.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      14: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -30.0], [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      15: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [0, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, -325.70001220703125, 273.79998779296875], [0.0, 0.0, 0.0]]),
      16: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [0, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, -325.70001220703125, 273.79998779296875], [0.0, 0.0, 0.0]]),
      17: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [0, 0, 0], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, -325.70001220703125, 273.79998779296875], [0.0, 0.0, 0.0]]),
      18: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, -30.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      19: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, 30.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      20: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, 0.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      21: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, -30.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      22: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, 30.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      23: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, 0.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      24: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, -30.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      25: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, 30.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      26: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, -1, 2], [45.0, 250.0, 0.0, 0.0, 0.0], [[0.0, 10.0, -110.0], [0.0, 0.0, 0.0]]),
      27: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -22.5], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      28: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 22.5], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      29: m057(1.0, [[0, 0], [0, 1], [0, 1]], [0], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      30: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -22.5], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      31: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 22.5], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      32: m057(1.0, [[0, 0], [0, 1], [0, 1]], [1], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      33: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, -22.5], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      34: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 22.5], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
      35: m057(1.0, [[0, 0], [0, 1], [0, 1]], [2], [144, 0, 2], [45.0, 250.0, 0.0, 90.0, 0.0], [[0.0, -9.0, -110.0], [0.0, 0.0, 0.0]]),
    }, hitdata: [[0, 250], [0, 250], [0, 250]] },
    shell00_02: { id: 0x12a, cls: 'uShellEm070_00_00_02', base: 'base00', reader: 0xfac844, folder: 'shell\\em\\em070_00_shell00_02', modes: {
      0: m057(1.0, [[0, 90], [999, -1], [0, 91], [0, 91]], [0], [145, 4], [0.0, 90.0, 0.0, 0.0, 72.0], [[0.0, -0.625, 0.0], [0.0, -100.0, 0.0]]),
      1: m057(1.0, [[0, 100], [999, -1], [0, 101], [0, 101]], [1], [145, 4], [0.0, 90.0, 0.0, 0.0, 72.0], [[0.0, -0.625, 0.0], [0.0, -100.0, 0.0]]),
    }, hitdata: [[0, 99], [0, 99]] },
    shell01: { id: 0x12b, cls: 'uShellEm070_00_01', base: 'base01', reader: 0xfacc70, folder: 'shell\\em\\em070_00_shell01', modes: {
      0: m057(1.0, [[0, 2], [999, -1]], [0], [2, 0, 0], [0.0], []),
      1: m057(1.0, [[0, 2], [999, -1]], [1], [2, 0, 0], [0.0], []),
      2: m057(1.0, [[0, 2], [999, -1]], [2], [2, 0, 0], [0.0], []),
      3: m057(1.0, [[0, 2], [999, -1]], [3], [2, -1, -1], [0.0], []),
      4: m057(1.0, [[0, 2], [999, -1]], [3], [2, -1, -1], [0.0], []),
      5: m057(1.0, [[0, 2], [999, -1]], [4], [2, -1, -1], [0.0], []),
      6: m057(1.0, [[0, 91], [999, -1]], [5], [4, 0, 0], [0.0], []),
      7: m057(1.0, [[0, 101], [999, -1]], [6], [4, 0, 0], [0.0], []),
      8: m057(1.0, [[999, -1], [999, -1]], [7], [0, -1, -1], [0.0], []),
    }, hitdata: [[8, 150], [8, 150], [8, 150], [10, 10], [10, 10], [8, 10], [8, 10], [0, 10]] },
    shell13: { id: 0x12c, cls: 'uShellEm070_00_13', base: 'base13', reader: 0xface88, folder: 'shell\\em\\em070_00_shell13', modes: {
      0: m057(1.0, [[0, 0], [999, -1]], [0], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, -20.0, 0.0]]),
      1: m057(1.0, [[0, 0], [999, -1]], [0], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, 20.0, 0.0]]),
      2: m057(1.0, [[0, 0], [999, -1]], [0], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      3: m057(1.0, [[0, 0], [999, -1]], [1], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, -20.0, 0.0]]),
      4: m057(1.0, [[0, 0], [999, -1]], [1], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, 20.0, 0.0]]),
      5: m057(1.0, [[0, 0], [999, -1]], [1], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
      6: m057(1.0, [[0, 0], [999, -1]], [2], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, -20.0, 0.0]]),
      7: m057(1.0, [[0, 0], [999, -1]], [2], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, 20.0, 0.0]]),
      8: m057(1.0, [[0, 0], [999, -1]], [2], [-1, 2], [11.25, -0.75, 0.012500000186264515, 2000.0, 300.0, 180.0], [[0.0, 250.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]),
    }, hitdata: [[0, 99], [0, 99], [0, 99]] },
  },
  actions: [
    // the spits (sp_00) and balls (sp_13), each by the rank tier [low, high, G]
    act070(7, 0x04, '2', 'Motion[41]', [{ frame: 20, k04: 1 }, { frame: 42, k04: 2 }]),
    act070(7, 0x05, '2', 'Motion[57]', [{ frame: 66, s13: true, tiers: [0, 3, 6] }, { frame: 82, s13: true, tiers: [1, 4, 7] }, { frame: 98, s13: true, tiers: [2, 5, 8] }]),
    act070(7, 0x34, '2', 'Motion[57]', [{ frame: 64, tiers: [27, 30, 33] }, { frame: 82, tiers: [28, 31, 34] }, { frame: 96, tiers: [29, 32, 35] }]),
    act070(7, 0x07, '2', 'Motion[31]', [{ frame: 6, tiers: [15, 16, 17] }], { also: [[7, 0x09]] }),
    act070(7, 0x32, '2', 'Motion[13]', [{ frame: 36, tiers: [18, 21, 24] }, { frame: 52, tiers: [19, 22, 25] }, { frame: 66, tiers: [20, 23, 26] }]),
    // the drip: status 3's walks (0xfa2610 L0 M8, 0xfa2930 L0 M6)
    act070(3, 0x0c, '0', 'Motion[8]', [], { drip: true, also: [[3, 0x0d], [3, 0x1a], [3, 0x1b]] }),
    act070(3, 0x0e, '0', 'Motion[6]', [], { drip: true, also: [[3, 0x0f], [3, 0x10], [3, 0x11], [3, 0x12], [3, 0x13], [3, 0x14], [3, 0x15], [3, 0x16], [3, 0x17], [3, 0x18], [3, 0x19]] }),
  ],
};

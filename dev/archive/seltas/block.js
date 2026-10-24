// ---- SELTAS QUEEN (em069_00) / SELTAS (em076_00): readers, landings, base37, the spawners -----------------------------------
// dev/em069-em076-shells-spec.md; the rows of dev/rom-map.md "Seltas Queen / Seltas -- the shells". Checked against the ROM run on
// unicorn (scratchpad seltas/emu_seltas.py) by dev/shells-seltas-check.mjs.
//
// HER sp_00 READER 0xf9a8ac (READ whole, ..0xf9ab04): ef 0 / 1 / 2 / 3 -> +0x15c8 / +0x15cc / +0x15d4 / +0x15d0 (2 and 3 swapped);
// hit 0 -> +0x15d8; int 0 -> the joint +0x15dc; the flags +0x15e8 (base00's ctor 0) bfc / orrne: bit 0 = int 1 != -1 (base00's X
// aim 0x3f9378), bit 1 = int 2 != -1 (the Y aim 0x3f9cc4); int 3 / int 4 -> +0x15e0 / +0x15e4 (the landings' 0x43ac04 ids); floats
// 0 vz +0x15f4, 1 vy +0x15f8, 2 flight +0x15fc, 3 degX +0x15ec, 4 degY +0x15f0, 5 X hi +0x1604, 6 X lo +0x1600, 7 Y hi +0x160c,
// 8 Y lo +0x1608; vec 0 the offset +0x1610, vec 1 the gravity +0x161c, vec 2 the aim offset +0x1618; +0x1614 (the aim's from-vec)
// keeps the ctor's shared zero vector (0x3f8a8c). Modes 0..2: joint 1, flags 1 -- the joint's point plus (0, -80, 80) through its
// matrix, the owner's words, X aimed from HER position (+0x1614 zero, flag 4 clear: aimFrom001) at the target plus (0, 0, 80)
// turned by the aim's yaw, plus degX, clamped to [-45, 45]; Y + degY (0 / 6 / -6); 65 a move, no gravity, 150 moves. Mode 3: joint
// 0, offset / aim offset (0, 90, 380), clamp [0, 90].
function params069s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0);
  const k = { joint: I(0), flags, i1: I(3), i2: I(4), vz: F(0), vy: F(1), flight: F(2), degX: F(3), degY: F(4), xDeg: F(3), yDeg: F(4),
              xHi: F(5), xLo: F(6), yHi: F(7), yLo: F(8), vec: V(0), gravity: V(1), aimOff: V(2), from: ZERO3.slice() };
  if (flags & 2) k.why = 'uShellEm069_sp_00: base00 Y aim (0x3f9cc4, flag 2) is not transcribed in init00';
  return k;
}
// the X aim on flag bit 0 for the classes whose clamp is a real range (init00); `got`: owner001's block (her position, size,
// block +0x5c, the target)
const AIMX00 = { uShellEm069_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };
// HIS sp_00 READER 0xfd97ec (READ whole, ..0xfd9914): ef 0 / 1 / 2 / 3 -> +0x15c8 / +0x15cc / +0x15d4 / +0x15d0; hit 0 -> +0x15d8;
// int 0 -> the joint +0x15dc (144: read only by the joint arm, which 0x10 skips); +0x15e8 |= 0x30 (orr: 0x10 the REQUEST's point
// +0x10.., 0x20 the request's words +0x20..); floats 0 vz, 1 vy, 2 flight; vec 0 the offset, vec 1 the gravity. Nothing else: the
// degree offsets +0x15ec / +0x15f0 keep the ctor's 0 (0x3f8a6c clears +0x15ec..+0x160f). So the spawner aims it: 35 a move along
// its words, no gravity, 200 moves.
function params076s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 0x30, vz: F(0), vy: F(1), flight: F(2), degX: f(0), degY: f(0), vec: V(0), gravity: V(1) };
}
// HER sp_00 LANDING +0x150 0xf9ab08(shell, &point, &result, type) (READ whole): type 0 -> 0x43ac04(+0x15e0) and ef +0x15cc (ef 1,
// u 21), type 1 -> 0x43ac04(+0x15e4) and ef +0x15d0 (ef 3: (999, -1), nothing), each then a shell01 2 (0x3fa2bc(0x40): id 0x128,
// +0x10 the contact, +0x20 the zero vector, +0x30.. THIS shell's words +0xfe8.., +0x3c its +0x13dc; 0x48b884); type 2 -> ef +0x15d4
// (ef 2, u 21) and no shell01. Then vt +0x148(0). 0x3f8970 starts the param at the contact (contactStart).
function landing069s00(S, D, hit, ctx){
  const k = S.k, t = hit.type;
  if (t === 0 || t === 1){
    camera001(S, t === 0 ? k.i1 : k.i2);
    contactStart(S, D, t === 0 ? 1 : 3, hit.point, 'landing');
    ctx.create(S, 'shell01', { mode: 2, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  } else if (t === 2) contactStart(S, D, 2, hit.point, 'landing');
}
// HIS sp_00 LANDING +0x150 0xfd9918 (READ whole): type 0 -> 0x43ac04(+0x15e0, the ctor's -1) and ef +0x15cc (ef 1, u 21); type 2
// -> ef +0x15d4 (ef 2, u 21); type 1 -> 0x43ac04(+0x15e4) and ef +0x15d0 (ef 3, nothing), then shell01 (id 0x13a) mode 3 when this
// shell's mode (0x4a0ee4) is 3, else 2 (`cmp r6, #3; movwne r6, #2`), the setup as hers. Then vt +0x148(0).
function landing076s00(S, D, hit, ctx){
  const t = hit.type;
  if (t === 0) contactStart(S, D, 1, hit.point, 'landing');
  else if (t === 2) contactStart(S, D, 2, hit.point, 'landing');
  else if (t === 1){
    contactStart(S, D, 3, hit.point, 'landing');
    ctx.create(S, 'shell01', { mode: S.modeIndex === 3 ? 3 : 2, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  }
}
// HER sp_01 READER 0xf9adf0 (READ whole, ..0xf9af58): ef 0 -> +0x15c8 (no ef 1); hit 0 -> +0x15d8; the flags +0x15ec (bfc / orrne
// over the ctor's 0): bit 0 = int 0, 0x4 = int 1, 0x8 = int 2, 0x800 = int 4, 0x80 = int 5; int 3 -> +0x15e4 (the joint); float 0
// -> +0x15f4, float 1 -> +0x15f8 (the ground query's reach up / down; 0 -> 1e6 at the init); vec 0 -> +0x1608. The timer +0x15f0
// keeps the ctor's 0: each lives while its hit slot is on. Her +0x158 0xf9af5c registers slot 0 only (type 5 on mode 2, else
// 0x1f -- the hit side; slot 1 from +0x15dc, the ctor's -1). Past a file's end: -1 / 0.0 (the getters' defaults).
function params069s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 1 : 0) | (I(1) !== -1 ? 4 : 0) | (I(2) !== -1 ? 8 : 0) | (I(4) !== -1 ? 0x800 : 0) | (I(5) !== -1 ? 0x80 : 0);
  const why = !sh ? 'uShellEm069_sp_01: a mode SHELL_DATA does not carry' : null;
  return { flags, joint: I(3), timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), up: F(0), down: F(1), maxH: f(900.0), why,
           efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
// HIS sp_01 READER 0xfd9bb4 (READ whole, ..0xfd9c54): ef 0 -> +0x15c8; hit 0 -> +0x15d8; +0x15ec bits 0x4 = int 0, 0x8 = int 1;
// vec 0 -> +0x1608. The rest the ctor's (joint -1, timer 0, reaches 500, +0x1604 900). His modes: ints [0, 0] -> 0xc.
function params076s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const why = !sh ? 'uShellEm076_sp_01: a mode SHELL_DATA does not carry' : null;
  return { flags: (I(0) !== -1 ? 4 : 0) | (I(1) !== -1 ? 8 : 0), joint: -1, timer: f(0.0), f1600: f(0.0), f15fc: f(1.0), vec: V(0),
           up: f(500.0), down: f(500.0), maxH: f(900.0), why, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}

// ---- BASE37 (uShellEmBase37, vtable 0x17519ec; its one subclass uShellEm076_sp_37): SELTAS'S LOB ------------------------------
// READ whole (scratchpad seltas/b37.txt, 0x41ad38..0x41bf40): ctor 0x41b078, init +0x13c 0x41b1ec with its aim 0x41b844, move +0x24
// 0x41bb10 -> state 1 vt +0x158 0x41bc1c, landing +0x150 0x41ae14 (-> 0x41af6c: shell01), end +0x148 0x41bdf0, +0x15c 0x41bdb8 (hit
// slot 1, 0x4a15d4: not visual), +0x154 / +0x160 bx lr; the setup cSetupParamEmBase37 (0x50 bytes, allocated through 0x41add8).
// THE READER 0xfd9d70 (READ whole, ..0xfd9f78): ef 0 / 1 / 3 / 2 -> +0x15c8 / +0x15cc / +0x15d0 / +0x15d4; hit 0 -> +0x15d8; int 0
// -> +0x15e4 (the start joint), int 1 -> +0x15e8 (the link parent's joint); +0x15e0 (the ctor's 0) bit 0 = int 2 != -1, bit 1 = int
// 3 != -1; floats 0 -> +0x15ec (the speed), 2 -> +0x1600 (its growth per unit of distance), 1 -> +0x15f0 (the gravity y), 4 ->
// +0x15f8 (the shortest throw), 3 -> +0x15fc (the longest), 5 -> +0x15f4 (the life), 6 -> +0x1604 (the spread, degrees); vec 0 /
// 1 / 2 -> +0x1608 / +0x160c / +0x1610.
function params076s37(sh){
  const I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), linkJoint: I(1), flags: (I(2) !== -1 ? 1 : 0) | (I(3) !== -1 ? 2 : 0),
           speed: F(0), g: F(1), speedK: F(2), maxD: F(3), minD: F(4), life: F(5), spread: F(6), v0: V(0), v1: V(1), v2: V(2) };
}
// a vector's x / z turned by a u16 word (x cos + z sin, z cos - x sin; the word through vcvt.f32.u32 x 9.58738e-05), y kept
function turnXZ(v, w){
  const r = f(f(u16(w)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  return [mla(f(v[0] * cs), v[2], sn), v[1], mls(f(v[2] * cs), v[0], sn)];
}
// 0x41b844(shell, &from, &T): THE LOB. d = T - from; |d| below +0x15f8 -> d scaled to it (x, z; y only into the next test's
// length), above +0x15fc -> x / z scaled to it; h = the level distance; the level speed vz = +0x15ec + h x +0x1600, t = h / vz (0.5
// when vz == 0), vy = (d.y - g t^2 / 2) / t with the UNSCALED d.y; the velocity (0, vy, vz) turned by the yaw from `from` to T
// less the yaw from the owner (block +0x40) to its target (block +0x1d0), then by +0x1604 degrees when it is not 0.
function aim37s(k, from, T, own){
  let dx = f(T[0] - from[0]), dz = f(T[2] - from[2]);
  const dy = f(T[1] - from[1]);
  const d2 = mla(mla(f(dy * dy), dx, dx), dz, dz), len = sqrtf(d2);
  let dyp = dy;
  if (len < k.minD){ const s = f(k.minD * f(1.0 / sqrtf(d2))); dz = f(dz * s); dyp = f(dy * s); dx = f(dx * s); }
  if (!(len <= k.maxD)){ const L = sqrtf(mla(mla(f(dx * dx), dyp, dyp), dz, dz)), s = f(k.maxD * f(1.0 / L)); dz = f(dz * s); dx = f(dx * s); }
  const h = sqrtf(mla(mla(f(0.0), dx, dx), dz, dz));
  const vz = mla(k.speed, h, k.speedK);
  const t = vz !== 0 ? f(h / vz) : f(0.5);
  const vy = f(mls(dy, f(k.g * f(t * t)), f(0.5)) / t);
  const P = own.ownerPos, tg = own.target;
  const w1 = s32(mla(f(0.5), atan2f(f(tg[0] - P[0]), f(tg[2] - P[2])), RAD_TO_U16));
  const w2 = s32(mla(f(0.5), atan2f(f(T[0] - from[0]), f(T[2] - from[2])), RAD_TO_U16));
  let v = turnXZ([f(0.0), vy, vz], u16(w2 - w1));
  if (k.spread !== 0) v = turnXZ(v, u16(s32(mla(f(0.5), k.spread, DEG_TO_U16))));
  return v;
}
// the init 0x41b1ec (READ whole). `setup`: { offset } -- the request's +0x20.. (the spawner's kept offset, bit-0-clear modes);
// `own`: owner001's block (the position +0x40.., the words +0xfe8.. = ownerWords001, the target +0x1d0.., the size 0xbe518); `link`:
// the link parent (P+0x5c30, her) and its joint +0x15e8's yaw word -- with [e+0xcac0]+0x50 (the partner) the velocity also turns
// by it -- or null. Returns a refusal reason, or null.
function init37s(S, k, setup, own, J, link){
  const W = ownerWords001(own), P = own.ownerPos, tg = own.target;
  // the words: +0xfe8 = the owner's +0xfe8, +0xfec = the owner's +0xfec + u16(the spread as a word) (uxtah), +0xff0 = 0
  S.angles = [W[0], (W[1] + u16(s32(mla(f(0.5), k.spread, DEG_TO_U16)))) >>> 0, 0];
  S.timer = k.life;                                          // +0x1614 = +0x15f4
  let from, T, v;
  if (k.flags & 1){
    // 0x41b3c8: +0x40 = the joint's point (0xc164c) + vec 0 (no turn); the yaw r7 = the parent's joint yaw + block +0x54 when
    // linked (P+0x5c30), else block +0x54 (0x41b4ec)
    const M = jointMatrix(J, k.joint);
    if (!M) return 'no matrix for joint ' + k.joint;
    S.position = [f(k.v0[0] + M[12]), f(k.v0[1] + M[13]), f(k.v0[2] + M[14])];
    const yaw = u16(link ? (link.word + own.ownerY) : own.ownerY);
    const sz = size001(own), r = f(f(yaw) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const a = f(sz * k.v2[0]), b = f(sz * k.v2[2]);
    from = [f(P[0] + mla(f(a * cs), b, sn)), mla(P[1], sz, k.v2[1]), f(P[2] + mls(f(b * cs), a, sn))];
    T = [f(tg[0] + mla(f(k.v1[0] * cs), k.v1[2], sn)), f(tg[1] + k.v1[1]), f(tg[2] + mls(f(k.v1[2] * cs), k.v1[0], sn))];
    v = aim37s(k, from, T, own);
    if (link && link.partner) v = turnXZ(v, u16(link.word));   // 0x41b5f4..0x41b69c
  } else {
    // 0x41b2c0: +0x40 = the owner's position + the request's +0x20..; from = the joint's point (bit 1) or the owner's position + vec 1
    // turned by block +0x54 (0x41b344); T = the target + vec 2
    S.position = [f(setup.offset[0] + P[0]), f(setup.offset[1] + P[1]), f(setup.offset[2] + P[2])];
    if (k.flags & 2){
      const M = jointMatrix(J, k.joint);
      if (!M) return 'no matrix for joint ' + k.joint;
      from = [M[12], M[13], M[14]];
    } else {
      const r = f(f(u16(own.ownerY)) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
      from = [f(P[0] + mla(f(k.v1[0] * cs), k.v1[2], sn)), f(P[1] + k.v1[1]), f(P[2] + mls(f(k.v1[2] * cs), k.v1[0], sn))];
    }
    T = [f(k.v2[0] + tg[0]), f(k.v2[1] + tg[1]), f(k.v2[2] + tg[2])];
    v = aim37s(k, from, T, own);
  }
  S.velocity = turnXZ(v, W[1]);                              // 0x41b6a0: by the OWNER's +0xfec word (ldrh)
  S.gravity = [f(0.0), k.g, f(0.0)];                         // +0x1020.. = (0, +0x15f0, 0), +0x102c = 0
  S.anchor = S.position.slice();
  S.launch = { from, T, velocity: S.velocity.slice(), position: S.position.slice(), angles: S.angles.slice(), timer: S.timer,
               link: link ? { word: link.word, partner: !!link.partner } : null };
  return null;
}
// the state-1 move 0x41bc1c: +0x1378 += dt (hit side), anchor = position, 0x539224 (stepFlight), the owner active (always in the
// viewer), the timer +0x1614 (flightTimer's arms), the collide (0x43ac6c / 0x43ac8c: base00's query, mask 0x30), the landing
function move37s(S, ctx, D){
  S.anchor = S.position.slice();
  stepFlight(S, ctx.dt);
  const r = flightTimer(S, S.k.life, ctx.dt);
  if (r !== 'query') return r;
  const hit = collide(S, null, ctx.stage);
  if (!hit) return 'keep';
  S.events.push({ ev: 'hit', point: hit.point, type: hit.type });
  landing37s(S, D, hit, ctx);
  return 'end';
}
// the landing +0x150 0x41ae14 (READ): type 1 -> ef +0x15d0 (ef 3: (999, -1), nothing) at the contact (handle +0x1648), then
// 0x41af6c -- byte +0x15c0 = 1 and a shell01 (id 0x13a, a LITERAL in the base's code) of mode 0 for this shell's modes 0..5, 1 for
// 6..8, at the contact with this shell's words, +0x20 the zero vector, +0x3c its +0x13dc; type 0 -> ef +0x15cc (ef 1); type 2 ->
// ef +0x15d4 (ef 2). Then vt +0x148(0): the end stops the flight's handle +0x1644 gracefully and waits (stepRock's 0xfe arm).
function landing37s(S, D, hit, ctx){
  const t = hit.type;
  if (t === 1){
    contactStart(S, D, 3, hit.point, 'landing');
    S.b15c0 = 1;
    const m = S.modeIndex < 6 ? 0 : (S.modeIndex - 6 < 3 ? 1 : S.modeIndex);
    ctx.create(S, 'shell01', { mode: m, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0) });
  } else if (t === 0) contactStart(S, D, 1, hit.point, 'landing');
  else if (t === 2) contactStart(S, D, 2, hit.point, 'landing');
}
function make37s(state, D, m, J, own, ctx, action, frame, setup, link){
  const def = D.shells.shell37, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell37 mode ' + m + ' not in SHELL_DATA' };
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell37', cls: def.cls, globalId: def.id, base: def.base,
              mode, modeIndex: m, action, spawnFrame: frame, motion: ctx.motion, state: 1, k: params076s37(mode.sh),
              position: null, prevPosition: null, anchor: null, angles: null, velocity: null, gravity: null, trail: null,
              timer: 0, moves: 0, bounces: 0, held: false, launch: null, events: [], folder: def.folder,
              effect: null, effect2: null, start: null, place: null, stop: null, slots: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  const why = init37s(S, S.k, setup, own, J, link);
  if (why) return { why };
  S.prevPosition = S.position.slice();
  // ef +0x15c8 at +0x40 on the shell (0x41b74c..0x41b7c4: 0x4a10c8 / 0x4a11e4) -> +0x1644
  S.start = rockRequest(D, mode, 0, S.position, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  // the hit registration (0x4a1ad8 -> vt +0x140, slot 0; +0x15c slot 1): the hit side, counted with input.hitLife only
  if (own.hitLife) S.slots = slotsOf011(def, mode, ctx.out ? ctx.out.refused : null).filter(sl => sl.slot === 0);
  return { S };
}

// THE LINK PARENT's yaw the spawners read (P+0x5c30, the unit he is linked to -- her; its joint 200 / +0x15e8 through vt +0xd0):
// u16(s32(0.5 + atan2(row 2's x, row 2's z) x 10430.378)). input.link = { word, partner } (index.html: his frame while mounted);
// none solo
const link076 = input => (input.link && Number.isFinite(input.link.word)) ? { word: input.link.word | 0, partner: input.link.partner !== false } : null;
// 0xfd4924 (READ whole): THE SPIT'S PITCH, at the action's start -- from joint 144 (0xc164c) plus (0, 0, 0) turned by the yaw to the
// target (the literal 0.0 offset, 0xfd4ae4) to the target block +0x1d0..: the word of atan2(-dy, h), in degrees (x 0.0054931641),
// above 180 less 360, at most 90, at least 0 -> [e+0xcac0]+6 as a word (x 182.04445 + 0.5); [+0xcac0]+8 = 0x16b4b4's draw (the
// setup's +0x2e: the hit side's)
function aim076(own, J){
  const P = own.ownerPos, T = own.target, Z = f(0.0);
  const yaw = u16(s32(mla(f(0.5), atan2f(f(T[0] - P[0]), f(T[2] - P[2])), RAD_TO_U16)));
  const r = f(f(yaw) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const M = jointMatrix(J, 0x90);
  if (!M) return null;
  const a = f(sn * Z), b = f(cs * Z);
  const p = [f(f(a + b) + M[12]), f(M[13] + Z), f(f(b - a) + M[14])];
  const tx = f(T[0] + Z), tz = f(T[2] + Z), ty = f(T[1] + Z);
  const dz = f(tz - p[2]), dx = f(tx - p[0]);
  const h = sqrtf(mla(f(dz * dz), dx, dx)), dy = f(ty - p[1]);
  const w = u16(s32(mla(f(0.5), atan2f(f(-dy), h), RAD_TO_U16)));
  let deg = f(f(w) * U16_TO_DEG);
  if (deg >= f(180.0)) deg = f(deg + f(-360.0));
  deg = Math.min(deg, f(90.0));                               // vmin
  if (f(0.0) >= deg) deg = f(0.0);
  return u16(s32(mla(f(0.5), deg, DEG_TO_U16)));
}
// 0xfd4b00(e, arg) (READ whole): at each crossing of 68 / 88 / 96 -- the pitch [+0xcac0]+6 plus 0x16a17d4[k] (k the shot counter
// P+0x1a2: 0x889 / 0 / 0xfb07 / 0, 32-bit), in degrees, wrapped, clamped [0, 90] as above, the X word; P+0x1a2 += 1 while k <= 2;
// joint 144's point (0xc164c); the Y word block +0x54 plus, linked, the parent's joint 200 yaw (0xfd4c08..0xfd4c48); the X word
// block +0x50 + u16(X - block +0x50) (uxtah). arg 0 (variant 0 only): ONE shell00 of mode k (k >= 3: 0); arg 1: one of mode 3; arg 2:
// two of mode 3, the second's X word + 0x38e. Each a base00 setup (0x3f883c(0x30)): +0x10.. the point, +0x20.. the words (Z 0),
// +0x2c 0, +0x2e [+0xcac0]+8; 0x48b884.
const SPIT076 = [0x889, 0, 0xfb07, 0];
function spit076(state, D, a, sp, at, ctx, own, J, link, out){
  const st = state.spit076;
  if (!st || st.pitch == null){ out.refused.push({ action: a.action, shell: 'shell00', why: 'no spit pitch (0xfd4924: no joint 144 or no target at the start)' }); return; }
  const k = st.shot;
  let deg = f(f((SPIT076[k] + st.pitch) >>> 0) * U16_TO_DEG);
  if (deg >= f(180.0)) deg = f(deg + f(-360.0));
  deg = Math.min(deg, f(90.0));
  if (f(0.0) >= deg) deg = f(0.0);
  const X = s32(mla(f(0.5), deg, DEG_TO_U16));
  if (k <= 2) st.shot = k + 1;
  const M = jointMatrix(J, 0x90);
  if (!M){ out.refused.push({ action: a.action, shell: 'shell00', why: 'no matrix for joint 144' }); return; }
  const pos = [M[12], M[13], M[14]];
  const Y = ((own.ownerY >>> 0) + (link ? u16(link.word) : 0)) >>> 0;
  const Xw = ((own.ownerX >>> 0) + u16(X - (own.ownerX >>> 0))) >>> 0;
  const list = sp.spit === 0 ? [[k < 3 ? k : 0, Xw]] : sp.spit === 1 ? [[3, Xw]] : [[3, Xw], [3, (Xw + 0x38e) >>> 0]];
  for (const [m, xw] of list){
    const got = Object.assign({}, own, { requestPos: pos.slice(), requestAngles: [xw, Y, 0] });
    const S = make00n(state, D, m, J, got, ctx, a.action, at);
    if (S){ S.spit = { shot: k, pitch: st.pitch, X, arg: sp.spit }; state.shells.push(S); out.spawned.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: m, why: 'base00 init refused (no request point)' });
  }
}
// HER actions (SHELL_DATA.em069_00.actions), the fresh step too: `atStart` rows on the clip's first step, frame rows by pass001 on
// the previous pose's joints; `linked`: (7, 0x38)'s gate P+0x1bb & 1 (input.linked: the viewer's combined list with Seltas on her)
function spawn069(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001;
  for (const sp of a.spawns){
    const due = sp.atStart ? fresh : (!fresh && !!state.hist && !!state.prevJoints && pass001(state, f(sp.frame)));
    if (!due) continue;
    const at = sp.atStart ? 0 : sp.frame, J = state.prevJoints || ctx.J;
    if (sp.linked && !input.linked) continue;                // 0xf95588 `tst #1; beq`: unlinked, no spit (not a refusal)
    if (sp.shell === 'shell00'){
      const why = missing001(own, { facing: true, pos: true, target: true });
      if (why){ out.refused.push({ action: a.action, shell: 'shell00', modes: sp.modes.slice(), why }); continue; }
      for (const m of sp.modes){
        const md = D.shells.shell00.modes[m], k = md ? params069s00(D.shells.shell00, md) : null;
        if (k && k.why){ out.refused.push({ action: a.action, shell: 'shell00', mode: m, why: k.why }); continue; }
        const S = make00n(state, D, m, J, own, ctx, a.action, at);
        if (S){ state.shells.push(S); out.spawned.push(S); }
        else out.refused.push({ action: a.action, shell: 'shell00', mode: m, why: 'no matrix for joint ' + (md ? md.sh.ints[0] : '?') });
      }
    } else if (sp.shell === 'shell01'){
      // 0x3fa2bc(0x40): id 0x128, the mode, owner her, +0x10 the zero vector, +0x30.. the zero words 0x1620e60, +0x3c 0xffff
      const why = missing001(own, { facing: true, pos: true, ground: true });
      if (why){ out.refused.push({ action: a.action, shell: 'shell01', modes: sp.modes.slice(), why }); continue; }
      for (const m of sp.modes){
        const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: [0, 0, 0], angles: [0, 0, 0], action: a.action, frame: at },
                          own, J, ctx, null);
        if (S){ state.shells.push(S); out.spawned.push(S); }
        else out.refused.push({ action: a.action, shell: 'shell01', mode: m, why: 'base01 init deleted it (900 above the ground)' });
      }
    } else throw new Error('shells.js: em069 spawn of ' + sp.shell + ' not transcribed');
  }
}
// HIS actions (SHELL_DATA.em076_00.actions): the spit (fresh: the shot counter P+0x1a2 = 0 and the pitch 0xfd4924, on the joints the
// action's first update reads), the lobs (a `keep` row stores joint 144 less his position, + its y, in P+0x30.. -- the start of that
// row's shell and the later ones of the play)
function spawn076(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001, link = link076(input);
  if (fresh){
    state.spit076 = null; state.off076 = null;
    if (a.spawns.some(sp => sp.spit != null))
      state.spit076 = { shot: 0, pitch: own.ownerPos && own.target ? aim076(own, state.prevJoints || ctx.J) : null };
  }
  for (const sp of a.spawns){
    const due = sp.atStart ? fresh : (!fresh && !!state.hist && !!state.prevJoints && pass001(state, f(sp.frame)));
    if (!due) continue;
    const at = sp.atStart ? 0 : sp.frame, J = state.prevJoints || ctx.J;
    const why = missing001(own, { facing: true, pos: true, target: true });
    if (why){ out.refused.push({ action: a.action, shell: sp.shell || 'shell00', why }); continue; }
    if (sp.spit != null){ spit076(state, D, a, sp, at, ctx, own, J, link, out); continue; }
    if (sp.shell !== 'shell37') throw new Error('shells.js: em076 spawn of ' + sp.shell + ' not transcribed');
    if (sp.keep != null){
      const M = jointMatrix(J, 0x90);
      if (!M){ out.refused.push({ action: a.action, shell: 'shell37', why: 'no matrix for joint 144' }); continue; }
      const P = own.ownerPos;
      state.off076 = [f(M[12] - P[0]), f(f(M[13] - P[1]) + f(sp.keep)), f(M[14] - P[2])];
    }
    for (const m of sp.modes){
      const r = make37s(state, D, m, J, own, ctx, a.action, at, { offset: state.off076 || [0, 0, 0] }, link);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); }
      else out.refused.push({ action: a.action, shell: 'shell37', mode: m, why: r.why });
    }
  }
}


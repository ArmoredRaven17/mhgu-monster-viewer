
// ---- AHTAL-NESET (em087_00, uEm087_00): his shells -- dev/ahtal-neset-shells-spec.md (2026-10-19) -------------------------------
// Ids are IMMEDIATES (vt+0x158 0x10aa3a0): 0x176 sp_00, 0x177 sp_01, 0x178 sp_48, 0x179 sp_58, 0x17a sp_59 (the rocket). Almost all are
// made by the shared per-motion EVENT walker 0x6c590 (rom-map; his table 0x1803de8, the selector e+0xcac8 set by EMC op a3 (0, n) and
// taken at the action's start 0x6cb14): a row of the action's selector, of the playing motion (0xb0950), fires its type when its kind
// holds -- kind 1 = the frame crossing of f0 (0xb0968 mode 0 = 0x72714 mode 0: pass001) -- and types > 6 go to his vt+0x480 0x10ab6c0.
// Here: type 10 (sp_01). Rows: <scratchpad>/neset/rows087.json (seq087.txt x emcpair087.txt, the walk's reach).
//
// sp_01's reader 0x10c229c (READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15d8; int 0 -> +0x15e8 (a sound); float 1 -> the timer +0x15f0;
// &vec 0 -> +0x1608; float 0 -> +0x1654, a DELAY. No flag (+0x15ec the ctor's 0): base01's init places it at the setup's point plus the
// vec turned by the words (X, Y, Z), times the size.
function params087s01(sh){
  const F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { flags: 0, joint: -1, timer: F(1), f1600: f(0.0), f15fc: f(1.0), vec: sh && sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0],
           up: f(500.0), down: f(500.0), maxH: f(900.0), delay087: F(0),
           why: !sh ? 'uShellEm087_sp_01: a mode its files do not carry' : null };
}
READERS01[0x10c229c] = sh => params087s01(sh);
// sp_01's +0x150 0x10c2344 (READ whole), from base01's move after its timer test: the delay +0x1654 > 0 is counted down by dt (kept
// >= 0, 0x10c2368's literal 0.0); at <= 0 -> 0x10c23b4 then vt+0x148(0), the end. A delay that starts at 0 never fires. 0x10c23b4 (id
// 0x177 only): sp_01 (0x177) mode [1, 2, 0, 0, 5, 6, 0, 0, 9, 10][mode] (table 0x16a38e0; mode > 9: 0) at its own point +0x40 with its
// own words +0xfe8.., +0x3c its +0x13dc -- the chains 0 -> 1 -> 2, 4 -> 5 -> 6, 8 -> 9 -> 10
const T087S01 = [1, 2, 0, 0, 5, 6, 0, 0, 9, 10];
function delay087s01(S, ctx){
  const t = S.k.delay087;
  if (!(t > 0)) return 'keep';
  const u = f(t - ctx.dt);
  S.k.delay087 = f(0.0) >= u ? f(0.0) : u;
  if (!(u <= 0)) return 'keep';
  const m = S.modeIndex;
  ctx.create(S, 'shell01', { mode: m <= 9 ? T087S01[m] : 0, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) });
  return 'end';
}
// the type-10 / (7, 4) maker (0x10ab800 / 0x10abc08): the joint's world point (0xc164c) with y = 0 (`str sb (0), [sp, #4]`), the words
// (block X, u16(block Y + s32(0.5 + deg x 182.04)), block Z), +0x3c 0xffff; sp_01 mode m
function make087s01(state, D, a, sp, own, J, ctx, out){
  const M = jointMatrix(J, sp.joint);
  if (!M){ out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why: 'no joint ' + sp.joint }); return; }
  const Y = u16(((own.ownerY >>> 0) + s32(mla(f(0.5), f(sp.deg || 0), DEG_TO_U16))) >>> 0);
  const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: sp.mode, position: [f(M[12]), f(0.0), f(M[14])],
                                            angles: [own.ownerX >>> 0, Y, own.ownerZ >>> 0], action: a.action, frame: sp.frame }, own, J, ctx, null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}
// the spawner (code 'em087'): rows { frame | start, ev: 10, mode, joint, deg }
function spawn087(state, D, a, ctx, input, out, fresh){
  const own = ctx.own001, J = state.prevJoints || ctx.J;
  for (const sp of a.spawns){
    const due = sp.start ? fresh : (!!state.hist && pass001(state, f(sp.frame)));
    if (!due) continue;
    if (!own.ownerPos || !own.facing){ out.refused.push({ action: a.action, shell: 'shell01', mode: sp.mode, why: 'no owner position / facing' }); continue; }
    if (sp.ev === 10) make087s01(state, D, a, sp, own, J, ctx, out);
    else if (sp.ev === 11) make087s58(state, D, a, sp, ctx, out);
    else if (sp.ev === 9) make087s48(state, D, a, sp, own, J, ctx, out);
  }
}

// ---- BASE48 (uShellEmBase48; his sp_48 0x178): THE MORTAR -- dev/ahtal-neset-shells-spec.md §4. Band 0x426634..0x427b24 (rom-map; the
// Ka agent's read <scratchpad>\sh88\b48\shell48-spec.txt, re-read here for Neset's own path: the joint start and the block target).
// READ: init 0x426abc, move 0x427294, step +0x158 0x4273a0, impact +0x150 0x4267e8, end +0x148 0x4278b0; his reader 0x10c25cc,
// +0x160 0x10c27b4 (the impact test), +0x164 0x10c28f4 (a sound, 0x4a1430 id 0xff: not visual).
// His reader 0x10c25cc (READ whole; NOT Ka's 0x10c415c): ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; int 0 -> +0x15dc (the target
// slot), int 1 -> +0x15e0 (the start joint), int 2 -> +0x15e4 (the marker's kind); floats 0..7 -> +0x15e8..+0x1604 (life, rise time,
// drop time, height, short, max, min, time per 1000); &vec 0 / 1 / 2 -> +0x1608 / +0x160c / +0x1610 (start offset, -, target offset)
function params087s48(mode){
  const sh = mode.sh, F = i => f(i < sh.floats.length ? sh.floats[i] : 0), I = i => i < sh.ints.length ? sh.ints[i] : -1;
  const V = i => sh.vecs[i] ? sh.vecs[i].map(f) : [f(0), f(0), f(0)];
  return { slot: I(0), joint: I(1), kind: I(2), life: F(0), rise: F(1), drop: F(2), height: F(3), short: F(4), max: F(5), min: F(6),
           per: F(7), vec0: V(0), vec2: V(2) };
}
const ang048 = r => u16(s32(mla(f(0.5), r, RAD_TO_U16)));
// vt+0x480's type 9 (0x10ab7ac, READ): sp_48 (0x178) mode u32(a0), setup 0x18 (0x4266a0) with +0x10 = +0x14 = 0 -- so the init takes
// its OWN start and target: the start = vec 0 through joint int 1's matrix (0xc15a4; homogeneous, / w, w == 0 -> 0: jointPoint); the
// target = the owner block's P+0x1d0 + 16 x int 0 (the viewer's target, slot 0) + vec 2 turned by the bearing to it (w1). The init
// 0x426abc (READ whole): life = float 0; B (+0x1650, the marker) = the start; the range d (x / z) min float 5, max float 6 -> D; T0
// (+0x1618) = rise + per x (D - min) / 1000; w2 the bearing start -> aim; the apex P1 (+0x1630) = start + (D - short) along w2, y + height;
// the aim (+0x1640) re-made at exactly D along w2, y = the target's; v = (0, 2 height / T0, (D - short) / T0), a = (0, -2 height / T0^2, 0),
// both turned by w2; B's track to the aim (vB = 2 dB / T0, aB = -2 dB / T0^2 along w3); ef 0 started at the start on the shell (no
// override) -> +0x161c; state 1. The compiler's x 0.0 terms kept.
function make087s48(st, D, a, sp, own, J, ctx, out){
  const def = D.shells.shell48, m = sp.mode >>> 0, mode = def && def.modes[m];
  const no = why => out.refused.push({ action: a.action, shell: 'shell48', mode: m, why });
  if (!mode) return no('uShellEm087_sp_48 mode ' + m + ': no files');
  const k = params087s48(mode), lists = def.lists || D.lists, Z = f(0.0);
  const M = jointMatrix(J, k.joint);
  if (!M) return no('no joint ' + k.joint);
  if (k.slot !== 0) return no('target slot ' + k.slot + ' (P+0x1d0 + 16 x slot): the viewer gives slot 0 only');
  if (!own.target) return no('no target (input.rock.target)');
  const pos = jointPoint(M, k.vec0, 0, 0, null).P, T = own.target, v2 = k.vec2;
  // the target offset turned by w1
  let r = f(f(ang048(atan2f(f(T[0] - pos[0]), f(T[2] - pos[2])))) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
  const AY = f(T[1] + v2[1]);
  let aim = [f(T[0] + mla(f(v2[0] * cs), v2[2], sn)), AY, f(T[2] + mls(f(v2[2] * cs), v2[0], sn))];
  // the range
  const dx = f(pos[0] - aim[0]), dz = f(pos[2] - aim[2]);
  const d = sqrtf(mla(mla(Z, dx, dx), dz, dz));
  const d1 = k.max > d ? d : k.max, Dr = d1 > k.min ? d1 : k.min;
  const T0 = mla(k.rise, k.per, f(f(Dr - k.min) / f(1000.0)));
  // the apex and the aim along w2
  r = f(f(ang048(atan2f(f(aim[0] - pos[0]), f(aim[2] - pos[2])))) * U16_TO_RAD); sn = sinf(r); cs = cosf(r);
  const L = f(Dr - k.short);
  const P1 = [f(pos[0] + mla(f(cs * Z), L, sn)), f(k.height + f(pos[1] + Z)), f(pos[2] + mls(f(L * cs), sn, Z))];
  aim = [f(pos[0] + mla(f(Z * cs), Dr, sn)), AY, f(pos[2] + mls(f(Dr * cs), Z, sn))];
  // the flight to the apex
  const vz = f(L / T0), vy = f(f(k.height + k.height) / T0), ay = f(f(k.height * f(-2.0)) / f(T0 * T0));
  const vel = [mla(f(cs * Z), vz, sn), vy, mls(f(vz * cs), sn, Z)];
  const acc = [mla(f(Z * cs), Z, sn), ay, mls(f(Z * cs), Z, sn)];
  // the marker B's track
  const B = [pos[0], AY, pos[2]];
  const bx = f(B[0] - aim[0]), bz = f(B[2] - aim[2]);
  const dB = sqrtf(mla(mla(Z, bx, bx), bz, bz));
  const vBz = f(f(dB + dB) / T0), aBz = f(f(dB * f(-2.0)) / f(T0 * T0));
  r = f(f(ang048(atan2f(f(aim[0] - B[0]), f(aim[2] - B[2])))) * U16_TO_RAD); sn = sinf(r); cs = cosf(r);
  const vB = [mla(f(Z * cs), vBz, sn), Z, mls(f(vBz * cs), Z, sn)], aB = [mla(f(Z * cs), aBz, sn), Z, mls(f(aBz * cs), Z, sn)];
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell48', cls: def.cls, globalId: def.id, base: 'base48', mode, modeIndex: m,
              action: a.action, spawnFrame: sp.frame, motion: ctx.motion, state: 1, k, lists, timer: k.life, T0, P1, aim, B, vB, aB,
              position: pos.slice(), anchor: pos.slice(), velocity: vel, gravity: acc, angles: [0, 0, 0], moves: 0, events: [],
              folder: def.folder, effect: null, effect2: null, start: null, stop: null, unitScale: f(mode.scale) };
  S.launch = { position: pos.slice(), velocity: vel.slice(), gravity: acc.slice(), angles: [0, 0, 0], timer: k.life };
  if (mode.ef[0]){
    const rq = rockRequest(D, mode, 0, pos, 'flight', lists);
    if (rq){ S.start = rq; S.effect = { param: 0, key: rq.key }; }
  }
  st.shells.push(S); out.spawned.push(S);
}
// the end 0x4278b0(flag): not ending -> ef 0's handle +0x161c stopped (0x43b058(h, flag): gracefully for 0), 0x4a1de4 (the hits), vt+0x154
// (bx lr), state 0xfe, +0x1614 = [0x162493c] x 60. The impact's handle +0x1620 is NOT stopped
function end48(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  S.state = 0xfe; S.timer = ENDING_FRAMES;
  out.ended.push(S);
}
// the move 0x427294: 0x4a1698 (the hit side), the handles +0x161c / +0x1620 dropped when their unit left states 1 / 2; state 1 -> the step
// +0x158 0x4273a0; 0xfe -> +0x1614 counted down (out -> deleted), either handle live -> kept, else 0xff. The step: the owner gone
// (0x4a0f38) -> the end; +0x1000 = +0x40; 0x539224 (stepFlight); the words Y = atan2(vx, vz), X = atan2(-vy, |(vx, vz)|) (Z kept); B
// integrated (its own order: a1 = dt aB, B += dt vB + dt a1 / 2, vB += a1); T0 counted down by the step: run out (once) -> THE DROP:
// v = (0, 0, |P1 - aim| (x / z) / drop) and a = (0, 2 (aim.y - P1.y) / drop^2, 0) turned by w4 (P1 -> aim), the position NOT reset, B =
// the aim, vB = aB = 0, his +0x164 (a sound); 0x43b2b0 (B's ground marker: INFERRED a shadow, not built); the life (float 0 > 0) counted
// down, out -> the end; his +0x160 0x10c27b4: no hunter hit (+0x13ae 0xff) and y <= 0 -> +0x150 0x4267e8 kind 1: ef 1 started at (x, 0,
// z) on the shell (no override) -> +0x1620, then the end (THE GROUND IS THE WORLD PLANE y = 0, not the stage)
function step48(S, J, ctx, input, D, out){
  S.moves++;
  const alive = p => !input.effectAlive ? true : !!input.effectAlive(S, p, p ? S.effect2 : S.effect);
  if (S.effect && !alive(0)) S.effect = null;
  if (S.effect2 && S.effect2.started && !alive(1)) S.effect2 = null;
  const dt = ctx.dt, Z = f(0.0);
  if (S.state === 0xfe){
    const T = S.timer;
    if (!(T > 0)){ S.timer = f(0); S.state = 0xff; return; }
    const n = f(T - dt);
    S.timer = f(0) >= n ? f(0) : n;
    if (!(n > 0) || (!S.effect && !S.effect2)) S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  if (!ctx.own001.ownerPos){ end48(S, out); return; }
  S.anchor = S.position.slice();
  stepFlight(S, dt);
  const v = S.velocity;
  const Y = ang048(atan2f(v[0], v[2]));
  const hs = sqrtf(mla(f(v[2] * v[2]), v[0], v[0]));
  S.angles = [ang048(atan2f(f(-v[1]), hs)), Y, S.angles[2]];
  for (let i = 0; i < 3; i++){
    const a1 = f(dt * S.aB[i]);
    S.B[i] = f(mla(f(f(dt * a1) * f(0.5)), dt, S.vB[i]) + S.B[i]);
    S.vB[i] = f(a1 + S.vB[i]);
  }
  let drop = false;
  if (S.T0 !== 0){
    if (!(S.T0 > 0)){ S.T0 = f(0); drop = true; }
    else { const n = f(S.T0 - dt); S.T0 = f(0) >= n ? f(0) : n; drop = !(n > 0); }
  }
  if (drop){
    const P1 = S.P1, aim = S.aim, k = S.k;
    const r = f(f(ang048(atan2f(f(aim[0] - P1[0]), f(aim[2] - P1[2])))) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    const px = f(P1[0] - aim[0]), pz = f(P1[2] - aim[2]);
    const dist = sqrtf(mla(mla(Z, px, px), pz, pz));
    const vz = f(dist / k.drop), dy = f(aim[1] - P1[1]), ay = f(f(dy + dy) / f(k.drop * k.drop));
    S.velocity = [mla(f(cs * Z), vz, sn), Z, mls(f(vz * cs), sn, Z)];
    S.gravity = [mla(f(Z * cs), Z, sn), ay, mls(f(Z * cs), Z, sn)];
    S.B = aim.slice(); S.vB = [Z, Z, Z]; S.aB = [Z, Z, Z];
  }
  if (S.k.life > 0){
    const T = S.timer;
    if (!(T > 0)){ S.timer = f(0); end48(S, out); return; }
    const n = f(T - dt);
    S.timer = f(0) >= n ? f(0) : n;
    if (!(n > 0)){ end48(S, out); return; }
  }
  // his +0x160 0x10c27b4 -> +0x150 0x4267e8 kind 1
  const p = S.position;
  if (!(p[1] <= 0)) return;
  const pt = [p[0], f(0), p[2]];
  if (S.mode.ef[1]){
    const rq = rockRequest(D, S.mode, 1, pt, 'landing', S.lists);
    if (rq){ out.started.push({ shell: S, start: rq }); S.effect2 = { param: 1, key: rq.key, started: true }; }
  }
  end48(S, out);
}

// ---- BASE58 (uShellEmBase58; his sp_58 0x179): THE GROUND BEAM -- dev/ahtal-neset-shells-spec.md §3. Its band 0x4334c8..0x434a94
// (rom-map; setup-new 0x4334c8, alloc 0x433534, ctor 0x433570): READ init 0x4336e8, vt+0x18 0x433844, 0x433968, the step 0x433a74,
// +0x150 0x433b0c, 0x433d9c, 0x433fb4, 0x4340fc, 0x4342ac, +0x154 0x434548, the end +0x148 0x4345d0, +0x158 0x434688; his +0x15c 0x10c2d04
// sp_58's reader 0x10c2a50 (READ whole): ef 0 / 1 -> +0x1638 / +0x163c; cmn ints 0..3 / cmn float 0 -> +0x1640..+0x1650 (the sound's);
// hit 0 -> +0x1654; int 0 -> the joint +0x1658; int 1 != -1 -> +0x1680 bit 0 (aim at the target); floats 1, 0, 3, 2, 4..8 -> +0x165c the
// reach, +0x1660 the life, +0x1664 the pitch's delay, +0x1668 the first pitch (deg), +0x166c the pitch rate (deg / frame), +0x1670 /
// +0x1674 the pitch's bounds, +0x1678 / +0x167c the yaw's bounds (deg); &vec 0 -> +0x1684 (the offset from the joint)
function params087s58(mode){
  const sh = mode.sh, F = i => f(i < sh.floats.length ? sh.floats[i] : 0), I = i => i < sh.ints.length ? sh.ints[i] : -1;
  return { joint: I(0), aim: I(1) !== -1, reach: F(1), life: F(0), delay: F(3), pitch0: F(2), rate: F(4), pLo: F(5), pHi: F(6),
           yLo: F(7), yHi: F(8), vec: sh.vecs[0] ? sh.vecs[0].map(f) : [0, 0, 0] };
}
// a word kept in [lo, hi] (s32 words, 0x433e5c.. / 0x433f68..): outside, the nearer bound by the far arc's midpoint (0x8000 | span >> 1)
function clamp058(w, lo, hi){
  const span = u16(hi - lo), d = u16(w - lo);
  if (!(d > span)) return w;
  return (0x8000 | (span >>> 1)) > d ? hi : lo;
}
// 0x433968, the joint point: +0x1620.. = the old +0x1000..; +0x1000 = joint +0x1658's matrix (0xc15a4) x vec 0 + its row 3 (no w)
function point058(M, v){
  let x = f(v[1] * M[4]); x = mla(x, v[0], M[0]); x = mla(x, v[2], M[8]);
  let y = f(v[1] * M[5]); y = mla(y, v[0], M[1]); y = mla(y, v[2], M[9]);
  let z = f(v[1] * M[6]); z = mla(z, v[0], M[2]); z = mla(z, v[2], M[10]);
  return [f(x + M[12]), f(y + M[13]), f(z + M[14])];
}
// vt+0x480's type 11 (0x10ab8fc, READ): sp_58 (0x179), setup 0x1c (0x433534): +8 mode u32(a0), +0x10 0xffff (the hit id +0x1588), +0x14
// the halfword s32(0.5 + a1 x 182.04) (+0x1630, the yaw's offset), +0x18 u32(a2) (+0x1634, the sound's choice). No point: the init
// 0x4336e8 sets none (its reader, +0x15cc = the life, +0x15d0 = the delay, +0xfe8 = u16(s32(0.5 + the first pitch x 182.04)), +0xfec /
// +0xff0 = 0, state 1); +0x40 is the unit's zero until the first move
function make087s58(st, D, a, sp, ctx, out){
  const def = D.shells.shell58, m = sp.mode >>> 0, mode = def && def.modes[m];
  if (!mode){ out.refused.push({ action: a.action, shell: 'shell58', mode: m, why: 'uShellEm087_sp_58 mode ' + m + ': no files' }); return; }
  const k = params087s58(mode), lists = def.lists || D.lists;
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell58', cls: def.cls, globalId: def.id, base: 'base58', mode, modeIndex: m,
              action: a.action, spawnFrame: sp.frame, motion: ctx.motion, state: 1, k, lists,
              yawOff: u16(s32(mla(f(0.5), f(sp.deg || 0), DEG_TO_U16))), sound: (sp.snd || 0) >>> 0,
              life: k.life, delay: k.delay, angles: [u16(s32(mla(f(0.5), k.pitch0, DEG_TO_U16))), 0, 0],
              position: [f(0), f(0), f(0)], anchor: [f(0), f(0), f(0)], prev: [f(0), f(0), f(0)], ground: null,
              activated: false, moves: 0, events: [], stops: [], folder: def.folder, effect: null, effect2: null, start: null,
              place: null, place2: null, stop: null, stop2: null, unitScale: f(mode.scale) };
  st.shells.push(S); out.spawned.push(S);
}
// ef param p started at `point`, rotation `rot` (degrees, or raw radians for the impact -- 0x43b08c's, as base02's step does) with the
// override (+0x14 |= 2): ef 0 into the shell's own handle +0x15f0 ('reflight'), ef 1 into +0x15f4 (effect2)
function start058(S, D, p, point, rot, out){
  const rq = rockRequest(D, S.mode, p, point, p ? 'impact' : 'reflight', S.lists);
  if (!rq) return null;
  rq.requester.rotationDeg = rot; rq.requester.flags14 = 0x40000002;
  out.started.push({ shell: S, start: rq });
  return { param: p, key: rq.key };
}
// the end +0x148 0x4345d0(0): not ending -> both handles stopped gracefully (0x43b058(h, 0)), 0x4a1de4 (the hits), his +0x160 (bx lr),
// state 0xfe, +0x15cc = [0x162493c] x 60
function end58(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.effect2){ S.stop2 = S.effect2; S.effect2 = null; }
  S.place = null; S.place2 = null;
  S.state = 0xfe; S.life = ENDING_FRAMES;
  out.ended.push(S);
}
// 0x433d9c, the aim: the yaw +0xfec -- bit 0 clear: u16(P+0x54 + the offset); set: the bearing from +0x1000 to the target P+0x1d0 / +0x1d8
// (atan2), less P+0x54, plus the offset, kept in [float 7, float 8] deg (clamp058), plus P+0x54. The pitch +0xfe8: the delay +0x15d0 counted
// down by the step (kept >= 0); once it is out, += s32(0.5 + rate x step x 182.04) every move; kept in [float 5, float 6] deg
function aim058(S, own, dt){
  const k = S.k, y0 = own.ownerY >>> 0;
  let yaw;
  if (!k.aim) yaw = u16(y0 + S.yawOff);
  else {
    const T = own.target, E = S.anchor;
    const w = s32(mla(f(0.5), atan2f(f(T[0] - E[0]), f(T[2] - E[2])), RAD_TO_U16));
    const lo = s32(mla(f(0.5), k.yLo, DEG_TO_U16)), hi = s32(mla(f(0.5), k.yHi, DEG_TO_U16));
    yaw = u16(clamp058((w - y0 + S.yawOff) | 0, lo, hi) + y0);
  }
  S.angles[1] = yaw;
  let pitch = S.angles[0], run = true;
  if (S.delay > 0){ const n = f(S.delay - dt); S.delay = f(0) >= n ? f(0) : n; run = !(n > 0); }
  else S.delay = f(0);
  if (run) pitch = u16(pitch + s32(mla(f(0.5), f(k.rate * dt), DEG_TO_U16)));
  S.angles[0] = u16(clamp058(pitch, s32(mla(f(0.5), k.pLo, DEG_TO_U16)), s32(mla(f(0.5), k.pHi, DEG_TO_U16))));
}
// the move. The step 0x433a74: a handle whose unit left states 1 / 2 dropped; state 1 -> +0x150 0x433b0c: the owner gone (0x4a0f38) or his
// +0x15c 0x10c2d04 (his action group e+0x73e0 == 10) -> the end; the life +0x15cc counted down by the step (kept >= 0), out -> the end;
// else 0x433968 (the joint point +0x1000), 0x433d9c (the aim), +0x1610 = +0x40, then +0x40 = +0x1000 + the reach along the words
// (x = R cos p sin y, y = -R sin p, z = R cos p cos y, the compiler's zero terms kept), 0x433fb4 (the stage query from +0x1000 to +0x40,
// 0x43ac8c: a hit -> +0x15e0 = the point and +0x158; none -> +0x15e0 = +0x40 and the +0x15f4 handle KILLED by its vt+0x40 0x43384 --
// the viewer stops it at once), 0x4340fc (the hit line's capsules: not visual), ef 0 placed at +0x1000 turned by the words (deg), the
// sound 0x4342ac (cmn int by +0x1634, its ray 0x807984: audio). +0x158 0x434688(point, query, type): type != 2 -> +0x40 = the point;
// ef 1 (+0x163c) -> 0x43b08c's angles (old end +0x1610, new end +0x40); its handle +0x15f4 live: placed at the point, turned (x deg, 0,
// z deg); else ef 1 started there, the raw radians. State 0xfe -> +0x154 0x434548: the life counted down (out -> deleted); both
// handles gone -> 0xff, deleted
function step58(S, J, ctx, input, D, out){
  S.moves++;
  const own = ctx.own001, k = S.k;
  const alive = p => !input.effectAlive ? true : !!input.effectAlive(S, p, p ? S.effect2 : S.effect);
  if (S.effect && !alive(0)) S.effect = null;
  if (S.effect2 && S.effect2.started && !alive(1)) S.effect2 = null;
  if (S.state === 0xfe){
    const T = S.life;
    if (!(T > 0)){ S.life = f(0); S.state = 0xff; return; }
    const n = f(T - ctx.dt);
    S.life = f(0) >= n ? f(0) : n;
    if (!(n > 0) || (!S.effect && !S.effect2)) S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  const follow = () => {
    const M = jointMatrix(J, k.joint);
    if (!M) return false;
    S.anchorOld = S.anchor; S.anchor = point058(M, k.vec);
    return true;
  };
  if (!S.activated){                              // vt+0x18 0x433844: the joint point, ef 0 at +0x1000 turned by the words (deg)
    S.activated = true;
    if (own.ownerPos && follow()){
      const ef = S.mode.ef[0];
      if (ef && ef[1] >= 0) S.effect = start058(S, D, 0, S.anchor, S.angles.map(w => f(f(w >>> 0) * U16_TO_DEG)), out);
    }
  }
  if (!own.ownerPos){ end58(S, out); return; }
  // (his +0x15c: e+0x73e0 == 10 -- no group-10 action is on his rows: the viewer's action is a group-7 one)
  if (ctx.ownerAction && ctx.ownerAction[0] === 10){ end58(S, out); return; }
  const T = S.life;
  if (!(T > 0)){ S.life = f(0); end58(S, out); return; }
  const n = f(T - ctx.dt);
  S.life = f(0) >= n ? f(0) : n;
  if (!(n > 0)){ end58(S, out); return; }
  if (!follow()){ out.refused.push({ action: S.action, shell: 'shell58', why: 'no joint ' + k.joint }); end58(S, out); return; }
  if (k.aim && !own.target){ out.refused.push({ action: S.action, shell: 'shell58', why: 'sp_58 aims at the target: no target (input.rock.target)' }); end58(S, out); return; }
  aim058(S, own, ctx.dt);
  S.prev = S.position.slice();
  const Z0 = f(0.0), R = k.reach, E = S.anchor;
  const a = f(f(S.angles[0]) * U16_TO_RAD), sa = sinf(a), ca = cosf(a);
  const b = f(f(S.angles[1]) * U16_TO_RAD), sb = sinf(b), cb = cosf(b);
  const r = mla(f(R * ca), sa, Z0);
  const x = mla(f(cb * Z0), r, sb), y = mls(f(ca * Z0), R, sa), z = mls(f(r * cb), sb, Z0);
  S.position = [f(E[0] + x), f(E[1] + y), f(E[2] + z)];
  // 0x433fb4: the query (A = +0x40, B = +0x1000; mask 0x30, +0x15c2 the ctor's 0)
  const q = stageQuery(S.position, S.anchor, ctx.stage, 0x30);
  S.place2 = null;
  if (q){
    const type = hitType(q.attr, q.normal), P = q.point.slice();
    S.ground = P.slice();
    if (type !== 2) S.position = P.slice();
    const ef = S.mode.ef[1];
    if (ef){
      const e = impactAngles02(type, S.prev, S.position, q.normal);
      if (S.effect2) S.place2 = { param: 1, position: P, rotationDeg: [f(e.x * RAD_TO_DEG), 0, f(e.z * RAD_TO_DEG)] };
      else { S.effect2 = start058(S, D, 1, P, [e.x, e.y, e.z], out); if (S.effect2) S.effect2.started = true; }
    }
  } else {
    S.ground = S.position.slice();
    if (S.effect2){ S.stop2 = Object.assign(S.effect2, { atOnce: true }); S.effect2 = null; }
  }
  S.place = S.effect ? { param: 0, position: S.anchor.slice(), rotationDeg: S.angles.map(w => f(f(w >>> 0) * U16_TO_DEG)) } : null;
}
const act087 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em087', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);

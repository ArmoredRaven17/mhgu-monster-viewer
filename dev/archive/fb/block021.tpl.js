// ---- CONGALALA (em021_00): HIS SHELLS --------------------------------------------------------------------------------------
// (2026-10-17, the Fanged Beasts walk; dev/fanged-beasts-shells-spec.md "Congalala", dev/rom-map.md "Fanged Beasts -- the shells".)
// Class uEm021_00 (vtable 0x17afde4); every spawner names its id as a literal. Shell table rows 161..163: 0xa1 uShellEm021_00_00
// (vtable 0x17b0e00) base00 -- its own reader +0x14c 0xdd8dbc, landing +0x150 0xdd9398, state-1 move +0x158 0xdd927c; 0xa2
// uShellEm021_00_01 (0x17b0f7c) base01, reader 0xdd969c; 0xa3 uShellEm021_00_04 (0x17b10ec) base04 (the breath), reader 0xdd9924 and
// +0x158 0xdd9a80. Values: em021_00.arc shell\em\em021_00_shellNN (scratchpad fb/shl_em021_00.txt). EffectList [em021_00u].
SHELL_DATA.em021_00 = {
  name: 'Congalala',
  lists: { 0: { list: 'u', pel: 'em021_00u' } },
  shells: {
    // shell00: 0 / 1 / 3 the thrown dung (u 200 the flight, u 220 the wall / type-2 landings; the floor makes shell01 2), 10 / 11 /
    // 14 the gas clouds (u 0; 40 frames then they stop in x / z: dd927c)
    shell00: { id: 0xa1, cls: 'uShellEm021_00_00', base: 'base00', reader: 0xdd8dbc, folder: 'shell\\em\\em021_00_shell00',
      modes: {
{M00}
      },
      hitdata: [[1, 99], [0, 72], [0, 72], [0, 60], [0, 72], [0, 120]] },
    // shell01: 0 / 1 on joint 140 (no effect param drawn: u 0), 2 the dung splat (u 210, snapped to the ground, 40 frames)
    shell01: { id: 0xa2, cls: 'uShellEm021_00_01', base: 'base01', reader: 0xdd969c, folder: 'shell\\em\\em021_00_shell01',
      modes: {
{M01}
      },
      hitdata: [[0, 72], [0, 100]] },
    // shell04: the breath on joint 4 (cmn): 0 u 100 (the gas-less breath), 1..4 u 130 / 140 / 150 / 160, 5..8 u 300..330 (their
    // length shrinks over the last 30 frames: +0x158)
    shell04: { id: 0xa3, cls: 'uShellEm021_00_04', base: 'base04', reader: 0xdd9924, folder: 'shell\\em\\em021_00_shell04',
      cmn: { ints: [4, 1, 1, -1], floats: [130.0], vecs: [[0.0, -46.0, 24.0]] },
      modes: {
{M04}
      },
      hitdata: [[1, 130], [1, 130], [1, 130], [1, 130], [1, 130]] },
  },
  actions: null,          // below
  perFrame021: true,
};
// sp_00's reader 0xdd8dbc (READ whole): ef 0..3 -> +0x15c8 / +0x15cc / +0x15d0 / +0x15d4 (in order); hit 0; int 0 -> the joint;
// the flags +0x15e8: 0x20 int 1, 0x1 and 0x4 int 2, 0x200 int 4, 0x8 int 5, 0x80 int 6, 0x800 int 7, 0x40 int 8 (each != -1; int 3
// is read by nobody); floats 0 degX +0x15ec, 1 vz, 2 vy, 3 flight, 4 / 5 the X clamp; vec 0 the offset, vec 1 the aim offset +0x1618,
// vec 2 the gravity. Then by mode: 10 / 11 / 14 -> +0x1660 = 40.0; 3 -> THE LOB written into the SETUP's words (0xdd90c0..0xdd9250,
// aim021: X = the lower of the two arcs' words less block +0x50, Y = block +0x54) -- which flag 0x20 then takes.
function params021s00(def, mode, modeIndex, got){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(1) !== -1 ? 0x20 : 0) | (I(2) !== -1 ? 5 : 0) | (I(4) !== -1 ? 0x200 : 0) | (I(5) !== -1 ? 8 : 0) |
                (I(6) !== -1 ? 0x80 : 0) | (I(7) !== -1 ? 0x800 : 0) | (I(8) !== -1 ? 0x40 : 0);
  const k = { joint: I(0), flags, degX: F(0), xDeg: F(0), degY: f(0), yDeg: f(0), vz: F(1), vy: F(2), flight: F(3), xLo: F(4), xHi: F(5),
              yLo: f(0), yHi: f(0), vec: V(0), aimOff: V(1), from: ZERO3.slice(), gravity: V(2) };
  if (modeIndex === 10 || modeIndex === 11 || modeIndex === 14) k.t1660 = f(40.0);
  if (modeIndex === 3) k.setupWords = got && got.ownerPos && got.target ? aim021(k, got) : null;
  return k;
}
// 0xdd90c0..0xdd9250: from the owner's point + vec 0 to the target: d the level distance, A = g.y d^2 / (-2 vz^2), B = d / A, C = (aim
// offset y + T.y - (P.y + v0.y)) / A, r = sqrt(max(B^2 / 4 - (C + 1), 0)); the words of atan(r - B/2) and atan(-r - B/2), the one of
// the smaller magnitude (`movlo`) less block +0x50 -> setup +0x20, block +0x54 -> +0x24 (+0x28 the setup's 0)
function aim021(k, got){
  const P = got.ownerPos, T = got.target, v0 = k.vec;
  const px = f(P[0] + v0[0]), pz = f(P[2] + v0[2]), py = f(P[1] + v0[1]);
  const dx = f(px - T[0]), dz = f(pz - T[2]);
  const d = sqrtf(mla(mla(f(0.0), dx, dx), dz, dz));
  const A = f(f(k.gravity[1] * f(d * d)) / f(f(k.vz * k.vz) * f(-2.0)));
  const B = f(d / A), C = f(f(k.aimOff[1] + f(T[1] - py)) / A);
  let D = nmls(f(C + f(1.0)), f(B * B), f(0.25));
  D = D !== D ? D : (D > 0 ? D : f(0.0));                   // vmax.f32 with 0.0
  const r = sqrtf(D), hB = f(B * f(0.5));
  const w1 = s32(mla(f(0.5), atanf(f(r - hB)), RAD_TO_U16)), w2 = s32(mla(f(0.5), atanf(f(f(-r) - hB)), RAD_TO_U16));
  const mag = w => u16((w & 0x8000) ? 0x10000 - w : w);
  const X = mag(w1) < mag(w2) ? w1 : w2;
  return [u16(X - (got.ownerX >>> 0)), got.ownerY >>> 0, 0];
}
// sp_00's +0x158 0xdd927c (READ whole): base00's 0x3f9738, then -- still in state 1, modes 10 / 11 / 14 (mask 0x4c00) -- the 40-frame
// clock +0x1660 runs down (vsel to 0); once it is 0 the velocity and the gravity are multiplied by the shared vector 0x19176f0 =
// (0, 1, 0) (read on the booted executable): the cloud stops in x / z
function after021s00(S, ctx){
  if (S.state !== 1 || !(S.modeIndex === 10 || S.modeIndex === 11 || S.modeIndex === 14)) return;
  if (S.t1660 == null) S.t1660 = S.k.t1660;
  let t = S.t1660;
  if (t > 0){
    const n = f(t - ctx.dt);
    S.t1660 = f(0.0) >= n ? f(0.0) : n;
    if (n > 0) return;
  } else S.t1660 = f(0.0);
  S.velocity = [f(0.0 * S.velocity[0]), f(1.0 * S.velocity[1]), f(0.0 * S.velocity[2])];
  S.gravity = [f(0.0 * S.gravity[0]), f(1.0 * S.gravity[1]), f(0.0 * S.gravity[2])];
}
// sp_00's landing +0x150 0xdd9398 (READ whole): only modes 0 / 1 / 3 in state 1 -- every other mode leaves the contact unanswered and
// flies on; type 0 / 2 -> ef +0x15cc / +0x15d4; type 1 with the velocity's y > 0 -> nothing (it flies on); type 1 falling -> ef
// +0x15d0 and a shell01 2 (id 0xa2, 0x3fa2bc(0x40)) at the contact with the words (0, +0xfec, +0xff0), +0x20 the zero vector, +0x3c
// 0xffff -- then, the contact's attribute byte +9 bit 0x20 clear, 0xac030(owner, contact, 0x1e, 0) (NOT READ: not modelled); then
// 0x3f8970 and vt+0x148(0)
function landing021s00(S, D, hit, ctx){
  const m = S.modeIndex;
  if (m > 3 || m === 2 || S.state !== 1) return 'keep';
  if (hit.type === 1 && S.velocity[1] > 0) return 'keep';
  if (hit.type === 1) ctx.create(S, 'shell01', { mode: 2, position: hit.point.slice(), angles: [0, S.angles[1] >>> 0, S.angles[2] >>> 0] });
  const param = [1, 2, 3][hit.type];
  if (param) contactStart(S, D, param, hit.point, 'landing');
}
// sp_01's reader 0xdd969c (READ whole): ef 0 -> +0x15c8; hit 0; int 0 -> the joint +0x15e4; +0x15ec: 0x1 int 1, 0x2 int 2, 0x80 int
// 3, 0x800 int 4, 0x4 int 5, 0x8 int 6, 0x1000 int 7; float 0 -> the timer +0x15f0; vec 0 -> +0x1608
function params021s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 0x80 : 0) | (I(4) !== -1 ? 0x800 : 0) |
                (I(5) !== -1 ? 4 : 0) | (I(6) !== -1 ? 8 : 0) | (I(7) !== -1 ? 0x1000 : 0);
  return { flags, joint: I(0), timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm021_00_01: a mode its files do not carry' : null };
}
// sp_04's reader 0xdd9924 (READ whole): ef 0 -> +0x1610; hit through 0x4a2378 -> +0x1618 / +0x161c (hit side); ShellCmnParam int 0
// the joint +0x1624, int 1 the trail count +0x1628, int 2 the angle mode +0x1630, int 3 != -1 -> flag 1 +0x162c; sh int 0 != -1 ->
// flag 2; cmn float 0 the life +0x1638; sh float 0 the length +0x1634, sh float 1 the start +0x163c; cmn vec 0 +0x1640 (vec1 +0x1644
// the ctor's: the zero vector)
function params021s04(def, mode){
  const sh = mode.sh, c = def.cmn, cI = i => i < c.ints.length ? c.ints[i] : -1, cF = i => i < c.floats.length ? f(c.floats[i]) : f(0);
  const I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: cI(0), count: cI(1), angleMode: cI(2), flags: (cI(3) !== -1 ? 1 : 0) | (I(0) !== -1 ? 2 : 0),
           length: F(0), life: cF(0), start: F(1), vec0: (c.vecs[0] || ZERO3).map(f), vec1: ZERO3.slice() };
}
// sp_04's +0x158 0xdd9a80 (READ whole; base04's move calls it with flag 2, on the length it just took from +0x1634): the life +0x15cc
// below 30 -> the length times max(life / 30, 0.001) (vmaxnm)
function len021s04(S, len){
  const T = S.timer;
  if (!(T < f(30.0))) return len;
  const q = f(T / f(30.0)), m = q > f(0.001) || q !== q ? (q !== q ? f(0.001) : q) : f(0.001);
  return f(m * len);
}
// WHO MAKES THEM (READ: each body; the census fb/cen_em021.txt / cen2_em021.txt, every status x action x phase x sub-phase x rage x
// the gas bytes, the band native on unicorn):
//   (1, 0x03 / 0x0a) 0xdcfe40: L0 M20 f70 shell00 10.  (7, 0x04) 0xdd4900: L2 M5 phase 2 f110 shell00 10.  (7, 0x0a / 0x0b / 0x49)
//   0xdd52a0: L2 M12 f64 shell00 0 / 1 / 3 (the dung).  (7, 0x50) 0xdd5f10: L5 M14 f152 shell00 14.  (3, 0x3e / 0x43..0x48) 0xdd3738:
//   L5 M12 f161 shell01 1.  All: the zero vector, the zero words, +0x2e / +0x3c 0xffff.
//   THE BREATH 0xdd4b00(e, gas, form): (7, 5) / (7, 0x58) L2 M7 f100 shell04 0; (7, 6 / 0x34..0x3a / 0x48) L2 M16 f138 shell04 by
//   (gas, form): mode (r6, r5) = gas 0 -> 0x169ce98[form] (0 / 1 / 5), 1 -> 2 / 6, 2 -> 3 / 7, 3 -> 4 / 8 (form 1 / 2). THE ACTION IS THE
//   REMAP's (vt+0x1fc 0xdcee10, READ): (7, 5) / (7, 0x58) become, by the gas he carries ctl[1] and his charges ctl[2] (< 2 the last):
//   gas 1 -> (7, 6) / (7, 0x37), 2 -> (7, 0x35) / (7, 0x39), 3 -> (7, 0x34) / (7, 0x38), 4 -> (7, 0x36) / (7, 0x3a); tired -> (7, 0x3b);
//   gas 0 stays the gas-less breath. So: gas 1..4 -> shell04 1 / 3 / 2 / 4 (2+ charges) or 5 / 7 / 6 / 8 (the last charges). The
//   viewer's gas is the play's (index.html shellExtra gas021: CLIP_ACTIONS' `gas` / the eating plays'); the charge count is NOT shown
//   by the viewer: STAND-IN, named -- 2 or more (a fresh eat gives 3, 5 at G: the first plays).
//   THE PIT 0xdcf9cc (vt+0x2a0, every frame): the action (10, 0x61) (the pitfall hold, L3 M14), enraged, ctl+0x1a == 0, variant 0, the
//   motion's end -> ctl+0x1a = 1 and shell00 11 (zero setup); (10, 0x60 / 0x64 / 0x67) clear the byte (the pit's start: L3 M13).
//   NOT REACHED by any traced action: 0xdd5070's shell00 10 (its one caller passes r2 = 0, the create needs 1) and 0xdd3738's shell01 0
//   arm (f104 / f212); sp_00 mode 2 and sp_01 mode 0 / 2 are made only as above (2: the dung's landing).
const GAS021 = { 1: [1, 5], 2: [3, 7], 3: [2, 6], 4: [4, 8] };
const act021 = (status, n, list, clip, spawns, x = {}) => Object.assign({ action: [status, n], code: 'em021', list, clip,
  pick: x.pick || 'ai', variant: status + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x.also ? { also: x.also.map(m => [status, m]) } : {});
SHELL_DATA.em021_00.actions = [
  act021(1, 0x03, '0', 'Motion[20]', [{ frame: 70, shell: 'shell00', mode: 10 }], { pick: 'always', also: [0x0a] }),
  act021(7, 0x04, '2', 'Motion[5]', [{ frame: 110, shell: 'shell00', mode: 10 }], { pick: 'always' }),
  act021(7, 0x0a, '2', 'Motion[12]', [{ frame: 64, shell: 'shell00', mode: 0 }]),
  act021(7, 0x0b, '2', 'Motion[12]', [{ frame: 64, shell: 'shell00', mode: 1 }]),
  act021(7, 0x49, '2', 'Motion[12]', [{ frame: 64, shell: 'shell00', mode: 3 }]),
  act021(7, 0x50, '5', 'Motion[14]', [{ frame: 152, shell: 'shell00', mode: 14 }], { pick: 'always' }),
  act021(3, 0x3e, '5', 'Motion[12]', [{ frame: 161, shell: 'shell01', mode: 1 }], { pick: 'always', also: [0x43, 0x44, 0x45, 0x46, 0x47, 0x48] }),
  act021(7, 0x05, '2', 'Motion[7]', [{ frame: 100, shell: 'shell04', mode: 0 }], { pick: 'always', also: [0x58] }),
  act021(7, 0x34, '2', 'Motion[16]', [{ frame: 138, shell: 'shell04', gas: true }], { pick: 'always', also: [0x06, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x48] }),
];
// the actions' spawns, by pass001 on the previous pose's joints
function spawn021(state, D, a, ctx, input, out, fresh){
  if (fresh || !state.hist || !state.prevJoints) return;
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    let m = sp.mode;
    if (sp.gas){
      const g = input.gas021 | 0;
      if (!GAS021[g]){ out.refused.push({ action: a.action, shell: 'shell04', why: 'no gas (input.gas021 0: the gas-less breath plays L2 M7)' }); continue; }
      m = GAS021[g][0];                                         // 2+ charges (the stand-in)
    }
    if (sp.shell === 'shell04'){
      const why = missing001(own, { facing: true });
      if (why){ out.refused.push({ action: a.action, shell: 'shell04', mode: m, why }); continue; }
      const S = spawn(state, D, { shell: 'shell04', mode: m, frame: sp.frame, action: a.action }, J, ctx);
      if (S){ state.shells.push(S); out.spawned.push(S); }
      else out.refused.push({ action: a.action, shell: 'shell04', mode: m, why: 'no matrix for joint 4' });
    } else if (sp.shell === 'shell00'){
      const why = missing001(own, { facing: true, pos: true, target: m === 3 });
      if (why){ out.refused.push({ action: a.action, shell: 'shell00', mode: m, why }); continue; }
      const S = make00n(state, D, m, J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: [0, 0, 0] }), ctx, a.action, sp.frame);
      if (S){ state.shells.push(S); out.spawned.push(S); }
      else out.refused.push({ action: a.action, shell: 'shell00', mode: m, why: 'base00 init refused' });
    } else {
      const why = missing001(own, { facing: true, pos: true, ground: true });
      if (why){ out.refused.push({ action: a.action, shell: 'shell01', mode: m, why }); continue; }
      const S = make001(state, D, 'shell01', { id: D.shells.shell01.id, mode: m, position: [0, 0, 0], angles: [0, 0, 0], action: a.action, frame: sp.frame },
                        own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    }
  }
}
// vt+0x2a0 0xdcf9cc: the pit's shell (L3 M14 = (10, 0x61) the hold; its end, enraged, once until an L3 M13 (10, 0x60) start)
function perFrame021(state, D, ctx, input, out, fresh){
  const clip = String(input.clip || '').replace(/_(start|loop)$/, '');
  if (String(input.list) !== '3') return;
  if (fresh && clip === 'Motion[13]') state.pit021 = false;
  if (clip !== 'Motion[14]' || !ctx.wrapped || !input.rage || state.pit021) return;
  const own = ctx.own001, why = missing001(own, { facing: true, pos: true });
  if (why){ out.refused.push({ perFrame: clip, shell: 'shell00', mode: 11, why }); return; }
  state.pit021 = true;
  const S = make00n(state, D, 11, state.prevJoints || ctx.J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: [0, 0, 0] }), ctx, [10, 0x61], null);
  if (S){ state.shells.push(S); out.spawned.push(S); }
}


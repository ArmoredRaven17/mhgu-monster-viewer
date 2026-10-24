
// ---- AMATSU (em058_00): uEm058_00's sp_00 0xfc (base00: the water ball), sp_01 0xfd (base01: the strikes and hit volumes, the burst
// at the end of (7, 0xc)), sp_02 0xfe (base02g: the beam -- render/beam-spawns.js) and sp_30 0x101 (BASE30: the three whirlwinds) -------
// READ 2026-10-19 (dev/elder-dragon-shells-spec.md 8). HIS ACTIONS KEEP THEIR PHASE IN THE UNIT, e+0x15e1 (sub-phases +0x15e2 / +0x15e3),
// not P+0x1a1: the census runs with FB_PHASEAT=0x15e1 (fb/trgen.py). Which actions he plays: em058_00_cmdtbl.emc (fb/emcvar.py) closed
// over the set-action calls (fb/chain058.py: no edges). The status-7 table 0xf080c4 (0x1c offsets on e+0x73e1). The makers (cengen11;
// the clips fb/motqx.py; the frames from his action_tune where the code reads them, 0x6f618):
//   (7, 0x09) 0xf0cd0c L2 M17 at tune float 0x20 (110): sp_00 0 (zero setup: the joint path).
//   (7, 0x0b) 0xf0d1c4 L2 M19 at tune 0x23 (220): sp_30 0, 1, 2 (id, mode, owner: the whirlwinds round him).
//   (7, 0x0c) 0xf0d3a0 L2 M22 at tune 0x24 (206): sp_01 8 (a hit volume, no effect); the hold P+0x1bc = tune 0x25 (806) counted down
//     (0x7206c), then L2 M23 and sp_01 1 at the block point with his words -- whose END (+0x154 0xf0fa28, mode 1) makes sp_01 2 there.
//   (7, 0x01) 0xf0bd10 L2 M14 f102: sp_01 4 (a hit volume) while e+0x17f4 bit 0 is clear (its writer not found: the ctor's 0, named).
//   (7, 0x02) 0xf0be9c L2 M15 f130: sp_01 3 (a hit volume; +0x20 the block point -> its anchor, flag 0x200).
// NOT BUILT (named): (7, 0x00)'s sp_29 0 (0x100, base29) -- no effect param (999) and no child: a hit volume only; (7, 0x03 / 0x04)'s
// trail (0xf0c054: sp_01 6 every 16 frames of 0x539d5c on P+0x1bc, phases on L2 M1 / M2 / M4) -- sp_01 6 has no effect (999): hit volumes
// only; sp_00's landing child sp_01 7 (no effect) is made, as it costs nothing. NOT REACHED: (7, 0x08 / 0x0e / 0x18 / 0x19..0x1b) (sp_06,
// sp_42).

// sp_00's reader 0xf0f3a0 (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 the joint; floats 0..3 -> +0x15ec (X degrees) / +0x15f0
// (Y) / +0x15f4 (vz) / +0x15fc (the flight); vec 0 the offset +0x1610. vy and the gravity the ctor's 0; the flags 0
function params058s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), flags: 0, degX: F(0), xDeg: F(0), degY: F(1), yDeg: F(1), vz: F(2), vy: f(0.0), flight: F(3),
           xLo: f(0), xHi: f(0), yLo: f(0), yHi: f(0), vec: (sh.vecs[0] || ZERO3).map(f), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: ZERO3.slice() };
}
READER00.uShellEm058_sp_00 = (def, mode) => params058s00(def, mode);
// sp_00's landing 0xf0f4bc (READ whole; state 1): type 0 -> ef +0x15cc, 2 -> +0x15d4; 1 -> +0x15d0 after 0xf0f548 -- sp_01 7 (no effect) at
// THE SHELL's +0x40 with its words, +0x3c its +0x13dc (the owner active); then 0x3f8970 at the contact and the end
LANDING.uShellEm058_sp_00 = (S, D, hit, ctx) => {
  if (hit.type === 1 && ctx && ctx.create) ctx.create(S, 'shell01', { mode: 7, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) });
  const param = [1, 2, 3][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
};

// sp_01's reader 0xf0f794 (READ whole): ef 0 / 1 -> +0x15c8 / +0x15cc; hit 0; +0x15ec (bfc / orrne): 0x200 int 0, 1 int 2, 0x400 int 1, 2 int
// 4, 0x100 int 6, 0x80 int 5, 4 int 7, 8 int 8; int 3 the joint +0x15e4; float 0 the timer +0x15f0; vec 0 -> +0x1608, vec 1 -> +0x160c (the
// words' degrees); cmn floats 0..5 -> +0x1654.. (mode 8's hit windows, +0x150 0xf0fb10: not visual)
function params058s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? f(0) : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 0x200 : 0) | (I(2) !== -1 ? 1 : 0) | (I(1) !== -1 ? 0x400 : 0) | (I(4) !== -1 ? 2 : 0) | (I(6) !== -1 ? 0x100 : 0) |
                (I(5) !== -1 ? 0x80 : 0) | (I(7) !== -1 ? 4 : 0) | (I(8) !== -1 ? 8 : 0);
  return { flags, joint: I(3), timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: V(1), up: f(500.0), down: f(500.0), maxH: f(900.0),
           why: !sh ? 'uShellEm058_sp_01: a mode its files do not carry' : null, efAt: { 0x15c8: 0, 0x15cc: 1, 0x15d0: null } };
}
READERS01[0xf0f794] = sh => params058s01(sh);
// sp_01's +0x154 0xf0fa28 (READ whole; base01's end): mode 1 -> sp_01 2 at its +0x40 with its words +0xfe8.., +0x3c 0xffff
function endCreate058(S, ctx, events){
  if (S.modeIndex !== 1) return;
  if (!ctx || !ctx.create) throw new Error('shells.js: sp_01 end create (0xf0fa28) without the create context');
  ctx.create(S, 'shell01', { mode: 2, position: S.position.slice(), angles: S.angles.map(w => w >>> 0) }, events);
}

// ---- BASE30 (uShellEmBase30: ctor 0x412fb8, init 0x413080, step 0x41330c, move 0x4133d4, end 0x41359c; +0x150 / +0x154 `bx lr`) -- the
// whirlwinds. sp_30's reader 0xf103b0 (READ whole): ef 0 -> +0x15c8; hit 0 -> +0x15cc; floats 0 / 1 / 2 -> +0x15d0 (the anchor's rise) /
// +0x15d4 (the turn, degrees a frame) / +0x15d8 (the life); vecs 0 / 1 / 2 -> +0x15dc (the offset) / +0x15e0 (the words' degrees) / +0x15e4
// (the velocity)
function params030(mode){
  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0), V = i => (sh.vecs[i] || ZERO3).map(f);
  return { rise: F(0), turn: F(1), life: F(2), vec: V(0), deg: V(1), vel: V(2) };
}
// base30's init 0x413080 (READ whole): the words = block +0x50 / +0x54 / +0x58, each += u16(s32(0.5 + vec 1[i] x 182.04)); +0x40 = block
// +0x40 + the GOT's zero vector turned by the new Y word (x cos + z sin, y, z cos - x sin), then y = the ground (block +0x5b4); state 1; the life +0x15e8 =
// float 2; ef 0 at +0x40 -> +0x15ec; the hit
function make030(st, D, m, own, ctx, action, frame){
  const def = D.shells.shell30, mode = def.modes[m], lists = def.lists || D.lists;
  if (!mode) return { why: 'shell30 mode ' + m + ': no files' };
  if (!own.ownerPos || !own.facing) return { why: 'shell30: no owner position / facing' };
  if (own.ground == null) return { why: 'shell30: no ground (input.ground / input.rock.floorY)' };
  const k = params030(mode);
  const A = [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0].map((w, i) => (w + u16(s32(mla(f(0.5), k.deg[i], DEG_TO_U16)))) >>> 0);
  // (the offset is the GOT's ZERO VECTOR (0x413190..0x4131a8), not vec 0 -- read by nobody in the init)
  const r = f(f(u16(A[1])) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), O = own.ownerPos, v = [f(0.0), f(0.0), f(0.0)];
  const P = [f(O[0] + mla(f(v[0] * cs), v[2], sn)), own.ground, f(mls(f(v[2] * cs), v[0], sn) + O[2])];
  const S = { id: st.nextId++, monId: st.monId, shell: 'shell30', cls: def.cls, globalId: def.id, base: 'base30', mode, modeIndex: m,
              action, spawnFrame: frame, motion: ctx.motion, state: 1, k, position: P, prevPosition: P.slice(), anchor: P.slice(), angles: A,
              velocity: [f(0.0), f(0.0), f(0.0)], gravity: [f(0.0), f(0.0), f(0.0)], clock: k.life, moves: 0, events: [],
              folder: def.folder, effect: null, start: null, place: null, stop: null };
  S.effects = mode.ef.map(([listId, key], param) => ({ param, listId, list: (lists[listId] || {}).list || null, key, started: false }));
  S.start = rockRequest(D, mode, 0, P, 'flight', lists);
  S.effect = S.start ? { param: 0, key: S.start.key, kind: 'flight' } : null;
  if (S.start) S.effects[0].started = true;
  S.launch = { point: P.slice(), angles: A.slice() };
  return { S };
}
// base30's end 0x41359c (vt+0x148(flag)): not ending already -> ef 0 stopped (0x43b058(h, flag)), the hits off, state 0xfe, +0x15e8 = 0
function end30(S, out){
  if ((S.state & 0xfe) === 0xfe) return;
  S.stop = (S.effect && !S.effect.gone) ? { param: 0, request: 0, key: S.effect.key } : null;
  if (S.stop) S.events.push({ ev: 'stop', param: 0, key: S.stop.key, flag: 0 });
  S.state = 0xfe; S.clock = f(0.0);
  out.ended.push(S);
}
// base30's move 0x4133d4 (READ whole): the owner gone -> the end; the anchor = (x, y + float 0, z); 0x539224 (stepFlight on +0x1010 /
// +0x1020); then the velocity = vec 2, its x / z turned by the Y word after the word += dt x u16(s32(0.5 + float 1 x 182.04)) (kept as a
// u32 of the float sum); the life +0x15e8 -= dt (vselge 0): at 0 the end
function move030(S, ctx, out){
  const k = S.k;
  S.anchor = [S.position[0], f(S.position[1] + k.rise), S.position[2]];
  stepFlight(S, ctx.dt);
  const rate = u16(s32(mla(f(0.5), k.turn, DEG_TO_U16)));
  const w = f(mla(f(S.angles[1] >>> 0), ctx.dt, f(rate)));
  S.angles[1] = cvtU32(w) >>> 0;
  const r = f(f(u16(cvtU32(w))) * U16_TO_RAD), sn = sinf(r), cs = cosf(r), v = k.vel;
  S.velocity = [mla(f(v[0] * cs), v[2], sn), v[1], mls(f(v[2] * cs), v[0], sn)];
  const T = S.clock;
  if (!(T > 0)){ S.clock = f(0.0); end30(S, out); return; }
  const t = f(T - ctx.dt);
  S.clock = f(0.0) >= t ? f(0.0) : t;
  if (!(t > 0)) end30(S, out);
}
// base30's step 0x41330c (READ whole): the handle dropped when its unit left states 1 / 2; state 1 the move; 0xfe: +0x15e8 += the step,
// deleted past [0x162493c] x 60 or with the handle gone
function step30(S, ctx, input, D, out){
  S.events = [];
  S.moves++;
  if (S.effect && !S.effect.gone && input.effectAlive && !input.effectAlive(S, 0, S.effect)) S.effect.gone = true;
  if (S.state === 1) move030(S, ctx, out);
  else if (S.state === 0xfe){
    S.clock = f(ctx.dt + S.clock);
    if (S.clock > ENDING_FRAMES || !(S.effect && !S.effect.gone)) S.state = 0xff;
  }
}

// the spawner (code 'em058'): rows { frame (or `start`: the play's first step -- (7, 0xc)'s L2 M23, made as the hold ends), shell, mode,
// at ('block': the block point and his words; 'anchor20': flag 0x200's anchor the block point too) }
function spawn058(state, D, a, ctx, input, out, fresh){
  if (!state.hist) return;
  const own = ctx.own001, J = state.prevJoints || ctx.J;
  for (const sp of a.spawns){
    if (sp.start ? !fresh : !pass001(state, f(sp.frame))) continue;
    const refuse = why => out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why });
    if (!own.ownerPos || !own.facing){ refuse('no owner position / facing'); continue; }
    if (sp.shell === 'shell00'){
      const S = make00n(state, D, sp.mode, J, Object.assign({}, own, { requestPos: [0, 0, 0], requestAngles: [0, 0, 0] }), ctx, a.action, sp.frame);
      if (S){ state.shells.push(S); out.spawned.push(S); } else refuse('base00 init refused');
    } else if (sp.shell === 'shell30'){
      const r = make030(state, D, sp.mode, own, ctx, a.action, sp.frame);
      if (r.S){ state.shells.push(r.S); out.spawned.push(r.S); } else refuse(r.why);
    } else if (sp.shell === 'shell01'){
      if (sp.gate17f4 && E17F4_STANDIN & 1) continue;
      const setup = { id: 0xfd, mode: sp.mode, position: own.ownerPos.slice(), angles: [own.ownerX >>> 0, own.ownerY >>> 0, own.ownerZ >>> 0],
                      action: a.action, frame: sp.frame };
      if (sp.at === 'anchor20'){ setup.position = [0, 0, 0]; setup.v20 = own.ownerPos.slice(); }
      const S = make001(state, D, 'shell01', setup, own, J, ctx, null);
      if (S){ state.shells.push(S); out.spawned.push(S); }
    }
  }
}
const E17F4_STANDIN = 0;      // e+0x17f4 (bit 0 tested by (7, 1); bit 1 set at a part break, 0xf07518): no writer of bit 0 found
const act058 = (st, n, list, clip, spawns, x = {}) => Object.assign({ action: [st, n], code: 'em058', list, clip, pick: 'ai',
  variant: st + ':0x' + n.toString(16).padStart(2, '0'), spawns }, x);
SHELL_DATA.em058_00 = {
  name: 'Amatsu',
  lists: { 0: { list: 'u', pel: 'em058_00u' }, 1: { list: 'c', pel: 'em058_00c' } },
  shells: {
@@SHELLS@@
  },
  actions: [
    act058(7, 0x09, '2', 'Motion[17]', [{ frame: 110, shell: 'shell00', mode: 0 }]),
    act058(7, 0x0b, '2', 'Motion[19]', [{ frame: 220, shell: 'shell30', mode: 0 }, { frame: 220, shell: 'shell30', mode: 1 }, { frame: 220, shell: 'shell30', mode: 2 }]),
    act058(7, 0x0c, '2', 'Motion[22]', [{ frame: 206, shell: 'shell01', mode: 8 }]),
    act058(7, 0x0c, '2', 'Motion[23]', [{ start: true, shell: 'shell01', mode: 1 }]),
    act058(7, 0x01, '2', 'Motion[14]', [{ frame: 102, shell: 'shell01', mode: 4, gate17f4: true }]),
    act058(7, 0x02, '2', 'Motion[15]', [{ frame: 130, shell: 'shell01', mode: 3, at: 'anchor20' }]),
  ],
};

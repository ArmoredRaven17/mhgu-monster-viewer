import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:70], s.count(old))
    s = s.replace(old, new)

# 1. data, after the aura's
rep("""SHELL_DATA.em084_00.aura084 = true;
""", """SHELL_DATA.em084_00.aura084 = true;
// NAKARKOS'S CANNON (Raven, 2026-10-05: "List 2, Motion 82 does not fire the beam"): shell31, uShellEm084_sp_31, id 0x172,
// base31 -- the files' values (dev/em084-shell31-cannon.md 3 / 5a, READ). Two shells a shot, the odd mode first: the odd
// (u 101, em084_00_062_s) 1000 ahead of joint 0 on his facing, the even (u 100, em084_00_064) 1075 ahead, turned sideways
// by its vec1 / vec2 (the frame u 100 is drawn in, INFERRED). Modes 2..5 sweep the yaw +-0.35 deg a frame over shell
// frames 240..412. floats: life, sweep from, sweep to, hit re-arm; vecs 0..4: the point, A, B (the rotation's segment),
// the start angles (deg), the sweep (deg / frame).
SHELL_DATA.em084_00.shells.shell31 = {
  id: 0x172, cls: 'uShellEm084_sp_31', base: 'base31', reader: 0x108ae98, folder: 'shell\\\\em\\\\em084_00_shell31',
  modes: {
    0: { scale: 1.0, ef: [[0, 100]], sh: { ints: [0], floats: [1000, 0, 0, 0],     vecs: [[0, 0, 1075], [180, 0, 0], [-180, 0, 0], [0, 0, 0], [0, 0, 0]] } },
    1: { scale: 1.0, ef: [[0, 101]], sh: { ints: [0], floats: [1000, 0, 0, 120],   vecs: [[0, 0, 1000], [0, 0, 0], [0, 0, 20000], [0, 0, 0], [0, 0, 0]] } },
    2: { scale: 1.0, ef: [[0, 100]], sh: { ints: [0], floats: [1000, 240, 412, 0], vecs: [[0, 0, 1075], [180, 0, 0], [-180, 0, 0], [0, 0, 0], [0, 0.35, 0]] } },
    3: { scale: 1.0, ef: [[0, 101]], sh: { ints: [0], floats: [1000, 240, 412, 120], vecs: [[0, 0, 1000], [0, 0, 0], [0, 0, 20000], [0, 0, 0], [0, 0.35, 0]] } },
    4: { scale: 1.0, ef: [[0, 100]], sh: { ints: [0], floats: [1000, 240, 412, 0], vecs: [[0, 0, 1075], [180, 0, 0], [-180, 0, 0], [0, 0, 0], [0, -0.35, 0]] } },
    5: { scale: 1.0, ef: [[0, 101]], sh: { ints: [0], floats: [1000, 240, 412, 120], vecs: [[0, 0, 1000], [0, 0, 0], [0, 0, 20000], [0, 0, 0], [0, -0.35, 0]] } },
  },
};
// THE SHOT, 0x10767c0 (dev/em084-shell31-cannon.md 1, READ): the status-7 switch 0x1073a74 gives (7, 0x33 / 0x34 / 0x35 /
// 0x3c / 0x3d / 0x3e) r5 0 / 1 / 2 / 3 / 1 / 2; phase 1 -- the FIRST pass of L2 M82 only -- spawns the pair at frame 282
// (tune float 0xb), the odd mode first (0x106f820, a 16-byte setup: owner and mode). M82 repeats its loop count (tune int
// 0xc / 0xd / 0xe: 3 / 1 / 4 passes) and L2 M83 starts at motion frame 540 / 380 / 620 -- the motion change that ends both
// shells (base31's +0x160c test). The viewer loops M82, so `leave` (that frame) ends them on the shell's own clock.
// No rank, rage or stance test. NOT MODELLED, by name: (7, 0x33) / (7, 0x3c)'s body turn toward the target over f0..180
// (the shell takes the facing at f282, as every turn shells.js does not run); (7, 0x3c)'s rate 1.3 (tune 0xf0).
SHELL_DATA.em084_00.cannon084 = [
  { variant: '7:0x33', action: [7, 0x33], modes: [1, 0], leave: 540 },
  { variant: '7:0x34', action: [7, 0x34], modes: [3, 2], leave: 620 },
  { variant: '7:0x35', action: [7, 0x35], modes: [5, 4], leave: 620 },
  { variant: '7:0x3c', action: [7, 0x3c], modes: [1, 0], leave: 380 },
  { variant: '7:0x3d', action: [7, 0x3d], modes: [3, 2], leave: 620 },
  { variant: '7:0x3e', action: [7, 0x3e], modes: [5, 4], leave: 620 },
];
""")

# 2. the pick: the shot's six actions on L2 M82
rep("""  const rowsHere = beamRowsFor(monId, list, clip, opts);
  if (rowsHere.length > 1) return [...new Set(rowsHere.map(r => r.variant))];""",
"""  const rowsHere = beamRowsFor(monId, list, clip, opts);
  if (rowsHere.length > 1) return [...new Set(rowsHere.map(r => r.variant))];
  // Nakarkos's cannon: one of the six shot actions a play of L2 M82 (SHELL_DATA.em084_00.cannon084)
  if (D.cannon084 && String(list) === '2' && String(clip).replace(/_(start|loop)$/, '') === 'Motion[82]') return D.cannon084.map(r => r.variant);""")

# 3. the runtime, before stepShells (after the aura's manager)
rep("""
export function stepShells(state, input){""", r"""
// ---- BASE31: Nakarkos's cannon (shell31) -------------------------------------------------------------------------------
// dev/em084-shell31-cannon.md 2 (READ; unicorn: the placement 40 / 40 exact, the ends emulated). base31's vtable 0x1750fec
// (86 slots); sp_31 overrides +0x4, +0x14 and the reader +0x14c (0x108ae98). Init 0x413ad4 keeps the owner's motion
// (+0x160c) and its own start words (vec 3); the activation 0x413c40 (vt +0x18, the first move) places it and starts ef 0
// ONCE with the rotation override (+0x14 |= 2, base02's requester); the move 0x4147a8 re-places the effect every frame
// (0x329c9c / 0x329d04) -- no target, no stage query, no travel: vec 2's 20000 is the sound's line, never the effect's
// length. It ends (0x414d18, flag 0: graceful) when the owner goes inactive, its life (1000) runs out, or the owner's
// motion is no longer the spawn's; then waits for its effect, at most 1800.
function params31(sh){
  return { joint: sh.ints[0], life: f(sh.floats[0]), sweep: [f(sh.floats[1]), f(sh.floats[2])], rearm: f(sh.floats[3]),
           v: sh.vecs.map(v => v.map(f)) };
}
// R(w) about Z, then X, then Y (w the u16 words, x 9.58738e-05 rad), as 0x413d60 turns a vector
function rot31(w, v){
  let [x, y, z] = v;
  const a = [0, 1, 2].map(i => f(u16(w[i]) * U16_TO_RAD)), sx = sinf(a[0]), cx = cosf(a[0]), sy = sinf(a[1]), cy = cosf(a[1]),
        sz = sinf(a[2]), cz = cosf(a[2]);
  [x, y] = [f(f(x * cz) - f(y * sz)), f(f(x * sz) + f(y * cz))];
  [y, z] = [f(f(y * cx) - f(z * sx)), f(f(y * sx) + f(z * cx))];
  [x, z] = [f(f(x * cy) + f(z * sy)), f(f(z * cy) - f(x * sy))];
  return [x, y, z];
}
// the placement 0x413d60: P = joint + R(vec0) (+0x1620, the effect's point); A = P + R(vec1) (+0x1000), B = P + R(vec2)
// (+0x40); the words from B - A; R = the owner's words (block +0x50..) after the shell's own (+0x1670.., the sweep first)
function place31(S, J, own, dt){
  const k = S.k, M = jointMatrix(J, k.joint);
  if (!M) return 'no matrix for joint ' + k.joint;
  if (k.sweep[0] < S.clock && S.clock < k.sweep[1])                 // before this frame's clock step
    for (let i = 0; i < 3; i++){
      const q = Math.sign(k.v[4][i]) * Math.round(Math.abs(f(k.v[4][i] * DEG_TO_U16)));   // round half away
      S.w[i] = s32(f(S.w[i] + f(q * dt)));
    }
  const ow = [own.ownerX & 0xffff, own.ownerY & 0xffff, own.ownerZ & 0xffff];
  const R = v => rot31(ow, rot31(S.w, v));
  const J0 = [f(M[12]), f(M[13]), f(M[14])], add = (a, b) => [0, 1, 2].map(i => f(a[i] + b[i]));
  const P = add(J0, R(k.v[0])), A = add(P, R(k.v[1])), B = add(P, R(k.v[2]));
  const dx = f(B[0] - A[0]), dy = f(B[1] - A[1]), dz = f(B[2] - A[2]);
  const word = r => u16(s32(mla(0.5, r, RAD_TO_U16)));
  S.angles = [word(atan2f(f(-dy), sqrtf(f(f(dx * dx) + f(dz * dz))))), word(atan2f(dx, dz)), word(atan2f(f(-dx), dy))];
  S.origin = P; S.position = B; S.anchor = A;
  return null;
}
function make31(state, D, modeIndex, ctx, leave){
  const def = D.shells.shell31, mode = def.modes[modeIndex], k = params31(mode.sh);
  return { id: state.nextId++, monId: state.monId, shell: 'shell31', cls: def.cls, globalId: def.id, base: 'base31',
           mode, modeIndex, motion: ctx.motion, motionId: ctx.ownerMotion, state: 1, k, activated: false,
           w: k.v[3].map(d => u16(s32(mla(0.5, d, DEG_TO_U16)))), clock: 0, life: k.life, timer: 0, leaveAt: leave,
           origin: null, position: null, anchor: null, angles: null, place: null, start: null, stop: null, effect: null };
}
function end31(S, out){
  S.state = 0xfe; S.timer = 0; S.place = null;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  out.ended.push(S);
}
const deg31 = S => S.angles.map(w => f(w * U16_TO_DEG));
function step31(S, J, ctx, input, D, out){
  const own = owner001(input);
  if (S.state === 0xfe){                                   // ending: until the effect is gone, at most 1800
    S.timer = f(S.timer + ctx.dt);
    const gone = input.effectAlive ? !input.effectAlive(S, 0) : true;
    if (S.timer > 1800 || gone) S.state = 0xff;
    return;
  }
  if (S.state !== 1) return;
  if (!S.activated){                                       // vt +0x18 0x413c40: place, then start ef 0 once
    S.activated = true;
    const why = place31(S, J, own, 0);
    if (why){ out.refused.push({ shell: 'shell31', mode: S.modeIndex, why }); S.state = 0xff; return; }
    const p = S.mode.ef[0], L = p && D.lists[p[0]];
    if (p && p[1] >= 0 && L){
      S.start = { param: 0, listId: p[0], list: L.list, pel: L.pel, key: p[1],
                  requester: { position: S.origin.slice(), rotationDeg: deg31(S), scale: [f(S.mode.scale), f(S.mode.scale), f(S.mode.scale)],
                               parent: 'shell', flags14: 0x40000002, flags1c: 3, type8: 3 } };
      S.effect = { param: 0, key: p[1] };
    }
  }
  // the live step 0x414870
  const why = place31(S, J, own, ctx.dt);
  if (why) out.refused.push({ shell: 'shell31', mode: S.modeIndex, why });
  S.place = S.effect && !why ? { param: 0, position: S.origin.slice(), rotationDeg: deg31(S) } : null;
  S.clock = f(S.clock + ctx.dt);
  if (!(S.life > 0)){ S.life = 0; end31(S, out); return; }
  const L2 = f(S.life - ctx.dt); S.life = L2 > 0 ? L2 : 0;
  if (!(L2 > 0)){ end31(S, out); return; }
  if (ctx.ownerMotion != null && ctx.ownerMotion !== S.motionId){ end31(S, out); return; }   // +0x160c != [O+0x4b4]
  if (S.leaveAt != null && !(S.clock < S.leaveAt)) end31(S, out);   // the game's M83 (the viewer loops M82)
}
// the shot's spawn (0x10767c0 phase 1 -> 0x106f820), line 4: the play's pick names the action
function cannon084(state, D, ctx, input, out, fresh){
  if (String(input.list) !== '2' || input.clip !== 'Motion[82]' || fresh || !state.hist) return;
  const v = input.rock && input.rock.variant, row = D.cannon084.find(r => r.variant === v);
  if (!row || !pass001(state, f(282))) return;
  if (!(state.hist[0] < 380)) return;                    // the first pass only: frame 282 lies in the _start piece
  for (const m of row.modes){
    const S = make31(state, D, m, ctx, f(row.leave - 282));
    state.shells.push(S); out.spawned.push(S);
  }
}

export function stepShells(state, input){""")

rep("""  if (D.aura084) aura084(state, D, ctx, input, out, J);   // Nakarkos's aura manager (0x106aa48), line 4""",
    """  if (D.aura084) aura084(state, D, ctx, input, out, J);   // Nakarkos's aura manager (0x106aa48), line 4
  if (D.cannon084) cannon084(state, D, ctx, input, out, fresh);   // his cannon shot (0x10767c0), line 4""")
rep("""    else if (S.base === 'base06') step06(S, J, ctx, input, D, out);""",
    """    else if (S.base === 'base06') step06(S, J, ctx, input, D, out);
    else if (S.base === 'base31') step31(S, J, ctx, input, D, out);""")
open(p + '.tmp', 'wb').write((s.replace('\n', '\r\n') if crlf else s).encode('utf-8')); os.replace(p + '.tmp', p); print('patched')

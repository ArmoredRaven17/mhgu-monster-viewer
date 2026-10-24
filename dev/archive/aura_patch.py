import os
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
raw = open(p, 'rb').read(); crlf = b'\r\n' in raw
s = raw.decode('utf-8').replace('\r\n', '\n')
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:70], s.count(old))
    s = s.replace(old, new)

# 1. the data: Nakarkos's shell06, after the beams-only bare entries
rep("""for (const mon of Object.keys(BEAM_SPAWNS))
  if (!SHELL_DATA[mon]) SHELL_DATA[mon] = { lists: { 0: { list: 'u', pel: mon + 'u' } }, shells: {}, actions: [], beamsOnly: true };
""", """for (const mon of Object.keys(BEAM_SPAWNS))
  if (!SHELL_DATA[mon]) SHELL_DATA[mon] = { lists: { 0: { list: 'u', pel: mon + 'u' } }, shells: {}, actions: [], beamsOnly: true };
// NAKARKOS'S AURA (Raven, 2026-10-05: "Still missing Nakarkos's blue miasma effect"): shell06, uShellEm084_sp_06, id 0x16f,
// base06 -- the files' values (dev/em084-shell06-aura.md 9a, READ; dev/em084-shells-spec.md 4c). Mode 0 the body (joint 1,
// 800 ahead on his facing), 5 / 6 the tentacle sockets (joints 200 / 203, (0, -150, -300) in the joint's axes); each
// starts its ef 0, u 40 / u 41 / u 42 (em084_00_002, em084_00u UNIQUE). Held every frame by the manager 0x106aa48 (aura084).
SHELL_DATA.em084_00.shells.shell06 = {
  id: 0x16f, cls: 'uShellEm084_sp_06', base: 'base06', reader: 0x1089c08, folder: 'shell\\\\em\\\\em084_00_shell06',
  modes: {
    0: { scale: 1.0, ef: [[0, 40]], sh: { ints: [1, 0, 0],     floats: [0.0, 30.0], vecs: [[0, 0, 800], [0, 0, 0]] } },
    5: { scale: 1.0, ef: [[0, 41]], sh: { ints: [200, -1, 0],  floats: [0.0, 30.0], vecs: [[0, -150, -300], [0, 0, 0]] } },
    6: { scale: 1.0, ef: [[0, 42]], sh: { ints: [203, -1, 0],  floats: [0.0, 30.0], vecs: [[0, -150, -300], [0, 0, 0]] } },
  },
};
SHELL_DATA.em084_00.aura084 = true;
// THE STANCE A CLIP SHOWS, for the aura (Raven, 2026-10-05, of how the viewer picks it: "Follow the clip"). The game sets
// his stance E+0xcac4 at each action's start (0x1066c14 -> 0x1065c60, the per-action table in
// build/hitzone-states/state-decodes.md: 1, 2 or keep), and the clips each action plays are traced
// (build/hitzone-states/nak-clips.json); a clip every one of whose actions runs in ONE stance names it (26 of his 30
// traced clips), and the idles name theirs as his idle chooser picks them (L0 M1 in stance 1, L0 M50 in stance 2 --
// 0x107fe34 reads the same byte for the arms). L0 M67 and L3 M63 play in both: they keep the last stance shown, as does
// every untraced clip. Derived from the read table, not read for each clip.
export const AURA084_STANCE = {
  '0|Motion[1]': 1, '0|Motion[4]': 1, '0|Motion[5]': 1, '0|Motion[8]': 1, '0|Motion[9]': 1, '0|Motion[14]': 1,
  '0|Motion[17]': 1, '0|Motion[18]': 1, '0|Motion[40]': 1, '2|Motion[23]': 1, '2|Motion[24]': 1, '3|Motion[4]': 1,
  '3|Motion[13]': 1,
  '0|Motion[50]': 2, '0|Motion[41]': 2, '0|Motion[59]': 2, '0|Motion[63]': 2, '0|Motion[66]': 2, '2|Motion[81]': 2,
  '2|Motion[82]': 2, '2|Motion[85]': 2, '2|Motion[86]': 2, '2|Motion[101]': 2, '3|Motion[9]': 2, '3|Motion[10]': 2,
  '3|Motion[16]': 2, '3|Motion[50]': 2, '3|Motion[62]': 2,
};
// THE MANAGER'S "CASE A" ACTIONS, where a clip names one (dev/em084-shell06-aura.md 9d): the charge (7, 0x32) L2 M81 sets
// the charge flag; the shots (7, 0x33..) L2 M82 / M83; group 11, L3 M63; (10, 0x5f) L3 M16 / M9 / M10; (10, 0x6a) L3 M76..78
// and M23..25; (10, 0xaf) L3 M64..66. NOT HERE, by name: L3 M4 / L0 M17 (group 13, also other actions), L3 M50 / L3 M1
// ((10, 0x14 / 0x72), also (1, 0x3a)) and (10, 0x0d) (its clip not known) -- a clip that more than one action plays
// cannot say which; and E+0xcb14 == 2 (after (6, 2) / (6, 4)), which no clip says.
export const AURA084_CASE_A = new Set(['2|Motion[81]', '2|Motion[82]', '2|Motion[83]', '3|Motion[63]', '3|Motion[16]', '3|Motion[9]',
  '3|Motion[10]', '3|Motion[76]', '3|Motion[77]', '3|Motion[78]', '3|Motion[23]', '3|Motion[24]', '3|Motion[25]', '3|Motion[64]',
  '3|Motion[65]', '3|Motion[66]']);
""")

# 2. the runtime, before stepShells
rep("""export function stepShells(state, input){""", r"""// ---- BASE06: Nakarkos's aura (shell06) ---------------------------------------------------------------------------------
// dev/em084-shell06-aura.md (READ; the placement emulated, ALL OK). base06's vtable 0x174ed48 (88 slots); sp_06 overrides
// +0x4, +0x14, +0x14c (reader 0x1089c08), +0x158 (hit) and +0x15c (angle words 0x1089d14). Init 0x4014f8 starts ef 0 ONCE
// on the shell itself (the rock's request: the shell the parent, no rotation) and the move 0x401a18 re-places the SHELL
// every frame, so the effect follows by hanging from it (place: null; schedule.js setParentAngles). Life 0: it lives
// while hit slot 0 is set, re-armed every `period` (30) for 99 -- in effect for ever; the manager (aura084) or the body's
// dtor 0x1064be0 ends it through 0x1089c00 -> 0x401c88: a graceful 0x329c40(h, 0), then the shell stays where it was
// until its effect is gone (or 1800) and deletes itself.
// the reader 0x1089c08: joint +0x15d0 = int 0; flags +0x15ec bit 0 = int 1 set, bit 2 = int 2 set; floats 0 / 1 -> life /
// period; vec 0 the offset, vec 1 degrees (mode 0's angle words)
function params06(sh){
  const I = k => sh.ints[k];
  return { joint: I(0), flags: (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 4 : 0), life: f(sh.floats[0]), period: f(sh.floats[1]),
           vec0: sh.vecs[0].map(f), deg: sh.vecs[1].map(f) };
}
// vt +0x15c 0x1089d14, then 0x4016ac: the joint's position (0xc164c) plus the offset, and the angle words
function place06(S, J, own){
  const k = S.k, M = jointMatrix(J, k.joint);
  if (!M) return 'no matrix for joint ' + k.joint;
  const P = [f(M[12]), f(M[13]), f(M[14])], [x, y, z] = k.vec0;
  let A, v;
  if (k.flags & 1){                                       // mode 0: the owner's angle words + vec 1 (uxtah); on his facing
    A = [own.ownerX, own.ownerY, own.ownerZ].map((o, i) => (o + u16(s32(mla(0.5, k.deg[i], DEG_TO_U16)))) >>> 0);
    const r = f(u16(A[1]) * U16_TO_RAD), sn = sinf(r), cs = cosf(r);
    v = [f(f(x * cs) + f(z * sn)), y, f(f(z * cs) - f(x * sn))];
  } else {                                                // modes 5 / 6: the joint's matrix as Euler (0xc15a4, 0x7c3a38)
    const e = eulerOf(M);
    A = [e.x, e.y, e.z].map(a => u16(s32(mla(0.5, a, RAD_TO_U16))));
    v = [mla(mla(f(M[4] * y), M[0], x), M[8], z), mla(mla(f(M[5] * y), M[1], x), M[9], z), mla(mla(f(M[6] * y), M[2], x), M[10], z)];
  }
  S.position = [f(v[0] + P[0]), f(v[1] + P[1]), f(v[2] + P[2])];   // +0x40 = +0x1000
  S.anchor = S.position.slice();
  S.angles = A;                                                    // +0xfe8 / +0xfec / +0xff0
  return null;
}
// a spawn (0x40137c, then 0x48b884: init at once on the previous pose's joints, as every line-4 spawn here)
function make06(state, D, modeIndex, J, ctx){
  const def = D.shells.shell06, mode = def.modes[modeIndex];
  const S = { id: state.nextId++, monId: state.monId, shell: 'shell06', cls: def.cls, globalId: def.id, base: 'base06',
              mode, modeIndex, motion: ctx.motion, state: 1, k: params06(mode.sh), position: null, anchor: null, angles: null,
              place: null, start: null, stop: null, effect: null, timer: 0, life: 0, hitT: 0 };
  const why = place06(S, J, ctx.own001);
  if (why){ ctx.out.refused.push({ shell: 'shell06', mode: modeIndex, why }); return null; }
  S.life = S.k.life; S.hitT = S.k.period;                // slot 0 (0, 99) on
  S.start = rockRequest(D, mode, 0, S.position, 'aura');
  S.effect = S.start ? { param: 0, key: S.start.key } : null;
  return S;
}
// end 0x401c88(S, 0): frozen, the effect stopped gracefully
function end06(S, out){
  S.state = 0xfe; S.timer = 0;
  S.stop = S.effect ? { param: 0, request: 0, key: S.effect.key } : null;
  out.ended.push(S);
}
// the move 0x401a18 (vt +0x24)
function step06(S, J, ctx, input, D, out){
  if (S.state === 1){
    const why = place06(S, J, ctx.own001);
    if (why) out.refused.push({ shell: 'shell06', mode: S.modeIndex, why });
    if (S.k.flags & 4){                                   // the hit slot's re-arm: every `period`, back to (0, 99)
      const T2 = S.hitT > 0 ? f(S.hitT - ctx.dt) : 0;
      S.hitT = T2 > 0 ? T2 : S.k.period;
    }
    if (S.life < 0){ S.life = 0; end06(S, out); }
    else if (S.life > 0){ const L2 = f(S.life - ctx.dt); S.life = L2 > 0 ? L2 : 0; if (!(L2 > 0)) end06(S, out); }
    return;                                               // slot 0 stays set (99 > 30): it lives
  }
  if (S.state === 0xfe){                                  // frozen where it ended
    S.timer = f(S.timer + ctx.dt);
    const gone = input.effectAlive ? !input.effectAlive(S, 0) : true;
    if (S.timer > 1800 || gone) S.state = 0xff;
  }
}
// THE MANAGER, 0x106aa48 (body vt +0x2a8, every frame; dev/em084-shell06-aura.md 9c): three handles -- L (mode 5),
// R (mode 6), B (mode 0); a missing wanted one is spawned, an unwanted one ended. The viewer's inputs (input.aura,
// index.html shellExtra): the stance (the clip, AURA084_STANCE, sticky), the charge flag (a State rung Charge 1..3), case A
// (AURA084_CASE_A), each tentacle Exposed (its form dropdown, group g1 = part state 3). NOT EVALUABLE, taken at their
// common values and named: the arm bytes [arm+0xcad8] = 1 (set every frame by the arm's 0x107d5cc; INFERRED for an arm
// clip that clears it) and E+0xcb14 != 2.
function aura084(state, D, ctx, input, out, J){
  const a = input.aura;
  if (!a) return;                                         // no aura state given (an older capture): nothing
  const H = state.aura || (state.aura = { L: null, R: null, B: null });
  const armL = 1, armR = 1;
  const spawnIf = (k, m) => {
    if (H[k]) return;
    const S = make06(state, D, m, state.prevJoints || J, ctx);
    if (S){ H[k] = S; state.shells.push(S); out.spawned.push(S); }
  };
  const endIf = k => { if (H[k]){ end06(H[k], out); H[k] = null; } };
  if (a.charge || a.caseA){ armL === 1 ? endIf('L') : spawnIf('L', 5); armR === 1 ? endIf('R') : spawnIf('R', 6); endIf('B'); }
  else if (a.stance === 1){
    endIf('B');
    (armL === 1 && a.exposedL) ? endIf('L') : spawnIf('L', 5);
    (armR === 1 && a.exposedR) ? endIf('R') : spawnIf('R', 6);
  } else {
    endIf('L'); endIf('R');
    (a.exposedL || a.exposedR) ? endIf('B') : spawnIf('B', 0);
  }
}

export function stepShells(state, input){""")

# 3. the calls
rep("""  if (D.perFrame) perFrame003(state, D, ctx, input, out, fresh);""",
    """  if (D.perFrame) perFrame003(state, D, ctx, input, out, fresh);
  if (D.aura084) aura084(state, D, ctx, input, out, J);   // Nakarkos's aura manager (0x106aa48), line 4""")
rep("""    else if (S.base === 'base02g') step02g(S, S.arm ? armJoints(input, S.arm) : J, ctx, input, D, out);""",
    """    else if (S.base === 'base02g') step02g(S, S.arm ? armJoints(input, S.arm) : J, ctx, input, D, out);
    else if (S.base === 'base06') step06(S, J, ctx, input, D, out);""")
open(p + '.tmp', 'wb').write((s.replace('\n', '\r\n') if crlf else s).encode('utf-8')); os.replace(p + '.tmp', p); print('patched')

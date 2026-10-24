p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'
BS = chr(92)
def rep(a, b, cnt=1):
    global s
    a = a.replace('\n', NL); b = b.replace('\n', NL)
    assert s.count(a) == cnt, (s.count(a), a[:70])
    s = s.replace(a, b)

# 1. POST00 hook in init00
rep("const GRAVITY00 = {};", "const GRAVITY00 = {};\n// a class's own init after base00's (its +0x13c calls 0x3f8b80, then adds): Barroth's sp_00 0xe8e614 (the spread)\nconst POST00 = {};")
rep("""  S.velocity = launchVelocity(k.vy, k.vz, S.angles);    // +0x1010
  S.launch = { point: p.slice(), target: got.target ? got.target.slice() : null, aim: d, setup, angles: S.angles.slice(),""",
"""  S.velocity = launchVelocity(k.vy, k.vz, S.angles);    // +0x1010
  if (POST00[S.cls]) POST00[S.cls](S, k, got);
  S.launch = { point: p.slice(), target: got.target ? got.target.slice() : null, aim: d, setup, angles: S.angles.slice(),""")

blk = r'''// ---- BARROTH (em044_00, uEm044_00): his mud, shell00 = 0xdd uShellEm044_00_00 on base00 and its landing's shell01 0xde ----------
// dev/em044-shells-spec.md (shells agent, 2026-10-19; emulator check dev/shells-barroth-check.mjs). The census of his reach:
//   (7, 0x00 / 0x03 / 0x0e / 0x0f) L2 M12 phase 1 at 102 and 106, (7, 0x31) L2 M17 phase 1 at 132 (0xe86e48.. and the like: the frame
//   test 0xb0968(e, 1, 0, F); P+0x1a3 == 0): 0x49d0f8(0x40) (cSetupParamEm044_00_00): +4 0xdd, +8 the mode, +0xc him, +0x10.. a GOT zero
//   vector, +0x20 0, +0x24 HIS Y WORD + the site's offset, +0x28 0, +0x2c 0, +0x2e 0xffff, +0x30 e+0x73e8 (the action's draw: the viewer's
//   H73E8_STANDIN), +0x32 the site's byte (the spread's pattern); 0x48b884. (7, 0x1e..0x2c) L2 M4 phase 2 at 52 (mode 4) lie outside
//   his command table's reach (fbbcmp): not listed.
// His sp_00 (vtable 0x17c2270; base00's move 0x3f96a0, its own init +0x13c 0xe8e614, +0x28 0xe8e8ec, reader 0xe8e930, landing 0xe8ebc0):
//   READER 0xe8e930 (R whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; +0x15e8 |= 0x20; float 0 -> the flight +0x15fc; int 0 ->
//   the joint +0x15dc; &vec 0 -> the offset +0x1610; vec 1's z / y -> vz +0x15f4 / vy +0x15f8; &vec 2 -> the gravity +0x161c; ints 1..5
//   != -1 -> bits 0 / 1 / 2 / 3 / 8 (bfc / orrne); floats 1..4 -> +0x1600 / +0x1604 (the X clamp) / +0x1608 / +0x160c (the Y clamp);
//   &vec 3 -> +0x1614, &vec 4 -> +0x1618 (the aim offset). Modes 0..4: flags 0x12c (bit 3: the base point the joint's row 3 and the
//   offset rotXYZ by the setup's words, 0x100); mode 5: 0x2d (bit 0: base00's X aim from the shell's point -- bit 2 -- clamped to
//   [300, 60] degrees).
//   INIT 0xe8e614 (R whole): base00's 0x3f8b80, then for mode < 4 / == 4 the velocity gains a push along his words (spread044).
//   +0x28 0xe8e8ec: base00's 0x4a1770, then in state 4 a ground marker 0x43b2b0 (not visual: not modelled).
//   LANDING 0xe8ebc0 (state 1): type 1 with vy > 0 -> nothing; type 1 -> ef +0x15d0 and, but for mode 5, the child 0xe8ec88 (owner
//   active 0x4a0f38): shell01 0xde mode 0 (0x3fa2bc(0x40)) at the contact, +0x30.. THIS shell's three words, +0x3c its +0x13dc; type 0 /
//   2 -> ef +0x15cc / +0x15d4; 0x3f8970 at the contact, 0x43ac04(shell, 7) (the camera), vt+0x148(0).
// His sp_01 (vtable 0x17c240c, base01, its reader 0xe8eeb0 alone): ef 0 -> +0x15c8; hit 0; +0x15ec: int 0 -> 4, int 1 -> 8; float 0 ->
//   the timer +0x15f0 (0: it lives while its hit slot does, em044_00_01_hitdata (4, 10)).
const T16_044 = [0x0, 0x3, 0xf, 0x3f, 0xff, 0x3ff, 0xfff, 0x200, 0x604, 0xa08, 0xc, 0x0, 0x0, 0x40c0, 0x0, 0x4228];   // 0x169e7b8 (u16)
const T8_044 = [0, 2, 4, 6, 8, 10, 12, 0, 0, 0, 0, 0, 192, 64, 0, 0];                                               // 0x169e7c6
const F1_044 = [0.0, 4.0, 10.0, 12.5, 1.5, 2.5, 11.5, 12.5, 630.0, 630.0, 630.0, 630.0, 0.0, 0.0, -0.6981316804885864, 0.0].map(f);   // 0x1592918
const F2_044 = [1.5, 2.5, 11.5, 12.5].map(f);                                                                      // 0x1592928
function params044s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = 0x20 | (I(1) !== -1 ? 1 : 0) | (I(2) !== -1 ? 2 : 0) | (I(3) !== -1 ? 4 : 0) | (I(4) !== -1 ? 8 : 0) | (I(5) !== -1 ? 0x100 : 0);
  return { joint: I(0), flags, flight: F(0), xLo: F(1), xHi: F(2), yLo: F(3), yHi: F(4), vec: V(0), vz: V(1)[2], vy: V(1)[1],
           gravity: V(2), aimFrom: V(3), aimOff: V(4), degX: f(0), degY: f(0), xDeg: f(0) };
}
// 0xe8e634..0xe8e8bc: H = setup +0x30 (u16), b = setup +0x32; rot = ((T16[b & 0xf] & H) >> (16 - T8[b & 0xf])) | (H << T8[b & 0xf]);
// mode < 4: s = F1[b >> 4] + (rot & 3); mode 4: s = F2[(rot & 1) | ((b & 0xf0) == 0x10 ? 2 : 0)]; then with the shell's words (u16,
// x 9.58738e-05) the push ((Z-turn of (0, 0) x 0.0), s) turned by X then Y is added to the velocity, in the instructions' order
function spread044(S, k, got){
  const m = S.modeIndex;
  if (m > 4) return;
  const H = (got.h30 == null ? H73E8_STANDIN : got.h30) & 0xffff, b = (got.b32 | 0) & 0xff, n = b & 0xf;
  const rot = ((((T16_044[n] & H) >>> ((16 - T8_044[n]) & 0xff)) | (H << T8_044[n])) >>> 0);
  const s28 = m < 4 ? f(F1_044[(b >> 4) & 0xf] + f(rot & 3)) : F2_044[(rot & 1) | ((b & 0xf0) === 0x10 ? 2 : 0)];
  const W = S.angles.map(w => u16(w));
  const rz = f(f(W[2]) * U16_TO_RAD), sZ = sinf(rz), cZ = cosf(rz);
  const rx = f(f(W[0]) * U16_TO_RAD), sX = sinf(rx), cX = cosf(rx);
  const ry = f(f(W[1]) * U16_TO_RAD), sY = sinf(ry), cY = cosf(ry);
  const a18 = f(sZ * f(0.0)), a26 = f(cZ * f(0.0));
  const s30 = f(a18 + a26);
  const s17 = mla(f(cX * s28), s30, sX);
  const s18 = f(a26 - a18);
  const v = S.velocity;
  const dx = mla(f(s18 * cY), sY, s17);
  const dy = mls(f(s30 * cX), sX, s28);
  const dz = mls(f(s17 * cY), s18, sY);
  S.velocity = [f(v[0] + dx), f(dy + v[1]), f(dz + v[2])];
}
function landing044s00(S, D, hit, ctx){
  if (hit.type === 1 && S.velocity[1] > 0) return 'keep';
  if (hit.type === 1 && S.modeIndex !== 5 && ctx && ctx.create)
    ctx.create(S, 'shell01', { mode: 0, position: hit.point.slice(), angles: S.angles.map(w => w >>> 0), action: S.action, frame: S.spawnFrame });
  const param = [1, 2, 3][hit.type];
  if (param != null) contactStart(S, D, param, hit.point, 'landing');
}
READER00.uShellEm044_00_00 = (def, mode) => params044s00(def, mode);
AIMX00.uShellEm044_00_00 = (S, k, p, got) => xAdjust37(k, p, got);
POST00.uShellEm044_00_00 = spread044;
READERS01[0xe8eeb0] = params042s01;   // (the same map as Barioth's sp_01 0xe72598: ef 0, hit 0, int 0 -> 4, int 1 -> 8, float 0 the timer)
LANDING.uShellEm044_00_00 = landing044s00;
WORDS00.add('uShellEm044_00_00');
function spawn044(state, D, a, ctx, input, out){
  const own = ctx.own001;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (!own.facing){ out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, frame: sp.frame, why: 'em044_00 shell00: no owner facing (input.owner.y)' }); continue; }
    if (sp.mode === 5 && !own.target){ out.refused.push({ action: a.action, shell: 'shell00', mode: 5, frame: sp.frame, why: 'em044_00 shell00 mode 5: no target (its X aim)' }); continue; }
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, state.prevJoints, ctx,
                        { requestPos: [0, 0, 0], requestAngles: [0, ((own.ownerY >>> 0) + sp.dY) & 0xffff, 0],
                          ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(), target: own.target ? own.target.slice() : null,
                          ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ, h30: H73E8_STANDIN, b32: sp.b32 });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, frame: sp.frame, why: 'em044_00 shell00: the init refused' });
  }
}
SHELL_DATA.em044_00 = {
  name: 'Barroth',
  lists: { 0: { list: 'u', pel: 'em044_00u' } },
  actions: [
    [0x00, 'Motion[12]', [[102, 2, 0xc500, 3], [106, 2, 0x9000, 20]]],
    [0x03, 'Motion[12]', [[102, 1, 0x2000, 0], [106, 1, 0xb500, 17]]],
    [0x0e, 'Motion[12]', [[102, 3, 0x0000, 50], [106, 2, 0xa000, 33]]],
    [0x0f, 'Motion[12]', [[102, 1, 0xe000, 16], [106, 1, 0x0000, 33]]],
    [0x31, 'Motion[17]', [[132, 5, 0x0000, 0]]],
  ].map(([n, clip, shots]) => ({ action: [7, n], code: 'em044', list: '2', clip, partners: [], shell: 'shell00', pick: 'ai',
                                variant: '7:0x' + n.toString(16).padStart(2, '0'),
                                spawns: shots.map(([frame, mode, dY, b32]) => ({ frame, mode, modes: [mode], dY, b32 })) })),
  shells: {
    shell00: { id: 0xdd, cls: 'uShellEm044_00_00', base: 'base00', reader: 0xe8e930, folder: 'shell@@BS@@em@@BS@@em044_00_shell00',
      lists: { 0: { list: 'u', pel: 'em044_00u' } },
      modes: {
@@MODES00@@
      },
      hitdata: [[0, 99]] },
    shell01: { id: 0xde, cls: 'uShellEm044_00_01', base: 'base01', reader: 0xe8eeb0, folder: 'shell@@BS@@em@@BS@@em044_00_shell01',
      lists: { 0: { list: 'u', pel: 'em044_00u' } },
      modes: { 0: { scale: 1.0, ef: [[0, 30]], hit: [0], sh: { ints: [0, 0], floats: [0.0], vecs: [] } } },
      hitdata: [[4, 10]] },
  },
};
'''
import ast, json
L = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\shl_em044_00.txt', encoding='utf8').read().split('\n')
i = [k for k, l in enumerate(L) if l.startswith('== ') and 'shell00' in l][0]
modes = []
for l in L[i+2:i+2+6]:
    l = l.strip(); assert l.startswith('mode '), l
    n = int(l.split()[1]); d = json.loads(l[l.index('{'):])
    ef = [[a, (-1 if b == 4294967295 else b)] for a, b in d['ef'][0]['arr']]
    modes.append("        %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(d['hit']['ints']), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
blk = blk.replace('@@MODES00@@', '\n'.join(modes)).replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- BASE60 / BASE61'
assert s.count(A) == 1
s = s.replace(A, blk + A)
rep("  } else if (a && !fresh && state.prevJoints && a.code === 'em042'){",
    "  } else if (a && !fresh && state.prevJoints && a.code === 'em044'){\n    spawn044(state, D, a, ctx, input, out);                  // Barroth's mud\n  } else if (a && !fresh && state.prevJoints && a.code === 'em042'){")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')

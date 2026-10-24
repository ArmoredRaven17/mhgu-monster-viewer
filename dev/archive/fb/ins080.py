p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'
BS = chr(92)
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
def rep(a, b, cnt=1):
    global s
    a = a.replace('\n', NL); b = b.replace('\n', NL)
    assert s.count(a) == cnt, (s.count(a), a[:70])
    s = s.replace(a, b)

blk = r'''// ---- GLAVENUS (em080_00, uEm080_00): sp_00 0x146 (base00), sp_01 0x147 (base01), sp_03 0x148 (base03) -- dev/em080-shells-spec.md
// (shells agent, 2026-10-20; dev/shells-glavenus-check.mjs). Ids from e+0xcbe0 / +0xcbe4 / +0xcbe8. The census of his reach (trgen
// g80cap.py; the census's other creates are hit volumes, ef (999, -1)):
//   (7, 0x02) L2 M2 at 122: sp_03 9 / 10 / 11; (7, 0x0b) L2 M11 at 132: sp_03 18 / 19 / 20 (the request +0x10 (0, 300, 0) and words
//   (0, his Y + .., 0), neither read: the reader sets no 0x10 / 0x20)
//   (7, 0x09) L2 M9 (phase 1 from 52) phase 2 at 70 / 120 / 168: sp_00 7 / 8 / 9; (7, 0x0a / 0x0c) L2 M10 (phase 1 from 38) phase 2 at
//   92: sp_00 0 / 6; (7, 0x5c) L2 M55 / (7, 0x5d) L2 M57 at 56: sp_00 4 / 5 (the base00 request: zeros)
// His sp_00 (vtable 0x17ebd48; reader 0x100f9fc -> 0x100fa38 for 0x146, 0x100fd3c for Hellblade's 0x149; landing 0x1010018): ef 0..3;
//   hit 0; ints 0 / 1 / 2 -> the joint +0x15dc / the cameras +0x15e0 / +0x15e4; ints 3..8 -> +0x15e8 bits 0 / 1 / 2 / 3 / 7 / 11 (bfc /
//   orrne); floats 0..7 -> +0x15ec (X deg) / +0x15f0 (Y deg) / +0x15f4 (vz) / +0x15fc (the flight) / +0x1600 / +0x1604 (the X clamp) /
//   +0x1608 / +0x160c (the Y clamp); &vec 0 / 1 / 2 -> +0x1610 (the offset) / +0x1614 (the aim's origin) / +0x1618 (the aim offset);
//   cmn float 0 -> +0x15c4; byte +0x15c1 = 0. No vy, no gravity (+0x161c the ctor's zero). LANDING (state 1): type 0 / 1 -> ef 1 / 2 and
//   (owner active) byte +0x15c0 = 1 and, for a mode <= 0x2c not in 10..34, shell01 [owner+0xcbe4] of the table 0x16a1dc0 (modes 0..9:
//   17 0 0 0 0 0 17 0 0 0; 35..44: 19 2 2 2 2 2 19 2 2 2) at the contact, the words a GOT zero, +0x3c 0xffff; type 2 -> ef 3 only with
//   byte +0x15c1 0; then 0x3f8970, the end
// His sp_01 (vtable 0x17ebec4; reader 0x1010418, +0x154 0x101052c in base01's end): ef 0; hit 0 / 1; int 0 -> bit 0; int 1 -> the joint
//   +0x15e4; int 2 -> 4; int 3 -> 8; float 0 -> the timer +0x15f0; &vec 0 -> +0x1608. +0x154: (owner active) mode 0 / 2 / 17 / 19 leaves
//   shell01 1 / 3 / 18 / 20 at its point (words a GOT zero, +0x3c 0xffff)
// His sp_03 (vtable 0x17ec034, base03: init 0x3fd9d8, move 0x3fdce4; reader 0x1010964 -> 0x101099c / 0x1010b88, +0x150 0x1010d4c):
//   ef 0..3; hit 0; int 0 -> the joint; int 1 -> 0x80 (the size), int 2 -> 0x800, int 3 -> 8 (bit 3: the offset turned by the words);
//   floats 0 / 1 / 2 -> the fan +0x15f0, the speed +0x15f4, the life +0x15fc; &vec 0 -> +0x1610; &vec 1 -> +0x1614; floats 3 / 4 ->
//   +0x167c / +0x1680 (the follow's reach); byte +0x15c1 = mode in 6..23. +0x150: type 1 for modes 6..23 -> nothing (the bolt goes on)
function params080s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0.0);
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  const flags = (I(3) !== -1 ? 1 : 0) | (I(4) !== -1 ? 2 : 0) | (I(5) !== -1 ? 4 : 0) | (I(6) !== -1 ? 8 : 0) | (I(7) !== -1 ? 0x80 : 0) |
                (def.id === 0x146 && I(8) !== -1 ? 0x800 : 0);
  return { joint: I(0), flags, degX: F(0), degY: F(1), xDeg: F(0), yDeg: F(1), vz: F(2), vy: f(0.0), flight: F(3), xLo: F(4), xHi: F(5),
           yLo: F(6), yHi: F(7), vec: V(0), from: V(1), aimOff: V(2), gravity: ZERO3.slice() };
}
const CHILD080 = [17, 0, 0, 0, 0, 0, 17, 0, 0, 0];
const CHILD080B = [19, 2, 2, 2, 2, 2, 19, 2, 2, 2];
function landing080s00(S, D, hit, ctx){
  const m = S.modeIndex;
  if (hit.type === 0 || hit.type === 1){
    if (m <= 0x2c && !(m >= 10 && m < 35) && ctx && ctx.create){
      const cm = m < 10 ? CHILD080[m] : CHILD080B[m - 35];
      ctx.create(S, 'shell01', { mode: cm, position: hit.point.slice(), angles: [0, 0, 0], action: S.action, frame: S.spawnFrame });
    }
    contactStart(S, D, hit.type === 0 ? 1 : 2, hit.point, 'landing');
  } else if (hit.type === 2 && !S.k.b15c1) contactStart(S, D, 3, hit.point, 'landing');
}
READER00.uShellEm080_sp_00 = (def, mode) => params080s00(def, mode);
AIMX00.uShellEm080_sp_00 = (S, k, p, got) => xAdjust37(k, p, got);
AIMY00.uShellEm080_sp_00 = (S, k, p, got) => yAdjust37(k, p, got);
LANDING.uShellEm080_sp_00 = landing080s00;
function params080s01(sh){
  const I = i => !sh ? -1 : i < sh.ints.length ? sh.ints[i] : -1, F = i => !sh ? 0 : i < sh.floats.length ? f(sh.floats[i]) : f(0);
  const V = i => !sh ? [0, 0, 0] : i < sh.vecs.length ? sh.vecs[i].map(f) : [0, 0, 0];
  const flags = (I(0) !== -1 ? 1 : 0) | (I(2) !== -1 ? 4 : 0) | (I(3) !== -1 ? 8 : 0);
  return { flags, joint: I(1), timer: F(0), f1600: f(0.0), f15fc: f(1.0), vec: V(0), deg: [0, 0, 0], up: f(500.0), down: f(500.0),
           maxH: f(900.0), why: !sh ? 'uShellEm080_sp_01: a mode SHELL_DATA does not carry' : null, efAt: { 0x15c8: 0, 0x15cc: null, 0x15d0: null } };
}
READERS01[0x1010418] = params080s01;
const END_MODES080 = new Map([[0, 1], [2, 3], [17, 18], [19, 20]]);
function endCreate080(S, ctx, events){
  if (!END_MODES080.has(S.modeIndex) || !ctx || !ctx.create) return;
  ctx.create(S, 'shell01', { mode: END_MODES080.get(S.modeIndex), position: S.position.slice(), angles: [0, 0, 0] }, events);
}
function params080s03(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);
  return { joint: I(0), fanDeg: F(0), speed: F(1), life: F(2), vec: (sh.vecs[0] || ZERO3).map(f),
           flags: (I(1) !== -1 ? 0x80 : 0) | (def.id === 0x148 && I(2) !== -1 ? 0x800 : 0) | (I(3) !== -1 ? 8 : 0),
           reach: f(500.0), follow: F(3), slope: false, ground: -1 };
}
READER03.uShellEm080_sp_03 = (def, mode) => params080s03(def, mode);
function spawn080(state, D, a, ctx, input, out){
  const own = ctx.own001, J = state.prevJoints;
  for (const sp of a.spawns){
    if (!pass001(state, f(sp.frame))) continue;
    if (!own.facing){ out.refused.push({ action: a.action, shell: sp.shell, mode: sp.mode, why: 'no owner facing (input.owner.y)' }); continue; }
    if (sp.shell === 'shell03'){
      const got = boltInputs(input);
      if (got.why){ out.refused.push({ action: a.action, shell: 'shell03', mode: sp.mode, why: got.why }); continue; }
      for (const S of spawnBolts(state, D, { ...a, shell: 'shell03', modes: [sp.mode], frame: sp.frame }, J, ctx, got, out)){ out.spawned.push(S); state.shells.push(S); }
      continue;
    }
    const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, J, ctx,
                        { requestPos: [0, 0, 0], requestAngles: [0, 0, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                          target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ, y5c: own.y5c });
    if (S){ out.spawned.push(S); state.shells.push(S); }
    else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'em080 shell00: the init refused' });
  }
}
{
  const D = {
    name: 'Glavenus',
    lists: { 0: { list: 'u', pel: 'em080_00u' } },
    actions: [],
    shells: {
      shell00: { id: 0x146, cls: 'uShellEm080_sp_00', base: 'base00', reader: 0x100f9fc, folder: 'shell@@BS@@em@@BS@@em080_00_shell00',
        lists: { 0: { list: 'u', pel: 'em080_00u' } }, cmn: { ints: [], floats: @@CMN00@@, vecs: [] }, modes: {
@@MODES00@@
        }, hitdata: @@HD00@@ },
      shell01: { id: 0x147, cls: 'uShellEm080_sp_01', base: 'base01', reader: 0x1010418, folder: 'shell@@BS@@em@@BS@@em080_00_shell01',
        lists: { 0: { list: 'u', pel: 'em080_00u' } }, modes: {
@@MODES01@@
        }, hitdata: @@HD01@@ },
      shell03: { id: 0x148, cls: 'uShellEm080_sp_03', base: 'base03', reader: 0x1010964, folder: 'shell@@BS@@em@@BS@@em080_00_shell03',
        lists: { 0: { list: 'u', pel: 'em080_00u' } }, modes: {
@@MODES03@@
        }, hitdata: @@HD03@@ },
    },
  };
  const A = (n, clip, spawns) => ({ action: [7, n], code: 'em080', list: '2', clip, partners: [], pick: 'ai',
    variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns });
  D.actions.push(A(0x02, 'Motion[2]', [9, 10, 11].map(m => ({ frame: 122, shell: 'shell03', mode: m, modes: [m] }))));
  D.actions.push(A(0x0b, 'Motion[11]', [18, 19, 20].map(m => ({ frame: 132, shell: 'shell03', mode: m, modes: [m] }))));
  D.actions.push(A(0x09, 'Motion[9]', [[70, 7], [120, 8], [168, 9]].map(([frame, m]) => ({ frame, shell: 'shell00', mode: m, modes: [m] }))));
  D.actions.push(A(0x0a, 'Motion[10]', [{ frame: 92, shell: 'shell00', mode: 0, modes: [0] }]));
  D.actions.push(A(0x0c, 'Motion[10]', [{ frame: 92, shell: 'shell00', mode: 6, modes: [6] }]));
  D.actions.push(A(0x5c, 'Motion[55]', [{ frame: 56, shell: 'shell00', mode: 4, modes: [4] }]));
  D.actions.push(A(0x5d, 'Motion[57]', [{ frame: 56, shell: 'shell00', mode: 5, modes: [5] }]));
  SHELL_DATA.em080_00 = D;
}
'''
import json, ast, subprocess, sys
L = open(SP + r'\shl_em080_00.txt', encoding='utf8').read().split('\n')
def modes_of(tag):
    i = [k for k, l in enumerate(L) if l.startswith('== ') and tag in l][0]
    out = []; cmn = None
    for l in L[i+1:]:
        l2 = l.strip()
        if l2.startswith('=='): break
        if l2.startswith('cmn path') and '{' in l2 and 'NOT IN ARC' not in l2:
            cmn = ast.literal_eval(l2[l2.index('{'):])
        if not l2.startswith('mode '): continue
        n = int(l2.split()[1]); d = json.loads(l2[l2.index('{'):])
        ef = [[a, (-1 if b == 4294967295 else b)] for a, b in d['ef'][0]['arr']]
        out.append("          %d: { scale: %r, ef: %s, hit: %s, sh: { ints: %s, floats: %s, vecs: %s } }," % (n, d['scale'][0], json.dumps(ef).replace(' ', ''), json.dumps(d['hit']['ints']), json.dumps(d['sh']['ints']), json.dumps(d['sh']['floats']), json.dumps(d['sh']['vecs'])))
    return '\n'.join(out), cmn
hd = subprocess.check_output([sys.executable, SP + r'\hit.py', 'em080_00'], text=True)
HD = {}
for line in hd.strip().split('\n'):
    parts = line.split(' ', 3)
    HD[parts[1]] = json.dumps([list(t) for t in ast.literal_eval(parts[3])])
m00, c00 = modes_of('shell00'); m01, _ = modes_of('shell01'); m03, _ = modes_of('shell03')
blk = blk.replace('@@MODES00@@', m00).replace('@@MODES01@@', m01).replace('@@MODES03@@', m03).replace('@@CMN00@@', json.dumps(c00['floats'] if c00 else []))
blk = blk.replace('@@HD00@@', HD.get('em080_00_00_hitdata', '[]')).replace('@@HD01@@', HD.get('em080_00_01_hitdata', '[]')).replace('@@HD03@@', HD.get('em080_00_03_hitdata', '[]'))
blk = blk.replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- BASE60 / BASE61'
assert s.count(A) == 1
s = s.replace(A, blk + A)
rep("  if (S.cls === 'uShellEm036_sp_01') return endCreate036(S, ctx, events);",
    "  if (S.cls === 'uShellEm036_sp_01') return endCreate036(S, ctx, events);\n  if (S.cls === 'uShellEm080_sp_01') return endCreate080(S, ctx, events);")
rep("  } else if (a && !fresh && state.prevJoints && a.code === 'em045'){",
    "  } else if (a && !fresh && state.prevJoints && a.code === 'em080'){\n    spawn080(state, D, a, ctx, input, out);                  // Glavenus's / Hellblade's shells\n  } else if (a && !fresh && state.prevJoints && a.code === 'em045'){")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok', HD.keys())

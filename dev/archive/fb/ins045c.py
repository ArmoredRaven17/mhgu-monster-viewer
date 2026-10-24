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

b32 = open(SP + r'\b32_block.js', encoding='utf8').read()
blk = b32 + r'''// ---- CRYSTALBEARD URAGAAN (em045_04, uEm045_00 variant 4): sp_00 0xe2 (base00), sp_01 0xe3, sp_13 0xe4 (Uragaan's classes) and the
// crystals sp_32 0xe5 (base32, above) -- dev/em045-shells-spec.md 4 (shells agent, 2026-10-19; dev/shells-crystalbeard-check.mjs). Ids
// from e+0xcb10 (sp_00) / +0xcb14 / +0xcb18 / +0xcb1c (sp_32). The census of his reach (trgen c45cap.py / c45cap2.py):
//   (7, 0x00) L2 M1 at 180, (7, 0x8a) L2 M10 phase 4 at 226: sp_01 MODE 8 (Uragaan's request); (7, 0x8e) L2 M16 at 202: sp_13 0
//   (7, 0xe5): phase 0 L9 M3, phase 1 L2 M10 from 94; phase 2 at 100 / 110: sp_32 26 / 24; phase 5 at 226: sp_01 8 -- all on L2 M10
//   (7, 0xe6 / 0xea) L9 M1 at 114: sp_00 8 / 0; (7, 0xe7 / 0xeb) L9 M2 at 114: sp_00 10 / 2
//   (7, 0xf4..0xff) L2 M4 phase 1 at 202 (0xe9a498 / 0xe9a53c / 0xe9a600, the three sites): sp_32 by the action (the spec's table)
// His sp_00 reader 0xe9dbd0 (R whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0 -> +0x15d8; int 0 -> the joint +0x15dc; vec 0's z / y -> vz
//   +0x15f4 / vy +0x15f8; vec 3's x / y -> the degree offsets +0x15ec / +0x15f0; &vec 2 -> the offset +0x1610; &vec 1 -> the gravity
//   +0x161c; +0x15e8 |= 5 (bit 0: base00's X aim; bit 2: from the shell's point; the clamp +0x1600 / +0x1604 the ctor's 0); his +0x150
//   0xe9dd34 is base00's own shape (the param by type, 0x3f8970, the end)
function params045s00(def, mode){
  const sh = mode.sh, I = i => i < sh.ints.length ? sh.ints[i] : -1;
  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();
  return { joint: I(0), flags: 5, flight: f(0.0), vz: V(0)[2], vy: V(0)[1], degX: V(3)[0], degY: V(3)[1], xDeg: V(3)[0],
           xLo: f(0.0), xHi: f(0.0), vec: V(2), gravity: V(1), aimOff: ZERO3.slice() };
}
READER00.uShellEm045_sp_00 = (def, mode) => params045s00(def, mode);
AIMX00.uShellEm045_sp_00 = (S, k, p, got) => xAdjust37(k, p, got);
{
  const D = {
    name: 'Crystalbeard Uragaan', variant: 4,
    lists: { 0: { list: 'u', pel: 'em045_04u' } },
    actions: [],
    shells: {
      shell00: { id: 0xe2, cls: 'uShellEm045_sp_00', base: 'base00', reader: 0xe9dbd0, folder: 'shell@@BS@@em@@BS@@em045_04_shell00',
        lists: { 0: { list: 'u', pel: 'em045_04u' } }, modes: {
@@MODES00@@
        }, hitdata: [[0, 9999], [0, 9999]] },
      shell01: { id: 0xe3, cls: 'uShellEm045_sp_01', base: 'base01', reader: 0xe9dec8, folder: 'shell@@BS@@em@@BS@@em045_04_shell01',
        lists: { 0: { list: 'u', pel: 'em045_04u' } }, modes: {
@@MODES01@@
        }, hitdata: [[8, 10], [2, 6], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [0, 100], [8, 10], [0, 20], [0, 10]] },
      shell13: { id: 0xe4, cls: 'uShellEm045_sp_13', base: 'base13', reader: 0xe9e1f8, folder: 'shell@@BS@@em@@BS@@em045_04_shell13',
        lists: { 0: { list: 'u', pel: 'em045_04u' } }, modes: {
@@MODES13@@
        }, hitdata: [[0, 100]] },
      shell32: { id: 0xe5, cls: 'uShellEm045_sp_32', base: 'base32', reader: 0xe9e6dc, folder: 'shell@@BS@@em@@BS@@em045_04_shell32',
        lists: { 0: { list: 'u', pel: 'em045_04u' } }, cmn: { ints: [], floats: @@CMN32@@, vecs: [] }, modes: {
@@MODES32@@
        }, hitdata: [[20, 99], [20, 99]] },
    },
  };
  const A = (n, list, clip, spawns) => ({ action: [7, n], code: 'em045', list, clip, partners: [], pick: 'ai',
    variant: '7:0x' + n.toString(16).padStart(2, '0'), spawns });
  D.actions.push(A(0x00, '2', 'Motion[1]', [{ frame: 180, shell: 'shell01', mode: 8, modes: [8] }]));
  D.actions.push(A(0x8a, '2', 'Motion[10]', [{ frame: 226, shell: 'shell01', mode: 8, modes: [8] }]));
  D.actions.push(A(0x8e, '2', 'Motion[16]', [{ frame: 202, shell: 'shell13', mode: 0, modes: [0] }]));
  D.actions.push(A(0xe5, '2', 'Motion[10]', [{ frame: 100, shell: 'shell32', mode: 26, modes: [26] }, { frame: 110, shell: 'shell32', mode: 24, modes: [24] },
                                             { frame: 226, shell: 'shell01', mode: 8, modes: [8] }]));
  for (const [n, clip, m] of [[0xe6, 'Motion[1]', 8], [0xea, 'Motion[1]', 0], [0xe7, 'Motion[2]', 10], [0xeb, 'Motion[2]', 2]])
    D.actions.push(A(n, '9', clip, [{ frame: 114, shell: 'shell00', mode: m, modes: [m] }]));
  for (const [n, ms] of [[0xf4, [3, 4, 5]], [0xf5, [30, 4, 5]], [0xf6, [3, 31, 5]], [0xf7, [3, 4, 32]], [0xf8, [4]], [0xf9, [31]],
                         [0xfa, [9, 10, 11]], [0xfb, [36, 10, 11]], [0xfc, [9, 37, 11]], [0xfd, [9, 10, 38]], [0xfe, [10]], [0xff, [37]]])
    D.actions.push(A(n, '2', 'Motion[4]', ms.map(m => ({ frame: 202, shell: 'shell32', mode: m, modes: [m] }))));
  SHELL_DATA.em045_04 = D;
}
'''
import json, ast
L = open(SP + r'\shl_em045_04.txt', encoding='utf8').read().split('\n')
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
m00, _ = modes_of('shell00'); m01, _ = modes_of('shell01'); m13, _ = modes_of('shell13'); m32, c32 = modes_of('shell32')
blk = blk.replace('@@MODES00@@', m00).replace('@@MODES01@@', m01).replace('@@MODES13@@', m13).replace('@@MODES32@@', m32)
blk = blk.replace('@@CMN32@@', json.dumps(c32['floats'] if c32 else [])).replace('@@BS@@', BS + BS).replace('\n', NL)
A = '// ---- BASE60 / BASE61'
assert s.count(A) == 1
s = s.replace(A, blk + A)
# spawn045: sp_32 and sp_00
rep("""    if (sp.shell === 'shell13'){
      const r = make045s13(state, D, sp.mode, J, own, ctx, a, sp.frame);""", """    if (sp.shell === 'shell32'){ make32(state, D, sp, J, own, ctx, out, a.action, f(sp.frame)); continue; }
    if (sp.shell === 'shell00'){
      if (!own.facing){ out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'no owner facing (input.owner.y)' }); continue; }
      const S = spawnRock(state, D, { ...a, shell: 'shell00', mode: sp.mode, frame: sp.frame }, J, ctx,
                          { requestPos: [0, 0, 0], requestAngles: [0, 0, 0], ownerPos: own.ownerPos ? own.ownerPos.slice() : null, size: own.size.slice(),
                            target: own.target ? own.target.slice() : null, ownerX: own.ownerX, ownerY: own.ownerY, ownerZ: own.ownerZ });
      if (S){ out.spawned.push(S); state.shells.push(S); }
      else out.refused.push({ action: a.action, shell: 'shell00', mode: sp.mode, why: 'em045_04 shell00: the init refused' });
      continue;
    }
    if (sp.shell === 'shell13'){
      const r = make045s13(state, D, sp.mode, J, own, ctx, a, sp.frame);""")
rep("    else if (S.base === 'base28') step28(S, J, ctx, input, D, out);   // Seregios's bladescales\n",
    "    else if (S.base === 'base28') step28(S, J, ctx, input, D, out);   // Seregios's bladescales\n    else if (S.base === 'base32') step32(S, J, ctx, input, D, out);   // Crystalbeard's crystals\n")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok', c32)

import subprocess
BS = chr(92)
js = open('amatsu.js', encoding='utf8').read()
out = subprocess.check_output(['python', 'gen058.py'], text=True)
blocks = {b[:2]: b[3:].rstrip('\n') for b in out.split('MODES ')[1:]}
def body(nn):
    lines = blocks[nn].split('\n')
    return '\n'.join(lines[:-1]), lines[-1].split('hitdata: ')[1].rstrip(' },')
def folder(nn): return "'shell" + BS + BS + "em" + BS + BS + "em058_00_shell%s'" % nn
LU = "lists: { 0: { list: 'u', pel: 'em058_00u' } }"
LUC = "lists: { 0: { list: 'u', pel: 'em058_00u' }, 1: { list: 'c', pel: 'em058_00c' } }"
parts = []
m, hd = body('00')
parts.append("    shell00: { id: 0xfc, cls: 'uShellEm058_sp_00', base: 'base00', folder: %s, %s,\n      modes: {\n%s\n      },\n      hitdata: %s }," % (folder('00'), LU, m, hd))
m, hd = body('01')
parts.append("    shell01: { id: 0xfd, cls: 'uShellEm058_sp_01', base: 'base01', reader: 0xf0f794, folder: %s, %s,\n      cmn: { ints: [], floats: [15.0, 120.0, 330.0, 2.0, 460.0, 510.0], vecs: [] },\n      modes: {\n%s\n      },\n      hitdata: %s }," % (folder('01'), LUC, m, hd))
m, hd = body('30')
parts.append("    shell30: { id: 0x101, cls: 'uShellEm058_sp_30', base: 'base30', folder: %s, %s,\n      modes: {\n%s\n      },\n      hitdata: %s }," % (folder('30'), LU, m, hd))
js = js.replace('@@SHELLS@@', '\n'.join(parts))
assert '@@' not in js
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
anchor = "// ---- BASE60 / BASE61: Ahtal-Ka's web anchors"
assert s.count(anchor) == 1
s = s.replace(anchor, js.lstrip('\n') + '\n' + anchor)
reps = [
  ("  } else if (a && a.code === 'em050'){\n",
   "  } else if (a && a.code === 'em058'){\n    spawn058(state, D, a, ctx, input, out, fresh);           // Amatsu's water ball, whirlwinds and the (7, 0xc) burst\n  } else if (a && a.code === 'em050'){\n"),
  ("    else if (S.base === 'base41') step41(S, ctx, input, D, out);   // Alatreon's meteors\n",
   "    else if (S.base === 'base41') step41(S, ctx, input, D, out);   // Alatreon's meteors\n    else if (S.base === 'base30') step30(S, ctx, input, D, out);   // Amatsu's whirlwinds\n"),
  ("                                : def.base === 'base20' ? null                            // (Teostra's ring: the owner's point)\n",
   "                                : def.base === 'base20' || def.base === 'base30' ? null   // (Teostra's ring, Amatsu's whirlwinds: the owner's point)\n"),
  ("  if (S.cls === 'uShellEm036_sp_01') return endCreate036(S, ctx, events);\n",
   "  if (S.cls === 'uShellEm036_sp_01') return endCreate036(S, ctx, events);\n  if (S.cls === 'uShellEm058_sp_01') return endCreate058(S, ctx, events);\n"),
  ("  S.position = pos;                                     // +0x40; anchor +0x1000, +0x10f0 = y (0x3fabf0..0x3fac18)\n  S.anchor = pos.slice();\n",
   "  S.position = pos;                                     // +0x40; anchor +0x1000, +0x10f0 = y (0x3fabf0..0x3fac18)\n  S.anchor = pos.slice();\n"
   "  // flag 0x200 (0x3fac20, READ 2026-10-19): the anchor = the setup's +0x20.. (the GOT's zero vector unless the maker wrote it: Amatsu's\n"
   "  // (7, 2) the block point); flag 0x400 (0x3fac58): the vec pointer set -> y = the ground (block +0x5b4) + vec.y, the anchor's y too\n"
   "  if (k.flags & 0x200) S.anchor = (setup.v20 || [0, 0, 0]).map(f);\n"
   "  if (k.flags & 0x400){\n    if (got.ground == null) return false;\n    const y = f(got.ground + k.vec[1]);\n    S.position[1] = y; S.anchor[1] = y;\n  }\n"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')

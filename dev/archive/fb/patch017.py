import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(old, new):
    global s
    o, n = fix(old), fix(new)
    if s.count(o) != 1: sys.exit('anchor %d: %r' % (s.count(o), old[:80]))
    s = s.replace(o, n)
blk = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\cepha.js', encoding='utf8').read()
anchor = '// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole: ctor 0x42ecb8'
rep(anchor, blk.lstrip('\n') + '\n' + anchor)
rep("                   uShellEm083_04_00: (def, mode) => params083s040(def, mode),",
    "                   uShellEm083_04_00: (def, mode) => params083s040(def, mode),\n                   // Cephadrome's sp_00 0xda39fc (the sand spits)\n                   uShellEm017_sp_00: (def, mode) => params017s00(def, mode),")
rep("                 uShellEm083_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };",
    "                 uShellEm083_sp_00: (S, k, p, got) => xAdjust37(k, p, got), uShellEm017_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };")
rep("                  uShellEm083_04_00: (S, D, hit, ctx) => landing083s002(S, D, hit, ctx) };",
    "                  uShellEm083_04_00: (S, D, hit, ctx) => landing083s002(S, D, hit, ctx),\n                  uShellEm017_sp_00: (S, D, hit, ctx) => landing017s00(S, D, hit, ctx) };")
rep("0x10637c4: sh => params083s01(sh) };", "0x10637c4: sh => params083s01(sh), 0xda3eb4: sh => params017s01(sh) };")
rep("  } else if (a && a.code === 'em083'){\n", "  } else if (a && a.code === 'plain'){\n    spawnPlain(state, D, a, ctx, input, out, fresh);         // the plain spawners (Cephadrome's, ..)\n  } else if (a && a.code === 'em083'){\n")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')

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
blk = open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\ludroth.js', encoding='utf8').read()
anchor = '// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole: ctor 0x42ecb8'
rep(anchor, blk.lstrip('\n') + '\n' + anchor)
rep("                   uShellEm036_sp_00: (def, mode) => params036s00(def, mode),",
    "                   uShellEm036_sp_00: (def, mode) => params036s00(def, mode),\n                   // Royal Ludroth's sp_00 0xeb4398 (the water spits)\n                   uShellEm047_sp_00: (def, mode) => params047s00(def, mode),")
rep("                 uShellEm036_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };",
    "                 uShellEm036_sp_00: (S, k, p, got) => xAdjust37(k, p, got), uShellEm047_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };")
rep("                  uShellEm036_sp_00: (S, D, hit, ctx) => landing036s00(S, D, hit, ctx) };",
    "                  uShellEm036_sp_00: (S, D, hit, ctx) => landing036s00(S, D, hit, ctx),\n                  uShellEm047_sp_00: (S, D, hit, ctx) => landing047s00(S, D, hit, ctx) };")
rep("0xe469d8: sh => params036s01(sh) };", "0xe469d8: sh => params036s01(sh), 0xeb4808: sh => params047s01(sh) };")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')

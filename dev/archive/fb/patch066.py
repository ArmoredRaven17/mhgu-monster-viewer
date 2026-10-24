import re
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
src = open(P, encoding='utf8', newline='').read()
blk = open(D + 'tetsu066.js', encoding='utf8').read()

def section(fn, name):
    out, on = [], False
    for l in open(D + fn, encoding='utf8'):
        if l.startswith('// '):
            on = l.strip() == '// ' + name; continue
        if on and l.strip(): out.append('        ' + l.strip())
    assert out, (fn, name)
    return '{\n' + '\n'.join(out) + '\n      }'

for tag, fn, nm in (('M00_00', 'gen066_00.out', 'em066_00_00'), ('M00_04', 'gen066_04.out', 'em066_04_00'),
                    ('M01_00', 'gen066_00.out', 'em066_00_01'), ('M01_04', 'gen066_04.out', 'em066_04_01'),
                    ('M13_00', 'gen066_00.out', 'em066_00_13'), ('M13_04', 'gen066_04.out', 'em066_04_13'),
                    ('M16_00', 'gen066_00.out', 'em066_00_16'), ('M16_04', 'gen066_04.out', 'em066_04_16')):
    blk = blk.replace('@' + tag + '@', section(fn, nm))
assert '@' not in blk
blk = blk.replace('\r\n', '\n')

def rep(old, new, count=1):
    global src
    assert src.count(old) == count, (old[:80], src.count(old))
    src = src.replace(old, new)

anchor = '// ---- BASE60 / BASE61: Ahtal-Ka\'s web anchors (shell60, shell61)'
rep(anchor, blk + '\n' + anchor)
rep("const READER00 = { uShellEm004_sp_00: (def, mode) => params04r(def, mode),\n",
    "const READER00 = { uShellEm004_sp_00: (def, mode) => params04r(def, mode),\n"
    "                   // Tetsucabra's / Drilltusk's sp_00 0xf64f38 (no int: the owner's point and words)\n"
    "                   uShellEm066_sp_00: (def, mode) => params066s00(def, mode),\n")
rep("0x104ec34: sh => params082s01(sh) };", "0x104ec34: sh => params082s01(sh), 0xf65250: sh => params066s01(sh) };")
rep("                    uShellEm065_sp_13: (S, D, ctx, out) => landing065s13(S, D, ctx, out),\n",
    "                    uShellEm065_sp_13: (S, D, ctx, out) => landing065s13(S, D, ctx, out),\n"
    "                    uShellEm066_sp_13: (S, D, ctx, out) => landing066s13(S, D, ctx, out),\n")
rep("""  } else if (a && a.code === 'em049'){
    spawn049(state, D, a, ctx, input, out, fresh);           // Agnaktor's lava drips
""", """  } else if (a && a.code === 'em049'){
    spawn049(state, D, a, ctx, input, out, fresh);           // Agnaktor's lava drips
  } else if (a && a.code === 'em066'){
    spawn066(state, D, a, ctx, input, out, fresh);           // Tetsucabra's / Drilltusk's rocks, thrown rock and slab
""")
rep("    else if (S.base === 'base26') step26(S, ctx, input, D, out);   // his thunder spiral\n",
    "    else if (S.base === 'base26') step26(S, ctx, input, D, out);   // his thunder spiral\n"
    "    else if (S.base === 'base16') step16(S, ctx, input, D, out);   // Tetsucabra's / Drilltusk's slab\n")
open(P, 'w', encoding='utf8', newline='').write(src)
print('ok')

import json
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
src = open(P, encoding='utf8', newline='').read()
blk = open(D + 'zam067.js', encoding='utf8').read().replace('\r\n', '\n')
def section(fn, name):
    out, on = [], False
    for l in open(D + fn, encoding='utf8'):
        if l.startswith('// '):
            on = l.strip() == '// ' + name; continue
        if on and l.strip(): out.append('      ' + l.strip())
    assert out, (fn, name)
    return '{\n' + '\n'.join(out) + '\n  }'
CMN = {'ints': [9, 2], 'floats': [], 'vecs': [[36.0, 0.0, 631.0], [544.0, 0.0, 955.0], [-523.0, 0.0, 946.0], [-755.0, 0.0, 34.0],
       [-1006.0, 0.0, 589.0], [-782.0, 0.0, -483.0], [750.0, 0.0, 25.0], [744.0, 0.0, -480.0], [976.0, 0.0, 585.0], [336.0, 0.0, 1367.0],
       [-285.0, 0.0, 1220.0]]}
blk = blk.replace('@M13@', section('gen067_00.out', 'em067_00_13')).replace('@M01@', section('gen067_00.out', 'em067_00_01'))
blk = blk.replace('@CMN13@', json.dumps(CMN).replace('"', '').replace(', ', ', '))
blk = blk.replace('@HD01@', '[[0, 10], [0, 10], [0, 10], [0, 10], [0, 10], [10, 10], [10, 10], [10, 10]]')
assert '@' not in blk
def rep(old, new):
    global src
    assert src.count(old) == 1, (old[:80], src.count(old))
    src = src.replace(old, new)
anchor = '// ---- BASE60 / BASE61: Ahtal-Ka\'s web anchors (shell60, shell61)'
rep(anchor, blk + '\n' + anchor)
rep("0xf65250: sh => params066s01(sh) };", "0xf65250: sh => params066s01(sh), 0xf78458: sh => params067s01(sh) };")
rep("                    uShellEm066_sp_13: (S, D, ctx, out) => landing066s13(S, D, ctx, out),\n",
    "                    uShellEm066_sp_13: (S, D, ctx, out) => landing066s13(S, D, ctx, out),\n"
    "                    uShellEm067_sp_13: (S, D, ctx, out) => landing067s13(S, D, ctx, out),\n")
rep("""  } else if (a && a.code === 'em066'){
    spawn066(state, D, a, ctx, input, out, fresh);           // Tetsucabra's / Drilltusk's rocks, thrown rock and slab
""", """  } else if (a && a.code === 'em066'){
    spawn066(state, D, a, ctx, input, out, fresh);           // Tetsucabra's / Drilltusk's rocks, thrown rock and slab
  } else if (a && a.code === 'em067'){
    spawn067(state, D, a, ctx, input, out, fresh);           // Zamtrios's balls (L2 M12, L4 M37's hops)
""")
open(P, 'w', encoding='utf8', newline='').write(src)
print('ok')

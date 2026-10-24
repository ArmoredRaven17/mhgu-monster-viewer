import sys, json
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
def section(fn, name):
    L = open(D + fn).read().split('\n')
    s = [i for i, l in enumerate(L) if l.strip() == '// ' + name][0]
    e = [i for i, l in enumerate(L) if l.startswith('//') and i > s] + [len(L)]
    return '{\n' + '\n'.join('  ' + l for l in L[s + 1:e[0]] if l.strip()) + '\n  }'
BS = chr(92) * 2
V = json.load(open(D + 'throw082_vecs.json'))
thr = '[\n' + ',\n'.join('  [' + ', '.join('[' + ', '.join('[%s]' % ', '.join(repr(float(x)) for x in e[:3]) for e in row) + ']' for row in st) + ']' for st in V) + ']'
blk = open(D + 'mizutsune2.js', encoding='utf8').read()
blk = blk.replace('@THROW@', thr).replace('@M13_00@', section('gen082_00.out', 'em082_00_13')).replace('@M13_04@', section('gen082_04.out', 'em082_04_13'))
blk = blk.replace('@M01_00@', section('gen082_00.out', 'em082_00_01')).replace('@M01_04@', section('gen082_04.out', 'em082_04_01')).replace('@', BS)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read(); NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(o, n):
    global s
    o, n = fix(o), fix(n)
    if s.count(o) != 1: sys.exit('anchor %d %r' % (s.count(o), o[:70]))
    s = s.replace(o, n)
anchor = '\n// ---- AGNAKTOR (em049_00)'
rep(anchor, blk.rstrip('\n') + '\n' + anchor)
rep("    if (!sp.now && !pass001(state, f(sp.frame))) continue;\n", "    if (!sp.now && !pass001(state, f(sp.frame))) continue;\n    if (sp.throw){ spawnThrow082(state, D, a, sp, ctx, input, out); continue; }   // the throws (sp_13)\n")
rep("                    uShellEm065_sp_13: (S, D, ctx, out) => landing065s13(S, D, ctx, out),\n",
    "                    uShellEm065_sp_13: (S, D, ctx, out) => landing065s13(S, D, ctx, out),\n                    uShellEm082_sp_13: (S, D, ctx, out) => landing082s13(S, D, ctx, out),\n")
rep("0xeaab48: sh => params046s01(sh) };", "0xeaab48: sh => params046s01(sh), 0x104ec34: sh => params082s01(sh) };")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')

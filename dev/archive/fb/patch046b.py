import sys
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
g = open(D + 'gen046.out').read()
def section(n):
    out, on = [], False
    for ln in g.splitlines():
        if ln.startswith('// shell'): on = (ln == '// shell' + n); continue
        if on: out.append(ln)
    return '\n'.join(out)
BS = chr(92) * 2
blk = open(D + 'lagiacrus2.js', encoding='utf8').read()
blk = blk.replace('@25@', section('25')).replace('@26@', section('26')).replace('@', BS)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read(); NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(o, n):
    global s
    o, n = fix(o), fix(n)
    if s.count(o) != 1: sys.exit('anchor %d %r' % (s.count(o), o[:70]))
    s = s.replace(o, n)
rep("  actPlain(7, 0x6f, '4', 'Motion[10]', ZAP046(160, [0])),\n  actPlain(7, 0x70, '4', 'Motion[10]', ZAP046(160, [1])),\n", "")
rep("  actPlain(7, 0x9b, '4', 'Motion[36]', ZAP046(36, [21])),\n];\n", "  actPlain(7, 0x9b, '4', 'Motion[36]', ZAP046(36, [21])),\n];\n" + blk.lstrip('\n'))
rep("  } else if (a && a.code === 'em049'){\n", "  } else if (a && a.code === 'em046'){\n    spawn046(state, D, a, ctx, input, out, fresh);           // Lagiacrus's spiral and strike marks (and the spiral's discharge)\n  } else if (a && a.code === 'em049'){\n")
rep("    else if (S.base === 'base40') step40(S, ctx, input, D, out);\n",
    "    else if (S.base === 'base40') step40(S, ctx, input, D, out);\n    else if (S.base === 'base25') step25(S, ctx, input, D, out);   // Lagiacrus's strike marks\n    else if (S.base === 'base26') step26(S, ctx, input, D, out);   // his thunder spiral\n")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')

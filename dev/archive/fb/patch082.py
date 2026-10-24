import sys, re
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + chr(92)
def section(fn, name):
    L = open(D + fn).read().split('\n')
    s = [i for i, l in enumerate(L) if l.strip() == '// ' + name][0]
    e = [i for i, l in enumerate(L) if l.startswith('//') and i > s][0]
    return '{\n' + '\n'.join('  ' + l for l in L[s + 1:e] if l.strip()) + '\n  }'
BS = chr(92) * 2
blk = open(D + 'mizutsune.js', encoding='utf8').read()
base12 = open(D + 'mizutsune_base12.js', encoding='utf8').read().strip('\n')
blk = blk.replace('@BASE12@', base12).replace('@MODES00@', section('gen082_00.out', 'em082_00_12')).replace('@MODES04@', section('gen082_04.out', 'em082_04_12'))
blk = blk.replace('@', BS)
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
rep("  } else if (a && a.code === 'em046'){\n", "  } else if (a && a.code === 'em082'){\n    spawn082(state, D, a, ctx, input, out, fresh);           // Mizutsune's / Soulseer's bubbles\n  } else if (a && a.code === 'em046'){\n")
rep("    else if (S.base === 'base25') step25(S, ctx, input, D, out);   // Lagiacrus's strike marks\n",
    "    else if (S.base === 'base25') step25(S, ctx, input, D, out);   // Lagiacrus's strike marks\n    else if (S.base === 'base12') step12(S, ctx, input, D, out);   // Mizutsune's bubbles\n")
open(P, 'w', encoding='utf8', newline='').write(s)
P2 = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s2 = open(P2, encoding='utf8', newline='').read(); NL2 = '\r\n' if '\r\n' in s2 else '\n'
a = "export function agnaktorBroken049(monId, table, drawn){"
assert s2.count(a) == 1
add = NL2.join([
"// MIZUTSUNE's / SOULSEER's head break as his bubbles read it (render/shells.js choose082: 0x1036e24, 0x9d36c(e, 0) at or past the .dtp",
"// row's byte -- Mizutsune row 1, 3 at either rank; Soulseer row 0, 2): the head row's top rung shown (set 6), read through userLevel",
"// on the ladders MOTION_STATES gives them ([[4], [5], [5], [6]] / [[5], [5], [6]])",
"export function mizutsuneHead082(monId, table, drawn){",
"  if (monId === 'em082_00') return { headBroken: userLevel([[4], [5], [5], [6]], table, drawn) >= 3 };",
"  if (monId === 'em082_04') return { headBroken: userLevel([[5], [5], [6]], table, drawn) >= 2 };",
"  return undefined;",
"}", ""])
s2 = s2.replace(a, add + a)
open(P2, 'w', encoding='utf8', newline='').write(s2)
P3 = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s3 = open(P3, encoding='utf8', newline='').read(); NL3 = '\r\n' if '\r\n' in s3 else '\n'
a = "trunkSnow083, agnaktorBroken049 } from './render/motion-states.js';"
assert s3.count(a) == 1; s3 = s3.replace(a, "trunkSnow083, agnaktorBroken049, mizutsuneHead082 } from './render/motion-states.js';")
a = "           heat049: state.id === 'em049_00' ?"
assert s3.count(a) == 1
s3 = s3.replace(a, "           // Mizutsune's / Soulseer's bubbles (render/shells.js choose082): the head break as the parts show it" + NL3 +
  "           mizu082: mizutsuneHead082(state.id, motionStates.table, mounted.main && mounted.main.userData.partsDrawn)," + NL3 + a)
open(P3, 'w', encoding='utf8', newline='').write(s3)
print('ok')

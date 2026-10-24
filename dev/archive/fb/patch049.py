import sys
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb' + '\\'
g = open(D + 'gen049.out').read().split('\n', 1)[1].rstrip('\n')
blk = open(D + 'agnaktor.js', encoding='utf8').read().replace('@01@', g).replace('@', chr(92) * 2)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read(); NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(o, n):
    global s
    o, n = fix(o), fix(n)
    if s.count(o) != 1: sys.exit('anchor %d %r' % (s.count(o), o[:60]))
    s = s.replace(o, n)
anchor = '// dev/rom-map.md "Ahtal-Ka -- shell57 / base57" (READ whole: ctor 0x42ecb8'
rep(anchor, blk.lstrip('\n') + '\n' + anchor)
rep("0xeb4808: sh => params047s01(sh) };", "0xeb4808: sh => params047s01(sh), 0xec43f4: sh => params049s01(sh) };")
rep("  } else if (a && a.code === 'plain'){\n", "  } else if (a && a.code === 'em049'){\n    spawn049(state, D, a, ctx, input, out, fresh);           // Agnaktor's lava drips\n  } else if (a && a.code === 'plain'){\n")
open(P, 'w', encoding='utf8', newline='').write(s)
P2 = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\motion-states.js'
s2 = open(P2, encoding='utf8', newline='').read(); NL2 = '\r\n' if '\r\n' in s2 else '\n'
a = "export const SNOW083_TRUNK = [[6], [33], [31], [32], [7]];"
assert s2.count(a) == 1
add = NL2.join([
"// AGNAKTOR's chest / tail breaks as his lava shells read them (render/shells.js spawn049: 0x9d36c(e, 1 / 7) below the .dtp row): broken",
"// when a part of the broken set shows -- the heated or the cooled one (dev/em049-heat.md 1: chest 7 / 8 and 24 / 25, tail 17 / 18 / 19",
"// and 34 / 35 / 36) -- read through userLevel as the break rows are",
"export function agnaktorBroken049(monId, table, drawn){",
"  if (monId !== 'em049_00') return undefined;",
"  const b = (a, c) => userLevel(a, table, drawn) > 0 || userLevel(c, table, drawn) > 0;",
"  return { chestBroken: b([[7], [8]], [[24], [25]]), tailBroken: b([[17], [18, 19]], [[34], [35, 36]]) };",
"}", ""])
s2 = s2.replace(a, add + a)
open(P2, 'w', encoding='utf8', newline='').write(s2)
P3 = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\index.html'
s3 = open(P3, encoding='utf8', newline='').read(); NL3 = '\r\n' if '\r\n' in s3 else '\n'
a = "BOULDER, trunkSnow083 } from './render/motion-states.js';"
assert s3.count(a) == 1; s3 = s3.replace(a, "BOULDER, trunkSnow083, agnaktorBroken049 } from './render/motion-states.js';")
a = "           trunkSnow083: trunkSnow083(state.id, motionStates.table, mounted.main && mounted.main.userData.partsDrawn),"
assert s3.count(a) == 1
s3 = s3.replace(a, a + NL3 + "           // Agnaktor's lava drips (render/shells.js spawn049): the chest's / tail's heat as their machines show it, and their breaks" + NL3 +
  "           heat049: state.id === 'em049_00' ? Object.assign({ chest: regionHot('chest'), tail: regionHot('tail') }, agnaktorBroken049(state.id, motionStates.table, mounted.main && mounted.main.userData.partsDrawn)) : undefined,")
open(P3, 'w', encoding='utf8', newline='').write(s3)
print('ok')

# patch_shells.py: makes gapJ/shells.patched.js = docs/render/shells.js (read only) + the gapJ transcription (Ahtal-Neset's requests of
# Ahtal-Ka's shell57: b6 0x10ac10c and b2 0x10ac1ec), its imports pointed back at the repo's docs/render. Writes only under gapJ.
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(SRC, encoding='utf-8').read()
JS = {k: open(os.path.join(HERE, 'js', k + '.js'), encoding='utf-8').read() for k in ('b6init', 'b6move', 'neset_live')}

def once(old, new):
    global s
    n = s.count(old)
    if n != 1: sys.exit('anchor count %d: %r' % (n, old[:80]))
    s = s.replace(old, new)

# A1 make57: behaviour 6 before the refusal
once("  } else return { why: 'shell57 behaviour ' + b + ': not his' };",
     JS['b6init'] + "  } else return { why: 'shell57 behaviour ' + b + ': not his' };")
# A2 step57: behaviour 6's move
once("  else if (b === 3) move57pull(S, D, ctx, out);",
     "  else if (b === 3) move57pull(S, D, ctx, out);\n  else if (b === 6) move57lift(S, D, ctx, out);")
# A3 the move itself, before spawn088's comment
once("// the request a row makes (the CU record, per caller above)",
     JS['b6move'] + "// the request a row makes (the CU record, per caller above)")
# A4 spawn087: the row kind
once("    else if (sp.ev === 9) make087s48(state, D, a, sp, own, J, ctx, out);",
     "    else if (sp.ev === 9) make087s48(state, D, a, sp, own, J, ctx, out);\n"
     "    else if (sp.ev === 'ka57') make087ka57(state, D, a, sp, own, J, ctx, out);")
# A5 line 18: a shell57 Neset made steps on Ahtal-Ka's data (its lists em088_00u, its def, the rubble)
once("    else if (S.base === 'base57') step57(S, ctx, input, D, out);",
     "    else if (S.base === 'base57') step57(S, ctx, input, S.D57 || D, out);   // S.D57: one Ahtal-Neset made (make087ka57)")
# A6 Neset's maker and rows
once("SHELL_DATA.em087_00.rockets087 = true;", "SHELL_DATA.em087_00.rockets087 = true;\n" + JS['neset_live'])

SRC2 = SRC + '.tmpneset'
open(SRC2, 'w', encoding='utf-8', newline=chr(13) + chr(10)).write(s.replace(chr(13) + chr(10), chr(10)))
os.replace(SRC2, SRC)
print('live written', len(s))

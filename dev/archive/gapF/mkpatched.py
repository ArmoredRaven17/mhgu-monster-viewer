# mkpatched.py [src] [dst] -- the gapF transcription applied to a COPY of docs/render/shells.js (text anchors only; the repo file is
# never written). Default dst: gapF/shells.patched.mjs, its relative imports turned into the repo's absolute file URLs.
# The same four edits are the ones RESULT.md (b) gives the shells agent.
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
DST = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'shells.patched.mjs')
s = open(SRC, encoding='utf-8').read()
def once(old, new):
    global s
    n = s.count(old)
    if n != 1: sys.exit('anchor found %d times: %r' % (n, old[:80]))
    s = s.replace(old, new)
# 1. the frame handler, before act024
blk = open(os.path.join(HERE, 'js_perframe024.js'), encoding='utf-8').read()
once("const act024 = (st, n, list, clip, spawns, x = {}) =>", blk + "const act024 = (st, n, list, clip, spawns, x = {}) =>")
# 2. its data switch in the em024 block
once("  D.lists = { 0: { list: 'u', pel: 'em024_00u' }, 1: { list: 'c', pel: 'em024_00c' } };\n",
     "  D.lists = { 0: { list: 'u', pel: 'em024_00u' }, 1: { list: 'c', pel: 'em024_00c' } };\n"
     "  D.perFrame024 = PERFRAME024;                             // his frame handler vt+0x208 0xdeffc4: sp_01 0 / 1..4 / 9 / 10 / 12 / 13\n")
# 3. the call, line 4 (after the action), with the other frame handlers
once("  if (D.perFrame077s28) perFrame077s28(state, D, ctx, input, out, fresh, a);",
     "  if (D.perFrame077s28) perFrame077s28(state, D, ctx, input, out, fresh, a);\n"
     "  if (D.perFrame024) perFrame024(state, D, ctx, input, out, fresh, a);   // Kushala's frame handler 0xdeffc4 (sp_01 0xb0: the pulse, L2 M2 / M18, L0 M5), line 4")
# 4. the stale mode-0 note in sp_01's reader comment (WITHDRAWN: the frame handler makes mode 0 on L2 M2 f50)
once("alone carries it, which no maker read here makes)",
     "alone carries it: the frame handler's L2 M2 f50, perFrame024 -- \"no maker makes mode 0\" WITHDRAWN 2026-10-20)")
if DST.endswith('.mjs'):
    base = 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/'
    for m in ('beam-types.js', 'beam-groups.js', 'beam-spawns.js'):
        once("from './%s';" % m, "from '%s%s';" % (base, m))
open(DST, 'w', encoding='utf-8').write(s)
print('wrote', DST, len(s))

# gapC: build shells.patched.js = a COPY of docs/render/shells.js with the em084 gapC transcription applied by text anchors.
# Never writes the repo. The same blocks are what RESULT.md (b) asks the shells agent to patch in place.
import sys, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
OUT = os.path.join(HERE, 'shells.patched.js')
blocks = {}
cur = None
for line in open(os.path.join(HERE, 'blocks.js'), encoding='utf-8').read().split('\n'):
    m = re.match(r'^//@@ (\w+)$', line)
    if m: cur = m.group(1); blocks[cur] = []; continue
    if cur: blocks[cur].append(line)
B = {k: '\n'.join(v).rstrip('\n') + '\n' for k, v in blocks.items()}
s = open(SRC, encoding='utf-8').read()

def once(old, new):
    global s
    n = s.count(old)
    if n != 1: sys.exit('anchor count %d: %r' % (n, old[:90]))
    s = s.replace(old, new)

# 1. the data (arm rows, shell11 mode 2, shell01 0 / 1, body084, records084): before Boltreaver's section
A1 = '// BOLTREAVER ASTALOS (em081_04) -- HIS SHELLS ('
once(A1, B['DATA'] + A1)
# 2. the shell00 comment: "no row here makes them yet" -> who makes them now
once("// stage. Modes 0..8 (the rank pair, (7, 0xb) / (7, 0x25)), 1 (shell11 modes 2..4's fall) and 65 / 66 (the body's record\n"
     "// table) are the files' values; no row here makes them yet.\n", B['S00COMMENT'])
# 3. armSpawn084: the form-free gate and the rank arm
once("  if (form === 'exposed'){", "  if (!sp.any && form === 'exposed'){")
once("  if (form == null){ out.refused.push({ action: row.action, arm: side, why: 'no arm form",
     "  if (!sp.any && form == null){ out.refused.push({ action: row.action, arm: side, why: 'no arm form")
once("  const pick = sp.forms[form];\n", "  const pick = sp.any || sp.forms[form];\n")
once("  const modes = pick.modes || pick[side] || [];\n", B['RANK'])
# 4. create11n: modes 2..4 -> createFall084
once("  if (S.modeIndex !== 0){\n"
     "    ctx.out.refused.push({ shell: 'shell11', mode: S.modeIndex, creator: S.id,\n"
     "                           why: 'uShellEm084_sp_11 modes 2..4 create (ef +0x1664 + shell00 1, 0x108a508..): not transcribed (phase 2)' });\n"
     "    return;\n"
     "  }\n", "  if (S.modeIndex !== 0){ createFall084(S, idx, ctx, D); return; }\n")
A4 = "// a base11 class's own +0x168 (absent: Rathian's create11)\n"
once(A4, B['FALL'] + A4)
# 5. the pick list for L0 M4
A5 = "  if (D.cannon084 && String(list) === '2' && String(clip).replace(/_(start|loop)$/, '') === 'Motion[82]') return D.cannon084.map(r => r.variant);\n"
once(A5, A5 + B['PICK'])
# 6. the body's spawners, before stepShells
A6 = "export function stepShells(state, input){\n"
once(A6, B['BODY'] + A6)
# 7. the wiring
A7 = "  if (D.arm084) arm084(state, D, ctx, input, out, fresh);         // his arms' own form-chosen shells, the arms' line 4\n"
once(A7, A7 + B['WIRE'])
# 8. the joint snapshot of the arm rows' joints: a form-free gate (`any`) and the G modes too
once("      for (const p of Object.values(sp.forms)) for (const m of [].concat(p.modes || [], p.left || [], p.right || [])){\n",
     "      for (const p of Object.values(sp.forms || {}).concat(sp.any ? [sp.any] : []))\n"
     "        for (const m of [].concat(p.modes || [], p.left || [], p.right || [], p.leftG || [], p.rightG || [])){\n")
# 9. params11n: the init starts NOTHING (base11's 0x402fd8 -> base01's 0x3fa498 starts [+0x15c8] / [+0x15cc] only when set,
# 0x3fad08..0x3fad1c; sp_11's reader writes ef 0 to +0x1664 alone, 0x108a060..0x108a064) -- make001 started param 0 at the init
once("           words: [got.ownerX >>> 0, got.ownerY >>> 0, got.ownerZ >>> 0], b1690: I(4) !== -1 };\n",
     "           words: [got.ownerX >>> 0, got.ownerY >>> 0, got.ownerZ >>> 0], b1690: I(4) !== -1,\n"
     "           // the init's two starts read +0x15c8 / +0x15cc (0x3fad08..0x3fad1c: `cmp r6, #0; beq`), which this reader never writes\n"
     "           // (ef 0 -> +0x1664 only, 0x108a060..0x108a064): base01's init starts nothing (gapC 2026-10-20)\n"
     "           efAt: { 0x15c8: null, 0x15cc: null, 0x15d0: null } };\n")
# the copy's imports point at the repo's modules
for mod in ('beam-types.js', 'beam-groups.js', 'beam-spawns.js'):
    s = s.replace("from './%s';" % mod, "from 'file:///C:/MHGU-Extract/MHGU-Monster-Viewer/docs/render/%s';" % mod)
open(OUT, 'w', encoding='utf-8', newline='\n').write(s)
print('wrote', OUT, len(s))

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
blk = open(D + 'lagiacrus.js', encoding='utf8').read()
blk = blk.replace('@00@', section('00')).replace('@01@', section('01')).replace('@11@', section('11')).replace('@', BS)
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
rep("                   uShellEm047_sp_00: (def, mode) => params047s00(def, mode),",
    "                   uShellEm047_sp_00: (def, mode) => params047s00(def, mode),\n                   // Lagiacrus's sp_00 0xeaa5b4 (the thunderballs)\n                   uShellEm046_sp_00: (def, mode, idx, got) => params046s00(def, mode, idx, got),")
rep("uShellEm047_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };",
    "uShellEm047_sp_00: (S, k, p, got) => xAdjust37(k, p, got),\n                 uShellEm046_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };")
rep("const AIMY00 = { uShellEm083_sp_00: (S, k, p, got) => yAdjust37(k, p, got), uShellEm036_sp_00: (S, k, p, got) => yAdjust37(k, p, got) };",
    "const AIMY00 = { uShellEm083_sp_00: (S, k, p, got) => yAdjust37(k, p, got), uShellEm036_sp_00: (S, k, p, got) => yAdjust37(k, p, got),\n                 uShellEm046_sp_00: (S, k, p, got) => yAdjust37(k, p, got) };")
rep("                  uShellEm047_sp_00: (S, D, hit, ctx) => landing047s00(S, D, hit, ctx) };",
    "                  uShellEm047_sp_00: (S, D, hit, ctx) => landing047s00(S, D, hit, ctx),\n                  uShellEm046_sp_00: (S, D, hit, ctx) => landing046s00(S, D, hit, ctx) };")
rep("0xec43f4: sh => params049s01(sh) };", "0xec43f4: sh => params049s01(sh), 0xeaab48: sh => params046s01(sh) };")
rep("const READERS11 = { 0x108a04c: params11n, 0x1031978: params081s11, 0xf059e0: (def, mode) => params057s11(def, mode) };",
    "const READERS11 = { 0x108a04c: params11n, 0x1031978: params081s11, 0xf059e0: (def, mode) => params057s11(def, mode),\n                    0xeaaf38: (def, mode) => params046s11(def, mode) };")
rep("uShellEm057_sp_11: (S, idx, ctx, D) => create057s11(S, idx, ctx, D) };",
    "uShellEm057_sp_11: (S, idx, ctx, D) => create057s11(S, idx, ctx, D),\n                   uShellEm046_sp_11: (S, idx, ctx) => create046s11(S, idx, ctx) };")
rep("  if (S.cls === 'uShellEm036_sp_01') return endCreate036(S, ctx, events);\n",
    "  if (S.cls === 'uShellEm036_sp_01') return endCreate036(S, ctx, events);\n  if (S.cls === 'uShellEm046_sp_01') return endCreate046(S, ctx, events);\n")
rep("  if (k.flags & 0x800) throw new Error('shells.js: base01 flag 0x800 (+0x1650 x 0xbec34): not transcribed (no em001_00 mode)');\n",
    "  // flag 0x800 (0x3fa56c): +0x1650 (the ctor's 1.0) x= 0xbec34(owner), and the init's end (0x3fae64..0x3fae7c) sets the unit's size\n"
    "  // to +0x1650 x its +0x60 (ShellScale) -- the unit's scale times the owner's size (Lagiacrus's sp_01 20 / 21; READ, rom-map base01 0x800)\n"
    "  if (k.flags & 0x800) S.unitScale = f(f(1.0 * scale001(got)) * f(S.mode && S.mode.scale != null ? S.mode.scale : 1.0));\n")
rep("    ctx.own001 = owner001(input);\n",
    "    ctx.own001 = owner001(input);\n    // 0x81614 (tired: P+0x505 & 0xfe == 2) as a shell's own code reads it mid-flight (Lagiacrus's landing, 0xeaa930)\n"
    "    ctx.tired = input.tired != null ? !!input.tired : !!(input.beamState && input.beamState.tired);\n")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')

import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(P, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'
fix = lambda t: t.replace('\r\n', '\n').replace('\n', NL)
def rep(old, new, count=1):
    global s
    o, n = fix(old), fix(new)
    c = s.count(o)
    if c != count: sys.exit('anchor x%d (want %d): %r' % (c, count, old[:90]))
    s = s.replace(o, n)

rep("uShellEm083_sp_00: (def, mode, m, got) => params083s00(def, mode, m, got),",
    "uShellEm083_sp_00: (def, mode, m, got) => params083s00(def, mode, m, got),\n"
    "                   // Elderfrost's sp_00_03 0x1063568 (the leap's icicles: the owner's point and words)\n"
    "                   uShellEm083_sp_00_03: (def, mode) => params083s003(def, mode),")
rep("// sp_00_02's landing 0x1063148 (READ whole)",
    "// sp_00_03's reader 0x1063568 (READ whole; Elderfrost's): ef 0..3; hit 0; +0x15dc (the joint) = -1 -- the owner's point, the offset\n"
    "// turned by its Y word (init00's joint -1 arm); +0x15e8 untouched (0: the owner's words); floats 1 degX +0x15ec, 0 degY +0x15f0, 2 vz\n"
    "// +0x15f4, 3 vy +0x15f8, 4 the flight +0x15fc; &vec 1 the offset +0x1610, &vec 0 the gravity +0x161c\n"
    "function params083s003(def, mode){\n"
    "  const sh = mode.sh, F = i => i < sh.floats.length ? f(sh.floats[i]) : f(0);\n"
    "  const V = i => i < sh.vecs.length ? sh.vecs[i].map(f) : ZERO3.slice();\n"
    "  return { joint: -1, flags: 0, degX: F(1), xDeg: F(1), degY: F(0), yDeg: F(0), vz: F(2), vy: F(3), flight: F(4),\n"
    "           vec: V(1), from: ZERO3.slice(), aimOff: ZERO3.slice(), gravity: V(0) };\n"
    "}\n"
    "// sp_00_02's landing 0x1063148 (READ whole)")
rep("    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01' || sp.kind === 'turnShot', target: sp.shell === 'shell13' || sp.shell === 'shell00' });",
    "    const why = missing001(own, { facing: true, pos: sp.shell === 'shell01' || sp.kind === 'turnShot' || sp.shell === 'shell00_03', target: sp.shell === 'shell13' || sp.shell === 'shell00' });")
rep("    else if (sp.shell === 'shell00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame);\n    else {\n      const def = D.shells.shell01;\n      // (0x1060d4c",
    "    else if (sp.shell === 'shell00') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame);\n"
    "    // 0x1060be8(e, mode) (READ whole): sp_00_03 0x167 with the zero vector's point and words (+0x10 / +0x20): its reader places it\n"
    "    else if (sp.shell === 'shell00_03') S = make00n(state, D, sp.mode, J, own, ctx, a.action, sp.frame, 'shell00_03');\n"
    "    else {\n      const def = D.shells.shell01;\n      // (0x1060d4c")
# the data and the rows
rep("    // shell13: his sp_13 (L9 M8 mode 6;",
    "    // shell00_03: the leap's icicles (L9 M7 at 12 / 47, modes 0 / 1 -- 130 degrees either side): u 100 on them, u 101 at a contact\n"
    "    shell00_03: { id: 0x167, cls: 'uShellEm083_sp_00_03', base: 'base00', reader: 0x1063568, folder: 'shell\\\\em\\\\em083_04_shell00_03',\n"
    "      modes: {\n"
    "      0: m057(1.0, [[0, 100], [0, 101], [0, 101], [0, 101]], [1], [0], [130.0, 0.0, 25.0, 65.0, 100.0], [[0.0, -2.5, 0.0], [200.0, 100.0, 1020.0]]),\n"
    "      1: m057(1.0, [[0, 100], [0, 101], [0, 101], [0, 101]], [1], [0], [-130.0, 0.0, 25.0, 65.0, 100.0], [[0.0, -2.5, 0.0], [-200.0, 100.0, 1020.0]]),\n"
    "      }, hitdata: [[0, 500], [0, 3000]] },\n"
    "    // shell13: his sp_13 (L9 M8 mode 6;")
rep("""  act083v(0x6f, '9', 'Motion[7]', [12, 12, 47, 47].map((F, i) => UNBUILT083('shell00_03', i & 1, F,
    'uShellEm083_sp_00_03 (0x167, reader 0x1063568) and the leap\\'s target write (0x105aee8..0x105b35c): not transcribed'))),""",
"""  // L9 M7 (phase 2, 0x105b1e8..0x105b278): tune floats 0xb7..0xba = 12 / 12 / 47 / 47 -> sp_00_03 0 / 1 / 0 / 1 (0x1060be8)
  act083v(0x6f, '9', 'Motion[7]', [12, 12, 47, 47].map((frame, i) => ({ frame, shell: 'shell00_03', mode: i & 1 }))),""")
rep("//   point written into the target slot; its L9 M7 makes sp_00_03 0 / 1 at 12 and 47 (0x1060be8) -- NOT BUILT, refused by name;",
    "//   point written into the target slot (not a shell's: no shell reads it); its L9 M7 makes sp_00_03 0 / 1 at 12 and 47 (0x1060be8);")
open(P, 'w', encoding='utf8', newline='').write(s)
print('ok')

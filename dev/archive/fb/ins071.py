# ins071.py (2026-10-19): the Gore line's shells -- GORE MAGALA (em071_00): sp_00 (0x12d base00), sp_01 (0x12e base01), sp_03
# (0x12f base03, with the target arms), sp_11 (0x130 base11) and the rows; base03's init / move / end take the Gore k fields
import subprocess, sys
BS = chr(92)
js = open('gore.js', encoding='utf8').read()
def blocks(mon):
    out = subprocess.check_output([sys.executable, 'gen071.py', mon], text=True)
    return {b[:2]: b[3:].rstrip('\n') for b in out.split('MODES ')[1:]}
def body(B, nn):
    lines = B[nn].split('\n')
    return '\n'.join(lines[:-1]), lines[-1].split('hitdata: ')[1].rstrip(' },')
def folder(mon, nn): return "'shell" + BS + BS + "em" + BS + BS + mon + "_shell%s'" % nn
B = blocks('em071_00')
m00, hd00 = body(B, '00'); m01, hd01 = body(B, '01'); m03, hd03 = body(B, '03'); m11, hd11 = body(B, '11')
U = "{ 0: { list: 'u', pel: 'em071_00u' } }"
UC = "{ 0: { list: 'u', pel: 'em071_00u' }, 1: { list: 'c', pel: 'em071_00c' } }"
data = (
"SHELL_DATA.em071_00 = {\n"
"  name: 'Gore Magala',\n"
"  lists: " + UC + ",\n"
"  shells: {\n"
"    shell00: { id: 0x12d, cls: 'uShellEm071_sp_00', base: 'base00', reader: 0xfc1a44, folder: " + folder('em071_00', '00') + ", lists: " + U + ",\n"
"      modes: {\n" + m00 + "\n      },\n      hitdata: " + hd00 + " },\n"
"    shell01: { id: 0x12e, cls: 'uShellEm071_sp_01', base: 'base01', reader: 0xfc2500, folder: " + folder('em071_00', '01') + ", lists: " + UC + ",\n"
"      modes: {\n" + m01 + "\n      },\n      hitdata: " + hd01 + " },\n"
"    shell03: { id: 0x12f, cls: 'uShellEm071_sp_03', base: 'base03', reader: 0xfc2ad8, folder: " + folder('em071_00', '03') + ", lists: " + U + ",\n"
"      modes: {\n" + m03 + "\n      },\n      hitdata: " + hd03 + " },\n"
"    shell11: { id: 0x130, cls: 'uShellEm071_sp_11', base: 'base11', reader: 0xfc333c, folder: " + folder('em071_00', '11') + ", lists: " + U + ",\n"
"      modes: {\n" + m11 + "\n      } },\n"
"  },\n"
"  actions: [\n"
"    // (7, 0x2c) 0xfbab80: L2 M52 at 84 sp_00 0 from the zero setup (base00's joint path: joint 3, the X aim at the target)\n"
"    act071(7, 0x2c, '2', 'Motion[52]', [{ frame: 84, shell: 'shell00', mode: 0 }]),\n"
"    // (2, 0x12) / (2, 0x23) 0xfb4d70: L1 M8 / M13 at 90 sp_01 13 at his point with his words, his block within 900 of the ground\n"
"    act071(2, 0x12, '1', 'Motion[8]', [{ frame: 90, shell: 'shell01', mode: 13, near: 900 }]),\n"
"    act071(2, 0x23, '1', 'Motion[13]', [{ frame: 90, shell: 'shell01', mode: 13, near: 900 }]),\n"
"    // (3, 0 / 3 / 0xb / 0xd) 0xfb5420: L1 M1 at 64 sp_01 12, the same test\n"
"    ...[0x00, 0x03, 0x0b, 0x0d].map(n => act071(3, n, '1', 'Motion[1]', [{ frame: 64, shell: 'shell01', mode: 12, near: 900 }])),\n"
"    // (7, 9) 0xfb75f8: L2 M4 at 76 sp_03 0 at the target (block +0x1d0 -> the setup's +0x30, byte +0x40 = 1)\n"
"    act071(7, 0x09, '2', 'Motion[4]', [{ frame: 76, shell: 'shell03', mode: 0, target: 'target' }]),\n"
"    // (7, 0x32) 0xfbb438: L2 M6 at 116 / 148 / 202 sp_03 11 / 12 / 13 at the point 2000 ahead of him (modes in mask 0x3870)\n"
"    act071(7, 0x32, '2', 'Motion[6]', [116, 148, 202].map((frame, i) => ({ frame, shell: 'shell03', mode: 11 + i, target: 'ahead' }))),\n"
"    // (7, 8) 0xfb7408: L2 M48 at 108 sp_11 4 at his point with his words; (7, 0x2a) 0xfba890: L2 M50 at 138 sp_11 3\n"
"    act071(7, 0x08, '2', 'Motion[48]', [{ frame: 108, shell: 'shell11', mode: 4 }]),\n"
"    act071(7, 0x2a, '2', 'Motion[50]', [{ frame: 138, shell: 'shell11', mode: 3 }]),\n"
"    // (7, 0x52 / 0x58 / 0x59) and (7, 0x5b) / (7, 0x60) 0xfbbc58: L2 M7 / L2 M37 at 114 sp_11 1 / 2, when the ground 950 ahead of him\n"
"    // (the ray 0x183664 from 500 above) is within 500 below him\n"
"    ...[0x52, 0x58, 0x59].map(n => act071(7, n, '2', 'Motion[7]', [{ frame: 114, shell: 'shell11', mode: 1, probe: true }])),\n"
"    act071(7, 0x5b, '2', 'Motion[7]', [{ frame: 114, shell: 'shell11', mode: 2, probe: true }]),\n"
"    act071(7, 0x60, '2', 'Motion[37]', [{ frame: 114, shell: 'shell11', mode: 2, probe: true }]),\n"
"    // NOT BUILT, named: (7, 0x50) L4 M1 sp_03 8..10, (7, 0x55) / (7, 0x56) sp_00 1 / 2, (7, 0x64) sp_11 6 -- modes his files do not\n"
"    // carry (no ShellInfoList entry: nothing made); sp_01 14 ((7, 7 / 0x34 / 0x37) L2 M33) -- ef (999, -1) x 3, hit only\n"
"  ],\n"
"};\n")
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
anchor = "// ---- BASE60 / BASE61: Ahtal-Ka's web anchors"
assert s.count(anchor) == 1
s = s.replace(anchor, js.lstrip('\n') + data + '\n' + anchor)
reps = [
  # the classes' own readers, landing, aim and create
  ("const READER03 = { uShellEm061_sp_19: (def, mode) => params061s19(def, mode) };",
   "const READER03 = { uShellEm061_sp_19: (def, mode) => params061s19(def, mode),\n"
   "                   uShellEm071_sp_03: (def, mode) => params071s03(def, mode) };   // the Gore line's 0xfc2ad8"),
  ("                   uShellEm046_sp_00: (def, mode, idx, got) => params046s00(def, mode, idx, got), uShellEm083_sp_00_02: (def, mode) => params083s002(def, mode) };",
   "                   uShellEm046_sp_00: (def, mode, idx, got) => params046s00(def, mode, idx, got), uShellEm083_sp_00_02: (def, mode) => params083s002(def, mode),\n"
   "                   // the Gore line's sp_00 0xfc1a44\n"
   "                   uShellEm071_sp_00: (def, mode) => params071s00(def, mode) };"),
  ("                 uShellEm046_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };",
   "                 uShellEm046_sp_00: (S, k, p, got) => xAdjust37(k, p, got), uShellEm071_sp_00: (S, k, p, got) => xAdjust37(k, p, got) };"),
  ("const LANDING = { uShellEm037_sp_00: landing37, uShellEm001_sp_00: landing001, uShellEm003_sp_00: landing00k,",
   "const LANDING = { uShellEm037_sp_00: landing37, uShellEm001_sp_00: landing001, uShellEm003_sp_00: landing00k,\n"
   "                  uShellEm071_sp_00: (S, D, hit, ctx) => landing071s00(S, D, hit, ctx),"),
  ("                   uShellEm046_sp_11: (S, idx, ctx) => create046s11(S, idx, ctx) };",
   "                   uShellEm046_sp_11: (S, idx, ctx) => create046s11(S, idx, ctx), uShellEm071_sp_11: (S, idx, ctx, D) => create071s11(S, idx, ctx, D) };"),
  ("                    0xeaaf38: (def, mode) => params046s11(def, mode) };",
   "                    0xeaaf38: (def, mode) => params046s11(def, mode), 0xfc333c: (def, mode, got, J, m) => params071s11(def, mode, got, J, m) };"),
  # base03: the Gore k fields (the timer from the target, the turn, the end's ef +0x1660)
  ("  const hit = stageQuery(A, B, ctx.stage, 0x10);                   // 0x3fdafc\n",
   "  const hit = stageQuery(A, B, ctx.stage, 0x10);                   // 0x3fdafc\n"),
  ("  S.anchor = S.position.slice();                         // +0x1000..+0x100c (0x3fdb48..0x3fdb70)\n",
   "  S.anchor = S.position.slice();                         // +0x1000..+0x100c (0x3fdb48..0x3fdb70)\n"
   "  // +0x1664 bit 2 (0x3fdb7c: the Gore line's reader, int 3): the life and the timer from the target's distance (timer03)\n"
   "  if (k.fromTarget) timer03(S);\n"),
  ("function move03(S, ctx){\n  S.anchor = S.position.slice();",
   "function move03(S, ctx){\n"
   "  // +0x1664 bit 3 (0x3fdcf4: the Gore line's reader, int 2): the turn at the target first, while +0x16d0 is 0 (turn03)\n"
   "  if (S.k.turn) turn03(S, ctx);\n"
   "  S.anchor = S.position.slice();"),
  ("      if (S.base === 'base19' && S.mode.ef[1]){",
   "      // (the Gore line's sp_03 +0x154 0xfc3164 calls 0x3fd820 too: its reader writes ef 1 there, k.ef1660)\n"
   "      if ((S.base === 'base19' || (S.k && S.k.ef1660)) && S.mode.ef[1]){"),
  # the spawner
  ("  } else if (a && a.code === 'em086'){\n",
   "  } else if (a && a.code === 'em071'){\n    spawn071(state, D, a, ctx, input, out, fresh);           // the Gore line's shells\n  } else if (a && a.code === 'em086'){\n"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')

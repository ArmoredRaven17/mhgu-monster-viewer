# ins086.py (2026-10-19): Valstrax's shells -- BASE56 (sp_56 0x174) and sp_01 (0x175) on base01, the rows
import subprocess
BS = chr(92)
js = open('valstrax.js', encoding='utf8').read()
out = subprocess.check_output(['python', 'gen086.py'], text=True)
blocks = {b[:2]: b[3:].rstrip('\n') for b in out.split('MODES ')[1:]}
def body(nn):
    lines = blocks[nn].split('\n')
    return '\n'.join(lines[:-1]), lines[-1].split('hitdata: ')[1].rstrip(' },')
def folder(nn): return "'shell" + BS + BS + "em" + BS + BS + "em086_00_shell%s'" % nn
m00, hd00 = body('00')
m01, hd01 = body('01')
F = "[50, 52, 62, 64, 72, 74]"
data = (
"SHELL_DATA.em086_00 = {\n"
"  name: 'Valstrax',\n"
"  lists: { 0: { list: 'u', pel: 'em086_00u' }, 1: { list: 'c', pel: 'em086_00c' } },\n"
"  shells: {\n"
"    shell56: { id: 0x174, cls: 'uShellEm086_sp_56', base: 'base56', folder: " + folder('00') + ", lists: { 0: { list: 'u', pel: 'em086_00u' } },\n"
"      cmn: { ints: [], floats: [240.0], vecs: [] },\n"
"      modes: {\n" + m00 + "\n      },\n      hitdata: " + hd00 + " },\n"
"    shell01: { id: 0x175, cls: 'uShellEm086_sp_01', base: 'base01', reader: 0x10a25b0, folder: " + folder('01') + ", lists: { 0: { list: 'u', pel: 'em086_00u' }, 1: { list: 'c', pel: 'em086_00c' } },\n"
"      modes: {\n" + m01 + "\n      },\n      hitdata: " + hd01 + " },\n"
"  },\n"
"  actions: [\n"
"    // 0x1098b2c(e, r1): phase 0 L2 M32 (0x220); phase 1 at tune floats 0xc..0x11 (50 / 52 / 62 / 64 / 72 / 74) sp_56 (r1 ? 6 : 0) + i,\n"
"    // setup 0x14 (0x42d9b4); r1 1 ((7, 0xc8 / 0xc9)) keeps the target in the cone first (cone086: tune vec 3 (0, 500, 0), ints 0xa / 0xb 30)\n"
"    ...[0x08, 0x1c].map(n => act086(7, n, '2', 'Motion[32]', " + F + ".map((frame, i) => ({ frame, shell: 'shell56', mode: i })))),\n"
"    ...[0xc8, 0xc9].map(n => act086(7, n, '2', 'Motion[32]', " + F + ".map((frame, i) => ({ frame, shell: 'shell56', mode: 6 + i,\n"
"      cone: { vec: [0.0, 500.0, 0.0], limA: 30, limB: 30 } })))),\n"
"    // 0x1098fa4(e, r5): phase 0 L2 M36 (0x224); phase 1 at tune 0x12 (120) sp_01 1 and 2 at his point with his words; r5 1 ((7, 0xa /\n"
"    // 0x1e)): phase 2 L2 M37 at tune 0x13 (65) sp_01 3 and 4\n"
"    ...[0x09, 0x0a, 0x1d, 0x1e].map(n => act086(7, n, '2', 'Motion[36]', [{ frame: 120, shell: 'shell01', mode: 1 }, { frame: 120, shell: 'shell01', mode: 2 }])),\n"
"    ...[0x0a, 0x1e].map(n => act086(7, n, '2', 'Motion[37]', [{ frame: 65, shell: 'shell01', mode: 3 }, { frame: 65, shell: 'shell01', mode: 4 }])),\n"
"    // 0x1099f20: phase 2 (L2 M63, after L2 M62) at tune 0x1d (6) sp_01 5\n"
"    act086(7, 0x30, '2', 'Motion[63]', [{ frame: 6, shell: 'shell01', mode: 5 }]),\n"
"    // 0x109a1a0: phase 2 (L2 M67) turns him 0x8000 (0x76dd0) and at tune 0x21 (48) makes sp_01 8 with the words e+0xcac0.. saved at\n"
"    // phase 1's end (the block's), +0x3c the block's +0xb0a\n"
"    act086(7, 0x31, '2', 'Motion[67]', [{ frame: 48, shell: 'shell01', mode: 8, words: 'saved' }]),\n"
"    // 0x109a5b4 (7, 0x34 / 0x35): phase 1's end moves his block and sets L2 M71 (0x247), then sp_01 7 at his point (a tail call): u 500\n"
"    // by the 0x20 switch\n"
"    ...[0x34, 0x35].map(n => act086(7, n, '2', 'Motion[71]', [{ start: true, shell: 'shell01', mode: 7 }])),\n"
"  ],\n"
"};\n")
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\shells.js'
s = open(p, encoding='utf8').read()
anchor = "// ---- BASE60 / BASE61: Ahtal-Ka's web anchors"
assert s.count(anchor) == 1
s = s.replace(anchor, js.lstrip('\n') + data + '\n' + anchor)
reps = [
  ("const atanf = x => f(Math.atan(x));\n", "const atanf = x => f(Math.atan(x));\nconst tanf = x => f(Math.tan(x));                     // 0x13ecfbc\n"),
  ("  } else if (a && a.code === 'em058'){\n",
   "  } else if (a && a.code === 'em086'){\n    spawn086(state, D, a, ctx, input, out, fresh);           // Valstrax's homing shots and his sp_01 blasts\n  } else if (a && a.code === 'em058'){\n"),
  ("    else if (S.base === 'base42') step42(S, J, ctx, input, D, out);   // his water lines\n",
   "    else if (S.base === 'base42') step42(S, J, ctx, input, D, out);   // his water lines\n"
   "    else if (S.base === 'base56') step56(S, J, ctx, input, D, out, state);   // Valstrax's homing shots\n"),
  ("                                : def.base === 'base42' ? mode.sh.ints[0]                 // (Amatsu's water line: int 0, joint 3)\n",
   "                                : def.base === 'base42' ? mode.sh.ints[0]                 // (Amatsu's water line: int 0, joint 3)\n"
   "                                : def.base === 'base56' ? (mode.sh.ints[0] === -1 ? null : mode.sh.ints[0])   // (Valstrax's shots: int 0)\n"),
]
for a, b in reps:
    assert s.count(a) == 1, a[:70]
    s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')

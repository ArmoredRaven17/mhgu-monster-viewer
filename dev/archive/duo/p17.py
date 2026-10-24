p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js'
s = open(p, encoding='utf-8').read()
a = """               // (2026-10-22: he dies at her M79 frame 80; her g1 s46 then eats him -- 1:0x1c, L0 M16 b4. Her walk to him,
               // 2:0x15 / 2:0x16 L0 M8 b12, is not shown: he falls beside her and her steering is not read)
               ['4', 'Motion[79]', 4], ['0', 'Motion[16]_start', 4], ['0', 'Motion[16]_loop']], deathAt: { piece: 4, frame: 80 } },"""
b = """               // (2026-10-22: he dies at her M79 frame 80. In the ROM her g1 s46 then eats him -- 2:0x15 / 2:0x16 walk (L0 M8
               // b12), 1:0x1c L0 M16 b4 -- NOT joined here: a candidate for Raven's combining review)
               ['4', 'Motion[79]', 4]], deathAt: { piece: 4, frame: 80 } },"""
assert s.count(a) == 1; s = s.replace(a, b); open(p, 'w', encoding='utf-8').write(s)
p = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\duo\duo-check.mjs'
s = open(p, encoding='utf-8').read()
i = s.index("    const e = await at(720), q = e.routed;")
j = s.index("    V.pose.action.paused = false;", i)
s = s[:i] + s[j:]
open(p, 'w', encoding='utf-8').write(s)
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
a = "Motion[76]-[79]` now with `deathAt` (her M79 piece, frame 80) and her eat (L0 M16 start + loop, b4) after M79 (her walk to him" + nl + "  not shown: her steering is not read);"
assert s.count(a) == 1
s = s.replace(a, "Motion[76]-[79]` now with `deathAt` (her M79 piece, frame 80), ending where it ended (her M79's end). **Her eat is NOT joined**" + nl +
  "  (no new joining before Raven's combining review): in the ROM it follows -- g1 s46 -> 2:0x15 / 2:0x16 (L0 M8 b12, her walk to" + nl +
  "  him; steering not read) -> 1:0x1c (L0 M16 b4) -- a CANDIDATE for that review;")
a = "lying (M78) on her ground, her L0 M16 after."
assert s.count(a) == 1
s = s.replace(a, "lying (M78) on her ground.")
open(p, 'w', encoding='utf-8', newline='').write(s)
B = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(B, 'rb').read().decode('utf-8', 'surrogateescape')
a = "(L4 M77), lies (L4 M78); she eats him (L0 M16). Built on her M79 entry and the joined grab. Old rows withdrawn. Spec §21.\n"
assert b.count(a) == 1
b = b.replace(a, "(L4 M77), lies (L4 M78). Built on her M79 entry and the joined grab (ending at M79's end). Old rows withdrawn. Spec §21.\n" +
  "      - [ ] (combining review, Raven) the eat after the grab: in the ROM her g1 s46 -> 2:0x15 / 0x16 walk (L0 M8) -> 1:0x1c\n        L0 M16 follows his death -- NOT joined onto S. Motion[76]-[79] until Raven reviews animation combining.\n")
open(B, 'wb').write(b.encode('utf-8', 'surrogateescape'))
print('ok')

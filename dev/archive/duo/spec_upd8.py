p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-duo-spec.md'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
i = s.index('### 14.4 ')
add = ("**Rebuilt 2026-10-17 from the shells agent's read** (dev/em069-em076-shells-spec.md 2b; the repeats are unconditional): the entry" + nl +
"`Seltas Motion[33] with her 7:0x4e` now plays his 7:0x3f phase by phase -- M33 0..60 (the turn to f40, phase 2's 20 frames to f60)," + nl +
"M33 from 40 b4 (spits at 68 / 88 / 96, two a crossing), M33 100..120 b4, from 40 again, 100..120, from 40 a third time (one spit a" + nl +
"crossing, `0xfd4b00(e, 1)` at +0x6c == 2), the flag at its f105 = entry frame 285; her L0 M65 loops to 285, then her L4 M42 from 90" + nl +
"b8. His 15 spits land at entry frames 88 88 108 108 116 116 168 168 188 188 196 196 248 268 276, hers at 295 / 305 / 315 (asserted;" + nl +
"the third set is the shells.js row `7:0x3f/3`, named by index.html partnerRockInput from the layout's `spitSet`). His turns" + nl +
"(+-11 / +-22 degrees, `0x76dd0`) are not shown." + nl + nl)
s = s[:i] + add + s[i:]
open(p, 'w', encoding='utf-8', newline='').write(s)
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em069-em076-shells-spec.md'
t = open(P, encoding='utf-8', newline='').read()
nl2 = '\r\n' if '\r\n' in t else '\n'
old = "* His 7:0x3f timeline in the viewer is the duo layout's one M33 (§2b): the ROM's three sets and their turns are not shown."
assert t.count(old) == 1
t = t.replace(old, "* His 7:0x3f timeline in the viewer: rebuilt by the duo agent (2026-10-17) to the three sets of §2b -- 15 spits at the ROM frames," + nl2 +
              "  the third set the row `7:0x3f/3` (one a crossing); his turns are still not shown.")
open(P, 'w', encoding='utf-8', newline='').write(t)
B = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(B, 'rb').read().decode('utf-8', 'surrogateescape')
anchor = "      - **HIT SYSTEM 2026-10-17** READ:"
assert b.count(anchor) == 1
b = b.replace(anchor, "      - **7:0x3f REBUILT 2026-10-17** (shells agent's read): the entry \"Seltas Motion[33] with her 7:0x4e\" plays his three\n        spit sets (M33 0..60, from 40 / 100..120 x2, from 40 to the flag at 285), her L0 M65 looping under him, then L4 M42\n        from 90; 15 spits at the ROM frames, hers at 295 / 305 / 315 (asserted). His turns not shown.\n" + anchor)
open(B, 'wb').write(b.encode('utf-8', 'surrogateescape'))
print('ok')

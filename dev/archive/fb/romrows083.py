p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| `0x4053e4` 0x10 arm (`0x4054e8`) | base13's aim with flag 0x10"
i = s.index(anchor); j = s.index(nl, i) + len(nl)
rows = [
"| uEm083_00 shells 0x161..0x164 (variant 0) | Gammoth: sp_00 (base00, reader `0x1062afc`, base landing), sp_00_02 (base00, reader `0x1063054`, landing `0x1063148`, +0x158 `0x10632bc`), sp_01 (base01, reader `0x10637c4`, +0x150 `0x1063984`), sp_13 (base13, reader `0x1063b2c`, +0x13c `0x1064314`, +0x15c `0x1063f20`, +0x158 `0x1064158`, landing `0x1063d7c`, vt+0x28 `0x1064354`); ids e+0xcae0 / +0xcae4 / +0xcae8, sp_00_02 an immediate | uEm083_00 | R + E | dev/em083-shells-spec.md; SHELL_DATA.em083_00 |",
"| `0x105c738` / `0x10606f4` / `0x105768c`.. | his actions (variant 0): L2 M61 / M62 sp_00 0..2 at 26 / 28 / 18; L2 M23 sp_13 2 / 1 / 0 at tune float 8 (220), e+0xcb0c = 1, = 2 at float 9 (266); sp_01 7 / 8 / 17 / 11 / 9 / 10 / 37 / 38 at the owner's point and words (L2 M5 / M9 / M14 / M15 / M20 / M21 / M37); the setter `0x10518e4..0x10519bc` clears e+0xcb0c for every action but (7, 0x1b..0x1d / 0x78..0x7e) | uEm083_00 | R + E | SHELL_DATA.em083_00.actions; spawn083 |",
"| `0x1063f20` | sp_13 state 1: anchor, +0x40 = joint (0xc164c) + vec 0 through its 3x3; e+0xcb0c 0 -> end, 2 -> thrown (0x404dc8, the velocity by the Y word) | uEm083_00 | R + E | hold083s13 |",
"| `0x1064354` / `0x1064514` | sp_13 vt+0x28 (the walker, after the update): state 2, once, +0x168c (G rank: mode + 1) >= 2, y <= anchor y -> ef 2, the pieces, 0x329c40(+0x1674, 1), ef 3 into +0x1674; the pieces: mode 1 one sp_00_02 0xb at target + 1500 along target->shell, mode 2 two (1 / 2) at + 1000 and 1200 either side (cos 90 constants), each aimed (pitch / yaw words) from the shell | uEm083_00 | R + E | post083s13 / pieces083 |",
"| `0x10632bc` / `0x1064158` | sp_00_02 / sp_13 +0x158: the base move, then with hit slot 0 on the other-em083 hit (0x5cdf8 enemies, u16 e+0xb5f0 \\| 0x400 == 0x453, 0x1054824) -> ef +0x1660 / +0x167c: needs a second Gammoth, never in the viewer | uEm083_00 | R | emu_fb `noEm` |",
"| `0x3f9cc4` flag-4 arm `0x3f9de8` | joins the clear arm at `0x3f9e0c`, which passes [+0x1618] (the aim offset) to 0x3f9b58: BOTH Y-aim arms take the offset (yAdjust37 left it off flag 4 until 2026-10-18; Gammoth's sp_00 modes 1 / 2, offset (+-400, 80, 0), proved it: 70455 vs 68757) | base00 | R + E | shells.js yAdjust37 |",
]
s = s[:j] + nl.join(rows) + nl + s[j:]
# the tooling row: the new harness options
old = "`ownvt54` (owner vt+0x54 = 0xc156c, a joint's world matrix); the ray 0x183664 meets the floor from below too."
assert s.count(old) == 1
s = s.replace(old, old + " `post28` (the shell's vt+0x28 after each update: Gammoth's split), `slot0Depths` (the depths `slot0` holds hit slot 0 on at), `noEm` (0x5cdf8 answers no enemy).")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')

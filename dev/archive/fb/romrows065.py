p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| `0x3f8ec4` -> `0x3f8f9c` | base00's init: flag 0x80"
i = s.index(anchor); j = s.index(nl, i) + len(nl)
rows = [
"| uEm065_00 shells 0x116..0x119 | Kecha Wacha: sp_00 (base00, reader `0xf569fc`, landing `0xf56b14`), sp_01 (base01, reader `0xf56ed4`), sp_13 (base13, reader `0xf57150`, landing `0xf5733c`), sp_23 (NEW base23, reader `0xf57710`, landing `0xf578c8`); ids immediates | uEm065_00 | R + E | dev/em065_00-shells-spec.md |",
"| `0xf5072c` / `0xf509a0` / `0xf539xx` / `0xf4c844` / `0xf5251c` | his actions: (7, 6) L2 M78 sp_23 0..2 at 108 / 130 / 150; (7, 7) L2 M80 sp_13 0..2; (7, 0x3b) L2 M77 sp_13 3..5 at 116 / 136 / 156; twins (7, 0x17 / 0x18 / 0x41) sp_01 2 (hit only); (3, 7) L5 M25 f16 sp_01 0 (c 31) 300 ahead within 900 of the ground; (7, 0x15 / 0x48) L2 M117 f33 sp_00 0 from (445 ahead, 300 below) x size, (7, 0x16) sp_01 3; variant byte 0 only | uEm065_00 | R + E | SHELL_DATA.em065_00.actions |",
"| base23 `0x40c8ac` / `0x40c9f4` / `0x40cf9c` / `0x40d1a8` / `0x40d2b4` / `0x40d4dc` / `0x40c818` | ctor; init (joint row 3 + offset, the target slot +0x160c, y + 100); the launch solve (pitch word, near / far clamps, sin(pitch) x speed up, fall time to min(dy, -300), h / t <= 60 x scale); update; step (words from the velocity, life +0x1608, query); end; the contact start | base23 | R + E | solve23 / init23 / move23 / step23 |",
"| base13 `0x404984` / base23 `0x40cda4` | the velocity turned by three angles in degrees (+0x1630 / +0x1604): one code (turnDeg065) | base13 / base23 | R + E | Kecha's spreads |",
"| `0x4053e4` 0x10 arm (`0x4054e8`) | base13's aim with flag 0x10: the owner's block +0x54 as it is | base13 | R + E | shells.js aim13 |",
]
s = s[:j] + nl.join(rows) + nl + s[j:]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')

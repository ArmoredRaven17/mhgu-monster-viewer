p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| Barroth makers (main `0xe8c7b0`")
L[i:i] = [
"| Uragaan makers (main `0xe9bb88`): `0xe94d5c..0xe94e18` ((7, 0) L2 M1 f180), `0xe983c0` ((7, 0x8a) L2 M10 phase 4 f226), `0xe98a70..0xe98b18` ((7, 0x8e) L2 M16 f202) | sp_01 **[e+0xcb14]** mode 0 (0x3fa2bc: +0x10 his own +0x40.., +0x30 his words, +0x3c P+0xb0a); sp_13 **[e+0xcb18]** mode 0 (0x4041a8: +0x10 / +0x20 GOT zero, +0x30 0, +0x34 0xffff) | uEm045_00 | R | dev/em045-shells-spec.md 1; shells.js SHELL_DATA.em045_00 |",
"| Uragaan sp_01 vtable `0x17c3614` (base01; reader `0xe9dec8`, +0x158 `0xe9e010` hit side) / sp_13 vtable `0x17c3784` (base13; reader `0xe9e1f8`, landing `0xe9e380`, +0x174 `0xe9e408`) | sp_01: ef 0, hit 0 / 1, int 0 joint + bit 0, **int 2 -> 0x800, int 3 -> 4, int 4 -> 8, int 5 -> 0x1000** (int 1 unread), vec 0 +0x1608, no timer. sp_13: ef 0..3, hit 0, int 0 joint, int 1 -> +0x15e0 bit 1, floats 0 / 2 / 1 / 3 / 4 / 5 -> +0x15ec / +0x15f4 / +0x160c / +0x1600 / +0x15fc / +0x15f8, &vec0 +0x161c / +0x1620; landing: param by type, +0x174 -> shell01 [owner+0xcb14] **mode 4 (5 at variant 4 with quest > 8)** at the contact with this shell's words, then 0x4042bc, the end | uShellEm045_sp_01 / _13 | R | dev/em045-shells-spec.md 2-3 |",
"| base13 init `0x4044d8`, the midpoint turn | +0x15e0 **bit 1 set: the points' midpoint turned by the OWNER's words** (`0x43ae70`, `0x40480c`); clear: by the joint's 3x3 (`0x4047b0`); no joint (-1): the owner's +0x40 and bit 1 set by the init itself (`0x4046c8`); bit 3: x size (`0xbe518`) | uShellEmBase13 | R | shells.js init045s13 |",
]
i = find("| tooling: `<scratchpad>\\fb\\mk044.py`")
L[i+1:i+1] = [
"| tooling: `<scratchpad>\\fb\\mk045.py` -> dev/shells-uragaan-check.mjs (2026-10-19, shells agent) | Uragaan's sp_01 / sp_13: main `0xe9bb88`, owner +0xcb14 / +0xcb18 = 0xdf / 0xe0, slot0Until sp_01 0 -> 5 and the landing child 4 -> 10 (delay + duration: made by the last unit) | controls joint 3 / target / joint 143 fail | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

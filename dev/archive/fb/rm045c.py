p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| Uragaan makers (main `0xe9bb88`)")
L[i:i] = [
"| Crystalbeard makers (main `0xe9bb88` variant 4; ids e+0xcb10 sp_00 / +0xcb14 sp_01 / +0xcb18 sp_13 / **+0xcb1c sp_32**) | (7, 0 / 0x8a) sp_01 8; (7, 0x8e) sp_13 0; (7, 0xe5) L9 M3 -> L2 M10 from 94: phase 2 f100 / f110 sp_32 26 / 24, phase 5 f226 sp_01 8; (7, 0xe6 / 0xea / 0xe7 / 0xeb) L9 M1 / M2 f114 sp_00 8 / 0 / 10 / 2; (7, 0xf4..0xff) L2 M4 f202 sp_32 by action (sites `0xe9a498` / `0xe9a53c` / `0xe9a600`; the table in the spec) | uEm045_00 v4 | R (sites) / E (modes per action) | dev/em045-shells-spec.md 4; SHELL_DATA.em045_04 |",
"| **base32** `0x415010..0x416290` (READ whole): ctor `0x415010` (count `[0x2129c98]` += 1), dtor `0x415180` (-= 1), init `0x415278`, move `0x4157dc` -> `0x4158d8`, flight `0x415a18`, landing effect `0x41607c`, end `0x4161e8` | init: count >= 7 deleted; words (0, his +0x54 + vec0.y deg, 0); +0x40 joint (0xc164c) or block +0x40 + vec1; A = +0x40 + dA along Y at his ground + probe `0x18154c`, B = A + dB the same; a probe not below ground + cmn float 0 -> deleted; Y word = (int1 % 3) << 14; state 1; ef 0. Flight: hop 1 to A over T1 (+0x15f4, gravity vec2), spin +0x1608 about the axis; at A ef 1 and hop 2 to B over T2 (+0x15f8, vec3), words preset -T2 x +0x160c; at B ef 1, settle, ground angles (0x43b1a0); settled: wait +0x15e8, then +0x15fc, then the end; stage contact -> +0x154. End: ef 0 stop, +0x150, 0xfe | uShellEmBase32 | R | dev/em045-shells-spec.md 4.3; shells.js BASE32 (make32 / step32) |",
"| Crystalbeard sp_32 class (vtable `0x17c3904`): reader `0xe9e6dc` (0xe5 -> `0xe9e928`, 0xe1 -> `0xe9e710`), +0x150 `0xe9ed28`, +0x154 `0xe9eb90`, +0x158 `0xe9ed98` (sound), +0x15c `0xe9ee64`, +0x160 `0xe9ebf0` | reader 0xe5: ef 0..2, hit 0 / 1, ints joint / axis / sound, floats 0..9 -> +0x15e8..+0x160c, &vecs 0..3 -> +0x1614 / +0x1618 / +0x161c / +0x1620, cmn float 0 -> +0x1610, rng -> +0x1672; +0x15c: every +0x15ec frames shell01 **mode 10** at +0x40; +0x160 (the burst at the end): shell01 **9** for modes 24..26, else **4** (5: variant 4, quest > 8) | uShellEm045_sp_32 | R | shells.js child32 / end32 |",
"| Crystalbeard sp_00 class: ctor `0xe9db80`, reader `0xe9dbd0`, +0x150 `0xe9dd34` | reader: ef 0..3, hit 0, int 0 joint, vec0 z / y vz / vy, vec3 x / y degrees, &vec2 offset, &vec1 gravity, \\|= 5; **through `ldr r0, [r4, r0]!`'s pointer (+0x15e8): +0x1604 = 22.5, +0x1600 = -45 (the X clamp), +0x1618 = &+0x1660**; ctor +0x1660 = (0, 65, 0) (the aim offset) | uShellEm045_sp_00 | R (+ emu_fb DUMPF) | shells.js params045s00 |",
]
i = find("| tooling: `<scratchpad>\\fb\\mk045.py`")
L[i+1:i+1] = [
"| tooling: `<scratchpad>\\fb\\mk045c.py` -> dev/shells-crystalbeard-check.mjs (2026-10-19, shells agent) | Crystalbeard's four shells: main `0xe9bb88` v4, ids poked at +0xcb10..+0xcb1c, case `base32`, 1700-frame flights for the crystals; slot0Until per case (a child of a unit that is not the last: delay + duration + 1) | controls joint 143 / Y word / target fail | -- |",
"| tooling: emu_fb `base32` / DUMPF (2026-10-19) | case `base32`: `0x18154c` -> *[sp] = FLOOR_Y, registry `0x48bf4c` / `0x48bf08` (a zeroed record) / `0x48c214` answered, the live count `[0x2129c98]` zeroed per case, base32's timer +0x1630; env DUMPF: each shell's +0x15c8..+0x167c after its init (hex) in the run's `fields` (`fb/emu_fb.pre045.py` the old copy) | dev/shells-crystalbeard-check.mjs; DUMPF found sp_00's clamp -45 / 22.5 | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| sp_00 vt+0x154 `0x10102fc` = `b 0x4a0f38` (nothing)")
L[i+1:i+1] = [
"| Kut-Ku makers (main `0xd4fdd8`; ids immediates sp_00 0x73 / sp_01 0x74 / sp_13 0x75) | (7, 0x12 / 0x22) L2 M2 phase 2 f26 / 48 / 86 sp_00 0 / 1 / 0; (7, 0x19 / 0x49) L2 M3 f32 sp_00 2 / 19; (7, 0x23 / 0x4c) L2 M3 f32 sp_13 0 / 1; (7, 0x2d / 0x36 / 0x37 / 0x38) L2 M1 f78 / 150 / 240 / 296 sp_00 3..18 (census k08cap.py) | uEm008_00 | R (sites) / E | dev/em008-shells-spec.md 1.1; SHELL_DATA.em008_00 |",
"| Kut-Ku frame handler `0xd4ffa4` (vt+0x208; tables at `0xd4ffd4` / `0xd5011c` / `0xd50234`) | `0xb0974` crossing + block +0x44 <= ground +0x5b4 + 900.0 -> shell01 0x74 at the block point, his words e+0xfe8..: L0 M24 / M27 / M30 f2 m3, L1 M4 f2 m5, L1 M14 f52 m5, L1 M17 f2 m4, L1 M19 / M102 f2 m4, L1 M105 f2 m4, L1 M106 f2 m4; L1 M1 `0xd5028c` (m3 at clock C+0x10 >= 100.0) unreachable: next row | uEm008_00 | R + E (pf census, check) | spec 1.2; shells.js PERFRAME008 |",
"| Kut-Ku vt+0x1dc `0xd471c4` (clock C+0x10) | += dt (`0x7264c`), >= 100.0 -> 0 and byte C+0x14 = 1; called `0xaddc8` in `0xada80` (the +0x24 pass, before the action main) -- vt+0x208 runs later in the +0x28 pass (`0xae774`): **the handler's L1 M1 test (>= 100.0) never holds**. Control: trgen 0xd4ffa4 mot 0x101 with the clock 100.0 makes m3, 99.0 nothing | uEm008_00 | R (order) + E (control) | spec 1.2 |",
"| Kut-Ku (7, 0x02) `0xd4b990` phase 2 `0xd4bb08` | L2 M20 (0x214) -> L2 M21 (0x215); frame >= 10 (`0xb0968` mode 1): C+0x10 += dt (`0xd4bb94`), >= 16.0 -> 0 and shell01 0x74 m6 at (block x, ground +0x5b4, block z), his words; with vt+0x1dc's += dt the clock rises 2 an update (one shell / 8 updates); the window's starting clock a stand-in (counter008). Also (7, 0x3e..0x41), outside his table. Census-missed (clock 0); found by `k08m6.py` (clock primed 16) | uEm008_00 | R + E | spec 1.3 |",
"| Kut-Ku sp_00 (vtable `0x179c130`): init `0xd52200`, reader `0xd522b8`, landing `0xd52430` | reader: ef 0..3, hit 0, int 0 joint, int 1 -> 0x100, floats 1 / 2 / 0 X deg / Y deg / vz, cmn float 0 flight, &vec 0 offset, cmn vec 0 gravity, float 3 -> +0x1660; init: base00 then +0x1660 > 0 -> velocity x s, gravity x s^2. Landing: type 1 ef 2 + shell01 (m <= 2 ? 0 : 1) at the contact; type 0 ef 1; type 2 ef 3 | uShellEm008_sp_00 | R | shells.js params008s00 / scale008 / landing008s00 |",
"| Kut-Ku sp_01 (vtable `0x179c2ac`): reader `0xd52774` | ef 0 / 1, hit 0 / 1, +0x15ec 4 / 8 / 0x80 / 0x800 / 0x1000 from ints 0..4, &vec 0 -> +0x1608; no joint, no timer | uShellEm008_sp_01 | R | shells.js params008s01 |",
"| Kut-Ku sp_13 (vtable `0x179c41c`): init `0xd529e8`, reader `0xd52aa0`, landing `0xd52c70` | reader: ef 0..3, hit 0, int 0 joint, +0x15e0 2 / 0x10 from ints 1 / 2 then \\|= 0x60, floats 0 speed / 2 gravity / 1 per unit / 4 far / 3 near / 5 life / 6 -> +0x167c, &vec 0 both points; init: base13 then +0x167c scaling. Landing (state 2): type 1 ef 2 + shell01 0; type 0 ef 1; type 2 ef 3; `0x4042bc`, end | uShellEm008_sp_13 | R | shells.js params008s13 / init008s13 |",
"| base13 `0x405500` 0x40 arm `0x4055b0` | the distance and the base point from the OWNER block's +0x40 (not the shell's +0x40, `0x40555c`); 4 clear: the clamp [near, far]; then `0x4059a8` as the 0x40-clear path (aim 0x4053e4, +0x1624's point added, the target's y + +0x1614) | uShellEmBase13 | R | shells.js thrown008s13 (and thrown067s13) |",
]
i = find(r"| tooling: `<scratchpad>\fb\mk080h.py`")
L[i+1:i+1] = [
r"| tooling: `<scratchpad>\fb\mk008.py` -> dev/shells-kutku-check.mjs (2026-10-20, shells agent); `fb\k08cap.py` (census with setups / motions), `fb\k08m6.py` (every action x phase with the clock C+0x10 primed 16), `fb\shvt.py lo hi` (shell vtables whose +0x14c lies in a band: the reader slot) | 17 cases: main `0xd4fdd8` steps, the handler `0xd4ffa4` with e+0x4b4 and `frame` (0xb0974), (7, 0x02) with ctl +0x10 = 16 (emu_fb stubs `0x7264c`); slot0Until per flight | controls joint 4 / target / Y word / ground fail; shvt control: Glavenus's three vtables found | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

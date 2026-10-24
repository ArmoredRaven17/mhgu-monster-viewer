p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| Khezu `0xd13e98` (the ground patch")
L[i:i] = [
"| Diablos / Bloodbath `0xd35a94` (vt+0x208) motion sites `0xd362ac` / `0xd35c90` / `0xd36424` / `0xd36458` / `0xd36488` -> helpers `0xd36a0c..` (`b 0x48b884` `0xd36ac8`) | shell01 **0x70 (em007_00) / 0x71 (em007_04)**, literals: L0 M24 f58 mode 11; L0 M33 / M43 f2 mode 12; L1 M1 f6 / f76, L1 M4 f2 mode 10; L1 M17 / M19 f2 mode 11 (`0xb09a4` channel 0); +0x10 the BLOCK's +0x40.., +0x30 his words, +0x3c 0xffff; no rage / tired / action gate. The default arm (ctl+0x24 != 0, status 6, table `0xd36510`) stops / clears the handle ctl+0x24 only (`0xd3659c` / `0xd365b0`) | uEm007_00 | R (sites, the helper) / E (the rows) | dev/em007-shells-spec.md 6a; shells.js perFrame007, SHELL_DATA.em007_00; dev/shells-diablos-check.mjs, dev/shells-bloodbath-dust-check.mjs |",
"| Bloodbath (7, 0xb8) `0xd3cd40` phase 2 `0xd3d0e0` (tune 137 = 24) -> `0xd3d1a0` | phase 0 L2 M15 from 98, phase 1 **L2 M19** (0x78b78 != 0, `0xd3dc18`), phase 2 at 24.0 **on L2 M19**: shell01 0x71 mode 7 (u 300), the four sites' request; (7, 0xb4) / (7, 0xb6) phase 2 test `0xb0968(e, 0, 80)` and make none | uEm007_00 v4 | R (emulated, trgen d07cap2.py) | dev/em007-shells-spec.md 6b; SHELL007 (7, 0xb8); dev/shells-bloodbath-check.mjs |",
]
i = find("| tooling: fbbcmp.mjs `also` on beam rows")
L[i+1:i+1] = [
"| tooling: `<scratchpad>\\fb\\mk007.py` / `mk007pf.py <mon>` -> dev/shells-bloodbath-check.mjs / shells-diablos-check.mjs / shells-bloodbath-dust-check.mjs (2026-10-19, shells agent) | Bloodbath's action rows (main `0xd32ce0` variant 4, winFrames per frame, severed) and the frame handler `0xd35a94` by motion id (frame3) for both variants | controls Y word / position / the sever fail | the page's L0 burrow clips: the viewer's floor (index.html monsterFloorY) 1345 below him -- base01's 900 rule deletes the dust there |",
"| tooling: emu_fb `frame3` (2026-10-19) | a step's `frame3`: `0xb09a4` (0x72714 on channel 0) answers 1 at that frame alone; absent, native as before (`fb/emu_fb.pre007.py` the old copy) | dev/shells-diablos-check.mjs (8 sites, each made once) | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

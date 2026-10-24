p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| base03 init: **ef 0 at the launch point**")
L[i+1:i+1] = [
"| Hellblade makers (main `0xffe7fc` variant 4; ids 0x149 / 0x14a / 0x14b) | 43 draws: (7, 0x02 / 0xf0) L2 M2 f122 sp_03 9-11 / 41-43; (7, 0x0b / 0xea) L2 M11 f132 sp_03 18-20 / 44-46; (7, 0x09 / 0xd9 / 0x97 / 0xf3) L2 M9 ph2 f70/120/168 sp_00; (7, 0x0a / 0x0c / 0xd4 / 0xdb / 0xf4) L2 M10 ph2 f92; (7, 0x5c / 0xfe) L2 M55, (7, 0x5d / 0xff) L2 M57 f56; (7, 0xeb) L2 M15 f10/40; (7, 0xee) L2 M1 f48; (7, 0xf9) L2 M17 f58; (7, 0xfa) L2 M18 / M19 f40; (7, 0xe6) L9 M7 tune 22 / 32; sp_01 by (7, 0x8e) L2 M14 ph2 f120, (7, 0xf7) L2 M14 f102, (7, 0xf6) L2 M13 f100, (7, 0xe8) L2 M37 f66, (7, 0xfc / 0xfd) L2 M36 ph3 f20 | uEm080_00 v4 | R (sites, phases) / E | dev/em080-shells-spec.md 5; SHELL_DATA.em080_04 |",
"| `0x1004a64` (7, 0xfa) phase 0: turn `0x7a258` on table `0x16a1d40` | header threshold +0xe = 0 -> `0x772b4` always a side: +0x20 0x212 (L2 M18) / +0x30 0x213 (L2 M19) by the sign; centre +0x10 = 0 unused. Phase 1: `0x100f08c` f40 sp_00 28 | uEm080_00 v4 | R | spec 5 |",
"| `0x1006868` (7, 0xe6) / `0x100f1f4` | phase 0: L9 M2..M6 (0x902..0x906) by the target angle -> phase 1..5; each end -> L9 M7 (0x907), phase 6; phase 6 sets 7 and falls into 7's `0x100f1f4(e, 1)`: actions 0xe5..0xe7 (byte e+0x73e1 + 0x1b <= 2), `0xb0968` at action_tune float 0x2b (22) -> sp_00 0x22, 0x2c (32) -> 0x21 | uEm080_00 v4 | R | spec 5 |",
"| (7, 0xfc / 0xfd) phase 2 `0x10054c8` | `0xbf4e4` == 1 -> L2 M36 (0x224), phase 3; phase 3 (`0x100556c`, sub 0) `0x100f564` f20 sp_01 6 / 7; 0xfc phase 3 -> L2 M38, 0xfd -> (7, 0xe8) | uEm080_00 v4 | R | spec 5 |",
"| Glavenus / Hellblade sp_03 vt+0x154 `0x1010df8` | after base03's `0x3fd820`, owner active: mode 41..43 -> shell01 12, 44..46 -> 13 at +0x40 with its words +0xfe8.., +0x3c 0xffff, +0x15c0 = 1. +0x150 `0x1010d4c`: type 0 ef 1 + end; type 1 modes 6..23 nothing, else ef 2 + end; type 2 ef 3 with +0x15c1 0 | uShellEm080_sp_03 | R + E (hf0 / hea) | shells.js END03 |",
"| sp_00 vt+0x154 `0x10102fc` = `b 0x4a0f38` (nothing); sp_01 vt+0x150 `0x10106b8`: mode 14 only (owner +0x7800.. point, shell01 15 with his byte +0x8bb3) -- no site reaches 14 | uShellEm080_sp_00 / _sp_01 | R | spec 5 |",
]
i = find(r"| tooling: `<scratchpad>\fb\mk080.py`")
L[i+1:i+1] = [
r"| tooling: `<scratchpad>\fb\mk080h.py` -> dev/shells-hellblade-check.mjs (2026-10-20, shells agent); `fb\h80ph.py` (phase transitions per action: ended / landed / frame answered, P+0x1a1 after, setMotion and chg) | Hellblade's 19 cases, main `0xffe7fc` v4, ids 0x149..0x14b, joints 0 / 3 / 4 / 145 | controls joint 145 / Y word / target fail; h80ph's 0xbf4e4 is stubbed 0 (pass `stub` to answer it) | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

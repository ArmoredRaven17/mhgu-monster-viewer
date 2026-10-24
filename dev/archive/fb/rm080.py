p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| Crystalbeard sp_00 class: ctor `0xe9db80`")
L[i+1:i+1] = [
"| Glavenus makers (main `0xffe7fc` variant 0; ids e+0xcbe0 sp_00 0x146 / +0xcbe4 sp_01 0x147 / +0xcbe8 sp_03 0x148; Hellblade 0x149..0x14b) | (7, 0x02) L2 M2 f122 sp_03 9 / 10 / 11; (7, 0x0b) L2 M11 f132 sp_03 18 / 19 / 20; (7, 0x09) L2 M9 phase 2 f70 / 120 / 168 sp_00 7 / 8 / 9; (7, 0x0a / 0x0c) L2 M10 phase 2 f92 sp_00 0 / 6; (7, 0x5c / 0x5d) L2 M55 / M57 f56 sp_00 4 / 5 (census trgen g80cap.py) | uEm080_00 | R (sites) / E | dev/em080-shells-spec.md 1; SHELL_DATA.em080_00 |",
"| Glavenus sp_00 (vtable `0x17ebd48`): reader `0x100f9fc` (`0x100fa38` 0x146 / `0x100fd3c` 0x149), landing `0x1010018` | reader: ef 0..3, hit 0, ints 0..2 joint / cameras, ints 3..8 -> bits 0 / 1 / 2 / 3 / 7 / 11 (11 for 0x146 only), floats 0..7 X deg / Y deg / vz / flight / X clamp / Y clamp, &vecs offset / aim origin / aim offset, cmn float 0 -> +0x15c4; no vy, no gravity. Landing type 0 / 1: ef 1 / 2 and (owner active, mode <= 0x2c not 10..34) shell01 of table `0x16a1dc0` (0..9: 17 0 0 0 0 0 17 0 0 0; 35..44: 19 2 2 2 2 2 19 2 2 2) at the contact; type 2: ef 3 when byte +0x15c1 0 | uShellEm080_sp_00 | R | shells.js params080s00 / landing080s00 |",
"| Glavenus sp_01 (vtable `0x17ebec4`): reader `0x1010418`, +0x154 `0x101052c` | reader: ef 0, hit 0 / 1, int 0 -> bit 0, int 1 joint +0x15e4, int 2 -> 4, int 3 -> 8, float 0 timer +0x15f0, &vec 0 -> +0x1608. +0x154 (base01's end, owner active): mode 0 / 2 / 17 / 19 -> shell01 1 / 3 / 18 / 20 at its point | uShellEm080_sp_01 | R | shells.js params080s01 / endCreate080 |",
"| Glavenus sp_03 (vtable `0x17ec034`, base03): reader `0x1010964` (`0x101099c` / `0x1010b88`), +0x150 `0x1010d4c` | reader: ef 0..3, hit 0, int 0 joint, int 1 -> 0x80, int 2 -> 0x800, int 3 -> **8** (base00's bit 3 inside base03's init: the offset turned by the words), floats fan / speed / life, floats 3 / 4 -> +0x167c / +0x1680, &vec 0 / 1; byte +0x15c1 = mode in 6..23. +0x150 type 1 for 6..23: nothing | uShellEm080_sp_03 | R | shells.js params080s03; init03 bit-3 arm |",
"| base03 init: **ef 0 at the launch point** (`0x3f9298`, base00's init inside base03's, before the ground step `0x3fdb08`) | spawnBolts started ef 0 at the grounded point until 2026-10-20; the ROM starts it at joint + offset (Glavenus sp_03 10 / 19: y 10.5 vs 0). the whole shells suite (65 checks) passes after the fix | uShellEmBase03 | R + E | dev/em080-shells-spec.md 4; shells.js spawnBolts |",
]
i = find("| tooling: `<scratchpad>\\fb\\mk045c.py`")
L[i+1:i+1] = [
"| tooling: `<scratchpad>\\fb\\mk080.py` [em080_00 / em080_04] -> dev/shells-glavenus-check.mjs (2026-10-20, shells agent) | Glavenus's three shells: main `0xffe7fc`, ids poked at +0xcbe0 / +0xcbe4 / +0xcbe8 (Hellblade's 0x149.. with the em080_04 argument), sp_00 to its landing children and their end chain, 300 frames per case | controls joint 0 / his Y word / target fail | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

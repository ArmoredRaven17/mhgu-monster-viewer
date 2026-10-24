p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| uEm061 sp_00 mode 7 ((7, 0xe6))"
i = s.index(anchor); j = s.index(nl, i) + len(nl)
rows = [
"| `0xf23ec0` (uEm061_00 vt+0x158) | the ids by `e+0xb5f5`: variant 0 -> 0x105 / 0x106 / 0x19d / 0x107 / 0x19d, variant 4 -> 0x108..0x10c into `e+0xcac8..+0xcad8` (sp_00 / sp_01 / sp_13 / sp_19 / sp_24) | uEm061_00 | R | dev/em061-shells-spec.md |",
"| `0xf34c74` / base24 `0x40da80` / `0x40dc14` / `0x40e6f0` / `0x40d808` / `0x40d9c8` / `0x40e984` / `0x40ea90` / `0x40ec60` / `0x40ed6c` | Rustrum's lump sp_24 (0x10c): reader; NEW base24 (ctor over the plain shell): init (the solved throw), the ground placement ahead of the owner, landing (type 1 lands it, ef 2), the end's ef 1 (not when converted, +0x1630), update / step / flight / end | uShellEm061_sp_24 | R + E | spec 3; shells.js init24 / snap24 / landing24 / move24 / step24 |",
"| `0xf2fd84` / `0xf302a8` / `0xf31220` / `0xf304d4` / `0xf2ffxx` | the L9 actions: (7, 0xed / 0xee / 0xf5) M3 place + f32 roll; (7, 0xf1..) M2 f85 throw 0; (7, 0xfa / 0xff) M10 f104 throw 1, +0xcae0 = 0; (7, 0xe5) M10 from 182 place 1, f184 lift, +0xcae0 = 1; (7, 0xf6) M11 f59 +0xcae0 = 2. Held lump `e+0xcadc` | uEm061_00 | R | spec 3; SHELL_DATA.em061_04.actions |",
"| `0xf34a20` / `0xf34b4c` | the conversions on the held, landed lump: -> sp_19 `mode` (its point / words), -> sp_13 0; both +0x1630 = 1 and the end | uShellEm061_sp_24 | R + E | convert24 |",
"| `0xf34608` / base19 `0x408f74` / `0x409018` | sp_19's variant-4 reader (0x10 / 0x20 the setup's point / words, 2 the clamped Y aim, 0x400 sizes x the owner's, +0x1664 bit 3 the turn); the turn's setup and step (+0x1730 / +0x1728 / +0x172c) | uShellEm061_sp_19 | R + E | params061s19v4 / init19v4 / turn19 |",
"| `0xf33858` / `0xf33784` / `0xf33e40` / `0xf33a8c` / `0xf33b1c` | sp_13 (0x10a): reader (flags 0x101..), init (+0x40 = setup's), the HOLD on joint 15 while L9 M10 / M11 (joint-parented `0x8a46a0`, inherit mode 2: words 0; 5-update blend) and the throw at +0xcae0 == 2; landing; the burst sp_01 1 + sp_00 0x17..0x19 | uShellEm061_sp_13 | R + E | init13r / hold13r / landing061s13 |",
"| `0x8a5480` (the coordinate's world update) | world = local x the parent joint (`0x29d00`); inherit mode `+0x3a` 2 replaces the rotation by the rows' lengths (no rotation), then the node's scale | effect coordinate (0x8a46a0) | R | hold13r |",
"| `0x4051cc` | base13's move: byte +0x15e1 bit 0 (flag 0x100) skips the turn from the velocity | base13 | R | move13 |",
"| `0x3f8ec4` -> `0x3f8f9c` | base00's init: flag 0x80 scales the turned offset by the size (0xbe518) on the joint path as well | base00 | R + E | init03 / init00 (dm_*_big) |",
]
s = s[:j] + nl.join(rows) + nl + s[j:]
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')

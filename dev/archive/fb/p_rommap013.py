p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| `0x43370` (core vt+0x28) / `0x43da0` -> `0x327188` (unit vt+0x28) |"
i = s.index(a); j = s.index('\n', i)
rows = """
| `0xd82024(e, sel, dX, dY)` | the line's sp_00 maker: 0x82 / 0x86 / 0x8a by e+0xb5f5; mode sel == 1 ? 1 : 0 (v2: 2 -> 1, 1 -> 2); +0x20.. = block words + (dX, dY, 0) | uEm013_00 (Fatalis line) | R + E | elder spec 3; shells.js do013 |
| `0xd7ffcc(e, kind, &v, scale)` | the dust: sp_01 (kind 5 / 1 / other by variant) at block point + v x scale x 0xbec34 by the Y word, block words, then 0x43ab74(scale); reads the variant through `ldr [r7, #0x1428]!` + 0xa1cd = e+0xb5f5 | uEm013_00 | R + E | elder spec 3 |
| `0xd84b60` / `0xd86a5c` | the fire's yaw: the target bearing from a point, clamped +-0x1555 (30 deg) / +-0x2000 (45 deg) -> [e+0xcac0]+4 (dY); blends L2 M33 / M34 (L4 M8 / M9) | uEm013_00 | R + E | elder spec 3; shells.js yaw013 |
| `0xd80e74(e, idx)` / `0x2125018` / `0x17a60c4` | the meteors: table 36 x 12 B (init_array 1820, 0xd8b4b0), base idx < 11 the target else block +0x30 (phase 0's copy of +0x40); v2 sp_01 0x8b 5, else sp_00 0x86 5; the idx lists per action by the counter P+0x1a2 | uEm013_00 | R + E | elder spec 3; shells.js meteor013 / METEOR013 |
| `0xd85fbc` / `0xd86d70` | the sweeps' makers (sp_51 0x85 / 0x89 at (-500, 320) / (560, 200) by side; Old's 0x8e at max(dist - 350, 1000) ahead) | uEm013_00 | R + E | elder spec 3 |
| `0xd8b6f8` / `0xd8c254` / `0xd8d41c` / `0xd8baa4` / `0xd8da5c` / `0xd8c0a0` / `0xd8dfa8` | the line's readers (sp_00, Crimson's sp_00, Old's sp_01, sp_01, Old's sp_11, sp_51, Old's sp_51); 0xd8cf8c = 0xd8b6f8, 0xd8c7f4 = 0xd8baa4, 0xd8cdf0 = 0xd8c0a0 (the same instructions) | uEm013_00 | R + E | elder spec 3 |
| `0xd8b7f8` / `0xd8c52c` / `0xd8d08c` | the sp_00 landings (children by mode and type; Old's mode 1 type 1 -> sp_11 0x8d, type 2 returns without the end) | uEm013_00 | R + E | elder spec 3 |
| `0xd8c3bc` / `0xd8c6f8` | Crimson's sp_00 init (mode 5: ef 2 at the ray's hit below, the GOT up vector 0x19176f0 x 100000) / +0x154 (stops it at the end) | uEm013_01 | R + E | elder spec 3 |
| `0x428af4` / `0x428bc4` / `0x428f48` / `0x4290e4` | **BASE51**: ctor / init (base01's, then the reach turned by Z, X, Y: A -> B; +0x1660 1 halves it about the point) / +0x150 the sweep (wait, lerp over +0x1668, anchor +0x166c behind, then the end) / +0x164 ef +0x15d0 at slot 0's onset | uShellEmBase51 | R + E | elder spec 3; shells.js init51 / sweep51 / switch51 |
| `0x700ec(e, st, n)` | e+0x73e2 / +0x73e3 == (st, n): the PREVIOUS action test | shared | R | elder spec 3 |
"""
s = s[:j + 1] + rows.lstrip('\n') + s[j + 1:]
t = "101. **A class's shells can live outside every action body (2026-10-18)."
i = s.index(t); j = s.index('\n', i)
s = s[:j + 1] + ("102. **One class, several monsters: the command table decides which actions each plays (2026-10-18).** uEm013_00's census under "
                 "variant 0 showed Crimson's meteors (sp_00 0x86) -- actions only variant 1 issues. Walk the EMC with op 0x92 (the variant switch) "
                 "evaluated and close it over the set-action calls (fb/emcvar.py, chain013.py); the control: every reached action makes only its "
                 "own variant's ids.\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)
print('ok')

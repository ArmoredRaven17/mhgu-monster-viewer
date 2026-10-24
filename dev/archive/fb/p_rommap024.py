p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| `0x700ec(e, st, n)` |"
i = s.index(a); j = s.index('\n', i)
rows = """
| `0xdf8610` / `0xdf88f0` / `0xdf96a8` / `0xdf2670` | Kushala's shell makers: (7, 0 / 1) L2 M10 / M11 f54 sp_01 11 at level 2 / 3; (7, 2 / 3) L2 M7 f78 sp_33 0 / 1; the shot actions (kind table `0x169d3a0`: P+0x1a3 loops of L2 M1, then shots on L2 M9 at each f20 crossing, P+0x1a3 - 1 at f46); (7, 0x28 / 0x29 / 0x2a / 0x37 / 0x38) L2 M21 f76 / L2 M22 f102 sp_00 by the level; the snow modes when ctl+0x2c && ctl+0x2d | uEm024_00 | R + E (cengen11 poked, fb/rungen11k.py) | elder spec 4; shells.js spawn024 |
| `0xdfd5ec` / `0xdfd748` / `0xdfd7e8` / `0xdfd3a0` | Kushala's sp_00 reader (cmn joint 3, flight 72, vz 40; flags 0x48; sh vec 0 degX / degY; ints 0 / 1 the children) / landing / children (modes in 0x3001800 -> sp_38, else sp_34 x2) / the tornado ring at ctl+0x30.. (n ctl+0x44 = tune int 0 = 2, index ctl+0x48: the next slot's shell ended) | uEm024_00 | R + E | elder spec 4 |
| `0xdfdb74` / `0xdfe018` / `0xdfe2b4` | Kushala's sp_01 reader (flags 1 / 0x400 / 0x80 / 0x800 / 4 / 8 by ints 3 / 0 / 1 / 4 / 5 / 6; its .shl lists (c, u)) / sp_33 reader / sp_33 +0x158 (sp_01 [0x169d3f0][mode]) | uEm024_00 | R + E | elder spec 4 |
| `0xdfe4cc` / `0xdfe6e8` / `0xdfe7c4`; `0xdfe9b4` / `0xdfec18` / `0xdfecf4` | sp_34 / sp_38 readers, +0x154 (sp_01 child at +0x40), +0x158 (the life below the reader's - 300 with the owner in (7, 0x2a / 0x2b / 0x2d / 0x36 / 0x37 / 0x38) -> 0) | uEm024_00 | R + E | elder spec 4 |
| `0x416688` / `0x416df8` / `0x417338` | **BASE33** init / move / end (the ground-riding wind; flags by reader bits 0 / 1, rides 0 / 1 / 2, end rules) | uShellEmBase33 | R + E | elder spec 4; shells.js init033 / move033 |
| `0x417680` / `0x417808` / `0x417c8c` / `0x417dc8` / `0x41839c` | **BASE34** ctor / init / step / move / end (the tornado: the turn, the sway on [[0x211f764]+0x68], the floor +-250, the growth and the children) | uShellEmBase34 | R + E | elder spec 4; shells.js init034 / move034 |
| `0x41c160..0x41c25c` / `0x41c2a0` / `0x41c8a8` / `0x41c9e4` / `0x41d12c` | **BASE38** ctor / init / step / move / end (the wandering tornado: Lehmer draws on +0x163c from the owner's +0x73e8, the leash +0x160c, speed floor +0x15f8) | uShellEmBase38 | R + E | elder spec 4; shells.js init038 / move038 / draw038 |
"""
s = s[:j + 1] + rows.lstrip('\n') + s[j + 1:]
t = "102. **One class, several monsters: the command table decides which actions each plays (2026-10-18)."
i = s.index(t); j = s.index('\n', i)
s = s[:j + 1] + ("103. **A shell's EffectParam list is ITS .shl's list order, not the monster's (2026-10-18).** Kushala's sp_01 lists "
                 "(em024_00c, em024_00u): its list 0 is c -- u 29..35 are c's UNIQUE keys, and 120 / 130 u's. Taking the monster's (u, c) "
                 "made the export look for keys the array does not hold. Read the .shl's EffectLists (fb/shl.py prints them in order).\n"
                 "104. **emu_fb's frame step [[0x211f764]+0x68] is NULL unless the case names it (2026-10-18).** The global pointer is 0 in "
                 "the harness, so any code that adds the frame step (Kushala's base34 sway clock +0x1378) adds 0 and the run looks frozen "
                 "next to the module's dt. A case's `frameStep: 1.0` sets it (fb/emu_fb.py).\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)
print('ok')

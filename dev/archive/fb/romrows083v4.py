p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
anchor = "| `0x3f9cc4` flag-4 arm `0x3f9de8` |"
i = s.index(anchor); j = s.index(nl, i) + len(nl)
rows = [
"| uEm083_00 shells, variant 4 (Elderfrost) | ids e+0xcae0 0x165 / +0xcae4 0x168 / +0xcae8 0x16a (`0x105f164`); immediates 0x166 uShellEm083_04_00 (reader `0x1061084`, +0x13c `0x106128c`, landing `0x1061158`), 0x167 uShellEm083_sp_00_03 (reader `0x1063568`), 0x169 uShellEm083_04_02 (base02, reader `0x106170c`: its arc entry starts no effect, not made), 0x16b uShellEm083_04_13 (reader `0x10619a0`, init `0x10622f4`, hold `0x1061ef4`, move `0x1062138`, landing `0x1061d6c`, vt+0x28 `0x106236c`, pieces `0x1062530`); folders by id order INFERRED | uEm083_00 | R + E | dev/em083-shells-spec.md; SHELL_DATA.em083_04 |",
"| `0x105adf8` / `0x105b674` / `0x1060aa4` / `0x105faec` | his L9 actions: L9 M6 (7, 0x6f) start sp_01 16 / 18 (`0x1060d4c`), its L9 M7 sp_00_03 0 / 1 at 12 / 47 (`0x1060be8`); L9 M8 (7, 0x72) sp_13 6 at 30, thrown at 100; L9 M15 (7, 0x77 / 0x81) f95 sp_00 4 at joint 157 (y owner + 100), Y + e+0xcb10; L2 M23 variant-4 arm (0xb0974 220 / 266, 0x16b) | uEm083_00 | R + E | SHELL_DATA.em083_04.actions |",
"| `0x1051ebc(e, r1, r2, r3)` / table `0x1051944` | the action setter's turn: e+0xcb10 = bearing joint 102 (r2) -> target vs facing, wrapped, clamped +-min(r2 ? 90 : 30, tune int r3 ? 0x35 : 0x36); r1 zeroes e+0xcb14; (7, 0x69) 1/1/1, (7, 0x77) 0/1/1, (7, 0x80) 1/1/0, (7, 0x81) 0/1/0 | uEm083_00 | R + E (precall) | shells.js turn083 |",
"| `0x1062d30..0x1062ee0` | sp_00 reader's mode-4 arm: flags (f & ~0x3b) \\| 0x38; aims the REQUEST's words from its point at target + [+0x1618], clamped (Y uxth add, X uxtah) | uEm083_00 | R + E | params083s00 |",
"| `0xaf4f8(e, slot, abs)` | the target slot's bearing from the owner's block +0x40 against block +0x54, u16 (abs: 0x10000 - d past 0x8000) | shared | R | params083s132 |",
"| `0x1060e28(e, tune int)` (callers `0x1058208` / `0x1058428` / `0x1059184`, tune floats 0x53..0x55) | variant 4: sp_01 20 (u 62, joint 157) gated by `0x1053d8c(e, 1, x)` (part table e+0xcb50: the snow armour) and `0x9d36c(e, 1)` -- OPEN: which actions, the gate's state unread | uEm083_00 | R (the maker) / OPEN | dev/em083-shells-spec.md 5 |",
]
s = s[:j] + nl.join(rows) + nl + s[j:]
old = "`noEm` (0x5cdf8 answers no enemy)."
assert s.count(old) == 1
s = s.replace(old, old[:-1] + ", `precall` (the owner's calls before the steps), `noTurn` (0x783fc answered: the viewer's facing is its input), `rng0` (0x3f76d8 answered 0).")
open(p, 'w', encoding='utf8', newline='').write(s)
print('ok')

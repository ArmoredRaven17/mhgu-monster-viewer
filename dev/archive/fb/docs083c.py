import re
def edit(p, pairs, crlf_ok=True):
    s = open(p, encoding='utf8', newline='').read()
    NL = '\r\n' if '\r\n' in s else '\n'
    for a, b in pairs:
        a2, b2 = a.replace('\n', NL), b.replace('\n', NL)
        assert s.count(a2) == 1, (p, a[:80])
        s = s.replace(a2, b2)
    open(p, 'w', encoding='utf8', newline='').write(s)
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer' + '\\'
edit(V + r'docs\render\shells.js', [
 ("Folders by the ids' order (INFERRED, as every monster's: no path table read).",
  "Folders READ: the shell table 0x175c3e8's res (0x48b79c -> 0x152530) through 0x159daa0's path hashes (scratchpad shellres.py) --\n// the ids' order, 0x165..0x16b = 00, 00_02, 00_03, 01, 02, 13, 13_02.")])
edit(V + r'dev\rom-map.md', [
 ("pieces `0x1062530`); folders by id order INFERRED |", "pieces `0x1062530`); folders READ by the path table (row below) |"),
 ("| `0x1051ebc(e, r1, r2, r3)` / table `0x1051944` |",
  "| `0x48b784..0x48b7b0` (the shell maker's resource) | THE SHELL PATH TABLE: `0x175c3e8` + 12 x id = {cls DTI, setup DTI, res}; `ldr [r0, #8]` (0x48b79c) -> `0x152530(rm, res, dti)` -> `0x159daa0[res]` = {~crc32(lowercase path), type}. em083: 0x161..0x16b = res 0x8aae..0x8ab8 = em083_00_shell00 / 00_02 / 01 / 13, em083_04_shell00 / 00_02 / 00_03 / 01 / 02 / 13 / 13_02 | shared | R | scratchpad `shellres.py <arc..> --ids=lo-hi` |\n"
  "| uEm083_00 vt+0x1ac `0x105ee88` / vt+0x1b4 `0x105f1a8` | per the owner's motion (u16 +0x4b4 - 0x206, table: L2 M6 / M25 / M26 / M33 / M56 / M57, L3 M12) at frames (0xb09b0) -> vt+0x1b4(e, kind, 0xff / 0x8c): motion 0x221 (L2 M33) sp_01 15, else kind 0 / 1 / 2 -> sp_01 14 / 13 / 12 -- hit volumes (ef 999), not built | uEm083_00 | R | dev/em083-shells-spec.md 5 |\n"
  "| `0x1053d8c(e, part, dmg)` | the snow-armour hit: slot [0x16a2590][part-1] of e+0xcb50 (part 1 -> slot 5, the trunk); 0 / 4 -> 0; variant 4 at 1 -> breaks; else dmg x [0xba9f0(e,2)+0xc] (>= 1) off P+0x3c0 + 12 part, <= 0 breaks: e+0xcb7c = 0, +0x3bd++, vt+0x410(e, part), returns 1 | uEm083_00 | R + E | shells.js make083row armour083 |\n"
  "| `0x1051ebc(e, r1, r2, r3)` / table `0x1051944` |"),
 ("| `0x1060e28(e, tune int)` (callers `0x1058208` / `0x1058428` / `0x1059184`, tune floats 0x53..0x55) | variant 4: sp_01 20 (u 62, joint 157) gated by `0x1053d8c(e, 1, x)` (part table e+0xcb50: the snow armour) and `0x9d36c(e, 1)` -- OPEN: which actions, the gate's state unread | uEm083_00 | R (the maker) / OPEN | dev/em083-shells-spec.md 5 |",
  "| `0x1060e28(e, tune int)` (callers `0x1058208` / `0x1058428` / `0x1059184`, tune floats 0x53..0x55) | variant 4: sp_01 20 (u 62, joint 157) when `0x1053d8c(e, 1, dmg)` breaks the trunk snow and `0x9d36c(e, 1)` is 0: (7, 0x10 / 0x35) L2 M16 f158 and (7, 0x11 / 0x36) f165 (dmg 999), (7, 0x42) L2 M19 f85 (dmg 0); the gate from the trunk row shown (input.trunkSnow083) | uEm083_00 | R + E | shells.js armour083; motion-states.js trunkSnow083 |"),
])
sp = V + r'dev\em083-shells-spec.md'
s = open(sp, encoding='utf8').read()
i = s.index('### 5. OPEN, by name')
s = s[:i] + """### 5. Closed 2026-10-18 (were open)

- THE TRUNK SNOW's sp_01 20 (u 62 on joint 157): `0x1060e28(e, tune int)` is called from the actions at `0x1057fc8` ((7, 0x10 /
  0x35), L2 M16 phase 1, f158 = tune float 0x53, dmg tune int 0x22 = 999), `0x1058328` ((7, 0x11 / 0x36), L2 M16, f165, dmg 999)
  and `0x10590d4` ((7, 0x42), L2 M19, f85, dmg int 0x24 = 0) -- found by the census with the gate held open (scratchpad
  `fb/cen_armour.py`). The gate `0x1053d8c(e, 1, dmg)` is the trunk snow's hit (slot 5, e+0xcb64): 0 / 4 never; 1 breaks at any
  damage on variant 4; 2 / 3 when dmg x the rate takes part 1's durability (P+0x3cc) to 0 -- and `0x9d36c(e, 1)` (part 1's break
  level) must be 0. The viewer drives it from the trunk row shown (motion-states.js `trunkSnow083`, index.html shellExtra
  `trunkSnow083`); the durability is not an input (999 taken to break 2 / 3: INFERRED). ROM-run per slot (e01_10_s0 / s2 / s4,
  e01_11_s3, e01_42_s1 / s2).
- `0x105f1a8` is the class's vt+0x1b4, called only by its vt+0x1ac `0x105ee88`: per the owner's motion (L2 M6 / M25 / M26 / M33 /
  M56 / M57, L3 M12) at frames, kind 0 / 1 / 2 -> sp_01 14 / 13 / 12, and L2 M33 (0x221) sp_01 15 -- hit volumes with no effect,
  left unbuilt.
- THE FOLDERS are READ: the shell table `0x175c3e8` row's res (`0x48b79c` -> `0x152530`) names the file through `0x159daa0`'s
  ~crc32 path hashes; 0x161..0x16b = em083_00_shell00 / 00_02 / 01 / 13, em083_04_shell00 / 00_02 / 00_03 / 01 / 02 / 13 / 13_02
  (scratchpad `shellres.py`) -- the order taken before, now read.
"""
open(sp, 'w', encoding='utf8').write(s)
print('ok')

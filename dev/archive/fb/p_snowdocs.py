D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
# amphibian spec
p = D + r'\amphibian-shells-spec.md'
s = open(p, encoding='utf8').read()
a = """quest map, and the base ctor's 0xff is no snow map: the plain modes play. The snow modes are NAMED, not shown (their records u 21 / 23 /
25, 31 / 33, 41 / 43 not exported)."""
b = """quest map, and the base ctor's 0xff is no snow map: the raw lists play the plain modes. **SNOW VARIANTS (Raven, 2026-10-18)**: a list
of its own ("Snow Variants", index.html; render/shells.js SNOW_VARIANTS: L4 M1 / M2 / M30) plays the same clips with the map on
(input.snow): the rocks from 0x16a0820, the slab 0 / 1; records u 21 / 23 / 25 / 31 / 33 / 41 / 43 exported (em066_00 / em066_04).
Checks: shells-tetsucabra / -drilltusk-check.mjs snow cases (the ROM's own run with e+0x1053 = 3 / 14 / 20) + controls (the map
off fails), 35/35 each; pages 25/25 (the list, the snow rocks, the snow slab)."""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
# elder spec section 4
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
a = """- **Not shown (named)**: the snow maps' modes (no map in the viewer; the base ctor's 0xff is none -- as Tetsucabra's); the owner's
  action the tornadoes test is the one the playing row names (a clip without a row of his is no action)."""
b = """- **THE SNOW VARIANTS LIST (Raven, 2026-10-18: "Add Snow variations of the same clips, add them under a Snow Variants list")**: the
  raw lists play the plain modes (no map in the viewer; the base ctor's 0xff is none); the "Snow Variants" list (index.html, entries
  routed to the clip underneath; render/shells.js SNOW_VARIANTS: L2 M7 / M8 / M9 / M21 / M22 / M27) plays the same clips with the
  map on: input.snow -> spawn024's `snow` modes when the play is enraged (ctl+0x2c); beamState.snow -> beam-spawns `when.snow`
  (mode 1; the old 'snow maps' Clip copies moved here); the PSL word's snowMap (psl-mask.js em024: bits 18-20 when enraged); the
  class timers' context carries snowMap (the barrier's 1004 / 1005 -> u 210 / 220 on the snow maps is the effects lane's
  CLASS_TIMERS row). Records u 71 / 72 / 121 / 131 / 151 / 161 exported. Check: 12 snow cases on the ROM's own runs (ctl+0x2c =
  ctl+0x2d = 1) + 2 controls (the map off, calm), 47/47; page 23/23 (the list, the snow wind ball, the mode-1 beam, the raw clip's
  plain one).
- **Not shown (named)**: the owner's action the tornadoes test is the one the playing row names (a clip without a row of his is no
  action)."""
assert s.count(a) == 1
s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
# rom-map: Lao's section tests and the actiontune vecs
p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| `0x17a50f4` |"
i = s.index(a); j = s.index('\n', i)
rows = """| em012_00_cmdtbl.emc op 01 `(05, 08, n)` (`01 00 05 08 03` .. `01 01 05 08 12`) | the sections that pick Lao's rubble entries (op 0xa3 inside each) -- his progress along the fortress: the entries' landing points sit in seven clusters along his walk, (6500, 7400) .. (-5200, -12700). Op 1 runs `0x83cf8` -> `0x86210(ctx, args, mode)`; **the variable (05, 08) names is NOT READ** | uEm012_00 | I (meaning) | elder spec 2 (the viewer's anchor: each entry's landing centre onto his unit, a stand-in) |
| `0xd775e0` / `0xd76ef0` / `0xd79cd0` (Lao actiontune vecs) | vecs 1 / 2 and 3 / 4: two region boxes (min, min + size) a hunter's +0x40 is tested in; vec 10 (0, 0, -2000) / vec 12 (200, 0, -2000): his placement P+0x40 (12 with the Y word 0x8000) in two arms; vec 164 (13530, 0, 15075) the target point in area 1 (`0xd7a2c4`) -- none is an origin for the rubble | uEm012_00 | R | elder spec 2 |
"""
s = s[:j + 1] + rows + s[j + 1:]
a = "| `0xdf8610` / `0xdf88f0` / `0xdf96a8` / `0xdf2670` |"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + "| Kushala / Tetsucabra snow modes in the viewer (2026-10-18) | the Snow Variants list (index.html, routed entries; shells.js SNOW_VARIANTS) hands input.snow / beamState.snow / snowMap; the raw lists stay map-less | -- | -- | elder spec 4; amphibian spec 1 |\n" + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)
print('ok')

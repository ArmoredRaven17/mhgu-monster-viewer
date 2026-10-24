p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8').read()
sec = """### Elder Dragons -- the shells: Kirin, Lao-Shan Lung (shells agent, 2026-10-18; dev/elder-dragon-shells-spec.md)

| Address / range | What it is | Class / monster | Status | Detail |
|---|---|---|---|---|
| `0xd74704` / `0xd74a00` | sp_01 0x7e / sp_11 0x7f readers (ef 0, hit 0, +0x15ec 4 / 8 / 1 by ints 0..2, floats the snap reach, vec 0 -> +0x1608 / the time table, +0x165c int 2, +0x168c int 1) | uEm011_00 (Kirin) | R + E | elder spec 1; shells.js params011s01 / params011s11 |
| `0xd74bf4` (sp_11 +0x168) | the strike point: +0x1670 + vec k by the kept Y word; masks 0x030f0000 re-anchor / 0x3000 the target / 0xc0000000 target + 20 snapped (mask 0x10); bolt mode by +0x168c | uEm011_00 | R + E | elder spec 1; shells.js create011s11 |
| `0x403018..0x403064` | base11 init: +0x165c == 0 -> each time / the owner's motion speed 0xb0900 | uShellEmBase11 | R + E | elder spec 1; shells.js make001 |
| `0xd759f4` (vt+0x2a8) | **Lao's per-frame event lists**: two record lists from e+0xcae0 (counters e+0xcae4 / +0xcaec += speed x dt); record 0x24 = {action, motion, test 1..12 (table 0xd75bac), f0, f1, args}; actions (table 0xd75dbc) 1 hit 0x7db70, 2 rate 0xb07b4, 3 flag, 4 sound, 5 sp_01 0x80, 6 sp_13 0x81 | uEm012_00 (Lao-Shan Lung) | R + E | elder spec 2; shells.js spawn012 |
| `0x17a50f4` | the event table, 58 x {list A, list B} (count e+0xcad4 = 0x3a, base e+0xcad8, 0xd78684); shell entries 25..57 (+ 1 / 3 / 22 / 39..42 named by nothing) | uEm012_00 | R | elder spec 2; <scratchpad>/fb/evt012.py |
| `0xd76d3c..0xd76da4` (vt+0x204) | e+0xcae0 = 0, then = table + 8 x e+0xcadc when != 0xff and < count; e+0xcadc back to 0xff (guard e+0x73e4 == 0) | uEm012_00 | R | elder spec 2 |
| `0xd77a8c` (vt+0x218) | sel 0 -> e+0xcadc = b2 (EMC op 0xa3 (0, idx)); sel 1 / 2 -> e+0xcb28 / +0xcb29 = 1 | uEm012_00 | R | elder spec 2; the op-0xa3 picks fb/emcidx.py |
| `0xd7cd50` | sp_01 0x80 reader: ef 0 +0x15c8, hit 0 +0x15d8, +0x15ec 0x80 int 0 / 4 int 1, floats -> +0x15f4 / +0x15f8 | uEm012_00 | R + E | elder spec 2 |
| `0xd7cf9c` / `0xd7d2bc` / `0xd7d3c0` / `0xd7d450` / `0xd7d4bc` | sp_13 0x81: init (setup 0x70: start +0x40, end +0x50, delay +0x60; launch to the end; delay > 0 -> state 1 and handle +0x1c1 = 0) / reader (floats speed, per unit, gravity, life; int 0 the marker +0x15e8) / +0x15c the delay -> state 2, +0x1c1 = 1 / landing ef by type / +0x168 the end | uEm012_00 | R + E | elder spec 2; shells.js make012s13 / delay012s13 |
| `0x43370` / `0x327214` | the core's +0x1c1 -> +0x18c (when +0x18c != 0) -> its units' +0xc bit 11 | effect core | R (the hiding INFERRED) | elder spec 2 |

"""
a = "### Flying / Brute / Bird Wyverns -- the re-walk to today's standard (Fanged-Wyvern effects agent, 2026-10-18)"
assert s.count(a) == 1
s = s.replace(a, sec + a)
b = "| `carapaceon-shells-spec.md` |"
i = s.index(b); j = s.index('\n', i)
s = s[:j + 1] + "| `elder-dragon-shells-spec.md` | Elder Dragons' shells (shells agent): Kirin's lightning (sp_11 strike timer + sp_01 bolts), Lao-Shan Lung's event-list rubble (sp_13, delayed, absolute fortress points) and hit volumes (sp_01); 1a the Clip menu's copy deciding the shell picks | 2026-10-18 | 8 KB |\n" + s[j + 1:]
t = "99. **A transcription can hide a stand-in in its code (2026-10-18)."
i = s.index(t); j = s.index('\n', i)
s = s[:j + 1] + ("101. **A class's shells can live outside every action body (2026-10-18).** cengen11 over Lao-Shan Lung's 16 statuses finds no create: his "
                 "shells are records of a per-frame list (vt+0x2a8 0xd759f4) the action start selects from an index the EMC's op 0xa3 sets. An empty census "
                 "means: grep the class's vt+0x2a8 / +0x1dc and its table walkers before calling it shell-less.\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)
print('ok')

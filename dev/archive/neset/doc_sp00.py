# doc_sp00.py: sp_00 built (rom-map rows, the walker trap, the batch meter addendum, the spec's 3D, the board)
import os
BS = bytes([92])
NL = b'\r\n'
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
b = open(P, 'rb').read()
i = b.find(b"| Neset's sp_00 (0x176): event type 14 `0x10aba68`"); assert i >= 0
j = b.find(NL, i)
rows = [
 b"| Neset's sp_00 BUILT (shells agent 2026-10-20) + his object controllers (READ) | sp_00 = base00 with his init `0x10c20bc` (+0x15f0 = "
 b"setup +0x30, the Y degrees; +0x15dc = setup +0x34, the joint; then base00's `0x3f8b80`) and reader `0x10c20d8` (ef 0, hit 0, float 0 "
 b"vz, float 1 the flight, &vec 0; flags 0); +0x168 `0x10c215c` bx lr; files em087_00_00 modes 0..2 (vz 60, flight 60 / 300 / 180, "
 b"u 90), hitdata (0, 99). THE CONTROLLERS e+0xcd10[0..5] (0x1217990 ctor; bound by `0x12179fc` at `0x10a2f78`: +0 him, +4 kind "
 b"0x16a2fb4[i] = 0..5, +0xc layer 0x16a2fcc[i] = 2..7): `0x1217a30(c, m)` +0x10 = m, the clock 0; `0x1217a58` (vt+0x1dc, every "
 b"update) +0x1c = +0x18, +0x18 += his dt, then `0x1217ac8` (m 0: clock 0; m 1..3: `0x1217bb4(c, m - 1)` -- layer +0xc's motions "
 b"0x20a / 0x20b / 0x20c + 3 (kind - 1) through vt+0x78 at rates 1.7 / 0.6 / 1.2, the layer's end `0x94dc04`, a 9 / 12 hold, an "
 b"effect / sound by 0x70f40 on the end motion, then `0x1217b78`: m 0); reset all six at every action start (vt+0x204 `0x10a6f3c`). "
 b"The module: the clock = clip frames since the type-8 row, the sequence's own end not modelled (INFERRED long enough: about 170+ / "
 b"100+ frames against the rows' 144 / 90) | uEm087_00 / uShellEm087_sp_00 | R + E (sp_00: 8 rows, 299 / 59 moves equal) / I (the "
 b"controllers' end, the clock-walker order) | shells.js make087s00 / objects087; dev/shells-neset-sp00-check.mjs 13/13, page 3/3 |",
 b"| the walker `0x6c590`'s class kinds (READ 2026-10-20, shells agent) | kind > 0xd -> `vt+0x47c(e, list, row, row ptr)` at `0x6c6f8` "
 b"WITHOUT the row's motion test (`0xb0950` is only on the kinds 1..13 arms): a class kind fires on whatever motion he plays. Neset's "
 b"(7, 0xa) rows name L0 M1 but fire inside L2 M36, on the object's clock | shared | R | trap 128 |",
]
b = b[:j] + NL + NL.join(rows) + b[j:]
# the batch meter addendum
i = b.find(b"| THE SHELLS BATCH'S DRAWS (shells agent, 2026-10-20;"); assert i >= 0
j = b.find(NL, i)
add = (b"| -- the batch's draws, addendum (shells agent, 2026-10-20, later) | **Tigrex u 1 / 31 and Grimclaw u 1 / 31 / 81 / 91 / 101 / 111 DRAW on "
       b"the effects agent's Ground G (`g2deep`, floor flag 2: selector 2)** -- all 8 (Tigrex u 31 off the meter's camera, lit when aimed, as "
       b"his u 30); **Gravios u 131 DRAWS with his head broken** (Parts row 2,3 Broken: 74 / 78 lit). Now 117 of 134 draw; Gypceros u 3 "
       b"(rank <= 4: the page has no rank input -- SHELL_QUEST_RANK is a constant) listed; 13 wall / hunter contacts; Crystalbeard u 33 "
       b"(never read by the ROM); Grimclaw u 76 / 78 (no generator) | batch | R (measured) | " + b'<scratchpad>' + BS + b'fb' + BS + b"shellmeter.mjs (SM_CUSTOM) |")
b = b[:j] + NL + add + b[j:]
# trap 128
i = b.find(b"127. **A ROM check that hands the hit slots"); assert i >= 0
j = b.find(NL, i)
b = b[:j] + NL + (b"128. **A class event kind fires on any motion (2026-10-20).** The walker 0x6c590 tests the row's motion (0xb0950) only on kinds 1..13. "
    b"Kinds above 13 go to the class's vt+0x47c with no motion test. A row's motion field then says nothing about when it fires: Neset's "
    b"(7, 0xa) type-14 rows are filed under L0 M1, yet they fire 144 frames into L2 M36, on his object's clock. Reading the row dump's motion "
    b"column as the clip to attach such a row to would have put the shots on the wrong clip.") + b[j:]
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P)
# the spec
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\ahtal-neset-shells-spec.md'
b = open(P, 'rb').read()
o = b"| sp_00 | 0x176 | own (setup 0x40, 0x49ff98) | event type 14 | NO -- the arm and its gate are READ (\xc2\xa73D): the gate tests his OBJECTS' motion and frame, which the viewer does not have; the stand-in is asked |"
assert b.count(o) == 1
b = b.replace(o, b"| sp_00 | 0x176 | base00 (his init 0x10c20bc, reader 0x10c20d8) | event type 14 on his object clocks | **yes, checked (2026-10-20)**: dev/shells-neset-sp00-check.mjs 13/13, page 3/3 (\xc2\xa73D) |")
o = b"## 3D. sp_00 (type 14): read, not built"
assert b.count(o) == 1
i = b.find(o); j = b.find(b"## 4. The viewer (shells.js)")
new = (b"## 3D. sp_00 (type 14) and his object clocks: built (shells agent, 2026-10-20)" + NL + NL +
 b"- **sp_00** is base00 with his own init `0x10c20bc` and reader `0x10c20d8`, both READ whole. The init sets the Y degrees (setup +0x30," + NL +
 b"  the row's raw a2) and the joint (setup +0x34, a1). The reader gives vz float 0, flight float 1, vec 0 and ef 0 (u 90). It is a" + NL +
 b"  straight shot from the joint along his facing plus the degrees. The ROM check (shells-neset-sp00-check.mjs) flies each of the 8" + NL +
 b"  rows his table holds and matches the ROM move by move." + NL +
 b"- **The gate** (kind 14, vt+0x47c `0x10ab32c`) tests his object controller e+0xcd10[row +0x14]: its motion (+0x10 == row +0x18) and" + NL +
 b"  its clock crossing f0. The walker does NOT test his own motion for kinds above 13 (rom-map trap 128)." + NL +
 b"- **The controllers** are six. Each drives one of his motion layers (2..7): `0x12179fc` binds them to him at his init. All six are" + NL +
 b"  reset at every action start. Type 8 sets a controller's motion (2 or 3) and zeroes its clock (rows kind 5, on the action clock)." + NL +
 b"  The clock then counts his frames. The shots therefore come at the type-8 frame plus f0:" + NL +
 b"  - (7, 7) L2 M28 and (7, 0xa) L2 M36: 144 (mode 1, joints 41 / 51)." + NL +
 b"  - (1, 0) L0 M1, the selectors 39 / 40 / 41 / 50..53: s39 at 164; s40 / s50..53 at 110 (mode 0, joints 41 / 51); s41 at 100 (joints" + NL +
 b"    42 / 52, +10 / -10 deg) and at 190 (40 / 50, -10 / +10)." + NL +
 b"  - s33 / s34 are the quiet idles, offered first." + NL +
 b"- **Stand-ins, named:** the clock is the clip frames since the set. Each controller's own sequence (its layer's start, hold and end" + NL +
 b"  motions) ending it early is not modelled. By the clip lengths it runs past the rows' 144 / 90, but the vt+0x78 rate argument is not" + NL +
 b"  read, so this is INFERRED. The objects' state e+0xccf8 is taken as 0." + NL +
 b"- **Draws (the meter):** u 90 draws (18 starts over L2 M28, L2 M36 and the L0 M1 picks)." + NL + NL)
b = b[:i] + new + b[j:]
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P)
# the board
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
o = b"      - [ ] Ahtal-Neset's rockets (sp_59): the gate is read"
i = b.find(o); assert i >= 0
j = b.find(b"      - [x] 2026-10-19 -- SHAGARU'S SCATTER", i); assert j > i
new = (b"      - [x] 2026-10-20 -- AHTAL-NESET's ROCKETS and HIS ARM SHOTS are in. The rockets are supply drops: they fall onto his arena points," + NL +
       b"        land, wobble and stay. A new Rockets setting (Off / Rockets A / Rockets B; working labels) fires one side's three at the next action" + NL +
       b"        start, then holds the game's 90 s cooldown; Off makes them fade. The points are anchored on him. His arm shots (sp_00) come from" + NL +
       b"        joints 40..42 / 50..52 on L2 M28 and L2 M36 (at 144), and on some of his idles (L0 M1: at 100 / 110 / 164 / 190). Both are checked" + NL +
       b"        against the game and draw. Not shown: the rocket's fade-out, and the pickup it leaves." + NL)
b = b[:i] + new + b[j:]
o = b"      - [x] 2026-10-20 -- SHELL EFFECTS for Gravios"
i = b.find(o); j = b.find(NL, b.find(b"also found two shells that vanished", i))
b = b[:j] + NL + (b"        Later the same day: Tigrex's and Grimclaw's fourth-ground shots draw on Ground G, and Gravios's broken-head beam draws -- 117 of 134." + NL +
                  b"        Gypceros's low-rank puddle waits on a quest-rank setting (asked).") + b[j:]
open(P + '.tmp', 'wb').write(b); os.replace(P + '.tmp', P)
print('ok')

# map_ground.py: rom-map rows for the Ground control (2026-10-20), patched in place
import io
P = r'C:/MHGU-Extract/MHGU-Monster-Viewer/dev/rom-map.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n'
anchor = nl + '## 1b. The decode notes'
assert t.count(anchor) == 1
rows = [
'',
'### The ground under the unit -- the Ground control, the floor-type rows, the burrowers\' floor (effects lane, 2026-10-20; dev/effect-runtime-engine.md E17)',
'',
'| address / thing | what | owner | status | detail |',
'|---|---|---|---|---|',
'| THE GROUND CONTROL (Raven approved 2026-10-19: "Yes") -- built | index.html `GROUND_TYPES` (the Ground select under the class toggles; `window.__ground.set(key)`): **plain** 0 / **Ground A** flags 0x1040 / **B** 0x8 / **C** 0x800000 / **D** 0x800 / **E** attribute 2 / **F** 0x40 -- the classes `0x41c74` (MASK2 9 / 0x21 / 0x41 / 0x81 / 0x101 / 3) and Tigrex\'s ctl+0x29 (0x40 -> 3) tell apart. Flag 6 LEFT OUT: its `0x41c74` arm `0x41c88` is unrecorded (every effect would refuse) -- so Tigrex\'s selector 2 stays unreachable. Labels are WORKING (by the bits), for Raven. Drives: every live runtime\'s parents +0x1068 / +0x1066 (host.js setFloor, effect-mounts setEffectFloor), the 0x18154c stand-in\'s hit block +6 / +8 (bridge.js), the shells\' `input.floorFlags` / `floorAttr` (both builders), the PSL word\'s `floorFlag8` (Nerscylla) | viewer | built (consumers R) | E17; index.html GROUND_TYPES |',
'| -- which floor each class is (water, sand, snow, lava ...) | NOT READ: the polygon attribute tables the stage collision carries were not opened; the labels say the bits only | stage | NR | -- |',
'| THE FLOOR-ROW SCAN (`<scratchpad>/floorscan.mjs` / `floorscan2.mjs`, every monster, every runtime) | each record\'s MASK1-selected rows tested against the six MASK2 classes: **5,814 clips carry a record whose rows differ by ground** (most 5 or 6 versions: the footstep / impact dust cm202_001 / _002 / _020, rows w04 0x22 / 0x2 / 0x54 / 0x4 / 0x8 / 0x100 / 0x80); **138 records build nothing on a plain floor** -- c 1500 (cm200_041) on nearly every monster, cm200_067 (Tigrex / Grimclaw c 25, Kecha Wacha c 210..240), cm202_200, Barroth c 130, em060_04 u 120 and a few class records | data | R (rows read live) | `<scratchpad>/fl0.out`, `fl1.out` |',
'| -- measured (draw meter, `<scratchpad>/meter1g.mjs`, M1_GROUND) | **Tigrex c 25** (L0 M76): plain -- live, no draw; **Ground B -- DRAWS** (lit 49 / 51); A / C / D / E / F -- no draw: as its rows (w04 0x20) say. **Tigrex c 0 dust** (cm202_020, L0 M9) draws on every type with a different row set (models 407 / 512 / 233 / 511 / 410 / 407, px 7103 / 9269 / 6991 / 8458 / 4235 / 8871). No refusal on any type | viewer | measured | this row |',
'| -- Tigrex ctl+0x29 on the control (the shells agent, dev/shells-tigrex-check.mjs, page) | L2 M5 shell00 modes: plain / B 0 / 1 / 2, E 3 / 4 / 5, F 9 / 10 / 11, A (0x1040 carries 0x40) 9 / 10 / 11; selector 2 (flag & 6) unreachable until a flag-6 type exists -- its records (Tigrex u 1 / 31, Grimclaw u 1 / 31 / 81 / 91 / 101 / 111) are exported | uEm032_00 shells | measured | shells.js |',
'| -- the Special-list entries per ground variant (Raven: "create each variation in the Special list") | NOT BUILT: at 5,814 clips that is ~20,000 entries; scope put to the coordinator (a: the floor-only records\' clips; b: a sample; c: all; d: the control alone) | viewer | open (scope question) | -- |',
]
t = t.replace(anchor, nl.join(rows) + nl + anchor)
# the earlier "not built" row
a = 'In the game they build on such floors. A ground-type control would be Raven\'s call -- listed, not built |'
assert t.count(a) == 1
t = t.replace(a, 'In the game they build on such floors. A ground-type control would be Raven\'s call -- listed, not built [**BUILT 2026-10-20**: the Ground control, section "The ground under the unit"; Tigrex c 25 draws on Ground B] |')
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok')

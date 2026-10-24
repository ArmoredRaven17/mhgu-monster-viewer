# air/patch_low.py -- the Rath line's LOW hover (posture 3) and descents: dev/air-height.md section 5 and rom-map rows +
# trap 68. Re-reads both files at run time (other agents edit rom-map).
import io, sys
NOTE = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\air-height.md'
MAP = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'

SEC = r'''
## 5. The Rath line's LOW hover -- posture 3 (follow-up 2026-10-17: Dreadking's flight dust never spawned at H = 985.5)

The standard H is right for L1 M1 after a takeoff and WRONG for the hover the game mostly shows: the Rath line's L1 M2 /
M11 / M12 hover idles and turns, L1 M4, L2 M11 and L4 M25 / M26 / M27 are played in **posture 3**, where `0xbf284` pins
`P+0x44` to the ground every frame (H = 0 for the shells' 900 tests: the dust always spawns) and the BODY is drawn
`e+0x1384` above it. Rathian em001_00, Rathalos em002_00, Dreadqueen em001_04, Dreadking em002_04 run one class
(uEm001_00); FlyOfs 500 on all four (.dtb +0x22); sizeBase (dtb+0x64) 1.0 / 1.0 / 1.2 / 1.2.

### 5.1 The drawn offset -- R
`e+0x1384` = (posture 3 ? `P+0x1cc` x S : 0) + `P+0x5c` x m, rebuilt every frame: `0xa50dc` zeroes `e+0x1380..88`, then
`0xa5db8` (`0xae0d8`; skipped while `0xc210c` -- `P+0x5c2f` in 1..5) adds `0xbf76c` (posture 3) and `P+0x5c x 0xbec34(e)`
(`0xa5e80..0xa5ea0`); `0xa807c` draws the unit at `P+0x40.. + e+0x1380..`. S = `P+0x1ac x P+0x1b0` = sizeBase x spawn size
(rom-map `0xbe518` row), m = `0xbec34` = S / dtb+0x64 = the spawn size. `P+0x1cc` = FlyOfs, written by the setter's
posture-3 arm `0xbf74c` (`0xbc8f0`) on a CHANGE to 3 (same-posture calls return at `0xbc8ac`). `P+0x5c` is class-driven
while `P+0x1b9` = 1 (`0xbf700` sets, `0xbf71c` adds `s0 x dt`; both raise `P+0x1b9`), else it decays to 0 (x0.9 / frame
above 100, then 5 / frame, `0xa5e18..0xa5e7c`). **So the low-hover body sits at 500 S + m P+0x5c above the ground, and
the unit on it.**

### 5.2 The actions (ROM-run, `emu_takeoff.py` with the frame tests, the setter, `0xa5db8` and the .bss constants live)

| action | handler | clips (posture) | unit H / drawn D above the ground (S = m = 1) |
|---|---|---|---|
| (0,6) hover idle | `0xcf2ba0` | **L1 M2** (3) | H 0; D = 500 S + m P+0x5c, P+0x5c stepped 2.5 / frame toward the slope target `-75 + (ctl+0x68 + 75)(1 - max(n.up, 0.866)) / 0.134` (`0xcf2be0..0xcf2d9c`): **-75 on flat ground -> D 425** |
| (4,4) / (4,0x15) hover turns | `0xcfad9c` | **L1 M2 / M11 / M12** (3) | the same: D -> 425 (flat) |
| (4,5) / (4,0xc) / (4,0xd) | `0xcfb160` / `0xcfbb98` | **L1 M2** (3) | the same |
| (4,3) / (4,0x19) the DESCENT | `0xcfab98` | **L1 M1** (1) -> **L1 M4** (3) | `P+0x92c = 1` (floor ground + 500 S); `0x7cb4c` vy -5 (faster from above ground + 1000); `0x7cca4` each frame: **H(f) = max(500 S, H0 - 5 f)** (985.5 -> 500 at f 97); at `0xbf52c(FlyOfs)` (reach) and (4,0x19) at once / (4,3) at the next crossing of L1 M1 f2: posture 3, **L1 M4: D = 500 S - m min(75, 2.5 (f + 1))** (flat) |
| (7,0x24) `0xcfd898(e,1)`, (7,0x78) / (7,0x79) `0xd02a74(e,2/3)` | | **L4 M26** (3) -> **L4 M25** (3); L4 M27 (3) on the other arm (`0xcfdc44`) | H 0; L4 M26: `P+0x5c += -3.333 x speed x dt` to -200 (`0xcfd94c..0xcfd984`): **D = 500 S - m min(200, P5c0 + 3.333 f)** (from P+0x5c 0: 500 -> 300 at f 60); **L4 M25: D = 500 S - 200 m**; **L4 M27: P+0x5c = -200 (40 - t) / 40, t = `P+0x1bc` from 0 at its start, +dt a frame (`0xcfdbbc..0xcfdc80`): D = 500 S - 200 m max(0, 1 - (f + 1) / 40)** |
| (7,0x2d) `0xcff66c(e,1,3)` (also (7,0x1c) / (7,0x1d) / (7,0x39), other args) | | **L2 M12** (1) -> **L2 M10** (1) -> **L2 M11** (3) -> L4 M25 / M27 | L2 M12: vy -1, forward 25, steered by `0x7a820` (aim-dependent), floored by `0x7d8d8` -> `0xbf038(FlyOfs - 200)`: **H falls to 300 S** (emulated: 985.5 -> 300 by f 46, aim at the origin); **L2 M10: H 300 S**; L2 M11: posture 3, `P+0x5c = -200` (`0xcff7f8`): **D = 500 S - 200 m** (= 300 when S = m) |

Exits: (7,0x24) on the landing arm sets posture 0 and L4 M37 / L4 M35 (on the ground). Posture 3 -> 1 through
`0xbc984` lifts the unit by FlyOfs x S onto the drawn height (continuous when P+0x5c = 0); through `0xbca24` the unit
takes the joint's height.

### 5.3 The dust
Every shell / dust test on these clips reads `P+0x44 - P+0x5b4` = 0: Rathian's hover dust c 30 (`0xd09e28`, L1 M2 / M11 /
M12) and the flight dust c 31 (shell01 mode 15 via `0xcf2424` on L4 M25 / M26 / M27, base01's 900 arm) always pass. Only
**L1 M1** -- the HIGH hover, posture 1 -- is gated: no dust while above 900 (after the takeoff), dust once the (4,3)
descent brings the unit under 900 (f >= 18 from 985.5). Seregios's (0,6) L1 M2 is posture 3 as well (`0xfdb29c`); his
other low-hover clips: NR here.

### 5.4 Not read
The (4,3) / (4,0x19) choice of the next f2 crossing in the ROM's loop (the harness does not loop); `0x7cb4c`'s fast arm
above ground + 1000; L2 M12's descent under a real aim; the per-action P+0x5c start values the AI leaves (each row's P5c0);
which posture-3 action the AI picks; the variants' (em-byte) branches of `0xcff66c`.
'''

ROWS = r'''| `0xa5db8` / `0xbf76c` / `0xa5e18..0xa5ea0` | the drawn offset `e+0x1384` = (posture 3 ? `P+0x1cc` x S : 0) + `P+0x5c` x S / dtb+0x64, rebuilt each frame after `0xa50dc` zeroes it; `P+0x5c` class-driven while `P+0x1b9` (`0xbf700` set / `0xbf71c` add), else decays (x0.9 above 100, then 5 / frame); `P+0x1cc` = FlyOfs by the setter's posture-3 arm `0xbf74c` on a change to 3 | shared | R | air-height.md §5.1 |
| `0xbf52c` | the reach test: probe the floor, `return P+0x44 <= floor + size x s0` (`0xbf5c8..0xbf618`), no write | shared | R | §5.2 |
| `0xcf2ba0` (0,6) / `0xcfad9c` (4,4)(4,0x15) / `0xcfb160` (4,5) / `0xcfbb98` (4,0xc)(4,0xd) | **the Rath line's LOW hover is posture 3**: L1 M2 / M11 / M12, unit pinned (H 0), body drawn 500 S + m P+0x5c, P+0x5c 2.5 / frame toward `-75 + (ctl+0x68 + 75)(1 - max(n.up, 0.866)) / 0.134` (-75 flat): **D 425** (S = m = 1). ROM-run | uEm001_00 | R / E | §5.2 |
| `0xcfab98` (4,3) / (4,0x19) | the DESCENT: `P+0x92c = 1`, L1 M1 (posture 1) at vy -5: **H = max(500 S, H0 - 5 f)**; at the reach: posture 3, L1 M4, **D = 500 S - m min(75, 2.5 (f+1))**. ROM-run | uEm001_00 | R / E | §5.2 |
| `0xcfd898` (7,0x24) / `0xd02a74` (7,0x78)(7,0x79) | posture 3, **L4 M26** (P+0x5c -3.333 / frame to -200: D 500 S -> 500 S - 200 m), **L4 M25** (D 500 S - 200 m), **L4 M27** (P+0x5c -200 (40 - t) / 40: back to 500 S); unit H 0 throughout -> c 31's 900 test always passes. ROM-run | uEm001_00 | R / E | §5.2 |
| `0xcff66c` (7,0x2d) etc. | L2 M12 posture 1 descent floored at ground + (FlyOfs - 200) S = 300 S (`0x7d8d8` -> `0xbf038`), L2 M10 at 300 S, L2 M11 posture 3 with P+0x5c -200 (D 500 S - 200 m) -> L4 M25 / M27 | uEm001_00 | R / E | §5.2 |
'''

TRAP = "68. **A flying monster's common hover may be posture 3: unit ON the ground, body drawn above it (2026-10-17).** The Rath line's L1 M2 / M11 / M12 / M4, L2 M11 and L4 M25..M27 pin `P+0x44` to the floor (`0xbf284`) and draw the body `e+0x1384` = 500 S + m P+0x5c above it; every 900 test there sees 0. A per-list height (\"every air clip at the standard takeoff\") puts that dust 985.5 up and kills it. Read the posture of each clip's actions before giving it a height. (dev/air-height.md §5)"

n = io.open(NOTE, encoding='utf-8', newline='').read()
if '## 5. The Rath line' not in n:
    nl = '\r\n' if '\r\n' in n else '\n'
    n = n.rstrip('\r\n') + nl + SEC.replace('\n', nl)
    io.open(NOTE, 'w', encoding='utf-8', newline='').write(n)
s = io.open(MAP, encoding='utf-8', newline='').read()
if '`0xcf2ba0` (0,6)' in s:
    sys.exit('map already patched')
nl = '\r\n' if '\r\n' in s else '\n'
k = s.find('| VIEWER (not changed) | the air-list floor belongs at')
assert k > 0
e = s.find(nl, k)
add = ' [**2026-10-17: NOT for posture-3 clips** -- the Rath line\'s low hover pins the unit to the ground; rows below, trap 68]'
s = s[:e] + add + nl + ROWS.rstrip('\n').replace('\n', nl) + s[e:]
s = s.rstrip('\r\n') + nl + TRAP + nl
io.open(MAP, 'w', encoding='utf-8', newline='').write(s)
print('ok')

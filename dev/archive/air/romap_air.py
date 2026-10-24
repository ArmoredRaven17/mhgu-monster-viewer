# air/romap_air.py -- patch dev/rom-map.md in place (re-read at run time; other agents edit it): the air-height section,
# the 1c note row, two tooling rows, traps 66 / 67, and a pointer on trap 65.
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
if 'dev/air-height.md' in s:
    sys.exit('already patched')

SECTION = r'''### Air height -- how high a flying unit is above the ground, and what sets it (research agent for the Viewer agent, 2026-10-16; dev/air-height.md)

Question: on an air list, what is `P+0x44 - P+0x5b4`, and is the viewer's Grid Floor (lowest reach over the loop) the game's ground. `P` = `[e+0x1428]` = `e + 0x1440` (enemy ctor `0x6dcb0`, `r8 = r4 + 0x1440` at `0x6d830`).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x6dcb0` | the enemy ctor stores `P = e + 0x1440` at `e+0x1428`: `P+0x44` = `e+0x1484`, `P+0x5b4` = `e+0x19f4` | shared enemy | R | air-height.md (header) |
| `0xada80` order | `0xa50dc` (`0xadae8`) ... `0xa5db8` (`0xae0d8`) -> `0xa5fc8` (`0xae10c`) -> `0xa61dc` (`0xae120`) -> `0xa807c` (`0xae16c`) in the +0x24 pass | shared enemy | R (calls) / I (where the action runs) | §1.1 |
| `0x71984` / `0xc2710` / `0xc2788` | the motion advance on the uModel `e`: `e+0x40.. = e+0x1370..` (P's copy), `0x94e1a0` (root step), `e+0x1370.. = e+0x40..` (lerp by `e+0x13a8` when != 1); `0xc2788` -> `P+0x40..`. **Root motion moves the unit** | shared enemy | R | §1.2 |
| `0x95299c..0x952ae0` (in `0x951aa0`) | root step apply: `pos += R(q)(scale +0x60.. x mNullTransScale +0xed0.. x R(q)^T dT)`, dT = T - prev (`0x951f88..`, prev layer `+0xac..b4`, stored `0x9528e4`); what prev is at a NEW motion: NR | uModel | R | §1.2 |
| `0x9367f4` / `0xa5c04..0xa5c5c` / `0xad144` / `0x76100` | mNullTransScale: uModel default `0x19176c0` = (1, 1, 1) (ROM-run init); the enemy rewrites it each frame after the action main as `e+0xb7f0 x (e+0xb7e0, +0xb7e4, +0xb7e8)`; vec (1,1,1) at init, scalar 1.0 at every action change. Seregios writes only Z (`0xfea8e0`, a charge to its target; reset at f110 `0xfea944`) | shared / uEm077_00 | R | §1.2 |
| `0xbc984` (re-read) | posture -> 1: `P+0x44 += size x s0` only from postures {0, 3, 6} (mask 0x49, `0xbc9a4..0xbc9d0`); s0 = FlyOfs via `0xbf4d4` at 47 of Seregios's 48 sites (472.0 at `0xfe7040`) | shared | R | §1.4 |
| `0xbc7f4` (re-read whole) | the setter moves height only for 0 / 4 (`P+0x44 = P+0x5b4`, `0xbc8e4`) and 6 (ceiling); 3 -> `0xbf74c` (`P+0x1cc = FlyOfs`); 1 / 2 nothing | shared | R | §1.4 |
| `0xbf284` (re-read whole `..0xbf4bc`) | {0,3,4,6} pin; {1,5} ceiling clamp; then the FLOOR by `[P+0x92c]`: 1 -> ground + FlyOfs x size, 2 -> ground + `[P+0x930]` x size, else ground (postures {1,2,5,6} with `P+0x5b0 == 1`). **No hold at a flight height** | shared | R | §1.5 |
| `P+0x92c` / `P+0x930` | the floor selector: zeroed by `0x6e3a4` / `0xa51f4` / `0xba398`, set per action by classes (Seregios 1 at `0xfe31b0` `0xfe46f8` `0xfe5508` `0xfe56bc` `0xfe5b2c` `0xfe6270` `0xfe6b94` `0xfe76b4`; 2 + `P+0x930` 350.0 at `0xfe4938`). Closes the Withdrawn table's "P+0x92c writers: NOT READ" for the enemy side | shared / uEm077_00 | R | §1.5 |
| `0xc1010` / `0x2329dc` | `P+0x14` (or `+0x10` / `+0x18`) = curve(frame `e+0x500`) x `e+0x50c`: (frame, value) pairs to a negative frame, linear, 0 past the end | shared | R | §1.6 |
| `0x7d810` -> `0x7c9fc` -> `0xbf038` | the flight step: `pos += dt R(angles) v`, then the floor `P+0x44 >= ground + s0 x size` (postures {1,2,5,6}, probe hit); `0x7b53c` world `pos += dt v`; `0x7b518` v = 0; `0x7c860` (gravity arm) called only from class code (15 sites) | shared | R | §1.6 |
| `0x17e8080` / `0x17940e8` / `0x17ec628` / `0x17e99c4` | **the takeoff rise curve, byte-identical in Seregios / Rath line / Astalos / Malfestio**: (0,57) (8,51) (16,22) (24,-5) (32,-13) (48,-12) -> **+485.5** over L1 M19 (L1 M14 Malfestio), not x size | data | R (data) / E | §0, §1.6 |
| `0xfe2b7c` (3,0) / `0xfe2ce4` (3,1) | Seregios takeoff: L1 M18 (posture 0, hips end 500 up) -> `0xbc984(FlyOfs)` -> L1 M19 + the curve -> L1 M1 / vt+0x3e0. **ROM-run: 500 -> 1255 (f25) -> 985.5, held through L1 M1; size 1.2: 1085.5** | uEm077_00 | R / E | §2.1 |
| `0xcf49ec` (3,0) | Rathian takeoff, the same template (L1 M13 -> lift -> L1 M19 + curve -> L1 M1): **985.5** (ROM-run); the lift and the clips agree to the unit (hips 430 -> 430) | uEm001_00 | R / E | §2.2 |
| `0x101d348` / `0x101d494`, `0xff3ec4` | Astalos takeoffs **985.5**; Malfestio (FlyOfs **300**) L1 M13 -> L1 M14 **785.5** (ROM-run); status numbers NR | uEm081_00 / uEm079_00 | E | §2.3 |
| `.dtb` file +0x22 (-> dtb+0x98) FlyOfs | em001_00 / em002_00 / em077_00 / em081_00 / em042_00 **500**, em079_00 **300** (controls em003_00 400 / 400, em007_00 500 / -1100 as the notes) | data | R (file; the loader offset per dtbtrace) | §0 |
| `0xfe0498` (0,3) / `0xcee654` (0,3) | the hover idles: `0xbc984` (a no-op once airborne) + L1 M1; the hover keeps the height it was given. Seregios's `0xfe05b4` eases to ABSOLUTE `FlyOfs x size + 250` only on map 0xf6 (`e+0x7305` bands): map NR | uEm077_00 / uEm001_00 | R | §2.2 |
| `0xfe6f38` (3,0x50) | Seregios's ledge climb: L1 M24 -> `0xbc984(472.0)` -> L1 M25 -> **L1 M5 at +6.8 x size per frame** (`0x7b53c`) -> L1 M1 when `P+0x44 >= ctl+0x58 + FlyOfs + 200` (`ctl+0x58` = `0xa76f4` after the wall finder: I the ledge top), else curve `0x17e80b8` (+714.6), then posture 3 + L1 M4. **ROM-run, flat ground: L1 M5 f46 = 784.8** | uEm077_00 | R / E | §2.4 |
| `0xa50dc` / `0xa5db8` -> `0xbf76c` / `0xa807c` | **posture 3: the unit is pinned to the ground and the BODY is drawn `e+0x1384` above it**: `e+0x1380..88` zeroed each frame (`0xa50dc`, `0x19176b0`), `+= P+0x1cc x size` in posture 3, drawn at `P+0x40.. + e+0x1380..` (`0xa8094..0xa80d4`). `0xbca24` (0/3/4 -> 1) puts `P+0x44` at joint `r1`'s height (`0xc164c` -> `0x539e08`) and zeroes `e+0x1384`. Seregios's L1 M4 is posture 3 | shared | R | §2.6 |
| `0x3fa75c..0x3fa770` / `0x3fa8b4` | base01's 0x80 arm reads the OWNER's block: `r7 = owner + 0x1428` (writeback); the `0x3fa870` arm's `movw r7, #0x1428` is the null-owner fold. So the 900 test is the owner UNIT's `P+0x44` (not a joint) | base01 | R | §0 |
| VIEWER (not changed) | the air-list floor belongs at **clip origin - H** (H the state's: -(FlyOfs x size + 485.5) after the standard takeoff = **-985.5** for Seregios L1 M1 at size 1; never above -FlyOfs x size); the lowest-reach rule is 283 too high on L1 M1, 176 on L1 M5 f46. The shells' `ownerPos` is the gid-0 joint (live.js `unitMatrix`), the ROM's is the unit | viewer | R (ROM) / I (rule) | §0, §3 |
'''

NOTE_ROW = '| `dev/air-height.md` | Air height -- a flying unit\'s height above the ground on its air list: the posture-1 lift (FlyOfs x size), the takeoff rise curve (+485.5, shared by four classes), the engine floors, root motion carrying Y; ROM-run 985.5 (Seregios / Rath / Astalos) and 785.5 (Malfestio); posture 3 pins the unit and lifts the body | 2026-10-16 | 20 KB |'

TOOL_ROWS = [
    r'| `<scratchpad>\air\emu_takeoff.py <handler> <phase> <frames> [flyofs] [size] len=id:frames,.. deflen= stub=..` (research agent, 2026-10-16) | a class takeoff / climb handler frame by frame on the ROM: the handler, `0xbc984`, `0xbf4d4`, `0xc1010` / `0x2329dc`, `0x7d810` / `0x7c9fc` / `0xbf038`, `0x7b53c` and the engine pin `0xbf284` run natively; P = E + 0x1440; prints `P+0x44` / ground per step | Seregios (3,0) and Rathian (3,0) both 985.5 at size 1, 1085.5 at 1.2 (the lift scales, the curve does not); flyofs 300 (Malfestio) 785.5 | the probe is not run (ground fixed, hit 1); root motion not run (the clips used have reference Y 0); setMotion / motion end / vt calls stubbed (lengths from the glb); a later vt call faults (past the height) |',
    r"| `<scratchpad>\air\curves.py <lo> <hi>` / `glbroot.py <glb> [regex]` (research agent, 2026-10-16) | every `bl 0xc1010` in a band with its PC-relative curve, the field it stores, and the curve's per-frame sum; a motion glb's `reference` and joint-0 translation tracks per clip | the takeoff curve's sum 485.5 = the ROM-run rise; L1 M18 / M19 joint 0 500 -> 10 across the lift | `curves.py` finds only the `ldr / add pc` form (two Rath sites print `?`) |",
]

TRAPS = [
    "66. **A flying clip's origin is the UNIT, and the ground is not in the clip (2026-10-16).** On an air list the unit (`P+0x44`) sits at the clip origin (reference Y 0, joint 0 near 0); how high it is above the ground is STATE -- the posture-1 lift `0xbc984` (FlyOfs x size), the action's velocity curve (+485.5 on the standard takeoff), the floors `0xbf038` / `0xbf284` -- so a floor taken from the body's lowest reach, or from any one clip, is a guess. Seregios / Rath / Astalos hover at **985.5** after the standard takeoff (size 1), Malfestio 785.5; a scripted lift alone gives FlyOfs x size. (dev/air-height.md)",
    "67. **The viewer's shell `ownerPos` is the gid-0 JOINT, the ROM's is the UNIT (2026-10-16).** live.js `unitMatrix` takes the model root bone's position (the hips: 318 above a ground unit on L0 M1, -15..231 on L1 M1); base01's 900 test and the request's `+0x10` read `P+0x40..` (`0x3fa8b4`, `0xfde1e0..`). On a ground list the pin hides it below 900; on an air list it adds the hip's swing to the height test. (dev/air-height.md)",
]

# 1. section before "## 1b."
k = s.find(nl + '## 1b. The decode notes')
assert k > 0
s = s[:k] + nl + nl + SECTION.replace('\n', nl).rstrip(nl) + nl + s[k:]
# 2. note row: after the deviant-pigment row in 1c
k = s.find('| `dev/deviant-pigment-mapping.md` |')
assert k > 0
e = s.find(nl, k)
s = s[:e] + nl + NOTE_ROW + s[e:]
# 3. tooling rows: after the issued_var2 row
k = s.find(r'| `<scratchpad>\d07\issued_var2.py`')
assert k > 0
e = s.find(nl, k)
s = s[:e] + nl + nl.join(TOOL_ROWS) + s[e:]
# 4. trap 65 pointer + traps 66 / 67 at the end
k = s.find('65. **base01\'s 0x80 arm deletes a shell 900 above the ground')
assert k > 0
e = s.find(nl, k)
if e < 0: e = len(s)
s = s[:e] + ' [**2026-10-16, dev/air-height.md**: the game\'s height on those clips is the UNIT\'s (985.5 on L1 M1 after the standard takeoff -> c 30 deleted at every pulse; ~785 at L1 M5 f46 in the (3,0x50) climb -> c 32 KEPT; 0 on the posture-3 L1 M4); traps 66 / 67]' + s[e:]
s = s.rstrip(nl) + nl + nl.join(TRAPS) + nl
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('patched', len(s))

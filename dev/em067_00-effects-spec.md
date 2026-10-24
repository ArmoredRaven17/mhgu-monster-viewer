# Zamtrios (em067_00) -- effects spec (Amphibians walk, 2026-10-18)

Class `uEm067_00` (vtable `0x17dd730`). States: `states-em067_00.md` and the forms (dev/em067-forms-spec.md), transcribed before
(c 1105 and the bloated-posture clips included). Scratch: `<archive>/zg/jscheckpd.py` (MOGURI=-2400), `turns.py`, `hit082.py`.

## 1. The PSL enable word -- vt+0x13c = `0xf772ec` -- R, read whole and emulated

`0xf772ec..0xf77364` (31 instructions): `0xca170`; L0 M7 / M11 / M12 / M13 (mask 0x3880): bits 27-29 unless `0x81d6c` (sunk); L4
M31 / M32 (0x41f / 0x420): bits 15-17 iff `0x81d18` == 1 (posture 4 and not below 0.9 x MoguriBaseOfs -2400). Check: **370080
runs, 0 mismatches**; control 53456 / 82240.

## 2. The plays -- R (tracer)

L4 M31 / M32 are the sides of the swim turns: table `0x16a0abc` {L4 M33; L4 M31 / M32} for (6, 5) after `0xbc7f4(4)` +
`0xbf700(0.0)` (posture 4, P+0x5c 0: bits 15-17), table `0x16a0afc` for (6, 0xd / 0x13 / 0x28) after `0xbf62c` -> `0xbf700`
(-2400, sunk: none) -- copy B. L0 M7: the surface turns (2, 1 / 0xf..0x1c), (13, 8).

## 3. u 60 -- R

`0xf692a0` ((1, 0x43) and (7, 0xc / 0xd) all enter it; census `hit082.py`): (1, 0x43) sets L4 M20 at phase 0 and in phase 1 the
frame test `0xb0974(e, 120.0)` (`0xf695d8`) requests id 1005 -> u 60 (`em067_00_019`) at a point the class computes ahead of him
(the record's own placement shown: named). L4 M20 copy B = (1, 0x43) with a new row field `fireFrom` (motion-states.js: records
requested once as the motion passes a frame).

## 4. Implemented

psl-mask.js `em067_00` + CLIP_ACTIONS; CLIP_VARIANTS L4 M31 / M32 / M20; MOTION_STATES L4 M20#B; `--apply` +1, u 60 exported,
recorded, lifted. New check dev/checks/em067_00.mjs.
Check dev/checks/em067_00.mjs: **7 / 0**. Soak: **81 motions, 0 refused**.

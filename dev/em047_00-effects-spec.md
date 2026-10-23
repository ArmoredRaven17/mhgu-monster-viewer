# Royal Ludroth (em047_00) -- effects spec (Leviathans walk, 2026-10-17)

Class `uEm047_00` (vtable `0x17c5040`). States transcribed before (states-em047_00.md); CUT_TAIL joint 142 already corrected.

## 1. The PSL enable word -- vt+0x13c = `0xeb388c` -- R, read whole and emulated

`0xeb388c..0xeb3924`: `0xca170`; L2 M7 (0x207): `0x3a8430` (rank) > 4 ? bits 27-29 (c 183) : 24-26 (c 182); L2 M15 (0x20f):
vt+0x370(e, 1) = `0xa3bf4` (`P+0x3b4 & 1`, the tail severed) ? 18-20 : 15-17 (c 212 / c 213 -- so they stop once the tail is
cut); L2 M8 (0x208): `0x81d6c` (sunk; MoguriBaseOfs 0) ? 24-26 : 21-23. Check (`MOGURI=0 SEV=1 jscheckpd.py 17c5040 em047_00`):
**1313280 runs, 0 mismatches**; control 263168 / 263168.

## 2. Plays -- R (tracer)

L2 M8: (2, 7 / 9 / 0xd / 0x10), (12, 6) posture 0 and (6, 7 / 8) burrowed (posture 4, the dive's depth: sunk I) -- copy B. L2 M7:
(1, 0xc), (7, 8). L2 M15: (7, 0x14).

## 3. u 1400 -- R: nothing requests it (as Lagiacrus).

## 4. Implemented

psl-mask.js `em047_00` + CLIP_ACTIONS; CLIP_VARIANTS L2 M8. `--apply` +2 (c 182, c 183), recorded, lifted.

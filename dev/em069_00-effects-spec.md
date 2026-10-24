# Seltas Queen (em069_00) -- solo effects spec (Neopteron walk, 2026-10-18)

Class `uEm069_00` (vtable `0x17e0eb8`). Solo only: the duo list is dev/em069-duo-spec.md and is left alone. States:
states-em069_00.md (transcribed before). Scratch: `<archive>/zg/jscheckpd.py`, `tracec.py` (CLS=uEm069_00 EM=69).

## 1. The PSL enable word -- vt+0x13c = `0xf99960` -- R, read whole and emulated

`0xf99960..0xf99a60`: `0xca170`, then
- L4 M71..M75 (0x447..0x44b): bits 18-20 while P+0x1bb bit 0 (the Seltas link: `seltasLink`; solo, off).
- L0 M8: bits 15-16 unless sunk.
- L0 M16: action (1, 0x1c) ? bit 22 : bit 21.
- L3 M2: bits 24-26 iff the action is (10, 7), the depleted part (`0x9e8d8`) is 6 and byte e+0xcad0 != 0. `cad0`: its only writers
  in the class band zero it at reset and the action main never raises it (census) -- named, false.

`jscheckpd.py 17e0eb8 em069_00` (MOGURI -2400, TUNEI 1): **1967360 runs, 0 mismatches** (12 words); control (js em070_00): every
run mismatched.

## 2. The plays -- R (tracer)

L0 M16: (1, 0x14) bit 21 / (1, 0x1c) bit 22 -- copy B. L0 M8: the walks (2, 1 / 2 / 3 / 0x13 / 0x16 / 0x19) and (16, 3) at
posture 0; copy B (6, 2), `0xbc7f4(e, 4)` (posture 4) -> `0xbf62c` / `0xbf700` (sunk).

## 3. u 1400 -- R (corrected)

The tracer shows `U1400 r1=2` only on (6, 2) (0xf926c0 / 0xf9272c); the walks and (16, 3) set the same clip and request nothing.
The row was on every L0 M8 play; it is now on L0 M8#B only. Check: dev/checks/em069_00.mjs "L0 M8: no u 1400 on the walks (A),
held on the burrowed play (B)".

## 4. Implemented

psl-mask.js `em069_00` + CLIP_ACTIONS; CLIP_VARIANTS L0 M16 / L0 M8; MOTION_STATES L0 M8 / L0 M8#B. `--apply` +8, recorded (16
sets), lifted. Word asserts and the u 1400 copy test added to dev/checks/em069_00.mjs. Seltas (em076_00) carries no class word
of his own beyond the base (his shells: dev/em069-em076-shells-spec.md).
Check dev/checks/em069_00.mjs: **141 / 0** (the stale "13 event" count replaced by named records). Soak: **95 motions, 0 refused**. Seltas em076_00: check 8 / 0, soak 48 / 0. Ahtal-Ka em088_00 re-soaked: 59 motions, 0 refused; check 84 / 0.

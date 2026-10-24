# Gammoth (em083_00) / Elderfrost Gammoth (em083_04) -- effects spec (Fanged Beasts walk, 2026-10-17)

One class `uEm083_00` (vtable `0x17efaa8`). States: `states-em083_00.md` / `states-em083_04.md` (decode notes), already
transcribed in motion-states.js before this pass and unchanged by it. Scratch: `<archive>/zg/jscheckgen.py`, `allmot2.py`
(CLS=uEm083_00), `rec_lod.py`.

## 1. The PSL enable word -- vt+0x13c = `0x1054b8c` -- R, read whole and emulated

`0x1054b8c..0x1054bd0` (18 instructions): `0xca170`; `motion != 0x910` -> return; L9 M16 (0x910): `0x6fe88(e, 7, 0x6a)` (the
current action is (7, 0x6a), `e+0x73e0 / +0x73e1`) -> `|= 0x1c0000` (bits 18-20, u 511), else `|= 0xe00000` (bits 21-23, u 220).
No variant test. Gammoth carries no list 9: hers is the base word (the state gating of c 25, L0 M33 b6 / b9 / b12).
Check (`jscheckgen.py 17efaa8 em083_0N`, motions 1 / 0x21 / 0x1e / 0x121 / 0x210 / 0x215 / 0x90f..0x912 / 0x310 x statuses 1 / 7 /
10 x every number x rage x tired): **33836 runs, 0 mismatches** each; control (same ROM against em065_00's base-only
transcription): 1028 / 2056 mismatches.

## 2. The plays -- R (tracer)

`allmot2.py 4 910` (every status 0..0x11 x number x phase 0..3 x follows): L9 M16 is started by **(7, 0x6a)** and **(7, 0x6b)**
only, phase 0, both after `0xbc7f4(0)`. So one play fires u 511, the other u 220 -- never both (the viewer fired both before).
psl-mask.js CLIP_ACTIONS em083_04 `'9|Motion[16]'`. The machinery that follows (states-em083_04.md: status 7 numbers 0x6b / 0x6c
with motion in 0x910..0x912, the handle e+0xcb20 and id 1014 -> c 140) is the notes'.

## 3. The soak refusal at 0x3294c4 -- R, closed

The request routine `0x3294a8`: `blx [unit vt+0x68]`; 0 -> `+0x30 = 1`, return (`0x3294c4`, unrecorded until now). vt+0x68 =
`0x328d9c`, the mode-4 RANGE test (rom-map "Effect placement mode 4"): payload `+0x58` != 0 and |range point - parent| > range ->
0, start deferred. The record is **u 256** (mode 4, range 2000; L0 M30, L2 M21) -- u 265 (mode 0) and u 244 (mode 1) never reach
the test (its callers are mode 4 only), and their far recordings carry no `0x3294c4` while u 256's do. Recorded with the camera
far: `rec_lod.py em083_0N u256,u244,u265` -> `add_em083_0N_u256_lodmid` / `_lodfar` (CAMERA_AT 0,0,3500 / 7000) and the same for
u 244 / u 265 (12 sets); lifted.

## 4. Implemented

psl-mask.js `em083` (CLASS_MASK em083_00 / em083_04, PSL_MASK_MONSTERS) + CLIP_ACTIONS em083_04. add_effects `--apply`: Gammoth
+6 (u 242, 261, 302, 303, 340, 400), Elderfrost +8 (u 261, 302, 303, 340, 400, 472, 473, 520); recorded and lifted.
Checks dev/checks/em083_00.mjs / em083_04.mjs gained the word asserts and (Elderfrost) the in-page L9 M16 alternation
(back-to-back plays: index.html counts a clip's plays from 0 again when another clip comes between). Elderfrost's L3 M1
knock-off asserts assumed the cycle's phase and failed four ways (each arm one late): switching the list to 3 auto-plays L3
Motion[1], its first clip, which counts one play (debug check `<archive>/zg/dbg083.mjs`). The CHECK was wrong; it now takes
four consecutive plays and asserts the set. Checks: **Gammoth 62 / 0, Elderfrost 54 / 0**. Soaks: **Gammoth 80 motions, 0
refused; Elderfrost 94, 0 refused** (L0 M30 / L2 M21 play; were 2 refused each).

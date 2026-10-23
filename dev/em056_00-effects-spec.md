# Nibelsnarf (em056_00) -- effects spec (Leviathans walk, 2026-10-17)

Class `uEm056_00` (vtable `0x17c94e8`). States transcribed before (states-em056_00.md); his trap hold L3 M3 already has its
copy B (c 1105).

## 1. The PSL enable word -- vt+0x13c = `0xeea464` -- R, read whole and emulated

`0xeea464..0xeea4c4`: `0xca170`; L0 M1 / L0 M2: bits 15-17 unless `e+0x73e0 == 6` and `e+0x73e1 <= 0x12` with bit n of
`0x62059` (n = 0 / 3 / 4 / 6 / 0xd / 0x11 / 0x12). No record is bound on bits 15-17 there, so nothing visible changes; being
listed brings in his three out-of-mask base bindings (c 3, u 431) and gates u 240's tired tier. Check (`jscheckgen.py 17c94e8
em056_00`): **15380 runs, 0 mismatches**; control 1000 / 1028.

## 2. Implemented

psl-mask.js `em056_00`; `--apply` nothing new; his unrecorded state sets recorded (60) and lifted.

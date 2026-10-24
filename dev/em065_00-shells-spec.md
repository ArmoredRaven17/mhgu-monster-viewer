# Kecha Wacha (em065_00) -- shells spec (shells agent, 2026-10-18)

Class `uEm065_00` (band `0xf48e20..0xf57cd0`, action main `0xf55740`, status-7 table `0xf54540`). Ids are immediates (no id
fields): 0x116 uShellEm065_sp_00 (base00), 0x117 _sp_01 (base01), 0x118 _sp_13 (base13), 0x119 _sp_23 (a NEW base, base23).
Census: <archive> `fb/cen_em065.txt`. Transcribed: docs/render/shells.js `SHELL_DATA.em065_00` (params065s00 / s01 / s13 / s23,
init13k, init23 / solve23 / move23 / step23, landing065, spawn065). Check: dev/shells-kecha-check.mjs (16 / 16, controls fail),
page 10 / 10, soak 74 motions 0 refused. Records exported: u 0 / 1 / 2 / 10 / 11 / 12, c 31.

## 1. The actions -- READ

- the water shots, three a play, each its own frame test (`0xb0974`; the last passing one gives the mode): (7, 6) L2 M78 sp_23
  0 / 1 / 2 at 108 / 130 / 150 (`0xf5072c`, r1 0); (7, 7) L2 M80 sp_13 0 / 1 / 2 at the same frames (`0xf509a0`); (7, 0x3b) L2 M77
  sp_13 3 / 4 / 5 at 116 / 136 / 156. Their twins (7, 0x17 / 0x18 / 0x41) make sp_01 2 at those frames (joint 131, no
  EffectParam: a hit volume).
- (3, 7) L5 M25 f16 (`0xf4c844`): sp_01 0 (c 31) on the ground 300 ahead, when the owner's y is within 900 of its ground.
- (7, 0x15 / 0x48) L2 M114 -> M115 -> M116 -> M117 [this chain is WITHDRAWN (gapK, 2026-10-22): rom-map Withdrawn table and the uEm065_00 M115..M126 set-sites row] [doc audit 2026-10-24], phase 6 at M117 f33 (`0xf5251c`): sp_00 0 from (445 sin Y, -300, 445 cos Y) x
  the size off the owner's block position; (7, 0x16) the same with sp_01 3 (no EffectParam).
- all of them only at the variant byte `e+0xb5f5` == 0 (the variant-1 arm counts shots through `P+0x1a2`: not his).

## 2. The readers -- READ whole

- sp_00 `0xf569fc`: 0x10 int 0 (the request's point); float 0 vz, 1 the flight, 2 the X degrees; &vec 0 gravity.
- sp_01 `0xf56ed4`: 1 int 1, 4 int 3, 8 int 4, 0x80 int 2, 0x1000 int 5; joint int 0; &vec 0 the offset; ef 0 / 1.
- sp_13 `0xf57150`: flags 0x20 always, 2 int 1, 0x10 int 2 -- the aim `0x4053e4` with 0x10 is the owner's facing as it is
  (`0x4054e8`, now in shells.js aim13); both points vec 0; vec 1 -> +0x1630, the velocity's turn in degrees.
- sp_23 `0xf57710`: floats gravity / near / far / life / speed scale / launch speed / the solve's gravity; vec 0 offset, vec 1 the
  turn (degrees).

## 3. base23 -- READ whole

ctor `0x40c8ac` (over the plain shell), init `0x40c9f4`, the launch `0x40cf9c`, update `0x40d1a8`, step `0x40d2b4`, end
`0x40d4dc` (its +0x154 `0x40d5a8` is `bx lr`), the contact start `0x40c818`. The launch: the pitch word of the line to the target
(+100 up), the line clamped to [near, far] (the far clamp scales x / z only), up speed sin(pitch) x the launch speed, the time
to fall min(dy, -300) under the solve's gravity, the horizontal speed h / t at most 60 times the speed scale, along +z; then by
the owner's facing, then by vec 1's degrees (the spread). Gravity = float 0. Each step: the words from the velocity, the life,
the rocks' query.

## 4. The landings -- READ whole

sp_00 `0xf56b14` (any state), sp_13 `0xf5733c` (state 2), sp_23 `0xf578c8` (state 1): type 1 -> ef 2, sp_01 1 at the contact (the
shell's words), +0x40 = the contact, the words from the ground (`0x43b1a0`); type 0 -> ef 1 and sp_01 1; type 2 -> ef 3; then
the param at the contact and the end (shells.js landing065).

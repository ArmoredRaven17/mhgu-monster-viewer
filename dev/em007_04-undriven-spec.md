# Bloodbath Diablos (em007_04) — the undriven u 900 / 901 / 905 / 906 and the rage puff u 1120 / 1121

Research agent for the Viewer agent, 2026-10-14 (Raven: the Flying Wyverns' gaps, easiest first, from the bottom of
the lists). Static ROM reading plus unicorn controls (the option code under efx/agents/tail-scratch's harness, the
action prober, the script reader); no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming
instruction read), `I` = INFERRED, `NR` = NOT READ. Scratch: `<archive>/ng/` — `fwread.py` / `rdis.py`
(disassembly), `brscan.py` (every b / bl to a target), `immscan.py`, `headdrop.py` / `headtable.py` (the option runs).

Sources opened first: rom-map.md (the uEm007_00 section, "Bloodbath -- List 9", "Barioth / Basarios / Ukanlos", the
Withdrawn rows on CUT_TAIL joints and group-7 phases), dev/em007_04-sever-note.md, dev/em007_04-list9-census.md,
dev/fw-undriven-barioth-basarios-ukanlos.md, E:\offline\decode\notes\tail-option-em043.md (§2 / §3 / §7 — its "the em-7
variant 0x74910 / 0x74be0 and kind 2 / 3 options" NOT READ list is closed here for em 7 kind 2), docs/render/
tail-option.js, motion-states.js (em007_00 / em007_04 / em044_00 blocks, RAGE_PUFF, SHELL_TAIL), index.html
`stepCutTail` / `driveMotionStates` / the rage control, docs/effect-mounts.json, docs/part-review.json em007_04,
monsters.json em007_04 (parts, groups, the option list), the task board (Flying Wyverns entry; Bloodbath's HP stages,
2026-09-18; the sheds design, 2026-09-12).

## 0. Headline

| record | what fires it in the game | joint | clip | viewer change |
|---|---|---|---|---|
| **u 900** (UNIQUE idx 10, `cm202_062`, joint 144) | the TAIL sever: `(10, 0x72)` with part 7 -> `0xc2274(e, slot 0, 0, 0x91, NULL)` -> `0xa4354(e, 0)` -> id 3 | drop joint **145** (`0x91`) | L3 M15 f0 | MOTION_STATES `'3|Motion[15]'` fire + `drops` |
| **u 905** (UNIQUE idx 11, `cm202_001`, jointless) | slot 0's landing: `0x703b8(e, kind 1, &G)` at option step 42 -> id 5 | — | (on its own clock) | `CUT_TAIL.em007_04` (the existing CutTail flight is exact for him) |
| **u 901** (UNIQUE idx 12, `cm202_062`, joint 3, 0.7x) | the HORN sever: `(10, 0x72)` with part 6 -> `0xc2274(e, slot 1, 0, 3, NULL)` -> `0xa4354(e, 1)` -> id 4 | drop joint **3** | **L9 M17** f0 | MOTION_STATES `'9|Motion[17]'` fire + second-piece drop |
| **u 906** (UNIQUE idx 13, `cm202_001`, jointless) | slot 1's landing: `0x703b8(e, kind 2, &G)` at option step **48** on the em-7 kind-2 path `0x74910` -> id 6 | — | (own clock) | **a second piece AND a second flight model** — CUT_TAIL's one-piece CutTail cannot carry it |
| **u 1120 / 1121** | the shared puff (`0xa41b8`, gate `e+0xb7d2` at `0xa424c`), every 30 f enraged; pick vt+0x2a4 `0xd451f0` | pick joint 4 | — | `RAGE_PUFF.em007_04` (missing) + `_autoOnRage` (missing) + the rage row |

The pairs are **900 <-> 905 (the tail, option slot 0, kind 1)** and **901 <-> 906 (the horn piece, option slot 1,
kind 2)** — now held by the code (the cut id is the slot, `0xa4378`; the landing id is the kind, `0x70414`), which
closes dev/em007_04-sever-note.md's open question. The "head" piece is **the second horn**: the sever is part 6 (the
horns — Diablos's horn break is `(10, 0x14)` with part 6), and its model resource is `em007_04_head`.

## 1. The two option slots — R

| step | address | what |
|---|---|---|
| descriptor index | `0x4bc18` -> `0x50aa8(halfword res+4)`: table `0x1594ca4` (0x89 pairs) maps **`0x407` -> 115** (Diablos `0x7` -> 114, controls `0x4` -> 112 Basarios, `0x2a` -> 123 Barioth as the earlier note read) | the variant's own descriptor |
| descriptor | `[0x172ba68][115]` = **`0x159ac90`** = (0x8472, **0x8473**, **0x8474**, 0x8475, 0x8453, 0x8454), **`+0xb4` = 0x8489**. Diablos `[114]` = `0x159abc4` = (.., 0x8451, **-1**, ..), +0xb4 0x77ed | slot 0 AND slot 1 exist for him only |
| resources | `0x159daa0` {jamcrc, type}: **0x8473 = `enemy\em007\em007_04\mod\em007_04_tail`**, **0x8474 = `enemy\em007\em007_04\mod\em007_04_head`** (rModel `0x58a15856`), **0x8489 = `enemy\em_option\mot\em007_04_option`** (rMotionList `0x76820d81`). Controls: 0x8413 em004_00_tail, 0x8537 em042_00_tail, 0x77ed em001_00_option, 0x8451 em007_00_tail all hash exactly | the staged glbs are the ROM's pieces |
| kinds | enemy setup `0xb9e84`: slot 0 `0x4bc18(res, 0) == 1` -> kind byte `e+0x8b94` = **1**; `0xb9ef8`: slot 1 `0x4bc18(res, 1) != 0` -> `e+0xa084` (= +0x14f0) = **2**; slot 2 never (`0x4bc18` returns 0 for slot > 1, `0x4bc28`) | |
| the sever | `0xc2274`: kind 1 -> `P+0x3b4 \|= 1`, r8 7; **kind 2 -> `\|= 2`, r8 6**; kind 3 -> `\|= 8`, r8 5; kind 0 -> return at `0xc235c` (nothing). `+0x1477` = r3 (`0xc22f8`); with r2 bit 2 clear (both his calls pass 0): `0x9d39c(e, r8, 1)`, the target `+0x1440..` = owner +0x40.. with y + 20 (`0xc2390..0xc23f0`), vt+0xa4, then **`b 0xa4354(e, slot)`** (`0xc2418`) | |
| the cut request | `0xa4354`: `vt+0x1d0` with **id `slot == 0 ? 3 : 4`** (`0xa4378` / `0xa437c`) | 900 / 901 |
| his +0x1d0 | `0xd455d0`: id < 1000 -> `b 0xa3ddc` (`0xd455f8`); base table `0x159c7fc` = {1120, 1121, 1400, **900, 901, 905, 906**, 1000} | |
| the landing | `0x703b8`: kind == 1 -> id 5 (`movweq r1,#5` at `0x70414`), else 6 -> **905 / 906** | |
| dtp overrides | `em007_04_dtbparts.dtp` `+0x91` (option rows) = **0** (efx/agents/diablos-scratch/dtp.py, schema consumed 242 of 242 bytes EXACT) — no speed / height / rotation row for either kind | |

### 1.1 Who severs what — uEm007_00 vt+0x204 `0xd322e4` (the on-action-start hook), R

The status switch (`0xd323bc`, table at `0xd323d8`) sends status 10 to `0xd326f4`; number `0x72` reaches `0xd32714`:

    0xd32714  bl 0x9e8d8 ; part = (P+0x5ccb >> 3) & 7
    0xd3271c  cmp r0,#7 / bne 0xd327e8
    0xd32724  r0 = 0, r1 = 0 (slot 0), r2 = 0, r3 = 0x91  -> b 0xd32808          ; THE TAIL
    0xd327ec  bl 0x9e8d8 ; cmp r0,#6 / bne 0xd32814
    0xd327f8  r0 = 0, r1 = 1 (slot 1), r2 = 0, r3 = 3                              ; THE HORN
    0xd32808  str r0,[sp] (5th arg NULL) ; 0xd32810 bl 0xc2274

**No variant test on that path** (the variant byte at `0xd3230c` only gates the (7, 0x67) arm). So Diablos runs the
same calls: his part-6 call reaches `0xc2274` with slot 1's kind byte 0 and returns at `0xc235c` — nothing (no slot 1
for him). The single `bl 0xc2274` in the band (`0xd32810`) is shared by both arms through `b 0xd32808`, which is why the
earlier sevscan found only the slot-1 call.

### 1.2 The clips — R (probe + script reader)

`probe.py` (efx/agents/notice-scratch) on uEm007_00, em 7, (10, 0x72), parts 0 / 3 / 4 / 5 / 6 / 7, variants 0 and 4:
**part 6 -> script `0x179a6d0`**, every other part -> `0x179a400`. `scr.py` (efx/agents/cephadrome-scratch, control
Cephadrome `0x17ab0f0` = L3 M9 / L3 M13 as documented):

    0x179a400: op 0xa turn 148..244 (0x8000) ; op 0 L3 M15 blend 0 start 0 wait 1 ; end 0xff
    0x179a6d0: op 5 P+0x568 = 100 ; op 0xa turn 42..70 ; op 0 L9 M17 blend 0 start 0 wait 8 ;
               op 0xa turn 198..222 ; op 0 L9 M17 start 100 wait 1 ; end 0xff

So **the horn sever is L9 M17** (one clip, played to f100 then resumed from f100 — the viewer plays it straight). This
answers census §6 E5 ("who plays L9 M17": (10, 0x72) with part 6). The sever (and its u 901) runs at the action's
start (vt+0x204), i.e. frame 0 of L9 M17, as u 900 runs at frame 0 of L3 M15.

### 1.3 What the part pass shows — R

uEm007_00 vt+0x210 `0xd36e50`, variant 4 (`0xd36e64`):
* the tail: `vt+0x370(e, 1)` -> set **0xb (11)**, else **0xa (10)** (`0xd37044..0xd37068`) — monsters.json em007_04
  `groups[11]` = part 4 on / 101 off. (SHELL_TAIL.em007_04 `{ severed: 4 }` already reads it.)
* the horns: `0xd32ba4` (variant 4) returns **2 when `vt+0x370(e, 2)`** (P+0x3b4 bit 1 — the horn sever), else 1 when
  part 6's break level (`0x9d36c(e, 6)`) reaches the dtp threshold (rank-chosen, `0x3a8430`), else 0. The pass then
  draws (normal posture, `r7 = 1`): **0 -> sets 16 + 17**, **1 -> sets 5 + 17**, **2 -> sets 5 + 7**
  (`0xd36f80..0xd36fe8`). In groups: 16 = 32 + 102, 17 = 33 + 103, 5 = part 2, 7 = part 3. So the Horns row's options
  are exactly the ROM's three states: `102+103` Intact = 0, `2+103` One Horn Broken = 1, **`2+3` Both Horns Broken = 2,
  the sever**.

## 2. The flights — R (code) / emulated (the ROM's own option code)

The option state machine `0x73780` phase 2 (`0x73a08`): **em `+0xb5f4` == 7 and kind 2 -> `0x74910`** (via
`0x73d78`); every other case `0x73cd8` (window (10, 42) for kinds 1 and 2, 48 for em 0x50). Activation `0x73f7c`:
h = 20 x S (`0x74088`), but **kind 2 takes -20.0** (`0x740d0` `vmov s2,#-20`, `0x740e4` `vseleq`) and only **em 7**
uses that (`0x740f0 cmp r0,#7` / `0x740f4 vseleq`) — **unscaled**; setMotion **motion = kind == 2 ? 2 : 1**.

### 2.1 The tail (kind 1) — the existing CutTail is exact

`em007_04_option.lmt` Motion[1] is **byte-identical** to `em001_00_option.lmt` Motion[1] (header frames 55, loop -1,
end values; both track descriptors; both key buffers 0x180 / 0x1a8 bytes; the bounds block — only the file offsets
differ). Emulated with `tail_emu.py` on Bloodbath's list (`headdrop.py 1 0x91`: em 7, variant 4, kind 1, J (0, 400,
300), owner at the origin): position at step 6 = (0, 496.39, 256.69) = CutTail's `s T_Y[6] + yb`, `J.z + s T_Z[6] d`
exactly; **landing `0x703b8` kind 1 at step 42** at G = (0, 20, 0); motion end at 53. So `CutTail` with `above: 20`
serves him unchanged; only the joint is his (**145**).

### 2.2 The horn piece (kind 2, em 7) — a different flight: `0x74910`

Read: phase 2 of `0x74910` — if the motion ended (`0x94dc04`): phase 3, **position = G** (`+0x1440..`), rotation =
q14a0 x q14b0; else it samples motion 2's root at the frame and the previous frame (`0x74be0` x2, `0xb46e8c(list, 2)`,
the ROM evaluator `0xafb70c`), adds the delta turned by the yaw word `+0x1454` (x 2pi/65536, literal `0x74bd4`) and
scaled by `+0x14e0..+0x14e8`, then **f > 10.0**: f <= **48.0** (`0x74bd8`) -> t = (f - 10) / **38.0** (`0x74bdc`), yb'
= yb + t^2 (G.y - yb), pos.y += yb' - yb; f > 48 -> once (`+0x14d4`, not em 0x50) **`0x703b8(owner, kind 2, &G)` =
u 906**.

Emulated (`headdrop.py 2 3`, `headtable.py`; the option's own ctor, reset, activation, both passes, the motion
system and `0x74910` run for real; stand-ins as tail_emu.py names them: the owner block, a flat floor, the model with
no joints): the landing **`0x703b8` kind 2 at step 48** at G = (owner x, floor - 20, owner z); the motion (73 frames)
ends at step 71 -> position G. Two runs (J (0, 400, 300) / owner 0 / S 1, and J (300, 400, -500) / owner (100, 0, 50)
/ yaw 0x4000 / S 1.5) agree with one closed form:

* horizontal: **pos.xz = J.xz + F(k) (G.xz - J.xz)** — the fraction does not depend on the distance or S;
* height: **pos.y = yb(k) + H(k)** — H is the root height, **unscaled** (both runs give the same H);
  yb(0) = J.y; for each step n with c = n + 1 in 11..48: yb += ((c - 10) / 38)^2 (G.y - yb);
* rotation: **qa x Q(k)**, qa = CutTail's yaw toward d (checked: run 2 step 6 = qa(-20 deg) x Q(6) to 4 places);
* **k = 48: u 906 at G**; **k >= 71: position G, rotation qa x Q(71)**, held. Note H(70) = 115.0 (motion 2's own end
  height): the piece sits 115 above G until the motion's end and then is placed at G — the ROM's own snap.
* G.y = the floor + h with **h = -20, not x S** (the activation above).
* Why, from the harness's readout of the option after the activation (run 2): `+0x1454` = `0xf1cb` = -20 deg, the yaw
  from J toward G (not the owner's facing, which was 0x4000); `+0x14e0` / `+0x14e8` = **0.3942 = |G - J| / 1484.6**
  (Motion[2]'s end distance, its lmt header) and `+0x14e4` = **1.0**. So `0x74910`'s own delta is the whole flight: the
  root's ground track scaled to reach G along the aim, its height unscaled. (The values are the harness's; their
  writer in the activation is not opened — I as a reading, R as a run.)

The table, per step k = 0..71 (ROM-run, canonical J (0, 400, -300), G (0, -20, 0), facing +Z so qa = identity):

    // Bloodbath's horn piece: em007_04_option Motion[2] under 0x74910, step k = 0..71 (dev/em007_04-undriven-spec.md 2.2)
    const HEAD_F = [
      0.01491, 0.02985, 0.04483, 0.05986, 0.07489, 0.08993, 0.10501, 0.1201, 0.13523, 0.15037, 0.16552, 0.18071,
      0.19589, 0.21108, 0.2263, 0.24151, 0.25673, 0.27196, 0.28719, 0.30243, 0.31767, 0.33291, 0.34814, 0.36335,
      0.37859, 0.3938, 0.409, 0.42419, 0.43938, 0.45453, 0.46969, 0.48481, 0.49994, 0.51503, 0.5301, 0.54515,
      0.56016, 0.57515, 0.59011, 0.60505, 0.61995, 0.63481, 0.64965, 0.66444, 0.6792, 0.69391, 0.70858, 0.7232,
      0.73779, 0.75232, 0.7668, 0.78124, 0.79563, 0.80997, 0.82424, 0.83845, 0.85258, 0.86671, 0.88075, 0.89472,
      0.90862, 0.92215, 0.93506, 0.94719, 0.95842, 0.96862, 0.97763, 0.9853, 0.99151, 0.99614, 0.99901, 1.0,
    ];
    const HEAD_H = [
      62.988, 125.565, 187.82, 250.392, 312.963, 375.534, 437.882, 499.817, 560.959, 620.345, 675.336, 724.115,
      766.575, 803.221, 834.753, 861.89, 885.272, 905.403, 922.726, 937.622, 950.366, 961.218, 970.391, 978.068,
      984.386, 989.469, 993.452, 996.413, 998.443, 999.618, 1000.0, 999.618, 998.443, 996.413, 993.452, 989.469,
      984.386, 978.068, 970.406, 961.233, 950.382, 937.637, 922.756, 905.433, 885.317, 861.951, 834.829, 803.297,
      766.667, 724.222, 675.397, 620.345, 560.699, 499.481, 437.592, 375.321, 312.737, 250.153, 187.454, 125.0,
      116.636, 115.095, 114.744, 114.866, 114.988, 114.988, 114.988, 114.988, 114.988, 114.988, 114.988, 0.0,
    ];
    const HEAD_Q = [   // (x, y, z, w) per step
      0.0, 0.0, 0.0, 1.0, 0.18793, 0.00273, 0.00149, 0.98218,
      0.36919, 0.00537, 0.00293, 0.92933, 0.53823, 0.00904, 0.00293, 0.84275,
      0.68837, 0.0127, 0.00147, 0.72524, 0.81383, 0.01612, -0.00098, 0.58089,
      0.90965, 0.01905, -0.00488, 0.4149, 0.97222, 0.02075, -0.00977, 0.23292,
      0.99878, 0.02125, -0.01563, 0.04176, 0.98802, 0.01991, -0.0224, -0.15142,
      -0.94023, -0.01782, 0.02832, 0.33888, -0.85691, -0.01318, 0.03442, 0.51415,
      -0.74105, -0.00708, 0.0398, 0.67024, -0.59696, 0.00073, 0.04395, 0.80107,
      -0.42973, 0.01001, 0.04664, 0.9017, -0.24612, 0.02027, 0.04712, 0.96788,
      -0.05298, 0.03101, 0.04517, 0.99709, 0.14234, 0.04175, 0.04077, 0.9881,
      0.33213, 0.05202, 0.03395, 0.94119, 0.50935, 0.06104, 0.02466, 0.85804,
      0.66665, 0.06837, 0.01294, 0.74211, 0.79849, 0.07326, -0.00049, 0.59753,
      0.89954, 0.07545, -0.01538, 0.42999, 0.9658, 0.07448, -0.03126, 0.24639,
      0.995, 0.07008, -0.04713, 0.05323, -0.98602, -0.0625, 0.06225, 0.14135,
      -0.9394, -0.05127, 0.07617, 0.3303, -0.85699, -0.03711, 0.08814, 0.50638,
      -0.74204, -0.02002, 0.09743, 0.66293, -0.59915, -0.00098, 0.10303, 0.79398,
      -0.43408, 0.01953, 0.10498, 0.89452, -0.25298, 0.04078, 0.1028, 0.96113,
      -0.06276, 0.06178, 0.09597, 0.99148, 0.12894, 0.08181, 0.08498, 0.98461,
      0.31527, 0.09939, 0.07009, 0.94118, 0.48939, 0.11429, 0.05128, 0.86302,
      0.64464, 0.12551, 0.0293, 0.75354, 0.77582, 0.1326, 0.00513, 0.61684,
      0.87828, 0.13478, -0.02051, 0.45831, 0.94857, 0.13185, -0.04688, 0.28396,
      0.98453, 0.1238, -0.07252, 0.1006, -0.9854, -0.11109, 0.09668, 0.08545,
      -0.95167, -0.09326, 0.11841, 0.26758, -0.88504, -0.07129, 0.13672, 0.43923,
      -0.78811, -0.0459, 0.15088, 0.59499, -0.66502, -0.01782, 0.16015, 0.72923,
      -0.52032, 0.01196, 0.16408, 0.83798, -0.35915, 0.04248, 0.16261, 0.91802,
      -0.18753, 0.07252, 0.1553, 0.96719, -0.01099, 0.10109, 0.14236, 0.98458,
      0.16458, 0.12722, 0.12454, 0.97016, 0.33332, 0.14993, 0.10183, 0.92523,
      0.49006, 0.16848, 0.07521, 0.85194, 0.63067, 0.18215, 0.04541, 0.753,
      0.75067, 0.19048, 0.01368, 0.63248, 0.84726, 0.19314, -0.01953, 0.49444,
      0.91819, 0.18999, -0.05275, 0.34359, 0.96221, 0.18116, -0.08521, 0.18458,
      0.97884, 0.16676, -0.11646, 0.02222, -0.96879, -0.14795, 0.14283, 0.13843,
      -0.93314, -0.12598, 0.16334, 0.29444, -0.87345, -0.10106, 0.18089, 0.44063,
      -0.80279, -0.0752, 0.19581, 0.55815, -0.73832, -0.05225, 0.20729, 0.63968,
      -0.68493, -0.03296, 0.21561, 0.69519, -0.64385, -0.01856, 0.22121, 0.73224,
      -0.61432, -0.00952, 0.22439, 0.75642, -0.59505, -0.00317, 0.22733, 0.77086,
      -0.5842, 0.00049, 0.23021, 0.77828, -0.57969, 0.0022, 0.23271, 0.7809,
      -0.57918, 0.00293, 0.23489, 0.78062, -0.5816, 0.00244, 0.23708, 0.77815,
    ];

(The viewer's `poses/monsters/em007_04_option.glb` carries Motion[2] at 1.217 s; tail-option.js notes the glb runs
one frame late against the ROM evaluator, so the table, not the glb, is the source.)

## 3. The rage puff — R

* The shared puff `0xa41b8`: vt+0x3f4 (`0x7fed4`) == 0, `0x81bb0(e, 1)` == 0, **vt+0x2d8 = `0x6bfb0` (1)**, enraged
  (`0x81670`, P+0x518 == 1), the 30-frame countdown P+0x5c6c (reset to 30.0 at `0xa4240`), **gate `e+0xb7d2` != 0
  (`0xa424c`)**, the pick **vt+0x2a4 = `0xd451f0`** (0 -> id 0, else 1), vt+0x1d0 -> `0xd455d0` -> `0xa3ddc` ->
  **1120 / 1121**.
* uEm007_00 never writes `e+0xb7d2` / `+0xb7d3`: `immscan.py` over `0xd31a64..0xd46da0` for 0xb7d0..0xb7d3 finds none;
  the same scan finds Alatreon's `0xec4a94` and Rajang's `0xde1dd0`. So the base ctor's 1 stands for both variants.
* The pick's joint: his setup `0xd31c54` writes **P+0x5d04 = 4** at `0xd31d48` after every branch of its prefix has
  rejoined at `0xd31d10` (the variant test at `0xd31e48` comes later) — for both variants. `0xd451f0` is Diablos's own
  pick (`rathianPuffPick`, RAGE_PUFF.em007_00 comment).
* His records: em007_04u UNIQUE 1120 / 1121 = `em007_04_001`, joint 3, scale **1.0** (Diablos's 0.9), both exported
  `ragePuff`.
* The rage entry: `(1, 6)` -> setMotion0 **L0 M22** on variants 0 and 4 alike (probe) — Diablos's rage row.

The viewer: **`RAGE_PUFF.em007_04` does not exist and `em007_04` is not in `_autoOnRage`** (65 entries; em007_00 is).
`effectsRage = !!RAGE_PUFF[id] && effectAutoOnRage(id)` (index.html), so both are needed, and the listing also gates
`setEffectRage` / `rt.setRage` in driveMotionStates.

**A viewer-semantics point to raise with Raven, not to decide here:** Bloodbath's Rage control is the HP-stage ladder
(Calm / Building / Full = P+0x1bb's two latched HP stages, board 2026-09-18 "Rage here is HP, not enrage"), and
`state.rage = rageLevel > 0`. The puff's gate is the true enrage (P+0x518). Wired as above, the puff would run at
Building and Full and during L0 M22 — the HP stage standing in for the enrage. The viewer has no separate enrage
control for him.

## 4. WHAT TO CHANGE (the implementation agent transcribes)

### 4.1 render/tail-option.js — a second piece and its flight

`CUT_TAIL` carries one piece per monster and `stepCutTail` flies `CUT_TAIL[state.id]` through `CutTail` on any row
with `drops: true`. Bloodbath needs (a) a second piece selected by the row and (b) a second flight model. Shape:

    // BLOODBATH DIABLOS: TWO option slots (descriptor [0x172ba68][115] = 0x159ac90: 0x8473 em007_04_tail, 0x8474
    // em007_04_head; +0xb4 0x8489 = em_option\mot\em007_04_option, whose Motion[1] is em001_00_option's byte for byte).
    // The TAIL: (10, 0x72) part 7 -> 0xc2274(e, 0, 0, 0x91) at 0xd32810 = JOINT 145 (u 900 sits on 144), kind 1, CutTail
    // exactly (emulated: lands at k 42). The HORN: part 6 -> 0xc2274(e, 1, 0, 3) = JOINT 3, kind 2, which em 7 flies on
    // 0x74910 instead: Motion[2] (73 f), h = -20 unscaled, eased over (10, 48], u 906 at k 48, G at k 71
    // (dev/em007_04-undriven-spec.md 1-2).
    em007_04: { piece: 'em007_04_tail', joint: 145, above: 20, landing: ['em007_04u', 905],
                horn: { piece: 'em007_04_head', joint: 3, above: -20, unscaled: true, landing: ['em007_04u', 906],
                        flight: 'em007_04_horn' } },

and a second flight class beside `CutTail` (same constructor `(J, G)`, same `advance(k)` / `pose()` contract):

    // k = 0..70: pos = (J.x + F[k] (G.x - J.x), yb + H[k], J.z + F[k] (G.z - J.z)), quat = qa x Q[k];
    //   yb starts at J.y and for each counter c = k + 1 in 11..48: yb += ((c - 10) / 38)^2 (G.y - yb);
    // k = 48: the landing (advance returns true); k >= 71: pos = G, quat = qa x Q[71]. qa as CutTail's.
    export class HornPiece007 { ... }   // HEAD_F / HEAD_H / HEAD_Q from section 2.2

index.html `stepCutTail`: take the spec from the row — `drops === true ? CUT_TAIL[id] : CUT_TAIL[id][drops]` — build
`spec.flight ? new HornPiece007(J, G) : new CutTail(J, G)`, and G.y = floor + `spec.above` x (`spec.unscaled` ? 1 : S).
The state is one `cutTail` today; the tail lies on the ground while the horn drops later, so key it by piece (or keep
the last-dropped piece's pose held), as the code's own comment about returning to the Parts panel's say allows.
efx/add_effects.py `state_records` reads `ct.landing` only (`take(ct.landing, 'event')`): it must also take
`ct.horn.landing`, or effects_status.py keeps calling 906 undriven.

**The same second-piece shape serves Barroth** (em044_00: slot 1 `em044_00_head`, his 901 / 906 — motion-states.js
em044_00's "NOT WIRED ... the head piece") and Crystalbeard's beard (slot 1). They are not em 7, so their kind 2 runs
the ordinary path (`0x73cd8`: Motion[2] of their own option list, window (10, 42), h = 20 x S) — I for both; their
sever sites are not opened here.

### 4.2 render/motion-states.js em007_04 — the two sever rows

    // THE TAIL SEVER: (10, 0x72) with part 7 -> script 0x179a400 -> L3 Motion[15] from frame 0 (variants 0 and 4 alike).
    // The hook vt+0x204 0xd32714..0xd32734 calls 0xc2274(e, slot 0, 0, 0x91): P+0x3b4 bit 0, the part pass's set 10 -> 11
    // (0xd37044..0xd37068; groups[11] = part 4), and 0xa4354(e, 0) requests id 3 = u 900 (UNIQUE cm202_062, joint 144).
    // His slot 0 drops em007_04_tail (CUT_TAIL.em007_04).
    '3|Motion[15]': { levels: [[10], [11]], fire: [null, ['em007_04u', 900, 'UNIQUE']], drops: true },
    // THE HORN SEVER: (10, 0x72) with part 6 -> script 0x179a6d0 -> L9 Motion[17] (to f100, then resumed from f100).
    // 0xc2274(e, slot 1, 0, 3): P+0x3b4 bit 1 -> 0xd32ba4 returns 2 -> sets 5 + 7 (`2+3`, Both Horns Broken; from
    // `2+103`, state 1, or `102+103`), and 0xa4354(e, 1) requests id 4 = u 901 (UNIQUE cm202_062, joint 3, 0.7x).
    // His slot 1 drops em007_04_head on the em-7 kind-2 flight (CUT_TAIL.em007_04.horn).
    '9|Motion[17]': { levels: [[5, 17], [5, 7]], fire: [null, ['em007_04u', 901, 'UNIQUE']], drops: 'horn' },

(The third element names the array for the tools — 900 and 901 are each held in SEQUENCE and UNIQUE; the runtime's
`fire` matches the `event` entry, which is the UNIQUE one. L9 M17's six clip bindings on bits 0-5 are unaffected.)

### 4.3 The puff

1. motion-states.js `RAGE_PUFF`: `em007_04: { period: 30, joint: 4, records: [['em007_04u', 1120], ['em007_04u', 1121]], pick: rathianPuffPick },`
   with the comment: same class as Diablos — vt+0x2a4 `0xd451f0`, P+0x5d04 = 4 (`0xd31d48`, both variants), no
   `e+0xb7d2` write in the class; his own 1120 / 1121 are em007_04_001 on joint 3 at 1.0.
2. docs/effect-mounts.json `_autoOnRage`: add `"em007_04"`.
3. motion-states.js em007_04: `'0|Motion[22]': { rage: true },` — (1, 6) -> L0 M22 on variant 4 (probe), as Diablos's.
4. Raise §3's semantics point (HP ladder vs enrage) with Raven before or with the change.

### 4.4 Found on the way — R, out of this spec's scope

* **Diablos's CUT_TAIL joint is 145, not 144.** The same hook and call serve variant 0: `0xd32730 mov r3,#0x91` ->
  `0xd32810 bl 0xc2274` -> option `+0x1477` = 0x91. tail-option.js em007_00's comment already cites `0xd32724` "kind
  0x91" and then takes u 900's joint 144. One joint off moves the drop point, not the landing. (Withdrawn row in
  rom-map.)
* **part-review.json em007_04 `sheds`: the head piece is mapped to `2+103` and `2+3`.** In the ROM the piece exists only
  after the sever: slot 1's phase 0 waits for `vt+0x370(owner, 2)` (P+0x3b4 bit 1, written only by `0xc2274`), which is
  horn state 2 = `2+3`. `2+103` is the break level (state 1), with no option activation. The static "show the shed
  piece" display is Raven's design (2026-09-12: "one horn coming off is already a shed piece"); raised, not changed.

After the edits: `python efx/effects_status.py em007_04` should move u 900 / 901 / 905 / 906 and u 1120 / 1121 off
the undriven list (906 only once `state_records` reads the horn's landing). No record needs exporting (all six are).

## 5. NOT READ, by name

* The option's own frame step (tail-option-em043.md's open item): the tables are per game frame at dt 1, as CutTail's.
* The stage probe's answer for the horn's upward probe pair (B above A by 20): `0x180fd4` takes the same `B.y - A.y <
  100` branch the tail does (tail-option-em043.md 3.4), so G.y = hit + h — the harness answers it with a flat floor.
* Whether the dtt lets the horn sever from state 0 (intact) or only after the break (state 1) — the row's first
  `levels` entry is the display's before-state either way.
* The writer of `+0x1454` / `+0x14e0..+0x14e8` (the aim yaw and the root-delta scale `0x74910` reads): the harness
  shows them as the J -> G yaw, |G - J| / 1484.6 and 1.0 (2.2); the activation's stores are not opened.
* Barroth's and Crystalbeard's slot-1 sever sites and kind-2 flights (4.1, I).

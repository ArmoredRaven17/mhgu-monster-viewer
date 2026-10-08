# Bloodbath Diablos (em007_04) — List 9 effect census

Research agent for the Viewer agent, 2026-10-08. Raven: *"Look into Bloodbath's List 9 animation effects."* Reads and
census only; no viewer file edited, no recorder or lift run. Class `uEm007_00` (vtable `0x17994cc`, band
`0xd31a64..0xd46da0`), variant byte `e+0xb5f5 = 4`. List 9 = his own `em007_04_9.lmt` / `em007_04_9.psl`; the viewer
plays `Motion[4]..Motion[30]` (27 clips; slots 0–3 hold no PSL block). Lists: **em007_04u** (u) and **em007_00c** (c).

`R` = READ (the consuming instruction read, here or in the cited file). `I` = INFERRED. Sources opened first:
`dev/rom-map.md` (uEm007_00 rows, the PSL ENABLE MASK section, the group-6 section, traps), `dev/em007-shells-spec.md`,
`dev/em007_04-parts-read.md`, `dev/em007_04-sever-note.md`, the model `dev/em081_04-effects-census.md`,
`docs/render/psl-mask.js`, `docs/render/monster.js` CLIP_EFFECTS em007_04, `docs/render/motion-states.js` em007_04,
`docs/render/shells.js` (no em007 entry), `docs/effects/em007_04.json` (86 records), the task board entries of
2026-09-20 / 09-28, `efx/class-effects.json`. Scratch (session-local, copy before relying on it):
`<scratchpad>/bb9/` — `d.py` (disassembler), `plan9.py` (add_effects' plan with the whole block), `emu13c.py`
(unicorn run of vt+0x13c), `probe7_v4.txt` (actprobe7 over group 7, variant 4), `psl_all.txt`.

## 0. Headline

The census unit is a **PSL binding** (motion × bit with on-events: 53 on List 9) plus the **shell-carried records** (7).

| group | count | what it means |
|---|---|---|
| **A** running and correct | **36 bindings** | file-mask bits the game also enables, in every state, every play |
| **A\*** running, wrongly gated | **4 bindings** | L9 M11 b0/b1 (u 750 / u 380) — the game CLEARS bits 0–5 in actions (7,0xb5)/(7,0xb7); L9 M16 b9/b10 (u 750 / u 903) — **enraged only** |
| **B** exported and bound, refusing | **1 motion** | L9 M27 (b0 u 914 bound; alive at the refusal u 914 and u 350 from M26): `REFUSED 0xa6980c falls into unrecorded code`, and the page's effects stop after it |
| **C** missing, trigger READ | **11 bindings / 3 unexported records** | bits outside the file mask the enable word turns on (9), one in-mask record never exported (u 904), u 630 / u 950 unexported |
| **D** missing, needs a shell runtime | **7 records** | shell01 `0x71` modes 0 / 5 / 6 / 7 (u 100, u 120, u 300); shell07 `0x72` (base07) u 0 / 1 / 10 / 11 |
| **E** open reads | **6** | §6 — none blocks C; base07 blocks the shell07 half of D |
| **F** named, switched on, never enabled | **1 binding** | L9 M11 b27 (u 910): no arm of vt+0x13c ever sets bit 27 on L9 M11 |

53 = 36 + 4 + 1 + 11 + 1. **No class-requested record reaches a List 9 motion** (§1.2, with its control).

**The largest finding is the same as Boltreaver's — a missing mechanism (R):** `em007_04` is not in
`psl-mask.js PSL_MASK_MONSTERS`, so his CLIP_EFFECTS came from each block's FILE mask, which the game overwrites with
`e+0x13f4` (rom-map "THE PSL ENABLE MASK"). uEm007_00's **vt+0x13c is `0xd4532c`** and, unlike Boltreaver's, it adds
real bits — read whole below (§1.1) and emulated (`emu13c.py`, identical words). On List 9 it does three things:
**(a)** on EVERY motion ORs bits 15–17 (tail intact) or 18–20 (tail severed) — L9 M10's u 630 / u 631 pair;
**(b)** on L9 M11 (0x90b), in group-7 actions 0xb5..0xb8, ORs bits 28/29 or 30/31 **and clears bits 0–5**; **(c)**
nothing variant-specific (the one variant test is L2 M22's bit 21). Bits 6–14 come from the base as usual: L9 M16's
b9/b10 are enraged-only.

**The 2026-09-20 board entry, item by item (R):** (1) `virtual +0x18 -> 0xaa7b60 not translated` — **gone**: construct.js
`GENERATOR_TYPES[2]` now carries GOT `0x183c960` (vtable `0x1789834`) and type2.js runs it; no L9 motion refuses on it
in today's soak, and `effects_triage.generators` reports no unbuilt row type in any em007_04 efl (types 2 and 25 both
built). (2) "**zero billboards on em007_04_000 key 913**" — **holds, and it is the ROM's own row selection, not a gap**:
the record's MASK1 (payload `+0x48`, consumed by `0x9bb954..0x9bb974` via `0x9ba670`, rom-map "Row gate") is
`0x2000` for u 913, and only rows **12 and 14** of em007_04_000 (both MODEL) carry bit 13 in their node block's `w00`.
No billboard row of that efl is in u 913's set at any LOD rung; mask2 (the rung) gates exactly one row of the file
(row 31, `w04 0xa2`, which is u 910's). The "ten billboard textures" of the ROM run came from `engdraw --proof`, whose
block `+0x58/+0x5c` are not the masks (board, same day). The mask2 rung **does** matter for em007_04_008 (u 631 / u 630
/ u 920: 5 of 17 rows at rung 3) — the board's open quest-byte question, unchanged. (3) "some motions kill the
runtime" — **one still does: L9 M27**, a different path (§3, B).

Live soak (`bb_l9.log`, 2026-10-08, the current CLIP_EFFECTS): 27 motions, **1 refused (L9 M27)**; started counts
agree with the file-mask bindings on every other motion (M9 / M12 / M14 / M25 / M28: 0 started).

## 1. What fires effects on List 9 — the mechanisms

### 1.1 PSL, and the enable word `0xd4532c` (uEm007_00 vt+0x13c) — R, emulated

    0xd4532c  r5 = motion; bl 0xca170                        ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xd4533c  r0 = e->vt[+0x370](e, 1)                       ; 0xa3bf4: [[e+0x1428]+0x3b4] & 1 -- P+0x3b4 bit 0
    0xd4535c  +0x13f4 |= r0 ? 0x1c0000 : 0x38000            ; EVERY motion: bits 18-20 severed / 15-17 intact
    motion <= 0x20e (0xd4541c): motion 5 or 7 and byte [[e+0x1428]+0x1ba] == 0 -> |= 0x7000000 (bits 24-26)
    0x20f..0x21f (table 0xd4539c, 17 entries):
      0x20f L2 M15 (0xd453e0): group 7, index 0xb4..0xb8 -> |= T1[idx-0xb4], bits 0-5 cleared (bfc)
                               T1 = 0x169bd20 = {0x8000000, 0x30000000, 0x30000000, 0xc0000000, 0xc0000000}
      0x213 L2 M19 (0xd454cc): group 7, index 0xb7/0xb8 -> bits 30/31 set, bits 0-5 cleared (bic 0xc000003f)
      0x216 L2 M22 (0xd45494): group 7, index 0x67, variant 4 -> |= 0x200000 (bit 21); variant != 4 popne
      0x21f L2 M31 (0xd45458): as L9 M11 below
      others: nothing more
    0x314 L3 M20 (0xd454fc): |= e->vt[+0x3f4]() ? 0x800000 : 0x400000   ; 0x7fed4: group 11 / 14 / (12,0xff)
    0x90b L9 M11 (0xd4544c -> 0xd45458): group 7, index 0xb5..0xb8 -> |= T2[idx-0xb5], bits 0-5 cleared
                               T2 = 0x1592818 = {0x30000000, 0x30000000, 0xc0000000, 0xc0000000}
    every other motion: base + the tail bits

Extents derived: the 0x20f table is bounded by `cmp r1,#0x10` (17 words, all resolve inside the method); T1 by
`cmp r1,#4` (5 words; the 6th is 0), T2 by `cmp r1,#3` (4 words; the 5th is the float 120.0). The method ends at the
shared `pop` `0xd45524`; `0xd45528/0xd4552c` are its literal pool. vt+0xf0 is the base `0xca52c` (slot read), so the
word reaches the walker unchanged.

**P+0x3b4 bit 0 = the tail is severed (R at the writer):** the only shared writer is `0xc2274` (the sever, rom-map
uEm055 row; Diablos passes kind 0x91), which ORs bit 0 when the option slot's kind byte `e+0x8b94+slot*0x14f0` is 1
(`0xc22c8`), bit 1 for 2, bit 3 for 3. (Class-specific writers at `0xde2374`, `0xf86cd0` are other classes'.)

**Emulated control** (`emu13c.py`: unicorn, `0xd4532c` with the real vtable, P block set per case; every word matches
the read): L9 M11 (7,0x5a) `0x381ff`; (7,0xb5)/(7,0xb6) `0x300381c0`; (7,0xb7)/(7,0xb8) `0xc00381c0`; L9 M10 intact
`0x381ff`, severed `0x1c01ff`; L9 M16 calm `0x381ff`, enraged `0x38e3f`, tired `0x3f03f`; L2 M15 (7,0xb4) `0x80381c0`;
L2 M22 (7,0x67) v4 `0x2381ff`, v0 `0x381ff`; L0 M7 P+0x1ba 0 `0x70381ff`, 1 `0x381ff`; L3 M20 (10,0x72) `0x4381ff`,
(11,0) `0x8381ff`.

**Whole-class positive control:** of the 35 named, switched-on PSL bits ≥ 15 in all five em007_04 PSLs, **31 are
reached by an arm above** (L0 M2/M22 b15/b18, L0 M5/M7 b24–26, L0 M16/M17 b18/19, L2 M3/M4/M20/M23/M24/M25 b15–18,
L2 M15 b27/28/30, L2 M19 b30, L2 M22 b21, L2 M31 b28/30, L3 M20 b23, L9 M10 b15/18, L9 M11 b28/30) — the method was
written for exactly these blocks. The 4 it never reaches are all u 910/911 on a motion whose arm covers only the
other bits: L2 M19 b27/b28, L2 M31 b27, **L9 M11 b27** (F).

### 1.2 Class requests (vt+0x1cc / +0x1d0) — none on List 9 (R, with control)

A sweep of the band for `[rX,#0x1d0]` / `#0x1cc]` loads finds exactly the four call sites `class-effects.json` lists
(`0xd363a4`, `0xd36620` u id 1001 = u 200; `0xd3c358`, `0xd3c460` — the group-6 body) plus FP loads and one field copy
(`0xd3bef0`, `str` to `+0x40`, not a call); branches into the shared funnels are the two `b 0xa499c` (`0xd3bfcc` u 1400
on L0 M7; `0xd3c748` u 1121, rom-map row 407). `0xd35a94` (vt+0x208) sends any motion > 0x21b through `0xd35c94`
(`motion − 0x303 > 0x12`) to the default `0xd364bc`, which requests only in **group 6** (`cmp r1,#6` at `0xd364dc`);
List 9 is played by group 7 and status-10 scripts. **Control:** the same sweep finds all four known sites (the
2026-09-30 hand read). Every `bl 0x7db70` in the band (some 90) are HIT RECORDS (rom-map row 48), not effects — see the
withdrawn rows in §8.

### 1.3 Who plays each List 9 motion (R for phase 0, from `actprobe7.py 7 0 4 7 0-0xc8`; later phases I)

| motion | actions (start frame) |
|---|---|
| M4 / M5 | body `0xd407b0` (7,0x5d)/(7,0x61) after L2 M22 f200 — later phases, I |
| M6 | (7,0x5e), (7,0x66) |
| M7 | (7,0x69) f0, (7,0x6b) f80 |
| M8 / M9 | (7,0x94) / (7,0x95) f0; (7,0x92) / (7,0x93) f40 |
| M10 | (7,0x77/0x79/0x7a/0x7b) f0 [`0xd41b48`]; (7,0x78) f180; (7,0x75/0x76) f194 |
| M11 | (7,0x5a/0x6f/0x70/0x71/0x73/0x8a/0x8d/0xb5/0xb7) f0 [`0xd421d8`, selector r1 0..8] |
| M12 / M13 | later phases of (7,0x75/0x76) [`0xd427f4`], I |
| M14 / M15 | (7,0x68) f0, (7,0x85) f6; M15 a later phase [`0xd40e38`], I |
| M16 | (7,0x62) |
| M17 | no setMotion literal `0x911` in the band; a status-10 script at `0x179a6d0` (diablos-scratch `scrpost7.txt`) — E5 |
| M18 / M19 | (7,0x98)/(7,0x99) f0; (7,0x80)/(7,0x81) f6; (7,0x9a..0x9d), (7,0xa2)/(7,0xa3) f142; (7,0xa8)/(7,0xa9) f120 |
| M20 / M21 | later phase of (7,0x9a..0x9d): `0xd442f8` r1 0 → M21, 1 → M20 |
| M22 / M23 | (7,0xa0) / (7,0xa1) f0; later phase of (7,0xa2) / (7,0xa3) (`0xd44970`, r5 0 → M22) |
| M24 / M25 | later phase of (7,0xa2)/(7,0xa3): `0xd44894` r5 0 → M25, 1 → M24 |
| M26..M30 | **(7,0xc8)**, `0xd44bf0`, phase table `0xd44c3c` (5 offsets): 0 → M26 `0xd44c50`; 1 → M27 `0xd44cb0` (at M26's end); 2 → M28 `0xd44d20` (`0xb0df4(e, 0x91c, ..)`); 3 → M29 `0xd44da8`; 4 → **M30** `0xd44e10` (at `0xbf52c` == 1), R |

A play that starts past frame 0 (f40 / f80 / f120 / f142 / f180 / f194) fires none of the bits before its start.

## 2. Group A / A\* — running (40 bindings)

| motion | bindings (bit: record, frames) — all `when: clip`, all exported | state |
|---|---|---|
| M4 | b0 u 631 f97 | A |
| M6 | b1 u 661 f19; b2 u 353 f9 | A |
| M7 | b0 c 5 f107; b1 c 41 f330–402; b2 u 370 f151/190/265; b3 u 400 f195/289 | A |
| M8 | b0 u 381 f1–45 | A |
| M10 | b0 c 22 f258; b1 u 690 f109 | A |
| M11 | b0 u 750 f8–57; b1 u 380 f1–30 | **A\***: fire in (7,0x5a/0x6f/0x70/0x71/0x73/0x8a/0x8d); **off** in (7,0xb5)/(7,0xb7) (bfc `0xd4548c`) |
| M13 | b0 c 22 f77 | A |
| M15 | b0 u 901 f0–90 | A |
| M16 | b1 u 783 f68–110/167–207; b2 u 770 f110; b3 u 600 f208; b4 u 781 f114; b5 u 782 f167 | A |
| M16 | b9 u 750 f137–210; b10 u 903 f57–113 | **A\***: bits 9–11 = **enraged only** (`0xca170`); the viewer fires them calm |
| M17 | b0 c 4 f10; b1 c 5 f102; b2 c 0 f47; b3 c 1 f38; b4 c 3 f77; b5 c 6 f202/249 | A |
| M18 | b0 u 920 f90; b1 u 600 f152 | A |
| M19 | b0 u 920 f90 | A |
| M20 / M21 / M24 | b0 u 600 f7 / f7 / f5 | A |
| M22 / M23 | b0 u 601 f139/155 (both); M23 b1 u 913 f7–177 | A |
| M26 | b0 u 914 f0–18; b1 u 350 f2 | A |
| M29 / M30 | b0 u 914 f0–16 / f0–40 | A |

## 3. Group B — exported and bound, refusing (1)

| binding | the refusal | what it is (R / I) | what it needs |
|---|---|---|---|
| **L9 M27** (refuses at f16 in an in-order soak; the binding is b0 u 914, f0–84) | `REFUSED: unverified path: 0xa6980c falls into unrecorded code`; live.js then stops every effect on the page | `0xa692a0` (lifted-particles.js) builds the rotation onto an axis; `0xa69800` tests the dot against **−0.999** and `0xa6980c` is the **antiparallel arm**, which no recording has crossed (R, the lifted body). **The caller is not identified.** Alive at the refusal (Viewer agent's soak, board 2026-10-08): **u 914 ×3 and u 350 ×2** (u 350 started on M26 f2). The lifted callers are `0xa9a788` / `0xa9ad90` (type-2 draw, lifted-draw.js), `0xaa91d8` / `0xaa946c`, and `0xa65694` / `0xa6586c` inside `0xa654a0`, which the polyline layer calls (`0xa6b1ec`, `0xa6eb58`); the ROM has 29 callers in all. Row sets (mask1, this census): u 914 = rows 19–22, 25–27 of em007_04_000 (**polyline row 22**, no type 2); u 350 = em007_00_000 rows incl. **type-2 row 24** and polylines 1 / 15 / 17. Both candidates stand (I). u 912 (also row 22) is on L2 M19, the other motion that refused on 2026-09-28; u 370 (also type-2 row 24) runs on L9 M7 without refusing | a recording that crosses `0xa6980c`. The Viewer agent's attempts (M27 alone, M26+M27, u 914 held, u 350 under a spin) did not reproduce it; their proposal is to run the ROM routine on a recorded call with the direction set antiparallel (board 2026-10-08). Recorder slot — announce |

## 4. Group C — missing, trigger READ, ready to add (11 bindings, 3 records to export)

All SEQUENCE, all on clips the viewer has with matching frame counts (`plan9.py`: every L9 row "ok"; no stage-ray
refusal).

| binding | record, efl | enable (R) | export state |
|---|---|---|---|
| **M9 b0** u 381 f1–45 | em007_00_001 | bits 0–5 always | exported (M8's binding) |
| **M10 b15** u 630 f123 | em007_04_008 | **tail intact** (P+0x3b4 bit 0 clear) | **NOT exported** |
| **M10 b18** u 631 f123 | em007_04_008 | **tail severed** | exported (M4's binding) |
| **M11 b28** u 911 f0–96 | em007_04_000 (rows 15, 19–21, 23–25, 30, 34, 35) | action (7,0xb5) [(7,0xb6) — E4] | exported (L2 bindings) |
| **M11 b30** u 912 f0–96 | em007_04_000 (rows 19–25, 30, 34, 35 — **includes polyline row 22**, B's path) | action (7,0xb7) [(7,0xb8) — E4] | exported |
| **M14 b0** c 2 f43 | cm202_002 | always | exported |
| **M16 b0** u 904 f57 | em007_04_002 (mask1 `0x4`: rung 3 builds 1 type-2, 2 model, 1 billboard) | always — **inside the file mask**; the plan's only row never exported ("54 can go in, 53 already are") | **NOT exported** |
| **M19 b1** u 600 f152 | em044_00_000 | always | exported |
| **M22 b1** u 913 f7–177 | em007_04_000 (rows 12, 14) | always | exported |
| **M25 b0** u 600 f5 | em044_00_000 | always | exported |
| **M30 b1** u 950 f9 | **em045_04_000** (Crystalbeard's file; mask1 `0x2`: 10 model, 1 billboard at rung 3) | always | **NOT exported; efl not in `docs/effects/files`** (`--apply` stages it) |

**How:** psl-mask.js CLASS_MASK for em007_04 transcribing §1.1 whole (state needs `severed` and, for Lists 0–3, the
P+0x1ba byte and the vt+0x3f4 group test); `'em007_04'` into `PSL_MASK_MONSTERS`; a `CLIP_ACTIONS.em007_04['9|Motion[11]']`
= `[{action:[7,0x5a]}, {action:[7,0xb5]}, {action:[7,0xb7]}]` (the first stands for all seven base plays) — without an
action the viewer has none to give and the action-keyed bits stay off, which leaves u 911 / u 912 unshown; then
`add_effects.py em007_04 --apply` (exports u 630 / u 904 / u 950, stages em045_04_000.efl, regenerates CLIP_EFFECTS
from the whole blocks), `--record` (recorder slot) and `--check`. **Regenerating also rewrites Lists 0–3** (19 out-of-mask
bindings there, plus the L2 M15/M19/M31 action arms and the four never-reached u 910/911 bits) — so the CLASS_MASK
function must carry every arm of §1.1, not only List 9's. em007_00 shares the class and Lists 0–3 (variant 0: the same
function without bit 21) — a separate decision.

## 5. Group D — missing, needs a shell runtime (7 records)

No `em007_*` entry in `shells.js SHELL_DATA`. Shell ef keys per mode from the arc (`effects_triage.shell_fires`, R as
data); spawn sites, modes and frames R unless marked.

| record(s) | carrier | spawn (R) | clip, frame |
|---|---|---|---|
| **u 100** (UNIQUE, em007_04_002; mask1 `0x1`: 3 model, 1 billboard, 1 node) | shell01 `0x71` (uShellEm007_04_01, **base01**) mode **0** | `0xd413bc`, mode from r6 = 0 (`0xd412d8`) | (7,0x62) **L9 M16 f116** (tune float 27) |
| — (mode 3 ef names listId −1: no record) | shell01 `0x71` mode **3** (flags `0x804` — base01's `0x800` arm) | `0xd4179c` | (7,0x69) / (7,0x6b) **L9 M7 f160** (tune 16) |
| **u 120** (UNIQUE, em007_04_007; rung 3: 7 model, 1 billboard, 1 type-2) | shell01 `0x71` modes **5 / 6** | `0xd447cc` in `0xd446dc`, **r1 = the arm's selector**: 0 → 5, 1 → 6 (`0xd4463c` from `0xd44538`, `0xd449ac` from `0xd447dc`) | (7,0xa0) **L9 M22** / (7,0xa1) **L9 M23** f154 (tune 116); also (7,0xa2) / (7,0xa3) in their M22 / M23 phase |
| **u 300** (UNIQUE, em007_04_012; 18 model, 6 billboard, 1 polyline, 1 node) | shell01 `0x71` mode **7** | `0xd44ee0` after the gate `0xd44e20` in **phase 4** of `0xd44bf0` | (7,0xc8) **L9 M30 f10** (tune 124) — **not L9 M26** (§8 withdrawn) |
| u 300 (same) | shell01 `0x71` mode 7, second site | `0xd3d1a0` in `0xd3cd40` (one caller `0xd34d28`; (7,0xb4)/(7,0xb6)/(7,0xb8) reach it with r1 0x12/0x13/0x14) | phase 0 of those plays **L2 M15**; tune 137 = f24 — not List 9 |
| **u 0 + u 1 ×3** (intact) / **u 10 + u 11 ×3** (severed) (UNIQUE em007_04_009 / _010; mask1 `0x400`) | **shell07 `0x72`** (uShellEm007_04_07, **base07**, setup cSetupParamEmBase07 size 0x30 = the `0x402014(0x30)` allocation; res `0x89c5`) | `0xd41b48` phase 1: three spawns `0xd41de8` / `0xd41e94` / `0xd41f3c`, each `0xb0974` at tune float `[tbl]` then mode `[tbl+4/0xc/0x14] + r6`; table **`0x169bc60` = {24,0, 25,1, 26,2}** (tail intact) or **`0x169bc78` = {24,3, 25,4, 26,5}** (severed, by vt+0x370(e,1) at `0xd41d1c`); **r6 = 6 when the arm's r1 == 0** (`0xd41d4c`) | (7,0x77)/(7,0x7a) modes 0,1,2 (or 3,4,5); (7,0x79)/(7,0x7b) modes 6,7,8 (or 9,10,11); **L9 M10 f128 / f132 / f134** (tune 24/25/26). No variant test on the spawn path |

**Runtime per carrier:** shell01 `0x71` is base01 (implemented), reader `0xd46770` read (spec §2b: modes 0/5/6 flags
`0x0c`, 7 flags 0, `+0x1608` per mode), request `0x3fa2bc(0x40)` read (spec §2b) — what is missing is the
SHELL_DATA em007_04 entry and base01's `+0x150`, still UNREAD (spec §2b "Landing"). **shell07 `0x72` needs base07,
which nothing implements** (two shells in the game, both em007's): its ctor, init, move and the class's reader are
unread. Its request (`0xd41d70..0xd41de8`): `+0` type word, `+4` 0x72, `+8` mode, `+0xc` enemy, `+0x10..0x18` a vec3
from a GOT slot (`[pc-rel 0xaefcb4]`, unresolved here), `+0x1c` 0, `+0x20` halfword `[[e+0x1428]+0xb0a]`.

## 6. Group E — open reads

1. **base07** (shell07): the whole base — gates u 0 / 1 / 10 / 11.
2. base01 `+0x150` (shared with every base01 shell) — whether shell01's modes have a landing.
3. `0xa6980c`'s caller in the M27 run — the polyline row 22 is the INFERRED path (§3); a recording settles it.
4. Whether (7,0xb6) / (7,0xb8) ever play L9 M11: their arm (`0xd3cd40`) plays L2 M15 at phase 0 and no `0x90b`
   literal exists in the band outside `0xd4227c` (L9 M11's own body) and the enable word — so their T2 entries are
   probably for L2 M31 / L2 M15 only (I).
5. Who plays **L9 M17**: no class-code setMotion; `scrpost7.txt` lists it under the script at `0x179a6d0` labelled
   (10,0x72), while `em007_04-sever-note.md` reads (10,0x72) → `0x179a400` → L3 M15. Not effect-blocking (its six
   bits are 0–5, always, and in the viewer).
6. The meaning of `[[e+0x1428]+0x1ba]` (L0 M5 / M7 bits 24–26, Lists 0–3 only) — needed for the CLASS_MASK function,
   not for List 9.

## 7. Group F — never fired by the game (1), with control

| binding | why (R) | control |
|---|---|---|
| L9 M11 b27 u 910 f0–96 | bit 27 is set only by T1[0] for motion `0x20f` (L2 M15, action (7,0xb4)); the `0x90b` arm reads T2, whose four words have no bit 27; the base sets nothing above 14 | emulated: no tested (action, state) on L9 M11 yields bit 27; 31 of the 35 high bits of his PSLs are reached by the same method |

Also not counted: L9 M14 b1 u 901 (in the file mask, no on-events), L9 M30 b2 u 951 (named, no events, **no record**).

## 7b. What to add, in order

1. **The enable word** (C, A\*): `psl-mask.js` CLASS_MASK em007_04 = §1.1 whole (cite `0xd4532c`, T1 `0x169bd20`,
   T2 `0x1592818`, `0xa3bf4`); state gains `severed` (default intact, i.e. bit 15); `PSL_MASK_MONSTERS += 'em007_04'`;
   `CLIP_ACTIONS.em007_04['9|Motion[11]']` (and `'2|Motion[15]'`, `'2|Motion[19]'`, `'2|Motion[31]'` with
   (7,0xb4..0xb8)); `add_effects.py em007_04 --apply`, `--record`, `--check`. Puts all 11 C bindings on screen and fixes
   the 4 A\*. A tail-severed switch for Bloodbath (no CUT_TAIL entry today) is the viewer's choice; the ROM's input is
   P+0x3b4 bit 0.
2. **L9 M27** (B): a recording that crosses `0xa6980c` (the Viewer agent's proposal: the ROM routine on a recorded call with
   the direction set antiparallel); it also covers L2 M19's 2026-09-28 refusal if that is the same arm.
3. **shell01 `0x71`** (D): SHELL_DATA em007_04 rows — L9 M16 f116 mode 0 (u 100), L9 M22 / M23 f154 modes 5 / 6
   (u 120), L9 M30 f10 mode 7 (u 300), L9 M7 f160 mode 3 (no record; the shell itself) — from spec §2b's reader map.
4. **shell07 `0x72`** (D): base07 runtime first (E1), then L9 M10's three spawns.
5. Nothing for F. The em007_04_008 rung (u 630 / u 631 / u 920 build 5 of 17 rows) stays the ROM's answer for an
   enemy outside a quest scene (board 2026-09-20).

## 8. Corrections to existing rows (→ rom-map Withdrawn)

1. **rom-map row "group-7 → clip" / spec §2d table: "`0xc8` → L9 M26 (mode 7)"**. The probe reported phase 0's clip;
   `0xd44bf0` is a five-phase machine (table `0xd44c3c`) and the mode-7 gate `0xd44e20` / submit `0xd44ee0` sit in
   **phase 4, whose motion is L9 M30** (set at `0xd44dec`). Mode 7 (u 300) spawns at **L9 M30 f10**. (Trap 19's shape:
   code order ≠ phase order.)
2. **rows "`0xd3da74` u 1034 requested" and "`0xd421b4` u 1016 requested"** (Part data section, from
   em007_04-parts-read §4): `0x7db70` arms a **hit record** (rom-map row 48; `0x70f40(unit, hitId)` — ids ≥ 1000 index
   `[unit+0x75d8]`), and `0xd421b4`'s tail `b 0x7ded8` is `0x7db70` with r3 = 0. 0x408 / 0x40a / 0x40c / 0x3f8 are
   hit ids, not effect ids. The parts-read "tension" with the record-side part reading dissolves: u 1016 / 1021 / 1034
   are break records (`0xa442c`: 999 + 5·part + level), fired by the shared break path.
3. **row "`0x72` Bloodbath only (`0xd41bb0` gate) … modes UNREAD"**: `0xd41bb0`'s variant test picks the **motion
   rate** (variant 4: `[[e+0xcac0]+0x74]`, else 1.0, into `0xb07b4` at `0xd41ff0`); the shell07 spawns have no variant
   test. Modes now READ (§5).

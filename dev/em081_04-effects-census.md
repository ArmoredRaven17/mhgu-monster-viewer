# Boltreaver Astalos (em081_04) — the complete effect census

Research agent for the Viewer agent, 2026-10-07. Raven: *"Find and add all of Boltreaver's effects."* Reads and
census only; no viewer file edited. Class `uEm081_00`, variant byte `e+0xb5f5 = 4`. Lists: **em081_04u** (his own
u.pel: SEQUENCE 43, UNIQUE 36) and **em081_00c** (his c.pel, Astalos's file: SEQUENCE 23, UNIQUE 22) — **124
records**. No other pel is reached: every shell `.shl` of his arc names only these two (below), the class has no
`+0x1cc` override and no `+0x1cc` vcall in its band, and `em081_00u` is not loaded by him.

`R` = READ (the consuming instruction read, here or in the cited file). `I` = INFERRED. Every negative carries its
positive control. Sources opened first: `dev/rom-map.md` (uEm081_00 rows, the PSL ENABLE MASK section, shell
infrastructure, traps), `dev/beams/em081_04.md`, `docs/render/motion-states.js` (MOTION_STATES / CHARGE_EFFECTS /
RAGE_PUFF / TIRED_DROOL em081_04), `docs/render/beam-spawns.js`, `docs/render/tail-option.js`, `docs/render/psl-mask.js`,
`efx/class-requests.json` / `class-request-sites.json` / `class-effects.json`, the task board.
**`E:\offline\decode\notes` was NOT mounted this session** (`states-em081_04.md`, `effects-em081_00-charge.md`
could not be opened); where a claim rests on them it is cited through the code comment that transcribes them.

## 0. Headline

| group | records | what it means |
|---|---|---|
| **A** exported and running | **71** | 45 clip − 2 (u 605 / u 606, B) + 35 event − 11 (off-list, B) + 2 ragePuff + 2 shell (beams). **But see A\*: the whole PSL layer is state-ungated** |
| **B** exported, not driven or refusing | **13** | 11 off-list by Raven's decision (blast c 1130–1137, notice c 1200/1201, water c 1500); u 605 and u 606 live only on L9 M22, which stops (rom-map `0x427e8`) |
| **C** missing, trigger READ, ready to add | **17** | PSL bits OUTSIDE the file mask: u 200 201 202 253 260 261 270 271 274 280 281 283 290 292 301 320, c 18 |
| **D** missing, needs a shell runtime | **17** | u 10 11 25 26 40 41 60 63 64 70 73 74 80 81, c 30 31 32 — no `em081_*` entry in `SHELL_DATA`; shell50 needs **base50**, which shells.js does not have |
| **E** missing, trigger unread | **0** | every missing record's firing site is read; the open reads are *inside* D (when a shell's own event runs) and are listed in §6 |
| **F** never fired by the game | **6** | u 230, u 231 (SEQ), u 110, u 111 (UNIQUE), c 50, c 51 (SEQ) |

124 = 71 + 13 + 17 + 17 + 0 + 6.

**The largest finding is not a missing record but a missing mechanism (R):** `em081_04` is not in
`psl-mask.js PSL_MASK_MONSTERS`, so his `CLIP_EFFECTS` were generated from each PSL block's *file* mask — which the
game never uses (rom-map "THE PSL ENABLE MASK": `0xca52c` overwrites it with `e+0x13f4`). His blocks name **102
switched-on bits outside the file mask** (scratch scan: every `p1 ∈ {3,4}` bit whose events turn it on), and the
in-mask bits ≥ 6 run in every state in the viewer where the game runs them in one. uEm081_00's vtable `+0x13c` is
**`0x1019eb4`: `bl 0xca170` (the base: bits 0–5 always, 6–8 calm, 9–11 enraged, 12–14 tired-and-calm), then
`ldrb [e+0xb5f5]` / `cmp #0` / `popne` at `0x1019ecc`** — for variant 4 the class adds **nothing**; the charge-keyed
bits 15–29 (`0x38000`, `0x1c0000`, `0xe00000`, `0x7000000`, `0x8000000`, `0x10000000`, `0x20000000`) are Astalos's
only. So Boltreaver's enable word is exactly `baseMask({rage, tired})`, and his row in `CLASS_MASK` is `() => 0`.
That one read puts all of group C on the screen *and* fixes A\* in the same regeneration (§7 step 1).

## 1. What fires his effects — the mechanisms (all R unless marked)

1. **PSL** (SEQUENCE records). His arc packs `em081_04_0..4` and `_9` PSLs (`effects_triage.generic`). Enable word
   = base only (above). Bits outside the file mask: **c 15 / 16 / 17 / 18, c 130, u 273 / 274 / 283 on bits 0–5
   (always)**; u 200/201/202/210/212/241/260/261/270/271/280/281/290/292/301 on 6–8 (calm) and 9–11 (enraged);
   u 211/213/253/320 on 12–14 (tired). L2 M38 bits 18 / 24 (u 260) are **never** enabled for him (`0x1019ecc`;
   control: the same method ORs bits 15–29 on variant 0, which is why Astalos's CLIP_EFFECTS use bits 15–22).
2. **Class requests**: 21 vcalls through `+0x1d0` in the band (`0x101108c..0x1034f20`), 0 through `+0x1cc`
   (control: the 21 = 4 + 8 + 9 of rom-map `0x1017d84`). Variant 4 reaches: the 9 sites of `0x1018558`
   (u 200/201/202 held + u 220 once at tier 2; u 230/231/232/241 held + u 240 once at tier 4 — CHARGE_EFFECTS), and
   **u 310** (id 1017) at a depletion of a top-charged region (MOTION_STATES L3 M2/M3/M4 `level: 4`). The id-1016
   site (u 300, `0x1012a54`) is skipped for him: **`0x10129b8 cmp #4 / beq 0x1012c3c`** — and em081_04u has no
   UNIQUE 300 anyway.
3. **Shared enemy code** (base tables `0x159c798` c / `0x159c7fc` u): breaks u 1001/1005/1010/1015 (`0xa442c`
   `999+5*part+level`), sever u 900, tail landing u 905, rage puff u 1120/1121, ailments c 1101–1105 / 1109, poison
   c 1100, dung c 1108, blast c 1130–1137 (rom-map 600: part index 0..7 — so c 1137 is part 7, not "nothing"),
   notice c 1200/1201, water c 1500.
4. **Shells.** Variant-4 id slots, **`0x1019c1c` (vt+0x158) `0x1019c64..0x1019cdc`**, folders by the resource
   table `0x159daa0` (`~crc32(path)` matched for all twelve em081 shell resources):

| slot | id | class (base) | folder | its ef keys (per mode, `.ef` data) |
|---|---|---|---|---|
| `+0xcbac` | 0x150 | uShellEm081_sp_00 (base00) | em081_04_shell00 | u 26 on 0,1,6,7,17,18,19,20,22,23; **u 52** on 13 (no record) |
| `+0xcbb0` | 0x151 | uShellEm081_sp_01 (base01) | em081_04_shell01 `[em081_04u, em081_00c]` | u 10 on 0,1,20; u 11 on 5; **c 30 / c 32 / c 31** on 11 / 12 / 13; u 81 on 29; u 80 on 30 |
| `+0xcbb4` | 0x152 | **uShellEm081_04_01** (base01) | **em081_04_shell01_02** | u 64 + u 63 on 0; u 73 + u 74 on 7, 8 |
| `+0xcbb8` | 0x153 | uShellEm081_04_02 (base02) | em081_04_shell02 | u 100 on 4, 7; u 101 on 5, 8 (the beams) |
| `+0xcbbc` | 0x154 | uShellEm081_04_11 (base01) | em081_04_shell11 | none (EffectLists empty) — a carrier of shell01 children |
| `+0xcbc0` | 0x155 | uShellEm081_sp_14 (base00) | em081_04_shell14 | u 40 + u 41 on 4, 5, 10, 11 |
| `+0xcbc4` | 0x156 | uShellEm081_sp_15 (base03) | em081_04_shell15 | u 25 on 0–3, 6, 7, 9–12, 17, 18, 20–23; **u 50** on 13, 14 (no record) |
| `+0xcbc8` | 0x157 | uShellEm081_04_50 (**base50**) | em081_04_shell50 | u 60 on 0,1,3,5,8,9,11,12,13; u 70 on 6, 7 |

   Spawn census of the band (trap 27): **58 allocations** (`0x3f883c` ×18, `0x3fa2bc` ×20, `0x3fb7bc` ×1, base03's
   `0x3fd7e0` ×18, base50's **`0x427c00` ×1**) against **29 submits** (`0x48b884`, `bl` and `b`; several allocations
   share one tail submit); every request takes its id from one of the eight slots (some through a register loaded
   once per function, e.g. `0x1032f74`'s r5), and the slot loads outside spawners are the ctor `0x1011124..`, the
   setter, a release `0x1034e30..` and id compares past `0x1034f20` (no allocator there; swept to `0x103a000`).

## 2. Group A — exported and running (71)

`when` from `docs/effects/em081_04.json` (matched record by record on pel + array + index + efl: 84 / 84).

| records | when | driver (viewer) | ROM trigger | notes |
|---|---|---|---|---|
| c 0, 1, 10, 11, 15, 16, 17, 20, 30, 40, 60, 61, 70, 100, 123, 130, 140, 150, 151, 3000 (SEQ) | clip | CLIP_EFFECTS em081_04 | PSL (plan rows) R | **A\***: c 15/16/17/130 miss their out-of-mask bindings (L2 M28/M30/M37; M28; M29/M39/M42/M43; L9 M16) |
| u 210, 211, 212, 213, 241, 242, 273, 284, 300, 310, 311, 315, 316, 321, 322 (SEQ) | clip | CLIP_EFFECTS | PSL R | **A\***: state-ungated today — L2 M48 / L4 M22 / M29 / M48 fire u 210 on bit 6 *and* bit 9 (calm and enraged) together and u 211 (bit 12, tired) when calm; L2 M20 fires u 241 (bit 9, enraged) and u 242 (bit 12, tired) when calm; L9 M12 u 212 twice + u 213; and they miss L2 M33/M34/M35, L9 M10/M17 (u 210–213), L2 M20 b6 (u 241), L2 M26 b11 (u 300), L2 M39 b9/b10 (u 321/322), L2 M40 b1 (u 273) |
| u 602, 603, 604, 630, 660, 670, 690, 691 (SEQ) | clip | CLIP_EFFECTS | PSL R (L9 / L2 M36–37 / L4 M61–62) | u 604 also binds L9 M22 (stops there, B) |
| u 200, 201, 202, 220, 230, 231, 232, 240, 241 (UNIQUE) | event | CHARGE_EFFECTS em081_04 levels 2 / 4 | `0x1018558` R | the viewer opens him at level 0; the game spawns him at 2 (comment, states-em081_04.md) |
| u 310 (UNIQUE) | event | MOTION_STATES L3 M2/M3/M4 `level: 4` | `0x1011f50` id 1017 R | |
| u 1001, 1005, 1010, 1015, u 900 | event | MOTION_STATES breaks / sever | `0xa442c`, base u table R | |
| u 905 | event | CUT_TAIL em081_04 `landing` | `0x7044c` R | |
| c 1101, 1102, 1103, 1104, 1105, 1109 | event | MOTION_STATES / TIRED_DROOL | shared R | |
| c 1100, 1108 | event | shared toggles monC1100 / monC1108 | shared R (names by Raven) | |
| u 1120, 1121 | ragePuff | RAGE_PUFF em081_04 | `0xa42a0` R | |
| u 100, 101 (UNIQUE) | shell | beam-spawns.js em081_04 (4 rows) | `0x102feb4` modes 4/5/7/8 R | `driven-split.mjs` calls them "named by no shell mode" — it does not read BEAM rows (tool gap, not a gap). Mode 8 (L9 M22) stops — B |

## 3. Group B — exported, not driven or refusing (13)

| records | why | what it needs |
|---|---|---|
| c 1130–1137 (blast), c 1200 / 1201 (notice), c 1500 (water) | undriven **by Raven's decision** (memory: "blast/notice off the list"; rom-map 537) | nothing until Raven reopens it |
| u 605, u 606 (SEQ; L9 M22 only) | **L9 M22 stops at f26**: `0x427e8` in `0x42744`, effect ground resolve with `[r4+0xec]` bit 0x10 SET, the setter NOT READ (rom-map; board "THREE CLIPS STILL STOP"); `add_effects.py` plan also refuses u 605 on the stage ray (`+0x52` / `+0x5c` bit 4, `0x18154c`) — rom-map 442 says that reason has expired (a stage floor exists) | the read of what sets `+0xec` bit 0x10, then a lift for that arm; the same stop takes u 604's L9 M22 binding and the mode-8 beam (u 101) |

Live soak results (this session): see §8.

## 4. Group C — missing, trigger READ, ready to add (17)

All SEQUENCE, all fired by his own PSLs on bits outside the file mask, all on motions the viewer has (frame counts
checked: `add_effects.viewer_motions`). State: `always` = bits 0–5, `calm` 6–8, `rage` 9–11, `tired` 12–14 (base
`0xca170`, R). Efls are Astalos's, already shipped for em081_00 (all generator types lifted per the triage).

| record | efl, joint | bindings (motion, bit, frames) |
|---|---|---|
| u 200 | em081_00_003, j131 | L2 M13 b7/b10 f2,f110; L2 M22 and L2 M47 b7/b10 f0,f90,f150,f171,f191 |
| u 201 | em081_00_003, j131 | L2 M13 b6/b9 f25–100; L2 M20 b7/b10 f30–50,f80–109; L2 M22 and M47 b6/b9 f25–62,f97–122 |
| u 202 | em081_00_003, j131 | L2 M13 b8/b11 f79–94; L2 M20 b8/b11 f40–44,f90–105; L2 M22 and M47 b8/b11 f38–56,f97–116 |
| u 253 | em081_00_019, j138 | L2 M23 b12 (tired) f88–91 |
| u 260 | em081_00_004, j−1 | L2 M25 and M26 b6/b9 f29–145,f160–170,f180–184 (L2 M38 b18/b24: never, §1) |
| u 261 | em081_00_004 | L2 M25 and M26 b7/b10 f0,f190 |
| u 270 / 271 | em081_00_004 | L2 M27 b6/b9 f50–105 / b7/b10 f0,f40 |
| u 274 | cm202_020, j9 | L2 M27 b0 (always) f71 |
| u 280 / 281 | em081_00_004 | L2 M28 b6/b9 f50–105 / b7/b10 f2,f40 |
| u 283 | cm202_021, j13 | L2 M40 b0 (always) f34 |
| u 290 / 292 | em081_00_006, j138 | L2 M24 b6/b9 f0–40 / b7/b10 f41–100 |
| u 301 | em081_00_016, j132 | L2 M25 b8/b11 f142 |
| u 320 | cm202_021, j−1 | L2 M39 b12 (tired) f7,f26,f47,f76 |
| c 18 | cm202_004, j132 | L2 M27 b2 (always) f156–175 |

**How:** (1) `psl-mask.js`: `CLASS_MASK.em081_04 = () => 0` and `'em081_04'` in `PSL_MASK_MONSTERS`, citing
`0x1019eb4` / `0x1019ecc`; (2) `python efx/add_effects.py em081_04 --apply` — it reads that list and regenerates
CLIP_EFFECTS from the WHOLE blocks and exports these 17 with `when: 'clip'`; (3) `--record` (recorder slot: announce
it, shared with the Armor Viewer agent) and `--check`. No MOTION_STATES / ACTION_EFFECTS row is needed: the class
adds no action-keyed bits for variant 4, so no `CLIP_ACTIONS` entry either.

## 5. Group D — missing, needs a shell runtime (17)

No `em081_*` key in `shells.js SHELL_DATA` (only the beam showcase rows). Every row: spawn site + mode literal R,
the action from the status-7 table (`0x1023a9c`, index = number − 1, resolved stub by stub) R, the clip and frame
INFERRED (a script over each body's `setMotion*` literals and the last frame gate before the call; not stepped).

| record(s) | carrier: shell, mode | who spawns it (R) | action / clip (I) |
|---|---|---|---|
| **u 26** (em081_00_011) | shell00 own ef, modes 0,1 / 6,7 / 17 / 18 / 20 / 22 / 23 | `0x1030024` (0x7c→0, 0x7d→1, 0x7e→2, 0xda→17, 0xdb→18); `0x1030cc8` (0x95→6, 0x96→7, 0x97→8, 0x9d→9, 0x9e→10, 0x9f→11, table `0x1030d14`); `0x102fd04` / `0x1031080` mode = table **`0x16a2200`**[r1] = {0,1,17,18,2,22,23,3,4,5,6,7,19,20,8,9,10,11,13}, else 24: 7:0xd3 r1=2 → 17, 7:0xf4 / 0xf2 r1=5 → 22, 7:0xe3 / 0xea r1=6 → 23, 7:0xdd r1=13 → 20; `0x1030b48` 0x91→3, 0x92→4 (no ef) | 7:0x7c..0x7e/0xda/0xdb body `0x102979c`; 0x95..0x9f `0x102d380` (L4 M29); 0xd3 `0x1028f6c` (L2 M48 blend); 0xf4 / 0xe3 / 0xf2 / 0xea L9 M9–M15; 0xdd `0x102990c` L4 M22. **Mode 19 (u 26): no spawn site in the band** |
| **u 25** (em081_00_011) | shell15 (base03), children | **`0x1032f74`** (called from sp_00 vt+0x150 `0x1032ed0`): by shell00's own mode (table `0x1032fb8`) 0,6→15:0; 1,7→1+2; 2,8→3; 17,19→9+10; 18,20→11+12; 13→13+14 (u 50, no record); 22→20+21; 23→22+23; and **`0x10348b0`** (sp_15 vt+0x174): own 0→6, 1/2→7, 9/11→17, 10/12→18 | rides every u 26 shell00 action; what event `+0x150` / `+0x174` are: NOT READ |
| **u 10** (em081_00_019) | shell01 modes 0, 1, 20 | `0x10306cc` mode 0 (r1 ∈ mask `0x5541`) / 16 for 0x8e, 0xc2 (no ef); `0x10308f8` mode 1 (mask `0x7541`) / 17 for 0x90, 0xc2 (no ef); `0x102fa88` sel 1 mode 0x14 (from `0x103034c` on 0x88) | 7:0x49 / 0x41 / 0x43 (L2 M27/M28/M52), 0x8d / 0x8f (L2 M27 / M28), 0xc2 (L2 M39/M50), 0x88 (L2 M23) |
| **u 11** (em081_00_019) | shell01 mode 5 | `0x102fdd8` r1 = 5 | 7:0xbe `0x1026acc` and 7:0xbf `0x10285d4` (L2 M49, f32) |
| **c 30 / c 32 / c 31** (cm200_040) | shell01 modes 11 / 12 / 13, list 1 = em081_00c | **vt+0x1a8 `0x102f44c`** (per motion id `e+0x4b4`, gate `0xb09b0`) → **vt+0x1b0 `0x102f840`** sel 4→11, 3→12, 1→13. Sel 3: L0 M24/M27/M30 f14, L1 M17 f2, L1 M19/M20 f4, L4 M34/M64 f4, L4 M25 f8,24,40,56,72,88, L4 M26 f88, L4 M27 f14,40. Sel 4: L1 M1 f8, L1 M2/M11/M12 f10, L1 M15 f15. Sel 1: L4 M32 f4 | vt+0x1a8 is called from `0x6f4e8` ← `0xae35c` (R), which runs per frame behind a global flag (I) |
| **u 80 / u 81** (em081_04_006) | shell01 modes 30 / 29, children of shell11 mode 6 | `0x103047c`: **tail tier `[e+0xcb03]` == 4** → shell11 mode 6, else tier 2/3 → shell01 22, else 21 (no ef); shell11 vt+0x168 **`0x1031f28`** (mode 6 only): point index r1 == 0 → mode 29 (u 81), else 30 (u 80) | 7:0xc7 `0x10289e8` (L4 M62–M64) at a frame gate — **Overcharged tail only**; who calls shell11 +0x168 and its point table `+0x1668`: NOT READ |
| **u 40 / u 41** (em081_00_010_s / _005) | shell14 modes 10 / 11 (rank ≥ 5), 4 / 5 (rank < 5) | `0x103034c` on 0x87: `0x3a8430` (quest rank) `cmp #5`, 10 else 4; on 0x88 → `0x102fa88` sel 1: shell01 mode 20 + shell14 11 else 5 | 7:0x87 / 0x88 (/0xbb) `0x102cc34`, L2 M23 |
| **u 60** (em081_04_004) | shell50 (base50) modes 1/9, 3, 5, 8, 11 | `0x102ff4c(e, mode)`: 7:0xd4 → 1 or 9 (condition not read); 0xf4 / 0xf2 → 3; 0xe3 / 0xea → 5; 0xd3 → `0x1028f6c` r1 = 2 → **8**; 0xee → 11 | L4 M22 f82 (0xd4); L9 M9–M15 (0xf4/0xe3/0xf2/0xea); L2 M48 f82 (0xd3); L9 M3 f188 (0xee). **Modes 0, 12, 13 (u 60): no spawn site** |
| **u 70** (em081_04_004) | shell50 modes 6, 7 | `0x102ff4c` from 7:0xcf (6) and 7:0xdf (7) | L9 M20 f140 (0xcf); L9 M8 f46 (0xdf) |
| **u 63 + u 64** (em081_04_007 / _015) | shell01_02 mode 0 | **`0x1032858`** (from shell50 vt+0x150 `0x10327c4` and +0x174 `0x1032c10`): shell50 mode in `0x3b2b` (0,1,3,5,8,9,11,12,13) → shell01_02 mode 0 | rides every u 60 shell50 |
| **u 73 + u 74** | shell01_02 modes 7, 8 | same: shell50 mode 6 → 7 (+ shell01 26, no ef), 7 → 8 (+ shell01 27, no ef) | rides the u 70 shell50 |

**Runtime per carrier:** base00 (shell00, shell14), base01 (shell01, shell11, shell01_02) and base03 (shell15) exist
in shells.js, but every em081 shell class overrides its base (vtable rows above: sp_00 +0x14c/+0x150, sp_01
+0x13c/+0x14c/+0x150/+0x154, sp_14 +0x14c/+0x150, sp_15 +0x13c/+0x14c/+0x174, 04_01 +0x14c/+0x150, 04_11 +0x14c/+0x150/
+0x168, 04_50 +0x14c/+0x150/+0x174) and none is read — each needs a spec like `em084-shells-spec.md`. **base50 has
no runtime at all** (shells.js bases: 00 01 02 02g 03 04 05 06 11 13 31 54 55). Handover: shells.js is the Shell
Agent's (task board "BLOCKED ON shells.js").

## 6. Group E — none; the reads still open inside D

1. sp_00 vt+0x150 `0x1032ed0` (which event: landing?) — gates every u 25.
2. sp_15 vt+0x174 `0x10348b0` — its event.
3. 04_50 vt+0x150 `0x10327c4` / +0x174 `0x1032c10` — when shell50 spawns its shell01_02 child.
4. 04_11 vt+0x168 `0x1031f28` — its caller and the point table `shell+0x1668` (how many u 80 / u 81 per slam).
5. 7:0xd4's mode-1-vs-9 condition (`0x102962c`), 7:0xee's (`0x102ac08`, `cmp r5,#1 / cmpeq r0,#1`).
6. Each body's exact spawn frame (the gates listed in §5 are a script's last-gate-before-call, I).
7. Whether `0xae32c` (→ vt+0x1a8) runs every frame (I) — gates c 30/31/32.

## 7. Group F — never fired (6), with controls

| record | why (R) | control |
|---|---|---|
| u 230, u 231 (SEQ, em081_00_019) | SEQUENCE is reached only by PSL (class overrides pin sel 2 = UNIQUE, rom-map `0x328ba0`; shells resolve UNIQUE); no bit of any of his PSL blocks names 230 / 231, in or out of the file mask | the same whole-block scan names 41 of his 43 SEQ u records |
| c 50, c 51 (SEQ, cm202_020) | the same | the scan names 21 of 23 SEQ c records (plus c 132, which is named but is no record) |
| u 110, u 111 (UNIQUE, em081_04_002) | not in the class table (`0x16a2054`: keys 200–241, 300, 310), not in the shared u table (900.., 1000.., 1120.., 1300.., 1400), named by no `.ef` of his eight shell folders; PSL never addresses UNIQUE | the same `.ef` scan finds u 100 / 101 on shell02 and every D record |

Also not records: c 132 (PSL L2 M14 names it; **no record in any array**, and L2 M14 is a null LMT slot — board
"DEAD PSL SITES"); u 52 (shell00 mode 13) and u 50 (shell15 modes 13/14) — keys with no record.

## 7b. What to add, in order

1. **PSL enable word** (C, A\*): `psl-mask.js` `CLASS_MASK.em081_04 = () => 0`, `PSL_MASK_MONSTERS += 'em081_04'`
   (cite `0x1019eb4`/`0x1019ecc`); `add_effects.py em081_04 --apply` (exports the 17 C records `when: 'clip'`,
   regenerates CLIP_EFFECTS from whole blocks — fixes the ungated in-mask bits and adds the missing bindings of
   c 15/16/17/130, u 210–213/241/273/300/321/322); then `--record` (announce the recorder slot) and `--check`.
2. **L9 M22** (B): read what sets `[unit+0xec]` bit 0x10 for the `0x42744` arm, lift it; this frees u 605, u 606,
   u 604's L9 M22 binding and the mode-8 beam.
3. **c 30 / 31 / 32** (D, simplest carrier): a SHELL_DATA em081_04 shell01 (0x151, base01) entry for modes 11/12/13,
   driven from the vt+0x1a8 table in §5 — needs uEm081_sp_01's overrides read first.
4. **shell00 + shell15** (u 26, u 25): sp_00 / sp_15 overrides; base00 / base03 runtimes exist.
5. **shell01** u 10 / u 11, **shell14** u 40 / u 41 (rank split: 0x3a8430 < 5).
6. **base50** for shell50 (u 60 / u 70) and its shell01_02 children (u 63/64/73/74) — a new base runtime.
7. **shell11 → shell01 29/30** (u 80 / u 81): Overcharged tail slam only; needs §6.4.
8. Nothing for F; B's off-list eleven stay off until Raven says.

## 8. Live soak (headless, `node dev/effect-live-soak.mjs em081_04`, this session)

**134 motions played, 1 refused (453 s, GPU).** The only refusal: **L9 Motion[22]** — 26 frames, 4 started, then
`REFUSED: unverified path: 0x427e8 falls into unrecorded code` (beam `em081_04:8` spawned at f2); the page logs
"live effects stopped", i.e. on the live page every effect of the monster stops there (live.js `fail()`). The three
other beam clips spawn and run: L9 M1 `em081_04:4` at f49, L9 M2 `em081_04:5` at f1–2, L9 M21 `em081_04:7` at f79.
Every other bound motion (L0, L1, L2, L3, L4, L9) runs to the end. The soak plays the CURRENT CLIP_EFFECTS (file-mask
bits, state-ungated), so it says nothing about A\* or C.

**`add_effects.py em081_04 --check` did not complete:** its per-record temp file in `docs/effects/`
(`_add_em081_04_<pid>.json`) failed `os.replace` with WinError 5 (Access denied) on the second record. I removed the
two temp files it left. Its first record's page export had already run, which grows `docs/effects/rom-pages.bin`
in place by design (that file was already modified in the tree before this session). Not retried: the live soak
above is the part of `--check` that answers "does it run"; the page check should be rerun by whoever applies §7b
step 1.

## 9. Proposed `dev/rom-map.md` rows

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x1019eb4` (vt+0x13c) | the PSL enable word: `bl 0xca170`, then **variant ≠ 0 returns** (`0x1019ecc`) — Boltreaver = base mask only; variant 0 ORs charge-keyed bits 15–29 | uEm081_00 | R | dev/em081_04-effects-census.md §0 |
| `0x1019c1c` (vt+0x158) variant 4 | shell ids: +0xcbac 0x150 shell00, +0xcbb0 0x151 shell01, **+0xcbb4 0x152 = uShellEm081_04_01 → folder shell01_02**, +0xcbb8 0x153 shell02, +0xcbbc 0x154 shell11, +0xcbc0 0x155 shell14, +0xcbc4 0x156 shell15, +0xcbc8 0x157 shell50 (res 0x8a9d..0x8aa4 by `0x159daa0`) | " | R | §1 |
| `0x10129b8` | variant 4 skips the id-1016 (u 300) discharge, `beq 0x1012c3c` | " | R | §1 |
| `0x102f44c` (vt+0x1a8) → `0x102f840` (vt+0x1b0) | per-motion frame table → shell01 modes 11/12/13 (c 30/32/31); vt+0x1a4 `0x102f134` is camera shakes (`0xc241c`), not effects | " | R | §5 |
| `0x16a2200` | shell00 mode table (19 words) for `0x102fd04` / `0x1031080` | " | R | §5 |
| `0x102fd04 0x1030024 0x1030b48 0x1030cc8 0x1031080` / `0x102f840 0x102fdd8 0x10306cc 0x10308f8` / `0x103034c 0x102fa88` / `0x103047c` / `0x102ff4c` | enemy-side shell spawners: shell00 / shell01 / shell14 (rank < 5 → 4/5) / shell11-or-shell01 by tail tier / shell50 (alloc `0x427c00`) | " | R | §5 |
| `0x1032858` / `0x1032f74`+`0x1033a90` / `0x10348b0` / `0x1031f28` | shell-side children: shell50 → shell01_02 (mask `0x3b2b`); sp_00 +0x150 → shell15 (table `0x1032fb8`) + shell01 2/3/4; sp_15 +0x174 → shell15 6/7/17/18; 04_11 +0x168 → shell01 29/30 | uShellEm081_* | R (event meaning UNREAD) | §5, §6 |
| trap | `effects_triage.py`'s "PSL: no motion fires it" is a FILE-MASK negative for any monster not in PSL_MASK_MONSTERS — em081_04 has 102 named, switched-on bits outside the mask | — | R | §0 |
| trap | `effects_triage.py`'s viewer column matches (pel, key), not array: it called SEQ u 200/201/202/230/231 and UNIQUE c 30 "wired" because the other array's record is | — | R | §2 |
| trap | `driven-split.mjs` reports beam records (u 100/101) "named by no shell mode": it does not read beam-spawns.js | — | R | §2 |
| trap | class name ≠ folder: uShellEm081_04_01 runs `em081_04_shell01_02`, and shell-map.md's "em081_04 01=0x17ed8a8" is that class, not the shell01 folder (which is uShellEm081_sp_01) | — | R | §1 |

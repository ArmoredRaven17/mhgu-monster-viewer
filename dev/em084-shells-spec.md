# em084_00 Nakarkos — the non-beam shells: who spawns them, on which clip and frame, with which mode

Research agent for the PM, 2026-10-05. Scope: every Nakarkos shell except shell02 (`0x16e`, the beams — done in
`dev/beams/em084_00.md`). Static reads with `efx/armdis.py` (and a PIC-resolving wrapper in the scratchpad
`naka_shells/dd.py`); cross-checks under unicorn with the beams lane's driver (`scratchpad/beamsD/drv.py`, arm class
registered as in `run_arm2.py`; scratch `naka_shells/sweep.py`, `run_arms.py`, `run_body.py`, `run_held.py`,
`tables.py`, `armstate.py`). The efx recorder / lift were not used. Read first: `dev/beams/em084_00.md` (in full),
`dev/rom-map.md` (shell rows, base00/01/13 rows, the Nakarkos section), `dev/em084-class-effects.md`,
`build/hitzone-states/state-decodes.md` (NAKARKOS: stance `E+0xcac4`, charge flag `E+0xcadc`, the skull forms),
the task board's Nakarkos entries (tentacle groups g0..g5 and their names), `docs/render/shells.js` (base runtimes,
`READER00` / `READERS01` / `params11` / `tick11` / `create11` / `endCreate001` / `landing04`), the arc's shell
folders and the effects triage. "Body" = `uEm084_00` (E); "arm" = `uEmOstgaloaArm`, left = kind 1 at E+0xcc00,
right = kind 2 at E+0x19750. Arm clips: motion `0x2NN` → viewer list `l_2` / `r_2` `Motion[NN]`.

---

## 0. Headline

- **Seven non-beam shells.** Every mode the arc ships has a spawn site **except shell11 modes 3 / 4 and shell13
  modes 0, 1, 10, 11, 15..22** (§7, with the control that finds all the others).
- **Five spawn systems**, all READ:
  1. body action code: shell11 mode 2 (body (7,0x43)) and shell31 0..5 (the cannon shot (7,0x33..0x35 / 0x3c..0x3e));
  2. a **body motion-record table** (`0x17f6420`, keyed by action): at a frame of a body clip it starts an
     **additive layer clip (body L2 M70..M73)** and spawns shell13 8 / 9 / 12 / 13, shell48 0 / 1 or shell00 65 / 66
     when that layer reaches frame 58 — gated by a part's break level;
  3. **arm actions, chosen by the tentacle's FORM** (the skull it carries, arm byte `+0xcb30`): shell00 (slime lobs),
     shell01 (strikes), shell11 mode 0, shell13 2..5, plus a rank-only pair (shell00 0..8) and the burrowed ground
     bursts (shell01 82..85);
  4. a per-frame **aura manager** (shell06 0 / 5 / 6), by stance, charge, part state and an arm byte;
  5. **second generation**: shell00 / shell13 landings, shell01's end, shell11's timed creates, shell48's +0x15c.
- **Runtime status:** base00, base01, base11 and base13 have runtimes in `docs/render/shells.js`, but each Nakarkos
  class has **its own reader** (and landing / end / create overrides) that are not transcribed; **base06, base31 and
  base48 have no runtime at all** (§1, §8).

---

## 1. The shells (Q1) — id, class, base, runtime

Global table `0x175c3e8` (rom-map row 104; `efx/agents/narga-shell-scratch/shelltable.json`), base = the setup DTI
(rom-map row 105). Vtables found from the class slot words in `.data` (each `+0x14c` reader is in the band, each
`+4` calls its base's dtor); the base's own slots confirm the base. READ.

| shell | id | class | setup DTI → base | vtable | own slots (overrides) | shells.js runtime |
|---|---|---|---|---|---|---|
| shell00 | `0x16c` | `uShellEm084_sp_00` | `cSetupParamEmBase00` → **base00** (init `+0x13c` `0x3f8b80`) | `0x17f6918` | reader `+0x14c` `0x1088c5c`; landing `+0x150` `0x1088e38` | base00 **exists** (`init00`, `stepRock`); needs a `READER00` entry for `0x1088c5c` and the landing's child table |
| shell01 | `0x16d` | `uShellEm084_sp_01` | `cSetupParamEmBase01` → **base01** (init `0x3fa498`, move `0x3faec4`) | `0x17f6a94` | reader `0x10891dc`; end-create `+0x154` `0x1089384` | base01 **exists** (`init011`, `step011`); needs a `READERS01` entry, its own end-create table, and base01 flag `0x20` (not in shells.js) |
| shell02 | `0x16e` | `uShellEm084_sp_02` | base02 | `0x17f6c04` | (beams lane) | done |
| shell06 | `0x16f` | `uShellEm084_sp_06` | `cSetupParamEmBase06` → **base06** (init `0x4014f8`, move `0x401a18`) | `0x17f6d80` | reader `0x1089c08`; `+0x158` `0x1089e50` (hit); `+0x15c` `0x1089d14` (angle words) | **none** |
| shell11 | `0x170` | `uShellEm084_sp_11` | `cSetupParamEmBase01` → base01 **by the rule**, but its vtable carries **base11's init `0x402fd8` and `+0x150` `0x40308c`** (move base01's `0x3faec4`) — the same shape as em001's `uShellEm001_sp_11`, which shells.js runs as `base11` | `0x17f6ee8` | reader `0x108a04c`; create `+0x168` `0x108a330` | base11 **exists** (`params11` / `tick11` / `create11`), but those are em001's reader and create; Nakarkos needs both of his own |
| shell13 | `0x171` | `uShellEm084_sp_13` | `cSetupParamEmBase13` → **base13** (every base slot equal to the base13 table `0x174f3e8` but these two) | `0x17f705c` | reader `0x108a954`; landing `+0x150` `0x108aba8` | base13 **exists** (Khezu's `init13` / `stepOrb`); needs his reader map and landing |
| shell31 | `0x172` | `uShellEm084_sp_31` | `cSetupParamEmBase31` → **base31** (init `0x413ad4`, move `0x4147a8`) | `0x17f71d8` | reader `0x108ae98` | **none** |
| shell48 | `0x173` | `uShellEm084_sp_48` | `cSetupParamEmBase48` → **base48** (init `0x426abc`, move `0x427294`) | `0x17f7338` | reader `0x108b118`; `+0x15c` `0x108b2e8` (creates shell01 10) | **none** |

**Correction to carry:** `dev/beams/em084_00.md` line 29 calls `0x170` "base01". By the setup-DTI rule it is, but its
behaviour is shells.js's `base11` (vtable `+0x13c` / `+0x150` = `0x402fd8` / `0x40308c`, identical to Rathian's
`sp_11`, whose setup DTI is also base01). The base column above gives both.

**Effect lists (READ, data):** every one of these `.shl`s except shell06 / shell31 lists two `rProofEffectList`s —
`effect\pel\em\em084_00u` then `effect\pel\em\em084_00u_r` (shell06 / shell31: `em084_00u` only) — so ef slot 0 =
`em084_00u`, slot 1 = `em084_00u_r`. **Both arms' shells use `u_r` keys** (and `u`); `u_l` is never named by a shell.
(The slot → list order is the `.shl`'s own order, which is how `gen_beam_types.py`'s `pel_of` resolves it.)

---

## 2. Census and its controls (READ)

Band `0x1064ae0..0x108b550` (body, arms, and — new — **the eight shell classes, `0x1088848..0x108b550`**).

- Submit `0x48b884`: **22** sites (`bl` and tail `b`). Every one is accounted for below; none is unexplained.
- Setup allocators (all 88 of `beamsD/setup_allocs.txt`): **31** calls, every one inside one of the spawners below.
- Shell-id literals `0x16c..0x173`: 39; the eight at `0x106501c..0x1065098` are the ctor storing ids, the rest sit in
  the spawners.
- **Positive control:** the same submit census finds the two beam sites `0x106f73c` / `0x107cb78`; the arm driver run
  over every arm status/number (kinds 1 / 2, rank 3 / 5) reproduces every row of `dev/beams/em084_00.md`.

| spawner | submits | id / modes | caller(s) |
|---|---|---|---|
| `0x106aa48` (body, per frame) | `0x106aaf8` `0x106ab8c` `0x106ae2c` `0x106af24` | shell06 5 / 6 / 0 | `0x1069bd8` in vt `+0x2a8` `0x1069b88` |
| `0x106f354(E, sel, arg)` | `0x106f668` | sel 1..16 → shell13; 17 / 18 → shell48 0 / 1; 19 / 20 → shell00 65 / 66 | `0x106a130` only (the record table, §4b) |
| `0x106f6a8` | `0x106f73c` | shell02 14 (beam) | — |
| `0x106f74c(E, n ≤ 2)` | `0x106f80c` | shell11 mode n + 2 | `0x10777c0` only, `n = 0` |
| `0x106f820(E, n ≤ 5)` | `0x106f87c` | shell31 mode n | `0x1076bd0` `0x1076be8` `0x1076c04` `0x1076c10` |
| `0x107c0cc(arm, idx ≤ 0x2f)` | `0x107c544` | shell00, mode by idx × kind × rank (tables below) | 15 arm sites |
| `0x107c628(arm, idx ≤ 0x48)` | `0x107ca3c` | shell01, mode by idx × kind (no rank) | 18 arm sites |
| `0x107ca4c` | `0x107cb78` | shell02 (beams) | — |
| `0x107cb9c(arm, 0)` | `0x107cc54` | shell11 0 | `0x1086a5c` |
| `0x107cc68(arm, 0)` | `0x107cd14` `0x107cd80` `0x107cdf0` `0x107ce5c` | shell13 2, 3, 4, 5 (request `+0x30` = 1, 2, 3, 4) | `0x1086aa4` |
| `0x107ce6c(arm, m, &pos)` | `0x107cf7c` | shell01 `m` ∈ {0x52, 0x53}; G (rank > 4) → 0x54 / 0x55 | `0x1088728` |
| sp_00 landing `0x1088e38` | `0x108906c` | shell01 0 / 1 / 6 | base00 |
| sp_01 `+0x154` `0x1089384` | `0x10895b0` | shell01 5 / 7 / 44 / 45 | base01's end `0x3fb264` |
| sp_11 `+0x168` `0x108a330` | `0x108a778` | shell01 2 / shell00 1 | base11's `+0x150` `0x40308c` |
| sp_13 landing `0x108aba8` | `0x108ad68` | shell01 0 / 6 | base13 |
| sp_48 `+0x15c` `0x108b2e8` | `0x108b3bc` | shell01 10 | base48 (when — NOT READ) |

Index → mode tables, emulated over every index (READ; `tables.py`), and checked against the jump tables:

- `0x107c0cc` (shell00): idx 0 → k1 **0** / k2 **3** (rank ≤ 4), k1 **5** / k2 **7** (G); idx 1 → **2** / **4**, G **6** / **8**;
  idx 11..13 → k1 25..27 / k2 11..13; 18..20 → 32..34 / 18..20; 40..42 → 40..42 / 52..54; 45..47 → 45..47 / 57..59
  (rank-independent); other idx → nothing. (Kind ∉ {1, 2} → mode 0x43 at rank ≤ 4 — no arc file, never reached.)
- `0x107c628` (shell01): idx 0 → **3**, 1 → **4** (both kinds); 2..4 → k1 29..31 / k2 15..17; 5..7 → 36..38 / 22..24;
  0x2b → 43 / 46; 0x30 → 48 / 57; 0x33..0x35 → 51..53 / 60..62; 0x46..0x48 → 70..72 / 76..78.

---

## 3. The tentacle FORM — what most arm shells are chosen by (READ)

The arm byte **`arm+0xcb30`** is the form the task board's tentacle table names (group g2 = form 0, g3 = 3, g4 = 1,
g5 = 2, g0 = 0xff "Base Form"; Raven's skull reading: **0 Uragaan, 1 Glavenus, 2 Ivory Lagiacrus, 3 Brachydios** —
his names, not ROM strings).

- The body keeps one byte per side, **`E+0xcb0c` (left) / `E+0xcb0d` (right)**; the arm copies its side's byte into its
  own `+0xcb30` at `0x107b8d0` (`strb r7,[r6]`, r7 loaded from `+0xcb0c`/`+0xcb0d` by kind, behind frame gates in
  some actions — the gates not transcribed).
- Writer: `0x106d994(E, side, status, number)`, called by the arm's action-change hook `0x107d850` (`0x107d898`).
  Emulated for every arm action (`armstate.py`):

| arm action | form becomes | notes |
|---|---|---|
| (7,0x1c) / (7,0x1d) / (7,0x1e) / (7,0x1f) | **0 / 1 / 2 / 3** | all `0x1086474`: **L2 M92** (the dig) |
| (7,0x07) / (7,0x08) | **1 / 3** | inline `0x1083998`: **L3 M19** (`setMotion0 0x313`) |
| (1,1), (1,0x33), (1,0x39), (6,1), (7,6), (7,0xb..0x12), (7,0x19), (7,0x1a), (7,0x25), (7,0x26) | 0xff (cleared; the old value kept in `E+0xcb10/+0xcb11`) | |
| (7,0x1b), (7,0x27), (7,0x28) | 0xff (cleared, not kept) | |

  The form-using actions copy `+0xcb30` into their own phase byte (`P+0x1a2` / `+0x1a3`) in phase 0, so the
  attack uses the form it started with. **Whether that copy precedes the clear on the same action start is INFERRED**
  (the clear is reported through the body; the arm's own byte follows the body at the gated `0x107b8d0`).
- **Issuers of the setter actions — NOT READ.** No body code-side request (`0x106e238` sweep, every body action) and
  no EMC op-00 names arm (7,0x08) or (7,0x1c..0x1f); (7,0x07) appears once, EMC g1 s85. So the viewer needs a
  **per-arm form control** (0 / 1 / 2 / 3 / none) rather than a derived one.
- Also from the save byte `[[E+0x1428]+0x5ccb]` (bits 0..3 left, 4..7 right; `0x1069190`) — an area-change restore,
  INFERRED.

---

## 4. Body spawns

### 4a. Action code (READ; driver agrees)

| body action | body clip | gate | shell / mode | condition | issued |
|---|---|---|---|---|---|
| (7,0x43) | **L0 M63** (list `0`, `Motion[63]`) | `0xb0968` op 0, `s0 = tune[15]` = **460** (`0x1077798`) | **shell11 2** (`0x106f74c(E, 0)` at `0x10777c0`) | — | EMC g1 s135 |
| (7,0x33) / (7,0x3c) | **L2 M82** (`Motion[82]_start`) | op 0, `tune[11]` = **282** (`0x1076b80`) | **shell31 1 then 0** (`0x1076bd0`, `0x1076c10`) | — | (7,0x3c) EMC g1 s227..s229; (7,0x33) none found |
| (7,0x34) / (7,0x3d) | L2 M82 | 282 | **shell31 3 then 2** (`0x1076be8`, `0x1076c10`) | — | (7,0x34) g0 s15, g1 s117; (7,0x3d) g0 s15 |
| (7,0x35) / (7,0x3e) | L2 M82 | 282 | **shell31 5 then 4** (`0x1076c04`, `0x1076c10`) | — | (7,0x35) g0 s15, g1 s116; (7,0x3e) g0 s15 |

These are the cannon's shot (state-decodes.md: L2 M82 then M83, charged by (7,0x32) L2 M81). The pair is picked by a
jump table at `0x1076bb8` on the function's r5 (0 / 1 / 2 → the pairs above, 3 → 0's pair); which action passes which
r5 was taken from the driver (every action of the row produced exactly that pair), not from the stubs. The same
actions order the arms (7,0x14) / (7,0x15).

### 4b. The body's motion-record table (READ)

- Per frame (vt `+0x2a8` `0x1069b88` → `0x1069e78`). At every action start the action-change hook (vt `+0x204`
  `0x1066c14`, at `0x10673a8..0x1067430`) zeroes six slots `E+0xcb38..+0xcb67` and points **`E+0xcb30`** at the entry of
  table **`[E+0xcb34]` = `0x17f6420`** (written only at `0x107a964`, from `0x1065ab0`) whose bytes 0 / 1 equal the action
  (status, number); entries `{u8 status, u8 number, .., ptr}` (8 bytes), terminator byte 0xff.
- Each entry's records (`0x18` bytes): `+0` **body motion** (tested with `0xb0950` = the current motion), `+4` **type**,
  `+8` **frame** (float), `+0xc` **sel** (→ `0x106f354`), `+0x10` **arg**, `+0x14` flags; list ends at type −1.
- Frame test: flags bit 0 clear → `0xb0974(E, f)` on the body clip; **set → a clock `E+0xcb68`** (`+= 0xb0900(E) ×
  [E+0x1c]` each frame, previous in `+0xcb6c`, fires when prev ≤ f < cur), reset to 0 by body vt `+0x3d8` `0x106ca78`
  — which the setMotion family calls with the motion id (rom-map row 328 for `0xafef0`), so it is **the frames since
  the clip was set**, not wrapping on a loop (that every setMotion variant calls vt `+0x3d8` is INFERRED from that row).
- **Type 0..3 (all records here) do not spawn at the record's frame.** At the frame (switch `0x1069f78`, table
  `0x1069f98`), if the part check passes and slot[type] is free: slot = 1, and **body vt `+0x78` = `0x72630` → `0x951678`
  (the layer setMotion) plays motion `0x246 + type` on layer `type + 2`** (start 0, weight 1.0). Then (second loop,
  `0x106a0bc..`) when that layer's frame `[E+0x730 + 0x140·type + 0x4c]` (= layer `+0x4fc`, rom-map row 68) is **≥ 58.0**:
  slot = 2 and **`0x106f354(E, sel, arg)`**; the slot frees when the layer clip ends (`0x94dc04`). So **the shell comes
  58 layer frames after the record's frame** (one layer frame per body frame at the default rate — INFERRED). Types 4 / 5
  would spawn at once (`0x106a0d4..0x106a0e0`, `type & ~1 == 4`); the table has none.
- Part check (`0x1069fe8..0x10a030`): `0x9d36c(E, part)` (break level) **<** byte +1 (rank ≤ 4) / +2 (G) of row `sl` of
  `[[E+0x75f0]+0x64]` (the `.dtp` A array; `efx/agents/diablos-scratch/dtp.py em084_00`: 184/184 EXACT):

| type | layer clip (body list `2`) | layer | part | limit (≤4 / G) — `.dtp` A row |
|---|---|---|---|---|
| 0 | **L2 M70** (`0x246`) | 2 | 4 | 4 / 4 — row 3 `04 04 04 83` |
| 1 | **L2 M71** (`0x247`) | 3 | 4 | 4 / 4 — row 3 |
| 2 | **L2 M72** (`0x248`) | 4 | 3 | 3 / 3 — row 1 `03 03 03 02` |
| 3 | **L2 M73** (`0x249`) | 5 | 2 | 3 / 3 — row 0 `02 03 03 01` |

  (Byte 0 of each row is the part the code passes — 4 / 3 / 2 — which corroborates the row read.) Which body parts
  2 / 3 / 4 are (blowholes / back plates by the board's labels) is not read; unbroken passes.
- `sel` → shell: 1..12 → shell13 **8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20**; 13 / 14 → shell13 **0 / 1**; 15 / 16 →
  shell13 **21 / 22**; 17 / 18 → **shell48 0 / 1**; 19 / 20 → **shell00 65 / 66** (`0x106f354`, table `0x106f384`).
  shell13's request: alloc `0x4041a8(0x40)`, `+0x10..+0x18` and `+0x20..+0x28` the zero vector, **`+0x30` = arg**,
  `+0x34` 0xffff; shell48: `0x4266a0(0x18)`, `+0x10 / +0x14` = 0; shell00: `0x3f883c(0x30)`, zero vectors, `+0x2e` 0xffff.

**The table, transcribed** (every record; "f" = the record's frame, the shell ≈ f + 58; clip lists are the body's):

| body action | body clip | f (clock = flag 1) | type → layer clip | shell / mode (arg) | issued |
|---|---|---|---|---|---|
| (1,0x0c) | L0 M1 | 40 (clock) | 1 → L2 M71 | shell48 **0** | EMC g1 s88, s205 |
| | L0 M1 | 100 (clock) | 0 → L2 M70 | shell48 **1** | |
| (1,0x0d) | L0 M1 | 40 / 100 / 190 (clock) | 1 / 0 / 1 | shell48 0 / 1 / 0 | g1 s88, s205 |
| (2,0x06) | L0 M8 | 40 / 100 (clock) | 1 / 0 | shell48 0 / 1 | g1 s79 |
| (2,0x07) | L0 M4 | 40 / 100 / 190 (clock) | 1 / 0 / 1 | shell48 0 / 1 / 0 | g1 s79 |
| (2,0x3a) | L0 M50 | 0 / 40 (clock) | 1 / 0 | shell48 0 / 1 | g1 s236 |
| (7,0x0c) | L0 M2 and L0 M3 | 0 / 60 (clock) on each | 1 / 0 | shell48 0 / 1 | g0 s35, s36 |
| (7,0x0a) | L0 M8 | 100 (clock) | 0 | shell48 1 | g0 s35 |
| | L0 M4 | 0 / 200 (clock) | 2 → L2 M72 | **shell00 65** (×2) | |
| (7,0x0d) | L0 M8 | 100 (clock) | 0 | shell48 1 | g0 s36 |
| | L0 M4 | 0 / 200 (clock) | 3 → L2 M73 | **shell00 66** (×2) | |
| (7,0x0e) | L0 M1 | 100 / 300 / 500 (clock) | 2 | **shell13 13** (arg 0 / 1 / 2) | g0 s35 |
| (7,0x0f) | L0 M1 | 100 / 300 / 500 (clock) | 3 | **shell13 12** (arg 0 / 1 / 2) | g0 s36 |
| (7,0x00) | L2 M23 | 130 / 140 (clip) | 1 / 0 | **shell13 8** (arg 0) / **9** (arg 1) | EMC g1 s17 |
| | L2 M24 | 30 / 40 / 110 (clip) | 3 / 2 / 0 | **shell13 12** (2) / **13** (3) / **9** (4) | |
| (7,0x06) and (7,0x07) | L2 M23 | 10 / 50 (clip) | 1 / 0 | shell13 **8** (0) / **9** (1) | g1 s84 / s85 |

  A record whose slot is still busy (its layer clip not ended) is skipped — (7,0x00)'s second type-0 record at L2 M24
  f110 needs layer 2 free again. The driver sweep does not run vt `+0x2a8`, so these rows are static reads only.

### 4c. shell06 — the aura manager (READ; conditions as in state-decodes.md, extended)

`0x106aa48(E)`, every frame. Three handles: **`E+0xcbbc` = mode 5 (left), `E+0xcbc0` = mode 6 (right), `E+0xcbc4` =
mode 0 (body)**; a missing one is spawned (alloc `0x40137c`, id `0x16f`, owner E, nothing else in the request), an
unwanted one is ended (`0x1089c00`). Arm byte `[arm+0xcad8]` (`0x107dccc`; set in arm status 2 / 6 code, cleared by arm
(7,0x29..0x2c); meaning NOT READ). Part state = `[[E+0x1428] + 0x3c8]` (left) / `+0x3bc` (right); 3 = the tentacle
"Exposed" state of the board's group g1.

| case | left aura (5) | right aura (6) | body aura (0) |
|---|---|---|---|
| A: `E+0xcb14 == 2`, or charge flag `E+0xcadc != 0`, or the action is (7,0x33..0x35 / 0x3c..0x3e), (10,0x0d / 0x14 / 0x5f / 0x6a / 0x72 / 0xaf), group 11 or 13 | on unless left `+0xcad8 == 1` | on unless right `+0xcad8 == 1` | off |
| C, stance `E+0xcac4 == 1` | on, unless left `+0xcad8 == 1` **and** left part state 3 | same, right | off |
| C, stance ≠ 1 | off | off | **on unless either part state is 3** |

  shell06 data: mode 0 joint **1**, offset (0, 0, 800); mode 5 joint **200**, mode 6 joint **203** (the arm sockets),
  offset (0, −150, −300); all `u` 40 / 41 / 42 (`em084_00_002`). Stance 1 / 2: state-decodes.md (init: 2 when
  `0x3a8430 > 4`, else 1; per-action table there). The body aura also drives the Face's damage row (state-decodes.md).

---

## 5. Arm spawns (READ statically; every row also driven — §5c)

"k1 / k2" = left / right arm. Gates are frame crossings on the ARM's clip (`0xb0974`, or `0xb0968` op 0); tune floats
are the BODY's `em084_00_actiontune` read through `[arm+0xcadc]`. Form = `arm+0xcb30` (§3); "—" = no condition.

| arm action | arm clip (`l_2` / `r_2`) | form | frame | shell / mode k1 / k2 (rank ≤ 4 ; G) | code | issued by the body |
|---|---|---|---|---|---|---|
| (7,0x09) | **M9** blended with **M10** (`0xb03f8`, weight `0x107de38(arm,0)`) | 1 | **110** | shell01 **29, 30, 31** / **15, 16, 17** | `0x1084c94..cac` | left (7,0x97), right (7,0x65) |
| | | 3 | 110 | shell00 **25, 26, 27** / **11, 12, 13** | `0x1084d18..d30` | |
| (7,0x0a) | **M21** | 1 | **190 / 235 / 280** | shell01 **36 / 37 / 38** ; **22 / 23 / 24** | `0x1084fdc..101c` | left (7,0x98), right (7,0x66) |
| | | 3 | 190 / 235 / 280 | shell00 **32 / 33 / 34** ; **18 / 19 / 20** | `0x10850cc..10c` | |
| (7,0x0b) | **M1** blended with **M2** (weight `0x107de38(arm,1)`) | — | `tune[1]` = **120** | shell00 **0 / 3 ; G 5 / 7** | `0x10853d8` | left (7,0x9a), right (7,0x68) |
| (7,0x25) | **M50** blended with **M51** (weight `0x107de38(arm,4)`) | — | `tune[8]` = **108** | shell00 **2 / 4 ; G 6 / 8** | `0x1087b68` | left (7,0xfd), right (7,0xcb) |
| (7,0x17) / (7,0x18) | phase 0 **M101**; phase 2 **M102** blended with **M104**, re-blended every pass | 1 | **30 (k1) / 56 (k2)** of each M102 pass | shell01 **48 / 57** | `0x1086400` | (7,0x17): (7,0x37/0x3a/0x46/0x48); (7,0x18): (7,0x38/0x3b/0x47/0x49) — both arms |
| | | 2 | same | shell01 **43 / 46** | `0x1086440` | |
| | | 3 | same | shell00 **42 / 54** | `0x1086420` | |
| (7,0x1b) | **M93** | 0 | `tune[4]` = **246** | shell01 **3** | `0x108693c` | left (7,0x59/0x5c), right (7,0x54/0x5b) |
| | | 1 | 246 | **shell11 0** | `0x1086a5c` | |
| | | 2 | 246 | shell01 **4** | `0x1086a78` | |
| | | 3 | 246 | **shell13 2, 3, 4, 5** (request `+0x30` 1..4) | `0x1086aa4` | |
| (7,0x23) / (7,0x27) | **M62** blended with **M65** (weight `0x107de38(arm,3)`) | 1 | **146** (literal) | shell01 **29, 30, 31** / **15, 16, 17** | `0x1087278..738c` | (7,0x23): left (7,0xfb), right (7,0xc9); (7,0x27) NOT found |
| | | 2 | 146 | shell01 **43 / 46** | `0x108738c` | |
| | | 3 | 146 | shell00 **40, 41, 42** / **52, 53, 54** | `0x1087350..368` | |
| (7,0x24) / (7,0x28) | **M74** | 1 | **360 / 390 / 420** | shell01 **51 / 52 / 53** ; **60 / 61 / 62** | `0x10876d8..778` | (7,0x24): left (7,0xfc), right (7,0xca); (7,0x28) NOT found |
| | | 2 | 360 / 390 / 420 | shell01 **70 / 71 / 72** ; **76 / 77 / 78** | `0x1087738..778` | |
| | | 3 | 360 / 390 / 420 | shell00 **45 / 46 / 47** ; **57 / 58 / 59** | `0x10875a4..5e4` | |
| (7,0x2d) / (7,0x2e) | **M92** set at **frame 300, rate 0** (frozen; `setMotion0(arm,0x25c,0,300)` + `0xb07b4(arm,0)`) | — | **60 frames into the action** (timer `P+0x1c0` = 60.0 by `0x7206c`) | shell01 **82 / 83** (2d / 2e) ; **G 84 / 85** — both arms alike | `0x1088728` | NOT found |

Notes on the rows:
- (7,0x17)/(7,0x18) `0x1086068`: phase 0 M101 (`P+0x1a2 = 0`); at its end the blend M102 + M104 with weight =
  body tune float from a per-kind table (k1: (7,0x17) 69, 71, 73; (7,0x18) 75, 77, 79, 81, 83 — `0x161f29c` /
  `0x16a2dcc`; k2 the even indices 68.. / 74..; values 0.5 / 1.0 alternating; after the −1 entry weight 0.0). At the
  end of every pass the arm re-blends (the clip restarts at 0, `s1 = 0`), so **one shell per pass**, until the BODY plays
  **L2 M103** (`0xb0950(body, 0x267)`), when the arm plays M103 and stops. The arm's yaw word `+0xcb08` = (1 − w) ×
  (+90° k1 / −90° k2) (`0x1086460`). So the viewer row is "each pass of M102", not one frame.
- (7,0x2d)/(7,0x2e) `0x10884a4`: the spawn point is **computed**: the arm's target slot `P+0x1d0..+0x1d8` plus an offset
  picked by `[arm+0xcac8]` (0 → (1000, 0, 0), 1 → (−1000, 0, 0), 2 → (0, 0, 2000); 0xff → none), its horizontal distance
  from the BODY's position clamped into **[1400, 5500]** (`0x1088610..0x108867c`), **y = 0**. Request `+0x10` = that
  point, `+0x30..` the zero vector. The action ends at timer `P+0x1bc` = 180 (`0x107e628`).
- (7,0x0b) also blends; (7,0x09)/(7,0x0a)/(7,0x23)/(7,0x24) run speed windows (`0xb07b4`) between the gates — the arm
  frame numbers above are the clip's own frames, which is what the gates test.
- All arm shell00 requests: `+0x10` and `+0x20` the zero vector (`0x19176b0`, `0x1620e60`), `+0x2e` 0xffff, owner = the
  arm. All arm shell01 requests (`0x107c628`): `+0x10..` = **`[arm+0x1428]+0x40`** (the arm's own block position),
  `+0x30..` = **`[arm+0x1428]+0x50..+0x58`** (its angle words), `+0x3c` 0xffff — the em007 0x40-byte layout.

### 5c. Driver cross-check

`run_arms.py` (every arm status 0/1/2/6/7 × number 0..0x4f, kinds 1/2, rank 3/5, form left at 0) found the form-free
rows (7,0x0b), (7,0x25) and (7,0x1b) form 0 with the frames and modes above, plus every beam row. `run_held.py` with the
form forced to 0 / 1 / 2 / 3 / 0xff reproduced every form row of the table for (7,0x09), (7,0x0a), (7,0x17), (7,0x18),
(7,0x1b), (7,0x23), (7,0x24), (7,0x27), (7,0x28) (form 0 / 0xff → no spawn where the table says none). (7,0x2d/2e) does
not spawn in the driver because its timer `0x7206c` is stubbed — the static read stands. The driver's clip ends use the
BODY's list 2 lengths for arm motions (it keys `em084_00` list `2`, not `l_2`), so multi-pass counts were not taken
from it.

---

## 6. Second generation (READ)

| parent | when | child | where / angles |
|---|---|---|---|
| shell00, landing `+0x150` `0x1088e38` (entered `(shell, &point, r2, type)`, runs only with `[shell+4] == 1`) | contact **type 1** (the stage — rom-map row 178's reading of em004's same-shaped landing) | shell00 0, 2..8, 65, 66 → **shell01 0**; 1 → **shell01 1**; 11..13, 18..20, 25..27, 32..34, 40..42, 45..47, 52..54, 57..59 → **shell01 6**; others none | the contact point (`+0x10`), the parent's angle words `+0xfe8..` (`+0x30`), `+0x3c` = parent `+0x13dc` |
| | every type | the landing effect `0x3f8970(shell, ef, point)` with ef = `+0x15cc` (type 0) / `+0x15d0` (type 1) / `+0x15d4` (type 2), then vt `+0x148` (the end) | |
| shell13, landing `+0x150` `0x108aba8` (runs only with `[shell+4] == 2`) | type 1: first `0x43b1a0` → angle words `+0x167c..+0x1684` from the ground normal; then, owner active and mode in mask `0x7fbf3f` | shell13 0, 1, 8..13, 15..22 → **shell01 0**; 2..5 → **shell01 6** (table `0x16a2e00`) | the contact point, the ground-normal angles |
| | every type | base13's landing effect `0x4042bc(shell, ef, point)`: ef = `+0x15cc` / `+0x15d0` / `+0x15d4` by type | |
| shell01, `+0x154` `0x1089384` (base01's end) | at its end | 4 → **5**; 6 → **7**; 43, 46 → **44**; 70..72, 76..78 → **45** (table `0x10893b0`) | the shell's own position `+0x40..`, **its own angle words** (unlike Rathian's `endCreate001`, which uses (0,0,0)) |
| shell11, create `+0x168` `0x108a330(shell, k)` (called by base11's `+0x150` per time) | mode 0 | **shell01 2** (literal `0x16d`) | base point + (sh vec k turned by the Y word `+0x166c`); angles `+0x1668..+0x1670` |
| | modes 2, 3 | ef `+0x1664` (= ef 0) at the point (`0x4a10c8` / `0x4a11e4`), then **shell00 1** with request `+0x10` = the point | base point + turned sh vec k |
| | mode 4 | the same, at **sh vec k itself** (not added to anything) | |
| shell48, `+0x15c` `0x108b2e8(shell, &point)` | when base48 calls it — NOT READ | **shell01 10** | the point, the shell's angle words |

shell11's reader `0x108a04c` (base11's table): count = sh int 0 (`+0x1658`), times `+0x1654[k]` = **(k+1) × float 3 for
modes 2..4**, **float k for mode 0**; base point `+0x1680` = joint int 2's position (`0xc164c`) or, int 2 = −1, the
owner's `+0x40`; `+0x1668..` = the owner's angle words; flags `+0x15ec` bit 0 = int 1, bit 1 = int 3; `+0x15e4` = int 2;
`+0x1690` = int 4 ≠ −1. So: **mode 0** (arm (7,0x1b), form 1): 3 creates at **0 / 12 / 24** from the ARM's joint 12,
offsets (0,0,0), (700,0,700), (1400,0,1400); **mode 2** (body (7,0x43) f460): **20 creates every 150 frames** (150..3000)
around the BODY's position at the sh vecs (±2500 / ±1500 / ±1000 rings). Lifetime = last time + 10 (`0x402fd8`, as
shells.js `params11`). The chain for mode 2: **ef u 21 + shell00 1 at each point → shell00 1 falls from 7000 above
(gravity −1.2, flight 1000) → lands → shell01 1 (u 3)**.

---

## 7. Modes with no spawn site (named negatives)

Arc modes (`_ef###` / `_sh###`): shell00 0..8, 11..13, 18..20, 25..27, 32..34, 40..42, 45..47, 52..54, 57..59, 65, 66 —
**all spawned**. shell01 0..7, 10, 15..17, 22..24, 29..31, 36..38, 43..46, 48, 51..53, 57, 60..62, 70..72, 76..78, 82..85 —
**all spawned**. shell06 0, 5, 6 — all. shell31 0..5 — all. shell48 0, 1 — all.

- **shell11 3, 4**: `0x106f74c` makes `n + 2` and has one caller, `n = 0` (`0x10777bc mov r1,#0`).
- **shell13 0, 1, 10, 11, 15..22**: `0x106f354` reaches them by sel 3, 4, 7..16, and its one caller takes sel from the
  record table, whose only instance (`0x17f6420`, one writer of `E+0xcb34`) uses sel 1, 2, 5, 6, 17..20 only; the arm
  spawner `0x107cc68` makes 2..5 only.
- **Control:** the same reads find every other mode of all seven shells, including every shell00 / shell01 mode, and
  the submit census reproduces the beam lane's two sites.

---

## 8. What each shell needs from the viewer (Q3), and its reader map (READ unless marked)

Reader maps: getter → field (`0x4a22f0` ef, `0x4a23f4` hit int, `0x4a2470` int, `0x4a24f8` float, `0x4a2584` vec,
`0x4a2378` `_snd` int; rom-map rows 111..115, 189).

- **shell00 (base00)** — reader `0x1088c5c`: ef 0..3 → `+0x15c8` (start) / `+0x15cc` / `+0x15d0` / `+0x15d4` (landing by
  type 0 / 1 / 2); hit 0 → `+0x15d8`; **joint = int 0** (`+0x15dc`); flags `+0x15e8` (base00's ctor word 0): **bit 3 iff
  int 3 ≠ −1, bit 0x10 iff int 1 ≠ −1, bit 0x20 iff int 2 ≠ −1**; **degX = float 0** (`+0x15ec`), **degY = float 1**
  (`+0x15f0`), **vz = float 3** (`+0x15f4`), **vy = float 2** (`+0x15f8`), **flight = float 4** (`+0x15fc`); **vec = sh vec 0**
  (`+0x1610`), **gravity = sh vec 1** (`+0x161c`). In shells.js's `init00` names: joint 12 on modes 0..8 and 11..59 (the
  ARM's joint 12 for arm spawns), 212 / 213 on 65 / 66 (body); flags 8 (modes 0, 2..59), **0x18 on mode 1** (the
  request-position arm `0x3f8d88`, which `init00` keeps "unexercised" — mode 1 exercises it), 0 on 65 / 66. Needs: the
  owner's joint matrix (arm or body), the owner's angle words (0x20 is never set), the stage for the landing (type 1 →
  shell01 child), flight timer. Modes 11..59 have flight 0.0 and gravity (0, −0.5, 0) — they end by landing (what base00
  does with flight 0 is not read here).
- **shell01 (base01)** — reader `0x10891dc`: ef 0 → `+0x15c8`, ef 1 → `+0x15d0`; hit 0 → `+0x15d8`; flags `+0x15ec`:
  **bit 0 = int 0, joint `+0x15e4` = int 1, bit 1 = int 2, bit 2 = int 3, bit 3 = int 4, bit 0x800 = int 5, bit 0x20 =
  int 6**; **timer = float 0** (`+0x15f0`); **vec = sh vec 0** (`+0x1608`), **sh vec 1 → `+0x160c`** — the degree offset
  base01's init adds to the angle words (`init011` assumes `+0x160c` is the ctor's zero; here it is (0, ±30..±90, 0) or
  (−90, 0, 0)). No mode sets 0x800 (int 5 = −1 everywhere). **Bit 0x20** (int 6 = 0 on 15..38, 48, 51..53, 57, 60..62,
  82..85) is a base01 bit shells.js does not know — NOT READ. Needs: joint 12 of the ARM (modes 3, 4, 15..78), the
  ground snap (stage, bit 2) and ground-normal angles (bit 3) on 2, 4, 15..78, timers 120 / 300 / 220, the end-create
  table (§6). Modes 82..85: a ground point near the **target** (§5, (7,0x2d)), pitched −90°.
- **shell06 (base06, no runtime)** — reader `0x1089c08`: ef 0 → `+0x15c8`; hit 0 → `+0x15cc`; **joint = int 0**
  (`+0x15d0`); flags `+0x15ec` bit 0 = int 1, bit 2 = int 2; floats 0 / 1 → `+0x15d4` / `+0x15d8`; vec 0 → `+0x15dc`,
  vec 1 → `+0x15e8`. `+0x15c` `0x1089d14`: angle words = **the joint's matrix as Euler** (`0xc15a4`, `0x7c3a38`) when
  bit 0 is clear (modes 5 / 6), else **the owner's angle words + vec 1 in degrees, per component** (`uxtah`, mode 0).
  `+0x158` `0x1089e50`: the hit registration. Needs: a base06 runtime (persistent, joint-attached; how base06 places
  and ends it is NOT READ), the body joints 1 / 200 / 203, and §4c's state (stance, charge, part states, arm byte).
- **shell11 (base11 shape)** — reader and create in §6. Needs: em001's `tick11` with Nakarkos's own table and create;
  the owner's joint 12 (arm) or position (body); the stage for the shell01 2 children (ground snap) and for shell00 1's
  fall.
- **shell13 (base13)** — reader `0x108a954`: ef 0 → `+0x15c8`, ef 1 → `+0x15d0`, ef 2 → `+0x15cc`, ef 3 → `+0x15d4`;
  hit 0 → `+0x15d8`; **joint = int 0** (`+0x15e4`); flags `+0x15e0`: bit 1 = int 1, bit 2 = int 2, **bit 0x200** = int 3;
  int 4 → `+0x15e8`; floats 0, 1, 2, 3, 4, 5 → `+0x15ec`, `+0x15f0`, `+0x15f8`, `+0x1600`, `+0x15fc`, `+0x1610`; vec 0 →
  `+0x161c` and `+0x1620`, vec 1 → `+0x162c`, vec 2 → `+0x1628`; int 5 ≠ −1 → byte `+0x1670`. Not Khezu's map
  (`params13`); base13's thrown-at point (`+0x168` `0x405500`, shells.js) needs a **target**. Request `+0x30` carries
  the record's arg (0..4) / 1..4 from the arm — **its consumer is NOT READ**. Joints: 210 / 211 (modes 0, 1, 8, 9, 15,
  16, 21, 22), 6 (10, 11, 17, 18), 212 / 213 (12, 13, 19, 20) of the body; 12 of the arm (2..5, with vec 2's yaw
  0 / 90 / 180 / 270 — four directions). Needs the stage (landing → shell01 child, ground-normal angles).
- **shell31 (base31, no runtime)** — reader `0x108ae98`: ef 0 → `+0x15c8`; `_snd` int 0 → `+0x15cc`, `_snd` int 1 →
  `+0x15d0` (stored as a float); hit 0 → `+0x15d4`; int 0 → `+0x15d8`; floats 0..3 → `+0x15dc`, `+0x15e0`, `+0x15e4`,
  `+0x15e8`; vecs 0..4 → `+0x15ec`..`+0x15fc`. Data: life-like float 0 = 1000; modes 2..5 floats 240 / 412 and vec 4
  (0, ±0.35, 0) — a sweep; mode 1 / 3 / 5 vec 2 (0, 0, 20000). What base31 does with them is NOT READ (no runtime).
  Spawned in pairs (odd = u 101 `em084_00_062_s`, even = u 100 `em084_00_064`) at the body.
- **shell48 (base48, no runtime)** — reader `0x108b118`: ef 0..3 → `+0x15c8..+0x15d4`; hit 0 → `+0x15d8`; ints 0..2 →
  `+0x15dc` / `+0x15e0` / `+0x15e4` (data: 0 or 1, joint 211 / 210, 3); floats 0..7 → `+0x15e8..+0x1604` (3000, 34, 76,
  2000, 500, 8000, 800, 8); vec 2 → `+0x1608`, vec 3 → `+0x160c`. Base48 NOT READ; its `+0x15c` makes shell01 10.

Effects per mode (ef records; `u` = `em084_00u`, `u_r` = `em084_00u_r`): shell00 0..4 u 1 / landing u 2; 5..8 u 4 /
u 5; 11..59 u_r 30 / landing u_r 35; 65 / 66 u 10 / u 2. shell01 0, 1, 10 u 3; 2 u_r 10; 3 u_r 0; 4 u_r 20; 5 u_r 21;
6 u_r 31; 7 u_r 32; 15..62 u_r 13 + u_r 14; 43 / 46 / 70..78 u_r 24; 44 / 45 u_r 25; 82 / 84 u 36 + u 35 / u 38 + u 37;
83 / 85 u 116 + u 115 / u 118 + u 117. shell06 u 40 / 41 / 42. shell11 0 u_r 10, 2..4 u 21. shell13 0, 1, 8..22 u 10 /
u 2; 2..5 u_r 30 / u_r 35. shell31 u 100 / u 101. shell48 u 10 / u 2. ShellScale per mode in the scratch dump
(`naka_shells/arcmodes.json`): e.g. shell00 5..8 = 2.0, shell13 0 / 1 and shell48 = 2.2, shell01 10 = 2.0.

---

## 9. Issuers (code-side requests; EMC op-00 hits from `em084_00_cmdtbl`)

Body → arm requests (`0x106e238`, hooked in a driver sweep of every body action, ranks 3 and 5): (7,0x97..0x9d) → left
arm (7,0x09..0x0e) and (7,0x65..0x6b) → right arm (7,0x09..0x0e) (body plays L0 M1); (7,0xfb..0xfd) → left (7,0x23..0x25),
(7,0xc9..0xcb) → right (7,0x23..0x25) (body L0 M50); (7,0x59) / (7,0x5c) → left (7,0x1b), (7,0x54) / (7,0x5b) → right
(7,0x1b) (body L0 M50); (7,0x37/0x3a/0x46/0x48) → both (7,0x17), (7,0x38/0x3b/0x47/0x49) → both (7,0x18) (body L2 M101
→ M102); (7,0x50..0x53) → left (7,0x1a) / right (7,0x19), (7,0x55..0x58) the reverse, (7,0x5a) both (7,0x19);
(7,0x33..0x35 / 0x3c..0x3e) → both (7,0x14 / 0x15). EMC op-00 for those body actions: (7,0x97) g1 s11, (7,0x98) s12,
(7,0x9a) s13, (7,0x9b) s14, (7,0x9c) s15, (7,0x65) s5, (7,0x66) s6, (7,0x68) s7, (7,0x69) s8, (7,0x6a) s9, (7,0xc9)
s105, (7,0xca) s105 / s106, (7,0xcb) s107, (7,0xfb) s109, (7,0xfc) s109 / s110, (7,0xfd) s111, (7,0x54) s128 / s235,
(7,0x59) s134, (7,0x5b) / (7,0x5c) s221, (7,0x37) / (7,0x38) s119 / s211, (7,0x3a) / (7,0x3b) / (7,0x48) / (7,0x49) s223,
(7,0x46) / (7,0x47) s120 / s211; (7,0x9d), (7,0x6b), (7,0x33) none.

**NOT found (no code-side request, no op-00):** arm (7,0x27), (7,0x28), (7,0x2d), (7,0x2e), and the form setters
(7,0x08), (7,0x1c..0x1f); (7,0x07) only as g1 s85.

**Caution for `dev/beams/em084_00.md`:** it reads EMC group 0 s35 / s36's (7,0x0c) / (7,0x0d) / (7,0x0f) as ARM actions.
The body has its own (7,0x0a), (7,0x0c..0x0f) — exactly the record-table actions of §4b — and group 0 also issues
(7,0x34), (7,0x35), (7,0x3d), (7,0x3e), numbers above the arm's table maximum 0x2e. So group 0's (7,0x0a..0x0f) are at
least as likely the BODY's; the arm (7,0x0c / 0x0d / 0x0e) issuers are the body's (7,0x9b..0x9d) / (7,0x69..0x6b) above.
Not withdrawn here (the beams note is not mine to edit) — the beams lane should re-check that line.

---

## 10. Not read / open

- Issuers of arm (7,0x08), (7,0x1c..0x1f), (7,0x27), (7,0x28), (7,0x2d), (7,0x2e) — so the form needs a viewer control.
- The ordering of the form clear and the phase-0 copy on one action start (§3).
- What `[arm+0xcad8]`, `E+0xcb14` and `[arm+0xcac8]` mean (§4c, §5).
- base06, base31 and base48 entirely (placement, motion, end); base01 flag 0x20; base13's use of request `+0x30`;
  when base48 calls `+0x15c`; what base00 does with flight 0.0.
- The record clock rests on vt `+0x3d8` being called by every setMotion variant (rom-map row 328 read it for `0xafef0`).
- Which body parts 2 / 3 / 4 are (§4b), and which skull each form is (Raven's names on the board, not ROM).

---

## 11. Proposed `dev/rom-map.md` rows (NOT written — the brief allowed only this file)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x175c3e8[0x16c..0x173]` | Nakarkos shells: sp_00 base00, sp_01 base01, sp_02 base02, sp_06 base06, sp_11 (setup base01, vtable base11's 0x402fd8 / 0x40308c), sp_13 base13, sp_31 base31, sp_48 base48; vtables 0x17f6918 / 0x17f6a94 / 0x17f6c04 / 0x17f6d80 / 0x17f6ee8 / 0x17f705c / 0x17f71d8 / 0x17f7338 | uShellEm084_* | R | dev/em084-shells-spec.md §1 |
| `0x107c0cc` / `0x107c628` | arm shell00 / shell01 spawners, index → mode by kind (and rank for shell00) | uEmOstgaloaArm | R (emulated) | §2 |
| `arm+0xcb30` / `E+0xcb0c/0xcb0d` / `0x106d994` | tentacle form byte, the body's per-side copy, and its writer: (7,0x1c..0x1f) → 0..3, (7,7) → 1, (7,8) → 3; many actions clear | both | R (emulated) | §3 |
| `0x17f6420` / `E+0xcb30..+0xcb6c` / `0x1069e78` | the body's motion-record table: per action, at a frame of a body clip, layer clip L2 M70..73 on layer type+2, shell at layer frame ≥ 58, part-break gate from `.dtp` A rows 3/1/0 | uEm084_00 | R | §4b |
| `0x106f354` | sel → shell13 8..22 / 0 / 1, shell48 0 / 1, shell00 65 / 66 | uEm084_00 | R | §4b |
| `0x106aa48` | shell06 aura manager (5 / 6 arm sockets, 0 body) | uEm084_00 | R | §4c |
| `0x1088e38` / `0x108aba8` / `0x1089384` / `0x108a330` / `0x108b2e8` | second generation: sp_00 / sp_13 landings, sp_01 end, sp_11 create, sp_48 +0x15c | uShellEm084_* | R | §6 |
| `0x1088c5c` / `0x10891dc` / `0x1089c08` / `0x108a04c` / `0x108a954` / `0x108ae98` / `0x108b118` | the seven readers | uShellEm084_* | R | §8 |
| trap | `dev/beams/em084_00.md`'s "arm actions in EMC group 0 s35/s36" — those numbers are also body actions (§9) | — | I | §9 |

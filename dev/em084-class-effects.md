# em084_00 Nakarkos — the effects his class code requests, and four PSL records nothing fires

Effects lane, 2026-10-05. Scope: the `em084_00u` / `em084_00c` records that `uEm084_00`'s own code asks for through
vtable `+0x1cc` / `+0x1d0` (not shells, not ordinary PSL bits), the shared break path that resolves in his u list,
and c 6 / c 70 / c 112 / u 212. Every address was read in this session unless marked otherwise. Static reads with
`efx/armdis.py`; the action-start machine also run under unicorn (scratchpad `e84/h.py`, `run1.py`, `run2.py`).
Context read first: `dev/beams/em084_00.md` (class layout, the arms), `build/hitzone-states/state-decodes.md`
(NAKARKOS: stance `E+0xcac4`, charge flag `E+0xcadc`, clips per action), `rom-map.md` rows 297-303, 353, 386, 410.

## 0. The two request tables (READ)

- Body vtable `0x17f11fc`: `+0x1cc` = `0x106f890` (c), `+0x1d0` = `0x106f8c0` (u). Both: `id >= 1000` → `table[id-1000]`,
  then `0x6fdd4` / `0x6feb8` with sel 2 (UNIQUE); below 1000 they tail to the shared `0xa3dc0` / `0xa3ddc`.
- c table `0x16a2848` (GOT `0x183f8b0`) and u table `0x16a2858` (GOT `0x183f8b4`) **overlap by one word**, as em007's
  do: c = `{-1, 800, 1600, 1601}` (ids 1001..1003; c[4] is the u table's `-1`), u = `{-1, 90, 94, 91, 95, 92, 96}`
  (ids 1001..1006). Extent derived from the callers: every body site passes a literal, max c 1003, max u 1006 (§1).
  Words after u[6] (`0, 0, 0, 1, 1, ..., 3, 2`) are other data; none is 6 or 22.
- **The arm's pels are its own.** `uEmOstgaloaArm`'s loader writes `[arm+0x1358]` = res `0x837c`/`0x837d`
  (`em084_00c_l` / `_r`) at `0x107bd98` and `[arm+0xb624]` = `0x837e`/`0x837f` (`em084_00u_l` / `_r`) at
  `0x107bdac`; `0x6fdd4` reads the pel from `[e+0x1358]`, `0x6feb8` from `[e+0xb624]`, and the PSL path `0x6ff6c`
  from the same two fields (`0x70008` / `0x70074`). So every arm request — its class table `0x16a2c48` / `0x16a2c54`,
  its `0xa442c` calls, its PSL bits — resolves in the ARM lists, never in `em084_00u` / `em084_00c`.
- `efx/class-requests.json` records the body vtable as `0x17f11f8` and the arm's as `0x17f6494` (4 bytes low — the
  em007 trap again), so both of each class's tables are labelled `+0x1d0`. `class-request-sites.json`'s
  "1032 → 3" is not a request: `movw r2, #0x408` at `0x1067bb0` / `0x1068128` / `0x10683d8` is the field `P+0x408`.

## 1. Census of the body's request sites (READ)

Body band `0x1064be0..0x107b29c` (vtable clusters; the arm class starts at its ctor `0x107b29c`). Every
`#0x1cc` / `#0x1d0` operand in it was listed; the request loads are exactly these (the rest are `P+0x1d0`, the target
position, and `vldr`s):

| site | slot / id | key | function |
|---|---|---|---|
| `0x1067c58`, `0x1067c70` | c 1002, c 1003 | c 1600, c 1601 | `0x1066c14` (vt `+0x204`, action start), the (10, 0x6a) arm |
| `0x106885c` + `0x1068904` | u 1001, u 1002 | u 90, u 94 | `0x1067ed4`, the charge-level machine |
| `0x10688ec` + `0x1068904` | u 1003, u 1004 | u 91, u 95 | same |
| `0x10687cc` + `0x1068904` | u 1005, u 1006 | u 92, u 96 | same |
| `0x106f1f0` (×3, loop) | c 1001 | c 800 | `0x106eff4` ← `0x106af68` ← vt `+0x2a8` `0x1069b88` |

Tails into shared request code from the band: `0x1073474` / `0x10739d0` → `0xa499c` (u 1121, rom-map row 410),
`0x106cbec` → `0xa44a4` (the c 1130.. blast band). No `bl` to `0x6feb8` / `0x6fdd4` / `0x6ff6c` outside the two
overrides (whole-text branch census: `0x6feb8` has 43 callers, all overrides or the shared tail).
**Control:** the census reaches every id both tables hold (c 1001..1003, u 1001..1006) and nothing else.

## 2. u 90 / 94, u 91 / 95, u 92 / 96 — the cannon-charge levels (READ, emulated)

`0x1067ed4(e, group, number)` runs at **every action start** (its only caller `0x1067384`, inside vt `+0x204`
`0x1066c14`). First it updates the charge flag `E+0xcadc` (its only writers are this function and init `0x10659b8`):

- set to 1 on **(7, 0x32)** (`0x1067fac`; plays **list 2 Motion[81]**, the charge);
- cleared on **(7, 0x33..0x35)** (`0x1068234`), **(10, 0xaf)** (`0x1068314`) and **any group-11 action** (`0x106835c`).
  (7, 0x3c..0x3e) do NOT clear it.

Then the level byte `E+0xcb05` (previous level kept in `+0xcb06`; switch `0x10683f0`, table `0x1068414`). "Pair" =
two requests, the first handle at `E+0x26300`, the second at `E+0x26304`, params `E+0xb640` with `+0xb648 = 3`
(meaning not read), area byte `E+0x1054` copied to `E+0xb64c` first. Each new pair first stops the old one
(`0x329c40(h, 0)`, the graceful stop) when its state word `([h+0xc] & 7)` is 1 or 2.

| level | flag set (charging) | flag clear |
|---|---|---|
| 0 | → 1, **start u 90 + u 94** | — |
| 1 | next action start except (7, 0x32), (1, 0x40), or `E+0xcb00 != 0` → 2, **stop, start u 91 + u 95** | → 0, stop both (no hold) |
| 2 | **(1, 0x41)** → 3, **stop, start u 92 + u 96**; a "shot" action (mask `0xe07`: 7 / 0x33..0x35, 0x3c..0x3e) → 4, nothing stopped | shot action: kept; any other → 0, stop both |
| 3 | shot action → 5, nothing stopped | shot action: kept; any other → 0, stop both |
| 4 | next action start → 2, **stop, start u 91 + u 95 again** | as 2 |
| 5 | next action start → 3, **stop, start u 92 + u 96 again** | as 2 |

**The shot ends them on a frame.** All six shot actions run `0x10767c0` (status-7 stubs `0x10740e8`, `0x1073f80`,
`0x1073f8c`, `0x107413c`; r1 0 / 1 / 2 / 3). Phase 0 sets **list 2 Motion[82]** (`0x252`, loop count tune int 0xc / 0xd /
0xe) and clears `P+0x1a3`; in phase 1 (the first M82 play) `0xb0968(e, 1, 0, 285.0)` (literal `0x1076cd0`) → `P+0x1a3 = 1`
and `0x106d8f4`, which stops both handles (`0x329c40(h, 0)`). Then M82 repeats and **list 2 Motion[83]** (`0x253`)
closes the action. So in a shot the held pair ends at **L2 M82 frame 285**.

`E+0xcb00` (blocks 1 → 2): set to 1 on (7, 0x32) when `E+0xcacc` is set (`0x1067d14`..`0x1067d30`; `E+0xcacc` is set
by (6, 3) `0x1066ee0`, by (10, 0x72) when `0x9e8d8(e) == 6` `0x1067324`, by (10, 0x14) at quest rank ≥ 5 with
`E+0xcbee == 3` `0x1067cbc`), cleared on (1, 0x40) `0x1067ccc`. Meaning not read.

Emulated (`run1.py`, `0x1067ed4` alone, externals stubbed): (7,0x32) → u 90, 94; (0,1) → stop, u 91, 95; (1,0x41) →
stop, u 92, 96; (7,0x33) → kept, flag 0; (0,1) → stop. (7,0x32), (7,0x34) → stop at the shot start (level 1 has no
hold). (7,0x3c) at level 2 → level 4; the next action → u 91, 95 again. (10,0xaf) and (11,1) → stop. `E+0xcb00 = 1`
→ stays at u 90 / 94. `run2.py`: `0x1066c14` over all 18 × 254 (group, number) pairs from a zeroed state: only
(7, 0x32) requests u 90 / 94 and (10, 0x6a) c 1600 / 1601.

Conditions: no rank, rage, tired, part or area test on these requests. (Rage changes the charge COUNTER `E+0xcae0`
rate, `0x10666cc` — the face plate's hadouhou rungs, not these records.) Not hit-dependent: the AI's action order
drives them; (10, 0xaf) cancelling a charge is a reaction (hit-dependent).

**The viewer's u 90 "rage" trigger is not a read**: `efx/export_effects.py` defaults `when` to `'rage'` (line 118).

## 3. c 800 — three placed effects on L3 M65 (READ)

Per frame, vt `+0x2a8` `0x1069b88`: when the current motion (`0xb0944`) is **`0x341` = list 3 Motion[65]** and the
latch `E+0xcb20 == 0` (`0x1069cbc`..`0x1069ce4`) → `0x106af68`: enables two scene objects `E+0x262a0` / `E+0x262a4`
(`0xc44c70(mgr, 1, obj)`, not read), sets `E+0xcb20 = 1`, then `0x106eff4` requests **c 1001 = c 800 three times**
(loop `r8 = 0..2`, `0x106f0dc`..`0x106f214`), handles `E+0x26308` / `+0x2630c` / `+0x26310` (an old one is killed
first, `0x329c40(h, 1)`). Each placed at body `P+0x40..0x48` + yaw-turned (`P+0x54`; sin `0x13ecc20`, cos `0x13ecc2c`)
tune vec × size (`0xbe518`): x' = x·cos + z·sin, y' = y, z' = z·cos − x·sin. Tune vecs (`0x6f640` → rFreeUseParam
`+0x54` = `0x3cb35c`, vec i, READ): **[1] (430, 250, 1350), [2] (420, 280, 1200), [3] (410, 310, 1050)**; vec [4]
(1.8, 2.3, 1.8) goes to params `+0x40..+0x48` (INFERRED a scale); params `+0x1c |= 3`, `+0x14 |= 0x40000000`, `+0x8 = 3`.

Ends: `0x10698d0` stops all three (`0x329c40(h, 0)`), disables the two objects and clears `E+0xcb20`; it is called
from vt `+0x204` at `0x10679c8` on **every** action start (all paths converge at `0x10679b4`; `run2.py`: all 4572 pairs).
So c 800 lives from L3 M65's first frame to the end of the action that plays it — (10, 0xaf) in stance 2 plays
L3 M64 → M65 → M66 (state-decodes.md), so through M66. **Hit-dependent**: (10, 0xaf) is issued by the shared reaction
dispatcher (`0x9b078`, reaction code `P+0x3ae` = 27 per motion-states.js Nightcloak), not by the class.

## 4. c 1600 / c 1601 — the (10, 0x6a) pair (READ, emulated)

In vt `+0x204`: group 10 number 0x6a (`0x1067a54` → `0x1067be0`): `0xc0598(e, 2)`, then if the latch `E+0x26318 == 0`:
latch = 1, stop any old `E+0x26314`, request **c 1002 = c 1600** (handle NOT stored) and **c 1003 = c 1601** (handle →
`E+0x26314`). Frame 0 of the action: stance 2 plays **list 3 Motion[76] → [77] → [78]**, stance 1 **[23] → [24] → [25]**.

Ends: vt `+0x208` `0x106bc08` (the frame handler) stops c 1601 (`0x329c40(h, 0)`) and clears the latch once the current
motion is none of `0x317`, `0x318`, `0x34c`, `0x34d` (L3 M23, M24, M76, M77), i.e. at the first frame of L3 M78 / M25.
c 1600 ends by its own record (end 0). No rank / rage / tired / area test. **Hit-dependent**: (10, 0x6a) is issued only
by the shared reaction dispatcher (`0x9b154`: reaction code `P+0x3ae` = 18, `0x9a804` index 17 → `0x9ab5c`, when
`P+0x1ba` is 0, 2 or > 6; 3 → (10, 0x6c), 4 → (10, 0x6b)). What code 18 is was NOT read. `cm200_050_s` has 3 type-20
generators the runtime does not build (triage).

## 5. u 1002 .. u 1033 — the body's breaks, through the shared path (READ)

`em084_00_dtbparts.dtp +0x64` rows {part, level, level G, group}: (0,3,3,0) (1,3,3,0) (2,3,3,1) (3,3,3,2) (4,2,2,131)
(4,4,4,131) (5,2,2,132) (5,4,4,132) (6,2,2,133) (6,4,4,133). The shared break handler `0x99edc` → `0x9a00c` →
`0xa442c(e, part, level)` → body vt `+0x1d0` with id `part·5 + level + 6` (< 1000) → `0xa3ddc` → shared u table
`0x159c7fc` (index = id) → key `999 + 5·part + level`. Body vt `+0x358` = `0x6c114` (returns 1), so every row fires
(gate: `0xb6fc4(e) == 1`). Handle not stored; records end 0.

| dtt part | level (both ranks) | id | key | efl, joint |
|---|---|---|---|---|
| 0 (right tentacle, `P+0x3bc`) | 3 | 9 | **u 1002** | em084_00_300, −1 |
| 1 (left tentacle, `P+0x3c8`) | 3 | 14 | **u 1007** | em084_00_300, −1 |
| 2 | 3 | 19 | **u 1012** | cm202_060, 213 |
| 3 | 3 | 24 | **u 1017** | cm202_060, 212 |
| 4 | 2 / 4 | 28 / 30 | **u 1021 / u 1023** | em084_00_100, 210 |
| 5 | 2 / 4 | 33 / 35 | **u 1026 / u 1028** | em084_00_100, 6 |
| 6 | 2 / 4 | 38 / 40 | **u 1031 / u 1033** | em084_00_102 / cm202_060, 3 |

Level n = the part's n-th depletion of its `.dtt` +0 durability (150 / 150 / 300 / 300 / 300 / 180 / 500 for parts 0..6;
the class re-arms parts 0 / 1 from tune int 0x24 and zeroes their level on a stance change, `0x10697f8`..`0x10698c4`,
`0x1065f5c`, `0x1065ff8`, `0x106de24`, `0x106df4c` — every class write is a reset to 0). Parts 0 / 1 = tentacles: level 3
is the state the arm's form switch `0x107e25c` shows as "Exposed". **All ten are hit-dependent.** Which reaction clip
accompanies each depletion was not read here.

The arms fire their OWN u 1002 (`0xa442c(arm, 0, 3)` at `0x1081a90`, `0x1082064`, `0x10827fc`) → `em084_00u_l/_r` 1002 =
em084_00_101. A different record from the body's u 1002 (em084_00_300).

## 6. Not reachable — u 6, u 22, c 6, c 70, c 112, u 212

- **u 6, u 22** (em084_00_011, UNIQUE). UNIQUE records are reached only by class tables, the shared tables and shell ef
  lists (sel 2 is pinned on all three; the PSL path resolves SEQUENCE). Body tables hold 800 / 1600 / 1601 / 90-96;
  shared tables hold none of 6 / 22; no em084 shell ef list (shell00/01/02/06/11/13/31/48, all 148 dumped) names 6 or
  22 under any listId; the arm table's 1007 → 22 resolves in `em084_00u_l/_r` (§0). **Control:** the same three
  sources reach every other UNIQUE key of `em084_00u` (1-5, 10, 20, 21, 31-42, 90-96, 100, 101, 110-118, the ten
  break keys, 1120, 1121, 1400). Nothing requests u 6 or u 22.
- **c 6, c 70, c 112** (SEQUENCE). No bit in any of the nine PSLs (`em084_00_0/2/3`, `_l_0/2/3`, `_r_0/2/3`) names c 6,
  70 or 112 under either type. **Control:** the same scan finds c 0 (L0 M18 f175, M40 f145) and c 113 (L0 M17 f389/409,
  M66 f239/260). The enable mask (`+0x13f4`) can only gate bits a PSL defines.
- **u 212** (SEQUENCE, em084_00_062_s). Defined once in the body: `em084_00_3.psl` **L3 Motion[63] bit 4**, in the
  block's file mask `0x3807f`, but **no event frame sets it** — and bit 4 is a base bit (always enabled), so no mask can
  change that. It never fires. `_l_2` / `_r_2` **Motion[92] bit 15 key 212 at f506** resolve in `em084_00u_l/_r` (§0),
  where 212 is em084_00_103: the arm's record, not this one.

## 7. Rows for rom-map.md (not added: this lane's brief allowed only this note)

```
| `0x16a2848` / `0x16a2858` | uEm084_00's c / u id→key tables, overlapping by one word: c {-1, 800, 1600, 1601} (ids 1001..1003), u {-1, 90, 94, 91, 95, 92, 96} (1001..1006); body vtable 0x17f11fc +0x1cc 0x106f890 / +0x1d0 0x106f8c0 | uEm084_00 | R | dev/em084-class-effects.md §0 |
| `0x1067ed4` | the cannon-charge level machine, run at every action start from vt+0x204: flag E+0xcadc set on (7,0x32), cleared on (7,0x33-0x35), (10,0xaf), group 11; levels E+0xcb05 → u 90/94, 91/95, 92/96 (handles E+0x26300/+0x26304) | uEm084_00 | R (emulated) | dev/em084-class-effects.md §2 |
| `0x106d8f4` ← `0x1076c54` | the shot (0x10767c0, all six shot actions) stops the charge pair at L2 M82 frame 285 (0xb0968 op 1, literal 0x1076cd0) | uEm084_00 | R | §2 |
| `0x106af68` / `0x106eff4` / `0x10698d0` | c 800 ×3 at L3 M65 (vt+0x2a8 motion test 0x341, latch E+0xcb20), placed at tune vecs 1..3 × size, yaw-turned; stopped at every action start | uEm084_00 | R | §3 |
| `0x1067be0` / `0x106bc08` | (10,0x6a) → c 1600 (unstored) + c 1601 (E+0x26314, latch E+0x26318); vt+0x208 stops c 1601 off L3 M23/M24/M76/M77 | uEm084_00 | R | §4 |
| `0x107bd98` / `0x107bdac` | uEmOstgaloaArm's pels: +0x1358 = em084_00c_l/_r (0x837c/d), +0xb624 = em084_00u_l/_r (0x837e/f) — every arm request and arm PSL bit resolves in the arm's lists | uEmOstgaloaArm | R | §0 |
| trap | class-requests.json's vtables for uEm084_00 (0x17f11f8) and uEmOstgaloaArm (0x17f6494) are 4 bytes low (em007 again); class-request-sites.json's "1032 → 3" is the field P+0x408 | — | R | §0 |
```

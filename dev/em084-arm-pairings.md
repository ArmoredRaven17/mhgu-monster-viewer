# em084_00 Nakarkos — which body action orders which arm action, and what the body and the other arm play meanwhile

Research agent for the PM, 2026-10-05, follow-up to `dev/em084-shells-spec.md`. Every row was read in this session.
- Static reads used `efx/armdis.py` and the scratchpad wrapper `naka_shells/dd.py`.
- Cross-checks ran under unicorn with the beams lane's driver (`scratchpad/beamsD/drv.py`). The scratch scripts are
  `naka_shells/b3cls.py` (hooks `0x107f4c8` and implements the timer `0x7206c`), `run_body3.py` (every body
  status × number, stance 1 and 2), `run_phase.py`, `run_arm_misc.py` and `run_held.py`.

Read first: `dev/beams/em084_00.md`, `dev/em084-shells-spec.md`, `build/hitzone-states/state-decodes.md` (NAKARKOS),
the rom-map's shared command layer (rows 34..53) and `dev/notice-marks.md` (the group-select code).
"L" = left arm (kind 1, `E+0xcc00`); "R" = right arm (kind 2, `E+0x19750`). Arm motion `0x2NN` = list `l_2`/`r_2`
`Motion[NN]`, and `0x0NN` = `l_0`/`r_0` `Motion[NN]`.

---

## 1. EMC groups: the body runs every command stream, and the arms run none (READ)

- The command runner keeps its state per unit:
  - `[unit+0x72f4]` = the group table, built by `0x70fe0(unit)` = `[unit+0x75f4] + 0x68`.
  - `+0x72fc` / `+0x72fd` = the current group and stream; `+0x72f8` = the cursor.
  - `0x825f8` (called from `0xa4bfc`) sets **group 0, stream 0** as the start (`0x8261c..0x82634`).
  - The tick `0x82d20` (callers `0xa59fc`, `0xa5ae0`) returns at once while the cursor is 0 (`0x82d40`).
  - Op `00 st nn` (`0x8456c` → `0x754b8` → `0x76098`) changes the action of **the unit that runs the stream**.
- `[unit+0x75f4]` is written only by `0x709a0`. That setter is registered as a resource slot by the shared loader
  **`0x70460`** (`0x70664..0x7066c`, slot `+0x76ec / +0x76f0`). The body's vtable `+0x148` is `0x70460`.
- **The arm's vtable `+0x148` is its own loader, `0x107ba5c`.** It binds eight resources through
  `0x70774`, `0x70798`, `0x954438` ×3, `0x70924`, `0x70934`, `0x708e4`, `0x70904` and `0x70960`, then sets `+0x7652`.
  It never calls `0x70460` or `0x709a0`.
- No code in the arm band (`0x107b29c..0x1088848`) touches `+0x72f4..+0x7304` or `+0x75f4`. So the arm has no command
  table, its cursor stays 0, and **it runs no EMC stream**.
  - That the shared base constructor zeroes `+0x75f4` is INFERRED. `+0x72f4` is zeroed at `0x6d8bc`.
- **Positive control:** the same chain gives the body its table, and the body's group-0/1 streams name actions the
  body's own handlers implement, e.g. (7,0x43), which the beams lane reads as a body action.

**So:** groups 0 and 1 of `em084_00_cmdtbl` both belong to the BODY.
- Group 0 is the body's starting group (`0x825f8`).
- **g0 s35 / s36's (7,0x0a), (7,0x0c), (7,0x0d), (7,0x0e), (7,0x0f) are BODY actions.** They are exactly the body
  actions of the motion-record table (`dev/em084-shells-spec.md` §4b).
- The beam note's "arm actions (7,0x0c)/(7,0x0d)/(7,0x0f) appear in EMC group 0 s35/s36" is **wrong**. **Every arm
  action is ordered by body code** (§2).

---

## 2. How the body orders an arm (READ)

All four request funnels tail into **`0x107f4c8(arm, st, num)`** = `b 0x769f4`. `callers.py` finds exactly four
branches into it: `0x106e2d0`, `0x106e364`, `0x106e4d8` and `0x106e5d0`.

| funnel | starts at | callers |
|---|---|---|
| `0x106e238` | `0x106e238` | 79 |
| `0x106e2d4` | `0x106e2d4` | 7 |
| `0x106e380` | `0x106e380` | group 10 |
| `0x106e4dc` | (tail `0x106e5d0`) | 26 |

- Each funnel picks the arm by `r1` (1 → `E+0xcc00`, 2 → `E+0x19750`).
- It refuses the request when the arm is unavailable: bytes `E+0x196c9` / `E+0x26219`, and `[P+0x1bb]` bits
  4 / 8 / 0x10 / 0x20 (meanings NOT READ).
- No body code writes an arm's `+0x73e0/1` directly. The `E+0x13fe0/1` and `E+0x20b30/1` hits are all reads (below).

**The single-arm order actions share one shape** (status-7 stubs `0x1074870..0x1074c34`):
- Phase 0: posture 0, `setMotionC` (blend 20) of L0 M1 or L0 M50, then one funnel call ordering one arm.
- Phase 1: stay while that arm's action pair still equals the ordered one, then idle (vt `+0x3dc`). The left arm's pair
  is read at `E+0x13fe0/1` (= `E+0xcc00 + 0x73e0/1`, e.g. `0x1074a58..0x1074a80`); the right arm's at `E+0x20b30/1`
  (`0x1074bf0..0x1074c14`).
- **So the body loops its L0 M1 or L0 M50 for exactly as long as the arm's action runs.** `setMotionC` continues a clip
  already playing (`0x726cc`, rom-map row 61).
- The other arm gets no order.

**The arm's idle (READ):** vt `+0x3dc` is the shared chooser `0x75168` → action (0, 0..2). Arm (0,0) and (0,1) go to
`0x107fe34`, which tests the BODY's stance `[body+0xcac4]` (`0x107fe80..0x107fe8c`):
- stance 1 → `setMotionC` arm **`0x1` = `l_0`/`r_0` Motion[1]**;
- stance 2 → **`0x32` = Motion[50]** (`0x107fefc`).

The body's own single-arm orders follow the same split. Stance-1 actions (7,0x65..0x6b / 0x97..0x9d) hold **L0 M1**;
stance-2 actions (7,0xc9..0xcb / 0xfb..0xfd, 0x54..0x5c) hold **L0 M50**. The stance per action is in
state-decodes.md's table.

---

## 3. The table — one row per arm action with a beam or a shell row

- "Status": R = READ statically (addresses given); D = the driver reproduces it (`run_body3.py`, both stances, the
  timer modelled).
- Request timing is in body frames from the body action's start.
- In "other arm", the side is the one NOT ordered.

| arm action | issuer(s): body action → side (call site) | body clip (+ partner) | request timing | other arm | arm clip | status | evidence |
|---|---|---|---|---|---|---|---|
| **(7,0x0c)** beam | (7,0x9b) → L; (7,0x69) → R (`0x1074960`, shared tail) | **L0 M1** `setMotionC`, looped until the arm leaves (7,0xc) | frame 0 (phase 0) | no order: its idle, stance 1 → `l_0`/`r_0` M1 | as the note: M5 + M6 blend, beam f200 | R, D | §2; sweep `body_sweep3.json` |
| **(7,0x0d)** beam | (7,0x9c) → L; (7,0x6a) → R | L0 M1, held | 0 | no order (idle M1) | as the note: L M13 / R M14 | R, D | same |
| **(2,3)** beam | (2,0x0b) `0x1071564`: body turn clip **L0 M2** → **L (2,3)** (`0x1071634`) + R (2,2) (`0x10716b4`); otherwise **R (2,3)** (`0x10716b4`) + L (2,2) (`0x107169c`) | **the body's turn**: `0x7a258(E, 0x16a2998, ..)` picks L0 M1 (straight), **M2** or **M3** (sides, threshold u16 `0x1555` ≈ 30°, table rows `+0x10/+0x20/+0x30` = motions 1 / 2 / 3, blend 20) | 0 | **(2,2)** (`0x1082ee8(arm,0)`): plays the body's turn clip on its own list — `l_0`/`r_0` M1 / M2 / M3 by the body's motion (driver: body 2 → arm `0x2`, 3 → `0x3`) | L: `l_2` M13 when the body is on M2; R: `r_2` M14 when the body is on M3. Only that pairing beams; the other arm turns | R, D | `0x10715c0..0x10716b4`; arm `0x1082ff0` |
| **(7,0x0f)** / **(7,0x10)** beam | **none** | — | — | — | (note) M5 f156 | negative, R | §4 |
| **(7,0x11)** / **(7,0x12)** beam | **none** | — | — | — | (note) M1 f120 | negative, R | §4 |
| **(7,0x21)** beam | (7,0x44) and (7,0x45) → **both** (L `0x1077cb4`, R `0x1077d68`) | **L2 M86** (`setMotion 0x256`, blend 20) | 0, both arms at once | **also (7,0x21)** | M86 both | R, D | — |
| **(7,0x22)** beam | (7,0x4a) and (7,0x4b) → both (L `0x1077d50`, R `0x1077d68`) | L2 M86 | 0, both | also (7,0x22) | M86 both | R, D | — |
| **(7,0x26)** beam | **none** | — | — | — | (note) M50 + M51 f108 | negative, R | §4 |
| **(7,0x2a)** beam | (7,0x6f) → **R at f200** and **L at f1000**; (7,0x70) → **R at f0** and **L at f800** (call sites `0x1078820`, `0x1078be0`, `0x1078aa8`, the same site serving several requests) | **L0 M50** `setMotionL`, looped through the whole sequence | **timer-stepped phases** (`P+0x1bc` counted by `0x7206c`, 200 / 400 frames); each step also sets the arm's aim point `P+0x40..` = `E+0x262b0..` + (±1000, 0, ±1000) | see the next row: the other arm runs (7,0x29) or (0,7) in the same sequence | M28, beam f294 (note) | R, D (timer) | `0x107847c` phases `0x10784bc` table; `0x1078870` |
| (7,0x2a)/(7,0x29) sequences in full | **(7,0x6e)**: f0 L (0,7) + R (7,0x29); f200 L (7,0x29); f400 R (7,0x29); f600 L (7,0x29). **(7,0x6f)**: f0 L (7,0x29) + R (0,7); f200 R (7,0x2a); f400 L (7,0x29); f800 R (7,0x29); f1000 L (7,0x2a). **(7,0x70)**: f0 L (7,0x29) + R (7,0x2a); f400 L (7,0x29); f800 L (7,0x2a) + R (7,0x29) | L0 M50 | as listed | (0,7) = arm `0x32` `l_0`/`r_0` **M50**; (7,0x29) = arm `0x21b` **`l_2`/`r_2` M27** (no beam) | — | R, D | `run_body3.py` timeline |
| **(7,0x2c)** beam | **none** | — | — | — | (note) M28 f294 | negative, R | §4 |
| **(7,0x09)** shells | (7,0x97) → L; (7,0x65) → R | L0 M1, held | 0 | no order (idle, stance 1 → M1) | M9 + M10 (shells-spec) | R, D | — |
| **(7,0x0a)** shells | (7,0x98) → L; (7,0x66) → R | L0 M1, held | 0 | no order | M21 | R, D | — |
| **(7,0x0b)** shells | (7,0x9a) → L; (7,0x68) → R | L0 M1, held | 0 | no order | M1 + M2 | R, D | — |
| **(7,0x17)** shells | (7,0x37), (7,0x3a), (7,0x46), (7,0x48) → **both** (L `0x10771ac`, R `0x10772b8`) | **L2 M101** (blend 20), then **L2 M102** (`setMotion0` at its end, f199); the arms stop when the body plays **L2 M103** | 0, both | also (7,0x17) | M101 → M102 + M104 (shells-spec) | R, D | — |
| **(7,0x18)** shells | (7,0x38), (7,0x3b), (7,0x47), (7,0x49) → both (L `0x10772a0`, R `0x10772b8`) | same as (7,0x17) | 0, both | also (7,0x18) | same | R, D | — |
| **(7,0x1b)** shells | (7,0x59), (7,0x5c) → L (`0x1077e60`); (7,0x54), (7,0x5b) → R (`0x1077f84`) | **L0 M50** (`setMotion 0x32`, blend 20) | 0 | no order (idle, stance 2 → **M50**) | M93 | R, D | — |
| **(7,0x23)** shells | (7,0xfb) → L; (7,0xc9) → R (`0x1074960`) | **L0 M50** `setMotionC`, held | 0 | no order (idle M50) | M62 + M65 | R, D | — |
| **(7,0x24)** shells | (7,0xfc) → L; (7,0xca) → R | L0 M50, held | 0 | no order | M74 | R, D | — |
| **(7,0x25)** shells | (7,0xfd) → L; (7,0xcb) → R | L0 M50, held | 0 | no order | M50 + M51 | R, D | — |
| **(7,0x27)**, **(7,0x28)** shells | **none** | — | — | — | (shells-spec) | negative, R | §4 |
| **(7,0x2d)**, **(7,0x2e)** shells | **none** | — | — | — | M92 @300 | negative, R | §4 |
| form setters (7,0x07), (7,0x08), (7,0x1c..0x1f) | **none** | — | — | — | L3 M19 / M92 | negative, R | §4 |

Other arm orders read on the way, for completeness. All are at frame 0, both arms, with the body's clip given:
- (7,0x43) L0 M63 → (7,0x20) (arm `0x3f` `l_0`/`r_0` M63).
- (7,0x32) L2 M81 → (7,0x13) (arm M81).
- (7,0x33)/(7,0x3c) L2 M82 → (7,0x14).
- (7,0x34/0x35/0x3d/0x3e) L2 M82 → (7,0x15). The arms play `l_2`/`r_2` M82.
- (7,0x0a)/(7,0x0d) L0 M8 → (7,0x05). The arm plays `l_0` M8, then M4, as the body does.
- (7,0x0c) turn → (2,0x04) (`0x10760cc` / `0x10760ec`).
- (2,0x0a) turn → (2,0x02) on both arms.
- (7,0x50..0x53) L0 M50 → L (7,0x1a) + R (7,0x19); (7,0x55..0x58) L0 M50 → L (7,0x19) + R (7,0x1a); (7,0x5a) → both
  (7,0x19). These are the digs: `l_2`/`r_2` M92.

---

## 4. Arm actions with no issuer (named negatives)

**(7,0x0f), (7,0x10), (7,0x11), (7,0x12), (7,0x26), (7,0x27), (7,0x28), (7,0x2c), (7,0x2d), (7,0x2e), (7,0x07),
(7,0x08), (7,0x1c), (7,0x1d), (7,0x1e), (7,0x1f)** — I found no issuer for any of these, by every path an arm action
can be set:
1. **Body code.** Every route to an arm action runs through `0x107f4c8`, which has 4 branch callers and no data
   references. The driver hooked `0x107f4c8` itself over every body status 0..0x11 × number 0..0xff, in both stances,
   for 2400 frames, with the timer `0x7206c` modelled. It never requested these. The static literal census of all
   four funnels' call sites never names them either.
2. **EMC.** The arms run no streams (§1). The body's op-00 hits are body actions.
3. **The arm itself.** Its own transitions are only `0x75230` at `0x107e624` (6,0) and `0x107e630` (1,0x3a), plus the
   idle chooser (0, 0..2). No arm-band call to `0x76098` / `0x768c8` / `0x7699c` / `0x76a40` / `0x769f4`.
4. **Direct writes.** No body code writes an arm's action bytes (§2).

**Positive controls:**
- The same `0x107f4c8` hook finds every issuer the beams note had (body (7,0x43) → (7,0x20), (7,0x44) → (7,0x21),
  (7,0x4a) → (7,0x22)).
- It finds the issuers that note lacked: (7,0x0c), (7,0x0d), (2,3), (7,0x29) and (7,0x2a).
- It catches requests that a static literal scan misreads: `0x1078820` serves both R (0,7) and R/L (7,0x2a).
- The timer model reached the late phases of (7,0x6e..0x70), which an unmodelled driver never reaches.

**The limit of this negative:** it covers the body's handlers as the driver runs them, starting at each phase 0 with
zeroed state. A request behind a branch the zeroed state never takes would not show in the driver. The static census
of the funnel call sites is the cross-check for that, and it agrees.

---

## 5. Form → tentacle group (READ)

`0x107e25c` (the arm's form switch):
- When the side's part state is 3 → `setVisibleGroup(arm, 1)` (`0x107e2f4..0x107e300`; `0x72c78` = setVisibleGroup,
  the KNOWN name in `armdis.py`).
- Otherwise it switches on `[arm+0xcb30]` (jump table `0x107e324`):

| form | target | group |
|---|---|---|
| 0 | `0x107e334` | **2** |
| 1 | `0x107e35c` | **4** |
| 2 | `0x107e36c` | **5** |
| 3 | `0x107e37c` | **3** |
| 0xff | `0x107e34c` | 0 |

So **form 0 = g2, 1 = g4, 2 = g5, 3 = g3, none = g0, part state 3 = g1** is READ from these instructions. The task
board's 2026-09-13 table agrees with this read. The names (Uragaan, Glavenus, Ivory Lagiacrus, Brachydios, Base Form,
Exposed) are part-review.json's, not the ROM's.

---

## 6. What is wrong or unread in the beam note and in the viewer's pairing

1. **`dev/beams/em084_00.md` "What orders the arms":**
   - "Arm actions (7,0x0c)/(7,0x0d)/(7,0x0f) appear in EMC group 0 s35/s36" → **wrong**. Group 0 is the body's
     (§1). The real issuers:
     - (7,0x0c) ← body (7,0x9b) L / (7,0x69) R;
     - (7,0x0d) ← body (7,0x9c) L / (7,0x6a) R;
     - (7,0x0f) has none.
   - "No issuer found for arm (7,0x10), (7,0x11), (7,0x12), (7,0x26), (7,0x2c)" → now READ as no issuer anywhere,
     with controls (§4); (7,0x0f) joins them.
2. **Beam note, arm (2,3):** "which arm is in (2,3) when the body plays L0 M2 vs M3 is not read" → **READ**. Body
   (2,0x0b) orders the LEFT arm (2,3) when its turn clip is L0 M2, otherwise the RIGHT arm (2,3). The other arm gets
   (2,2) and turns with the body.
   - This matches `l_2` shipping only M13 and `r_2` only M14.
   - The issuer is the turn action (2,0x0b). (7,0x0c), the body action of the same turn table, orders (2,4) and never
     beams.
3. **Beam note, (7,0x2a):** "(7,0x6f) → left (7,0x29) in phase 0, later left (7,0x2a)" → incomplete. (7,0x6f) gives
   R (7,0x2a) at f200 and L (7,0x2a) at f1000. (7,0x70) gives R (7,0x2a) at f0 and L (7,0x2a) at f800. (7,0x6e) gives
   no (7,0x2a). Full timelines are in §3.
4. **beam-spawns.js rows for arm (7,0x0f)** (`l_2`/`r_2` Motion[5] f156, types `em084_00:20/21/54/55`) belong to an
   action nothing issues. Keyed on the clip, they also fire on **(7,0x0c)**'s M5 (whose own beam is f200), so the
   viewer shows two beams where the game shows one. The same applies to any row for (7,0x10), (7,0x11), (7,0x12),
   (7,0x26), (7,0x2c) — beam-spawns.js today carries only the (7,0x0f) ones. The (7,0x2a) rows already cover
   (7,0x2c)'s clip and frame identically.
5. **The viewer's pairing (playAttached: the other arm on `<prefix>0` Motion[1], the body idle):**
   - **Single-arm orders** — (7,0x09..0x0d), (7,0x1b), (7,0x23..0x25): right that the other arm gets no order.
     - Its idle is **stance-dependent**: M1 in stance 1, **M50 in stance 2** (§2).
     - The body loops **L0 M1** (orders numbered 0x65..0x6b / 0x97..0x9d) or **L0 M50** (0x54..0x5c, 0xc9..0xcb,
       0xfb..0xfd) for the arm action's whole length.
     - So (7,0x1b) and (7,0x23..0x25) want M50 for both the body and the other arm, not M1.
   - **(2,3):** the body plays its **turn** L0 M2 / M3, not an idle. The other arm plays the same turn (`l_0`/`r_0`
     M2 / M3), not M1.
   - **Paired orders:** (7,0x21), (7,0x22), (7,0x17), (7,0x18), and also (7,0x13 / 0x14 / 0x15 / 0x20 / 0x05).
     - **Both arms play the same action**, and the body plays its own clip: L2 M86, or L2 M101 → M102 (→ M103 ends
       the arms).
     - The rows in beam-spawns.js for (7,0x44) / (7,0x4a) already key the body's list `2` M86. Their pairing should
       be both arms on M86 with the body, not one arm plus idles.
   - **(7,0x2a) / (7,0x29):** the body holds L0 M50 through a timed sequence in which the two arms alternate (7,0x29)
     (`l_2`/`r_2` M27, no beam), (7,0x2a) (M28, beam) and (0,7) (`l_0`/`r_0` M50) (§3). Neither arm idles on M1.

---

## 7. Proposed `dev/rom-map.md` rows (not written)

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x825f8` / `0x70fe0` / `0x709a0` / `0x70460` | command table binding: group table `[u+0x75f4]+0x68` → `+0x72f4`, start group 0 stream 0; `+0x75f4` written only by `0x709a0`, registered by the shared loader `0x70460` (slot `+0x76ec/+0x76f0`); the tick `0x82d20` needs a non-zero cursor | shared | R | dev/em084-arm-pairings.md §1 |
| `0x107ba5c` | uEmOstgaloaArm vt+0x148: its own loader, never `0x70460` / `0x709a0` → **the arms run no EMC**; em084_00_cmdtbl groups 0 and 1 are the body's | uEmOstgaloaArm | R | §1 |
| `0x107f4c8` ← `0x106e238` / `0x106e2d4` / `0x106e380` / `0x106e4dc` | the only route from the body to an arm action (4 funnels; arm by r1; refusals on `E+0x196c9` / `E+0x26219` / `P+0x1bb`) | uEm084_00 | R | §2 |
| `0x1074870..0x1074c34` | single-arm orders: setMotionC L0 M1 / M50, order one arm, hold until that arm's pair (`E+0x13fe0/1` L, `E+0x20b30/1` R) changes | uEm084_00 | R | §2, §3 |
| `0x107fe34` | arm idle (0,0)/(0,1): `l_0`/`r_0` M1 when the body's stance `+0xcac4` == 1, else M50 | uEmOstgaloaArm | R | §2 |
| `0x1071564` | body (2,0xb): turn table `0x16a2998` (L0 M1 / M2 / M3); M2 → L (2,3) + R (2,2), else R (2,3) + L (2,2) | uEm084_00 | R | §3 |
| `0x107847c` / `0x1078150` / `0x1078870` | body (7,0x6f) / (7,0x6e) / (7,0x70): timer-stepped arm sequences of (7,0x29) / (7,0x2a) / (0,7) on L0 M50 | uEm084_00 | R (driver with timer) | §3 |
| `0x107e304..0x107e388` | form → group: 0→2, 1→4, 2→5, 3→3, 0xff→0; part state 3 → 1 | uEmOstgaloaArm | R | §5 |
| negative | arm (7,0x0f/0x10/0x11/0x12/0x26/0x27/0x28/0x2c/0x2d/0x2e/0x07/0x08/0x1c..0x1f): no issuer by body code, EMC, the arm, or direct write | — | R (with controls) | §4 |
| WITHDRAW | `dev/beams/em084_00.md`: "arm actions in EMC group 0 s35/s36" — group 0 is the body's; (7,0x0c)/(7,0x0d) arm issuers are body (7,0x9b/0x9c) / (7,0x69/0x6a) | — | W | §6 |

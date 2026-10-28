# Diablos (em007_00) — effects spec: the PSL enable word's variant-0 side, and his other gaps

Research agent for the Viewer agent, 2026-10-16 (dev/flying-wyverns-effects-survey.md "Diablos" and "What closing each
needs", item 1). Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ
(the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: rom-map.md (the uEm007_00 section, "THE PSL ENABLE MASK", "The PSL enable word per class" row
uEm007_00 `0xd4532c` "R, transcribed (em007_04)", the Bloodbath List 9 / sever sections, Withdrawn rows 719-726, trap 16),
docs/render/psl-mask.js whole (em007_04 and its CLIP_ACTIONS), dev/em007_04-list9-census.md §1.1 (the word, read whole for
Bloodbath), dev/em007_04-undriven-spec.md §1.1, dev/em043_00-effects-spec.md (the format),
C:\MHGU-RE\offline\decode\notes\states-em007_00.md (Diablos: §1.4 the op-0x6f selectors, §2 the part pass, the death /
pit rows), render/motion-states.js MOTION_STATES em007_00 and SHELL_TAIL, render/tail-option.js, render/monster.js
CLIP_EFFECTS em007_00, the task board (grep "Diablos" / "em007_00": nothing on this word). Scratch:
`<archive>/d07/` — `jscheck07.py` (JS vs ROM), `issued_var.py` / `issued_var2.py` (the EMC walk per variant),
`p7_v0.txt` / `p7_v4.txt` / `p{0,1,2,6}_p{0,4}_v0.txt` (actprobe7 at variant 0), `em007_00_file.txt` / `em007_00_whole.txt`
(the two plans); `<archive>/bw1/emu13c_bw.py` (the emulator), `planrows.py`, `recs.py`.

## 0. Headline

* **Diablos's word is Bloodbath's with ONE arm off** (R, emulated): the method `0xd4532c` has exactly one variant test, at
  `0xd454b4` on L2 M22 under (7, 0x67), and Diablos (variant 0) returns there with the tail bits only. Every other arm —
  the tail bits on every motion, the posture-0 bits on L0 M5 / L0 M7, L3 M20's death bit, the action tables on L2 M15 /
  M19 / M31 — is variant-blind and is his too.
* **What it changes on screen for him**: 19 bindings outside his file masks come in (4 always, 5 at posture 0, 1 tail-on,
  1 on the death clip; 3 tail-cut and 5 never-on have no record), and 10 in-mask tail bindings stop firing in both forms
  at once (8 tail-on only, 2 tail-cut only). **Two records to export: u 202 (`cm202_035`) and u 360 (`em007_00_000`).**
* **One more gap the word exposes: `SHELL_TAIL.em007_00` is missing** (R: `{ severed: 4 }`), without which his state.severed
  is always false and his cut-tail forms never show.

## 1. The word — uEm007_00 vt+0x13c = `0xd4532c`, the variant-0 side — R, emulated

Vtable **`0x17994cc`** (checked: `+0x13c` = `0xd4532c`, `+0xf0` = the base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x3f4` =
`0x7fed4`). Extent **`0xd4532c..0xd45524`** (the shared `pop`), literal pool `0xd45528` / `0xd4552c`, read whole again
here (`bb9/d.py d4532c d45530`); the census's transcription (dev/em007_04-list9-census.md §1.1) is confirmed instruction
by instruction. The only `e+0xb5f5` read:

    0xd45494  L2 M22 (table 0xd4539c entry 7): status e+0x73e0 == 7 and number e+0x73e1 == 0x67, else return
    0xd454b4  movw r1,#0xb5f5 / ldrb r1,[r4,r1] / cmp r1,#4
    0xd454c0  popne {r4, r5, r6, pc}        ; every variant but 4: return -- the word keeps the tail bits ORed at 0xd45374
    0xd454c4  orr r0,r0,#0x200000           ; Bloodbath only: bit 21

**Variant tests: exactly one** (R, negative with its positive control): no other `#0xb5f5` immediate in
`0xd4532c..0xd45524`, and none in the callees, all read whole — `0xca170` (`..0xca1d4`: P+0x518 / P+0x505 via `0x81670` /
`0x81614`), `0xa3bf4` (P+0x3b4 & r1), `0x7fed4` (`e+0x73e0` 11 / 14, else `0x6fe88(e, 12, 0xff)`), `0x6fe88`
(`e+0x73e0 == r1 && e+0x73e1 == r2`). The one writeback base, `ldr r0,[r6,r0]!` at `0xd45360`, leaves r6 = &e+0x13f4
(every later `[r6]` is the word, trap 58); no register carries &e+0xb5f5. The control is the same scan finding `0xd454b4`.

**Diablos's variant value is 0** (R): his part pass `0xd36e50` splits `ldrb [e+0xb5f5]!` / `cmp #4` -> Bloodbath
(`0xd36ea8`), `cmp #0` / `bne 0xd373e8` -> return, and falls into Diablos's half `0xd36e74` only at **0**
(states-em007_00.md §2). For the word it does not matter: **every value but 4 gives the same word** (emulated below at 0,
1, 2, 3, 5).

**Emulated** (`<archive>/d07/jscheck07.py`: `bw1/emu13c_bw.py` on vtable `0x17994cc`, `e+0x13f4` zeroed as setMotion
`0x7256c` does; node runs the JS). Controls first — the census's Bloodbath words reproduced (L2 M22 (7, 0x67) v4
`0x2381ff`, L0 M7 posture 0 `0x70381ff`, L2 M15 (7, 0xb4) `0x80381c0`), and the shipped `em007_04` transcription matches
the ROM at variant 4 on every case. Diablos (v0):

| case | word |
|---|---|
| L2 M22 (7, 0x67) v0 / v4 — **the one difference** | `0x381ff` / `0x2381ff` |
| L2 M22 (7, 0x67) v0 severed; (7, 7) v0 | `0x1c01ff`; `0x381ff` |
| L0 M5 posture 0 / posture 4 | `0x70381ff` / `0x381ff` |
| L0 M7 posture 0 enraged / posture 4 | `0x7038e3f` / `0x381ff` |
| L3 M20 (11, 7) / (10, 0x63) | `0x8381ff` / `0x4381ff` |
| L2 M15 (7, 3) / (7, 0xb4); L2 M19 (7, 0x83) / (7, 0xb8); L2 M31 (7, 0xb5) | `0x381ff` / `0x80381c0`; `0x381ff` / `0xc00381c0`; `0x300381c0` |
| L2 M25 intact / severed; L2 M24 tired; L0 M1 calm | `0x381ff` / `0x1c01ff`; `0x3f03f`; `0x381ff` |

The transcription below against the ROM: 24 motions x 22 actions x sever x 4 rage / tired pairs x posture 0 / 4 / 1 x
variants 0, 4, 1, 2, 3, 5 = **76032 runs, 0 mismatches** (variant 4 checks the shipped `em007_04`, the others the
proposed `em007_00`).

**For psl-mask.js CLASS_MASK** (beside `em007_04`, reusing it):

    // DIABLOS (em007_00): the same method 0xd4532c, variant 0 (his part pass 0xd36e50 runs his half only at e+0xb5f5 == 0).
    // Its ONE variant test is L2 M22 (0x216) under (7, 0x67): `cmp [e+0xb5f5],#4 / popne` at 0xd454b4..0xd454c0 -- Diablos
    // returns with the tail bits only, Bloodbath adds bit 21. Every other arm is variant-blind and is his: the tail bits on
    // every motion (state.severed, SHELL_TAIL em007_00), L0 M5 / L0 M7 bits 24-26 at posture 0 (c 0 / c 1, c 2 / c 3 /
    // c 30), L3 M20 bit 23 dying / 22 otherwise (c 3000 on b23). The action tables on L2 M15 / M19 / M31 ((7, 0xb4..0xb8))
    // are transcribed for fidelity; his command table never issues those actions at variant 0 (dev/em007_00-effects-spec.md 3),
    // and none of their bits has a record of his. READ whole and emulated: 76032 runs, 0 mismatches (spec 1).
    function em007_00(motion, action, state){
      if (motion === 0x216) return state.severed ? 0x1c0000 : 0x38000;   // 0xd454c0 popne: no bit 21 off variant 4
      return em007_04(motion, action, state);
    }
    // CLASS_MASK: em007_00;  PSL_MASK_MONSTERS: 'em007_00'

Inputs, and how the viewer supplies each:

* **`state.severed`** — P+0x3b4 bit 0. His part pass draws **set 10** on the same `vt+0x370(e, 1) == 1` test and set 9
  otherwise (`0xd36f44..0xd36f64`, `movne r1,#9 / moveq r1,#0xa`, then `b 0xd37108` the set call) (R). monsters.json
  em007_00 groups[10] = {4 on, 101 off}, groups[9] = {4 off, 101 on}; no other set names group 4 (R, data). So
  **`SHELL_TAIL.em007_00 = { severed: 4 }`** — **missing today** (render/motion-states.js has em007_04's only), so
  `shellTailInput('em007_00', ..)` returns `{}` and his word would read the tail intact forever. His sever row
  (`'3|Motion[15]'` levels [[9], [10]]) already takes the model there. R.
* **`state.posture`** — P+0x1ba, set before the motion (`0xbc7f4` stores its argument at `0xbc97c`; census). Diablos's plays
  (actprobe7 at variant 0, `p{2,6}_p0_v0.txt`; the posture arguments read at each setter call):
  L0 M5 at **posture 0** from `0xd393fc` (`mov r1,#0` `0xd39474` -> `0xbc7f4` `0xd39478`; setMotion0 `0xd39560`) for
  (2, 0 / 4 / 9 / 0xd / 0xe / 0xf / 0x10 / 0x17 / 0x18); at **posture 4** from `0xd3b908` (`mov r1,#4` `0xd3b958`;
  setMotion0 `0xd3b970`) for (6, 2). L0 M7 at **posture 0** from `0xd39c40` (`0xd39c94` / `0xd39c98`; `0xd39cac`) for
  (2, 6 / 7 / 8 / 0xc / 0x1a); at **posture 4** from `0xd3b9fc` (`0xd3ba7c` / `0xd3ba88`; `0xd3baa0`, the burrow with
  u 1400) for (6, 3), and from `0xd3c4a0` (`0xd3c4f8` / `0xd3c4fc`; `0xd3c510`). No `#0xb5f5` in any of the five functions
  between entry and the setMotion (R). The action main at variant 0 gives the identical first motion for every status-7
  number as at variant 4 (`p7_v0.txt` = `p7_v4.txt`, 138 lines).
* **`action`** — read on L2 M15 / M19 / M31 (status 7, 0xb4..0xb8: unreachable for him, §3) and L3 M20 (vt+0x3f4 =
  `0x7fed4`: status 11 / 14 / (12, 0xff) -> bit 23). With `null`, L3 M20 gives bit 22 — nothing of his is named there, so
  c 3000 stays off on a play with no action; a CLIP_ACTIONS entry gives the death form (§3).
* rage / tired from the toggles; he has **no binding on bits 6-14**, so the state groups change nothing visible.

## 2. What the word changes — whole-block plan (115 file-mask -> 134 whole)

`<archive>/bw1/planrows.py em007_00 [--whole]` (add_effects.plan with em007_00 forced into `psl_mask_monsters`) and
`recs.py em007_00` (the whole plan's records not in docs/effects/em007_00.json). R (the tool's output; the bits' gating is
§1's). Every binding not listed sits on bits 0-5 inside the file mask and stays always-on.

**Turned ON, always** (outside the file mask, bits 0-5 — 4):

| binding | record |
|---|---|
| L2 M15 b0 f100-125, 131-168 | u 380 (`em007_00_001`) — off only under (7, 0xb4..0xb8), which he never issues |
| L2 M19 b0 f58 | u 351 (`em007_00_000`) — off only under (7, 0xb7 / 0xb8), never issued |
| L2 M24 b0 f130 | **u 202 (`cm202_035`, not exported)** |
| L2 M24 b1 f1 | **u 360 (`em007_00_000`, not exported)** |

**Turned ON at posture 0** (outside the mask; off on the burrow plays — 5):

| binding | record |
|---|---|
| L0 M5 b24 f111 / b25 f36 | c 0 / c 1 (`cm202_001`) |
| L0 M7 b24 f18 / b25 f59 / b26 f0-89 | c 2 / c 3 (`cm202_002`) / c 30 (`cm202_000`) |

**Turned ON while the tail is on** (outside the mask — 1): L2 M25 b15 f48, u 321 (`cm202_035`).

**Turned ON on the death clip** (outside the mask — 1): L3 M20 b23 f99, c 3000 (`cm202_080`) — dying ((11, n): bit 23); the
pit holds (10, 0x63 / 0x65 / 0x66 / 0x7d..0x80) set bit 22, which names nothing.

**Gated** (in the file mask — the viewer fires them on every play today — 10):

| binding | record | game |
|---|---|---|
| L0 M2 b15 f124; L0 M22 b15 f106 | c 40 (`cm202_001`) | tail on only |
| L2 M3 b15 f38; L2 M23 b15 f120; L2 M24 b15 f154 | u 320 (`cm202_035`) | tail on only |
| L2 M4 b15 f38 | u 321 (`cm202_035`) | tail on only |
| L2 M20 b15 f109 / b16 f56 | c 22 / c 21 (`em007_00_004`) | tail on only |
| L0 M2 b18 f123; L2 M20 b18 f57-72, 110-138 | c 42 (`cm202_004`) | **tail cut only** |

**Named, never enabled for Diablos:** L2 M22 b21 f7 u 900 (`cm202_062`) — the variant test; it is exported as his sever
`event`, so the CLIP_EFFECTS writer already skips the binding and it stays off (correct). L2 M15 b27 / b28 / b30, L2 M19
b27 / b28 / b30, L2 M31 b27 / b28 / b30 (u 910 / 911 / 912) — no record in any of his arrays, and the actions that set
them are not his (§3). **Enabled with no record:** L0 M16 b18 / b19, L0 M17 b18 (c 60 / c 61) — on with the tail cut,
nothing to draw.

Counts: 19 out-of-mask (the survey's 19) = 4 always + 5 posture-0 + 1 tail-on + 1 death + 3 tail-cut-no-record + 5
never; 10 in-mask gated.

**Records to export with the `--apply`:** **u 202** (`cm202_035`) and **u 360** (`em007_00_000`) — both always on, on
L2 M24. (c 0 / 1 / 2 / 3 / 30, c 3000, u 321, u 351, u 380 are exported and become driven.)

## 3. Which plays reach the keyed clips — CLIP_ACTIONS

**Diablos's command table is Bloodbath's file** (R, data): `em007_00\enemy\cmd_tbl\em007_00_cmdtbl.emc` and
`em007_04\...\em007_00_cmdtbl.emc` have one md5 (`bb385e7e...`). The streams split by variant with **op 0x92** (the switch on
`e+0xb5f5`, states-em001.md): g0 s3 `92 01 00 | 20 04 | 92 02 | 20 17` sends variant 0 to group-0 stream 4 and every
other to stream 0x17 (23), the head of streams 23..26 that call Bloodbath's group-1 streams. The walk
(`d07/issued_var2.py`: roots g0 s0 — the binding starts there, rom-map `0x825f8` — and every stream of groups 2..20; op
0x14 n followed as a call of g1 sn, op 0x20 n as a jump to g0 sn; op 0x92 evaluated for the variant; every other
condition walked both ways): **variant 0 reaches 78 streams and 85 actions, variant 4 103 and 132**. Variant 0 issues
**none of (7, 0xb4..0xb8)** (only g1 s103 issues them, called only from g0 s26, reached only through the variant-4 jump)
— so his L2 M15 / M19 / M31 action arms never fire, and with no record on their bits nothing would show anyway. Op 0x20's
meaning is **I** (from the data: the variant split lands on two different stream families); op 0x92 / 0x14 per the
rom-map rows. The event group 7 (g7 s1 issues (7, 0x67 / 0x70 / 0xc8 / 0x6a)) is walked as a root for both variants:
which event stream the engine starts per variant is **NR**; (7, 0x70) plays L9 M11, a list Diablos does not ship, so g7 s1
is Bloodbath's in practice (I) — and for (7, 0x67) his word is the same either way.

    // DIABLOS (em007_00): the plays of the clips his word (0xd4532c, variant 0) keys on the posture or the action.
    //   L0 M5 / L0 M7: the POSTURE decides (P+0x1ba, set before the motion): posture 0 -- the moves (2, 0 / 4 / 9 / ...) via
    //     0xd393fc (L0 M5) and (2, 6 / 7 / 8 / 0xc / 0x1a) via 0xd39c40 (L0 M7) -- fires bits 24-26 (c 0 / c 1; c 2 / c 3 /
    //     c 30); posture 4 -- (6, 2) 0xd3b908 (L0 M5), (6, 3) 0xd3b9fc the burrow with u 1400 and 0xd3c4a0 (L0 M7) -- does not.
    //   L3 M20: death (11, 7) / (11, 0x12) / (11, 0x22) and (11, 3) after L3 M21 -> bit 23 (c 3000); the pit holds (10, 0x63 /
    //     0x65 / 0x66 / 0x7d..0x80) -> bit 22 (vt+0x3f4 = 0x7fed4; states-em007_00.md: the death and pit rows). One entry each.
    //   His action-keyed arms on L2 M15 / M19 / M31 need (7, 0xb4..0xb8), which his command table never issues: no entry.
    em007_00: {
      '0|Motion[5]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
      '0|Motion[7]':  [{ action: null, posture: 0 }, { action: null, posture: 4 }],
      '3|Motion[20]': [{ action: [10, 0x63] }, { action: [11, 0x07] }],
    },

(The `action: null` posture entries are Bloodbath's shape: the word reads no action on L0 M5 / M7. Of the posture-4
plays, the EMC walk finds (6, 3) issued at variant 0 (g1 s21 / s22 / s61) and **(6, 2) issued by no stream** — who reaches
`0xd3b908` for him is NR; `0xd3c4a0`'s action is NR.)

**Flag, not the word's:** MOTION_STATES em007_00 `'0|Motion[7]': { hold: ['em007_00u', 1400] }` holds u 1400 on every
play of L0 M7, but the ROM starts it only from the burrow `0xd3b9fc` (`b 0xa499c` at `0xd3bfcc`, posture 4; rom-map row
"`em007_00` ... `0xd3bfcc`"). With the posture-0 entry above, the walking / attacking play would carry it too. Keying the
hold on the play (posture 4 only) is a MOTION_STATES question for the Viewer agent — the same flag as Deviljho's L0 M6.

## 4. The other Diablos gaps (survey "Diablos" / "What closing each needs")

| gap | status | what closing it needs |
|---|---|---|
| enable word unread (item 1) | **R, closed here** (§1) | §5 steps 1-3 |
| PSL records not exported: u 202, u 360 | R (§2) | the `--apply` exports them (cm202_035 / em007_00_000 are already exported under other keys: no new efl) |
| state.severed for his word | **R, new gap** | `SHELL_TAIL.em007_00 = { severed: 4 }` (§1) |
| u 1400 held on every L0 M7 play | R (the site) / flag | MOTION_STATES: hold on the posture-4 play only (§3) |
| CUT_TAIL | R, already right | tail-option.js `em007_00: { piece: 'em007_00_tail', joint: 145, above: 20, landing: ['em007_00u', 905] }` matches rom-map's corrected row (`0xd32730 mov r3,#0x91` -> `0xd32810 bl 0xc2274`, no variant test on the path). His MOTION_STATES '3|Motion[15]' comment "u 900 ... JOINT 144" is the record's own joint, not the drop joint — consistent |
| 0x9b76e4 refusal (item 2) | n/a | his soak is clean (68 motions, 0 refused) |
| undriven non-deliberate records (item 3) | n/a | the survey lists none for him (hyper u 1301..1315, blast / notice, c 1500 are deliberate) |
| L2 M22 u 900 b21 | R | stays off for him (§2); nothing to do |
| u 910 / 911 / 912, c 60 / c 61 | R | named with no record in any of his arrays: not effects |

## 5. What to implement, in order

1. psl-mask.js: `em007_00` as §1 (after `em007_04`, which it calls) into CLASS_MASK; `'em007_00'` into
   `PSL_MASK_MONSTERS`; CLIP_ACTIONS `em007_00` as §3.
2. motion-states.js SHELL_TAIL: `em007_00: { severed: 4 }` (beside em007_04's `{ severed: 4 }`; his set 10, theirs set 11,
   both draw group 4).
3. `add_effects.py em007_00 --apply` (CLIP_EFFECTS from the whole blocks; exports u 202 / u 360), `--record`, `--check`.
   Recorder slot — announce (efx: one recorder and one lift at a time).
4. Soak with `--viewer-inputs`; Raven verifies: c 0 / c 1 on L0 M5 and c 2 / c 3 / c 30 on L0 M7 on the posture-0 play,
   not on the burrow play; c 40 / u 320 / u 321 / c 21 / c 22 with the tail on, c 42 on L0 M2 / L2 M20 only after the
   sever; c 3000 on L3 M20's death play, not the pit play; u 202 / u 360 / u 380 / u 351 every play.

NOT READ, by name: which event-group-7 stream the engine starts per variant; op 0x20's semantics (I from the data); who
issues (6, 2) at variant 0 and which action reaches `0xd3c4a0`; the op-0x6f selector 0x17's field ctl+0x68 (gates g1 s103,
moot at variant 0); what c 0..3 / c 30 / c 3000 / u 202 / u 360 look like.

## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation

**L0 M7's posture-4 plays make two different requests** (reqtrace.py): `0xa499c(e, 2)` = **u 1400** for (6, 3 / 6 / 0x10 / 0x21 / 0x22 / 0x23 / 0x2a) (`0xd3bfcc`) and `0xa499c(e, 1)` = **u 1121** for (6, 0xf / 0x17 / 0x1c / 0x1d / 0x24 / 0x25 / 0x28 / 0x29 / 0x2b / 0x2c) (`0xd3c748`, which the u 1400 sweep closed as "not a u 1400 site"); the posture-0 plays (2, 6 / 7 / 8 / 0xc / 0x1a), (7, 0x6a) ask nothing. Viewer, both variants: CLIP_ACTIONS L0 M7 copies A (posture 0) / B (6, 3) / C (6, 0xf), posture 4; rows '#B' u 1400, '#C' u 1121 (event twin of the puff record), gated posture 4 as before. The class ids on L0 M1 match the copies already there: (6, 0xe / 0x11 / 0x18) c 1001 = c 30, (6, 0x1b / 0x26 / 0x27) c 1002 = c 40, (6, 0x32) u 1002 = Bloodbath's UNIQUE 230 (em007_00u has 230 only in SEQUENCE: nothing for Diablos).
Bloodbath's (7, 0xb8) reaches L2 M19 only with `0x78b78` answered (0xd3d7a0..0xd3d808, table 0xd3d810 entry 19 -> 0xd3dc18): the CLIP_ACTIONS entry stands (deep.py FORCE=0x78b78=1, both variants).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **The event-group-7 stream per variant -- READ.** Group 7 starts at stream P+0x369, written by `0x7fba0(e, delay, k)`; the only
  calls in his band are `0xd32a00`'s, Bloodbath's HP-stage machine, entered from `0xd32838` for **variant 4 only**: g7 s0 at the first
  rung (ctl+0x6c), g7 s1 at the second (ctl+0x6d). So Diablos starts no group-7 stream; g7 s1's (7, 0x67 / 0x70 / 0xc8 / 0x6a) are
  Bloodbath's (the I above is now R).
* **Op 0x20 -- READ** (`0x83f4c`): in group 0 a call of g0 sn with a return pushed; in other groups skipped. Op 0x14 (`0x83e1c`) is a
  call of g1 sn. The walk's reachability stands.
* **(6, 2) -- named, unreachable**: only g1 s16 issues it and no stream calls g1 s16; nothing in the band follows into it.
  **`0xd3c4a0`'s actions -- READ**: (6, 0xf / 0x17 / 0x1c / 0x1d / 0x24 / 0x25 / 0x28 / 0x29 / 0x2b / 0x2c) (census), the u 1121 copy C.
* **Selector 0x17 / ctl+0x68 -- READ**: a timer set at the start of (7, 0xb4..0xb8) (actiontune int 0xc), counted down only at
  variant 4. Diablos never sets it, so g1 s103 is closed to him twice over.

## The burrow floor and the frame handler's dust (effects lane, 2026-10-20)

* **The floor is the unit, on every clip he plays on the ground or under it.**
  - 0xbf284 pins `P+0x44 = P+0x5b4` in postures 0 / 3 / 4 / 6, and the setter 0xbc7f4 does the same on entering 0 / 4.
  - The move pass keeps vertical steps only in postures 1 / 2 / 5 / 6 (0xae370, mask 0x66).
  - The burrow depth P+0x5c is a draw offset (e+0x1384).
  - So base01's 900 arm reads 0 on L0 M24 / M33 / M43. The viewer's lowest-reach floor had put the ground 1345 (M24) and
    2043 (M33) below him, and the dust was deleted there.
  - index.html `FLOOR_AT_UNIT` now puts the floor at the clip origin, for Diablos, Bloodbath and the Begins Burrowed monsters,
    on clips whose posture includes 0 / 3 / 4 / 6. The rom-map has the rows under "The ground under the unit".
* **Metered** (draw meter; the control is the old rule, served beside the new):

  | clip | dust | old rule | new rule |
  |---|---|---|---|
  | L0 M24 | c 2 (shell01 mode 11, f58) | none | 1 start, draws (lit 9 / 10) |
  | L0 M33 | c 1 (mode 12) | none | 7 starts, draws (53 / 62) |
  | L0 M43 | c 1 | 3 starts, draws | 3 starts, draws |

  L0 M43's floor was at the unit already.
* **Bloodbath (em007_04)**: the same dust drew under neither rule. His 0x71 modes 10 / 11 / 12 name ef list 1 = em007_00c c 0 / 2 / 1,
  and docs/effects/em007_04.json had no 'shell' entries for them. The three were appended in place, copied from em007_00.json.
  Metered: L0 M24 c 2, L0 M33 c 1 and L0 M43 c 1 now start 1 / 7 / 3 and draw.


## u 200 and Bloodbath's u 900 (effects lane, 2026-10-25)

* **u 200 (Diablos)**: both class sites (0xd363a4, 0xd36620) are behind `ldrb [e+0xb5f5] / cmp #4 / bne` (0xd36348, 0xd365c4) -- variant
  4 only -- and em007_00u holds no UNIQUE 200 (its 200 is SEQUENCE cm202_035; the request resolves UNIQUE). Control: Bloodbath's u 200
  draws. Brought to the coordinator.
* **u 900 (Bloodbath) on L2 M22**: (7, 0x5c / 0x5f / 0x65 / 0x67) play it from frame 0 (allmot2.py, variant 4); only (7, 0x67) lights bit
  21 (0xd45494) -> u 900 at f7. CLIP_ACTIONS em007_04 '2|Motion[22]': (7, 0x5c) (the three base plays), (7, 0x67). (7, 0x67) is issued
  in g7 s1 of the shared cmdtbl.

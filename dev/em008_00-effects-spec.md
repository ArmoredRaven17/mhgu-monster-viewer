# Yian Kut-Ku (em008_00) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-15 (the Bird Wyverns survey's "overrides to read", Kut-Ku first). Static ROM
reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming instruction
read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/bird-wyverns-effects-survey.md ("Yian Kut-Ku"), rom-map.md ("The PSL enable word per class":
`0xd514b8` R / UNREAD; nothing else under the address), docs/render/psl-mask.js (every word transcribed so far),
dev/em038_00-effects-spec.md / dev/em042_00-effects-spec.md (format), E:\offline\decode\notes\states-em008_00.md (its
vtable table names +0x13c "attack hit groups (base then a motion-0x20c special case)" — the slot is the enable word;
"motion-0x20c" is right), the task board (grep: only the survey's own line).

Survey gap: enable word unread, 16 bindings outside the file mask (116 file-mask bindings, 132 whole-block), u 560 named
on L2 M12 and not exported.

## 1. The word — uEm008_00 vt+0x13c = `0xd514b8` — R, emulated

Vtable **`0x179ac54`** (checked: `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x3f4` = `0x7fed4`, `+0x1f4` the action
main `0xd4fdd8`, `+0x208` `0xd4ffa4`). Extent **`0xd514b8..0xd514e0`**: one `push {r4, r5, fp, lr}`, exits `popne` at
`0xd514cc` and `pop` at `0xd514e0`; `0xd514e4` is the next function's `push {r4-r8, sb, sl, fp, lr}`.

    0xd514c4  bl 0xca170                        ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xd514c8  motion != 0x20c (L2 M12) -> return (popne 0xd514cc)
    0xd514d4  |= 0x38000 (bits 15-17)           ; ldr r0, [r4, r0]! (r0 = 0x13f4, the movw at 0xd514d0), orr, str [r4]
    every other motion: the base alone

That is the whole method: **no action, variant, part-break, sever, posture or state read** (`r5` = the motion is the
only input it keeps; nothing after the `bl` loads from `r4` but the word itself).

Negative with control: the band `0xd46674..0xd52f04` (from uEm007_00's highest vtable entry `0xd46674` to uEm009_00's
lowest `0xd52f04`; uEm008_00's own entries span `0xd46da0..0xd51dac`) has exactly one `0x13f4` immediate, `0xd514d0`, inside this method; the same scan
(`<scratchpad>/ng/immscan.py`) over `0xd31b64..0xd70000` finds uEm007_00's `0xd45354` and uEm009_00's two (`0xd5e7e4`,
`0xd5e828`).

**The plays of L2 M12** (R): the band's only two setMotion sites for `0x20c` are in `0xd48280(e, r1)`: phase 0 takes
posture 0 (`0xbc7f4`) and setMotion0 L2 M12 (`0xd482d4`, blend 6.0); at the clip's end, `r1 == 0` plays it a second time
(phase 2, `0xd48398`), else hands to vt+0x3dc. Reached from **(1, 8)** (`0xd4808c`, `r1 = 1`: once) and **(7, 0xe)**
(`0xd4ef0c`, `r1 = 0`: twice) — the action-main table `0xd4fe00` and each status's table, `<scratchpad>/ng/jt.py`. (1, 8)
is issued by cmdtbl g13 s0 (nine times, in both arms of its op-0x24 block, among op-0x02 draws); no op 00 in `em008_00_cmdtbl.emc` issues (7, 0xe) — what
reaches it is NR. Neither matters to the word: it reads the motion only, and each setMotion rebuilds it, so the second
play fires its bits again.

**Emulated** (`<scratchpad>/emu13c.py 179ac54`, `motion:status:number:sever:rage:tired`):

| case | word |
|---|---|
| L2 M12 calm | `0x381ff` |
| L2 M12 enraged | `0x38e3f` |
| L2 M12 tired | `0x3f03f` |
| L2 M12 (7, 0xe) calm | `0x381ff` |
| L2 M12 (1, 8) enraged + tired | `0x38e3f` |
| L2 M12, P+0x3b4 bit 0 set | `0x381ff` (not read) |
| L2 M11 / L2 M13 / L1 M12 / L4 M12 / L0 M12 calm | `0x1ff` each |
| L2 M1 enraged | `0xe3f` |
| L1 M104 tired | `0x703f` |

All match the read.

**For psl-mask.js CLASS_MASK:**

    // YIAN KUT-KU (em008_00), uEm008_00 vtable +0x13c = 0xd514b8 (vtable 0x179ac54; +0xf0 the base 0xca52c), READ whole
    // (0xd514b8..0xd514e0, the pop) and emulated (dev/em008_00-effects-spec.md 1). It calls 0xca170 first, then:
    //   * L2 M12 (0x20c): bits 15-17 (0x38000) always -- u 560 (cm202_030) at f40. Its plays: 0xd48280, from (1, 8) once
    //     and (7, 0xe) twice; the word reads neither (no action, variant, part or state input).
    //   * every other motion: the base alone -- so L2 M12's bits 18 / 21 (u 570 / u 580, no record) are never enabled,
    //     nor L1 M104's bit 24 (u 90, no record).
    function em008_00(motion){
      return motion === 0x20c ? 0x38000 : 0;
    }

Inputs: rage / tired from the viewer's toggles, as for every monster. No `severed`, `posture`, `sunk` or action — **no
CLIP_ACTIONS entry**.

## 2. What the word changes — whole-block plan (116 file-mask bindings -> 132 whole-block)

`<scratchpad>/ng/planrows.py em008_00 [--whole]`; `add_effects.py em008_00` (plan): 28 records can go in, 28 already are;
whole-block: 29 (u 560 the one new). Every binding not listed sits on bits 0-5 inside the file mask and stays always-on.

**Turned ON — the survey's 16 outside the file mask:**

| binding | record | game |
|---|---|---|
| L0 M12 b0 f30 / b1 f3 | c 1 / c 0 (`cm202_001`) | always (bits 0-5) |
| L0 M117 b0 f62 / b1 f22 / b2 f9 | c 31 (`cm202_021`) / c 0 / c 1 | always |
| L0 M118 b0 f62 / b1 f22 / b2 f9 | c 31 / c 1 / c 0 | always |
| L1 M38 b0 f80-90 | u 260 (`cm202_005`) | always |
| L2 M2 b0 f15, f75 / b1 f45 | c 2 / c 3 (`cm202_002`) | always |
| **L2 M1 b9** f78, f148, f237, f293 | u 200 (`em008_00_000`) | **enraged only** (the base's 9-11) |
| **L2 M12 b15** f40 | **u 560** (`cm202_030`, 4 model) — **not exported** | always on L2 M12 (the class arm) |

**Named, never enabled** (outside the mask, and no record in any array either — not effects):

| binding | why |
|---|---|
| L2 M12 b18 u 570, L2 M12 b21 u 580 | the arm ORs bits 15-17 only (emulated L2 M12: `0x381ff` / `0x38e3f` / `0x3f03f`) |
| L1 M104 b24 u 90 | no arm for 0x168; the base sets nothing above 14 (emulated `0x703f`) |

So 13 of the 16 turn on: 11 always, 1 by rage, 1 by the class arm (u 560, which needs its export); 3 are named-but-never-
enabled and have no record.

**Gated** (in the file mask — the viewer fires them in every state today):

| binding | record | game |
|---|---|---|
| L2 M1 b6 | u 200 | calm, not tired (with b9 above: one u 200 calm or enraged) |
| L2 M1 b12 | u 220 (`em008_00_000`) | tired and calm only |
| L2 M2 b6 / b9 | u 200 | calm / enraged — today both fire, doubling u 200 at f27, f49, f85 |
| L2 M2 b12 | u 220 | tired-calm only |
| L2 M3 b6 / b9 | u 200 | calm / enraged — today doubled at f31 |
| L2 M3 b12 | u 220 | tired-calm only |

**Turned OFF:** none (every file-mask bit above 5 is a state-group bit the base sets in some state).

So the class turns ON 13 bindings (one record to export), names 3 that never fire, and state-gates 8.

## 3. What to implement, in order

1. psl-mask.js: `CLASS_MASK.em008_00` as §1; `'em008_00'` into `PSL_MASK_MONSTERS`.
2. `add_effects.py em008_00 --apply`, `--record`, `--check` (regenerates CLIP_EFFECTS from the whole blocks; exports
   **u 560** `cm202_030` for L2 M12 b15, the survey's one unexported record). Recorder slot — announce.
3. Soak with `--viewer-inputs`; Raven verifies: u 560 at f40 of L2 M12 (each of the two plays of (7, 0xe)); u 200 once,
   not twice, on L2 M1 / M2 / M3, and u 220 in its place while tired and calm.

NOT READ, by name: what issues (7, 0xe) (no op 00 in the cmdtbl names it); what L2 M12's unenabled bits 18 / 21 and
L1 M104's bit 24 were authored for (the data names them, no record and no arm).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **(7, 0xe) -- named, controlled**: no op of the command table carries it (all ops scanned, not only op 00; (1, 8) found in g13 s0
  as the control), no literal issuer in the band and no follow (census; (7, 0xa), (2, 1), (7, 0x51..0x5e) found). L2 M12 stays
  (1, 8)'s single play and (7, 0xe)'s double; the word reads neither.

# Rathalos (em002_00), Silver Rathalos (em002_02), Dreadking Rathalos (em002_04) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-16 (dev/flying-wyverns-effects-survey.md "Rathalos" / "Silver Rathalos" /
"Dreadking Rathalos" and "What closing each needs", item 1). Static ROM reading plus unicorn runs; no recorder, no lift, no
`--apply`, no docs/ edit. `R` = READ (the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: the survey (42 bindings outside the file mask on each; records not exported: R u 290 / 502 / 503 / 510,
Silver + u 291, Dreadking + u 291 / 522 / 523; gaps "--", soak clean), rom-map.md ("THE PSL ENABLE MASK"; "The PSL enable word
per class": uEm001_00 `0x1793c28` / `0xd09054` "override UNREAD"), docs/render/psl-mask.js whole, dev/em043_00-effects-spec.md
(the format), C:\MHGU-RE\offline\decode\notes\states-em001.md §1 / §8, breaks-em001.md §5 (names this slot "attack hit groups",
reads the L2 M3 / M4 arm), states-em002_04.md §1 / §3.3 / §4 / §6, motion-states.js (SHELL_TAIL, RAGE_PUFF, TIRED_DROOL),
shells.js (pickVariantsFor, questLevel), index.html playNow, the task board (no read of this slot). Scratch:
`<archive>\rath2\` (emu13c_r.py, jscheck_r.py, cliprev2.py, pv.mjs, the plans em002_0X_file / _whole.txt).

## 0. There is no uEm002_00 — the Rathalos line runs RATHIAN'S CLASS, uEm001_00 — R

* `main.rodata` holds the string `uEm001_00` once and **no `uEm002_00`** (control: `uEm003_00`, `uEm004_00`, `uEm007_00` found the
  same way); efx/class-effects.json lists uEm001_00 then uEm003_00. The enemy id -> descriptor map `0x50aa8` (table `0x1594ca4`)
  gives {1: 0, 0x201: 1, 0x401: 2, **2: 3, 0x202: 4, 0x402: 5**} (states-em002_04.md §1) — six monsters, one class, vtable
  **`0x1793c28`**. Inside it the class tells them apart by the em byte `e+0xb5f4` (1 / 2), the variant byte `e+0xb5f5` (0 / 2 / 4)
  and the enemy id word `e+0xb5f0` (1, 0x201, 0x401, 2, 0x202, 0x402) (shells-em043.md: the ctor stores all three).
* So the survey's "the Rathalos line uEm002_00" names a class that does not exist (rom-map WITHDRAWN row added). **The
  enable word below is ONE method shared with Rathian / Gold / Dreadqueen** — the Rathian-line agent reads the same `0xd09054`.
  I read it whole (an extent cannot be bounded otherwise) but transcribe only em 2; which arms are whose is in §1.

## 1. The word — uEm001_00 vt+0x13c = `0xd09054` — R, emulated

Vtable `0x1793c28` (checked here: `+0x13c` = `0xd09054`, `+0xf0` = base `0xca52c`, `+0x370` = `0xa3bf4`, `+0x1f4` = `0xcee3d8`,
`+0x204` = `0xced4e0`, `+0x210` = `0xcf253c`). Extent **`0xd09054..0xd09420`**: one `push {r4-r8, sb, fp, lr}`, one exit `pop`
at `0xd09420` (every arm returns there), literal pool `0xd09424` / `0xd09428` (both -> GOT `0x1831c54`, the quest-rank chain),
next function's `push` at `0xd0942c`. The jump table `0xd09090..0xd0917f` (60 words, offsets from `0xd09090`, bounded by
`cmp r0,#0x3b`) is inside.

    0xd09060  bl 0xca170                                     ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    motion > 0x405:
      k = motion - 0x406, k <= 0x3b -> table 0xd09090:
        L4 M6 / M50 / M52 / M55 / M65 (0x406 0x432 0x434 0x437 0x441) -> 0xd09288
        L4 M32 (0x420) -> 0xd09180          L4 M38 (0x426) -> 0xd093d8          the other 53 -> return
      k > 0x3b: L9 M2 / L9 M6 (0x902 / 0x906) -> 0xd09288, else return
      0xd09288  em byte e+0xb5f4 != 1 -> return                                     ; RATHIAN'S (em 1) arm: nothing for em 2
      0xd09180  em byte == 2 AND NOT 0x81614 (tired) AND status e+0x73e0 == 7 AND number n in
                {0x2b, 0x2c, 0x48, 0x49} (n - 0x2b <= 0x1e, `tst` of 0x60000003) or n == 0x29 or n == 3
                -> |= 0x38000000 (bits 27-29)                                     ; em 2 ONLY
      0xd093d8  0x6fe88(e, 7, 0xf5) -> word = (word & 0x3fffe03f) | 0xc0000000      ; NO em / variant test
                (clears bits 6-12 -- the calm and enraged groups and bit 12 -- and sets 30-31)
    motion <= 0x405:
      L0 M16 / L0 M17 (motion - 0x10 < 2): status 1 and n in {7, 8} -> |= 0xc0000 (bits 18-19)   ; no em test
      L2 M3 / L2 M4 (motion - 0x203 < 2):                                                     ; no em test
        vt+0x370(e, 1) (0xa3bf4, P+0x3b4 bit 0: the tail severed) -> |= 0xe00000 (bits 21-23)
        else variant e+0xb5f5 != 4 -> |= 0x38000 (bits 15-17)
        else L7 = 0x9d36c(e, 7) (part 7's break level); row = .dtp array [[e+0x75f0]+0x64] byte +0x11 if 0x3a8430 (rank) <= 4
             else +0x12; L7 >= row -> |= 0x1c0000 (bits 18-20); else 0x49930(e) (the QUEST'S NUMBER, a thunk to 0x3a8470)
             <= 5 unsigned (`movls`) -> 0x1c0000; else 0x38000
      L2 M1 (0x201): the enemy id halfword e+0xb5f0 in {0x201, 0x202} or == 0x401 (Gold, SILVER, Dreadqueen) AND NOT 0x81614
        -> |= 0x7000000 (bits 24-26)                                                         ; Rathalos (2) and Dreadking (0x402): nothing
      every other motion: the base alone

Callees, each read: `0xca170`; `0xa3bf4`; `0x81614` (whole, `..0x81630`: `(P+0x505 & 0xfe) == 2`, NOT gated on rage); `0x6fe88`
(`e+0x73e0 == r1 && e+0x73e1 == r2`, em043 spec); `0x9d36c` (P+0x3bc + 12 x part, em018 spec); `0x3a8430` (rank byte); `0x49930`
(head read: GOT load then `0x3a8470`; `0x3a8470` read whole `..0x3a84d4`: the quest id mod 100 for an ordinary quest via
`0x3b8eb4`, else 0 or 0x10, sign-extended byte — the same reading as shells.js `input.questLevel`).

**Whose arms (for the Rathian-line agent):** em 1 only — L4 M6 / M50 / M52 / M55 / M65 / L9 M2 / M6 (`0xd09288`). em 2 only —
L4 M32 (`0xd09180`). By id — L2 M1 (Gold, Silver, Dreadqueen). Shared, no em test — L2 M3 / M4 (variant 4 = Dreadqueen AND
Dreadking), L4 M38 (7, 0xf5), L0 M16 / M17 (1, 7 / 8).

**Negative with control:** the class band `0xcecd74..0xd0f400` has exactly six `#0x13f4` immediates (`immscan.py`), `0xd091e0`,
`0xd092b4`, `0xd092fc`, `0xd093c8`, `0xd093f0`, `0xd09410`, all in the method; the same scan over uEm043_00's band finds its two
(`0xe81018`, `0xe8108c`).

**Emulated** (`<archive>\rath2\emu13c_r.py`: bw1/emu13c_bw.py plus e+0xb5f4 / e+0xb5f0, the quest number hooked at `0x49930`,
the monster's own .dtp array). **Controls first:** Deviljho L2 M10 calm / tired `0x381ff` / `0x3f03f`; Garuga L2 M2 `0x1bf`;
Deadeye L0 M7 (7, 0xe5) `0x380001ff`, L2 M12 level 2 `0x1c01ff` — all the earlier specs' words.

| case (em 2) | word |
|---|---|
| L2 M3 v0 intact / severed; L2 M4 v0 enraged; L2 M3 v2 | `0x381ff` / `0xe001ff`; `0x38e3f`; `0x381ff` |
| L2 M3 v4: L7 0 q 10 / L7 2 / L7 1 / q 5 / q 6; L2 M4 v4 severed | `0x381ff` / `0x1c01ff` / `0x381ff` / `0x1c01ff` / `0x381ff`; `0xe001ff` |
| L2 M1 v0 / v2 / v2 tired / v2 enraged + tired / v4 | `0x1ff` / `0x70001ff` / `0x703f` / `0xe3f` / `0x1ff` |
| L4 M32 (7, 3 / 0x29 / 0x2b / 0x2c / 0x48 / 0x49) v0 | `0x380001ff` each |
| L4 M32 (7, 0x2d); (7, 3) tired; v4 (7, 3); v2 (7, 0x48) enraged; **em 1** (7, 3) | `0x1ff`; `0x703f`; `0x380001ff`; `0x38000e3f`; `0x1ff` |
| L4 M38 (7, 0xf5) calm / enraged / tired; (7, 0xf4) | `0xc000003f` / `0xc000003f` / `0xc000603f`; `0x1ff` |
| L0 M16 (1, 7); L0 M17 (1, 8); L0 M16 (1, 9); L0 M17 (7, 7) | `0xc01ff`; `0xc01ff`; `0x1ff`; `0x1ff` |
| L4 M6, L4 M65 severed, L9 M2 (em 2) | `0x1ff` each (em 1 L4 M65 severed `0xe001fd`, the control that the arm runs) |

The transcription below against the emulator (`jscheck_r.py`; node runs the JS, unicorn the ROM): 32 motions x up to 22
actions x sever x {calm, enraged, tired, enraged + tired} x L7 0..2 x quest 0 / 5 / 6 / 10 / -1 x rank 1 / 5 x variants 0 / 2 / 4
= **14976 runs, 0 mismatches**. Negative control of the checker: the same run with L2 M1's id test removed gives 32 mismatches.

**For psl-mask.js CLASS_MASK:**

    // RATHALOS (em002_00), SILVER RATHALOS (em002_02), DREADKING RATHALOS (em002_04): there is no uEm002_00 -- the six Rath
    // monsters run ONE class, Rathian's uEm001_00 (vtable 0x1793c28), told apart by the em byte e+0xb5f4, the variant e+0xb5f5
    // and the id word e+0xb5f0. vtable +0x13c = 0xd09054, READ whole (0xd09054..0xd09420, jump table 0xd09090) and emulated --
    // 14976 runs against the ROM, 0 mismatches (dev/em002-effects-spec.md 1). 0xca170 first, then by motion id (em 2's arms):
    //   * L2 M3 / L2 M4 (no em test): the tail severed (vt+0x370(e, 1) = 0xa3bf4) -> bits 21-23 (u 510 / u 511); else variant 4
    //     (Dreadking) with part 7's break level at .dtp row 4's (2 at both ranks) OR the quest's number 0x49930 <= 5 -> bits
    //     18-20 (u 522 / u 523); else bits 15-17 (u 502 / u 503).
    //   * L2 M1: the id word e+0xb5f0 0x201 / 0x202 / 0x401 -- of the em 2, SILVER only -- and not tired (0x81614, P+0x505,
    //     not gated on rage) -> bits 24-26 (u 290 / u 291).
    //   * L4 M32 (em 2 only): (7, 3 / 0x29 / 0x2b / 0x2c / 0x48 / 0x49) and not tired -> bits 27-29 (u 201 b27).
    //   * L4 M38: (7, 0xf5) -> bits 6-12 CLEARED and 30-31 set (u 600 / u 602 on, u 230 / 231 / 232 / 221 off).
    //   * L0 M16 / L0 M17: (1, 7) / (1, 8) -> bits 18-19 (c 60 / c 61: no record).
    //   * every other motion: the base alone (the em-1 arms -- L4 M6 / M50 / M52 / M55 / M65, L9 M2 / M6 -- are Rathian's).
    const EM002_L4M32 = n => n === 0x03 || n === 0x29 || n === 0x2b || n === 0x2c || n === 0x48 || n === 0x49;
    const em002 = (silver, v4) => (motion, action, state) => {
      const s = action ? action[0] : -1, n = action ? action[1] : -1;
      if (motion === 0x203 || motion === 0x204){
        if (state.severed) return 0xe00000;
        const q = state.questLevel;
        if (v4 && ((state.breakLevel7 | 0) >= 2 || (q != null && (q >>> 0) <= 5))) return 0x1c0000;
        return 0x38000;
      }
      if (motion === 0x201) return silver && !state.tired ? 0x7000000 : 0;
      if (motion === 0x420) return s === 7 && !state.tired && EM002_L4M32(n) ? 0x38000000 : 0;
      if (motion === 0x426) return s === 7 && n === 0xf5 ? { set: 0xc0000000, clear: 0x1fc0 } : 0;
      if (motion === 0x010 || motion === 0x011) return s === 1 && (n === 7 || n === 8) ? 0xc0000 : 0;
      return 0;
    };
    const em002_00 = em002(false, false), em002_02 = em002(true, false), em002_04 = em002(false, true);
    // CLASS_MASK: em002_00, em002_02, em002_04 -- and the three ids into PSL_MASK_MONSTERS

(The `{ set, clear }` form reproduces `& 0x3fffe03f | 0xc0000000` exactly: pslMask applies OR then clear, and the set bits are
outside the clear.)

Inputs, and how the viewer supplies each:

* **`state.severed`** — P+0x3b4 bit 0. The part driver `0xcf253c` (re-read here, `0xcf29e4..0xcf2aa4`) draws the tail set on the
  same `vt+0x370(e, 1)`: em 1 / 2 variant 4: severed -> set 13, else L7 >= the row byte (+0x11 / +0x12 by rank) -> 12, else 11;
  every other variant: severed -> 12, else 11. monsters.json: Rathalos and Silver draw part 8 only on set 12; Dreadking part 8
  only on set 13, part 13 only on set 12. **SHELL_TAIL (motion-states.js) needs `em002_00: { severed: 8 }, em002_02: { severed: 8 }`**
  (Dreadking's `{ severed: 8, broken: 13, level: 2 }` is there and right). R.
* **`state.breakLevel7`** (Dreadking only) — part 7's level vs the .dtp row 4 bytes: em002_04_dtbparts.dtp row 4 = `07 02 02 00`
  (part 7, level 2 at both ranks; Rathalos and Silver have 4 rows only). The existing SHELL_TAIL em002_04 gives 2 while part 13 is
  drawn, the driver's own test. R.
* **`state.questLevel`** — NEW field: 0x49930, the quest's number, read only on Dreadking's intact-tail L2 M3 / M4. index.html
  passes nothing to pslMask today; pass **`questLevel: SHELL_QUEST_LEVEL`** (10, the stand-in shells.js already reads), which
  leaves the arm off. Quests numbered 0..5 would fire u 522 / u 523 with the tail unbroken — the viewer's stand-in does not show
  that (named, as the shells' questLevel is).
* **`state.tired`** — 0x81614 is P+0x505 alone, not gated on rage. The viewer's `tired` is `!rage && ...`, so an enraged-AND-tired
  start (the ROM: no L2 M1 / L4 M32 bits) is shown as enraged (bits on). Named difference; the viewer has no such state.
* **`action`** — L4 M32 / L4 M38 / L0 M16 / M17. L4 M32 and L4 M38 already get their action from the shells' pick
  (shells.js `pickVariantsFor`: L4 M32 `7:0x03 / 0x29 / 0x2b / 0x2c / 0x48 / 0x49 / 9:0x03 / 0x04`, tired `7:0x29 / 0x35..0x38 /
  9:0x03 / 0x04`; Dreadking's L4 M38 `7:0x43 / 0x45 / 0x46 / 0xf5`), which index.html puts before CLIP_ACTIONS (§3).
* No posture, sunk, rank (the row bytes are equal at both ranks) or charge input.

## 2. What the word changes — whole-block plan (each monster: 42 bindings outside the file mask)

`<archive>\bw1\planrows.py <mon> [--whole]` and `recs.py` (rath2/em002_0X_file.txt / _whole.txt). Rathalos 174 file-mask ->
216 whole, Silver 186 -> 228, Dreadking 206 -> 248. The three monsters' out-of-mask rows are the same bindings (records differ).

**Turned ON, always** (outside the file mask, bits 0-5 — 5): L2 M5 b0 u 200; L2 M9 b0 u 260; L4 M42 b2 u 321, b3 u 380; L4 M43
b3 u 380 (all exported).

**Turned ON by state** (outside the mask, the base's groups — 26): the fireball's forms on L2 M5 / M15 / M16 / M17 / M18: b6 / b9
u 201 (calm / enraged), b7 / b10 u 202 (calm / enraged), b12 u 221 (tired-calm) — 25; L4 M48 b12 u 200 (tired-calm). All exported.

**The L2 M3 / M4 arm** (f33, the tail's impact — 5 out of mask + 1 gated in mask):

| binding | record | Rathalos / Silver | Dreadking |
|---|---|---|---|
| L2 M3 b15 / L2 M4 b15 | **u 502 / u 503** (`cm202_030` / `_031`, not exported) | tail on | tail on, not broken (and quest > 5) |
| L2 M3 b18 / L2 M4 b18 | u 522 / u 523 — no record on R / Silver; **Dreadking `cm202_030` / `_031`, not exported** | never | tail broken (L7 >= 2) or quest <= 5 |
| L2 M3 b21 (out of mask) / L2 M4 b21 (IN the mask — fires every play today) | **u 510** (`cm202_030`, not exported) / u 511 (exported) | severed | severed |

**L2 M1 b24 / b25** (u 290 f0-69 / u 291 f83-176): **Silver only, not tired** — **Silver's u 290 (`em001_02_002`) and u 291
(`em001_02_000`) not exported**. Rathalos (u 290 has a record `em001_02_005`, u 291 none) and Dreadking (both have records): NEVER
enabled — the id test is 0x201 / 0x202 / 0x401.

**L4 M32 b27** u 201 (f11, exported): on (7, 3 / 0x29 / 0x2b / 0x2c / 0x48 / 0x49), not tired; off on the take-off (2, 4..6),
(7, 0x35..0x38) and (9, 3 / 4) — all three monsters.

**L0 M16 b18 / b19, L0 M17 b18** c 60 / c 61: enabled on (1, 7) / (1, 8), **no record in em002_00c** — nothing on screen.

**Gated in the file mask** (the viewer fires them in every state today): L4 M22 b6-b13 (8: u 200 / 201 / 202 per group, u 221
b13), L4 M29 b6 / 7 / 9 / 10 / 12 / 13 (6: u 350 / u 201 / u 221), L4 M48 b6-b11, b13 (7), L2 M4 b21 u 511 (severed only) — 22 on
each; Silver and Dreadking also **L4 M38** b6-b11 (u 230 / 231 / 232 by group) and b12 (u 221): by state, and NONE on (7, 0xf5);
b30 u 600 (f0-82) / b31 u 602 (f83-84): ONLY on (7, 0xf5) — Dreadking `em002_04_004` / `_005` (exported, firing every play
today), Silver no record (nothing). Rathalos has no L4 M38.

**Records to export with the `--apply`** (turned on by the word):

| monster | records |
|---|---|
| Rathalos `em002_00` | **u 502, u 503, u 510** |
| Silver `em002_02` | **u 290, u 291, u 502, u 503, u 510** |
| Dreadking `em002_04` | **u 502, u 503, u 510, u 522, u 523** |

(recs.py's whole-plan list also names Rathalos's u 290 and Dreadking's u 290 / u 291: exportable, NEVER enabled by this word —
harmless if `--apply` takes them, nothing will fire them.) Named, no record anywhere: c 60 / c 61 (all three), R u 291 / 522 / 523,
Silver u 522 / 523 / 600 / 602.

## 3. Which plays reach the keyed clips — CLIP_ACTIONS: NONE NEEDED

* **L4 M32**: the ROM-run sweeps (efx/agents/rathian-variants-scratch actions3 / actions2 `em002_0X`, rank 5, theirs;
  `<archive>\rath2\cliprev2.py`) play it at step 34 (after L4 M31) for (2, 4 / 5 / 6), (7, 3 / 0x29 / 0x2b / 0x2c / 0x35..0x38 /
  0x48 / 0x49), (9, 3 / 4) — the same on all three. The viewer's shell picks for it (pv.mjs) are those actions, and index.html
  playNow takes `ri.variant` before CLIP_ACTIONS — so the word already gets each play's action. R (the sweep) / R (the code path).
* **L4 M38**: Silver and Dreadking (7, 0x43 / 0x45 / 0x46 / 0xf5), (7, 0x70) from f70; ABSENT from Rathalos's list 4. Dreadking's
  picks include `7:0xf5`, so his u 600 / 602 play comes in by itself. **Silver's picks are `7:0x43 / 0x45 / 0x46 / 0x70` — no
  0xf5** (the shells spawn nothing on it for him, I), so the viewer never shows his (7, 0xf5) play: in the game that play shows
  none of u 230 / 231 / 232 / 221 (bits 6-12 cleared) and has no u 600 / 602 records. A gap only in what is shown by omission;
  adding it would need the pick list or a CLIP_ACTIONS path that coexists with picks (index.html takes picks first). Whether any
  of Silver's command streams issue (7, 0xf5): NR.
* **L0 M16 / M17**: (1, 4 / 7 / 0xd) / (1, 5 / 8 / 0xe); bits 18-19 name only c 60 / c 61, which have no record — no entry.
* L2 M1, L2 M3 / M4: the word reads no action there.

## 4. The survey's other gaps for these three

* **Undriven records: none** (survey "gaps --"); soaks clean (109 / 113 / 129 motions, 0 refused).
* **Rage puff**: RAGE_PUFF em002_00 / 02 / 04 (u 1120 / 1121, joint 4, rathianPuffPick) — present; **drool**: TIRED_DROOL
  em002_00c 1104 for all three — present. Nothing owed.
* **Tail**: SHELL_TAIL lacks em002_00 / em002_02 (§1) — needed now, for L2 M3 / M4 u 502 / 503 vs u 510 / 511.
* The survey's "not exported" list is fully accounted for by §2 (no other record is owed).

## 5. What to implement, in order

1. psl-mask.js: `EM002_L4M32` / `em002` as §1; CLASS_MASK `em002_00`, `em002_02`, `em002_04`; the three ids into
   `PSL_MASK_MONSTERS`. No CLIP_ACTIONS.
2. index.html playNow: add `questLevel: SHELL_QUEST_LEVEL` to the pslMask state. motion-states.js SHELL_TAIL: `em002_00:
   { severed: 8 }, em002_02: { severed: 8 }`.
3. `add_effects.py em002_00 --apply`, `em002_02 --apply`, `em002_04 --apply` (CLIP_EFFECTS from the whole blocks; the §2 exports),
   `--record`, `--check`. Recorder slot — announce.
4. Soak with `--viewer-inputs`; Raven verifies: L2 M3 / M4 u 502 / 503 with the tail on, u 510 / 511 after the sever (u 511 no
   longer on every play); Dreadking's u 522 / 523 with the tail broken (part 13), not intact; Silver's L2 M1 u 290 / u 291 when
   not tired, none on Rathalos / Dreadking; L4 M32 u 201 on the attack picks, not on the take-off / (9, n); Dreadking's L4 M38 u 600
   / 602 only on the (7, 0xf5) pick, u 230..232 only on the others; the fireball forms and L4 M22 / M29 / M48 one group per state.

NOT READ, by name: who issues (7, 0xf5) for Silver, and why his shell picks omit it; who issues L0 M16 / M17's (1, 7) / (1, 8)
(no record rides them); the game's quest numbers for Dreadking quests (the <= 5 arm); what u 502 / 503 / 510 / 522 / 523 / 290 /
291 look like. The em-1 arms (L4 M6 / M50 / M52 / M55 / M65, L9 M2 / M6, and L2 M1 / M3 / M4 for Gold / Dreadqueen) are the
Rathian-line agent's to transcribe — read here only to bound the method.

## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation

**Silver Rathalos plays (7, 0xf5) too.** The line's g1 s224 / s235 issue it in op 0x6f(0xe)'s default -- vt+0x214 `0xcf15c8` selector 0xe (`0xcf1828`) = [ctl+0x2c] >= 0.0, no em or variant test -- and it plays L4 M38 for every variant (tracer). Silver's pick list left it out because his shell00 has no mode 31, which also took away the word's (7, 0xf5) play (bits 6-12 cleared: u 230 / 231 / 232 / 221 off). Listed now with no spawn (shells.js em002_02, op24 'else').

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **(1, 7) / (1, 8) -- READ.** (1, 7) is issued by em001_00_cmdtbl g1 s67 / s68 / s69 / s70; its body `0xcee720` plays L0 M16 and in
  phase 1 counts L0 M16's ends in P+0x1a2 -- at the third it follows (1, 8), L0 M17 (`0xceebe4..0xceec24`). (1, 4) / (1, 0xd) also
  play L0 M16 (`0xcf2f80`); their (1, 8) arm needs r1 == 1 and the one caller passes 0. c 60 / c 61 (bits 18-19) have no record:
  nothing changes on screen.
* **(7, 0xf5) for Silver -- READ before this sweep**: g1 s224 / s235 (shared table, no variant test); shells.js lists it with no
  spawn (rom-map Withdrawn row "shells.js em002_02").
* Still open, category a: Dreadking's quest numbers (`questLevel`).
* **Tired (with Rage) -- BUILT 2026-10-19** (CLASS_TOGGLES `tiredRage`, working label): with Enraged on, the play reads tired
  (0x81614 is P+0x505 alone; the stamina machine 0xbd1a4 sets it with no rage test), so L2 M1 / L4 M32 lose bits 24-26 as the ROM
  does. Checked on Rathalos L2 M3 (class-toggles.mjs).

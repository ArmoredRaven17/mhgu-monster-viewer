# Nargacuga (em037_00) and Silverwind Nargacuga (em037_04) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-14 (Raven: the Flying Wyverns' gaps, easiest first, from the bottom of
the lists). Static ROM reading plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ
(the consuming instruction read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/flying-wyverns-effects-survey.md (method; "Nargacuga", "Silverwind Nargacuga"), rom-map.md
(every em037 row: shells, beams, the pit ailments, the `0x175c3e8` table, the shell `ef` listId rule; none touches
vt+0x13c), dev/em032_00-effects-spec.md (the same "no override" case), docs/render/psl-mask.js, CLIP_EFFECTS em037_00 /
em037_04 in docs/render/monster.js, efx/class-effects.json, the task board's Flying Wyverns entry.

## 1. The word — uEm037_00 vt+0x13c = `0xca170`, the BASE — R (slot), emulated

Class `uEm037_00` serves both variants (one class in emclasses.json; em037_04 has no class of its own). Vtable
**`0x17bc47c`** — checked against the 4-bytes-low trap: `+0xf0` = `0xca52c` (the base copy hook), `+0x208` =
`0xe47b0c` = class-effects.json's frame handler, `+0x204` `0xe47748` and `+0x210` `0xe486f4` inside the band, `vt-8`
/ `vt-4` zero and `vt+0` / `vt+4` (`0xe47170` / `0xe471dc`) code at the band's start. **`+0x13c` holds `0xca170` itself: the class does not override the enable
word.** So for Nargacuga AND Silverwind the word is bits 0-5 always plus one state group (6-8 calm and not tired,
9-11 enraged, 12-14 tired and calm), and **no bit 15-31 ever fires**. No action, posture, sever, variant or charge
input: there is no class method to read one, and the base reads only P+0x518 (enraged) and P+0x505 (tired).

Negative with control: an immediate scan of the band `0xe47070..0xe5a204` for `0x13f4` finds nothing (no other
writer of the word in the class); the same scan finds the methods of uEm007_00 (`0xd45354`), uEm033_00 (`0xe3e3cc`)
and uEm038_00 (`0xe62cc0` / `0xe62ce8`).

**Emulated** (`<archive>/ng/emu13c2.py`, unicorn with the ARMv8 model; the harness first reproduced Bloodbath's
census words and Akantor's spec words exactly): L2 M5 calm `0x1ff`; L2 M21 severed + enraged `0xe3f`; L3 M4 tired
`0x703f`; L0 M38 posture 4 under ground `0x1ff`; Silverwind (variant 4) L9 M6 calm `0x1ff`, severed + enraged `0xe3f`,
L9 M8 (7, 0x10) tired `0x703f`. The base words exactly, for both variants.

**For psl-mask.js** (as Tigrex's entry):

    // NARGACUGA (em037_00) and SILVERWIND (em037_04), one class uEm037_00 (vtable 0x17bc47c): vtable +0x13c holds the
    // BASE 0xca170 -- no override, so bits 0-5 always and the state group, never 15-31, for both variants
    // (dev/em037_00-effects-spec.md 1; emulated: L2 M5 calm 0x1ff, L2 M21 enraged 0xe3f, L3 M4 tired 0x703f).
    const em037 = () => 0;
    CLASS_MASK: em037_00: em037, em037_04: em037
    PSL_MASK_MONSTERS += 'em037_00', 'em037_04'

## 2. What the word changes — whole-block plan, per binding

`add_effects.plan` with the monster added to `psl_mask_monsters()` (`<archive>/ng/planrows.py <mon> --whole`;
`--file` for the file masks). Nargacuga 96 -> 99 bindings, Silverwind 100 -> 104. **Every binding of both monsters
sits on bits 0-2** (Nargacuga: 60 b0, 28 b1, 11 b2; Silverwind: 65 / 28 / 11) — so nothing is gated by state, and
the word only turns bindings ON:

| binding | record | game | viewer today |
|---|---|---|---|
| **L3 M4 b1** f22 | c 10 (`cm202_001`, joint 80, exported) | always | not bound (outside the file mask) |
| **L3 M4 b2** f39 | c 11 (`cm202_001`, joint 90, exported) | always | not bound |
| **L0 M38 b1** f3 | c 31 (`cm202_020`, joint 0, exported) | always | not bound |
| **L9 M6 b0** f68 (Silverwind only) | c 61 (`cm202_021`, exported) | always | not bound |

The c records are `em037_00c` for both monsters (Silverwind loads Nargacuga's c.pel). Nargacuga's list 1 is Tigrex's
`em032_00_1.psl` (effects_triage config) — its bindings are on bits 0-5 as well.

**Not the word, in the same plan:** `c 50` (L2 M5 b0 f9, L2 M21 b0 f6 / f120; `cm202_020`, joint 143) and `c 52`
(L2 M5 b1 f12, L2 M21 b2 f11 / f124; `cm202_020`, joint 142) are IN the file masks, plan `ok` (frames match, builder
ok, not a stage-ray record) and simply never exported — no `add_em037_0x_c50` / `_c52` log exists. `--apply` exports
them on both monsters; no read is owed.

## 3. What to implement

1. psl-mask.js: `em037 = () => 0` for `em037_00` and `em037_04`; both into `PSL_MASK_MONSTERS`.
2. `add_effects.py em037_00 --apply`, `--record`, `--check`; the same for `em037_04` (binds the four above, exports
   c 50 / c 52). Recorder slot — announce.
3. Soak with `--viewer-inputs`. Nothing changes in any state, so no new viewer input is needed.

Silverwind's 13 undriven shell records (survey) are not the word and are not in this spec.

NOT READ, by name: nothing the word needs. (Why c 50 / c 52 were never exported is history, not ROM.)

# Ukanlos (em038_00) — effects spec: the PSL enable word

Research agent for the Viewer agent, 2026-10-14 (Raven: the Flying Wyverns' gaps, easiest first). Static ROM reading
plus unicorn controls; no recorder, no lift, no `--apply`, no docs/ edit. `R` = READ (the consuming instruction
read), `I` = INFERRED, `NR` = NOT READ.

Sources opened first: dev/flying-wyverns-effects-survey.md ("Ukanlos"), rom-map.md (the uEm038_00 shell / beam rows,
the "Barioth / Basarios / Ukanlos" section: his puff is done, `_autoOnRage` now lists em038_00), dev/em033_00-effects-
spec.md (the same `0x81d6c` sunk test), dev/fw-undriven-barioth-basarios-ukanlos.md §3, E:\offline\decode\notes\
states-em038_00.md (§0 / §6: never tired), docs/render/psl-mask.js (now carries em033_00 with `state.sunk`),
index.html `playNow` (the `severed` / `sunk` inputs), motion-states.js em038_00 and SHELL_TAIL, CLIP_EFFECTS em038_00.

Survey gap: enable word unread, 3 bindings outside the file mask (L3 M25 b0 c 1, L0 M2 b21 c 71, L2 M34 b9 u 350).
(His rage puff, the other survey gap, was closed on 2026-10-14: `_autoOnRage` += em038_00.)

## 1. The word — uEm038_00 vt+0x13c = `0xe62c8c` — R, emulated

Vtable **`0x17bd9ac`** (checked: `+0xf0` = base `0xca52c`, `+0x208` = `0xe5a8b4` = class-effects.json's frame
handler, `+0x2a4` `0xe5bf9c` = the live ukanlosPuffPick already cited, `+0x204` `0xe5a6e4` the on-action hook whose
`0xe5a784` is his sever call). Extent **`0xe62c8c..0xe62d00`**: one `push {r4, r5, fp, lr}`, exits `popne` at
`0xe62cbc` and `pop` at `0xe62d00`; `0xe62d04` begins an unrelated accessor (`[e+0xcac0]+0x48`, `bx lr`).

    0xe62c98  bl 0xca170                                  ; base: bits 0-5, 6-8 calm, 9-11 enraged, 12-14 tired-calm
    0xe62c9c  motion == 0x203 (L2 M3):                    ; 0xe62cd0
    0xe62cd8    r0 = e->vt[+0x370](e, 1)                  ; 0xa3bf4: P+0x3b4 bit 0, the tail sever
    0xe62cec    |= r0 ? 0x1c0000 (bits 18-20) : 0x38000 (bits 15-17)     ; movne at 0xe62cf4
    0xe62ca8  motion == 0x002 (L0 M2):
    0xe62cb4    r0 = 0x81d6c(e)                           ; posture P+0x1ba == 4 AND P+0x5c < 0.9 x 0xbf62c(e)
    0xe62cbc    r0 != 0 -> return (nothing)               ; popne
    0xe62cc8    else |= 0xe00000 (bits 21-23)
    every other motion: the base alone

Both writes go through the post-indexed pointer (`ldr r0, [r4, r0]!` at `0xe62cc4` / `0xe62cf0`, then `str r0, [r4]`
at `0xe62cfc`) — the field is `+0x13f4` (the `movw` before each). `0x81d6c` read whole (`0x81d6c..0x81db4`): posture
byte `[[e+0x1428]+0x1ba]` == 4, else 0; then `0xbf62c` (`0x712a0(e)` -> `[ret+0x10]`, MoguriBaseOfs) x the literal
`0x81db8` (0.9) against `vldr [P+0x5c]`, `movpl r0,#0`. Its meaning "already sunk" is the Basarios row's (I). **Nothing
here reads the action, the variant, a part break or a charge.**

Negative with control: the band `0xe5a204..0xe64e24` has exactly two `0x13f4` immediates, both inside this method
(`0xe62cc0`, `0xe62ce8`); the same scan finds uEm007_00's (`0xd45354`) and uEm033_00's (`0xe3e3cc`) methods.

**Emulated** (`<scratchpad>/ng/emu13c2.py`: unicorn, ARMv8 model, `0x712a0` answered with a MoguriBaseOfs block;
first reproduced Bloodbath's census words — `0x381ff`, `0x300381c0`, `0x1c01ff`, `0x38e3f`, `0x2381ff` — and Akantor's
`0xe001ff` / `0x70001ff` / `0x381ff`):

| case | word |
|---|---|
| L2 M3 calm, intact | `0x381ff` |
| L2 M3 calm, severed | `0x1c01ff` |
| L2 M3 enraged, severed | `0x1c0e3f` |
| L2 M3 tired, intact | `0x3f03f` |
| L0 M2 posture 0 | `0xe001ff` |
| L0 M2 posture 4, P+0x5c 0, base -300 | `0xe001ff` (not sunk) |
| L0 M2 posture 4, P+0x5c -300, base -300 | `0x1ff` (sunk) |
| L0 M2 enraged, posture 4, P+0x5c -250 | `0xe00e3f` |
| L2 M12 calm / severed + enraged | `0x1ff` / `0xe3f` |
| L2 M5 enraged, L2 M34 tired, L3 M25 calm | `0xe3f`, `0x703f`, `0x1ff` |

**For psl-mask.js CLASS_MASK:**

    // UKANLOS (em038_00), uEm038_00 vtable +0x13c = 0xe62c8c (vtable 0x17bd9ac; +0xf0 the base 0xca52c), READ whole
    // (0xe62c8c..0xe62d00) and emulated (dev/em038_00-effects-spec.md 1). 0xca170 first, then:
    //   * L2 M3 (0x203): vt+0x370(e, 1) = 0xa3bf4, P+0x3b4 bit 0 (the tail sever) -> bits 18-20, else bits 15-17;
    //   * L0 M2 (0x002): 0x81d6c "already sunk" (posture 4 AND P+0x5c < 0.9 x MoguriBaseOfs) -> nothing, else 21-23;
    //   * every other motion: the base alone. He is never tired (states-em038_00.md 6), so 12-14 never fire.
    function em038_00(motion, action, state){
      if (motion === 0x203) return state.severed ? 0x1c0000 : 0x38000;
      if (motion === 0x002) return state.sunk ? 0 : 0xe00000;
      return 0;
    }

Inputs, and how the viewer supplies each:

* **`state.severed`** — P+0x3b4 bit 0. His part pass (vt+0x210 `0xe5bb5c`) draws **set 13** on the same test and set 6
  otherwise (`0xe5bd44..0xe5bd64`: `vt+0x370(e, 1) == 1 ? 0xd : 6`, tail-call `0x72c78`), and monsters.json em038_00
  `groups[13]` = part 8 on / 107 off — the sever row `'3|Motion[15]': { levels: [[6], [13]], ... drops: true }` takes
  it there. So: **`SHELL_TAIL.em038_00 = { severed: 8 }`** in motion-states.js; index.html `playNow` already turns
  that into `severed` (`shellTailInput(...).tailSevered`). R.
* **`state.sunk`** — the existing stand-in `false` (index.html: "the burrow sets L0 M2 from the surface"). His seven L0
  M2 plays all call `0xbc7f4(e, 4)` (posture 4) and then setMotion L0 M2 **from frame 0**: `0xe5c090`, `0xe5c0ec`,
  `0xe5cdb0`, `0xe5e4b4`, `0xe5e608`, `0xe5fc60` (setMotionL `0xafef0`, start literal 0.0) and `0xe5fd20` (setMotion0
  `0xafe84`, after `0xe5fd04 mov r1,#4`). Whether P+0x5c is already below 0.9 x MoguriBaseOfs at any of those starts
  (a replay begun under the snow) is **NR** — the same stand-in Akantor's L0 M2 uses.
* rage / tired from the viewer's toggles as for every monster. **He is never tired** (states-em038_00.md 6: P+0x1a8 bit
  19 forces P+0x505 to 0), so if the viewer lets tired be shown for him, bits 6-8 drop where the game never drops them;
  the class reads no action, so no CLIP_ACTIONS entry.

## 2. What the word changes — whole-block plan (153 file-mask bindings -> 156 whole-block)

`<scratchpad>/ng/planrows.py em038_00 [--whole]`. Every binding not listed is on bits 0-5 and stays always-on.

**Turned ON** (outside the file mask today):

| binding | record | game |
|---|---|---|
| **L3 M25 b0** f59 | c 1 (`cm202_020`, joint 8, exported) | always |
| **L0 M2 b21** f87 | c 71 (`cm202_020`, joint 143, exported) | unless already sunk (stand-in: always) |
| **L2 M34 b9** f220 | u 350 (`em038_00_005`, joint 1, exported) | enraged only |

**Gated** (in the file mask — the viewer fires them in every state today):

| binding | record | game |
|---|---|---|
| L2 M3 b15 f232 | u 362 (`em038_00_014`) | tail intact only |
| L2 M3 b16 f181 | c 72 (`cm202_021`, joint 143) | tail intact only |
| L2 M3 b17 f192-228 | u 361 (`em038_00_007`) | tail intact only |
| L2 M5 b6 f124 | u 350 | calm only (never tired) |
| L2 M5 b9 f124 | u 350 | enraged only — so L2 M5 fires u 350 once in either state, not twice |
| L2 M34 b6 f220 | u 350 | calm only (with b9 above: once in either state) |
| L2 M41 b6 f117 | u 350 | calm only |

**Turned OFF — never enabled by the class** (in the file mask, fired today):

| binding | record | why |
|---|---|---|
| L2 M12 b21 f148 | u 320 (`em038_00_003`) | no arm of `0xe62c8c` sets bit 21 on L2 M12 (`0x20c`); the base sets nothing above 14 |
| L2 M12 b22 f115, f130 | u 330 (`em038_00_003`) | the same |

Control for these two: emulated L2 M12 in calm, enraged and severed gives `0x1ff` / `0xe3f` — no bit 21 / 22 — and the
method's two arms are the only `+0x13f4` writers in the class (§1). The same records still fire on L2 M12 through
**b1 u 320 f147** and **b2 u 330 f113-146** (always-on bits), so today the viewer doubles them at f148 / f115 / f130;
the word removes the doubles. (Bits 24 / 25 on the same clip name u 321 / u 331, which have no record in any array:
not effects — the survey's "named with no record".)

So the class turns ON 3 bindings and OFF 2, and gates 7 by state (3 of them by the tail sever).

## 3. What to implement, in order

1. psl-mask.js: `CLASS_MASK.em038_00` as §1; `'em038_00'` into `PSL_MASK_MONSTERS`.
2. motion-states.js: `SHELL_TAIL.em038_00 = { severed: 8 }` (set 13 draws part 8; `0xe5bd44..0xe5bd64`).
3. `add_effects.py em038_00 --apply`, `--record`, `--check` (regenerates CLIP_EFFECTS from the whole blocks: adds
   L3 M25 c 1, L0 M2 c 71, L2 M34 b9 u 350 — no record to export). L2 M12 b21 / b22 stay in CLIP_EFFECTS; the
   runtime word (`plays.mask`) is what keeps them off. Recorder slot — announce.
4. Soak with `--viewer-inputs`; Raven verifies: L2 M3's three tail effects with the tail on, none with it cut.

NOT READ, by name: the value of P+0x5c at the start of each L0 M2 play (`state.sunk`); what L2 M12's unenabled bits
21 / 22 / 24 / 25 were authored for (the data names them, the class never sets them).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **Begins Burrowed -- BUILT 2026-10-19** (CLASS_TOGGLES `burrowed`, working label, approved by Raven): on, every posture-4 play
  reads sunk (0x81d6c: posture 4 and P+0x5c below 0.9 x MoguriBaseOfs); off, only the entries that name sunk. Checked on
  Basarios's L0 M7 B (dev/checks/class-toggles.mjs).

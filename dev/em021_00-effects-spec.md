# Congalala (em021_00) -- effects spec (Fanged Beasts walk, effects agent, 2026-10-17)

Class `uEm021_00`, vtable `0x17afde4`, action main `0xdd8068`, module band `0xdce690..0xdd9c64`. From
dev/fanged-beasts-effects-survey.md row 1 (11 bindings outside the file mask; c 150-153 c 190 c 191 c 40 u 241 u 261-263
u 281 not exported; c 1105 on the paralysis hold). `R` = READ, `I` = INFERRED, `NR` = not read. Scratch (session-local):
`<archive>/zg/jscheck021.py`, `tracec.py` / `allmot.py` (the tracer, any class: env CLS / EM), `plan_em021_00_*.txt`.

## 1. The PSL enable word -- vt+0x13c = `0xdd7cf4` -- R, read whole and emulated

Extent `0xdd7cf4..0xdd7f98` (the pop; `0xdd7f9c` the next function). `0xca170` first, then by motion id; ctl =
`[e+0xcac0]` (P+0x60, states-em021_00.md 1.2: ctl[0] the item at the tail, 0..6; ctl[1] the gas type, 0..4):

| motion | input | bits | records |
|---|---|---|---|
| L0 M43 `0x2b`, L2 M16 `0x210` | ctl[1] (table `0xdd7dc0`): 1 / 2 / 3 / 4 | 15-16 / 19-20 / 17-18 / 21-22 | u 260 / 262 / 261 / 263; u 200 / 202 / 201 / 203 |
| L0 M25 `0x19` | ctl[0] (table `0xdd7df4`): 2 / 3 / 4 / 5; 1, 6 none | 15-16 / 21-22 / 17-18 / 19-20 | c 150 / 153 / 151 / 152 |
| L0 M25, ctl[0] 0 | `0xb0944` (e+0x4b4) == 0x19 and the number (table `0xdd7e3c`): 0x0b / 0x37, 0x0c / 0x38, 0x0e / 0x39, 0x35 / 0x36 | 19-20, 17-18, 21-22, 15-16 | c 152, c 151, c 153, c 150 |
| L0 M28 `0x1c` | action (1, 9) | 27-28 | c 120 |
| L2 M2 `0x202` | status 7: n 1 / n 0 / else | 25-26 / 23-24 / none | u 281 / u 280 |
| L3 M15 `0x30f` | vt+0x3f4 `0x7fed4` (status 0xb / 0xe, (0xc, 0xff)); else `0x81bb0(e, 0)` (P+0x5e08 bit 0 or P+0x522) | 27-28; else 29-30 | c 3001; c 50 |

**u 200..203 are four DIFFERENT records** (four distinct payloads in em021_00.json; motion-states.js's "four byte-identical
records ... a binding the class does not make, NOT READ" is withdrawn there): the viewer fired all four at once on every L2 M16.

`e+0x4b4` at the call: setMotion's wrapper `0x7256c` calls `0x53943c` -> vt+0xc4 `0x5394b4` (the model's layer-0 motion set,
whose store of `[layer+0x4b4]` is `0x951724` in `0x951678`) before vt+0x13c at `0x725d4` -- so it is the motion being set (I:
the 0x5394b4 -> 0x951678 link not read through).

**Check** (`jscheck021.py`, unicorn, every call native, ctl[0] 0..7 x ctl[1] 0..5 x e+0x4b4 x P+0x522 x rage x tired x 25
actions x 11 motions): **44800 runs, 0 mismatches**; control: a mutated gas table gives 3200 mismatches.

## 2. Who plays the keyed clips -- R (tracer, the action main under unicorn, phases 0..3, follows re-run)

| clip | plays |
|---|---|
| L0 M25 | (1, 0x0b..0x0e), (1, 0x35..0x39) phase 0 -- the eating clip |
| L0 M43 | the same, phase 1; (1, 0x3c..0x43) phase 0 |
| L2 M16 | (7, 0x06 / 0x34..0x3a / 0x48) -- the gas attack |
| L0 M28 | (1, 9); (7, 0x37..0x3a / 0x48) phase 1 |
| L2 M2 | (7, 0 / 1 / 0x45) phase 1 |
| L3 M15 | the pit chains: death (11, 7 / 0x12), sleep (10, 0x63), paralysis / stun (10, 0x65 / 0x66) (states-em021_00.md 7.3) |

The gas at a motion start (vt+0x204 `0xdcefd8`, states note 3.2): (1, 0x35 / 0x40) 1, (1, 0x0b / 0x42) 2, (1, 0x0c / 0x41)
3, (1, 0x0e / 0x43) 4, (1, 0x5a / 0x5b) random 1..4, (1, 9) 0; every other play keeps what he carries.

## 3. Implemented

* psl-mask.js: `em021_00` + CLASS_MASK + PSL_MASK_MONSTERS; `em021Item(drawn)` -- ctl[0] from the Item row shown (group 12
  bone 1, 16 / 15 / 19 / 17 the mushrooms 2 / 3 / 4 / 5, 14 rock 6, none 0); `em021Gas(action, fallback)`; `clipFieldFor`;
  CLIP_ACTIONS em021_00: L0 M25 [(1, 0x35), (1, 0x0b), (1, 0x0c), (1, 0x0e)], L0 M43 [(1, 0x40), (1, 0x42), (1, 0x41),
  (1, 0x43)] (their start sets the gas), L2 M16 [(7, 0x34) with gas 1 / 2 / 3 / 4] -- **named stand-in: the gas he carries
  comes from an earlier eat; each play shows the next type**, L0 M28 [(1, 9), (7, 0x37)], L2 M2 [(7, 1), (7, 0), (7, 0x45)],
  L3 M15 [(11, 7), (10, 0x63) asleep, (10, 0x65)].
* index.html: `item` / `gas` / `asleep` into pslMask.
* add_effects --apply: +12 records (c 40 150 151 152 153 190 191, u 241 261 262 263 281), 70 in all. The c 40 / 190 / 191 are
  the ground-ray records, recordable since the ray was retired.
* The shock trap c 1105 was already wired (CLIP_VARIANTS em021_00 L3 M6 A / B, TRAP_B), against the survey's gap.
* dev/checks/em021_00.mjs: the word table and the four L2 M16 plays.

NAMED: `asleep` for the pit sleep is the play's (P+0x522 / P+0x5e08 set by the sleep: I); (1, 0x5a / 0x5b)'s random gas;
the item's weighted stage pick (no stage in the viewer -- the Item row is the user's).

## Open items read (2026-10-19)

(The sweep of dev/effects-open-items.md: each item below was named open above; the rom-map row is in the section "Effects open items -- the sweep's reads".)

* **`asleep` for the pit sleep -- READ**: (10, 0x63) is in changeAction's sleep family (`0x754f8`: 0x1d / 0x21 / 0x26 / 0x34 / 0x39 /
  0x3f / 0x63 / ...), which sets P+0x5e08 bit 0 (`0xa2800`) at the action's start; `0x81bb0(e, 0)` (eyes shut) reads it. The
  viewer's `asleep` on L3 M15 (10, 0x63) is the ROM's. P+0x522 is a different latch: his field nap (1, 0xf) sets it (`0xbd4f0` at
  `0xdd04fc`, L0 M18 -> L0 M15) and clears it at the end (`0xdd0548`).
* **Gas Type -- BUILT 2026-10-19** (CLASS_CONTROLS em021_00, working label; replaces the per-play cycle): the breath L2 M16 reads
  ctl[1] 0..4 from the control; the eating plays still set their own. em021_00.mjs plays L2 M16 under each value.

## Control block re-check (2026-10-19, trap 117's follow-up; rom-map "the control block [e+0xcac0] SET NON-ZERO")

* **The word: stands.** It moves only with ctl+0 / +1, and both are already inputs of the transcription.
* **A class request the viewer does not drive: u 500** (vt+0x1d0 id 1001; cm103_100, joint 2).
  * Read: `0xdd0568`, the eating handler, at phase 0 on L0 M43. When `(ctl+1 - 2) & 0xff >= 3` it calls 0x9a6fc(e, max HP x 0.02),
    then requests id 1001.
  * In the game: the type-1 eating actions (1, 0x35 / 0x40) and gas 0 get it; types 2..4 do not.
  * states-em021_00.md 3.5 named it 'to be wired by hand'. It was never exported. Build item.

## u 500, the eating heal (effects lane, 2026-10-20)

* `0xdd0568`'s phase 0 (read) sets L0 M43. When the gas byte ctl+1 is not 2..4, it then requests id 1001 = u 500 (cm103_100,
  joint 2) through his own requester, after a 2% heal.
  - The gas is the one the action's start set: (1, 0x40) gives 1 (u 500); (1, 0x41 / 0x42 / 0x43) give 3 / 2 / 4 (none).
  - Otherwise it is the carried gas (the Gas Type control).
* Driven: CLASS_TIMERS em021_00, at L0 M43's first frame. Measured: 1 start, draws (lit 11 / 13); dev/checks/class-requests.mjs.

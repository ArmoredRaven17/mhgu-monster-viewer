# Nerscylla (em070_00) -- the part a bite turns on: PART 13, not part 50

Research agent for the Viewer agent, 2026-10-17. Raven: *"Nerscylla has a part that turns on for some of its large bite
attacks, ensure we turn this off when those animations are not being played, on when they play"* -- and *"ensure we
follow the ROM, don't take my word for everything"*. Nothing under `docs/` was changed. Status per item: **R** (the
consuming instruction read), **I** (inferred), **NR** (not read).

Class: **uEm070_00**, vtable `0x17e222c`, module band `0xf9b08c..0xfad3fc` (efx/agents/notice-scratch/emclasses.json).
One class, one monster: `dti.json` holds `uEm070_00` and his four shell classes only; monsters.json has `em070_00` alone
and no model shares it. The part pass has no variant test (no `e+0xb5f5` read in it). **R**

Disassembly: `<scratchpad>/n70/em070_dis.txt` (barroth-scratch/sweepdis.py over the band).

## 0. Answer

* **The part is 13**, not 50. Sets **16** = `[[13, on]]`, **17** = `[[13, off]]` (monsters.json `groups`). **R**
* **The ROM's rule** (vt+0x210, the part pass, every frame): **part 13 is drawn while the CURRENT MOTION (`e+0x4b4`,
  getter `0xb0944`) is one of seven -- L2 M6, L2 M7, L2 M10, L2 M26, L2 M84, L2 M85, L4 M34 -- and hidden at every
  other moment.** No action, frame, rage, rank or break term. **R**
* **Part 50 is never drawn**: set 4 (`[[50, off]]`) is applied unconditionally every frame and set 3 is applied nowhere
  in the class. It has no mesh in the model either (partIds 0..13). The `"50"` row is right as it is. **R**
* **Raven's description matches the ROM** on the substance (one part, on for a group of attacks, off otherwise), with
  three refinements: (a) it is keyed on the MOTION, so every action that plays one of those seven clips shows it, the
  three non-attack-looking plays of L4 M34 ((6, 2), (12, 0)) included; (b) it holds for the WHOLE motion, frame 0 to
  the last, not a window inside it; (c) the part the viewer calls **"Web"** is this part -- its geometry is the
  extending mouthparts on joints 130-133 (section 2), not silk. Whether every one of the seven is a "bite" is
  Raven's to say on screen: **I** (the joint tracks say all seven stretch the jaws).
* **The viewer today draws part 13 on EVERY clip** (part-review row `"13"` default `"13"`, hidden -- pinned on
  2026-09-11 because "it needs to be left on for some animations to work"). Measured headless, section 4.

## 1. The part pass -- vt+0x210 = `0xf9bd10` (extent `..0xf9bfc8`, pool `0xf9bfcc..0xf9bfdc`, next fn `0xf9bfe0`) **R**

The ELEVEN `setVisibleGroup` (`0x72c78`) calls in the band are all here (`0xf9bd1c .. 0xf9bf18`); in order:

| site | set | condition |
|---|---|---|
| `0xf9bd1c` | 0 | always (parts 0, 100) |
| `0xf9bd28` | **4** | **always -- part 50 off** |
| `0xf9bd44` | 1 / **2** | `0x81670(e) == 1` (enraged) -> **2** (parts 1, 12 ON), else 1 (`cmp r0,#1; movne r1,#1; moveq r1,#2`) |
| `0xf9bde0..0xf9be04` | 9 / 10 + 12, or 11 + 13 | part 1 break level vs `.dtp +0x64` bytes 5 / 6 (rank > 4), then bytes 1 / 2: the Back |
| `0xf9be54` | 14 / 15 | part 4 vs bytes 13 / 14: the Claws |
| `0xf9bea4..0xf9bec8` | 5 + 7, or 6 + 8 | part 2 vs bytes 9 / 10: the Legs (one break, both sides) |
| `0xf9bf18` | **16 / 17** | **the motion test below** |

The motion test (`0xf9becc..0xf9bf0c`, `0xf9bfc0..0xf9bfc8`):

    m = 0xb0944(e)                                   ; e+0x4b4 = (list << 8) | motion
    k = m - 0x206; if k <= 0x14 && (0x100013 >> k) & 1 -> 16    ; bits 0, 1, 4, 20: 0x206 / 0x207 / 0x20a / 0x21a
    if m - 0x254 < 2                                 -> 16    ; 0x254 / 0x255
    if m == 0x422                                    -> 16
    else                                             -> 17    ; 0xf9bfc0: mov r1,#0x11; b 0xf9bf18

= **L2 M6, L2 M7, L2 M10, L2 M26, L2 M84, L2 M85, L4 M34** -> part 13 on; anything else -> off.

After it, `0x81670 == 1` and the latch `[e+0xcac0]+0xb4 != 1` play the `"anger"` material clip once on every material
(`0x88db14` / `0xb08b44` / `0xb09ae8`); not motion-keyed. **R**

That the part pass runs every frame is the shared enemy layer's (`+0x28` pass `0xae79c` / `0xaf208`,
states-em007_00.md 2) -- **I here** (cited, not re-read for this class).

### 1.1 The bounded negative: nothing else draws a part **R** (scan + control)

* `bl` / `b` to `0x72c78` over the whole binary: the 11 above plus ONE shared caller, `0x6f578` in `0x6f4e8` (the
  shared eye applier; its only caller `0xae35c`). Control: the same scan finds the band's 11.
* `0x6f4e8` applies `e+0xb610 / +0xb614 / +0xb618` (by `P+0x5d02` and vt+0x1c8). Nerscylla never calls `0x71398`
  (the eye-set initialiser; control: the scan finds uEm001_00's `0xcecfc4`, uEm004_00's, uEm007_00's ...) and has no
  `#0xb610..0xb61c` immediate in the band, so the fields keep the ctor's -1 (`0x6dbd8`, rom-map `0x10b325c` row) and
  `0x72c78` returns at `0x72c84` (`cmp r1,#0; blt`). **No lid, no other set.**
* No store to `e+0x110..0x12f` (the bitmask `0x72c78` writes at `0x72d0c`) in the band.
* Caveat: indirect calls (`blx` through an object vtable) are not followed.

## 2. What part 13 is **R** (model) / **I** (meaning)

`models/monsters/em070_00.glb` Group[13]: 362 vertices, materials `XfB__m00_eye`, `XfB__E__m00_body`, `XfB__m01_add`,
weighted to joints **130 / 131 / 132 / 133** (155 / 155 / 100 / 100 vertices at weight > 0.3), sitting at the front of
the head. In the motion glbs those joints REST (130_s / 131_s z-scale 0.5, 132 / 133 at z 0.36) in every clip but these:

| clip | 130_s z-scale max | stretched over (keyed frames) |
|---|---|---|
| L2 M6 | 8.28 | to f147 of 147 |
| L2 M7 | 5.0 | f0..192 of 215 |
| L2 M10 | 8.0 | f0..182 of 235 |
| L2 M26 | 9.69 | f0..174 of 193 |
| L2 M84 _start / _loop | 8.0 | held |
| L2 M85 | 8.0 | f0..186 of 229 |
| L4 M34 | 9.69 | f0..166 of 185 |
| L0 M16 _start / _loop, L0 M17 | 0.94 | (a slight stretch -- NOT in the ROM's set: part 13 is OFF there) |

The seven clips whose tracks stretch the jaws are exactly the ROM's seven (L0 M16 / M17 aside). So part 13 is the
mouthparts that shoot out on a lunge -- "the large bite". The panel's name "Web" was a guess (part-review.json note,
2026-09-11), not a decode. **I** (the shape agrees; the name is Raven's call)

## 3. The clips, the actions, the frames

| motion | id | actions that play it | how | st |
|---|---|---|---|---|
| L2 M6 | `0x206` | (7, 1), (7, 0x3e) from f0; **(7, 0xc) from f60** | first `setMotion0` (probe.py) | R |
| L2 M7 | `0x207` | (7, 0x1e) | first setMotion0; site `0xfa6aa4` | R |
| L2 M10 | `0x20a` | (7, 2) | first setMotion0; site `0xfa4e9c` | R |
| L2 M26 | `0x21a` | (7, 0x3a) | first setMotion0; site `0xfa82ac` | R |
| L2 M84 | `0x254` | (7, 0x3f) phase 0 | `0xfa9108`, blend 8 | R |
| L2 M85 | `0x255` | (7, 0x3f) phase 1 -> 2, when `0x78b78(e, 0, 0x40) == 1` | `0xfa9168`, blend 4 (same `P+0x1a1` phase table `0xfa90b4`) | R |
| L4 M34 | `0x422` | (7, 0x3b), **(6, 2)**, **(12, 0)** | first setMotion0; sites `0xfa4110`, `0xfa4880`, `0xfa81ac` | R |

* **The condition is the motion id alone**, so there is no play of these clips without it: no CLIP_ACTIONS /
  CLIP_VARIANTS copies are needed. **R**
* **Frames: the whole motion.** On from the first frame the motion is current (the blend-in included) until the next
  `setMotion` -- no `setsFrom`. **R** (the test reads `e+0x4b4` only). In the viewer, a play-once clip held on its last
  frame is still that motion (MotionStates' rule), so it stays on there -- the game would already be in the next motion.
* (7, 0xc)'s start at f60 of L2 M6 changes nothing for the part (on from its first frame). **R**
* What the seven actions are called (which are "bites"): **NR** -- not in any note; Raven's on screen.

## 4. The same condition elsewhere -- vt+0x208 = `0xf9bfe0` (extent `..0xf9c084`) **R**

After `0xf9c088` (the part-2 hit-zone pass) and `0xf9c174`, the same motion set (the same seven ids) sets
`[[e+0x1428]+0x5cfc]` bit 0, every other motion clears it (`bfc #0,#1`) -- **except L3 M25 (`0x319`), which leaves it as
it was** (`popeq`). The part pass has no such exception: part 13 is OFF in L3 M25.

**Who reads that bit for Nerscylla: no consumer found.** Every `movw #0x5cfc` in the binary (143): his three are this
pair and the init's zeroing (`0xf9b264`); the shared two (`0x6e704`, `0xb9e04`) are zeroing stores; vt+0x1c8 (the eye
applier's predicate, Tigrex's reader of this bit) is the base `0x6be3c` = `return 0`; no `add #0x5c00..0x5cfc` base
anywhere. Control: the same scans find Tigrex's reader `0xe3460c` and his builder `0xe205f8`, and `add #0x5b00` /
`#0x1400` sites. So: **I -- nothing visible follows it** (an indirect reader through a computed pointer is not excluded).
No effect request, joint scale or material clip keys on the seven motions in the part pass or vt+0x208. **R**
(Other `#0x422` / `#0x206` immediates in the band are the actions' own setMotion sites and a motion-rate block at
`0xfabee4` -- speed calls `0xb07b4` / `0xb098c` / `0xb0974`, no part: **I**, read for shape only.)

## 5. Other parts that switch the same way -- none; but the RAGE PAIR is backwards in monster.js **R**

* No other set in the pass depends on the motion. Back / Legs / Claws follow break levels, parts 1 / 12 follow rage.
* **`render/monster.js` ROM_RAGE_SET `em070_00: [[2, 1]]` ("confirmed at 0xf9bd30", rows are `[calmSet, rageSet]`) is
  backwards**: the site compares against **#1**, not #0 (`cmp r0,#1; movne r1,#1; moveq r1,#2`), so ENRAGED = set **2**
  (parts 1 and 12, the `XfB__m01_add` layer, ON), calm = set 1. The table's header says polarity is "a property of the
  code SHAPE, identical at every site" -- not at this site. The ROM row is **`[[1, 2]]`**. The part-review row
  `"1,12"` (`none|1,12`, `state: rage`) already shows the ROM's polarity, which is why the panel looks right; this is the
  board's open "(bug) em070_00's enrage pair is backwards" item, settled. (Withdrawn table, rom-map.)

## 6. The viewer rows (for the Viewer agent)

`docs/render/motion-states.js` -- new block (none exists for em070_00 today):

    // NERSCYLLA (em070_00): his part pass vt+0x210 0xf9bd10 draws set 16 (part 13, the jaws on joints 130-133) while
    // the current motion is L2 M6 / M7 / M10 / M26 / M84 / M85 or L4 M34 (0xf9becc..0xf9bf18), set 17 at every other
    // moment -- the whole motion, every action that plays it (dev/em070-part50-spec.md).
    em070_00: {
      '2|Motion[6]':  { sets: [16] },
      '2|Motion[7]':  { sets: [16] },
      '2|Motion[10]': { sets: [16] },
      '2|Motion[26]': { sets: [16] },
      '2|Motion[84]': { sets: [16] },          // _start + _loop: one motion
      '2|Motion[85]': { sets: [16] },
      '4|Motion[34]': { sets: [16] },
      // the Special-list copies (monster.js ROM_ANIMATIONS em070_00, single pieces with no `motions` flag, so
      // seqMotionNow does not resolve them to their list-2 rows): keyed on the copy itself
      'Special|S. L2 Motion 7':  { sets: [16] },
      'Special|S. L2 Motion 10': { sets: [16] },
    },

* No `setsFrom` (the whole motion), no `CLIP_ACTIONS`, no `CLIP_VARIANTS`.
* The other Special copies (S. L0 M18, L2 M1 / 13 / 24 / 27 / 30 / 31 / 54 / 73-78, L4 M11 / 30 / 31) are not in the
  set: part 13 off there, which the default below gives.
* Alternative to the two Special rows: `motions: true` on those two ROM_ANIMATIONS entries (specialMotionAt then hands
  step '2|Motion[7]' / '2|Motion[10]'); it may change how their CLIP_EFFECTS are looked up -- the Viewer agent's call.

`docs/part-review.json` em070_00 row `"13"` -- **`default: "none"`** (was `"13"`). Keep `hidden: true`: no user state
reaches set 16 in the ROM, only the motion does. Order `["none", "13"]` if it is ever shown. The 2026-09-11 reason for
pinning it on ("needs to be left on for some animations to work") is what the rows above now do. **Names are Raven's:**
proposed `name` "Jaws" (or "Extended Jaws"), options `"none"` "Retracted" / `"13"` "Extended" -- the current "Web" /
"On" / "Off" rest on a guess (section 2).

`"50"` row: no change (ROM: set 4 every frame, set 3 never; no mesh).

### 6.1 Measured headless (in memory only, nothing on disk changed)

`<scratchpad>/n70/run-check70.mjs` (run-check.mjs + `PATCH70=1`: part-review's row 13 default set to `none` inside the
page's fetch) with `<scratchpad>/n70/em070_part13.mjs` / `em070_part13b.mjs`, through run_locked.sh:

* **today** (as shipped): part 13 drawn on all 17 clips tried (L0 M2, L0 M16, L2 M5, L3 M25, L4 M33, the Special copies
  ... and the seven).
* **default none + the rows**: drawn on exactly L2 M6, M7, M10, M26, M84 (`_start`), M85, L4 M34 and the two Special
  copies; hidden on L0 M2, L0 M16, L0 M17, L2 M5, L2 M25, L3 M25 (`_loop`), L4 M33, S. L2 Motion 1; back off on L0 M2
  after. `motionStates().cur` = `{ key: 'em070_00|2|Motion[6]', sets: [16] }` etc.
* Without the Special rows the copies S. L2 Motion 7 / 10 stay OFF (cur null) -- why they are listed.

## 7. Not read

* What the seven actions are (names / which are bites) -- Raven's on screen.
* The reader of `P+0x5cfc` bit 0 through an indirect pointer (section 4); L3 M25's reason for holding it.
* `0x78b78(e, 0, 0x40)`, the (7, 0x3f) M84 -> M85 trigger.

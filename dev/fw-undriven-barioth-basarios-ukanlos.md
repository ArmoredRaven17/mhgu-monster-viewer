# Flying Wyverns, undriven records: Barioth u 905, Basarios c 1105 + u 905, Ukanlos u 1120 / u 1121

Research agent for the Viewer agent, 2026-10-14. Static ROM reading (capstone over `C:\MHGU-ROM\exefs\main.*`) plus
unicorn controls (`efx/agents/notice-scratch/probe.py`, `efx/agents/cephadrome-scratch/scr.py`). No recorder, no
lift, no `add_effects.py --apply/--record`, no `docs/` edit: this is a spec for the implementation agent.
`R` = READ (the consuming instruction read, here or in the cited note), `I` = INFERRED, `NR` = NOT READ.
Scratch scripts: `<scratchpad>/fwread.py` (disassembly / words), `b7scan.py`, `sevscan.py`.

Sources opened before reading: dev/rom-map.md (rows 256, 393, 453, 592-601, the Seregios / Barioth section),
dev/flying-wyverns-effects-survey.md, dev/effects-walk-order.md (#8, #17, #18), the task board (c 1105 / u 905 /
rage-puff notes, 2026-09-21 Savage's cut tail), states-em004_00.md 3.4 / 4.1 / 6.1 / 10, states-em042_00.md 3.4 / 10,
states-em038_00.md 5.4, tail-option-em043.md 1-7, dev/em042_00-effects-spec.md (UNFINISHED, another research agent,
same day -- its §2 is the starting point for Barioth and one of its values is corrected below), docs/render/
motion-states.js (em004_00 / em005_00 / em042_00 / em038_00 blocks, RAGE_PUFF), docs/render/tail-option.js,
docs/effect-mounts.json, efx/effects_status.py, efx/add_effects.py `state_records`.

---------------------------------------------------------------------------------------------------------------------

## 0. The three mechanisms, and how the viewer drives each today

| record kind | game's trigger | viewer's driver | counted "driven" by effects_status.py when |
|---|---|---|---|
| u 905 (cut-tail landing) | the shared uEnemyOption code, option frame k = 42 after the sever, at G | `CUT_TAIL[mon].landing` in render/tail-option.js, fired by index.html `stepCutTail` -> `rt.fireAt(...)` -- **only on a MOTION_STATES row carrying `drops: true`** | `state_records` reads CUT_TAIL (add_effects.py:482) |
| c 1105 (shock trap) | shared `0xa4854` while the current action is (10, 0x6e) | a MOTION_STATES row `{ every: [[c, 1105], 42] }` on the trap's own play clip | a MOTION_STATES row names it |
| u 1120 / 1121 (rage puff) | shared `0xa41b8`, every 30 f while enraged | `RAGE_PUFF[mon]` **and** `_autoOnRage` in docs/effect-mounts.json (index.html:6400 `effectsRage = !!RAGE_PUFF[id] && effectAutoOnRage(id)`) | both present (effects_status.py:137) |

---------------------------------------------------------------------------------------------------------------------

## 1. u 905 -- the cut tail's landing (shared; serves Barioth and Basarios)

### 1.1 The chain, read

| step | address | what | st |
|---|---|---|---|
| option kind | `0xb9e84..0xb9e98` | enemy setup: `0x4bc18(res, slot 0) == 1` -> **`strb #1, [e+0x8b94]`** = option slot 0 `+0x1474` (kind) = 1 | R |
| the sever | `0xc2274` | kind `[e + slot*0x14f0 + 0x8b94]` 1 -> `P+0x3b4 \|= 1` (`0xc22c8`, `0xc22dc..0xc22ec`); **`strb r3, [e + slot*0x14f0 + 0x8b97]` at `0xc22f8`** = option `+0x1477` = the caller's 4th argument | R |
| J (where it drops from) | `0x7421c..0x742a8` | `ldrb [option+0x1477]` -> 0xff ? owner position : `[[owner+0x498] + id]` -> joint record `[owner+0x494] + idx*0xa0`, `+0x40..+0x48` | R (re-read here; tail-option-em043.md 3.3) |
| the landing request | `0x703b8..0x7044c` | `cmp r7 (kind), #1` / `mov r1,#6` / **`movweq r1,#5`** (`0x70414`), position = `&G` (`+0xc0..+0xc8`), then **`ldr r3,[vt,#0x1d0]` / `blx r3`** (`0x70444`) with id 5 | R |
| id -> key | base `0xa3ddc` | `ldr r2,[table + id*4]` with the table from GOT `0x1832ae8` -> **`0x159c7fc` = {1120, 1121, 1400, 900, 901, 905, 906, 1000}** -> id 5 = **905** | R |
| Basarios's `+0x1d0` | `0xd2e0bc` | `cmp r1,#0x3e8` / `blo 0xd2e0e0` -> `b 0xa3ddc` (ids >= 1000 go to his own table `0x169bb80`) | R |
| Barioth's `+0x1d0` | vtable `0x17be9a0 + 0x1d0` = **`0xa3ddc`** (the base, not overridden) | R |
| descriptors | `[0x172ba68][112]` = **`0x159aa2c`** = (0x8412, **0x8413**, -1, 0x8414, 0x8415, 0x8416); `[0x172ba68][123]` = **`0x159b2f0`** = (0x8536, **0x8537**, -1, 0x8538, 0x8539, 0x853a). Control: Khezu `0x15955b4` = (0x7864, **-1**, -1, ...) | R |
| the piece's model | `0x159daa0` = {jamcrc(path), type} per resource id: **0x8413 = `enemy\em004\em004_00\mod\em004_00_tail`**, **0x8537 = `enemy\em042\em042_00\mod\em042_00_tail`**, both type 0x58a15856 (rModel). Control: 0x7bc4 hashes to `em043_05_tail` exactly as tail-option-em043.md says. **Closes the "which file resource 0x8413 / 0x8537 names: NOT READ" of both states notes** | R |
| the piece's motion | descriptor `+0xb4` = **0x77ed** for both (= `enemy\em_option\mot\em001_00_option`, rMotionList; control: Savage 0x1596cd0 and Rathian 0x15950ec also 0x77ed, Khezu -1) -- so CutTail's built-in em001_00_option Motion[1] curves are the right ones | R |
| no per-monster override | dtbparts.dtp byte 13 (`+0x91`, the option row count, per tail-option-em043.md's loader mapping) = **0** for em004_00 and em042_00 (controls em043_05, em037_00 also 0; files from `scratch-em/<mon>/enemy/dt_base/`) | R (file) |
| window / height | kind 1 window (10, 42) and h = 20 S except em 0x50 (tail-option-em043.md 3); neither is em 0x50 -> `above: 20` | R (note) |

### 1.2 The J joint is the sever call's 4th argument, NOT u 900's joint

Both classes call `0xc2274(e, 0, 0, 0x8f, NULL)`:

    Basarios  0xd22cf0 cmp r5,#0x72 ... 0xd22cfc bl 0x9e8d8 / cmp r0,#7 ... 0xd22d14 mov r3,#0x8f ... 0xd22d20 bl 0xc2274
    Barioth   0xe657d4 bl 0x9e8d8 / cmp r0,#7 ... 0xe657ec mov r3,#0x8f ... 0xe657f8 bl 0xc2274

so option `+0x1477` = 0x8f and **J = joint id 143 for both** (R). Barioth's u 900 sits on joint 144 (states-em042_00.md
3.4), which is where dev/em042_00-effects-spec.md §2 took `joint: 144` from -- that value is **corrected to 143**
(rom-map Withdrawn table). Both skeletons carry gid 143 (`em004_00.glb` node `36:143`; `em042_00.glb` `30:143`); the
viewer resolves `spec.joint` against gid (index.html `stepCutTail`), so 143 drops.

### 1.3 The sever rows (unchanged clips, READ in the states notes)

* Basarios: (10, 0x72) with part 7 -> script 0x1798a30 -> **L3 Motion[15]** from frame 0 (states-em004_00.md 3.4). His
  row `'3|Motion[15]': { levels: [[7], [8]], fire: [null, ['em004_00u', 900]] }` lacks `drops`.
* Barioth: (10, 0x72) with part 7 -> script 0x17bf860 -> **L3 Motion[13]** to frame 100 (states-em042_00.md 3.4). His
  row `'3|Motion[13]': { levels: [[18], [19]], fire: [null, ['em042_00u', 900]] }` lacks `drops`.
* Both clips outlast the landing (k = 42): L3 M15 6.5 s, L3 M13 6.15 s in monsters.json.
* The comments on both rows ("no em004_00_tail / cut-tail model is staged") are stale: `docs/models/monsters/
  em004_00_tail.glb` (45 v) and `em042_00_tail.glb` (513 v) are staged and both monsters.json entries carry the parts
  entry and the `option` list `em001_00_option`. tail-option.js's em005_00 comment ("Basarios has the same option slot
  but no staged model") is stale for the same reason. Vertex count is not evidence (rom-map traps); the resource hash
  in 1.1 is what says the staged file is the ROM's piece.

---------------------------------------------------------------------------------------------------------------------

## 2. Basarios c 1105 -- the shock trap: the ROW IS MISSING (not keyed differently)

| step | address | what | st |
|---|---|---|---|
| gate | `0x80254` | `mov r1,#0xa` / `mov r2,#0x6e` / `b 0x6fe88` -- current action == (10, 0x6e) | R |
| request block | **`0xa4854..0xa48bc`** | `bl 0x80254`, `popne`; timer **`e+0xb7c8`** through `0x7206c` (fire at or below 0, `vmov s0,#1.0`); on fire **`movt r0,#0x4228` = 42.0** stored back (`0xa4890`); area byte `e+0x1054 -> e+0xb64c`; **`ldr r3,[vt,#0x1cc]` with r1 = 5**, tail `bx r3` | R |
| id -> key | Basarios `+0x1cc` = `0xa3dc0` (base): table GOT `0x1832ae4` -> **`0x159c798` = {1100, 1101, 1102, 1103, 1104, 1105, ...}** -> id 5 = **1105** | R |
| his action | `probe.py uEm004_00 10 0x6e 4` -> **script 0x1798c80**; with em 5 (Gravios) the same script | R (emulated) |
| the script | `scr.py 0x1798c80`: op 6; op 5 `P+0x568 = 60`; op 0 **L3 M9 (0x309)** blend 2 wait 8; op 6; op 0 **L3 M13 (0x30d)** blend 6 wait 0x200; end 0xfe -> (10, 0x70) 0x1798920 = L3 M16 | R (emulated). Control: (10, 0x1f) -> 0x1798910 = L3 M13 wait 0x100, the paralysis the note gives |

So the em004_00 block names the trap only in a comment ("L3 Motion[13] is also the shock trap's hold (c 1105 every
42, after L3 Motion[9] to f60)") and has **no `'3|Motion[9]'` row at all** -- nothing else in his block plays L3 M9,
so no cycle is needed. The record is keyed exactly as every other monster's (`em004_00c` 1105, cm200_001 joint 1
scale 6, states-em004_00.md 6.1). The shape to copy is Gravios's own row on the same class and the same script:
`'3|Motion[9]': { every: [['em005_00c', 1105], 42] }` (motion-states.js em005_00).

Caveats, as for every monster with this row: L3 M9 is also played by (10, 0x52) / (10, 0x87) / (10, 0xb4) /
(10, 0xbd) / (10, 0xbe) (states-em004_00.md 4.1), which do not fire c 1105; the ROM leaves M9 at f60 and keeps the
42-frame timer running through the M13 hold, which the viewer shows as paralysis (c 1101). The viewer plays the whole
171-frame M9 instead.

---------------------------------------------------------------------------------------------------------------------

## 3. Ukanlos u 1120 / u 1121 -- the rage puff: entry present, LISTING MISSING

| step | address | what | st |
|---|---|---|---|
| gate on e+0xb7d2 | `0xa424c` | `movw r0,#0xb7d2` / `ldrb` / `cmp #0` / `beq` skip -- the puff runs only while the byte is non-zero (base ctor 1) | R |
| class writes it? | band `0xe5a104..0xe64e24` (emclasses.json uEm038_00, a superset of the note's) | **no immediate 0xb7c0..0xb7e0 or 0xb000/0xb400/0xb600/0xb700/0xb800 anywhere**. Positive controls with the same scan: Alatreon `0xec4a94 movw r0,#0xb7d2` (his write at 0xec4aa0) and Rajang `0xde1dd0 movweq r0,#0xb7d2` are found | R (negative with control) |
| reaches the pass | vtable `0x17bd9ac`: `+0x28` = `0xc9e7c` (base, the same as Basarios's and Barioth's, whose puffs are wired), `+0x2d8` = `0x6bfb0` (`mov r0,#1`) | R |
| pick and keys | `+0x2a4` = `0xe5bf9c` (live, ukanlosPuffPick), `+0x1d0` = `0xa3ddc` -> 0 -> 1120, 1 -> 1121 | R |
| the viewer | `RAGE_PUFF.em038_00` exists (motion-states.js), his block has the rage row `'2|Motion[4]': { rage: true }`, and **`em038_00` is NOT in `_autoOnRage`** (63 entries; neither is em033_00 Akantor) | R (file) |

effect-mounts.json's own `_about_autoOnRage`: "a monster with a rage row in MOTION_STATES or a RAGE_PUFF entry must be
listed even when it already mounts through its clip effects (em003_00, Khezu, did not and his puff never ran)" --
Ukanlos is the same case. Without the listing `driveMotionStates` never sets rage for him either.

Secondary, NOT VISIBLE: `RAGE_PUFF.em038_00.joint` is 132 (the records' placement joint). The field feeds the pick
(live.js:332, the node whose rotation `pick` reads). His pick reads `P+0x5d04`, which `+0x1d8` sets to **3**
(`0xe5a2e8 mov r2,#3` / `0xe5a2f0 str r2,[P,#0x5d04]`), and `0xc0d40` passes it as r2 to vtable `+0xd8`
(`0xc0d64 ldr r2,[P,#0x5d04]`) -- so the ROM's pick joint is **3**, as Akantor's entry has. His 1120 and 1121 are
byte-identical (states-em038_00.md 5.4), so this changes nothing on screen.

---------------------------------------------------------------------------------------------------------------------

## 4. WHAT TO ADD (the implementation agent transcribes; nothing here touches the recorder)

### Barioth (em042_00) -- u 905

1. render/tail-option.js `CUT_TAIL`:

       // BARIOTH: sever kind 0x8f (0xc2274 at 0xe657f8) -> option +0x1477 = JOINT 143 (u 900 sits on 144; J is the
       // kind byte, 0xc22f8 / 0x7421c). Descriptor [0x172ba68][123] = 0x159b2f0 word [1] 0x8537 =
       // enemy\em042\em042_00\mod\em042_00_tail (0x159daa0 hash), +0xb4 0x77ed = em001_00_option; dtp byte 13 = 0.
       // u 905: 0x703b8 kind 1 -> id 5 -> base 0x159c7fc[5]. (dev/fw-undriven-barioth-basarios-ukanlos.md 1)
       em042_00: { piece: 'em042_00_tail', joint: 143, above: 20, landing: ['em042_00u', 905] },

2. render/motion-states.js em042_00, the sever row gains `drops: true` (and the stale "No cut-tail model is staged"
   sentence goes):

       '3|Motion[13]': { levels: [[18], [19]], fire: [null, ['em042_00u', 900]], drops: true },

### Basarios (em004_00) -- u 905 and c 1105

1. render/tail-option.js `CUT_TAIL`:

       // BASARIOS: sever kind 0x8f (0xc2274 at 0xd22d20) -> JOINT 143, where u 900 also sits. Descriptor
       // [0x172ba68][112] = 0x159aa2c word [1] 0x8413 = enemy\em004\em004_00\mod\em004_00_tail (0x159daa0 hash),
       // +0xb4 0x77ed = em001_00_option; dtp byte 13 = 0. His +0x1d0 0xd2e0bc sends id 5 to the base table -> 905.
       // (dev/fw-undriven-barioth-basarios-ukanlos.md 1)
       em004_00: { piece: 'em004_00_tail', joint: 143, above: 20, landing: ['em004_00u', 905] },

   and the em005_00 comment's "Basarios has the same option slot but no staged model, which is why he is not here"
   is no longer true.

2. render/motion-states.js em004_00, the sever row gains `drops: true` (and the stale "no em004_00_tail model
   staged" sentence goes):

       '3|Motion[15]':  { levels: [[7], [8]], fire: [null, ['em004_00u', 900]], drops: true },

3. render/motion-states.js em004_00, a NEW row (beside `'3|Motion[13]'`):

       // THE SHOCK TRAP: (10, 0x6e) -> script 0x1798c80 (probe, em 4 and em 5 alike): L3 M9 to f60 (P+0x568), then
       // the L3 M13 hold; c 1105 (cm200_001 on joint 1 at 6x) every 42 while the action lasts -- 0xa4854: gate
       // 0x80254, timer e+0xb7c8, 42.0 at 0xa4890, vt+0x1cc id 5 -> 0x159c798[5].
       '3|Motion[9]':   { every: [['em004_00c', 1105], 42] },

### Ukanlos (em038_00) -- u 1120 / u 1121

1. docs/effect-mounts.json `_autoOnRage`: add `"em038_00"`. That is the whole fix; RAGE_PUFF and the rage row are
   already there.
2. Optional, invisible (1120 = 1121 byte for byte): `RAGE_PUFF.em038_00.joint` 132 -> **3** (`P+0x5d04`, 0xe5a2f0).

After the edits: `python efx/effects_status.py em004_00 em038_00 em042_00` should move c 1105, u 905 (x2) and
u 1120 / 1121 to IMPLEMENTED; `add_effects.py --check` (when the recorder slot is free) for the soak.

---------------------------------------------------------------------------------------------------------------------

## 5. Out of scope, found on the way -- CUT_TAIL joints elsewhere (a lead, not a fix)

J is the sever call's 4th argument (1.1, R). A scan of every `bl 0xc2274` in main.text (`sevscan.py`: the last
`mov r3,#imm` in the ten instructions before each call; only the Basarios / Barioth sites opened by hand, so the rest
are **I**) against tail-option.js:

| class | kind byte (J) | CUT_TAIL joint | |
|---|---|---|---|
| uEm001_00, uEm018_00, uEm032_00, uEm033_00, uEm037_00, uEm038_00 | 0x8f = 143 | 143 | agree |
| uEm043_00 | 0x8e = 142 | 142 | agree |
| uEm045_00 (one site) | 0x8e = 142 | em045_00 142 / **em045_04 144** | em045_04 differs |
| uEm080_00 | 0x91 = 145 | 145 | agree |
| uEm044_00 slot 0 | 0x8f = 143 | **142** | differs |
| uEm047_00 | 0x8e = 142 | **143** | differs |
| uEm050_00 | 0x8e = 142 | **144** | differs |
| uEm055_00 | 0x90 = 144 | **143** | differs |
| uEm057_00 | 0x8f = 143 | **144** | differs |
| uEm063_00 | 0x8e = 142 | **143** | differs |
| uEm077_00 | 0x91 = 145 | **144** | differs |
| uEm081_00 | 0x8a = 138 | **136** | differs |
| uEm007_00 | no slot-0 `bl` found by this scan (slot 1 `0xd32810` kind 3); the entry's comment cites `0xd32724` kind 0x91 | 144 | NR |

The differing entries took u 900's joint for J. One tail joint off moves the drop point, not the landing (G comes from
the monster position). Each needs its site opened before any change.

## 6. NOT READ by name

* Whether the viewer's gid numbering equals the ROM joint id through `[owner+0x498]` for every joint (assumed, as
  every CUT_TAIL entry assumes; the node names `idx:gid` carry the id).
* The option's own step rate (tail-option-em043.md: "the game's own step for the option is NOT READ").
* What the four other L3 M9 actions of Basarios ((10, 0x52) / (0x87) / (0xb4) / (0xbd) / (0xbe)) are.
* The sevscan rows of section 5 other than uEm004_00 / uEm042_00.

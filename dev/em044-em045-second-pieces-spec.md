# Barroth (em044_00) and Crystalbeard Uragaan (em045_04) -- the second severed pieces and u 906

Research agent for the Viewer agent, 2026-10-15 (dev/brute-wyverns-effects-survey.md "What closing each needs" item 2:
"the second severed piece: Barroth's head and Crystalbeard's beard (u 906)"). Static ROM reading plus unicorn controls
(the tail_emu harness on the option's own code, the action prober, the script reader); no recorder, no lift, no
`--apply`, no docs/ edit. `R` = READ (the consuming instruction read), `E` = emulated (the ROM's own code run), `I` =
INFERRED, `NR` = NOT READ. Scratch: `<archive>/sp2/` -- `rdis.py` / `fwread.py` / `brscan.py` (disassembly, every
b / bl to a target), `vtband.py` (class bands from the vtables), `desc.py` (option descriptors and their resource
hashes), `act72.py` (the action prober on (10, 0x72) per part), `piece2.py` (the option code run per kind with the
monster's own option list and `.dtp` option rows, compared step by step with `CutTail`).

Sources opened first: rom-map.md (`0xc2274`, uEnemyOption, HornPiece, u 906, the Bloodbath / Barioth sections, the
Withdrawn rows on CUT_TAIL joints, the sever-scan lead row), dev/em007_04-undriven-spec.md (whole; §1.1 is the method
followed here), dev/brute-wyverns-effects-survey.md, E:\offline\decode\notes\states-em044_00.md (§0, §2, §3.4, §10) and
states-em045_00.md (§2, §4, §7), tail-option-em043.md (by way of tail-option.js), docs/render/tail-option.js (whole),
motion-states.js (em044_00 / em045_00 / em045_04 blocks), index.html `stepCutTail` and `reviewSheds`, efx/add_effects.py
`state_records`, monsters.json (both entries' `parts`), part-review.json (both entries), docs/effects/em044_00.json /
em045_04.json (the records' payloads), the task board (grep: only the survey's own line).

## 0. Headline

| | Barroth `em044_00` | Crystalbeard `em045_04` |
|---|---|---|
| **the second piece** | **his HEAD CROWN** -- the 176-vertex `XfB_N__E_m00_head` mesh (group 3) | **his BEARD** -- the chin and its ore (group 1, 56 v jaw + 481 v ore) |
| sever site | `0xe83bc8 bl 0xc2274` = `0xc2274(e, slot 1, 0, 3, NULL)` | `0xe8fc84 bl 0xc2274` = `0xc2274(e, slot 1, 0, 4, NULL)`, variant 4 only |
| trigger | (10, 0x72) with **part 0** -> script `0x17c1f60` -> **L3 M1** f0 | (10, 0x72) with **part 0** -> script `0x17c3030` -> **L3 M1** f0 |
| drop joint (option `+0x1477`) | **3** | **4** |
| kind / landing | kind 2 -> `0x703b8(owner, 2, &G)` -> id 6 = **u 906** at step **42** | the same, **u 906** at step **42** |
| flight | **`CutTail` exactly** (emulated, 0.0001 max) on `em044_00_option` Motion[2] | **`CutTail` exactly** on `em045_04_option` Motion[2] |
| landing height G.y | floor + **20 S** (no `.dtp` option row) | floor + **30 S** (`.dtp` option row 1) |
| model | `em044_00_tail` (slot 0) **and `em044_00_head`** (slot 1) both staged | `em045_04_tail` (slot 0) **and `em045_04_head`** (slot 1) both staged |
| part pass | `vt+0x370(e, 2)` -> **set 4** (group 3 off, 4 on) | `vt+0x370(e, 2)` -> **set 4** (group 1 off, 2 on, 102 off) |
| FLIGHTS entry | **none** -- the piece flies on `CutTail` | **none** |

Found on the way, R: **both monsters' existing CUT_TAIL tail entries are wrong in the same way the Withdrawn table
already records for Barioth and Diablos** -- Barroth's tail drops from **joint 143** (`0x8f`, not u 900's 142) and
Crystalbeard's from **joint 142** (`0x8e`, not u 900's 144) -- and **Uragaan's and Crystalbeard's tails land 75 S above
the floor, not 20 S**: their `.dtp` carries option rows, which no CUT_TAIL entry has looked at before (§3, §5).

## 1. Barroth (em044_00), uEm044_00 -- R

### 1.1 The sever sites

Class band from the vtable: `0x17c1434` has 32 own slots in `0xe83434..0xe8e190` (`vtband.py`; Uragaan's
`0xe8f0b8..0xe9d634` follows). Every b / bl to `0xc2274` over `0xe7a000..0xea0000` (`brscan.py` method; control: the
same scan over uEm007_00's band finds `0xd32810`, the one shared call the em007_04 spec read): **`0xe839d8` and
`0xe83bc8`**, both in vt+0x204 = **`0xe83900`** (the on-action-start hook; `[0x17c1434 + 0x204]` read):

    0xe83998  cmp r2,#0x72 ; bne            ; status 10, number 0x72
    0xe839a4  bl 0x9e8d8 ; cmp r0,#0 ; beq 0xe83bb0                 ; part (P+0x5ccb >> 3) & 7
    0xe839b4  bl 0x9e8d8 ; cmp r0,#5 ; bne 0xe83c24
    0xe839c0  r0 = 0, r1 = 0 (slot 0), r2 = 0, r3 = 0x8f ; str r0,[sp] (5th NULL) ; 0xe839d8 bl 0xc2274   ; THE TAIL
    ...       e+0xcada |= 0x20 (tail mud gone; guarded by the area stash e+0xcadb / e+0x7420)
    0xe83bb0  r0 = 0, r1 = 1 (slot 1), r2 = 0, r3 = 3    ; str r0,[sp]            ; 0xe83bc8 bl 0xc2274   ; THE HEAD
    0xe83bcc  e+0xcada |= 1 (head mud gone; same guard), then 0xac030(e, P+0x40, 0x1e, 0)

No variant test (the class runs Barroth alone). So the **head piece drops from joint 3** (`0xc2274` stores its 4th
argument at option `+0x1477`, `0xc22f8`; the drop reads it at `0x7421c`: `[[owner+0x498] + 3]`), and the **tail from
joint 143**.

### 1.2 The action and the clip -- E

`act72.py` (efx/agents/notice-scratch/probe.py, uEm044_00, em 0x2c, (10, 0x72), parts 0..7; control uEm007_00 variant 4
reproduces the em007_04 spec's `0x179a6d0` for part 6 and `0x179a400` for the rest): **part 0 -> script `0x17c1f60`**,
part 5 -> `0x17c2200`, parts 1-4 / 6 / 7 -> no motion. `scr.py` (cephadrome-scratch): `0x17c1f60` = op 0 **L3 M1**
(0x301) blend 2 start 0 wait 1, end 0xff. The sever runs at the action's start -- **frame 0 of L3 M1** -- the clip
motion-states.js already keys the head break-off on (`'3|Motion[1]'` cycle arm 0).

### 1.3 The option slot, the model and the option list -- R

`0x50aa8` (the id table `0x1594ca4`, read): **em `0x2c` -> index 124** -> `[0x172ba68][124]` = **`0x159b3bc`** = (0x855b,
**0x855c**, **0x855d**, 0x855e, 0x855f, -1, 0x8560, 0x8561), **`+0xb4` = 0x857e**. `0x159daa0` {jamcrc(path), type},
`desc.py`: **0x855c = `enemy\em044\em044_00\mod\em044_00_tail`**, **0x855d = `enemy\em044\em044_00\mod\em044_00_head`**
(type 0x58a15856, rModel as the em007_04 spec names it), **0x857e = `enemy\em_option\mot\em044_00_option`** (type
0x76820d81, rMotionList). Controls in the same run: em `0x407` -> 115 -> 0x8473 / 0x8474 / 0x8489 = em007_04_tail /
_head / _option, the em007_04 spec's reading. **This closes states-em044_00.md's "which file resource 0x855c / 0x855d
names, and which option clip belongs to which option: NOT READ".**

Kinds (shared setup, rom-map `0xb9e84` / `0xb9ef8`, R): slot 0 kind 1, slot 1 kind 2. The activation picks the motion
**kind == 2 ? 2 : 1** (`0x74390..0x74398`: `cmp sl,#2 ; movwne sl,#1`), so **the head flies Motion[2] and the tail
Motion[1] of `em044_00_option`**.

Staged: `docs/models/monsters/em044_00_head.glb` (266 v; monsters.json `parts` kind "head") and `em044_00_tail.glb`
(311 v, kind "tail"); `docs/poses/monsters/em044_00_option.glb`.

### 1.4 What the part pass shows -- R

vt+0x210 = `0xe8caa8` (read at `0xe8cba4..0xe8cbc8`): `vt+0x370(e, 2)` (= `0xa3bf4`, `P+0x3b4 & 2`, which `0xc2274` sets
for kind 2) == 1 -> **set 4**, else **set 3**. Set 3 = group 3 on, 4 off; **set 4 = group 3 (176 v `XfB_N__E_m00_head`)
off, group 4 (58 v body) on** (states-em044_00.md 2.1). So **the second piece is the head's crown mesh**, and the part
pass hides it with set 4. The head MUD (group 2, `m00_mbody`, sets 9 / 10) is a separate group the same hook strips
(`e+0xcada |= 1` -> set 10), which is why the row's after-state is `[4, 10]`. The piece's model `em044_00_head` is the
ROM's own (`0x855d`), not the mud.

### 1.5 The records -- R (docs/effects/em044_00.json payloads; states-em044_00.md 3.4, 10)

| key | what fires it | record | joint | pos | scale | mode |
|---|---|---|---|---|---|---|
| u 900 | the tail sever, `0xa4354(e, 0)` -> id 3 | cm202_062 | 142 | 0 | 1.0 | 1 |
| u 901 | the head sever, `0xa4354(e, 1)` -> id 4 (vt+0x1d0 `0xe8d6e4`: id < 1000 -> `b 0xa3ddc`, base table `0x159c7fc[4]`) | cm202_060 | 3 | (0, 80, 150) | 0.8 | 1 |
| u 905 | slot 0's landing, `0x703b8` kind 1 -> id 5 | cm202_001 | none (0xffff) | 0 | 0.75 | 3 |
| **u 906** | **slot 1's landing, `0x703b8` kind 2 -> id 6** (`0x70414 movweq r1,#5`, else 6) | cm202_001 | none | 0 | **0.5** | 3 |

All four exported (`when: event`).

## 2. Crystalbeard Uragaan (em045_04), uEm045_00 variant 4 -- R

### 2.1 The sever sites

`0x17c257c` has 27 own slots in `0xe8f0b8..0xe9d634`. The same scan finds **`0xe8fc48` and `0xe8fc84`**, both in vt+0x204 =
**`0xe8fba8`** (read):

    0xe8fc18  cmp r5,#0x72 ; bne
    0xe8fc24  bl 0x9e8d8 ; cmp r0,#6 ; bne 0xe8fc4c
    0xe8fc30  r0 = 0, r1 = 0 (slot 0), r2 = 0, r3 = 0x8e ; str r0,[sp] ; 0xe8fc48 bl 0xc2274     ; THE TAIL (both variants)
    0xe8fc4c  ldrb [e+0xb5f5] ; cmp #4 ; bne return
    0xe8fc5c  bl 0x9e8d8 ; cmp r0,#0 ; bne return
    0xe8fc6c  r0 = 0, r1 = 1 (slot 1), r2 = 0, r3 = 4    ; str r0,[sp] ; 0xe8fc84 bl 0xc2274     ; THE BEARD (variant 4)

So **the beard drops from joint 4** and **the tail from joint 142 on both variants** (no variant test before the tail
call). Uragaan (variant 0) never reaches the second call.

### 2.2 The action and the clip -- E

`act72.py`, uEm045_00, em 0x2d, variants 0 and 4: **part 0 -> script `0x17c3030`**, every other part -> `0x17c32e0`.
`0x17c3030` = op 0 **L3 M1** blend 4 start 0 wait 1, end 0xff. **Frame 0 of L3 M1** -- motion-states.js em045_04's
`'3|Motion[1]'` cycle arm 0. (The beard's gate: vt+0x230 `0xe9c80c` returns 1 for part 0 unconditionally,
states-em045_00.md 4.1.)

### 2.3 The option slot, the model and the option list -- R

em `0x42d` -> index **37** -> **`0x1596e68`** = (0x7bf5, **0x7bf6**, **0x7bf7**, 0x7bf8, 0x7bd7, -1, 0x7bd8, 0x7bd9),
**`+0xb4` = 0x7c0b**: **0x7bf6 = `enemy\em045\em045_04\mod\em045_04_tail`**, **0x7bf7 =
`enemy\em045\em045_04\mod\em045_04_head`**, **0x7c0b = `enemy\em_option\mot\em045_04_option`**. Uragaan em `0x2d` -> 36
-> `0x1596d9c`: word 1 0x7bd5 = em045_00_tail, word 2 -1, +0xb4 0x77ed = em001_00_option. **This closes
states-em045_00.md 4.3's "which file resources 0x7bd5 / 0x7bf6 / 0x7bf7 name: NOT READ".** (The ROM names the beard
model `_head`; monsters.json's kind "head" follows it.)

**`em045_04_option.lmt` and `em044_00_option.lmt` are byte-identical** (1720 B, md5 b67a4bff..., both with Motion[1] and
Motion[2], 55 frames each, end distance 443.6086 -- `T_END` in tail-option.js).

Staged: `docs/models/monsters/em045_04_head.glb` (531 v, kind "head") and `em045_04_tail.glb` (824 v);
`docs/poses/monsters/em045_04_option.glb`.

### 2.4 What the part pass shows -- R

vt+0x210 = `0xe9c8d4`, variant 4 arm `0xe9c94c..0xe9c97c`: `vt+0x370(e, 2)` (`0xa3bf4`) == 1 -> **set 4**, else **set 3**.
Set 3 = groups 1 on, 2 off, 102 on (beard on); **set 4 = 1 off, 2 on, 102 off** -- group 1 is the beard (56 v jaw + 481 v
ore, states-em045_00.md 7.3). So the part pass hides the beard with set 4, and `em045_04_head` is the piece that flies.

### 2.5 The records -- R (docs/effects/em045_04.json payloads; states-em045_00.md 4.3)

| key | what fires it | record | joint | pos | scale | mode |
|---|---|---|---|---|---|---|
| u 900 | the tail sever, id 3 (vt+0x1d0 `0xe9cd68` -> `0xa3ddc`) | cm202_062 | 144 | (0, 80, 0) | 1.4 | 1 |
| u 901 | the beard sever, id 4 | cm202_062 | 4 | (0, -30, 160) | 1.0 | 1 |
| u 905 | slot 0's landing, kind 1 -> id 5 | cm202_001 | none | 0 | 0.75 | 3 |
| **u 906** | **slot 1's landing, kind 2 -> id 6** | cm202_001 | none | 0 | **0.75** | 3 |

## 3. The flight of a kind-2 piece that is not em 7 -- R (code) / E

* **The path.** Phase 2 of the option state machine `0x73780` at `0x73a08`: `em +0xb5f4 == 7 && kind == 2` -> `0x74910`
  (Bloodbath's horn); **otherwise `0x73cd8`**: kind 2 -> `s18 = [0x73f68] = 42.0`, `s16 = 10.0` (`0x73d7c`); kind 1 ->
  `[0x73f6c] = 42.0` (48.0 at `0x73f70` for em 0x50); then `0x73d94..0x73f60` -- the ease over the frame window
  (10, 42] and, past 42, once, `0x703b8(owner, kind, &G)` (`0x73efc`). **The kind-2 piece of a non-em-7 monster runs the
  exact code `CutTail` transcribes, on the option list's Motion[2].**
* **The height and the speed: the `.dtp` option rows.** Activation `0x73f7c`: h = 20 x S (`0x74088`; S from `0xbe518`),
  em 7 kind 2 -> -20 (`0x740d0..0x740f4`); then **row = kind == 2 ? 1 : 0** (`0x740ec movweq r5,#1`) and, **if row < the
  row count `[[owner+0x75f0]+0x91]`** (`0x740e8` / `0x740f8`), the row at `[dtp+0x78] + row*0x20` overrides: its three
  floats at +0 / +4 / +8 are a rotation in degrees (x `0x74288` = pi/180, `0x74104..0x741fc` -> option `+0x14c0`), **+0x10
  the motion speed** (-> option `+0x50c`, `0x7442c`) and **+0x14 the height x S** (`0x74200..0x74210`); with no row,
  speed = 1.0 (`0x74218`). G.y = the stage hit + that height (`0x74358`).
  (`.dtp` field `+0x91` / array F at `+0x78`, efx/agents/diablos-scratch/dtp.py, schema consumed EXACT.)
  * Barroth: **`+0x91` = 0** -> h = 20 S, speed 1.0 for both pieces.
  * Crystalbeard: **`+0x91` = 2** -> row 0 (the tail) {rot 0, speed 1.0, **h 75**}, row 1 (the beard) {rot 0, speed
    1.0, **h 30**}.
  * Uragaan: `+0x91` = 1 -> row 0 (the tail) {rot 0, speed 1.0, **h 75**}.
* **Emulated** (`piece2.py`: the tail_emu harness -- the option's own ctor, reset, activation, both passes, the motion
  system, `0x73cd8` -- with the monster's own option `.lmt`, em / variant bytes, kind, joint byte and the real `.dtp` option
  rows; J (100, 400, -300), owner at the origin; per-step position and rotation against tail-option.js's own `CutTail`
  tables):

  | run | motion | landing `0x703b8` | G | max \|pos - CutTail\| | max \|quat - CutTail\| |
  |---|---|---|---|---|---|
  | **control**: em001_00_option, kind 1, em 0x2b | 1 | kind 1, step 42 | (0, 20, 0) | 0.0001 | 0.00000 |
  | Barroth tail: em044_00_option, kind 1, joint 0x8f | 1 | kind 1, step 42 | (0, 20, 0) | 0.0001 | 0.00000 |
  | **Barroth head: em044_00_option, kind 2, joint 3** | **2** | **kind 2, step 42** | (0, 20, 0) | 0.0001 | 0.00000 |
  | Crystalbeard tail: em045_04_option, kind 1, rows | 1 | kind 1, step 42 | **(0, 75, 0)** | 0.0001 | 0.00000 |
  | **Crystalbeard beard: em045_04_option, kind 2, joint 4, rows** | **2** | **kind 2, step 42** | **(0, 30, 0)** | 0.0001 | 0.00000 |
  | the same, S = 1.5 x 1.5 | 2 | kind 2, step 42 | (0, 67.5, 0) = 30 x 2.25 | 0.0001 | 0.00000 |
  | **negative control**: em007_04_option, em 7, kind 2 | 2 | kind 2, **step 48** | (0, -20, 0) | **922.8** | **1.31** |

  So **both second pieces are `CutTail` exactly** -- the shared Motion[2] of these lists is, to the evaluator, the same
  root curves as em001_00_option's Motion[1] -- and the comparison is not blind (em 7's kind 2 is caught at once).
  **No FLIGHTS entry is needed.** The harness's two 24-byte null-page reads appear in every run, the control included.

## 4. WHAT TO CHANGE (the implementation agent transcribes)

### 4.1 render/tail-option.js -- the second pieces (and the two tail entries)

Key the second piece by what it is; `stepCutTail` already takes `CUT_TAIL[id][drops]` for any key. Replace the em044_00
and em045_04 entries (and their comments, which say the table cannot carry a second piece):

    // BARROTH: TWO option slots -- descriptor [0x172ba68][124] = 0x159b3bc: word 1 0x855c = em044_00_tail, word 2
    // 0x855d = em044_00_head; +0xb4 0x857e = em_option\mot\em044_00_option (byte-identical to em045_04_option). His
    // on-action-start hook vt+0x204 0xe83900, (10, 0x72): part 5 -> 0xc2274(e, 0, 0, 0x8f) at 0xe839d8 = THE TAIL from
    // JOINT 143 (u 900 sits on 142; the drop reads option +0x1477, the 4th argument); part 0 -> 0xc2274(e, 1, 0, 3) at
    // 0xe83bc8 = THE HEAD CROWN from JOINT 3 (the 176-v m00_head mesh, set 3 -> 4), kind 2, which a non-em-7 monster flies
    // on CutTail's own code (0x73cd8) over Motion[2] -- emulated equal to CutTail, u 906 at k 42. No .dtp option rows
    // (+0x91 = 0): both land 20 S up. (dev/em044-em045-second-pieces-spec.md 1, 3)
    em044_00: { piece: 'em044_00_tail', joint: 143, above: 20, landing: ['em044_00u', 905],
                head: { piece: 'em044_00_head', joint: 3, above: 20, landing: ['em044_00u', 906] } },

    // URAGAAN: u 900 names joint 142 and the sever passes 0x8e = JOINT 142 (0xe8fc48); his .dtp carries ONE option row
    // (+0x91 = 1): {speed 1.0, height 75}, which the activation applies to kind 1 (0x740e8..0x74210) -- he lands 75 S up,
    // not 20. The sever is GATED on the tail already being at break level >= 1. (dev/em044-em045-second-pieces-spec.md 3, 5)
    em045_00: { piece: 'em045_00_tail', joint: 142, above: 75, landing: ['em045_00u', 905] },

    // CRYSTALBEARD: TWO option slots -- [0x172ba68][37] = 0x1596e68: 0x7bf6 em045_04_tail, 0x7bf7 em045_04_head; +0xb4
    // 0x7c0b = em045_04_option. vt+0x204 0xe8fba8, (10, 0x72): part 6 -> 0xc2274(e, 0, 0, 0x8e) at 0xe8fc48 = THE TAIL
    // from JOINT 142 on both variants (u 900 sits on 144), needs tail level >= 2; part 0 on variant 4 -> 0xc2274(e, 1,
    // 0, 4) at 0xe8fc84 = THE BEARD from JOINT 4 (set 3 -> 4), kind 2, on CutTail's code over Motion[2], u 906 at k 42.
    // His .dtp has TWO option rows: row 0 (the tail) height 75, row 1 (the beard) height 30, speed 1.0 both.
    // (dev/em044-em045-second-pieces-spec.md 2, 3)
    em045_04: { piece: 'em045_04_tail', joint: 142, above: 75, landing: ['em045_04u', 905],
                beard: { piece: 'em045_04_head', joint: 4, above: 30, landing: ['em045_04u', 906] } },

(`above` is scaled by S, as every non-`unscaled` entry. No `flight`: `CutTail`.)

### 4.2 render/motion-states.js -- the two drop rows

Both clips are cycles; `driveMotionStates` resolves the arm before reading `drops` (motion-states.js `spec.cycle[n %
len]`, then `if (spec.drops) out.drop = true`), so the field goes on the sever arm:

    // em044_00 -- HIS HEAD BREAKS OFF ... (existing comment; replace "without dropping anything" with:) His slot 1
    // drops em044_00_head from joint 3 on CutTail's flight (CUT_TAIL.em044_00.head), landing u 906.
    '3|Motion[1]':  { cycle: [{ levels: [[3, 9], [4, 10]], fire: [null, ['em044_00u', 901]], drops: 'head' },
                              { start: [['em044_00c', 1109]] }] },

    // em045_04 -- L3 M1 carries the BEARD SEVER ... His slot 1 drops em045_04_head from joint 4
    // (CUT_TAIL.em045_04.beard), landing u 906.
    '3|Motion[1]':  { cycle: [{ levels: [[3], [4]], fire: [null, ['em045_04u', 901]], drops: 'beard' },
                              { start: [['em045_00c', 1109]] }] },

Update the block comments that say the head / beard "has nowhere to go / to fly" and that u 906 is undriven
(motion-states.js em044_00 header "NOT WIRED ... the head piece ... AND THAT IS WHY `u 906` IS UNDRIVEN", em045_04
header "THE BEARD HAS NOWHERE TO FLY"), and the em045_04 tail row's "u 900 on JOINT 144" (the record's joint; the drop is
142). The tail rows themselves are unchanged.

### 4.3 efx/add_effects.py -- read every second piece's landing

`state_records` takes `ct.horn.landing` only (line 479), so `effects_status.py` would keep calling 906 undriven under a
`head` / `beard` key. Generalise it:

    // every second piece (Bloodbath's horn, Barroth's head, Crystalbeard's beard): u 906 at its own landing
    if (ct) for (const v of Object.values(ct)) if (v && typeof v === 'object' && !Array.isArray(v) && v.landing) take(v.landing, 'event');

(or, without touching the tool, name both keys `horn` -- not recommended: the key is what a reader sees.)

After: `python efx/effects_status.py em044_00 em045_04` should move u 906 off the undriven list. No record needs
exporting (all four of each are exported).

### 4.4 Not changed here, raised -- part-review.json `sheds`

Neither monster's rows carry `sheds` -- not the tail row and not the head / chin row (em045_00's tail row has the unnamed
`"5,6"`). So each piece shows while it flies and lies (`stepCutTail` sets it visible) and goes back to the Parts panel's
say -- hidden -- when the motion is over. If the static display should show the shed pieces as Bloodbath's does (Raven's
sheds design, 2026-09-12), the two-piece form is required (the unnamed form warns when a monster ships two pieces):
em044_00 `"2+3,4"`: `"sheds": { "none+4": "head" }` and `"11+12,101"`: `{ "none+12": "tail" }`; em045_04 `"1,2,102"`:
`{ "2": "head" }` and `"4,5,6,7,8,9,101"`: `{ "5,6": "tail" }`. A design call, not a ROM one.

## 5. Found on the way -- R / E, out of this spec's scope

* **The CUT_TAIL tail joints** (the sever-scan lead, rom-map "every `bl 0xc2274`", now READ for these two): Barroth
  `0x8f` = **143** (entry has 142, u 900's), Crystalbeard `0x8e` = **142** (entry has 144, u 900's). Uragaan's 142 was
  right. One joint off moves the drop's start, not the landing. (4.1 carries both.)
* **`.dtp` option rows change the flight, and no CUT_TAIL entry looked at them.** Every CUT_TAIL monster's
  `_dtbparts.dtp` through dtp.py (all EXACT): rows exist only for **em045_00** (1: h 75), **em045_04** (2: h 75 / 30),
  **em063_00 and em063_05** (1: speed **0.9**, h 20) and **em050_00** (1: speed **0.9**, h 20); every other entry has
  `+0x91` = 0. The Uragaan heights are in 4.1. **The speed 0.9 rows are a lead, not read through:** run on
  em001_00_option with row {h 20, speed 0.9} (`piece2.py`, em 0x3f) the landing moves to **step 46** and the path differs
  from `CutTail` by up to **70 units** (k 25) -- so Brachydios's, Raging Brachydios's and Alatreon's cut tails fly slower
  than `CutTail` draws them. Which option list each flies on was not re-read here (CUT_TAIL's own comments), and a slowed
  `CutTail` (a frame rate on k) is the likely shape -- I until transcribed and run.

## 6. NOT READ, by name

* The option's own frame step (as every CutTail entry; tail-option-em043.md): one game frame per step.
* The stage probe's answer: the harness's flat floor stands in for `0x49a3c`, as before.
* `0xac030(e, P+0x40, 0x1e, 0)` in Barroth's head arm (`0xe83c20`): what it requests -- not opened.
* Whether a piece's model draws every mesh group: read for Savage's tail (tail-option-em043.md); monsters.json lists a
  `hide` entry for `em044_00_head` (`[[0, 23]]`, no `hideIdx`) that this spec did not trace.
* The rotation fields of the `.dtp` option rows are zero for every row found; their consumer `0x72dec` (into `+0x14c0`)
  was not opened, so a non-zero row's effect is NR.
* Whether Barroth's two second counters can fire in one frame (states-em044_00.md 10, unchanged).

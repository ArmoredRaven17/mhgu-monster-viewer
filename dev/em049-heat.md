# Agnaktor (em049_00, class `uEm049_00`) -- the per-part heat machine

Research agent, 2026-10-06, for Raven's "Agnaktor fires the beam, but we are not tracking heated on individual parts.
His mouth and chest should heat up when he fires the beam", his design ("a toggle for 'beam heated' ... the animation
revert back to unheated when it finishes"), and "can we get the heat up and cool down animations in place ... For when
the toggle is used".

ROM: `C:\MHGU-ROM\exefs` main.text (VA 0) / .rodata (0x13ef000) / .data (0x1728000). Class band `0xeb48d0..0xec490c`,
vtable **`0x17c5eb4`** (derived from `vt+0x1f4 = 0xec0a20` at .data `0x17c60a8`; `vt+0x1fc = 0xeb4ae0`, the beam note's
remap, at `0x17c60b0`). **R** = the consuming instruction was read; **I** = inferred; **H** = seen in the unicorn
harness (a cross-check, not the evidence). Static reads first; the harness is `beamsD/drv.py` driven by the scratch
script `scratchpad/em049heat/heatprobe.py` (it hooks memory writes to `E+0xcac0..+0xcaef` and `E+0xcb2e`).

Prior reads this builds on (all re-checked here): the board's 2026-09-14 entry ("0xec22c8 runs a state per lava slot")
and its transcription in `docs/render/monster.js` (ROM_STAGE_CLIPS em049_00, the comment at "AGNAKTOR (uEm049_00) runs
one machine PER LAVA SLOT"); `dev/beams/em049_00.md` §1-§4. Corrections to both are in §7.

## 1. Where the heat lives

| field | what | status |
|---|---|---|
| `E+0xcac0 + 2k`, k = 0..7 (u16) | **heat state of slot k**: 0 cooled, 3 heating, 2 molten, 1 cooling (§3) | R (`0xec22c8`: `ldrh r0,[r4,r0]!` with r4 = E + k*2, jump table `0xec2300`) |
| `E+0xcad0 + 4k` (f32) | slot k's timer, `+= [[0x1831cb0]+0x68] * 0.5` every call; zeroed on every state change | R (`0xec23a8..0xec23d0`; the zeroing `str rX,[r0,#0x10]` with r0 = E+0xcac0+4k) |
| `E+0xcb58 + 4k` | the clip handle slot k last chose (compared with the material's current slot-0 clip) | R (`0xec2330`, `0xec238c`, `0xec24d4`) |
| `E+0xcb2e` (u8) | per-part "cooled and worked enough to want reheating" bits (§2d) | R (writers) / meaning I |
| `E+0xcb0e + 2k`, `E+0xcb1e + 2k` (u16) | the two accumulators behind `+0xcb2e` | R (`0xec146c`) |
| `P+0x1bb` (P = `[E+0x1428]`) | mirror of "slot k is not cooled" as bit k, written by `vt+0x1dc` and read back at action start (§2e) | R / purpose I |

**Eight slots, which ARE the eight break parts.** The part driver uses break part k's level for slot k throughout
(`0x9d36c(E, k)`, R), so slot k = dtt break part k. Mapped to groups by the part driver `0xec1cec` (§4) and to the
viewer's rows through the model's own group table (`docs/monsters.json` em049_00 `groups`, R as data):

| slot | heated groups (intact / broken [/ severed]) | cooled groups | parts drawn heated | viewer row | lava material (§4b) |
|---|---|---|---|---|---|
| 0 | 3 / 4 | 20 / 21 | 4,5,6,7,8 / 4,5,8 | Head | m04_lav04 |
| 1 | 7 / 8 | 24 / 25 | 12,13,14 / 14 | Chest | m05_lav05 |
| 2 | 11 / 12 | 28 / 29 | 18,19,20 / 20 | "Front Right Leg" | m01_lav01 |
| 3 | 9 / 10 | 26 / 27 | 15,16,17 / 17 | "Front Left Leg" | m02_lav02 |
| 4 | 15 / 16 | 32 / 33 | 24,25,26 / 26 | "Rear Right Leg" | m01_lav01 |
| 5 | 13 / 14 | 30 / 31 | 21,22,23 / 23 | "Rear Left Leg" | m02_lav02 |
| 6 | 5 / 6 | 22 / 23 | 2,9,10,11 / 3,11 | Back | m06_lav06 |
| 7 | 17 / 18 / 19 | 34 / 35 / 36 | 27,28,29,103 / 29,103 / 29,30 | Tail | m03_lav03 |

The group numbers and the part lists are R; the leg row names are Raven's (part-review: "naming rests on his order
alone"). The ROM pairs the legs BY MATERIAL: slots 2 + 4 share m01, slots 3 + 5 share m02, every heater in the class
writes 2 and 4 together and 3 and 5 together (§2, H over all 63 reheat numbers), and one hit-zone slot serves each pair
(§4c). So the game has **six independently heatable regions**: head, chest, the m01 legs, the m02 legs, back, tail.

## 2. What heats each slot (every writer is a write of 3 = heating, timer 0)

Census: every literal-offset store to `E+0xcac0..+0xcaee` in the band, plus the computed-address sites (list in the
scratch run). Each store of a state is `3` except the machine's own transitions (§3), the action-start sync (§2e) and
the init clears (§2f). **Nothing in the class writes 0, 1 or 2 from an action, a hit or an element** -- the only way
down is the timer (R; positive control: the same census finds the machine's computed-address stores `0xec241c` /
`0xec2450` / `0xec24bc` of 2 / 0 / 1).

### 2a. The beams -- Raven's case

| action | clip | slot heated, motion frame | site | status |
|---|---|---|---|---|
| (7, 4), (7, 0x1f), (7, 0x20) | **L2 M4** (431 f) | **chest (slot 1) at f0**: phase 0, the same tick as setMotion; **head (slot 0) at f100**: `0xb0968(E,0,0,100.0)` crossed (`0xeba4b4..0xeba4e0`). Beam spawns at f120 (beam note) | `0xeba44c..0xeba460` (chest), `0xeba4d8..0xeba4ec` (head) | R, H |
| (7, 0x25) | **L2 M11** (457 f) | chest f0, head f100 | `0xebce04`, `0xebce50` | R (sites), H |
| (7, 0x38) | **L2 M30** (431 f) | chest f0, head f100 | `0xebec5c`, `0xebece0` | R (sites), H |
| (7, 0x0a) | **L2 M28** (801 f) then M29 | **all eight slots at f0** (phase 0, after setMotion `0xebb81c`) | `0xebb82c..0xebb8ac` | R, H |
| (7, 0x21) | **L2 M27** (659 f) then M29 | all eight at f0 | same block | R, H |
| (7, 0x16) tired, no beam | L2 M12 (291 f) | chest f0; head written **every tick from f1** (`0xebf364` phase-1 tail), so the head stays in state 3 (timer held at 0) for the whole action | `0xebf318`, `0xebf36c` | R (beam note) / H |
| (7, 0x39) tired, no beam | L2 M30 | as (7, 0x16) | same | H |

Every beam heat also clears that slot's `+0xcb2e` bit (`& 0xfd` chest, `& 0xfe` head; R). So **the beam heats exactly
the head and the chest** on the three L2 M4 / M11 / M30 beams -- chest at the start of the clip, head 20 frames before
the beam leaves (f100 vs f120) -- and **the whole body** on the long L2 M27 / M28 beams.

### 2b. Everything else that heats (H, sweep of status 0..17 x number 0..0x7f; the sites are R as stores of 3)

| actions | clip | slots, frame |
|---|---|---|
| (7, 9), (7, 0x1d), (7, 0x1e), (7, 0x27), (7, 0x28), (7, 0x29) | L2 M13 (421 f) | head only, **f58** (`0xebadd8`) |
| (7, 0x35) / (7, 0x3b) / (7, 0x3c) / (7, 0x3d) | L2 M14 / M14 / M15 / M16 | head only, **f56** |
| (7, 0xb), (7, 0x10..0x13), (7, 0x17..0x1c), (7, 0x23), (7, 0x24) | L2 M24 then M25 | all eight, f0 (`0xebb9e8..`) |
| (7, 0xc), (7, 0xd) | L2 M21 then M23 | all eight, f0 |
| (7, 0xe) / (7, 0xf) | L2 M17 / L2 M20 | all eight, f0 |
| (3, 1/3/5/6), (6, 3/4/6/8/0xf), (13, 4) | L2 M6 | all eight, f0 |
| (6, 2), (12, 0), (13, 5) | L2 M19 | all eight, f0 |
| (13, 2) | L2 M18 (after L0 M1) | all eight, f0 |
| (0, 3), (3, 0), (3, 4), (6, 0), (6, 7), (6, 0xb) | L0 M1 (loop) | all eight, f0. These functions also set `E+0xcaf0 = 1` (the flag that runs the `+0xcaf4` / 450 timer in the action main `0xec0b80..`): **I** = the submerged-in-lava family |
| (1, 8) .. (1, 0x46) -- 63 numbers | L3 M14 (45 f) | **a subset**: number 8 + mask-1 over six groups (head, chest, legs 2+4, legs 3+5, back, tail); heated at f0, the matching `+0xcb2e` bits cleared. Dispatch `0xeb6e60` -> `0xeb5ae8(E, case)`, 63-way table `0xeb5bc8` (R); the per-number sets are H |
| (10, 0xa), (10, 0x38), (10, 0x5c) / (10, 0x60) | (none in the hook) | all eight at the action's START, from `vt+0x204` = `0xeb4dd4` (`0xeb4fc0..0xeb50d8` / `0xeb5100..`), the first three also running the tired test `0x81614` | R |
| every call of `vt+0x1dc` = `0xeb5198` while `0x81ed4(E)` = bit 6 of `E+0x1068` | -- | all eight, held at 3 | R; what sets that bit NOT READ (I: standing in lava) |

### 2c. Rage, fire hits, water: no direct path

No writer above tests rage (`0x81670`) or an element. A part's heat comes only from the actions above (R as a census of
the class band; the shared enemy code was not searched for stores into `E+0xcac0`, which is class-private, rom-map
trap 15).

### 2d. The "cooled part worked over" flag `+0xcb2e` (the reheat request)

`0xec0dbc` (called from `vt+0x208` = `0xec1578` each update) calls `0xec146c(E, k, threshold)` per part: when part k is
**cooled and not broken**, `acc_a += P[0x4a8 + 2k] * tuneInt4 (= 2)` and `acc_b += P[0x4b8 + 2k]`; when
`acc_a + acc_b >= tuneInt2 (10, rank <= 4) / tuneInt3 (20, rank > 4)` the part's bit is set (head 0x01, chest 0x02,
legs 2+4 0x14, legs 3+5 0x28, back 0x40, tail 0x80). A heated or broken part zeroes its accumulators (R). `vt+0x1dc`
then calls `0x7fba0(E, 0, 0)` while any bit is set (`P+0x362 |= 2`, R), and `vt+0x214` = `0xec2550` switches on
`+0xcb2e - 1` through a 255-entry table (`0xec27bc`, R; the table not decoded). **I**: the AI then picks the (1, n)
reheat action of 2b whose number encodes the flagged groups. What `P+0x4a8` / `P+0x4b8` count (hits? damage?) is NOT
READ. So "hitting cooled armour makes him reheat it" is the shape the code has, not a read fact.

### 2e. Action-start sync with `P+0x1bb`

`vt+0x204` (`0xeb4dd4`, the action-start hook): while `E+0x7420 == 0`, for each slot k, bit k of `P+0x1bb` set and
state 0 -> 3; bit clear and state 3 -> 0 (`0xeb4df0..0xeb4fbc`, pointer `ip = [E+0xcac0-0xb698] = P` tracked through
the `ldrh lr,[r3,r0]!` writeback; R). `vt+0x1dc` writes bit k = (state k != 0) every call (`0xeb5260..0xeb5360`, R).
**I**: a replicated copy for a remote client; for the host it is a no-op. Not for the viewer.

### 2f. Initial state: cooled

`vt+0x24` (`0xeb4a24`) clears 0x31 bytes from `E+0xcac0` (states and timers) and the constructor `0xeb4998` 0xc2 bytes
from there, both through import stubs (`0x13ecbe4` / `0x13ecbfc`; that they are memclr is I from the (ptr, size) use).
So a fresh Agnaktor is **cooled** until his first heating action (the submerged family above, most likely). Which
action he spawns into: not read.

## 3. What cools: one timer, per slot, no other path

`0xec22c8(E, k, mat, matctl)`, called per lava material from `0xec21d4` (§4b), every part-driver call (R):

| state | material clip put in slot 0..3 of the material (`0xb09ae8`) | leaves when (timer, half-step units) | to |
|---|---|---|---|
| 0 cooled | `cool_Loop` (`0xec2310`) | never by itself | -- |
| 3 heating | `maguma_Change`, **or `maguma_Loop` if the slot's last clip was `maguma_Loop` or `maguma_End`** (`0xec2328..0xec2370`) | timer > **60** (`0xec23f0`) | 2 |
| 2 molten | `maguma_Loop` (`0xec231c`) | timer > **30 x tuneInt[rank > 4 ? 1 : 0]** (`0x6f62c`, `0xec245c..0xec2498`) = 30 x 30 = **900** at both ranks (`em049_00_actiontune.fup` ints = [30, 30, 10, 20, 2], R as data) | 1 |
| 1 cooling | `maguma_End` (`0xec2374`) | timer > **180** (`0xec2428`) | 0 |

The clip is only re-put when it differs from the material's current slot-0 clip (`0xb0cff0` vs `E+0xcb58+4k`), so a
reheat during `maguma_Change` does not restart it; the timer restarts (R).

**Units.** The step `[[0x1831cb0]+0x68]` is the global the rom-map already calls the frame step (I). The thresholds are
exactly half the clips' own lengths (Change 120 -> 60, End 360 -> 180), so in clip / motion frames (60ths): **heating
120 frames (2 s), molten 1800 frames (30 s), cooling 360 frames (6 s)** (I, from that agreement).

**Two slots on one material** (m01: slots 2, 4; m02: 3, 5): both run on the same material in one pass, the second
call's clip wins the draw, and while they disagree each re-puts its own clip every pass (R as code; the on-screen result
I). In play they never disagree: every heater writes the pair together (2b).

**No water, hit or action cooling exists** (§2 census). The order of states is cooled -> heating -> molten -> cooling ->
cooled, with reheat from heating / molten / cooling going back to heating (and straight to the `maguma_Loop` look).

## 4. How the heat reaches the draw

### 4a. Part sets (`vt+0x210` = `0xec1cec`, R)

Group 0 on; then per slot k: `cooledDraw = (vt+0x3f4(E) == 1) && state_k == 0`; cooledDraw -> the cooled group, else
the heated group; intact / broken by `breakLevel(k) >= threshold` (bytes of `[[E+0x75f0]+0x64]`, rank-picked); the tail
also by `vt+0x370(E, 1)` (P+0x3b4 bit 0, `0xa3bf4`; I = severed). `vt+0x3f4` = `0x7fed4` returns 1 only in action group
**11** (death / capture, `states-em055_00.md`), group **14**, or action **(12, 0xff)** (R; groups 14 / (12,0xff) not
named).

**So in live play the game ALWAYS draws the heated groups** -- rock plus the lava overlay -- whatever the heat state; the
cooled groups (rock alone) are drawn only while he is dead / captured (or in those two other states) with that slot at
0. Heat in play is shown by the lava material's clip alone, not by geometry. The broken forms drop the armour plate
and its overlay (head 6, 7; back 2, 9, 10; chest 12, 13; tail 27, 28; R from the groups).

### 4b. The lava materials (`0xec21d4`, R; the data from `docs/materials.json`, built from the ROM's .mrl)

`0xec21d4` walks every material of the model (`[E+0xfc]` count, `0x88db14`), key = `(([mat+0x18] >> 22) & 0xff) - 51`;
key 0 -> slots 2, 4; 1 -> 3, 5; 2 -> 7; 3 -> 0; 4 -> 1; 5 -> 6. With MRL ids 51..56 = m01..m06 this is m01 legs, m02
legs, m03 tail, m04 head, m05 chest, m06 back -- **I**, but it agrees with all six of the part-review's per-part
materials (read off the meshes) through the R group table above, and with Brachydios's m01..m04 = ids 51..54.

All six lava materials (`XfB_0__m01_lav01` .. `m06_lav06`, BSAddAlpha) carry the same four clips; nothing else on the
model is animated (`m00_body`, `m00_hire`, `m07_eye`, the tail's `m00_body`: no clips):

| clip | frames | loop | tracks (m01 shown; fDiffuseColor rgb 0.765 / 0.383, the 4th value = alpha; fTransparency) |
|---|---|---|---|
| `maguma_Change` | 120 | no | alpha and fTransparency 0 -> 1 linear over 120 |
| `maguma_Loop` | 120 | yes | 1 -> 0.9 (f60) -> 1 |
| `maguma_End` | 360 | no | 1, flicker 0.8 / 0.9 every 30 f to f180, then linear to **0 at f360** |
| `cool_Loop` | 120 | yes | 0 -> 0.1 (f60) -> 0: a faint pulse, not nothing |

**There is no crack, no separate glow and no beam-specific clip.** The beam heats the head and chest through the same
slots, the same lava overlays (m04 parts 4, 6, 8; m05 parts 12, 14) and the same clips as every other heat.

### 4c. Hit zones (`0xec0dbc`, R; table 0 / table 1 from `docs/hitzones.json`)

`0xbaacc(E, s)` puts zone slot s on table 0 row s, `0xbaafc(E, s, s)` on table 1 row s (R). Table 0 is the hard one
(cut 15-20, fire 10), table 1 the soft one (cut 35-55, fire 0).

| zone slot | table 0 (hard) when | else table 1 |
|---|---|---|
| 0 | slot 0 cooled and break 0 below threshold | |
| 1, 5, 7 | slot 6 (back) cooled and break 6 below | |
| 2 | slot 1 (chest) cooled and break 1 below | |
| 3 | slots 2 and 4 cooled and breaks 2 and 4 below | |
| 4 | slots 3 and 5 cooled and breaks 3 and 5 below | |
| 6 | slot 7 (tail) cooled and break 7 below | |

"Cooled" here is state 0 only: heating, molten and cooling are all soft (R).

## 5. The transitions the viewer should play

Every heat source -- toggle, beam, dive -- is the same write of 3, so **the game plays the same transition whatever
heated the part** (R): heat up = `maguma_Change` (120 f) then `maguma_Loop`; cool down = `maguma_End` (360 f) then
`cool_Loop`; reheat while molten / cooling = straight to `maguma_Loop`. The lava overlay mesh stays drawn throughout
(4a), so the heat-up is the overlay fading in from `cool_Loop`'s near-zero, and the cool-down is `maguma_End`'s 3 s
flicker and 3 s fade.

What the viewer does today (monster.js ROM_STAGE_CLIPS em049_00, `on: 'drawn'`): six machines, on = the material's lava
part is drawn. Heat-up already matches (Heated on -> the heated rows draw the overlay -> Change 0 -> 1 over 2 s ->
Loop). **Cool-down is invisible**: Heated off switches the rows to the cooled halves at once, the overlay meshes leave,
and `maguma_End` runs on meshes nobody draws. The game never drops the overlay in play (4a).

## 6. What to implement

**Primary case -- the toggles (Raven: "For when the toggle is used").**

1. Per-region heat in the display state: six regions (head, chest, m01 legs, m02 legs, back, tail; the four leg rows go
   two by two by material, §1). Heated toggle = all six; **Beam heated** toggle = **head + chest** (the ROM's L2 M4 /
   M11 / M30 beams; R). The two are OR-ed per region.
2. Drive the six stage machines from the region's heat, not from `drawn`: `on` = region heated (machine m04 <- head,
   m05 <- chest, m01 <- m01 legs, m02 <- m02 legs, m06 <- back, m03 <- tail). Keep `reheat: 'loop'` and
   `settle: 'rest'`; clip lengths come from the materials (120 / 120 / 360 / 120).
3. **Keep the overlay drawn through the cool-down.** Either (a) the ROM's rule: in live play draw every row's HEATED half
   and let the clips show heat, using the cooled half only in a death / capture motion (group 11) whose slot is cooled;
   or (b) the smaller change: when a region turns off, hold its rows on the heated half until its machine has run
   `maguma_End` (360 f), then switch. (a) is the game; it also shows `cool_Loop`'s faint pulse on cooled armour, which
   (b) does not.
4. Hit zones: a region heated (any of heating / molten / cooling) or broken -> table 1 for its zone slots (§4c);
   cooled and intact -> table 0. The broken lists in monster.js's em049_00 hit-zone rules name only the heated broken
   groups (4, 8, 12, ...); the cooled broken groups (21, 25, 29, 27, 33, 31, 23, 35/36) are broken too.

**The beam clips (MOTION_STATES-style, shown over the user's toggles, reverting at the end per Raven):**

| clip | region, from motion frame |
|---|---|
| L2 M4, L2 M11, L2 M30 | chest from **f0**, head from **f100** |
| L2 M27, L2 M28 | all six from f0 |
| L2 M13 | head from f58 |
| L2 M14, M15, M16 | head from f56 |
| L2 M17, M20, M21, M24 (status 7) | all six from f0 (2b; the stores R, the action -> clip pairing H) |
| L2 M6, M18, M19, L0 M1 (statuses 0 / 3 / 6 / 12 / 13) | all six from f0 -- H only, with every outside call stubbed to 0; L0 M1 is a loop that may also be used where no heat is written, so wire it only if Raven confirms these are the lava-dive clips |

At the region's frame the machine goes on (Change, or Loop if already molten / cooling); at the motion's end the
display returns to the toggles, which per §5 means `maguma_End` if the toggle leaves the region cooled. The
motion-states specs today change at frame 0 only (the file's header), so the f100 / f56 / f58 heats need a per-frame
start (the shape `MOTION_TURNS` already uses with `from`).

**The game's own behaviour after a beam (for the record):** the chest is molten from f120 and the head from f220 of the
beam clip, each for 1800 frames (30 s) after its heating, then `maguma_End` (6 s); then cooled. He does not cool when
the clip ends.

**What the viewer cannot evaluate:** the 30 s molten timer running on across clips (the viewer reverts at the clip's
end by Raven's choice); the in-lava hold (`E+0x1068` bit 6, unread); the cooled-hit accumulators and the reheat action
the AI picks from them (`P+0x4a8` / `+0x4b8` unread, the `0xec2550` table undecoded); the tired variant of L2 M30
((7, 0x39), head from f1, not f100 -- the clip alone cannot tell it from (7, 0x38)); the spawn action; the network
sync.

## 7. Corrections

* The board (2026-09-14) and monster.js's comment say "0xec1cec: a slot's state 0 draws its cooled group, anything else
  its heated one". **Incomplete**: the cooled group needs `vt+0x3f4` = 1 as well (death / capture / group 14 /
  (12, 0xff)); in live play the heated group is always drawn (§4a).
* `dev/beams/em049_00.md` §4 lists `e+0xcac0..+0xcaec`, `+0xcb00..08`, `+0xcb2e` as possibly the armour heat. Resolved:
  `+0xcac0..+0xcace` are the eight states, `+0xcad0..+0xcaec` their timers, `+0xcb2e` the reheat-request bits.
  **`+0xcb00 / +0xcb04 / +0xcb08` are not heat**: none of the three heat consumers (`0xec1cec` with `0xec21d4` /
  `0xec22c8`, `0xec0dbc` with `0xec146c`) reads them (R; the same scan finds `+0xcb0e` / `+0xcb1e` there); their meaning
  is NOT READ.
* `docs/part-rest.json` gives em049_00's undamaged sets as [4, 6, 8, 10, 12, 14, 16, 18, 35]. In `0xec1cec` the compare
  is `cmp threshold, level` with `movhi` = intact, so 4, 6, 8, ... are the **broken** heated groups (the intact ones are
  3, 5, 7, ...; groups R). `build-partrest.py` appears to read the operands the other way for this class (I; not
  checked against its source).

## 8. Proposed `dev/rom-map.md` rows

| address | what | class | status | detail |
|---|---|---|---|---|
| `0x17c5eb4` | uEm049_00 vtable (`+0x1f4` 0xec0a20, `+0x1fc` 0xeb4ae0, `+0x204` 0xeb4dd4, `+0x208` 0xec1578, `+0x210` 0xec1cec, `+0x214` 0xec2550, `+0x1dc` 0xeb5198, `+0x24` 0xeb4a24) | uEm049_00 | R | dev/em049-heat.md |
| `E+0xcac0 + 2k` / `E+0xcad0 + 4k` (k 0..7) | per-slot heat state (0 cooled, 3 heating, 2 molten, 1 cooling) / its half-step timer; slot k = break part k (head, chest, legs 2..5, back, tail) | uEm049_00 | R | §1 |
| `0xec22c8` (from `0xec21d4`) | the heat machine per lava material: cool_Loop / maguma_Change (or Loop on reheat) / maguma_Loop / maguma_End; 3 -> 2 past 60, 2 -> 1 past 30 x tune int 0/1 (= 900), 1 -> 0 past 180; slot map by MRL id 51..56 | uEm049_00 | R (ids I) | §3, §4b |
| `0xec1cec` (vt+0x210) | part driver: heated group unless (`vt+0x3f4` = 0x7fed4, groups 11 / 14 / (12,0xff)) and state 0; groups 3/4 .. 17/18/19 heated, 20/21 .. 34/35/36 cooled | uEm049_00 | R | §4a |
| `0xec0dbc` (from vt+0x208) | hit zones: cooled and intact -> table 0, else table 1; zone 0 head, 1/5/7 back, 2 chest, 3 slots 2+4, 4 slots 3+5, 6 tail | uEm049_00 | R | §4c |
| `0xec146c` / `E+0xcb2e` | cooled-part accumulators (P+0x4a8 x tune int 4, P+0x4b8; threshold tune int 2 / 3) -> reheat-request bits; consumed by `0x7fba0` (vt+0x1dc) and `0xec2550` | uEm049_00 | R / meaning I | §2d |
| `0xeba3d8` / `0xebcd94` / `0xebebec` | beams L2 M4 / M11 / M30: chest heated f0, head f100 (+0xcb2e bits 1 / 0 cleared) | uEm049_00 | R, H | §2a |
| `0xebb520` | beams L2 M27 / M28: all eight slots heated f0 | uEm049_00 | R, H | §2a |
| `0xeb5ae8` (from `0xeb6e60`, status 1) | reheat action (1, 8..0x46): heats a subset of six groups at f0 of L3 M14 | uEm049_00 | R (table), H (sets) | §2b |
| `0xeb4dd4` (vt+0x204) | action start: P+0x1bb bit k <-> state 0 / 3 sync; (10, 0xa / 0x38 / 0x5c / 0x60) heat all eight | uEm049_00 | R | §2b, §2e |
| `0x7fed4` (vt+0x3f4, shared) | 1 iff action group 11 or 14 or action (12, 0xff) | shared | R | §4a |

**Withdrawn / corrected:** the board 2026-09-14 reading of `0xec1cec` (state 0 alone draws cooled) -> needs `vt+0x3f4`
too (§7). `dev/beams/em049_00.md` §4's `+0xcb00..08` as heat -> not heat (§7).

# Zamtrios (em067_00) -- the forms: which parts each form draws, which clips play in which form, and where the ground is

Research agent for the Viewer agent, 2026-10-17. Raven: *"Zamtrios: Ensure when it enters Blob Form, it turns off the leg
parts, turns them back on when it exits the blob form. Also, ensure we use the correct form Normal/Armor or Blob for Zamtrios
animations. Then ensure Zamtrios is on the grid floor accordingly."* and *"ensure we follow the ROM, don't take my word for
everything"*. Tags: **R** = the consuming instruction read; **E** = ROM-run (unicorn) on read code; **I** = inferred;
**NR** = not read. Built on `C:\MHGU-RE\offline\decode\notes\states-em067_00.md` (the note), which this re-reads where it
matters and CORRECTS in four places (section 5). Scratch (session-local): `<archive>\z67\` -- `jt.py` (0xf76088's two
motion jump tables + its window literals), `fq.py` (the frame query 0xb0968 -> 0x72714 run natively, every mode used),
`zphase.py` / `zturn.py` / `zheight.py` (the action main 0xf75e20 at every phase x form x stub-return: every motion /
turn table / posture / height call an action reaches), `emcform.py` / `emcpathH.py` (the .emc walked with the form as
context), `s1011.py` (status 10 / 11 clips by posture from the note's unicorn tables + scr.py), `chgscan.py`,
`floor067.mjs` / `lowbone067.mjs` / `meshfloor067.mjs` / `permesh067.mjs` (the viewer headless).
`P` = `[e+0x1428]`; **form** = `P+0x1bb & 3` (0 normal, 1 ice armour, 2 blob) -- NOT the shared posture `P+0x1ba`.

---------------------------------------------------------------------------------------------------------------------

## 0. Answer

1. **Blob form turns OFF group 9 (and 109) -- the hind legs and the lower body -- and NOT the front legs.** Set 16 (what
   the part pass draws every frame of form 2) is `0, 8, 10, 100, 101` on and `7, 9, 105, 107, 109` off, plus set 17
   (mouth 25 off) and the no-ice branch (every ice group off). Group 9 is the hind legs: 686 verts skinned to joints
   15..21 (parts 4 / 5's `.bdd` joints), y from 893 -- the lowest geometry on the model. **The front legs 13 / 14 and
   15 / 16 stay drawn in blob** (the part pass's no-ice branch applies sets 4|19 and 5|20 in form 2 as in form 0). **R.**
   So the viewer's Blob rung shows the wrong set today: it draws `0,8,9,10,100,101,109` = **set 31** (the "second bloat
   shape", what the ROM shows only on certain normal-form clips, section 2.3), and on the blob clips its group 9 hangs
   255..321 below the ground (measured: L3 M100 f99 -307, L4 M5 f45 -255, L4 M12 f188 -321) -- that is the "legs" that
   look broken. **Where Raven's description differs from the ROM: "the leg parts" are the hind legs (group 9), not the
   Left / Right Front Leg rows; those are on in every form.**
2. **The forms follow the form byte, which only five actions write** (note 5.2, re-run): (1, 0x42) -> 1 (the rage roar),
   (10, 0xaf) 1 -> 2 (inflate) and 2 -> 0 (deflate), (1, 0x4) -> 0. Every attack / move handler is form-independent
   (E: the action main gives the same motions in all three forms for statuses 0..9); **the form a clip plays in is
   decided by the command table and the reaction dispatcher**, and the class's per-frame motion switch overrides the
   silhouette on a few clips by frame. Section 2 gives every clip's form; section 3 the MOTION_STATES rows.
3. **The ground is the clip origin on every Zamtrios clip; the viewer's Grid Floor is 300..500 below it on most.** Every
   Zamtrios action sets the shared posture to 0 or 4 (E), both pinned to the ground by `0xbf284` (R, air-height.md 1.5);
   no clip carries root-motion Y (every `reference` track y = 0, 125 of 125); the drawn offset `P+0x5c` is 0 outside the
   dig. The viewer's lowest-reach rule is pulled down by bones the visible mesh does not follow (in normal clips the fat
   body's bones -- joints 154..159 -- park ~200 below the hips' feet; in blob clips the hind legs' bones park below the
   balloon). **Fix: `FLOOR_AT_ORIGIN.add('em067_00')`** (section 4).

---------------------------------------------------------------------------------------------------------------------

## 1. The part pass -- `vtable +0x210 = 0xf7718c -> 0xf768c0`, part half `0xf76d6c..0xf77168` -- R (re-read)

    w = P+0x5cfc
    w & 1    -> sets 16, 17      (form 2: the fat body, mouth off)            0xf76d84 / 0xf76dac
    w & 0x80 -> sets 31, 17      (the second bloat shape = 16 + groups 9, 109) 0xf76d8c / 0xf76de8
    else     -> sets 0, 10       (the normal body, mouth on)                   0xf76d94
    set 1 | 30 by vt+0x3f4 (dying)                                             0xf76e00
    !(w & 2): tail 2|22, head 3|18, +X arm 4|19, -X arm 5|20, fin 6|21 by break level; then 7, 8, 9 (ice off)   0xf76e38..0xf76fdc
     (w & 2): tail 14|28 and head 15|23 by the ice-shatter bits ctl+4 bit 1 / 0 (NOT the break level); arms 4|25,
              5|27 and fin 32|21 by break level; body ice 11|29 (w bit 4); arm ice 12|24, 13|26 by shatter bits    0xf76fe0..0xf77158

`P+0x5cfc` is rebuilt every frame by `0xf76088` (vt+0x2a8): zeroed, then form 2 -> bit 0; form 1 -> bit 1
(`applyIceArmour` 0xf7657c) unless the action is (1, 0x42) and the motion L0 M4; then the motion switch (section 2.3).
Sets as `docs/monsters.json` groups (the .mpm): 16 = `0 on, 7 off, 8 on, 9 off, 10 on, 100 on, 101 on, 105 off, 107 off,
109 off`; 31 = the same with **9 and 109 on**; 0 = `0, 7, 8, 9, 100, 105, 107, 109 on, 10 / 101 off`. **R.**

**In blob (form 2) the game draws, every frame:** groups 0, 8, 10, 100, 101; the eye 1 (30 dead); tail 19 | 20, head
11 | 12, fin 17 | 18, +X arm 13 | 14, -X arm 15 | 16 (each by its break level); no ice; no mouth 25; **no 7, 9, 105, 107,
109**. The single exception is the inflate clip L4 M2 before its frame 120 (2.2). **R.**

**The part-review edit (the only one):**

    "0,7,8,9,10,100,101,105,107,109": {
      "name": "Blob Mode", "state": "level", "hidden": true,
      "default": "0,7,8,9,100,105,107,109|0,7,8,9,100,105,107,109|0,8,10,100,101",
      "options": {
        "0,7,8,9,100,105,107,109|0,7,8,9,100,105,107,109|0,8,10,100,101": "Off",
        "0,8,9,10,100,101,109": "Blob (Legs)"
      }
    }

i.e. the Blob rung's half becomes `0,8,10,100,101` (= set 16, the ROM's blob) and `0,8,9,10,100,101,109` (= set 31) is the
parked option, renamed back to Blob (Legs). **Nothing else on the axis changes**: Body `none|4,102|none`, the leg-ice rows
`none|3,28|none` / `none|26,29|none`, Mouth `25|25|none`, Tail / Head / Fin as they are, all match the part pass at all
three rungs (R). **Left / Right Front Leg (13,14 / 15,16) stay OFF the axis**: the ROM draws the same pair in all three
forms by the same break level (sets 4|19 / 4|25 and 5|20 / 5|27 are member-identical). **R.** The rung's `views`
(Blob -> L4 Motion[1]_loop) stays: L4 M1 is the bloated idle (1, 5) (R).

---------------------------------------------------------------------------------------------------------------------

## 2. Which clips play in which form

### 2.1 Method

* **The action handlers do not look at the form** (E): `zphase.py` runs the action main for statuses 0..9, numbers
  0..0xff, phase `P+0x1a1` 0..9, at form 0 / 1 / 2, with every outside call returning 0 and then 1; the motions are
  identical across forms. The only form-dependent outcomes are the class's idle chooser vt+0x3dc (form 2 -> (1, 5) =
  L4 M1, R) and the remap vt+0x1fc (form 2: (0, 0..2) -> (1, 5), (1, 0x16) -> (1, 0x41) = L3 M102, R).
* **Status 10 / 11** (the reactions) are posture-dependent scripts: the note's unicorn tables (`s10_em067.txt`,
  `s11_em067.txt`, E) walked with `scr.py`.
* **Statuses 1..9: the form comes from the command table.** `emcform.py` walks `em067_00_cmdtbl.emc` from g0 s0 and every
  stream of groups >= 2, carrying the set of forms a branch is reachable in: op 0x6f `00 <sel>` switches on the class's
  callback 0xf7580c (R, note 1.5) -- **sel 0 returns 1 / 4 / 5 for form 0 / 1 / 2, sel 4 is 1 only in form 2, sels 6..9
  are 1 only in form 1** -- and op 0x20 n / 0x14 n continue in g0 / g1 stream n. The case / default reading of op 0x6f
  is the note's (its group-6 read), not re-read in the interpreter: **I**. The form-2 streams are g0 s20 / s21 / s28 /
  s29 (reached from g0 s2's `6f 00 00 | 6f 01 05`), which call g1 0x05 and 0x78..0x89. A second pass (`emcpathH.py`)
  takes "form 2 is never submerged" (sel 1 cases 2 / 3 -> forms 0, 1): every posture write in the class is a whole-byte
  store (`0xf668bc` strb 0, `0xf66d18` strb 2, `0xf66e20` strb 0, `0xf66ee4` strb 1, R), so entering form 2 clears the
  submerged bits 2 / 3, and the only actions that set them are status 6 / (1, 0xa) / (1, 0x33) / (0, 7) / (7, 0x47)
  (`zpost.py`, E). Under that, no form-2 stream issues them except the area-leave g1 s112 / s142 (reached from g0 s0
  before any form switch): **I** that blob never digs.
* Turn tables (`bw1/turntabs.py` + `zturn.py`): (2, 5) -> `0x16a09bc` {L4 M9 straight; L4 M7 / M8 sides}; (2, 0xb..0xe) /
  (2, 0x1d) / (2, 0x22) -> `0x16a0a7c` {L0 M13; L0 M11 / M12}; (2, 2) / (2, 8) / (2, 9) -> `0x7a284` on the vtable-data
  pair `0x17ddbcc` = {`0x16a0a7c`, `0x16a0b7c` {L0 M32 / M33}}; (1, 0x21) `0x16a0a3c` L0 M34; (1, 0x24 / 0x25)
  `0x16a08bc` / `0x16a08fc` L4 M64 / M65; (1, 0x31 / 0x32) `0x16a093c` / `0x16a097c` L4 M72 / M73; (1, 0x44) `0x16a087c`
  L4 M76; (6, 5 / 0xd / 0x13 / 0x28) `0x16a0abc` / `0x16a0afc` L4 M31..M33 (posture 4). **R** (tables) / **E** (callers).

### 2.2 The transitions -- R / E

| clip | action | what the part pass draws (frame windows ROM-run, `fq.py`) |
|---|---|---|
| **L0 M4** | (1, 0x42) from form 0 or 2 | form is 1 from the action start, but the ice is held off while the action is (1, 0x42) AND the motion L0 M4 -> **normal body, no ice, the whole clip** (from blob: the balloon is gone on frame 0). As (1, 0x10) / (1, 0x1c) / (1, 0x47) / (1, 0x4d) in form 1 -> armour. |
| **L2 M21** | (1, 0x42)'s second clip (E) | form 1, motion != L0 M4 -> **ice on** (+ the 0xd800000 material fade machine, note 4.6: a material, not a mesh -- not wired, NR which material) |
| **L4 M2** (inflate) | (10, 0xaf) from form 1 -> 2 | `0xf76294`: `0xb0968(e, 1, 120)` (mode 1 = frame >= 120) -> bit 0, **else bit 0 CLEARED** -> **f < 120 the normal body**; `0xb0968(e, 2, 130)` (mode 2 = frame < 130) -> `applyIceArmour` -> **f < 130 the ice**. So: f0..119 normal body + ice, **f120..129 the balloon + ice, f130.. the balloon, no ice** |
| **L4 M3** (deflate) | (10, 0xaf) form 2 -> 0, (1, 0x4) -> 0 (EMC: form 2 only) | form 0: `0xf76430` mode 2 (374) -> bit 7 -> **set 31 (balloon with hind legs) f < 374, then the normal body**; no ice |
| **L4 M4** | (1, 0x4)'s second clip (E) | form 0: normal body, no ice |
| **L4 M30** | (7, 0x23), EMC: form 1 only; played at shared posture 4 | `0xf763f4` mode 3 (146, 220) in form 1 -> bit 4 -> **set 29 (body ice + plates 21 / 22, the "Spikey" option) f146..220**, set 11 otherwise |

### 2.3 The silhouette windows in `0xf76088`'s motion switch -- R (`jt.py`) / E (`fq.py`)

Not form-gated: they act whenever bit 0 is clear (forms 0 / 1); in form 2 bit 0 wins and set 16 shows.

| motion | arm | window | effect |
|---|---|---|---|
| L2 M13 | `0xf761cc` | mode 9 (78, 146): the step overlaps [78, 146] | bit 7 -> set 31 f78..147 |
| L2 M14 / M15 / M16 / M17 / M19 / M22 | `0xf76460` | none | bit 7 -> set 31, whole clip |
| L2 M18 | `0xf76438` | mode 2 (80) | set 31 f < 80 |
| L2 M23 | `0xf76440` | mode 2 (38) | set 31 f < 38 |
| L2 M20 / M21 | `0xf76488` | -- | nothing |
| L0 M16 (0x10) | `0xf764a0` | mode 1 (10) | set 31 f >= 10 (frames over the whole _start / _loop slot) |
| L0 M17 (0x11) | `0xf76340` | mode 2 (10) | set 31 f < 10 |
| L4 M2 / L4 M99 | `0xf76294` | 2.2 | -- |
| L4 M3 / L4 M100 | `0xf76430` | mode 2 (374) | bit 7 + joint-201 capsule f < 374 |
| L4 M30 | `0xf763cc` | mode 3 (146, 220), form 1 only | bit 4 |
| L3 M103 / M115, action exactly (11, 0) | `0xf762dc` | mode 2 (346) | bit 0 (L3 M103 is 237 frames: the whole clip) |
| L4 M80 / M85 | `0xf76280` / `0xf764b4` | (4, 24) mode 3 / (158) mode 2 | bit 7 -- **not in `em067_00_4`** |

The frame query's modes (`0x72714`, table `0x728d0`): **mode 2 `0x72984` = cur < s0** (R + E: f129 -> 1, f130 -> 0);
**mode 3 `0x7293c` = s0 <= cur <= s1** (R + E); mode 1 = cur >= s0 and mode 9 = the step overlaps [s0, s1] (rom-map rows,
E agrees). The gate `+0x4f4` (> 0: modes 1 / 3 / 9 answer 0, mode 2 compares the unstepped frame) is a blend-in timer: **I**.

### 2.4 Every clip's form

B = blob only, A = armour only, NA = normal or armour (the user's), N = normal only, ANY = all three (the user's form).
"rows" = the MOTION_STATES treatment in section 3.

| clip | form | evidence | rows |
|---|---|---|---|
| L0 M1, M2 | NA | idles (0, 0) / (0, 1); form 2 remaps them to (1, 5) (R) | not-blob |
| L0 M4 | NA | 2.2 (R); (1, 0x1c) is also in event group 13, which has no form switch (I) | not-blob |
| L0 M5, M7, M8 | NA | (2, 0) / (2, 1) / (2, 0xf..0x1c): EMC forms 0 / 1 (R walk); (2, 0x1b) / (2, 0x1c) also event group 2, no form switch (I) | not-blob |
| L0 M6 | NA | (2, 6) / (2, 0x20) / (2, 0x21): (2, 0x21) via event group 2 only (I) | not-blob |
| L0 M11, M12, M13 | NA | turn table `0x16a0a7c` of (2, 0xb..0xe), (2, 0x1d), (2, 0x22): EMC forms 0 / 1 (R walk); (2, 0x1d) also g2 (I) | not-blob |
| L0 M14 | NA | tired idle (0, 2), remapped in form 2 (R); (1, 0x1b) also g13 (I) | not-blob (existing row) |
| L0 M15 | NA | (1, 0x12): g3 s0 / g4 s0 under sel 0's default (not form 2) (R walk) | not-blob |
| L0 M16 | 2.3 window | (1, 0x13): issued only from g1 s183, which nothing reaches (NR) | window row |
| L0 M17 | 2.3 window | (1, 0x14): issuer NR | window row |
| L0 M18 | NA (I) | (1, 0x15) / (1, 0x45): issuers NR | not-blob |
| L0 M19, M20 | NA | sleep hold / wake (10, 0x1e) / (10, 0x44 / 0x45) at posture 0 / 1; form 2's sleep hold plays no motion (R) | not-blob |
| L0 M31 | NA | (2, 3) / (2, 0x1e) / (2, 0x1f), EMC forms 0 / 1 (R walk) | not-blob |
| L0 M32, M33 | NA | the (2, 2) / (2, 8) / (2, 9) turn pair's second table (R table; which arm by angle NR) | not-blob |
| L0 M34 | NA | (1, 0x21) table `0x16a0a3c`, EMC forms 0 / 1 (R walk); (2, 0xa) issuer NR | not-blob |
| L2 M7, M8, M12 | NA | (7, 6) / (7, 7) / (7, 0x21..0x38), EMC forms 0 / 1 (R walk) | not-blob |
| **L2 M9, M10** | **A** | (7, 8) / (7, 9): EMC form 1 only (armour-section selectors) (R walk) | armour |
| L2 M13 | NA + window | (7, 0x34), EMC forms 0 / 1 (R walk); window 2.3 | window row |
| L2 M14, M15, M16, M17, M19, M22 | set 31 (form NR) | (1, 0x2d) / (8, 0) / (1, 0x48): issuers NR; L2 M17 / M19: no player found (NR) | set-31 row |
| L2 M18 | ANY + window | flinch (10, 0xd / 0x43 / 0x58 / 0x87 / 0xba) and (11, 6) at every posture (E) | window row (section 3.4) |
| L2 M20 | NA (I) | (1, 0x2d)'s second clip; no window | not-blob |
| **L2 M21** | **A** | 2.2 | armour |
| L2 M23 | window (form NR) | no player found | window row |
| L3 M1, M2, M4, M6, M13, M14, M18, M19, M20, M22, M25, M27, M36 | NA | status-10 / 11 scripts at posture 0 / 1; posture 2 plays L3 M100..M109 instead (E); L3 M2 at posture 2 only via (10, 0x14), which vt+0x23c issues only when form != 2 (R) | not-blob (L3 M1 / M2 / M4 / M13 / M20 existing rows) |
| L3 M3, M5, M7, M8, M16, M17, M29, M30, M33, M35 | ANY | knockdowns (10, 0xa / 0x38 / 0x55 / 0x5c / 0xa4 / 0xa7), (10, 0x9f), (10, 0xc5), the armour shatters, death (11, 3) / (11, 6) -- the same script at posture 2 (E) | none |
| L3 M26 | ANY (I) | (1, 0x1a), event group 13 only | none |
| L3 M32 | ANY (I) | (6, 0x10) dig leap (posture 4 -> (6, 0x11)); not EMC-issued | none |
| L3 M34 | NR | no player found | none |
| **L3 M100, M101, M102, M103, M106, M107, M108, M109** | **B** | posture-2 scripts of (10, 7 / 0x1b / 0x1d / 0x1f / 0x20 / 0x52 / 0x60..0x66 / 0x6e / 0x94 / 0x9b / 0xb4 / 0xd2 / 0x2a / 0x2b / 0x44 / 0x45 / 0x70) and (11, 0 / 7 / 0x10 / 0x12) (E); L3 M102 also (1, 0x41) (R) | blob |
| **L4 M1** | **B** | (1, 5), the bloated idle (R); the bloated stun hold (E) | blob |
| **L4 M2** | inflate | 2.2 | inflate row |
| **L4 M3** | deflate | 2.2 | deflate row |
| L4 M4 | N | 2.2 | normal, no ice |
| **L4 M5, M6, M10, M12, M37, M66** | **B** | (2, 4), (2, 7), (7, 0xa / 0xb / 0x18 / 0x41 / 0x42 / 0x43 / 0x45): EMC form 2 only (R walk); each sets shared posture 0 (E) | blob |
| **L4 M7, M8, M9** | **B** | (2, 5)'s turn table `0x16a09bc` (form 2 only, R walk); (2, 0x24 / 0x25) issuers NR | blob |
| L4 M38 | B (I) | after L4 M37 in (7, 0x18): the emulation faults at `0xf6f2a8` before it (NR) | blob |
| L4 M16..M18, M20..M23, M31..M33, M71 | ANY (I) | the dig (status 6, (1, 0xa / 0x33), (7, 0xc / 0xd), shared posture 4); EMC reaches them from the submerged / area-leave streams, which carry no form switch | none |
| **L4 M30** | **A** + window | 2.2 | armour + window row |
| L4 M49..M52, M55..M62, M64, M65, M72, M73, M76, M91, M92 | NA | (1, 0x1d..0x27 / 0x31..0x37 / 0x44), (7, 0x19..0x1e / 0x3d..0x40 / 0x48..0x4c): EMC forms 0 / 1 (R walk) | not-blob |
| L4 M53, M54 | ANY (I) | (1, 0x22 / 0x23) from event group 9, no form switch | none |
| **L4 M67, M68** | **A** | (7, 0x1f / 0x20): EMC form 1 only (R walk) | armour |
| L4 M69, M70 | NA (I) | (7, 0x35) forms 0 / 1 under the not-submerged reading; (7, 0x47) | not-blob |
| L4 M74 | NR | no player found | none |
| L4 M89, M90 | NA (I) | (1, 0x64 / 0x65): issuers NR | not-blob |

---------------------------------------------------------------------------------------------------------------------

## 3. MOTION_STATES rows -- in the machinery as it is (`MotionStates.step`, read)

How the rows are applied (read, `render/motion-states.js` step / showParts): a row's part sets are laid over the user's
parts, in order, later wins; `levels` (a break row) gives `c.sets = levels[lv]` and **ignores `sets`**; `tables` are
evaluated at frame 0 against the USER's drawn parts (`userLevel`) and PREPENDED to `c.sets` -- on any row, `levels`,
`rage`, `dead` or plain; `setsFrom: [[f, sets]]` appends every entry whose frame <= the motion frame (cumulative, later
wins). A one-rung table (`calm: [S]`) therefore always yields S -- the way to put fixed sets on a `levels` / `rage` row.

### 3.1 Constants (above MOTION_STATES)

    // Zamtrios's forms as the part pass 0xf768c0 draws them (dev/em067-forms-spec.md 1). One-rung tables always give
    // their sets; two-rung tables pick the user's break level (userLevel: rung 1 when its own parts are drawn).
    const Z_LV = (a, b) => ({ calm: b ? [a, b] : [a], enraged: b ? [a, b] : [a] });
    const Z_NOT_BLOB = [Z_LV([0, 10])];                                   // the normal body + mouth; ice = the user's
    const Z_NOICE_BRK = [Z_LV([2], [22]), Z_LV([3], [18]), Z_LV([6], [21])];   // tail / head / fin, ice off
    const Z_ICE_BRK = [Z_LV([14], [28]), Z_LV([15], [23]), Z_LV([32], [21])];  // tail / head / fin, ice on
    const Z_BLOB = { sets: [16, 17, 7, 8, 9], tables: Z_NOICE_BRK };     // form 2: fat body, mouth off, no ice
    const Z_ARMOUR = { sets: [0, 10, 11, 12, 13], tables: Z_ICE_BRK };   // form 1: body + mouth + body / arm ice

(Z_NOICE_BRK own parts 20 / 12 / 18; Z_ICE_BRK own parts 20 / 12 / 18 -- the Broken options at every rung, checked
against the .mpm sets.) **Checked in node** (`<archive>\z67\rowtest.mjs`: the viewer's own `MotionStates.step` +
`showParts` on monsters.json's sets, at each rung's user parts, tail intact and broken): L4 M1 / L3 M103 draw
`0, 8, 10, 100, 101` + the user's breaks (tail 20 when broken), no ice, at every rung; L4 M2 f0..119 the normal body +
every ice group, f120..129 the balloon + ice, f130 the balloon alone (tail forced 19 -- 3.4); L4 M3 set 31 to f373, the
normal body from f374; L4 M30 groups 21 / 22 on f146..220 only; L2 M13 set 31 f78..147 over the user's ice; L0 M1 / L0 M4
at the Blob rung the normal body. The tables read the user's parts from the PREVIOUS `showParts` (a motion starts in
`step` before its parts are applied), which in the viewer is the user's own.

### 3.2 The existing em067_00 rows, changed

    '0|Motion[4]':  { rage: true, tables: Z_NOT_BLOB },
    '3|Motion[2]':  { cycle: [{ levels: [[3], [18]], fire: [null, ['em067_00u', 1000]], tables: Z_NOT_BLOB },
                              { levels: [[2], [22]], fire: [null, ['em067_00u', 1030]], tables: Z_NOT_BLOB },
                              { start: [['em067_00c', 1109]], tables: Z_NOT_BLOB },
                              { every: [['em067_00c', 1105], 42], tables: Z_NOT_BLOB }] },
    '3|Motion[100]': { cycle: [{ ...Z_BLOB, hold: ['em067_00c', 1103] }, { ...Z_BLOB, every: [['em067_00c', 1105], 42] }] },
    '4|Motion[1]':   { ...Z_BLOB, hold: ['em067_00c', 1103] },
    '3|Motion[101]': { ...Z_BLOB, every: [['em067_00c', 1101], 60] },
    '3|Motion[1]':  { cycle: [{ levels: [[6], [6], [21]], fire: [null, null, ['em067_00u', 1006]], tables: Z_NOT_BLOB },
                              { start: [['em067_00u', 1001]], tables: Z_NOT_BLOB }] },
    '3|Motion[4]':  { levels: [[4], [19]], fire: [null, ['em067_00u', 1010]], tables: Z_NOT_BLOB },
    '0|Motion[14]': { rage: false, tired: true, tables: Z_NOT_BLOB },
    '0|Motion[19]': { every: [['em067_00c', 1102], 90], puffOff: true, tables: Z_NOT_BLOB },
    '3|Motion[13]': { every: [['em067_00c', 1101], 60], tables: Z_NOT_BLOB },
    '3|Motion[20]': { dead: true, sets: [30], tables: Z_NOT_BLOB },

Unchanged (ANY): `3|Motion[3]`, `[5]`, `[7]`, `[16]`, `[17]`, `[30]`.

### 3.3 New rows

    // BLOB ONLY (form 2) -- dev/em067-forms-spec.md 2.4
    '4|Motion[5]': Z_BLOB, '4|Motion[6]': Z_BLOB, '4|Motion[7]': Z_BLOB, '4|Motion[8]': Z_BLOB, '4|Motion[9]': Z_BLOB,
    '4|Motion[10]': Z_BLOB, '4|Motion[12]': Z_BLOB, '4|Motion[37]': Z_BLOB, '4|Motion[38]': Z_BLOB, '4|Motion[66]': Z_BLOB,
    '3|Motion[102]': Z_BLOB, '3|Motion[106]': Z_BLOB, '3|Motion[107]': Z_BLOB, '3|Motion[108]': Z_BLOB,
    // the bloated death / capture / sleep-fall (11, 0 / 0x10) and the bloated death in the pit (11, 7 / 0x12) -- the
    // eye flips to 30 as on L3 M17 / M20 (the ROM's dying test); L3 M103 is also the bloated sleep fall, L3 M109 the
    // bloated pit ailments -- shown as death, as L3 M17 / M20 are
    '3|Motion[103]': { dead: true, sets: [30, 16, 17, 7, 8, 9], tables: Z_NOICE_BRK },
    '3|Motion[109]': { dead: true, sets: [30, 16, 17, 7, 8, 9], tables: Z_NOICE_BRK },
    // THE INFLATE (10, 0xaf) from the armour: the normal body + ice until f120, the balloon from f120, the ice gone at f130.
    // The f130 ice-off forces tail / head / fin INTACT (sets 2 / 3 / 6): setsFrom takes no tables (section 3.4)
    '4|Motion[2]': { ...Z_ARMOUR, setsFrom: [[120, [16, 17]], [130, [7, 8, 9, 2, 3, 6]]] },
    // THE DEFLATE: form 0 -- the balloon WITH the hind legs (set 31) until f374, then the normal body; no ice
    '4|Motion[3]': { sets: [31, 17, 7, 8, 9], tables: Z_NOICE_BRK, setsFrom: [[374, [0, 10]]] },
    '4|Motion[4]': { sets: [0, 10, 7, 8, 9], tables: Z_NOICE_BRK },
    // ARMOUR ONLY (form 1)
    '2|Motion[9]': Z_ARMOUR, '2|Motion[10]': Z_ARMOUR, '2|Motion[21]': Z_ARMOUR,
    '4|Motion[67]': Z_ARMOUR, '4|Motion[68]': Z_ARMOUR,
    '4|Motion[30]': { ...Z_ARMOUR, setsFrom: [[146, [29]], [221, [11]]] },          // the spike plates f146..220
    // THE SECOND BLOAT SHAPE (set 31) on frames the class's motion switch names (2.3), over the user's form
    '2|Motion[14]': { sets: [31, 17] }, '2|Motion[15]': { sets: [31, 17] }, '2|Motion[16]': { sets: [31, 17] },
    '2|Motion[17]': { sets: [31, 17] }, '2|Motion[19]': { sets: [31, 17] }, '2|Motion[22]': { sets: [31, 17] },
    '2|Motion[13]': { tables: Z_NOT_BLOB, setsFrom: [[78, [31, 17]], [148, [0, 10]]] },
    '2|Motion[18]': { sets: [31, 17], setsFrom: [[80, [0, 10]]] },
    '2|Motion[23]': { sets: [31, 17], setsFrom: [[38, [0, 10]]] },
    '0|Motion[16]': { tables: Z_NOT_BLOB, setsFrom: [[10, [31, 17]]] },
    '0|Motion[17]': { sets: [31, 17], setsFrom: [[10, [0, 10]]] },
    // NORMAL OR ARMOUR (the user's ice), never the balloon
    '0|Motion[1]': { tables: Z_NOT_BLOB }, '0|Motion[2]': { tables: Z_NOT_BLOB }, '0|Motion[5]': { tables: Z_NOT_BLOB },
    '0|Motion[6]': { tables: Z_NOT_BLOB }, '0|Motion[7]': { tables: Z_NOT_BLOB }, '0|Motion[8]': { tables: Z_NOT_BLOB },
    '0|Motion[11]': { tables: Z_NOT_BLOB }, '0|Motion[12]': { tables: Z_NOT_BLOB }, '0|Motion[13]': { tables: Z_NOT_BLOB },
    '0|Motion[15]': { tables: Z_NOT_BLOB }, '0|Motion[18]': { tables: Z_NOT_BLOB }, '0|Motion[20]': { tables: Z_NOT_BLOB },
    '0|Motion[31]': { tables: Z_NOT_BLOB }, '0|Motion[32]': { tables: Z_NOT_BLOB }, '0|Motion[33]': { tables: Z_NOT_BLOB },
    '0|Motion[34]': { tables: Z_NOT_BLOB },
    '2|Motion[7]': { tables: Z_NOT_BLOB }, '2|Motion[8]': { tables: Z_NOT_BLOB }, '2|Motion[12]': { tables: Z_NOT_BLOB },
    '2|Motion[20]': { tables: Z_NOT_BLOB },
    '3|Motion[6]': { tables: Z_NOT_BLOB }, '3|Motion[14]': { tables: Z_NOT_BLOB }, '3|Motion[18]': { tables: Z_NOT_BLOB },
    '3|Motion[19]': { tables: Z_NOT_BLOB }, '3|Motion[22]': { tables: Z_NOT_BLOB }, '3|Motion[25]': { tables: Z_NOT_BLOB },
    '3|Motion[27]': { tables: Z_NOT_BLOB }, '3|Motion[36]': { tables: Z_NOT_BLOB },
    '4|Motion[49]': { tables: Z_NOT_BLOB }, '4|Motion[50]': { tables: Z_NOT_BLOB }, '4|Motion[51]': { tables: Z_NOT_BLOB },
    '4|Motion[52]': { tables: Z_NOT_BLOB }, '4|Motion[55]': { tables: Z_NOT_BLOB }, '4|Motion[56]': { tables: Z_NOT_BLOB },
    '4|Motion[57]': { tables: Z_NOT_BLOB }, '4|Motion[58]': { tables: Z_NOT_BLOB }, '4|Motion[59]': { tables: Z_NOT_BLOB },
    '4|Motion[60]': { tables: Z_NOT_BLOB }, '4|Motion[61]': { tables: Z_NOT_BLOB }, '4|Motion[62]': { tables: Z_NOT_BLOB },
    '4|Motion[64]': { tables: Z_NOT_BLOB }, '4|Motion[65]': { tables: Z_NOT_BLOB }, '4|Motion[69]': { tables: Z_NOT_BLOB },
    '4|Motion[70]': { tables: Z_NOT_BLOB }, '4|Motion[72]': { tables: Z_NOT_BLOB }, '4|Motion[73]': { tables: Z_NOT_BLOB },
    '4|Motion[76]': { tables: Z_NOT_BLOB }, '4|Motion[89]': { tables: Z_NOT_BLOB }, '4|Motion[90]': { tables: Z_NOT_BLOB },
    '4|Motion[91]': { tables: Z_NOT_BLOB }, '4|Motion[92]': { tables: Z_NOT_BLOB },

No row (ANY / NR): L3 M26, M29, M32, M33, M34, M35; L4 M16..M18, M20..M23, M31..M33, M53, M54, M71, M74.

### 3.4 Two places the machinery falls short of the ROM (the Viewer agent's call)

* **L4 M2 f130**: the ROM drops the ice onto the break-level sets (2 | 22, 3 | 18, 6 | 21); `setsFrom` carries plain sets,
  so the row forces them intact. Exact with `setsFrom` entries that accept a table (`[130, [7, 8, 9], Z_NOICE_BRK]`).
* **L2 M18 at the Blob rung**: the clip plays in all three forms; in form 2 the ROM shows set 16 the whole clip, in forms
  0 / 1 set 31 until f80. The row above is right at Normal / Ice Armor and wrong at Blob. Exact with the same extension
  (`[80, Z_LV([16, 17], [0, 10])]` over a base table `Z_LV([16, 17], [31, 17])` -- rung 1 when group 9 is drawn).
* The existing break rows (`levels` [[3], [18]] etc.) lay the no-ice break sets, so at the Ice Armor rung a break
  reaction takes that part's ice piece off for the clip; in the ROM's armour branch the head / tail show the ICE state
  (sets 15 | 23, 14 | 28), not the break level. Not changed here (R; a row semantics question).

---------------------------------------------------------------------------------------------------------------------

## 4. The floor

### 4.1 The game -- R / E

* **Every Zamtrios action puts the shared posture `P+0x1ba` at 0 or 4** (`zheight.py`, E: `0xbc7f4(e, 0)` in every
  blob action -- (1, 4 / 5 / 0x41), (2, 4 / 5 / 7), (7, 0xa / 0xb / 0x18 / 0x41..0x45) -- and in the ground actions;
  `0xbc7f4(e, 4)` in the dig; the class's idle chooser in form 2 calls `0xbc7f4(e, 0)`, R note 1). The only posture-1
  write is (6, 0x11) (the dig leap, L3 M33 -> L3 M5 / M7 / M35), with no class vertical integrator (`0x7d810` /
  `0x7c9fc` / `0x7b53c` not called there, E) and `P+0x92c` never set (no store in the class): the unit stays on the
  ground (I, air-height.md 1.5's floor).
* **Postures 0 and 4 pin the unit to the ground**: `0xbf284` -> `P+0x44 = P+0x5b4` (R, air-height.md 1.5).
* **No root motion in Y**: every one of the 125 clips' `reference` translation has y = 0 (`air/glbroot.py` on the four
  pose glbs) -- so the clip origin IS the unit.
* **The drawn offset `e+0x1384` is 0**: it is `P+0x5c x S / dtb+0x64` outside posture 3 (R, air-height.md 5.1); the
  per-reset init sets `P+0x5c = 0` (`0xf65e54`, `0xbf700(e, 0.0)`), and no blob or ground action calls `0xbf700` /
  `0xbf71c` (E). The dig does: `0xbf700(e, 0.0)` at `0xf6c240` / `0xf6c8c4` / `0xf6e128`, a computed depth
  (`0xbe518` ratios) at `0xf6d0a0` / `0xf6d364` / `0xf6d628` / `0xf6de08` -- values **NR**; the dig clips carry the
  sinking themselves (the body 800..2700 below the origin).
* **Blob rides the same ground**: no lift, no FlyOfs (0 for him), no SwimTopOfs use -- the balloon is drawn at the unit.

**So the ground is the clip origin on every clip, in every form.**

### 4.2 The viewer today -- measured (`meshfloor067.mjs`, `floorri067.mjs`; game units at the viewer's size 1.3)

The Grid Floor (`rockInput` floorY = `monsterFloorY`: no AIR_HEIGHT row for him, so `min(origin, bone bounds)`) against
the drawn mesh's lowest vertex:

| clip | Grid Floor | mesh lowest (Normal rung / Blob rung) |
|---|---|---|
| L0 M1 idle | **-367.3** | -19.3 / (balloon -346: the fat mesh parked below -- a normal clip) |
| L0 M5 walk | -372.4 | -37.6 |
| L3 M2 | -460.4 | -34.6 |
| L4 M55 | -443.0 | -119.8 |
| L4 M1 blob idle | -20.8 | balloon -58.1 |
| L4 M2 inflate | -37.9 | -44.3 / -46.1 |
| L3 M100 blob | **-423.6** | balloon -45; group 9 (today's Blob rung) -307 |
| L4 M5 blob walk | -203.2 | balloon -24; group 9 -255 |
| L4 M12 blob | -328.4 | balloon -40; group 9 -321 |
| L2 M14 / L0 M16 (set 31 clips) | -15.6 | -24 / -23 |

The bounds walk takes EVERY bone (+0.12 margin): in the normal clips the fat body's bones (joints 154..159, gids 30..35)
hang 195..250 (x 1.3) below the origin, in the blob clips the hind legs' bones do. **The Grid Floor is 300..480 too low on
nearly every normal clip and 150..380 on most blob clips.**

### 4.3 The fix

    const FLOOR_AT_ORIGIN = new Set(['em084_00', 'em067_00']);

(index.html, beside Nakarkos.) The ground then sits at the clip origin: feet 13..60 into it on the ground clips, the
balloon 24..58 into it on the blob clips -- the authored contact. No AIR_HEIGHT row: he has no air posture. The dig clips
(L4 M16..M23, M31..M33, M30 at posture 4, M71, L3 M32) then show the body under the floor, which is what the dig is.

---------------------------------------------------------------------------------------------------------------------

## 5. Corrections to states-em067_00.md (rom-map Withdrawn rows)

1. Note 0 / 5.3: *"from frame 130 `applyIceArmour` re-runs, so the ice is held over the balloon for the rest of that
   clip only"* -- **wrong**: `0xb0968(e, 2, 130)` is mode 2 = frame < 130 (`0x72984`, ROM-run). The ice is on f0..129
   and gone from f130; and the fat set is OFF before f120 (the arm clears bit 0), so L4 M2 opens on the normal body.
2. Note 5.3: *"every window in this class is (N, 0) ... s1 = 0 reads as no end"* -- **wrong**: the r1 the note calls the
   "slot" is the query MODE; the class uses modes 1 (from N), 2 (before N), 3 (N..M, L4 M30 146..220) and 9 (L2 M13
   78..146).
3. Note 5.3: *"L4 M3 (0x403), L4 M30 (0x41e) | slot 3, a window | bit 4"* -- **L4 M3 never sets bit 4**; bit 4 is L4 M30
   in form 1 only (`0xf763cc..0xf7642c`). L4 M3 sets bit 7 + the joint-201 capsule BEFORE f374 (`0xf76430`), not from it.
4. part-review.json's Blob rung = `0,8,9,10,100,101,109` (set 31, "Legs") is not what the game draws in form 2; set 16
   (No Legs) is (section 1). Raven chose Legs because L4 M2's start looked wrong without legs -- the ROM draws the NORMAL
   body there (f < 120), which the L4 M2 row now shows.

## 6. NR, by name

* The issuers of (1, 0x13 / 0x14 / 0x15 / 0x2d / 0x2e / 0x45..0x4a / 0x4d / 0x48 / 0x64..0x67), (2, 0x24 / 0x25),
  (7, 0x3a), (8, 0) -- so the FORM of L0 M16 / M17 / M18, L2 M14..M17 / M19 / M20 / M22, L4 M89 / M90 (their
  silhouette windows are R).
* Who plays L2 M17, L2 M19, L2 M23, L3 M34, L4 M74; L4 M38 after L4 M37 (emulation fault at `0xf6f2a8`).
* Whether the engine raises event groups 2 / 9 / 13 / 14 in form 2 (their streams carry no form switch).
* Whether form 2 can reach the dig (only through the submerged / area-leave streams).
* The dig's drawn offset values (`0xbe518`-derived `P+0x5c`); (6, 0x11)'s height beyond "no integrator".
* op 0x6f's case / default semantics in the interpreter (`0x836ec`) -- read from the data, I.
* `+0x4f4`'s meaning (the gate) -- I.
* The 0xd800000 material (the ice fade on L2 M21 / L0 M4) -- note 4.6, NR.

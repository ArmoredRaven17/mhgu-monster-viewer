# Malfestio (em079_00) / Nightcloak (em079_04) -- the Hypnosis part, the dive part, and the effect gaps

Research agent for the Viewer agent, 2026-10-17. Raven: *"Bird Wyvern: I noticed Malfestio's Hypnosis attack does not turn
on the Hypnosis effect. Ensure Malfestio's effects also know when to turn that part on and off. I also noticed some missing
effects."* Static ROM reading (band disassembly `<scratchpad>/m079/band.txt`), the command tables through
`efx/agents/malfestio-scratch/emc.py`, and a live headless census of the viewer (`<scratchpad>/m079/census.mjs` through
`run-check.mjs` / `run_locked.sh`). No docs/ edit. Status words: **R** = the consuming instruction read; **I** = inferred;
**NR** = not read.

Sources opened first: dev/rom-map.md (the "PSL enable words" and "the shells" Malfestio sections), the task board (Malfestio
rows), states-em079_00.md 1.2 / 1.3 / 2.1 / 2.2, states-em079_04.md 2 / 7.4, dev/em079-shells-spec.md,
dev/em079_00-effects-spec.md, dev/bird-wyverns-effects-survey.md, dev/effects-triage/em079_0{0,4}.md, docs/effects/em079_0{0,4}.json,
docs/part-review.json (em079), render/motion-states.js (`malfestio()` / `nightcloak()`, MotionStates.step / showParts,
RAGE_PARTS, CLIP_VARIANTS), render/psl-mask.js (CLIP_ACTIONS), render/shells.js (`actions079`, PERFRAME079), render/monster.js
CLIP_EFFECTS em079.

---------------------------------------------------------------------------------------------------------------------

## 1. The part pass -- re-read (R)

`vt +0x210 = 0xff04bc` calls `0xff05f8` first, every frame, for both variants (the variant gate at `0xff04c8` comes after).
`e+0x73e0` = action status (r8), `e+0x73e1` = action number (sb), read at `0xff0618..0xff0628`:

    0xff0744  cmp r8, #7 ; bne -> set 13, then set 15                (not status 7: both defaults)
    0xff074c  cmp sb, #0x18 ; bhi ; tst 0x1600000, 1 << sb             (bits 21 / 22 / 24 = numbers 0x15 / 0x16 / 0x18)
    0xff0764  cmp sb, #0xcb ; cmpne sb, #0xda                          -> set 14 (`mov r1, #0xe`), else set 13
    0xff0798  orr r0, sb, #2 ; cmp r0, #0x12                           -> set 16 (`mov r1, #0x10`), else set 15

No variant test between `0xff05f8` and `0xff0808` (the 27 `#0xb5f5` sites of the band, `0xfef4d4` .. `0xffbf1c`, none in it;
control: the same grep finds the known gates `0xff04c8` and `0xfef4d4`). So **Nightcloak runs the same two decisions**.

| set | groups (`em079_0N.mpm`, monsters.json `groups[13..16]`, both monsters) | when |
|---|---|---|
| 13 | 9 off, 105 off | every frame the action is not one below |
| **14** | **9 on, 105 on** (208 + 17 v, body) | action **(7, 0x15) / (7, 0x16) / (7, 0x18) / (7, 0xcb) / (7, 0xda)** |
| 15 | 31 off | every frame the action is not one below |
| **16** | **31 on** (72 v, `XfB_0__m01_wing`, the "Hypno Effect" row) | action **(7, 0x10) / (7, 0x12)** |

The pass runs on the CURRENT action every frame, so a set holds for every clip the action plays and drops the frame the
action changes. Nothing else selects 13..16 (the eight `setVisibleGroup` calls of the class are this pass's: states-em079_00.md
2.1).

**Part-review consequence (R for the ROM side; the naming is Raven's):** part-review.json names groups 9 + 105 "Torso" with
`9,105` = "Broken". They are not a break: no `.dtp` row and no break level reaches them -- set 14 is the five dive actions'
overlay and nothing else. That is also the likeliest reading of Raven's open flag on that row ("may not be rendering
correctly"): the geometry is drawn only mid-dive in the game.

## 2. Which clips each action plays (R)

Status-7 table `0xff6018` (handler `0xff5fe8`, number - 1; `<scratchpad>/m079/cases.py ff6018 e2 1 ...`). Motion ids are
`list << 8 | slot`. "end" = `0xb09c8` (the motion ended); setMotion = `0xafe84` (or `0xafce8`, the same with a flags word).

| action | body | phase by phase (P+0x1a1) | the action ends |
|---|---|---|---|
| (7, 0x10) | `0xffb208` r1 0 | 0: **L2 M16** (`0x210`, `0xffb264`) -> 1: at end **L2 M17** (`0x211`, `movweq` at `0xffb298`) -> 2: shell31 at tune 0x15; at end **L2 M19** (`0x213`, `0xffb388`) -> 3: at end `vt+0x3dc` | after L2 M19 |
| (7, 0x12) | `0xffb208` r1 1 | the same with **L2 M18** (`0x212`, `0xffb28c`) and tune 0x16 | after L2 M19 |
| (7, 0x15) r1 1 / (7, 0x16) r1 0 | `0xffb3b4` | 0: **L2 M21** (`0x215`) -> 1: at end lift (`0xbf4d4`, `0xbc984`), **L2 M22** (`0x216`) -> 2: steer `0xb0df4`; at end **L2 M25** (`0x219`), P+0x14 = -10, P+0x24 = -1 -> 3: on landing (`0xbf52c`) **L2 M23** (`0x217`), rate `0xb07b4(1.5)`, shell40 0 -> 4: at end `vt+0x3dc` | after L2 M23 |
| (7, 0x18) | `0xffb5d8` | 0: lift, **L2 M24** (`0x218`, `0xffb644`) -> 1: at end **L2 M20** (`0x214`, `0xffb774`) -> 2: at end **L2 M25** (`0xffb7d8`) -> 3: landing **L2 M23** (`0xffb85c`), rate 1.5, shell40 0 -> 4: at end `vt+0x3dc` | after L2 M23 |
| (7, 0xca) r5 2 r2 0 / (7, 0xd2) r5 4 r2 1 | `0xff6fe4` | 0: lift, **L2 M24** (`0xff7128`) -> 1: at end `0xafce8` L1 M1 / L1 M2 (by P+0x1a2) and **`vt+0x3d0` chains to (7, 0xcb) / (7, 0xda)** (`0xff70fc` / `0xff7190`) | at L2 M24's end |
| (7, 0xcb) r5 2 / (7, 0xda) r5 4 | `0xff71cc` | 0: lift, **L2 M20** (`0xafce8`, `0xff725c`) -> 1: f18 `0xff02f4` (the cloak cancel, cloaked only), steer; at end **L2 M25** (`0xff7400`) -> 2: landing **L2 M23** (`0xff7480`), rate 1.5 -> 3: tune 0x20 shell40 0 / 1; at end `vt+0x3dc` | after L2 M23 |

So set 16 covers **L2 M16, L2 M17 / L2 M18 and L2 M19 whole**, and set 14 covers **L2 M21, M22, M24 (under (7, 0x18)
only), M20, M25 and M23 whole** -- the action is current from the first clip's frame 0 to the last clip's end, with no
switch inside any clip. **No frame windows are needed.** (One frame of `0xafce8` L1 M1 / M2 at the (7, 0xca) -> (7, 0xcb) seam,
before (7, 0xcb)'s phase 0 sets L2 M20, carries set 14 -- the viewer plays no such frame; not modelled.)

### 2a. Who else plays those clips (R, negative with control)

* setMotion census of the band `0xfee698..0xffe0dc` (`<scratchpad>/m079/setm.py`): 117 calls (109 `0xafe84`, 8 `0xafce8`), every
  one with an immediate id (two through `r6`, loaded 0x15 / 8 / 0x1e / 0x12a). Ids `0x210..0x219` appear ONLY in the five bodies
  above. Control: the same scan finds `0x214` at both its known setters and `0x217` at all three landing sites.
* The class's angle-picked turns (`0x7a258` / `0x7a27c`, 23 calls, 9 tables `0x16a1a6c` .. `0x16a1c2c`, `0x17e99fc`; dumped whole):
  ids L0 M5 / M9 / M10 / M11 / M12 / M13, L1 M2 / M11 / M12, L1 M24 / M25, L2 M4 / M6, L2 M27 / M28, L2 M36 / M37, L2 M48 -- none
  of `0x210..0x219`.
* Not scanned: the shared status-10 / status-11 scripts (data). States-em079_00.md 3.3 / 6 / 8 list every clip they play
  (L3 / L1 / L0): none of these (I from the note, not re-read).

### 2b. Which monster plays which action (R, data)

`em079_0{0,4}_cmdtbl.emc`, both arcs carry the same g1 streams (`<scratchpad>/m079/emcscan.py`):

| action | issued in |
|---|---|
| (7, 0x10) | g1 s19 (both); g1 s95 (reached only from Nightcloak's g0 s11 / s12, op 0x14) |
| (7, 0x12) | g1 s20, s54 |
| (7, 0x15) | g1 s5..s8, s54, s64, s65, s94 |
| (7, 0x16) | g1 s58, s62, s66, s92 |
| (7, 0x18) vs (7, 0xca) | g1 s13, s29..s32, s34, s35, s41: `92 00 | 92 01 00 | 00 07 18 | 92 02 | 00 07 ca` -- op 0x92 the variant switch: **case 0 (Malfestio) (7, 0x18), default (Nightcloak) (7, 0xca)** |
| (7, 0xd2) | g1 s97, s112 -- called only from Nightcloak's g0 s11..s14 (`14 61` / `14 70`); em079_00's tables call neither (control: the same scan finds em079_00 g0 s3's `14 36` = s54) |
| (7, 0xcb) / (7, 0xda) | issued by no stream; reached only by the (7, 0xca) / (7, 0xd2) chains |

Op 0x14 as "run g1 stream N" is I (the reading em079_00-effects-spec.md 2 already used). So:

* **Malfestio** plays L2 M24 only as (7, 0x18): set 14 on. He never plays (7, 0xca / 0xcb / 0xd2 / 0xda).
* **Nightcloak** plays L2 M24 only as (7, 0xca) / (7, 0xd2): set 14 OFF on L2 M24, ON from L2 M20 (his (7, 0xcb) / (7, 0xda)). He
  never plays (7, 0x18).

Within one monster no clip is played both with and without its set, so **no CLIP_ACTIONS entry and no CLIP_VARIANTS copy is
needed** for the parts.

## 3. The rows (for render/motion-states.js)

`sets` on a plain row is the whole motion (`MotionStates.step`: `c.sets = spec.sets` when the row has no levels / dead /
rage), laid over the user's parts in `showParts`. In `malfestio(u)`:

    // THE ACTION SETS (part pass 0xff05f8, every frame on the current action; dev/em079-hypnosis-and-gaps.md 1-2).
    // HYPNOSIS, (7, 0x10) / (7, 0x12) (0xffb208): L2 M16 -> L2 M17 / L2 M18 -> L2 M19, one action -> set 16 (group 31 on,
    // the wing's XfB_0__m01_wing glow) for all four clips.
    '2|Motion[16]': { sets: [16] },
    '2|Motion[17]': { sets: [16] },
    '2|Motion[18]': { sets: [16] },
    '2|Motion[19]': { sets: [16] },
    // THE DIVES, (7, 0x15 / 0x16) L2 M21 -> M22 -> M25 -> M23 (0xffb3b4); Malfestio's (7, 0x18) L2 M24 -> M20 -> M25 -> M23
    // (0xffb5d8); Nightcloak's (7, 0xcb / 0xda) L2 M20 -> M25 -> M23 (0xff71cc) -> set 14 (groups 9 + 105 on).
    '2|Motion[20]': { sets: [14] },
    '2|Motion[21]': { sets: [14] },
    '2|Motion[22]': { sets: [14] },
    '2|Motion[23]': { sets: [14] },
    '2|Motion[24]': { sets: [14] },
    '2|Motion[25]': { sets: [14] },

In `nightcloak()`, after `malfestio('em079_04u')`:

    // L2 M24 is his (7, 0xca) / (7, 0xd2) (op 0x92's default arm): not one of the part pass's five -- set 14 comes on at
    // L2 M20, when the chain makes the action (7, 0xcb) / (7, 0xda)
    delete t['2|Motion[24]'];

**And off everywhere else.** The ROM applies sets 13 and 15 on every other frame, whatever the user's Parts panel says. The
viewer's precedent for a set the part pass re-applies every frame is `RAGE_PARTS` (Seregios's flat/erect default set 3 /
15): `RAGE_PARTS.em079_00 = RAGE_PARTS.em079_04 = { calm: [13, 15], enraged: [13, 15] }` puts 13 / 15 under every motion's own
sets, which then win on the rows above. That makes part-review.json's "Torso" and "Hypno Effect" rows ROM-driven (their
toggles stop mattering). Without it the rows above still switch the parts on during the attacks, and the user's toggle holds
on every other clip -- defaults Off, so the default view matches the ROM. Which of the two is Raven's call; the ROM is the
first.

## 4. Eye set 3 on L2 M23 frames 4..64 (R) -- a window the row table cannot carry

The blink machine `0xff188c` (inside the part pass): on L2 M23 (`0x217`, `0xff18fc`) it calls `0xb09a4(e, 3, 0, s0 4.0, s1 64.0)`
(`0xff1a0c..0xff1a20`, s1 the literal `0x42800000` at `0xff1b6c`); arm 3 of `0x72714` (`0x7293c` -> `0x7299c`) returns 1 when
**s0 <= frame <= s1** (channel 1). Then `e+0xcae0 = 1`, `0x71398(e, 3, 2, -1)`: **eye set 3 (groups 5, 7, 8 on)** for
frames 4..64 of every L2 M23 (all five dive actions, both monsters). The same on L3 M1 frames 2..12 (`0xff1a38`, s0 2.0, s1
12.0). Outside the window the machine restores sets 2 / 1 / 4 (`e+0xcae0` 1 -> 0).

The viewer has `0|Motion[18]` / `0|Motion[20]` / `3|Motion[13]` (`sets: [3]`, whole clips) and nothing for L2 M23 / L3 M1, because
a row's `sets` has no frame axis. Needs: a frame window on a row's sets (e.g. `setsAt: [[4, 64, [3]]]`, inclusive, on the
motion frame), applied over the row's own `sets` -- L2 M23 then reads `{ sets: [14], setsAt: [[4, 64, [3]]] }` and L3 M1's head
break row gains `setsAt: [[2, 12, [3]]]`. Note L2 M23 runs at rate 1.5 in the game (`0xb07b4(e, 1.5)` at its setMotion in all
three bodies): its 64 frames pass in ~43 game frames -- the viewer plays it at 1.0 (`0xb07b4` is not modelled anywhere).

---------------------------------------------------------------------------------------------------------------------

## 5. The effect census

### 5a. What the ROM requests (R unless marked)

| source | Malfestio | Nightcloak | read |
|---|---|---|---|
| PSL clip bits under the word `0xfef4b8` | base word every motion: b0-5 always, b6-8 calm, b9-11 enraged, b12-14 tired-calm | the same + b15-17 on L1 M26 / M27 under (7, 0xcc / 0xcd) | R (em079_00-effects-spec.md 1); CLIP_EFFECTS em079 = the whole-block plan (survey: 0 outside the file mask) |
| class requests through vt+0x1d0 (table `0x16a194c`) | none (every site needs `(e+0xcafc & ~1) == 2`, which never holds for him) | u 200 (id 1001) at `0xff0090` (any action start, `e+0xba44 & 2`), `0xff01fc` (status 11), `0xff028c` ((10, 0xe8 / 0xaf)), `0xff0348` (`0xff02f4`, six callers); u 100 (id 1002) `0xff0400` tired + cloaked (vt+0x208, held at e+0xcb50) -- **all cloaked-only** | R (this read; class-request-sites.json lists two) |
| the request filter vt+0x138 `0xfef54c` | passes all | cloaked: suppresses everything but the list in the map row | R |
| shells | shell01 / shell31 / shell40 (em079-shells-spec.md) | + shell00 | R (prior spec) |
| state records | MOTION_STATES malfestio() | nightcloak() | R (the notes) |
| part sets 14 / 16, eye set 3 windows | §1-4 | §1-4 | R |
| c 31 (`em079_00c` UNIQUE, cm200_040, the dust family's third record) | no shell mode names it (shl.txt: c 29 / 30 only), no class site | the same | **NR** -- who requests it is not found |
| hyper u 1301-1313 | withheld (Raven) | -- | deliberate |

### 5b. What the viewer fires -- measured live (headless, the page's own loop)

`<scratchpad>/m079/census.mjs` (+ `census2.mjs` for the motions the u 10 refusal skipped, `census3.mjs` at timeScale 1 / 3 plays,
`loop2.mjs`, `height.mjs`): every clip of every list, two plays, calm and enraged (lists 1 / 2 / 9), every request hooked at
`host.requestEffect` with its record, `when` and frame; shells from `schedule.shellTally`. Raw: `census.log`, `census2.log`,
`census3.log`, `loop2.log`, `height.log`; `parse.py` / `cmp.py` compare against CLIP_EFFECTS under the word.

* **PSL: no gap.** Every bound bit fired in the state its word enables, none outside it (L2 M12 b6 / b12 c 130 calm only; Nightcloak
  L1 M27 b15 u 361 on the (7, 0xcc) plays only).
* **Shells: fire** -- L2 M17 / M18 u 1, L2 M14 / M15 / M12 enraged u 20 / u 21 (Nightcloak u 30), L2 M23 u 10, L9 M4 u 60 x 1 / x 3,
  L1 M27 u 60, the dust c 29 / c 30 on L1 M2 / M11 / M12 / M22 / L2 M36 / M37 -- except the gaps below.
* **States: fire** -- c 1101 / 1102 / 1103 / 1104 / 1105, u 1010 / 1015 on L3 M2's cycle, c 3000 on the deaths, the puff u 1121.

### 5c. The gaps

| # | clip | record | what fires it in the ROM | why the viewer misses it / does it wrong | fix | st |
|---|---|---|---|---|---|---|
| G1 | L2 M16 / M17 / M18 / M19 | set 16 (group 31, "Hypno Effect") | part pass, (7, 0x10 / 0x12) | no MOTION_STATES row | §3 rows | R |
| G2 | L2 M20 / M21 / M22 / M23 / M25, Malfestio's L2 M24 | set 14 (groups 9 + 105, part-review "Torso") | part pass, the five dive actions | no row; the parts are a user toggle named as a break | §3 rows (Nightcloak without L2 M24); RAGE_PARTS 13 / 15 for "off elsewhere" (Raven's call) | R |
| G3 | L2 M23 f4-64, L3 M1 f2-12 | eye set 3 | `0xff188c` window | a row's sets have no frame axis | a `setsAt` window field (§4) | R |
| G4 | Nightcloak L3 M17 / M12 / M20 | u 200 at frame 0 | vt+0x204 status 11, **only when cloaked** | fires every death; the viewer shows him uncloaked | drop the death rows' `start` (keep it for a modelled cloak) | R |
| G5 | L2 M35 ((7, 0x2a), enraged) | shell01 4 -> u 20 | `0xff7a24` phase 1, posture 3: the unit is on the ground | `airNow()` treats the clip as air: unit 786 above the floor (measured, size 1; 845.5 at Nightcloak's 1.2); base01's floor snap finds no floor -> `base01 init deleted it` (both monsters) | `AIR_HEIGHT.em079_0N.clips['2\|Motion[35]'] = { posture: 3 }`; the same for L1 M22, L1 M27, L1 M28 (posture 3, READ -- their dust passes the 900 test at 786 but the floor is drawn 786 down instead of FlyOfs x S) | R |
| G6 | L2 M43 ((7, 0x1f)) | shell01 7 -> u 20 (Nightcloak 12 -> u 30) | at L2 M43's setMotion (`0xffbc94`), mid-plunge (vy clamped -30 until `0xbf52c`) | the unit at the standard 786; the snap misses -> refused (it spawned on 2026-10-15, before AIR_HEIGHT) | his height at L2 M43's setMotion: the M41 rise / M42 descent of `0xffb904` run on the ROM (`air/emu_takeoff.py`-style) -- **NR** | NR |
| G7 | Malfestio L2 M23 | u 10 (`em079_00_010`, shell40 0) | landing | `unverified path: 0xa942c8 falls into unrecorded code` -- the runtime stops every effect of the monster until reload | record em079_00_010 u 10 (queued since 2026-10-15; still open) | R (measured) |
| G8 | L1 M14 / M16 / M20 f2 (c 29), L1 M27 f2 (c 30); Nightcloak L2 M23 (7, 0xcb / 0xda) f2 shell40 | dust / whirlwind | `0xffd0b4` / `0xff71cc` frame gates at f2 | **fragile, not absent**: `perFrame079` / `spawn079` skip the fresh step, so a play whose first effect step lands at f >= 2 loses them (the census's back-to-back plays: first step at f2-3); a play whose first step is f1 fires them (`loop2.log`) | test frame rows on the fresh step over (-1, F0] when it lands past frame 0 | I (measured) |
| G9 | Nightcloak, cloaked | u 100, u 200, the vt+0x138 filter, the dust's stealth gate | the stealth state `e+0xcafc` | the viewer has no cloak state (what cloaks him: NR, states-em079_04.md 7.4) | none until a cloak state exists; then the rows in 5a | NR (the cloak's trigger) |
| G10 | -- | c 31 (`em079_00c` UNIQUE) | nothing found | not exported | find a requester first | NR |

Not a gap: L2 M23's rate 1.5 (`0xb07b4`) is not modelled anywhere -- the clip's frames (f2 shell40, the f4-64 eye window) are
motion frames, right as they stand; only their wall time differs.

## 6. NR, by name

* L2 M43's height at its setMotion (G6). * c 31's requester (G10). * What cloaks Nightcloak (`e+0xcafc` / `e+0xcb00` writers).
* Op 0x14 as "run g1 stream N" (the issuer reading for (7, 0x10) s95 / (7, 0xd2)) -- I. * The shared status-10 / 11 scripts were
not re-scanned for L2 M16-M25 (I from the notes). * The one-frame L1 M1 / M2 at the (7, 0xca) -> (7, 0xcb) seam: not shown.

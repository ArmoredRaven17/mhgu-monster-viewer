# Effects lane B, 2026-10-25 -- the census opens of Amphibian .. ??? closed

The census (dev/effects-coverage.md) left records "open" (exported, never started) on the groups Amphibian, Snake Wyvern,
Temnoceran, Carapaceon, Neopteron, Elder Dragon and ???. This note says, per record, what closed it: an instrument miss
re-measured, a gate read and built, or a ROM reason brought to the coordinator. Addresses are in dev/rom-map.md, section
"Effects lane B (2026-10-25)". `<archive>` = dev/archive/.

## Method (portable)

1. **Re-measure first.** `<archive>/cen/census3.mjs` per monster on its open keys (`<archive>/laneB/cen.sh`), then targeted probes
   (`<archive>/laneB/probe2.mjs` through `probe.sh`; specs and outputs `<archive>/cen/pq/b*.json` / `.out`). Most opens were
   instrument misses: a split clip's `_loop` piece, a copy (`#B`), two inputs needed at once (a control value AND a part break),
   a `levels` row's later rung (a Parts sweep), the shared c 1500 (a water-class Ground with a sleep hold or a death clip).
2. **Then read the gate** of what still does not start: the request site, the field it tests, that field's writers (an
   action-start hook emulated over every (status, n) is the quickest census of writers), and the clips those actions play.
3. **Build the gate as the viewer's own input**: a class timer (render/motion-states.js CLASS_TIMERS), a copy of the clip on
   the Clip menu standing for the play with that state (CLIP_VARIANTS), or a class-thread row (render/class-threads.js).
4. **Measure draws, not starts** (the draw meter, dev/effect-runtime-engine.md E16).

Trap (instrument): `<archive>/cen/probe.mjs` set `V.state.loop` AFTER picking the clip, so a `loop: true` play stayed
play-once and stopped on its last frame -- and the class timers, which run on the motion's frames, stopped with it.
`probe2.mjs` sets the loop first.

Trap (instrument): `<archive>/cen/cenreport.py` counted a record only if the monster's BASE census saw it; a record exported
later (a newly built class request) fell out of every bucket. It now takes such a record from its later measurement.

## Amphibian (Tetsucabra em066_00, Drilltusk em066_04, Zamtrios em067_00)

All open records were census misses; nothing was built. Measured draws: c 150 (L0 M16, bit 0, on the `_loop` piece too),
u 1400 (L0 M7 copy B), Drilltusk u 412 (L4 M7 bit 21 needs the Boulder at kind 1 AND the tusks broken), u 1001 (the third
rung of the L3 M2 tusks row, a Parts sweep), Zamtrios u 370 (L4 M10 `_loop`), u 1006 (L3 M1 sweep), c 1500 on all three.
The hyper bursts u 1311..1314 stay HELD (Raven).

## Snake Wyvern (Najarala em068_00)

Census misses: u 300 (L2 M70..M74, bit 1 in the `_loop` piece), u 1400 (L0 M44 copy B), c 1500. All draw.

## Temnoceran

### Nerscylla (em070_00)

c 240 (L0 M16 split), u 33 (C+0xb5 = 4 / 0x20: L0 M19, L2 M48) and c 1500 were census misses; all draw.

**u 34 -- built.** Nerscylla's grabs (1, 0x16..0x19 / 0x22..0x25) look up a target from the target slot (P+0x230: a hunter,
or kind 2) and, when it is live and passes a state test (mask 0x100000), store its point and raise C+0xb5 bit 3 -- the
frame handler then holds u 34 on joint 1. With no target, the byte is cleared in phase 1. The viewer has no target, so the
target's presence is the clip copy: **L2 M75 / M76 / M24 / M25 copy B = "a target held"** (C+0xb5 |= 8 at the start),
copy A = none (cleared). Which action plays which clip: (1, 0x16) / (1, 0x22) L2 M75, (1, 0x18) / (1, 0x23) L2 M24 (posture
6), (1, 0x17) / (1, 0x24) L2 M76, (1, 0x19) / (1, 0x25) L2 M25. New Clip menu labels: `Motion[75] B`, `Motion[76] B`,
`Motion[24] B`, `Motion[25] B` (List 2). Measured: u 34 draws.

### Ahtal-Ka (em088_00)

- u 1017 (the claws' level-3 rung, Parts sweep) and u 10 (thread, Carrying object 0 on L2 M13) were census misses; draw.
- **u 1121 (ragePuff): ROM reason** -- his spawn setup clears e+0xb7d2, the shared puff's gate, so the puff never asks.
- **u 342 / 343 / 344 -- built.** The silk threads behind e+0xd408, the flag the status-7 web attacks set every frame. Their
  clips were read: (7, 0x2c) L2 M16, (7, 0x2f) L2 M3, (7, 0x31) / (7, 0x32) L2 M17, (7, 0x33 / 0x34 / 0x37) L2 M35,
  (7, 0x36) L2 M2. With a d420 anchor up: u 340 from the spinneret to the web point early in L2 M2 / M3 / M16 / M17, then
  u 343 (spinneret -> joint 9) + u 342 (joint 9 -> the point) on L2 M2 80..99, u 342 (spinneret -> joint 5) + u 343 (joint 5
  -> the point) on L2 M3 80..99 and L2 M16 65..82. On L2 M35, with a d450 anchor in state 1 (the orbit web): u 340 before
  frame 90, u 343 + u 342 from 90, u 344 from 180. The play's action is the shells' pick; the orbit web needs L2 M30's second
  pick (1, 0x1e), which advances on a new play of L2 M30 with a clip that has no pick between. Measured: all three draw.
- **u 400..409: build-blocked** -- they end at Ahtal-Neset's joints during the bind set piece (1, 0x21); the viewer shows
  Ahtal-Ka alone, and adding the Neset beside him would be new animation combining.
- **u 20: ROM reason** -- no request site (ids 1009 / 1010 appear nowhere as immediates; the scan finds 28 of 30 ids).

### Ahtal-Neset (em087_00)

- u 201 (L2 M63 f573) and c 60 (L2 M67 f434) were census misses; both draw.
- **u 150 -- read, not yet built**: his own thread pass (0x10a8438) runs u 150 from his joints 0x82 / 0x83 to the objects he
  lifts (the shell57 lift handles e+0xccec / e+0xccf0, while the handle's state test 0x4307c0 is 0). The rest of the pass
  (a switch on a state byte past 0x10a8610) is not read yet.
- **u 500 / 505 / 510 / 515 / 520 / 600 / 605 -- read, not yet built**: his per-frame pass requests them at seven points
  when the fight object's mask (0x10aeb68) has their bit; who sets those bits is the next read.

## Carapaceon (Daimyo em019_00, Stonefist em019_04, Shogun em020_00, Rustrazor em020_04)

- Census misses, all draw: c 320 (L0 M15, bit 0 late in a 781-frame clip; L2 M22 / L9 M36), c 1500, Daimyo u 1026 / u 1031 (the
  claws' level-2 rungs: break the claw on the Parts panel, then play L3 M2 through its cycle -- a sweep that sets one row at a time
  misses them), Rustrazor u 610 / u 611 (L4 M3 bits 18 / 19 are shell type 4: the "Glavenus Skull" shell option), Stonefist u 232
  (the tired bit 12 on L2 M18 / M54: needs Exhausted).
- **c 1104 on Stonefist, Shogun and Rustrazor -- built.** They tire exactly as Daimyo does (the same enemy flag word, a stamina
  block in their tune, and their class never switches the shared drool off), so each gets the shared tired drool (TIRED_DROOL), and
  the Exhausted switch now shows for them. Measured: draws.
- **Stonefist u 231: ROM reason** -- his enable word gives L2 M18 / M54 / M61 bits 21-23 (variant 4), never bit 15, which u 231
  is bound to (Daimyo's bit 15 draws).

## Neopteron

### Seltas Queen (em069_00)

**u 0 / u 1 / u 2 -- built** (they were "not requested"): a glow held by her LEVEL, P+0x1bb bits 1-2 -- level 1 u 0, 2 u 1,
3 u 2, 0 none. (1, 1) on L4 M66 starts level 1; it rises to 2 after 3000 frames (2400 above Low Rank) and to 3 after 900
more; (7, 0x4d) (L0 M1, before L0 M65) sets 3 at once; her attacks L4 M42 / L4 M38 / L4 M20, L3 M23, L0 M18 under (1, 0x16),
sleep (L3 M14) and death clear it. Built as CLASS_TIMERS em069_00 (queenLevel069) across clips, with **L0 M1 copy B = (7,
0x4d)** (new Clip menu label: `Motion[1]_loop B`, List 0). Measured: u 0 / u 1 / u 2 draw.

### Seltas Queen: the rest

- u 440 (L0 M16 copy B) and c 1500: census misses; draw.
- **u 300: ROM reason** -- L3 M2's bits 24-26 need a class byte (e+0xcad0) that nothing in her class ever writes (static: its one
  reference is the read; dynamic: every action through the action main, the action-start hook, the frame handler and the per-frame
  pass, and every vtable slot once, with a write watch whose control fires).

### Seltas (em076_00)

- Census misses, all draw: u 210 / u 211 (bit 0 on L2 M32 / L4 M32; the tired rows), u 290 (L2 M10, tired), c 1500.
- **c 1104 -- built**: he tires (the same evidence as the crabs: flag word 0x40043, stamina 3000, no drool switch-off) -> TIRED_DROOL;
  the Exhausted switch shows. Draws.
- **u 1000 -- built**: his part pass shows set 7 once part 0 reaches its .dtp row's level (1), and the break code asks u 1000 there;
  L3 M2 (the reaction for parts 0 and 7) is now a levels row [[3], [7]]. Draws (break part 0 on the Parts panel, play L3 M2).
- **u 272: starts, no draw -- reason**: its MASK1 selects no row of its effect file (rows carry 1, the record asks 2), so no
  generator is built; the same shape as Gravios u 241 (a ROM recording of this record would make it a ROM read).

## Elder Dragon

- **Lao-Shan Lung: all 16 opens were census misses** -- his attack clips run past census3's 900-frame cap (up to 1767 frames).
  Played whole, every one draws (u 200 / 210 / 220 / 300 / 301 / 365 / 366 / 370 / 371, c 5 / 6 / 15 / 3000..3002, u 1001).
- **Fatalis line**: c 1102 (L3 M13 copy B, the sleep hold) and u 1026 (the head's level-2 rung on L3 M9) draw (copy / Parts sweep).
  - c 1103: ROM reason (already read, dev/em013-effects-spec.md 5): no stun case, so the stun bit is never raised; P+0x5cde is
    small monsters' only; the one remaining arm is P+0x59c, a flash's blindness timer -- a hunter's item, which the viewer does not
    model (a question for Raven, as Paint was). [**READ 2026-10-25, Flashed state** (dev/flashed-state.md): the Fatalis line is
    flash-IMMUNE (dtbase +0x6c bit 2 clear), so this arm is closed too -- a ROM reason, not a Flashed record; the Flashed switch
    is built for the flashable monsters only]
  - u 202: starts, no draw -- the ROM draws nothing (its MASK1 selects no row; spec 5, read 2026-10-19).
- **Kushala Daora**: c 1104 ROM reason (his spawn setup clears the drool's gate e+0xb7d3); c 1105 ROM reason ((10, 0x6e) has no
  case: the shock trap never holds -- as Akantor). u 1 / u 10 (not requested): a second handle in his class picks id 1001..1003
  (u 1 / u 0 / u 10) by a state with a class-block byte (0xdf0520..0xdf05d8) -- read to the site, the state's meaning not yet.
- **Chameleos**: c 1104 ROM reason (never tired: flag bit 19, no stamina block); c 1105 ROM reason (no shock-trap case).
- **Valstrax**: c 1105 ROM reason (no shock-trap case).
- **Nakarkos**: c 140 -- built as L0 M1 copy B, the buried hold of (13, 0) (new Clip menu label: `Motion[1] B`, List 0; the game
  stops the pulses at the hold's 300-frame end, the copy plays the clip through). u 205 / 206 (L2 M23), u 211 / 213 (L3 M63),
  c 800 (L3 M65), u 1121 (L0 M50 B): census misses, draw. u 215: starts, no draw (live 11 frames, nothing lit at any frame; not
  read further). u 1400: ROM reason (his latch sites ask u 1121; the latch's bit is raised by other classes only -- Akantor's
  reason). u 3 (not requested) and the 20 arm records: open, handed off (the arm word 0x107f0e4 is read, not transcribed).

## ??? (Gore Magala, Chaotic Gore Magala)

- **c 1104 -- built**: both tire (flag word 0x40440241, stamina 4800, no drool switch-off) -> TIRED_DROOL. (Shagaru, the same
  class, never tires.)
- c 1120 / c 1121 (ragePuff): ROM reason already listed in the census (the shared puff asks the u list only).

## Lane B2 (2026-10-25): Elder Dragon and ??? closed further

Tools `<archive>/laneB2/` (probe2.mjs: a `rage` step that sets the Enraged toggle OR the rage ladder's top rung, whichever the page
shows, and logs the runtime's own rage; `sweep` a whole list; `dumpParts`; `no clip` logged), specs / outputs `<archive>/cen/pq/c2*`.
Addresses: rom-map "Effects lane B2 (2026-10-25)", traps 157-160.

### The probe first (trap 157)

Rathian's Enraged checkbox starts the puff (u 1121 draws, 14 starts: the control). Gore Magala's rage is the Rage LADDER: the
checkbox changes nothing there; the top rung starts the puff. Lane B's "rage puff never starts" on the Gore line was this. Chaotic's
checkbox works.

### ??? (Gore Magala, Chaotic)

- u 250 / u 280: their bit is 12, the base word's TIRED group -- census misses; with Exhausted on they **draw**. c 1104 and c 1105
  (L3 M15 copy B) **draw**. u 1120 draws.
- **u 1121: ROM reason to bring.** The pick (vt+0x2a4 0xfbec80, Rathian's routine, joint 4) asks u 1121 only when joint 4 tilts more
  than 25 degrees up from its parent's plane. Over every rotation key of joint 4 in every motion (puffpick.py) Gore's angle stays in
  -19.3 .. +90 degrees: 0 of 14125 keys (Chaotic 0 / 16882, Shagaru 0 / 1178); Rathian 4592 / 10823 (control). Every clip of every list
  played enraged agrees. Not covered: a blend between two motions.

### Elder Dragon

- c 1500 on Fatalis, Teostra, Valstrax: the failed probes re-run -- **draw**.
- **Teostra u 286 -- built.** L2 M1 is played only by (7, 0x0a) / (7, 0x15) / (7, 0x16) (allmot.py over every action), all in the word's
  0x600400 -> bits 24-26 on every play: CLIP_ACTIONS em027_00 '2|Motion[1]'. Draws. u 10: Size Type 1 with the Fire Aura on -- draws
  (census miss).
- **Alatreon u 240 -- built.** His part pass draws set 10 on the sever bit, the only set with part 13: SHELL_TAIL em050_00 { severed: 13 },
  so his word's L2 M5 (7, 0x18) bits 27-29 light with the tail Severed. Draws. u 1121 (Form rung 1, enraged): draws (census miss).
- Amatsu u 1001: the head's level-2 rung, a Parts sweep -- draws.
- **Shagaru u 1001: a viewer finding, open.** His horns go 3 -> 10 -> 11 + 10; motion-states.js userLevel never registers rung 2 (its
  own part 4 is absent, not `false`, at rung 1 -- trap 159), and the Parts row's "One Horn Broken" (4 + 106) is a state his part pass
  never shows. A question: fix userLevel (shared by every levels row) or the row. u 1121: the Gore line's pick reason.
- **Kushala:** u 210 / u 240 (clip) and u 220 (event) need rage AND the snow map: the Snow Variants list enraged -- all draw (census
  misses). **u 1 / u 0 / u 10 -- built**: his second handle e+0xcac4 holds id 1000 + L, L from the wind aura P+0x1bb (0xff -> 0; 2 ->
  2, 3 -> 3 with ctl+0x18 off; 0 / 1 as is), every frame and not behind the death test: CLASS_TIMERS em024_00 holds by the Wind Aura
  control (Level 1 u 1, 2 u 0, 3 u 10); exported `event`. All three draw.
- **Nakarkos:** see below. c 140's stop at the hold's 300-frame end: no existing row type stops a clip's bits at a frame (holdAt holds a
  class request; startFrame starts a copy late). Stopping it means re-setting L0 M1 at f300 without the bits -- a second play of the
  clip, i.e. joining. A question for the coordinator.

### Temnoceran (Ahtal-Neset)

- **u 150 -- built.** His thread pass (0x10a8438) holds u 150 in slot 0 / 1 while his B6 lift k (shell57 mode 0x18 + k, made by
  (1, 0x15) / (1, 8)) is in state 1 / 2 (0x4307c0), from joint 0x82 + (0, -350, 0) / joint 0x83 + (400, 0, 0) (turned by the joint's
  matrix) to the object k (its spot in state 1, its unit in state 2). Neset alone: no Ahtal-Ka needed. class-threads.js em087_00;
  schedule.js stepThreads takes `{ joint, offset }` starts. Draws (6 starts on L0 M9).
- u 500..605: G+0xce's only writer is his vt+0x30c 0x10a9db4, called after the damage step: a rocket point's counter
  e+0xcd36[k] -= e+0xcd44[k], and at <= 0 the point's bit. So they fire when a hunter's damage runs a point's counter out -- Neset
  alone, but the counter's source (e+0xcd44) is not read yet. Open.

### Neopteron (Seltas)

- **u 272: ROM reason to bring (now a ROM recording).** The recorder's sets add_em076_00_u272 / _near reach 0x9bb30c and never
  0x9bb330; u 260 / 261 / 262 / 263 on the same file reach both (the Gravios u 241 shape). No new recording was needed.

### Nakarkos (lane B2)

- The arm word is transcribed (armMask084, since 2026-10-19; lane B's "not transcribed" is withdrawn in rom-map) and every arm has its
  own runtime. The 20 arm records were census misses of two kinds: l / r 210 / 211 / 215 / 225 / 226 (M93) need the tentacle's form
  row set -- they **draw**; l / r 201 (M86) needs its second order (7, 0x22) -- it **draws** on the second play.
- **Open:** l / r 212 / 216 / 222 / 227 (M92) read the body's current form per side, not a viewer input. If the arm's form settles to
  the body's (row 0x107b544's transition -- the compare not read), the form row can stand for both: a read, then a small build.
- u 3: the arm-side computed sites go through the ARM's own vt+0x1d0 (table 0x16a2c54, arm pel keys), never the body's u 3; the
  body's computed sites are not scanned. Open.
- u 215: starts, no draw (live 11 frames, 0 lit), unchanged. c 140: the frame stop needs a new row type -- a question.

## Lane B2, 2026-10-26 (the coordinator's answers)

- **Accepted refusals filed** (cenreport.py): Chaotic c 1120 / c 1121 (the Gore line's puff), Gore / Chaotic / Shagaru u 1121 (the
  joint-4 tilt pick; control Rathian; blends not covered), Seltas u 272 (the recorder sets; control u 260..263, same file).
- **userLevel fixed** (motion-states.js): a rung's own part is one its sets draw and the rung below's do not -- set false there or not
  named. Audit (`<archive>/laneB2/levelaudit.mjs`, 638 ladders): only Shagaru's horn row changes, rung 2 becoming reachable.
  His horns as the part pass shows them: set 3 -> set 10 (part 3 on, 106 off) -> sets 11 + 10 (adds 4 on, 107 off). The Parts row's
  "One Horn Broken" (4 + 106) is a state the pass never shows, and rung 1 (3 + 107) has no option -- for Raven.
- **Nakarkos M92 -- built.** The arm's vt+0x24 compares its form +0xcb30 with the body's copy for its side and stores the copy on a
  mismatch (0x107b8d0, after any timed wait of its action): settled they are equal, so the tentacle form row now gives M92 too.
- **Nakarkos c 140 -- built** with a general CLIP_ACTIONS field, `bitsUntil: { frame, bits }`: from that frame the walker drops those
  bits from the play's word, as the game's re-set of the same motion without them does. The clip plays on unchanged (no replay).
- **Nakarkos u 3: still open.** The vt+0x1d0 band scan finds 8 sites, none for u 3 -- but it also finds none for the body's 1002 /
  1006 / 1010..1026, which are requested, so those come from outside the band and the scan cannot clear u 3.
- **Ahtal-Neset u 500..605: read, not built.** vt+0x310 (0x10aa03c: parts 8..14, the hit's damage x P+0x388 through 0x99c78) writes
  e+0xcd44[k]; vt+0x30c takes it off the point's counter and, at <= 0, raises the point's bit -> the u 500.. request at that point. A
  build needs a hit input on parts 8..14 (no existing control fits; a label for Raven) plus the counter's start and the arming bits.

### Lane B2, 2026-10-26 (second round) -- reads; handed off where context ran out

- **Ahtal-Neset u 500..605 -- the reads finished, nothing built** (the click-to-hit input is with Raven). Hunter hits on his body-data
  parts 8..14 reach vt+0x310 through the shared 0x9d63c (from the enemy-pass hit handlers); vt+0x310 stores the scaled damage in
  e+0xcd44[k]; vt+0x30c takes it off the point's counter while e+0xcdba and the point's arming bit are set. Counters: at spawn points
  0 / 1 = 200, point 5 = 1000, armed 0x23; at vt+0x204's G+0x32 == 4 arm points 0..4 = 800 / 800 / 1000 / 1000 / 1200, point 6 = 2000,
  armed 0x5f. Disarmed per point when it fires, all at 0x10a7bac. e+0xcdba: 1 from (1, 8)'s main at a frame and from vt+0x204 case
  0x10a6ed0 (action not resolved); 0 at spawn and in (10, 0x8e). Rom-map row "Ahtal-Neset u 500..605 -- the reads finished".
- **Nakarkos u 3 -- still open.** The shared vt+0x1d0 callers pass no id >= 1000; his band and rodata hold no 1010..1039. Where his
  u 1 / u 3 ids come from is not found (rom-map "Nakarkos u 3 -- the shared callers").
- **Nakarkos u 215 -- not started this round** (the draw-level read).

## Lane B3 (2026-10-25): Nakarkos u 215 / u 3, Ahtal-Neset's rocket points

Tools `<archive>/laneB3/` (gen215.mjs, ptrscan.py, vt1d0all.py, immsites.py, armlist.py, probe3.mjs + probe.sh / run.sh on the lane's
own server, port 5733); specs / outputs `<archive>/laneB3/pq/b3*`, `*.out`. Addresses: rom-map "Effects lane B3", traps 166-167.

- **Nakarkos u 215: ROM reason, read to the draw.** Its one row (em084_00_122 row 10) is a Model generator whose life block is
  0 / 0 / 0: each of its 2 particles is freed in the life pass of its spawn frame, before the draw. The ROM's own recording (the
  recorder's add_em084_00_u215 / _near) takes the same branches and never reaches the Model draw; u 213 on the same file is the
  control and draws. Not the viewer.
- **Nakarkos u 3: built.** The positive control resolves the premise. Ids 1010..1026 come from nowhere: the body's u table is
  7 words (1000..1006), and the old rom-map row read past its end (now in the Withdrawn table). u 1 and u 3 are SHELL effects:
  - u 1 is ef 0 of shell00 modes 0..4;
  - u 3 is ef 0 of shell01 modes 0 / 1 / 10 (the rocks' stage landings);
  - both start through the shell's own effect list, never vt+0x1d0.
  shell01 0 / 1 were already built, but u 3 was not exported. It now is (docs/effects/em084_00.json, `when: 'shell'`). On body
  L0 M63 looped, stance revealed, u 3 has **7 starts and draws** (pq/b3u3c).
- **Ahtal-Neset u 500..605: the firing condition, read whole** (dev/em087_00-effects-spec.md 5). vt+0x204's `0x10a6ed0` is not
  an action case: it opens the gate at EVERY action start (e+0x73e4 == 0, the host). The gate is closed:
  - from spawn;
  - in (1, 2) / (1, 0xf) / (1, 0x10);
  - in (1, 8) until L0 M9 f300;
  - at the collapse's end.
  The armed points are 0 / 1 / 5 from spawn, and 0..4 / 6 from (1, 8) (the second phase); counters 200 / 200 / 1000, then
  800 / 800 / 1000 / 1000 / 1200 / 2000. A point fires when hits on its part run its counter out. Every firing point requests its
  u effect (lane B2's "skipped for e+0xcdb7" is withdrawn), and its destruction requests a flinch: (1, 6) / (1, 7) are L3 M1, and
  (1, 5) is L3 M3 -> M4 for 1440 frames -> M5. The part pass shows each point's pod set while it can be destroyed. Nothing is
  built: Raven's choice of control is pending.

### Lane B3, 2026-10-27: Raven's answers built

- **Ahtal-Neset's rocket points: toggles** (Raven: "Toggle until I can see what they are").
  - Seven class toggles, "Point 0 destroyed" .. "Point 6 destroyed" (working labels). Each fires its u 500..605 once at the
    point, and sets his Parts row for the point's group to the destroyed set. The sets are read from his .mpm: points 0..4 go to
    the "Webbed Pile" rows (Broken), point 5 to "Cocoon Side" (Cracked) and point 6 to "Cocoon Center" (Cracked).
  - The flinch is held.
  - Measured: each point 1 start, draws. Shots are in dev/shots/laneB3_point087/. The census takes all seven as draws.
- **Notice marks: the combat stand-in fixed in general.** The ROM's P+0x2c0 goes to 1 on hit reactions, forced transitions and
  class code, never on rage, and falls back by its own timeout. The viewer now takes the rising edge of the rage it shows as that
  event, instead of holding the byte at 1.
  - Furious Rajang (rage held from the mount, a look): c 1200 / c 1201 fire and draw, and the census takes them.
  - Rajang / Rathian / Tigrex: unchanged when calm. Enraged while seen, no mark; after the unseen timeout, a "!" again.
- **Tired (with Rage) moved to the Debug panel** (Raven: "Make Tired (with Rage) a Debug option for now, until I know what it
  entails"). Behaviour unchanged, and it goes off while the panel is hidden. Checked on all six Rath-line monsters.
- **Hyper eyes: partial, handed off** (rom-map "GU Hyper -- the eyes").
  - Every head aura is a per-monster `_500.efl`. All of its rows are built and it draws.
  - No eye glow is seen in the close-ups. (Superseded the same day, hyper-eye lane: the glow rows were drawn black -- the halo's
    depth write on the unsorted emit hid the core; built, dev/hyper-states.md 5.)
  - The e+0xb720 census is saved, with what is still unread.
- **"the Rockets" on Neset**: not acted on. It may mean the Rockets class control rather than the point toggles (see the report).

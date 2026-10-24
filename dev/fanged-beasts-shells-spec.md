# Fanged Beasts -- the shells (shells agent for the Viewer agent, 2026-10-17)

The walk in em-id order behind the effects agent: em021_00 Congalala, em022_00 Blangonga, em023_00 / em023_05 Rajang /
Furious Rajang, em030_00 Bulldrome (no shell class: none), em060_00 / em060_04 Arzuros / Redhelm, em062_00 Lagombi (uEm060_00's
class), em061_00 / em061_04 Duramboros / Rustrum, em065_00, em083_00 / em083_04. Addresses are READ unless marked; every row of
`docs/render/shells.js` named here is checked bit for bit against the ROM by its `dev/shells-*-check.mjs` (the harness
`<archive>/fb/emu_fb.py`: the whole executable on unicorn after its static initialisers, the class's own spawner run at the
row's frame, each shell flown from the setup the ROM built, children from theirs). The index of addresses is dev/rom-map.md
"Fanged Beasts -- the shells".

Tooling (<archive> `fb/`): `fbt.py` (a class band's create sites and callers, a range shown with its pc-literals, vtable slots),
`trgen.py` (one action phase under unicorn, the band native; FB_CLASS / FB_MON / FB_EM / FB_WATCH), `cengen.py` (the census: every
(status, n)'s motions and shell creates), `shl.py` (an arc's .shl modes with the cmn FUP: shellef.load_typed), `hit.py` (the
_hitdata records), `gen.py` (mode literals), `vtof.py` (a shell's vtable by constructing it), `rng.py` (a disassembly range).

## 1. Congalala (em021_00)

Shells 0xa1 / 0xa2 / 0xa3 (uShellEm021_00_00 base00, _01 base01, _04 base04). The dung throws (L2 M12 f64: (7, 0xa) 0, (7, 0xb) 1,
(7, 0x49) 3 -- the lob written into the setup's words by the reader), the gas clouds (L0 M20 f70, L2 M5 f110: 10; L5 M14 f152: 14;
the pit: L3 M14's end, enraged, once a pit: 11), the splat (L5 M12 f161 shell01 1), the breaths (L2 M7 f100 shell04 0; L2 M16 f138
the gas breath: the remap vt+0x1fc 0xdcee10 by the gas he carries and his charges -> 1 / 3 / 2 / 4, the last charges 5 / 7 / 6 / 8).
The dung's floor contact leaves shell01 2 (u 210); `0xac030` after it is not read. Check: dev/shells-congalala-check.mjs (17 cases,
5 controls). Viewer input: index.html shellExtra `gas021` -- the eating play's own gas, else the play's CLIP_ACTIONS `gas`; the
soak (which drives the schedule without playNow) has none and the L2 M16 breath is refused by name there. Stand-ins: the charge
count (2+ unless input.gas021Last). Records u 0, 100, 130..160, 200..220, 300..330.
CLOSED 2026-10-18 (was OPEN: u 200, and u 0 started directly, refused live at "call to 0xa60744, which is not translated (from
0xa5fee0)"). The test, READ: the particle update 0xa5fdf0 runs only with gen+0x10 bit 2 set and a live particle (gen+0xb0 != 0), and
switches on the generator's TYPE, gen+0x40 bits 20..23 -- the efl row's column word [row+0xc] & 0xf, written by generatorInit
0xa55fe0. Type 6 -> 0xa60744, which calls 0xa63efc once per live particle (0xa607e8). em021_00_004 row 10 (u 200's UNIQUE record)
carries type-6 generators, so any play of the record takes it: it was never a distance or camera branch. No set reached it because
vecdrawsched.py records only the routines on lift-effects.sh's lift lines, and the sets so far recorded the CLIP (SEQUENCE u 200),
not the shell's UNIQUE record. Fixed by putting 0xa60744 and 0xa63efc's static callee closure on the lifted-added line, recording
the UNIQUE records standalone (<archive> fb/rec_shellrec.py: add_em021_00_shellrec_u200 / _u0, plain and _near) and lifting from a
copy: soak em021_00 56 motions, 0 refused; page check 18 / 18 (the L2 M16 gas breath, which had failed behind the L2 M12 refusal,
passes). The closure's 0xa7719c / 0xa74884 / 0xa75290 / 0xa75434 / 0xa74d18 / 0xa70678 / 0xaf8b40 / 0xaf873c / 0xaf85b8 / 0xa66224
have no recorded blocks (these records do not reach them).

## 2. Blangonga (em022_00)

0xa4 sp_00 base00 (the burst's pieces), 0xa5 sp_01 base01 (L2 M8), 0xa6 sp_13 base13 (the lob). The throw 0xddd6dc(e, kind, sub)
at L2 M12 frame 100: (7, 5 / 8 / 9) 0 / 1 / 2, (7, 0xd / 0xe / 0xf) 3 / 4 / 5, (7, 0x1c / 0x1d) 8 / 9, (7, 0x1e / 0x1f) 12 / 13.
The lob is base13 on the owner's point (joint -1), flags 0x16 (0x10: the aim is the owner's facing; 4: the thrown point is vec 1 from
the shell along it at the target's height), the arc's height +0x15f0 (the launch's peak) and the pitch-ratio second pair of points
(base13 init 0x404a64..0x404c48). Its floor contact (0xde1420) bursts into three shell00 at 120 degrees (0xde14ac: sets 0..2 or 3..5
by +0x167c), each base00 on the request's point and words (flags 0x30). (7, 0x18) L2 M14's lob is mode 14 -- past the file's 14
modes; the getter reads `[[list+0x10] + 4 mode]` unbounded (0x4a2344): refused by name. sp_01 (L2 M8 frame 98, which is the motion's
loop: Motion[8]_loop frame 2) is made once an action (+0x1a3) and ends when the owner's motion is no longer the one its init kept
(+0x150 0xde1138). Check: dev/shells-blangonga-check.mjs (13 cases, 6 controls). Records u 0, 10, 30..33, 40..43.

## 3. Rajang / Furious Rajang (em023_00 / em023_05)

One class; the ids by the variant byte (0xa7..0xaa / 0xab..0xae). The beam (sp_02) is render/beam-spawns.js's (dev/beams/em023_00.md).

* sp_00 the ball: L2 M8's (7, 5 / 0xc / 0x3b) at the frame-84 window (0xde82f8: r5 != 3), mode 0, aimed by base00's X aim (flag 1)
  from his point; the leap (7, 7) / (1, 0xc) phase 3 = L2 M12 frame 22, mode 1. Its reader is Rathian's fields at other indices, so
  init001 runs it (READER001). The floor contact leaves sp_01 0. L2 M8's picks are the beams' (7, 6) / (7, 0xa) then the ball's
  (pickVariantsFor merges a beam clip's shell picks) -- the PSL word reads the play's number, so three plays in five now light no
  bits 15-17 (the ROM's own table 0xded140 has none of 5 / 0xc / 0x3b).
* sp_01: no EffectParam (no EffectList) -- a hit volume; built (L2 M5 / M22 / M23 f26 at joint 12 on the ground; the ball's child)
  so the shell count is the ROM's, nothing drawn.
* sp_22 the rock, base22 (READ whole, 2026-10-17): made at (1, 0x39)'s start (vt+0x204 0xde220c) with the mode the dig set (ctl+0x15:
  (1, 0x36 / 0x37 / 0x38 / 0x3f) -> 0 / 1 / 2 / 3, all L2 M29; the viewer's L2 M29 picks the dig and makes the rock at frame 200).
  Held on joint 12 (the 4 x 4 with the w divide; its words the joint's Euler) while 0xde3734 says so (L2 M29..M32, L4 M5 / M6; L2 M28
  until 56, L4 M7 until 14), thrown after (the owner's point + vec 1 x size turned Z X Y; X aimed at the target within [lo, hi],
  backed off by +0x1604 x min(d / 2000, 1); the velocity by that X and the facing less +0x1608 x (1 + ratio)), dropped on any other
  motion (the drop's vectors by the facing). Its flight bounces once on the floor (the bounce factors) and bursts at the second floor
  contact or a wall. Check: dev/shells-rajang-check.mjs -- the rock cases replay the module's own [motion, window] trace into the ROM
  run (`track`), so both read the same carry answer each move.

Check: dev/shells-rajang-check.mjs (14 cases, 10 controls). Records u 230..232, 260..267 (both arcs).

## 4. Redhelm Arzuros (em060_04), Lagombi (em062_00) -- uEm060_00

**[MISLABELLED -- WITHDRAWN 2026-10-18: em062_00 is VOLVIDON (docs/monsters.json; rom-map uEm060_00 row: no uEm062_00 class exists);
Lagombi is em061_00 (dev/em061-shells-spec.md). Read "Lagombi" in this section as Volvidon; the check dev/shells-redhelm-lagombi-check.mjs
keeps its name. Re-run with cengen11 2026-10-18 (uEm060_00, FB_EM 62): nothing new -- amphibian spec 3.]**

Arzuros (em060_00) ships no shell file. One class names Redhelm's 0x103 / 0x104 and Lagombi's 0x10d / 0x10e / 0x10f as literals; the
census is the same for all three (the command tables decide which runs).

* Redhelm: (7, 0xf5) L9 M9 f122 sp_00 0 -- base00 on his point (joint -1, which init001 now takes as init00 does: the owner's point,
  the offset turned by the Y word), aimed X and Y (flags 1 | 2), ShellScale 1.8, u 30. The slam (7, 0xff) L9 M1 / (7, 0xfe) L9 M10 ->
  L9 M1 from 68, at the window 116 (tune float 0x47): 0xf189d8 -- sp_01 1 (4 when 0x49930 > 8: the quest level) at his point + the
  tune offset (0x58 / 0x59, or 0x5a / 0x5b) turned by his facing, on the ground 0x49a90 finds from 200 above it (the stage
  stand-in's floor; no attribute: the stage-specific 2 / 5 and 3 / 6 are not reached). L9 M14 (sp_01 8) and L9 M4's landing (sp_01 0)
  draw nothing (ef (999, -1)): not listed.
* Lagombi: (7, 0x56 / 0x57 / 0x65) L2 M28 f68 sp_00 0 / 1 / 2, (7, 0x6c) L2 M37 sp_00 3 (joint 5): base00 with no flag (the owner's
  words; joint -1 his point + (0, 330, 330) turned), flight 0 -- its life is hit slot 0 (9999 frames: input.hitLife); the floor contact
  leaves sp_01 2 (no EffectParam). sp_43 (base43: L2 M29 / M36, L3 M32) has no EffectList and base43 makes nothing: not built.

Check: dev/shells-redhelm-lagombi-check.mjs (11 cases, 6 controls). Records em060_04u 0..50, em062_00u 0..2.

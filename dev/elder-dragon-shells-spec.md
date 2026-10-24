# Elder Dragons -- shells spec (shells walk, 2026-10-18)

The Elder Dragons in the in-app order. Each section: what the class makes, from which code, the files, what the viewer does
(docs/render/shells.js), and the check that holds it to the ROM. Addresses are main.text / main.data of the Switch build.
Scratch: `<archive>/fb/` (emu_fb.py the harness, rungen11.py / cengen11.py the census, motqx.py the clips).

## 1. Kirin (em011_00) -- uEm011_00

- **Ids**: sp_01 0x7e (base01, the bolt), sp_11 0x7f (base11, the strike timer). Immediates in vt+0x158 0xd6d010 and the makers.
- **Census** (cengen11, all 16 statuses, the .dtp filled): the lightning actions fire sp_11 at their phase 1 frame; (1, 0xa / 0xb)
  at phase 0 (the play's start, L0 M3, modes 12 / 13). The sp_11 setups' point and words are GOT zero vectors (0xd70c00..0xd70c3c);
  (7, 0x1b)'s sp_01 4 (L4 M9 f115) the block point and words.
- **sp_01 reader 0xd74704** (READ whole): ef 0; hit 0; +0x15ec 4 int 0, 8 int 1, 1 int 2; floats 0 / 1 the snap's reach +0x15f4 /
  +0x15f8; vec 0 -> +0x1608. +0x150 0xd74808 is the hit side's.
- **base01's joint -1 arm** (flag 1, 0x3fa8e4): a zero vec gives the block point and clears flag 2; a non-zero vec is refused by name.
- **sp_11 reader 0xd74a00** (READ whole): the count +0x1658 = int 0, the times +0x1654[k] = float k; +0x165c = int 2 (0: base11's init
  divides the times by the owner's motion speed 0xb0900, 0x403018..0x403064); byte +0x168c = int 1 != -1; +0x1670.. the block point,
  +0x1680.. its words.
- **sp_11 +0x168 0xd74bf4** (READ whole): the strike point = +0x1670 + vec k turned by the kept Y word; mode mask 0x030f0000 re-anchors
  the base to the current block point; 0x3000 the target; 0xc0000000 the target + 20, snapped down by the floor query (mask 0x10).
  The bolt's mode: in 0x030f0000 (<= 0x19) +0x168c ? 2 : 3, else ? 0 : 1.
- **Viewer**: SHELL_DATA.em011_00 (shell01 5 modes, shell11 34 modes), 33 rows. Effects exported: em011_00u 30 / 31 / 90.
- **Check**: dev/shells-kirin-check.mjs -- ROM 15/15; page 8/8 (the bolt starts; u 30 / 31 / 90 run out; L4 M7's copies, below).
  The page check's earlier "Failed to fetch" was the headless server under the census load: it passes with the machine idle.

### 1a. The Clip menu's copy decides the play (2026-10-18)

L4 M7 has three CLIP_VARIANTS copies: A the roar (1, 6), B (1, 7), C the lightning (7, 5) / (7, 7) / ... The shell picks
(pickVariantsFor) used to rotate over the lightning actions on every play, whatever the copy. index.html rockInput now
filters the picks by psl-mask.js clipCopyActions (the copy's own entries' actions; a pick naming no action -- a rock variant,
`beam:n` -- is kept), so copy A or B offers none and spawns nothing; the action line compares actionOf's name the same way.
Page check: copy A and B no top-level shell in 400 frames, copy C strikes (the positive control). The other clips where picks and
copies share a clip: Soulseer em082_04 L0 M4 (copy C keeps (2, 0x36), A / B none) and L0 M15 (A keeps (1, 0x16), B none); Lavasioth
em036_00 L2 M10 (A keeps (7, 3), B keeps (7, 0x11)); Kirin L2 M4 (B (7, 2) keeps none).

## 2. Lao-Shan Lung (em012_00) -- uEm012_00

- **No shell in an action body.** cengen11 over all statuses finds no create (0 lines): every shell is a record of the per-frame
  handler **vt+0x2a8 0xd759f4** (READ whole), which walks two record lists from **e+0xcae0**.
- **e+0xcae0**: the action start vt+0x204 0xd76bec (guarded by e+0x73e4 == 0) zeroes the counters e+0xcae4..+0xcaf0 and e+0xcae0,
  then, when the pending byte **e+0xcadc** != 0xff and < the count e+0xcad4 (0x3a), sets e+0xcae0 = [e+0xcad8] + 8 x idx (the table
  **0x17a50f4**, 58 x {list A, list B}, set at 0xd78684) and puts the byte back to 0xff (0xd76d3c..0xd76da4).
- **e+0xcadc writers** (store census on the band): the ctor 0xd751b4 (0xff), 0xd755dc (8, quest map 0x1a and area 1, with action
  (2, 0xe)), vt+0x204's reset, **vt+0x218 0xd77a8c sel 0** (= EMC op 0xa3 (0, idx), shared interpreter 0x8551c), and vt+0x2b0 0xd77d80
  (the save-state restore of vt+0x2ac 0xd77d1c). In em012_00_cmdtbl.emc (fb/emcdump.py / emcidx.py) op 0xa3 always sits right before
  a do-action: (7, 0) 25 / 26 and 47 / 48 (op 02 50:50 pairs), (7, 2) 27 / 28, (7, 3) 29..36 by the stream's section, (7, 4) 37 / 38,
  (7, 5) 43..46, (1, 4) 50..55, (1, 1) 56 / 57; also (2, 1) / (2, 9) 8, (2, 0) 9, (2, 2) 10, (2, 5) 13, (2, 8) 16, (1, 2) 19,
  (2, 0xb) 20, (2, 0xc) 21, (7, 6) 23, (1, 3) 7, (7, 1) 2 -- entries with no shell record. **Entries 1, 3, 22 (sp_01 only) and 39..42
  (L2 M5 rubble) are named by no op 0xa3 and no class store: not listed.**
- **The records** (0x24 bytes): +0 the action (1 hit 0x7db70, 2 the motion rate 0xb07b4, 3 a flag (e+0xcac0 = 1, 0xc44c70 x 2),
  4 a sound 0x3ae2c8 when e+0x7420, 5 sp_01, 6 sp_13), +4 the motion, +8 the test (table 0xd75bac, 12 arms: 1 = the motion (0xb0950)
  and 0xb0968(e, 0, 0, +0xc, 0) the frame crossed; 2 / 3 / 4 the same with modes 9 / 2 / 1; 5..8 the A counter e+0xcae4 against
  +0xc / +0x10 with the motion; 9..12 the B counter e+0xcaec without it), +0xc / +0x10 the frames, +0x14.. floats. Every shell record
  is test 1. The flag action is skipped for tests 1, 5, 9 (mask 0x223).
- **sp_01** (0xd75ea4, setup 0x40): mode u32(+0x14); +0x10 = tune vec [+0x18] (0x6f640); +0x34 = u16(s32(0.5 + tune float [+0x1c] x
  182.04445)) ([0xd75e74]); +0x30 / +0x38 0, +0x3c 0xffff. Reader **0xd7cd50** (READ whole): ef 0 -> +0x15c8, hit 0 -> +0x15d8,
  +0x15ec 0x80 int 0 != -1, 4 int 1 != -1, floats 0 / 1 -> +0x15f4 / +0x15f8. The event modes 20 / 30 / 31: ints -1, ef (999), hit
  2 / 3 / 4 = (0, 10): hit volumes, nothing drawn. (Modes 0 / 10 carry bit 0x80, refused by name; their makers vt+0x1b0 0xd781f4 /
  vt+0x1b4 0xd782dc have no caller read.)
- **sp_13** (0xd75f88, setup 0x70, cSetupParamEm012_13): mode 0; +0x40 = tune vec [+0x14] (start), +0x50 = tune vec [+0x18] (end),
  +0x60 = tune float [+0x1c] (the delay: floats 9..16 = 20, 50, 80, 110, 140, 160, 190, 230).
  - reader **0xd7d2bc** (READ whole): ef 0..3 -> +0x15c8..+0x15d4; hit 0; int 0 -> +0x15e8 (the ground marker 0x40512c -> 0x43b2b0
    in state 2, not drawn); floats 0 speed +0x15ec, 1 per unit +0x160c, 2 gravity +0x15f4, 3 life +0x15f8.
  - init **0xd7cf9c** (READ whole; base13's 0x4044d8 is not called): +0x1680 / +0x1690 / +0x16a0 from the setup; owner test; reader;
    words 0; life +0x1638 = +0x15f8; +0x40 / +0x1000 = start; vt+0x16c 0x405a88 = the Y word toward vt+0x168 = **0xd7d4bc** (the end);
    the launch 0x404dc8 toward the end (+0x15f0 the ctor's 0); the velocity turned by that word ([0xd7d2b8] 2pi / 65536; [0xd7d2b4]
    = 0.0 is the sine of the other two turns: identity); +0x1020 the fall; ef 0 at +0x40 -> +0x1674; 0x43ab74(+0x1618 = 1.0).
    **Delay > 0: state 1, handle byte +0x1c1 = 0**; else state 2, 0x404fa0 and vt+0x160 (the hit side).
  - +0x15c **0xd7d3c0** (READ whole): the delay counts down by dt (kept >= 0), returns while > 0; then state 2, handle +0x1c1 = 1,
    0x404fa0, vt+0x160. The flight starts on the next move (base13's 0x405164).
  - landing +0x150 **0xd7d450** (READ whole), state 2 only: type 0 -> ef +0x15cc, 1 -> +0x15d0, 2 -> +0x15d4 at the contact
    (0x4042bc), then vt+0x148(0).
  - The handle byte +0x1c1, READ to the draw: the core's vt+0x28 **0x43370** (vtable 0x172a578) sets +0x18c = +0x1c1 when
    +0x18c (its area test, 0x432dc..0x43338) is set; each of its units (uMHProofEffect, [unit+0x210] = the core) runs vt+0x28
    **0x43da0** -> **0x327188**, which rebuilds its +0xc bits 10..15 as (bits & 0x3d) | (core+0x18c ? 2 : 0) -- bit 11; sUnit's draw
    arms submit a unit's vt+0x30 (0x9b75e8) only when (+0xc & 0x4807) == 0x4802 (0xc03e2c / 0xc03fa8; host.js already gates on it).
    So the waiting rubble's flight effect runs (moves, emits) but is not drawn. Page check: the moved units' bit 11 is clear while
    the shell waits and set once it falls.
- **The points are absolute** (em012_00_actiontune.fup, 165 vecs): the fortress's own coordinates, e.g. start (-7800, 3500, -12750)
  -> end (-6900, 1000, -12200). The viewer draws them where they are: 100+ m from the viewer's origin, where Lao stands.
- **The viewer's anchor (Raven, 2026-10-18: keep the ROM's layout and timing, shift so the rubble falls around him).** There is no
  single fortress origin to use: the entries' landing points sit in seven clusters along his walk -- (6500, 7400), (2500, 7000),
  (-500, 4600), (-2500, 400), (-3400, -3600), (-4000, -7000), (-5200, -12700), and (-500, -4800) -- one per section of the command
  stream. The section is the EMC variable e+0x7305 (op 5a a b sets e[0x7305 + a] = b, op 5b switches on it), stepped on inside each
  section's body: an in-stream state machine, so the sections run in order 0, 1, 2 .. (the viewer could play them as the stream
  orders them). Inside, op `01 s 05 08 n` is NOT a test (corrected 2026-10-18, rom-map Withdrawn): it SETS target slot s to (kind 5,
  type 8, param n) through 0xc6d58 -- his walk goal, n = 1..0x12 in order. Where goal n is: type 8's point is resolved outside
  0xc6d58 (0xc4aec resolves other kind-5 types at once) -- NOT FOUND; it is the stage's navigation, which the viewer does not have.
  So his position per section is the walk toward goal n, not a number the viewer holds. The actiontune's own placements (vec 10 (0, 0, -2000) / vec
  12 (200, 0, -2000), written to P+0x40 at 0xd76ef0 / 0xd79cd0) are one point, and vecs 1..4 are the hunters' region boxes
  (0xd775e0: min + size), not an origin. So each entry is anchored on its own: the centre (x, z) of its sp_13 ends onto his unit's
  (x, z), every point shifted by the same amount, heights the ROM's -- a named stand-in (render/shells.js centre012 / spawn012,
  input.anchor012 from index.html shellExtra). The ROM check runs the fortress coordinates unshifted; shells-lao-check.mjs checks the
  shift (36/36).
- **Viewer**: SHELL_DATA.em012_00, code 'em012' (spawn012), 28 rows (one per named entry; the pick names carry the entry, '7:0x00 #25';
  psl-mask.js actionOf reads the action through the ' #n'). make012s13 / delay012s13 / LANDING13.uShellEm012_sp_13; stepOrb runs
  the delay in state 1; render/rom/effect/schedule.js writes the handle's +0x1c1 as the shell sets it (sh.shown1c1).
  Effects exported: em012_00u 10 (the fall) / 20 (the landings).
- **Check**: dev/shells-lao-check.mjs -- ROM 34/34 (all 28 entries: 0xd759f4 with e+0xcae0 poked, the motion at e+0x4b4, its test
  answered; every shell flown from the 0x70-byte setup; controls: the pair's other entry x 2, the floor 3 higher); page 7/7 (rubble on
  L2 M3 / L0 M36, the waiting handle byte 0 and the falling one 1, u 10 / 20 run out).
- **Not shells, for the motion lane**: the lists also carry 2 motion-rate records (action 2, 0xb07b4) and the hit / flag / sound
  records -- none drawn.

## 3. The Fatalis line (em013_00 / em013_01 / em013_02) -- uEm013_00, the variant byte e+0xb5f5

- **Which actions each variant plays.** The three arcs carry one command table. fb/emcvar.py walks it with op 0x92 (the variant
  switch, `92 00 / 92 01 v / 92 02 / 92 ff`) evaluated for the variant and every other block walked; fb/chain013.py closes that set
  over the set-action calls (0x75230 / 0x768c8 / 0x76098) of every phase. **Control: every reached action makes only its own
  variant's shell ids** (0x82..0x85 / 0x86..0x89 / 0x8a..0x8e) -- 0 exceptions over the three. The census's other actions (Crimson's
  meteors under variant 0, ...) are the other variants'.
- **The makers' arguments** by hook over every phase / scenario (fb/gen013.py, fb/met013.py), the code read for each:
  - 0xd82024(e, sel, dX, dY): sp_00, mode (variants 0 / 1) sel == 1 ? 1 : 0, (variant 2) 2 -> 1, 1 -> 2, else 0; +0x20.. = the block
    words + (dX, dY, 0); +0x10 the GOT zero vector.
  - 0xd81e80(e, L, &v, raise) at phase 0 -> [e+0xcac0]+0 (the fire's dX where it reads it); (7, 0x45)'s goes straight into its fire,
    its vec (-40, 260, 1070) -- (-30, 330, 870) when the previous action e+0x73e2 was (7, 0x4e) (0x700ec): the viewer keeps no
    previous action, so the first.
  - 0xd84b60 phase 0 ((7, 0x25 / 0x44), L2 M24): the target's bearing from (0, 450) x 0xbe518 by the Y word, less the facing, clamped
    to +-0x1555 past 29.998 deg -> [e+0xcac0]+4 = the fire's dY (yaw013); the same blends L2 M33 / M34 into the body.
    0xd86a5c ((7, 0x46), Old, L4 M7 f225): the aim (0x2000, (-30, 330, 870), 0) and the yaw (clamp +-0x2000 past 45 deg), at the spawn.
  - 0xd7ffcc(e, kind, &v, scale): sp_01 (kind 5 / 1 / other -> 6 / 5 / 7, 8 / 7 / 9, 0xb / 0xa / 0xc by variant) at the block point +
    v x scale x 0xbec34 by the Y word, the block words; then 0x43ab74(shell, scale).
  - 0xd85fbc(e, side, aimed) f166 (Fatalis / Crimson): sp_51 at the block point + (side ? (560, 0, 200) : (-500, 0, 320)) x 0xbe518 by
    the Y word, words (aimed ? 0xd81e80(0x2000, (x, 0, z), 150) : 0, Y + (side ? 0xe38e : 0x5b0), 0).
  - 0xd86d70(e, side, kind) f166 (Old, (7, 0x53..0x56)): sp_51 mode (side ? 0 : 1) at the block point + (0, 0, max(|target - P| - 350,
    1000)) by the Y word, words (0, Y, 0).
  - 0xd80e74(e, idx) (the meteors): vec = 0x2125018[idx] (36 x 12 B, filled by init_array 1820 at 0xd8b4b0: y 7500; read out of the
    initialised image, fb/ia013.py) by the Y word + (idx < 11 ? the target : block +0x30, the block point phase 0 -- or (7, 0x24)'s
    phase-1 end -- copied there); variant 2 -> sp_01 0x8b mode 5 at (x, y - vec.y, z) (Old's lightning), else sp_00 0x86 mode 5.
    The lists [0x17a60c4][k - 1] by the counter P+0x1a2, one per frame test: L2 M2 f80 / 140 / 200 / 260 / 320, L2 M21 f180..540
    and L2 M28 f60..420 by 60.
  - (7, 0x3b / 0x3c) 0xd81928(e, side, 1) f80 (Crimson): sp_01 0x87 mode 5 at the block point + (side ? 50 : -50, 0, 450) x 0xbe518.
- **The shells.**
  - sp_00 readers 0xd8b6f8 (= 0xd8cf8c, Old) and 0xd8c254 (Crimson: 0x10 int 1, 0x20 int 2, 0x200 int 3; ef 2 -> +0x1660); Crimson's
    init 0xd8c3bc (mode 5: the ground mark, ef 2 at the ray's hit straight down from the meteor; its +0x154 0xd8c6f8 stops it at the
    end); landings 0xd8b7f8 / 0xd8c52c / 0xd8d08c (the children by mode and type; Old's mode 1 type 1 makes sp_11 0x8d, type 2 RETURNS
    without the end).
  - sp_01 readers 0xd8baa4 (= 0xd8c7f4) and 0xd8d41c (Old: ef 1 -> +0x15d0 and 0x20 int 3 -- base01's switch); base01's 0x800 arm
    (the unit's size) is init011's.
  - sp_11 (Old) reader 0xd8da5c, +0x168 0xd8db9c: three sp_01 (2 / 3 / 4) along its facing, 0 / 800 / 1600, at times 0 / 10 / 20.
  - **BASE51** (new): ctor 0x428af4, init 0x428bc4 (base01's init -- ef 0 started at the setup point -- then the reach (0, 0, 3400),
    or Old's +-3400 x halved, turned by the Z, X, Y words: A -> B), +0x150 0x428f48 (wait +0x1664, then +0x40 = lerp(A, B) over +0x1668,
    the anchor +0x166c behind; past len + lag -> the end), +0x164 0x4290e4 (ef +0x15d0 at slot 0's onset, no stops).
- **Viewer**: SHELL_DATA.em013_00 (25 rows) / em013_01 (31) / em013_02 (29); code 'em013' (spawn013 / do013; the end rows by
  endWrap013). Checks: dev/shells-fatalis-check.mjs 36/36 + page 9/9; shells-crimson-fatalis-check.mjs 34/34 + page 13/13;
  shells-old-fatalis-check.mjs 30/30 + page 15/15. Soaks 96 / 96 / 103 motions, 0 refused.
- **[BACK IN 2026-10-18 (effects lane): recorded as the UNIQUE records the shells start -- rec_shellrec.py; Old's fireball also
  in one schedule with u 202 / 601 -- and lifted; 0xa5846c is [gen+0x42] & 0xf == 1, 0xae9d38 the unit's flag bit 25 test,
  0xcace4c a scale above 1.0 (rom-map "The Fatalis line's withheld shell records"). Exported (export_plain), checks and soaks
  clean -- the paragraph below is the gap as it stood]**
- **Withheld from the exports (the effects runtime refuses them -- a lift is the effects lane's)**: em013_00c u30 (the dust:
  0xa5846c in L_a583c4), em013_02u u100 / u110 (the lightning's strike: 0xae9d38), em013_02u u200 / u201 (Old's mode-2 fireball,
  with the clip's 202 / 601 on L4 M7: 0xcace4c). The shells spawn; those effects are not drawn until the lift.
- **Not built (named)**: the turning flame (7, 0x28 / 0x29 / 0x2f / 0x30 / 0x34 / 0x35: the bearing machine 0xd854fc / 0xd85e18 /
  0xd844e8 picks the clip and the fire's words mid-action); (7, 0x49) (Old, L2 M25 f146: a pitch from joint 3's world point, 0xd8716c) [READ 2026-10-20 (gapA), see the addenda below and rom-map "Elder Dragons -- the shells"; gapA asked for it to leave this list] [doc audit 2026-10-24];
  the phase-3 dust of (7, 0x2d / 0x4d / 0x0c / 0x3d / 0x51) (the clip that phase plays is set on a branch not read); (3, 0x0b / 0x0f /
  0x11), (4, 0x04 / 0x05) (no EMC stream or set-action call reaches them; one 0x768c8 site behind e+0x7420).

## 4. Kushala Daora (em024_00) -- uEm024_00 (2026-10-18)

- **Which actions**: em024_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain024.py: no call adds an action --
  **WITHDRAWN 2026-10-19**: trgen never saw the virtual change vt+0x3d0; fb/chainx.py with it adds (2, 0xb) -> (7, 4), (2, 0xa) -> (3,
  0x29) -> (3, 0x2a) -> (3, 0x2b) -> (7, 0x41), (2, 0x1c) -> (3, 0x14), (2, 0xa) -> (3, 0x15), (4, 0x17) -> (3, 0x1b); rage / tired add none).
  Shell actions reached: (7, 0x00 / 0x01 / 0x02 / 0x03 / 0x0f / 0x10 / 0x11 / 0x28 / 0x29 / 0x2a / 0x2c..0x2f / 0x36..0x38 / 0x42), and
  the beams (7, 0x15 / 0x16 / 0x18 / 0x1a / 0x1b, beam-spawns.js). Not reached (named, not listed): (7, 0x0a / 0x12..0x14 / 0x17 / 0x19
  / 0x2b / 0x3b..0x40) -- (7, 0x04) and (7, 0x41) ARE reached (above) and built:
  - (7, 0x04) 0xdf8ac8: phase 0 L2 M25 (0x219, blended with 0x21a by ctl+0x10 through 0xb0174 / 0x72620), phase 1 f118 0x7ded8(e, 0,
    0x1b), f122 sp_33 2 (snow 14: ctl+0x2c and +0x2d), setup 0x10 at the owner; its end vt+0x3dc.
  - (7, 0x41) 0xdf96a8(kind 2, r2 2): the airborne twin of (7, 0x11) -- phase 0 posture 1 (0xbf4d4 / 0xbc984), phase 2's shot on L2 M9
    f20 sp_33 6 (snow 18) for r2 in 1..2 (kind 1's twin: 5 / 17), phase 3's end (3, 1) by vt+0x3d0 (r2 1: vt+0x3e0).
  - sp_01's base01 flag 0x400 (mode 0 alone): the refusal lifted (init011 carries 0x3fac58); no maker makes mode 0.
  - Check: dev/shells-kushala-check.mjs 52/52 (s04 / s41 and their snow cases), page 23/23, soak em024_00 53 motions 0 refused.
- **The class state the makers read** (cengen11 with it poked, fb/rungen11k.py; 12 + 9 + 2 runs): the wind aura P+0x1bb (0 / 1 ->
  level 1; 2 -> ctl+0x18 ? 1 : 2; 3 -> ctl+0x18 ? 2 : 3; 0xff -> 1; 4..0xfe -> none on the 0xdf96a8 / 0xdf2670 arms), and the snow
  maps: ctl+0x2c (enraged at the action start) AND ctl+0x2d (e+0x1053 in {3, 14, 20}) move every maker to its snow modes (sp_33
  12..21, sp_00 14..26; the beam to mode 1). Rage alone, or the snow map alone, changes nothing (the runs r / s equal the plain one).
- **The makers** (READ; the census's creates):
  - 0xdf8610 (7, 0x00 / 0x01) L2 M10 / M11 (the timed turn +-0x4000): f54, level & 0xfe == 2 -> sp_01 0xb0 11 at the owner's +0x40,
    its words (u c31 on him).
  - 0xdf88f0 (7, 0x02 / 0x03; 0x03 blends L2 M24 by ctl+0x10) L2 M7 f78: sp_33 0 / 1 (snow 12 / 13). Its setup is 0x10 bytes.
  - 0xdf96a8(e, kind, r2), the shot actions (7, 0x0f / 0x10 / 0x11 / 0x2c / 0x2d / 0x2e / 0x2f / 0x36 / 0x42 = kinds 0 1 2 5 6 7 8 9 10;
    0x12..0x14 / 0x17 / 0x19 / 0x41 the r2 = 1 / 2 twins, unreached): phase 0 L2 M1, P+0x1a3 = [0x169d3a0][2k]; phase 1 until L2 M1 f40
    (kinds 0 5 7 8 10, 0xb0968 arm 1) or P+0x1a3 crossings of f106; phase 2 L2 M9 (0x209), P+0x1a3 = [0x169d3a0][2k + 1] (2 for kinds 1 /
    5 / 7, else 1): at each f20 crossing the shot by kind and P+0x1a3 (kinds 6 / 9 by the level: 3 -> 10 / 12), at f46 P+0x1a3 - 1 (0:
    phase 3, L2 M6). The clip loops (_loop from 6), so the second shot is the next pass. Modes: 0x0f sp_33 3; 0x10 sp_33 8 then 9;
    0x11 sp_33 4; 0x2c sp_00 4 then 5; 0x2d sp_00 9 (L3 10); 0x2e sp_00 6 then 7; 0x2f sp_00 8; 0x36 sp_00 11 (L3 12); 0x42 sp_00 1.
  - 0xdf2670(e, side, kind) (7, 0x28 / 0x29 L2 M21 f76: sp_00 1, L2 / L3 13; 0x2a L2 M22 f102: 9, L3 10; 0x37 / 0x38 L2 M22 f102: 11,
    L3 12). The sp_00 setups are 0x30 bytes, +0x10 / +0x20 the GOT zero vectors (base00 takes the owner's words).
- **The classes**:
  - sp_00 0xaf (base00): reader 0xdfd5ec -- ShellCmnParam joint 3, flight 72, vz 40, offset cmn vec 1; flags 0x48; sh vec 0 = (degX,
    degY); sh int 0 / 1 -> +0x1660 / +0x1664, the landing's children. Landing 0xdfd748 (state 1): ef by type, type 1 -> 0xdfd7e8: modes
    11 / 12 / 24 / 25 (mask 0x3001800) make sp_38 +0x1660, the rest sp_34 +0x1660 then +0x1664, each put in the owner's ring 0xdfd3a0
    (ctl+0x30.., n = tune int 0 = 2, clamped 1..5): a third tornado ends the oldest.
  - sp_01 0xb0 (base01): reader 0xdfdb74 (flags 1 int 3, 0x400 int 0, 0x80 int 1, 0x800 int 4, 4 int 5, 8 int 6; timer the ctor's 0).
    Its .shl lists are (em024_00c, em024_00u): list 0 is c. 0x400 (mode 0, no maker read) is refused by name.
  - **BASE33** sp_33 0xb2 (the ground-riding wind): init 0x416688, move 0x416df8, end 0x417338; reader 0xdfe018; its +0x158 0xdfe2b4
    makes sp_01 [0x169d3f0][mode] at the end point (5 / 6 / 7 / 8: u 120 / 121 / 130 / 131, em024_00u UNIQUE).
  - **BASE34** sp_34 0xb3 (the tornado): init 0x417808 (the contact + vec0 turned by the words' Y + vec1.y deg; the floor +-500), move
    0x417dc8 (vec2 turned by Y -+ the turn, the turn growing past the delay at |rate| deg a frame to the limit, the sway sin((2 clock
    + 90) deg) x sway x dt across, the clock +0x1378 += the frame step [[0x211f764]+0x68]; the floor +-250 or the end; +0x15e4 == 0: the
    unit's size from vec3 to 1 over the growth time, then sp_01 +0x15e0 every period), end 0x41839c; reader 0xdfe4cc; +0x154 0xdfe6e8
    (the child), +0x158 0xdfe7c4 (the life below the reader's - 300 with the owner in (7, 0x2a / 0x2b / 0x2d / 0x36 / 0x37 / 0x38):
    the life 0).
  - **BASE38** sp_38 0xb4 (the wandering tornado): init 0x41c2a0, move 0x41c9e4, end 0x41d12c; reader 0xdfe9b4, +0x154 0xdfec18,
    +0x158 0xdfecf4 (as sp_34's). Its draws: 0x3f76ec on +0x163c seeded from the owner's +0x73e8 (H73E8_STANDIN 0): the heading +-
    spread / 2, the turn rate 0.8..1.6 deg (its sign the draw's bit 0; vcvt.u32: a negative rate turns nothing), the hold 90..150
    frames before a redraw; the speed falls to its least (6) on the first move; the velocity (speed sin Y, -10, speed cos Y); the leash
    1400 from the landing point (back onto it, turned 1 deg a frame by the rate's sign); the floor +-250 below / the wall test above.
- **Viewer**: SHELL_DATA.em024_00 (18 rows); code 'em024' (spawn024; rows { frame, shell, mode | lv by the Wind Aura | passes });
  windAura024 from the Wind Aura control (index.html shellExtra). Check dev/shells-kushala-check.mjs 33/33 (the ROM's own runs, the
  aura and P+0x1a3 written; controls: facing, target, floor, aura x2) + page 13/13; soak 53 motions, 0 refused.
- **THE SNOW VARIANTS LIST (Raven, 2026-10-18: "Add Snow variations of the same clips, add them under a Snow Variants list")**: the
  raw lists play the plain modes (no map in the viewer; the base ctor's 0xff is none); the "Snow Variants" list (index.html, entries
  routed to the clip underneath; render/shells.js SNOW_VARIANTS: L2 M7 / M8 / M9 / M21 / M22 / M27) plays the same clips with the
  map on: input.snow -> spawn024's `snow` modes when the play is enraged (ctl+0x2c); beamState.snow -> beam-spawns `when.snow`
  (mode 1; the old 'snow maps' Clip copies moved here); the PSL word's snowMap (psl-mask.js em024: bits 18-20 when enraged); the
  class timers' context carries snowMap (the barrier's 1004 / 1005 -> u 210 / 220 on the snow maps is the effects lane's
  CLASS_TIMERS row). Records u 71 / 72 / 121 / 131 / 151 / 161 exported. Check: 12 snow cases on the ROM's own runs (ctl+0x2c =
  ctl+0x2d = 1) + 2 controls (the map off, calm), 47/47; page 23/23 (the list, the snow wind ball, the mode-1 beam, the raw clip's
  plain one).
- **Not shown (named)**: the owner's action the tornadoes test is the one the playing row names (a clip without a row of his is no
  action).

## 5. Chameleos (em025_00) -- uEm025_00 (2026-10-18)

- **Which actions**: em025_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain025.py: (7, 0x17) -> (7, 0x18),
  (7, 0x16) -> (7, 0x29), ..). Shell actions reached: (7, 0x08 / 0x0d / 0x16 / 0x17 / 0x18 / 0x1e / 0x1f / 0x24 / 0x29). Not reached
  (named): (7, 0x15 / 0x20 / 0x27 / 0x28). His class block [e+0xcac0] is P+0x60 (the ctor 0xe0ffec).
- **The makers** (cengen11; fb/motqx.py the phases' clips):
  - (7, 0x08 / 0x24) phase 2, L2 M15 f2: sp_00 1, joint -1 (the owner's point, its words); the create is the action's tail call.
  - (7, 0x1f) L2 M45 f70: sp_00 0, joint 3.
  - (7, 0x0d / 0x16 / 0x17) L2 M27 f64: sp_13 0; (7, 0x29) phase 2, L2 M27 f64: sp_13 3; (7, 0x1e) L2 M43 f64: sp_13 2.
  - (7, 0x18) L2 M36 (0xe0afb8), phase 0: P+0x30 (the target, stored by vt+0x204 0xdff4f0 at (7, 0x17)'s start: n - 0xe in
    0x2000200, i.e. 0x17 / 0x27) moves +-500 to the side the target's bearing is on (P+0x1a2 = 1 on the left; L2 M37 / M38 blended into
    M36 by 0xb03f8) and 500 ahead (-500 when e+0x73e8 & 0x64 > 0x13: H73E8_STANDIN 0). ctl+0x1c = the bearing to it less the facing,
    folded, at most 0x2aab. f44: ctl+0x1c negated on the left, sp_13 1, whose Y word is its bearing + ctl+0x1c.
  - The class's vt+0x208 0xe00344, every frame by the motion id (fb/probe025.py: 0xb0944 stubbed, every frame literal alone, ctl+0xc
    x ctl+0x13) -- sp_01 footfalls at the owner's +0x40 / words:
    - L2 M6 f84 and L2 M8 f64 / 160 / 256 / 354: mode 0 (joint 142).
    - L1 M2 f64, L1 M7 f22, L1 M8 f32: mode 2 (the owner's ground). Mode 1 instead when ctl+0x13 == 2 and visible; none when ctl+0x13
      == 2 and hidden.
    - L1 M9 f36, L1 M10 f40: mode 1 (none hidden).
    - ctl+0xc (the invisibility: vt+0x208's head copies ctl+0xd..+0x12 into the unit's draw bits e+0x110 / +0x11c) and ctl+0x13
      (written 1 / 2 by vt+0x370(e, 2), 0xe03cdc) are not held: 0, visible.
- **The classes**:
  - sp_00 0xb5 (base00): reader 0xe0eee0 -- joint int 0, offset &vec 0, vz / vy vec 1's z / y, gravity &vec 2. The flags and the
    flight +0x15fc are the ctor's 0 (0x3f8a74 clears +0x15ec..+0x1610), so it lives while hit slot 0 does.
  - sp_00 landing 0xe0efdc: type 1 also makes sp_01 4 (a hit volume). Every type makes the cloud (modes 0 / 3 sel 0, mode 1 sel 1).
  - sp_01 0xb6 (base01): reader 0xe0f2dc (1 int 0, 0x80 int 2, 0x800 int 3, 4 int 4, 8 int 5, the joint int 1). Its one list is
    em025_00c.
  - sp_13 0xb7 (base13): reader 0xe0f510 (flags 2 / 8 / 0x10 by ints 1 / 2 / 3 -- 0x1a on every mode: the points turned by the owner's
    words, times the size, the aim along the facing as it is).
  - sp_13's vt+0x16c 0xe0f7f0: mode 1's Y word.
  - sp_13's vt+0x170 0xe0f7b0: mode 4's target is ctl+0x60 (no action read makes mode 4).
  - sp_13's landing 0xe0f6fc: types 0 / 1 make the cloud (sel 0) and end; type 2 starts ef 3 and does not end.
  - **BASE39** sp_39 0xb8, the poison cloud: init 0x41d780, step 0x41d988, move 0x41da60, end 0x41de84; reader 0xe0f9a8.
    - Placement: the point + vec 0 turned by the OWNER's Y word. Its words are (0, the creator shell's Y word, 0).
    - Life 1200 frames; ef u 3 / u 4. Its hit capsules (ShellCmnParam floats / vecs x n) are not visual.
    - 0x41dc50 (blown away by a hunter's hit) is not reached in the viewer.
  - **The clouds' ring** 0xe0dad8: three slots ctl+0 / 4 / 8, the count ctl+0x95, the load ctl+0x94 (+5 / +10 per cloud), each cloud's
    rank +0x160d (its creation count).
    - Full, or the load >= 30: the rank-0 cloud is ended and its slot taken.
    - The full path's fallback overwrites slot 0, leaving that cloud running out of the ring.
    - A cloud's end (+0x150 0xe0fe78): count - 1, load - 5 / 10, every rank - 1, its slot emptied.
    - The ring is transcribed from the read (cloud025 / end039). The ROM check flies one shell per case, so it does not exercise the
      ring past one cloud.
- **Viewer**: SHELL_DATA.em025_00 (9 action rows + 7 footfall rows: pick 'always', `timer`); code 'em025' (spawn025).
- **Check**: dev/shells-chameleos-check.mjs 20/20 -- the ROM's own runs.
  - Cases: every maker; (7, 0x18) both sides; the footfalls through vt+0x208 with the motion id at e+0x4b4.
  - emu_fb options: `creatorCopy` (the cloud reads its creator's Y word) and `slot0Until` (the hit slot held for the module's count).
  - Controls: facing, target, floor, the (7, 0x18) target.
  - Page 11/11; soak 54 motions, 0 refused.
  - Exports em025_00u 0 / 1 / 2 / 3 / 11, em025_00c 30 / 31. [**u 4 BACK IN 2026-10-18 (effects lane)**: 0xa953f0 is the arm for generator flag bit 28 (`ubfx r0, r4, #0x1c, #1` of [[g+0x34]+0x10c] at 0xa94100, kept at sp+0x38 and tested at 0xa953e8) in 0xa93ff0; recorded as the UNIQUE record (rec_shellrec add_em025_00_shellrec_u4 / _near), lifted, exported; shells-chameleos-check 20 + page 12, soak 54 / 0] **u 4 (the mode-1 cloud) withheld**: the runtime refuses it at 0xa953f0
    (unrecorded path) -- the effects lane's.
- **Seen** [WITHDRAWN 2026-10-22 (gapP): the floor there is the lowest-reach stand-in; the head is 297 x size below the unit's ground -- rom-map Withdrawn table] [doc audit 2026-10-24]: L2 M45's gob (f70) starts about 13 below the viewer's floor (the head at the ground, offset (0, -80, 140)) and falls through
  it: no landing, no cloud, as the ROM's query would answer for that geometry.

## 6. Teostra (em027_00) -- uEm027_00 (2026-10-18)

- **Which actions**: em027_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain027.py: (7, 0x2c) -> (7, 0x2e),
  (7, 0x2a) -> (7, 0x2d)). Shell actions reached: (4, 0x06), (2, 0x1f / 0x20), (7, 0x03 / 0x05 / 0x07 / 0x0a / 0x15 / 0x16 / 0x1a /
  0x21 / 0x23 / 0x24 / 0x25 / 0x26 / 0x2a / 0x2b / 0x2c), (1, 0x07 / 0x1b). Not reached (named): (7, 0x1b / 0x1d / 0x1e / 0x1f / 0x20 /
  0x22 / 0x28 / 0x29), (4, 0x0a). Class main 0xe1a408, vtable 0x17b65cc; the status-7 helpers by the table 0xe193a8 (48 offsets on
  e+0x73e1): 0xe173e0(e, side, kind) for (7, 0 / 1) kind 0 (no shell), (7, 0x1e / 0x1f) kind 1, (7, 0x2b / 0x2c) kind 2; 0xe17758(e,
  side, kind) for (7, 3) (0, 0), (7, 0x21) (1, 0), (7, 0x25) (0, 1), (7, 0x26) (1, 1); 0xe17ce8(e, sel) the nova; 0xe18a08(e, n) for
  (7, 0x0a / 0x15 / 0x16) 0 / 1 / 2; 0xe18588(e, kind) for (7, 0x1d) 1, (7, 0x2a) 2; 0xe19134(e, 0 / 1) for (7, 0x2d / 0x2e).
- **The makers** (cengen11; fb/motqx.py the clips; phase 2 of 0xe18a08 found by its body -- setMotion 0x208 behind the loop counter
  P+0x1a2, which motqx's answers do not reach):
  - (4, 0x06) L1 M7 f70: sp_01 4 at the owner's point and words.
  - (2, 0x1f) / (2, 0x20) L4 M16 f56 (0xe12f5c(e, 0 / 1)): sp_21 9 / 10; 10 is a LEADER (setup +0x12 = 1, +0x14 = e+0x73e8) and
    phase 2 (L0 M34) hands to (7, 0x2d).
  - (7, 0x03) / (7, 0x21) / (7, 0x26) L4 M6 f104: sp_04 0 / 1 / 1. (7, 0x25) L4 M6: sp_21 2 / 3 / 4 at f100 / 115 / 130 (0xe13168,
    +0x12 0) and sp_04 3 at f180.
  - (7, 0x05 / 0x07 / 0x1a / 0x23 / 0x24) phase 2 L4 M10 f50: sp_20 0 / 1 / 2 / 5 / 6, index 0. (The selector's mode table also gives
    3 / 4 / 7 / 8 to the unreached (7, 0x1b / 0x22 / 0x28 / 0x29).)
  - (7, 0x0a / 0x15 / 0x16) phase 2 L2 M8 f24: sp_04 2.
  - (7, 0x2a) L4 M4 f36 AND f40 (two): sp_21 8 at G rank (0x3a8430 >= 5), 11 below; leaders; at f84.. -> (7, 0x2d).
  - (7, 0x2b) / (7, 0x2c) L2 M10 / M11 f44 AND f48: sp_21 0 / 1 at G rank, 12 / 13 below; leaders; at f120.. -> (7, 0x2e).
  - vt+0x208 0xe10f7c by the motion id (fb/probe208.py: 0xb0944 stubbed, every frame literal alone, P+0x1bb poked): L2 M2 f52 sp_01 2
    -- 400 x the size ahead (block +0x54's sin / cos), y the ground, while block +0x44 <= the ground + 1000 and e+0x1054 == G+0x49
    (0xb6fac: the monster in the loaded area, true in the viewer); L0 M5 f186 sp_01 1 at block +0x40 while the fire aura is on (P+0x1bb
    not 0 / 0xff and P+0x5e08 bit 1 clear) or the action is (1, 7) (0x6fe88). L0 M5 is the clip of (1, 7) and of the rage roar (1,
    0x1b): rows (1, 7) always, (1, 0x1b) with the aura. Its other arms (L2 M12 / M4 / M13) arm hit records (0x7db70), not shells.
- **The classes**:
  - sp_01 0xb9 (base01): reader 0xe1ad60 -- ef 0 / 1 -> +0x15c8 / +0x15cc (both started by the init; mode 1's c 31 and c 34), 0x80 int
    0, 0x800 int 1, 4 int 2, 8 int 3, vec 0. Its init 0xe1ac9c: base01's, then +0x40 moved by the setup's +0x3e halfword (x / z by 400 x
    +-1.5625e-5 x u16(h << 8) / u16(h << 2), signs bits 0x100 / 4). Every maker writes 0 there but mode 10's second blast (e+0x73e8).
  - sp_04 0xba (base04): reader 0xe1af84 = Savage's 0xe82944 instruction for instruction (diffed); +0x158 0xe1b128: mode 3, life < 30:
    the length x max((life - 6) / 30, 0).
  - **BASE20** sp_20 0xbb, the nova's ring (ctor 0x409544, init 0x40968c, step 0x409d68, move 0x409e30, end 0x409f3c); reader 0xe1b2f0
    (ef 0, hit 0, ints 0 / 1 / 2 (the count), floats the radius / the scatter / the interval, vec 0, +0x15e8 = the turn table[index]:
    0x161f21c (0, 0x2000, .. 0xe000) for int 1 == -1, 0x161f23c (0, 0x8000, 0x2000, 0xa000, 0xe000, 0x6000, 0xc000, 0x4000) else).
    - Placement, int 0 != 0: the owner's point + (R sin a, 0, R cos a), a = u16(table + block +0x54), + the scatter (sx, 0, sz) and vec 0
      each turned Z, X, Y by the owner's words; the scatter is n = e+0x73e8 x index read as bits (0 with H73E8_STANDIN).
    - int 0 == 0 (modes 4 / 7 / 8, unreached): the target + (x, y, -100) turned Z, X, Y.
    - The leader (index 0): its clock reaches interval x (index + 1) -> +0x158 0xe1b418 makes the next pillar (index + 1); at count - 1 it
      ends. 8 pillars, 6 frames apart, 45 degrees (or opposite pairs) apart. The others live while their hit slot does.
  - **BASE21** sp_21 0xbc (ctor 0x40a214, init 0x40a318, step 0x40a7bc, move 0x40a8b8, end 0x40aa74); class init 0xe1b60c (+0x1634 =
    setup +0x14), reader 0xe1b650, vt+0x154 0xe1b794, +0x158 0xe1b844.
    - Setup: +0x10 the hit group, +0x12 the leader byte, +0x14 the second blast's +0x3e.
    - Init: the joint's position (0xc164c) or the unit's +0xe0.. (joint -1); the anchor that point; the words the owner's, Y + float 2
      degrees; int 1 == 0: +0x40 += (0, 0, float 3) turned Z, X, Y (the flame line, modes 2..7), sub-state 1; int 2 == 0: the anchor +=
      vec 0 turned by Y (modes 9 / 10: 650 ahead, 200 up). Ef 0 and ef 1 at +0x40 (each mode one live).
    - Move: sub-state 0 follows the joint for float 0 frames, sub-state 1 lives float 1 frames. A leader waits for the owner's action
      (7, 0x2d) / (7, 0x2e); 60 frames later it ends and +0x158 makes sp_01 0 (u 152) at the anchor. Mode 10's own move makes one more at
      50 frames (+0x1636 once), the count +0x1630 giving the second +0x3e = +0x1634.
- **Viewer**: SHELL_DATA.em027_00 (23 rows; code 'em027', spawn027). (7, 0x2d) / (7, 0x2e) rows on L4 M10 name the trigger: the shells
  read the play's action (stepShells ctx.ownerAction, the row the pick stands for). The aura: input.fireAura027 (the Fire Aura control).
  Rank: input.rank (G default).
- **Check**: dev/shells-teostra-check.mjs 33/33 -- the ROM's own runs, every maker, the leaders' trigger through the next play
  (emu_fb `actionAt`, 0x6fe88 unstubbed), the low-rank modes, the vt+0x208 rows. Controls: joint 3 / joint 4 moved, the facing, the
  owner's point, no trigger, the ground 1080 lower. Page 20/20; soak (--viewer-inputs) 50 motions, 0 refused.
- **Records**: em027_00u 30 / 40 / 50 / 60 / 70 / 90 / 100 / 110 / 111 / 150 / 151 / 152, em027_00c 30 / 31 / 34 exported from the
  UNIQUE array (fb/export_plain.py) and recorded as UNIQUE shell records (fb/rec_shellrec.py, plain + _near: 30 sets), lifted once
  (2026-10-19).
- **Seen in the harness**: a pillar or blast made by the LAST unit of line 18 (a lone leader) is counted by the hit pass in the step it
  is made, before its first move: its slot life is one move shorter (the check's slot0Until lists; the module's line-18 order, INFERRED).

## 7. Alatreon (em050_00) -- uEm050_00 (2026-10-19)

- **Which actions**: em050_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain050.py; edge (7, 0xf) -> (7, 0x19)).
  Class main 0xeccc1c, vtable 0x17c7254, band 0xec480c..0xed0a38 [derived 2026-10-24: `0xec4890..0xed0834`; rom-map "Alatreon band (derived)"] (fb/band050.txt). The status-7 table 0xecbc98 (82 offsets on
  e+0x73e1; fb/stdisp.py) gives the helpers' arguments. Not reached (named): (7, 0x48..0x51) (0xec91f0's sp_01) -- **WITHDRAWN
  2026-10-19** for five: (7, 0x10) -> 0x48, (7, 0x41) -> 0x4d, (7, 0x44) -> 0x4f, (7, 0x43) -> 0x50, (7, 0x45) -> 0x51 (vt+0x3d0,
  fb/chainx.py); 0x49..0x4c / 0x4e stay unreached. 0xec91f0(e, k): phase 0 L2 M29 (0x21d); phase 1 at its end L2 M14 (0x20e) ->
  phase 2: f28 sp_01 6, and f38 sp_01 7 when k >= 5, both with the GOT zero setup (+0x10.. and +0x20..); phase 2's end counts
  P+0x1a2 and loops through phase 3 (L2 M14 again) or ends on L2 M15 (0x20f). sp_01 6: flag 1, joint 14; sp_01 7: flag 1, joint 9,
  flag 0x400 (y = the ground + vec.y: base01 0x3fac58, the refusal lifted). Rows act050(7, 0x48 / 0x4d / 0x4f / 0x50 / 0x51) on L2
  M14 (`at: 'zero'`). Check 33/33 (m48 / m4d / m51; controls: the ground on m4d, joint 14 on m48), page 22/22, soak 71 motions 0
  refused. (The check generator's at-once-stop comparison was commented out by a patch -- trap 114: fixed; base41's landing
  at-once stop of b0 / b2 after the end's graceful stop now reaches the handle, as 0x43b058 leaves it in its slot.)
- **The makers** (cengen11 + two timer makers it cannot see, trap 83: found by the id immediates; fb/motqx.py the clips; fb/setups.py the
  setups):
  - (4, 0x09 / 0x0f) phase 2 (L1 M11 / L1 M9) f6: sp_00 2. (7, 0x02 / 0x21) 0xec7ae0(side) L2 M6 f76: sp_00 0 / 1. Zero setups.
  - (7, 0x06) 0xec7f14 phase 3 (L2 M3, set at the landing 0xbf4e4) f2: sp_01 2 at the block point + (lat, 0, fwd) turned by Y, lat = 8 x
    (u8(h) - 128), fwd = 1000 + 5 x (h >> 8). (7, 0x18) 0xec7870(1) L2 M5 f170: the same with fwd = -200 - 5 x (h >> 8).
  - (7, 0x0d / 0x40) 0xec8544(k 0 / 3) phase 2 (L2 M9) f24 / 26 / 30: sp_41 5 / 6 / 7 and 2 / 3 / 4 (joint 3, zero setups). (7, 0x0e /
    0x25) (k 1 / 2): the beam sp_02 0 (render/beam-spawns.js, the beams lane's; its (7, 0x25) row is missing there -- reported).
  - (7, 0x19) 0xec9af0 phase 0 (with its setMotion L2 M21): three sp_41 0 at the block point + (4 x (u8 - 128), 2000, 1000 + 5 x u8)
    turned by Y, the bytes from hashes of h (h x 0x12d6f3 / 0x74a04f through 0xcccccccd's high word, h x 0x34bf15). +0xcad0 = 150.0.
  - (7, 0x1a) 0xec9eb8 L0 M14 f164 / 224 / 284: sp_01 3 at three of six points round him ((+-800, 0, +-800), (+-1200, 0, 0)) turned by
    Y: a = h % 6, b = (h >> 4) % 5 past a, c = (h >> 8) & 3 past both.
  - (7, 0x36 / 0x37) 0xecb4f8 L2 M6 f74: sp_11 0 / 1 at the block point. (7, 0x38 / 0x39 / 0x3f) 0xecb774(k 0 / 1 / 2) L2 M7: k 2 f96 sp_01
    5 at the target (0xc460c first); f164 phase 2 (L2 M21) and sp_11 2 / 3 (k 0 / 1) or sp_01 5 at the target (k 2).
  - **(7, 0x20)** 0xecad24 L2 M7: phase 1 from f130, every P+0x1bc > 14 (+ the step each call), 0xecaad8(e, h & 3, i, h) up to 35: sp_41
    1 from 2000 above V[T[sel][i]] (0x169ed48 4 x 35 bytes; V at BSS 0x212aa70, 69 WORLD points read on the booted executable) scattered
    by 0xc1420 (radius 0x1592938[sel] = 630 x u8(hash) / 255 at the angle hash & 0xff00, 0x232700), or -- the target a hunter (P+0x230
    <= 2) and (sel 0 ? i & 3 == 0 : i & 7 == (h x 0x4148654) & 4) -- above the target. At f164 with 35 made: phase 2 (L2 M21).
  - **(7, 0x35 / 0x3a..0x3e)** 0xecb36c(k 0..5) L2 M28: phase 1 from f158, every P+0x1bc > 7, 0xecb128(e, k, i, h) up to 10: sp_01 4 at
    the block point + V[T[k][i]] (0x169edd4 6 x 10 bytes; V at BSS 0x212aec0, 57 offsets, NOT turned) or -- k >= 2, the target a
    hunter, (h + i) % 10 == 0 -- sp_01 5 at the target. P+0x1bc is not zeroed by this action (a leftover in the game; 0 here, named).
  - Below them: sp_00's landing (sp_01 0 / 1 by mode), sp_11's strikes (sp_01 4).
- **The classes**:
  - sp_00 0xef (base00): reader 0xecf594 (ef 0 / 1, ef 2 -> +0x15d4, ef 3 -> +0x15d0; joint int 0; floats X / Y degrees, vz, vy, the flight;
    vec 0 the offset, vec 1 the gravity); init 0xecf56c (base00's, then +0x15c1 = 1); landing 0xecf6e4 (type 0: param 1 and the end; type
    1: param 3, sp_01 [0, 0, 1][mode] at the contact, the end; type 2: param 2 and NO end).
  - sp_01 0xf0 (base01): reader 0xecf990 (ef 0, ef 1 -> +0x15d0 the 0x20 switch's; flags 1 int 0, 0x20 int 1, 0x400 int 3, 4 int 4, 8 int
    5; joint int 2). Modes 2 / 3 switch u 90 -> u 91. Modes 6 / 7 made by no read maker (7's 0x400 refused by name).
  - sp_11 0xf2 (base11): reader 0xecff90 (the times; the owner's point and words kept; no ef); +0x168 0xed0140: sp_01 4 at the kept point +
    vec k turned by the kept Y (mode 4 none).
  - **BASE41** sp_41 0xf3 (ctor 0x41f210, init 0x41f410, step 0x41fbe8, states 0x41fd40 / 0x4200b0 / 0x420238, landing 0x41eed4, end
    0x420348); reader 0xed0478. Handles in a 9-slot block [+0x1634].
    - Init: the words (setup's zero -> the owner's + X / Y degrees); the point (setup's zero -> joint int 3's row 3 or the owner's point, +
      vec 0 turned X, Y, Z; else the setup's point). THE VELOCITY +0x1010 = (0, float 3, float 2) turned X, Y, Z; THE ACCELERATION +0x1020 =
      (0, vec 1's y, z) turned by Y. Flag 1: held (state 1); else state 2 with ef 0 / 2 and the hit.
    - State 1 (held): ef 1 at once, cmn float 0 (31) frames, ef 0, cmn float 1 (10), then state 2 with ef 2 and the hit.
    - State 2: the life float 4; stepFlight; the rocks' query -> the landing: FIRST the end, then type 0 ef 5, type 2 ef 8, type 1 (+8 &
      0x1040) ef 6, type 1 ef 7 at the contact plus -- flag 4 -- STATE 3 (the hold: float 5 frames, +0x40 += vec 2, ef 0 / 2 stopped at
      once, ef 3) or ef 4 at +0x40.
    - State 3: at its end (or byte +0x151e not 0xff: a hunter's hit, none here) ef 4 and the end. Flag 2: the ground marker (not drawn).
- **Viewer**: SHELL_DATA.em050_00 (22 rows; code 'em050', spawn050). Stand-ins: H73E8_STANDIN = 0, TARGET_KIND050 = 0 (P+0x230, the target
  slot's kind byte written with the target point by 0xcc368: <= 2 INFERRED a hunter). Base41's handles are the runtime's named slots
  (S.handles b0..b8).
- **Check**: dev/shells-alatreon-check.mjs 28/28 -- every maker, both timer makers called every step, the base41 states 1 / 2 / 3 / 0xfe
  all reached. Controls: the facing, the owner's point (twice), the target (twice), the floor, joint 3.
- **Anchored** (the coordinator for Raven, following his Lao precedent, 2026-10-19; reversible): with input.anchor050 (index.html shellExtra)
  each (7, 0x20) arena point's x / z plus his unit's -- the ROM's heights, spread, timing and target cadence kept. The ROM check runs the
  WORLD coordinates (no anchor050).
- **Records**: em050_00u 0 / 1 / 2 / 90 / 91 / 150 / 180 / 182 / 183 / 184 / 185 / 210 / 211 / 212 / 214 / 215 exported from UNIQUE and recorded
  (rec_shellrec, plain + _near: 32 sets), lifted once. u 211's refusal (0xa96dcc, in the particle emitter: [def]+1 bit 0 clear after the
  random-table pick at 0xa96d9c) is gone: the lift now carries 0xa96dcc (lifted-particles.js), the page runs u 211 twice without a refusal.
  Page 22/22; soak (--viewer-inputs) 71 motions, 0 refused (the beam row (7, 0x0e / 0x25) included).
- **The beam row** (7, 0x25) added to render/beam-spawns.js (0xec8544 k 2, the same spawn; no beams agent active -- the coordinator's call).

## 8. Amatsu (em058_00) -- uEm058_00 (2026-10-19)

- **His actions keep their phase in the UNIT**: e+0x15e1 (sub-phases +0x15e2 / +0x15e3), not P+0x1a1 (only (1, 0xd) uses P+0x1a1). The
  census with trgen's default (P+0x1a1) finds NOTHING; with FB_PHASEAT=0x15e1 it finds every frame-test maker (trap 110).
- **Which actions**: em058_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain058.py, FB_PHASEAT: no edges -- **WITHDRAWN
  2026-10-19**: the edges go through vt+0x3d0, which trgen stubbed; see below). Class main
  0xf07584 (status table 0xf07618: 7 -> 0xf0809c), vtable 0x17cbfc4, band 0xf066ec..0xf111ec. Status-7 table 0xf080c4 (0x1c offsets).
  ~~Not reached: (7, 0x08 / 0x0e / 0x18 / 0x19 / 0x1a / 0x1b) -- every sp_06 and sp_42 maker.~~ **WITHDRAWN 2026-10-19: all six are
  CHAIN-issued** (not variant-gated, not HP-staged: a raw scan of every op of every stream finds none of them -- control (7, 0xb), 4
  sites -- and no status script's 0xfe names them -- control his 0x17cca80 / 0x17cca88). His helpers change action through the VIRTUAL
  vt+0x3d0 (0x6c178 = b 0x768c8; fb/vchain.py): (2, 8 / 9) 0xf07c08 -> (7, 6 / 7); (2, 0xd) 0xf0b380 -> (7, 8); (2, 0xe) -> (7, 0xe);
  0xf0aed8 -> (7, 5); 0xf0ab30 (k 0..4, at its end) and (3, 1) -> (7, 0xf); (7, 5) 0xf0c948 -> (7, 0x18) and (7, 0xf) 0xf0d76c -> (7,
  0x19) while e+0x7420 (the owner machine; set offline); (7, 0x19) -> (7, 0x1a) -> (7, 0x1b) -> (3, 2). fb/chainx.py (the fixed trgen)
  reaches all six.
- **The makers** (the frames from his action_tune where the code reads them: 0x20 110, 0x23 220, 0x24 206, 0x25 806, 0x26 200):
  - (7, 0x09) 0xf0cd0c L2 M17 at tune 0x20: sp_00 0 (zero setup).
  - (7, 0x0b) 0xf0d1c4 L2 M19 at tune 0x23: sp_30 0 / 1 / 2 (id, mode, owner). Phase 0 also copies e+0x1480 / +0x1488 / +0x19f4 into ctl
    +0xcae0.. (read by nobody here).
  - (7, 0x0c) 0xf0d3a0 L2 M22 at tune 0x24: sp_01 8 (hit only); the hold P+0x1bc = tune 0x25 counted down (0x7206c); at its end L2 M23 and
    sp_01 1 at the block point with his words (a tail call) -- whose end (+0x154 0xf0fa28, mode 1) makes sp_01 2 at its point.
  - (7, 0x01) 0xf0bd10 L2 M14 f102: sp_01 4 (hit only) while e+0x17f4 bit 0 is clear. **No writer of bit 0 anywhere in the text**
    (fb/fieldscan.py: every form that can address +0x17f4 -- movw, imm12, imm8, add-base -- finds 6 sites: in his band the bit-1 writer
    0xf07518 (a part break; ldrh / orr #2 / strh through a post-indexed pointer) and the test 0xf0bd70; out of band 0x8d0d3c (an object
    with an array at +0x30cec, not an enemy) and 0x3b065c / 0x3b3024 (a global's counter sums). His band has no other base movw in
    0x17c0..0x180f and no add-imm base but +0x1480. CONTROLS, the same scan: it finds 0xf07518, and e+0x15fb's sole writer 0xf091ac
    among 9 sites.) Its start value (the ctor's zeroing) NOT READ: E17F4_STANDIN 0, named. (7, 0x02) 0xf0be9c L2 M15 f130: sp_01 3 (hit only; +0x20 the block
    point -> its anchor, flag 0x200).
  - NOT BUILT (named; nothing shows): (7, 0x00) 0xf0bc0c L2 M16 f122 sp_29 0 (base29: no effect param, no child); (7, 0x03 / 0x04 / 0x06 /
    0x07) 0xf0c054(k) the dash trail -- sp_01 6 (no effect) each time 0x539d5c on P+0x1bc fires (T = 6 / 3 at the phases, 16 after each),
    on L2 M1 from f92, L2 M2, L2 M4 from f152, L2 M2; the phase moves on 0x78b78 (the dash's arrival: not viewer-visible).
- **The classes**:
  - sp_00 0xfc (base00): reader 0xf0f3a0 (ef 0..3, joint int 0, floats X / Y degrees / vz / the flight, vec 0; vy and the gravity 0); landing
    0xf0f4bc (type 1: sp_01 7 at the SHELL's point and words, then ef 2; types 0 / 2 ef 1 / 3; the end).
  - sp_01 0xfd (base01): reader 0xf0f794 (0x200 int 0, 1 int 2, 0x400 int 1, 2 int 4, 0x100 int 6, 0x80 int 5, 4 int 7, 8 int 8; joint int 3;
    timer float 0; vec 0, vec 1 the words' degrees; cmn floats -> +0x1654.. mode 8's hit windows). Base01's init: flag 0x200 (0x3fac20) the
    anchor = setup +0x20..; flag 0x400 (0x3fac58) y = the ground + vec.y (position and anchor) -- both READ and built (shells.js init011).
  - **BASE30** sp_30 0x101, the whirlwinds (ctor 0x412fb8, init 0x413080, step 0x41330c, move 0x4133d4, end 0x41359c); reader 0xf103b0 (ef
    0, hit 0, floats the anchor's rise / the turn (degrees a frame) / the life, vecs 0 (read by nobody) / the words' degrees / the velocity).
    - Init: the words = the block's + the degrees; +0x40 = the block point + the GOT's ZERO vector turned by Y, y = the ground; life float 2.
    - Move: the anchor = the point + (0, rise, 0); stepFlight; then the velocity = vec 2 turned by the Y word after Y += dt x u16(s32(0.5 +
      turn x 182.04)) (kept as the u32 of the float sum); the life counts down to the end.
- **Viewer**: SHELL_DATA.em058_00 (6 rows; code 'em058', spawn058). (7, 0xc)'s sp_01 1 is a `start` row on L2 M23 (the hold's end).
- **The chain-reached makers (2026-10-19)**:
  - sp_06 0xff (base06; reader 0xf0ff20): (7, 8) L2 M10 -> M11 and (7, 0xe) L2 M12 -> M13 at f58 mode 0 (0xf0cae0(k 0 / 1), at
    0xf0cc74); (7, 0x18) 0xf0d9e8 L2 M7 -> M8 f78 mode 1. Both modes: no list, ef (999, -1) -- HIT ONLY, named, not built.
  - **sp_42 0x102, the water lines** -- (7, 0x19) 0xf0dda0 / (7, 0x1a) 0xf0e194 / (7, 0x1b) 0xf0e678:
    - Phase 0: L2 M27 / M28 / M29 (0x21b..0x21d); the line's points e+0xcb40.. (A) / +0xcb50.. (B) from the target's distance d (block
      +0x1d0) and the facing he will turn to: block +0x54 + the delta to the target, clamped to tune float 3 degrees (e+0xcb64; turned in
      phase 1 by 0x76dd0). Tune (length, near, far, degrees) = 0xe..0x11 / 0x13..0x16 / 0x18..0x1b = (8000, 100, 10000, 30).
      0x19 near -> far: z from max(near, d - length / 2), its far end capped at far; 0x1a across: x -4000 -> +4000 at z = clamp(d,
      near, far); 0x1b far -> near. y 0; turned by the new facing (op order transcribed: shells.js line058) and set on block +0x40.
    - Phase 1: the turn; 0xc0dbc aims his head (e+0x1490) at the line -- NOT BUILT (the viewer's head is the clip's); at tune 6 / 7 / 8
      (18 / 20 / 22) sp_42 mode 0 / 1 / 2, setup 0x30 (0x420684): +0x10 A, +0x20 B.
  - **BASE42** (uShellEmBase42; vtable via sp_42's 0x17d5190): init 0x4207e4, the activation vt+0x18 0x420ac8, move 0x42124c -> vt+0x154
    0x4212b8, end 0x4215a8, helpers 0x420d70 / 0x420fe0 / 0x421384. sp_42's reader 0xf105b0, +0x15c 0xf106ac, +0x158 0xf10830.
    - The unit walker (0xc04588..0xc045b8) runs a new unit's vt+0x18 once (state 1 -> 2), then its move in the same pass.
    - Init: A -> +0x1600, B -> +0x1610; both y = the lower; +0x40 = A; life +0x15f0 = float 0 (40); +0x1000 = vec 0 (0, -40, 50)
      through joint int 0's (3) whole matrix.
    - Activation: 0x420d70 (the joint point; the advance), the sound's ray 0x420fe0, ef 0 (u 50) at +0x1000 rotated (X, Y, Z) =
      (atan2(-dy, |dxz|), atan2(dx, dz), atan2(-dx, dy)) of the joint point -> the shell.
    - Each move: 0x420d70 -- +0x40 advances along A -> B at |B - A|xz / float 0 a frame (x the owner's +0x50c); the placement
      0x421384: ef 0 at +0x1000, rotation (X, Y, the block's Z word); the life -= the step; out -> the end. Every 3 frames of life
      (life < float 0 - 3 x count) sp_42's +0x15c rays the stage 1000 below to 1000 above the point: on a hit +0x44 = the ground and
      ef 1 (u 51) starts there (15 slots).
    - The end: ef 0 stopped gracefully, state 0xfe; sp_42's +0x158 waits for ef 0's handle to clear, then (once, past float 1) makes
      three sp_01 0 (HIT ONLY: at A / B with y 0, +900, -900 -- not built) and stops every splash; all slots empty -> deleted.
    - 0x329c9c / 0x329d04 ignore a unit index > 0 (`bgt` to bx lr): 0x421384's loop over the units places unit 0 alone.
    - NOT BUILT, named: the sounds (+0x15cc / +0x15d0 / +0x15d4, 0x4ef25c / 0x4eeed0), the three end hits.
    - **FIXED 2026-10-19 (the page check's 20-minute timeout):** the module deleted the shell in the same step it stopped the splashes, so
      the stops (applied only to ended / alive shells) were lost and every play left ~13 u 51 running (19 -> 69 requests over five
      plays). As the ROM does (0xf10da8..0xf10eac), the stops now go out with the 0xfe shell and it is deleted only when every slot is
      EMPTY (each handle dropped once its unit left states 1 / 2). Measured (<archive> diag042.mjs): back to the 2 base requests
      between plays. Nothing ends the line at a clip change or a loop wrap in the ROM either: it runs its travel out.
  - Check: dev/shells-amatsu-check.mjs 18/18 -- w19 / w1a / w1b fly the three lines (700 moves each equal, the ground rays and 14
    starts each); emu_fb `activate` runs vt+0x18 before move 1, `stubs` 0x420fe0 (the sound's ray). Controls: the target (w1a), joint
    3 (w19: the stream's start point), the facing (w1b). u 50 / u 51 exported, recorded and lifted 2026-10-19; page 13/13 (records 10 / 20 / 22 / 30 / 31 / 50 / 51).
- **Check** (before the lines): dev/shells-amatsu-check.mjs 12/12 -- his phase byte written per step (emu_fb step `owner`), 0x7206c unstubbed for the hold.
  Controls: the facing, the ground, the owner's point, joints 3 and 1.

## 9. Valstrax (em086_00) -- uEm086_00 (2026-10-19)

- **Which actions**: em086_00_cmdtbl.emc (fb/emcvar.py) closed over every change (fb/chainx.py, vt+0x3d0 and rage / tired walked):
  every action below that makes a shell is reached. Main 0x109f650, band 0x1094024..0x10a2e44. Ids 0x174 uShellEm086_sp_56 (BASE56;
  folder shell00, 12 modes) and 0x175 uShellEm086_sp_01 (base01; folder shell01, 15 modes).
- **The makers** (cengen11; the frames are his action_tune's; fb/crlr.py the sites):
  - 0x1098b2c(e, r1) (7, 0x08 / 0x1c (r1 0), 0xc8 / 0xc9 (r1 1)): phase 0 L2 M32 (0x220); phase 1 at tune floats 0xc..0x11 (50 / 52 /
    62 / 64 / 72 / 74) sp_56 (r1 ? 6 : 0) + i, setup 0x14 (0x42d9b4: byte +0x10 0, halfword +0x12 0xffff).
    - r1 1, phase 0: THE TARGET IN A CONE (shells.js cone086) -- O = his block point + tune vec 3 (0, 500, 0) x his size; d = block +0x1d0
      - O in his frame (vt+0x54(-1) = his world matrix +0xb0, rows 0 / 1 / 2 -> a, b, f); a within |f| tan(tune int 0xb = 30 deg), b
      within |f| tan(int 0xa = 30 deg); cut -> block +0x1d0 = O + a' row 0 + b' row 1 + f row 2 (+0x1dc 0); e+0xcad0.. = the block point.
  - 0x1098fa4(e, r5) (7, 0x09 / 0x1d (r5 0), 0x0a / 0x1e (r5 1)): phase 0 L2 M36 (0x224); phase 1 at tune 0x12 (120) sp_01 1 and 2; r5 1
    on to phase 2 L2 M37 at tune 0x13 (65) sp_01 3 and 4. Each at his +0x40 with his words e+0xfe8.., +0x3c 0x16b4b4's value.
  - 0x1099f20 (7, 0x30): phase 2 (L2 M63, after L2 M62) at tune 0x1d (6) sp_01 5.
  - 0x109a1a0 (7, 0x31): phase 1 L2 M66 (0x242; e+0xcae0 a clamped time from the target's distance); its end -> phase 2 L2 M67 (0x243),
    his block moved (0xbf4d4 / 0xbf6b8), e+0xcac0.. = the block's words; phase 2 turns him 0x8000 (0x76dd0) and at tune 0x21 (48)
    makes sp_01 8 with THOSE saved words, +0x3c the block's +0xb0a.
  - 0x109a5b4 (7, 0x32..0x35): (7, 0x34 / 0x35) phase 1's end moves his block, sets L2 M71 (0x247) and makes sp_01 7 at his point (a tail
    call). (7, 0x32 / 0x33: NOT REACHED by the walk -- (7, 0x33) is (7, 0x32)'s vt+0x3d0 chain; its sp_01 10 named.)
  - NOT BUILT, named: sp_01 0 / 12 / 13 / 14 (ef (999, -1), hit only: the contacts' children, (7, 0x00 / 0x01 / 0x0b..0x0f / 0x14 / 0x15 /
    0x21..0x23)'s p8); (3, 0) / (3, 4) / (13, 0) / (13, 1)'s sp_01 11 / 6 -- the walk reaches no status 3 or 13 action: (3, 0) / (3, 1)
    come from 0x1093018 (below his band), (3, 4) from 0x1095114 (vt+0x3d0), status 13 from no change in his band (the shared reaction
    layer, NOT READ).
- **The classes**:
  - sp_01 0x175 (base01): reader 0x10a25b0 (ef 0 +0x15c8, ef 1 +0x15d0 -- the 0x20 switch's; hit 0; 0x800 by int 0, 0x20 by int 3; &vec 0
    +0x1608; no joint, no timer: it lives while its hit slot does). Mode 7's switch has no ef 0 to stop (0x43b058 on none: nothing).
  - **BASE56** sp_56 0x174, the homing shots: init 0x42dce4, move 0x42e4dc, state 1 vt+0x158 0x42e5e8, flight vt+0x15c 0x42e7b8, end
    0x42e910, contact start 0x42dae8; reader 0x10a2788 (ef 0..3, hit 0, joint int 0, flag 1 by int 1, speed float 0, the life = the COMMON
    float 0 (0x4a2264: 240), vec 0 the start offset, vec 1 the aim offset; bit 1 always).
    - Init: the aim point = vec 1 x his size turned by the block's Z, X, Y words + (flag 1 ? block +0x1d0 : his +0x40); +0x40 = the
      joint's row 3 (joint -1: his +0x40) + vec 0 turned X, Y, Z by the block's words; the words re-aimed at the aim point (X = atan2(-dy,
      |dxz|), Y = atan2(dx, dz)); the velocity (0, 0, speed) turned Z (0), X, Y; ef 0 at +0x40.
    - Move: stepFlight (no acceleration), the words from the velocity, the life (common float 0) counted down, the contact query 0x43ac8c ->
      sp_56's +0x150 0x10a28bc: type 1 ef 2 / type 0 ef 1 (each with the sp_01 0 child, 14 when the shell's mode is 6..11 -- both hit only)
      / type 2 ef 3, at the contact into +0x1604; then the end. 0xfe: the life counted down, both handles gone -> deleted.
- **Viewer**: SHELL_DATA.em086_00 (code 'em086', spawn086). input.ownerMatrix feeds the cone.
- **Check**: dev/shells-valstrax-check.mjs 15/15 -- the six shots each way (a08 / c8 / c8far, their contacts and children), the blasts;
  controls: the facing, the target (two), the floor, the owner, joint 165. Page 3/3. The records (u 10 / 20 / 21 / 30 / 500 / 501) are
  NOT exported yet: recording requested.

## Addenda 2026-10-20 (shells agent; the draw table's gaps, decode helpers' <archive> gapA / gapD)

- **Kirin (1)**: the status-2 strikes (2, 0xb..0xe) L4 M2 phase 1 f84 sp_11 17 / 16 / 19 / 18 and (2, 0x20..0x23) L0 M11 / M12 f10
  sp_11 25 (census cen11_ed011_a; setups 0xd6f978.. / 0xd6f66c.. READ, as (7, 3)'s; issued g1 s14..s17 / s46) are BUILT -- the only
  makers of sp_01 2 / 3 (u 30). (2, 0x24..0x27) (sp_11 24) are in no stream.
- **Old Fatalis (3)**: (7, 0x49) is BUILT (0xd8716c READ: the pitch from joint 3's point + (0, -91.6, 132.8) to 1600 short of the
  target, clamped to 0x2000; act013 `pitch49`). sp_01 9 (u 110 / 111) is made by the storm 0xd87630 in (7, 0x50) phase 4 on L4 M4
  (P+0x1bc 90 / ctl+0x3c 27.47 timers, random stage points, the ray's hit byte) -- BUILT (storm013). Correction: u 100 is mode 5's
  switch record (meteors, the aimed strike), u 110 mode 9's (the storm); the aimed mode-5 strike 0xd87464 needs a hunter: not built.
- **Valstrax (9)**: (7, 0x33) is reached -- (7, 0x32 / 0x34 / 0x35)'s phase 6 (0x109ac48) changes to it after tune float 0x28 (150)
  with e+0x7420 set; its phase 3 makes sp_01 10 (u 140) at L2 M73 f2 (BUILT). (3, 4) (0x109699c) makes sp_01 6 (c 30) at L0 M36's
  start within 900 of the ground, from 0x1095114's second area query (BUILT). (3, 0) / (13, 0) / (13, 1)'s sp_01 11 makers are READ,
  their issuers are NOT (the shared layer's 14 NN ff streams): not listed. (3, 0) / (3, 1) do not come from 0x1093018 (uEm085_00's;
  rom-map Withdrawn). sp_01 9 (u 502): no maker (census of every 0x175 create, control: modes 0..8 / 10..14).
- **Kushala (4)**: his frame handler vt+0x208 `0xdeffc4` past the barrier (0xdf00fc..0xdf10b4, READ whole; decode helper gapF) makes
  sp_01 0 (L2 M2 f50), 4 / 3 (L2 M18 / L0 M5 f184 by the aura level) and THE PULSE: while the wind aura is 1..3 (P+0x1bb, folded by
  ctl+0x18) and the action is in 0xdf0684's set, ctl+0x1c counts to 80 and makes one sp_01 within 1000 of the ground -- 9 / 10, 12 /
  13, 2 / 1 by level, on the ground / in the air. BUILT (perFrame024; a clip other actions also play is refused by name unless its
  row names the action). "No maker makes mode 0" and "made by his makers and the other shells" are WITHDRAWN (rom-map). His aura
  effect e+0xcac4 (id 1000 + level: u 1 / u 0 / u 10) is the effects lane's, not transcribed.

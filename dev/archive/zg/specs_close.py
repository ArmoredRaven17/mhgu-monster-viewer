import os
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
def app(name, text):
    p = os.path.join(D, name)
    s = open(p, encoding='utf8', newline='').read()
    NL = '\r\n' if '\r\n' in s else '\n'
    s = s.rstrip() + NL + NL + text.strip().replace('\n', NL) + NL
    open(p, 'w', encoding='utf8', newline='').write(s)
    print('appended', name)

app('em046_00-effects-spec.md', """
## 6. u 61 and the effect runtime (effects lane, 2026-10-18)

- **0xae997c, READ** (`0xae9938..0xae9b00`): node block +0xbe is the u16 offset of a bounds block (the name is INFERRED from
  its readers). The arm runs when [[g+8]+0x118] bit 27 is clear, the offset is set and node block +0xa2 & 0xf is set: the
  nibble goes into g+0x50 bits 24..27; [+0x20] goes to g+0x80 and [+0x24] to g+0x84; the vec3 [+0..8] goes to g+0x60 and
  the vec3 [+0x10..0x18] to g+0x70, both with w = 0. Otherwise `0xae99ec` clears the nibble. Transcribed in construct.js
  `generatorFlags`.
- **The readers** (found by scanning for +0x50 bit tests over 0x900000..0xc00000):
  - `0xa64894` reads bit 0 as a sphere of [g+0x80] x the owner's scale, bit 1 as a box (owner + scale x the two vec3s) and
    bit 2 as [g+0x84];
  - the cull tests `0xae9bc4` and `0xaec0xx` (`0xae9dc4` / `0xaec1fc` keep a generator outside the view drawn while bits
    24 / 25 are set).
  These are lifted from the recordings `add_em046_00_shellrec_u61` / `_near`, made with `zg/rec61.py`.
- **The control is an e2e check** (`efx/e2e_dump.py --request`, then `dev/effect-e2e.mjs`):
  - u 60 (the neighbouring arm 0xae99ec): 0 bytes differ.
  - u 61: 10 bytes differ. These are the infinite node's mapped-buffer pointers; Barioth's u 320 differs in the same 10.
  - u 61 with the arm switched off in a copy of the runtime: 20 bytes differ. The extra 10 are g+0x50's nibble = 1 and
    g+0x80 = 992.3, on both generators.
  - (A plain e2e_dump without `--request` hangs at 0x7abfbc. The infinite node's buffer constructor 0x86772c calls through
    the NVN pointer 0x1918704, which only proofunit stubs: a harness path, not the ROM.)
- **0x881e38 is closed.** `0x881d94` is the view's sphere test, read whole. It is a native in bridge.js, checked against the
  ROM in unicorn: `zg/sphctl.py` + `sphctl.mjs`, 3000 cases, 0 differ.
  - The lifted copy (from the first recording) was replacing the native because proof.js imports bridge.js before
    lifted-added.js. cpu.js now lets a hand native win over a lift. The only other address with both is proof.js's
    0xa91c48, a deliberate native that already wins.
  - 0x881d94 was taken back off the lift line.
- u 61 exported again (`fb/export_plain.py em046_00 em046_00u:61`).

## 7. The slot pool (effects lane, 2026-10-18)

`0x418d4` is not "the pool is full". It is the free-slot finder `0x4187c` stepping past a full first word.

- The finder (READ whole, `0x4187c..0x419dc`) has five 32-bit words per bank at mgr + 0x74 + 20 bank, banks 0..2 (> 2
  reads as 0). It takes the lowest clear bit through the de Bruijn table at mgr+0x770, adds 32k, and returns -1 when all
  five words are full.
- The caller `0x41808` maps kind 2 -> bank 1 and 3 -> bank 2. It stores the object at mgr + 0xb0 + 0x240 bank + 4 slot
  BEFORE its `pophi` (slot > 0x8f). So a full pool leaves the new object unregistered, and that store lands one word
  below the bank, as in the ROM. Nothing stops.
- 0x4187c is a native in bridge.js, controlled against the ROM in unicorn: `zg/poolctl.py` + `poolctl.mjs`, 3000 random
  bitmaps (242 full, 1539 past word 0), 0 differ.
- No pool-filling recording was needed: the finder is a leaf, and the native covers every branch.
- The shells checks' LOOPS switch is on (Mizutsune L2 M55 / M58 / M61, Soulseer L2 M69 / L0 M15, 1500 frames each).
""")

app('em086_00-effects-spec.md', """
## 5. The class requests (closing the open reads, 2026-10-18)

- **Key table [0x16a2edc]:** 1001 -> 100, 1002 -> 110, 1003 -> 120, 1004 -> 130, 1005 -> 200, 1006 -> 1120, 1007 -> 1130,
  1008 -> 1121.
- **The frame handler vt+0x208 `0x109ed50`:**
  - The aura e+0xcb1c is u 200 calm and u 1120 enraged. It is u 1130 once part 0's level (0x9d36c) reaches the .dtp byte
    at 0x109ee90 / 0x109ee94: A[1] bytes 1 / 2 by rank, both 2, i.e. the head broken (set 6). It stops when dying.
  - The glow e+0xcb14 is u 1121 while e+0xcb10 is 0 or 1. On states 2..6 it fades out by [0x16a2fa0][state-2] x dt
    (1/60, at once, at once, 1/30, 1/10) and stops at alpha <= 0. The viewer keeps the stop at that frame count; the fade
    itself is not shown.
  - Every 180 frames, enraged, it makes a shell: not an effect.
- **e+0xcb10 per action** is set at the action start by vt+0x204 0x109f830 (0x10a0884). Calm forces it to 3 (0x10a08d4).
  Enraged, read with hookbyte.py over every action:
  - 2 for status-7 numbers <= 0x30, except 0x13 / 0x1f / 0x20 / 0x24..0x29;
  - 4 for (1, 5) and (10, 0x1d / 0x1e);
  - 5 for (3, 0 / 1 / 5 / 6);
  - left as it was by (7, 0x31 / 0x32 / 0x34 / 0x35);
  - 0 for everything else.
- **THE COMET:** `0x109a5b4` handles (7, 0x32 / 0x34 / 0x35) and `0x109b07c` handles (7, 0x33). The phase byte is
  P+0x1a1 (classreq.py `PPOKE`). The tune floats come from em086_00_actiontune.fup, read through 0x3cb330.
  - **u 110 (1002), L1 M5 frame 30 (copy B).** Phase 3 sets L1 M5 and P+0x1bc = tune float 0x24 (30). When it expires,
    motion goes to 0xffff (no clip) and id 1002 is requested (0x109ab60).
  - **u 100 (1001), on no clip.** Phase 5 flies him unseen for tune float 0x25 (90 frames), then requests it into e+0xcb18
    (0x109af40).
  - **u 120 (1003), on no clip.** (7, 0x33) phase 0 (motion 0xffff) stops u 100 and requests it (0x109b2dc).
  - **u 130 (1004), L1 M5 held (copy C).** Phase 1 runs past motion 0xffff's end and tune float 0x29 (60), sets L1 M5 and
    requests it into e+0xcb18 (0x109b7d8). It is held through phase 2's fall until he lands (P+0x44 vs P+0x1d4 + c,
    0x109b440), which stops it and sets L2 M73.
  - L1 M5 copy A is his other L1 M5 plays: (3, 0 / 1 / 5), (12, 0), (13, 0).
- **Wired:** CLASS_TIMERS.em086_00 (aura, glow, head-broken key), MOTION_STATES '1|Motion[5]' A / B / C, CLIP_ACTIONS and
  CLIP_VARIANTS. u 1120 / u 1121 retagged from ragePuff to event; u 110 / u 130 / u 200 / u 1130 exported (--states) and
  recorded.
""")

app('em058_00-effects-spec.md', """
## 5. The class requests (closing the open reads, 2026-10-18)

- **Key table [0x169f370]:** 1001 -> 0, 1002 -> 1, 1003 -> 3, 1004 -> 2, 1005 -> 1120, 1006 -> 1121, 1007 -> 100,
  1008 -> 101, 1009 -> 102.
- **The frame handler vt+0x208 `0xf09308`:**
  - **The aura e+0xcb70 (0xf099cc):** u 0 calm, u 1 enraged, shown unless the status is 7 and the action is not (7, 0xc).
    On those it is hidden: u 3 fires once and the alpha goes to 0. The viewer drops the hold; the fade back in (+0x180) is
    not shown.
  - **e+0xcb78** holds u 100 (u 101 when e+0x15fb == 1).
  - **Enraged,** every 30 frames (countdown e+0xcb80): u 1120 (u 1121 when e+0x15fb == 1). This is his puff; he has no
    shared one.
  - **Dying:** both handles are stopped, and once (e+0xcb7c) u 2 and u 102 fire.
- **(10, 0x6c / 0x6d), 0xf09240:** c 1600 / c 1601 (c table [0x169f364]). Both are type 20 and not built: named.
- **Wired:** CLASS_TIMERS.em058_00. u 1120 / u 1121 retagged to event; u 0 / 1 / 2 / 3 / 100 / 101 / 102 exported and
  recorded. u 1120_stop's recording hangs on the harness's delete timing (section 7).

## 6. e+0x15fb (the alternate head sets)

- **One writer:** `0xf091ac` sets it to 1, on vt+0x204 for the action (10, 0x8e), an empty script. Nothing clears it.
- **Where (10, 0x8e) comes from:** it is reaction code 0x1a (the dispatcher 0x9a76c, table 0x9a81c, case 26). 0x97d20
  picks code 0x1a at `0x99280` when P+0x380 >= P+0x370 / P+0x374 and P+0x3a8 bit 16 is set, with bit 15 clear or posture
  3. So it is a one-way HP-fraction state.
- **What it shows:**
  - The part pass 0xf09d0c draws head sets 15 / 16 / 17 in place of 1 / 8 / 9. These are the same parts plus groups 25 /
    27 / 28 (monsters.json groups).
  - u 1121 for the puff and u 101 for the hold.
  - Other readers: 0xf07ce4 (an action), vt+0x1fc 0xf08e28, vt+0x214 0xf0a478, vt+0x23c 0xf0a650.
- **Not a Parts row:** it is a class state, and no break reaches it. It is wired as CLASS_CONTROLS.em058_00 (HP State:
  Before / Past the threshold), read by the timers and by STATE_OVERLAY.em058_00. STATE_OVERLAY gained an `on` test, and
  showParts takes the control.

## 7. The tail sever and a recorder hang

- **The sever, (10, 0x72):** the script is empty (0x17cca80) and setMotion is never called, so 0xc2274(e, 0, 0, 0x8e)
  cuts the tail from joint 142 at the action's frame 0, over the motion already running. The game shows the tail leaving
  in the middle of whatever he is doing. No clip frame exists to bind the drop to.
  - The viewer's cut tail flies only on a `drops` row's clip, from its start.
  - The natural stand-in is to fly the tail when the Tail row is switched to Severed. That is Raven's call: not built.
- **u 1120_stop (and Kirin's u 60_stop) hang at 0x7abfb8.** The cause:
  - The harness destroys a state-3 unit at the end of the frame it ended in (proofunit.unit_frame, the last loop).
  - The game's update walker 0xc044c4 only turns it 3 -> 4 (0xc045c0) on the next pass, and destroys it (vt+4,
    0xc045e0) on the pass after.
  - So the recorded stop (0x329c40 -> 0x329904, vt+0x128) walks onto a corpse whose vtable is cUnit 0x17828bc. +0x128 is
    0, so blx 0 runs the static initialisers, whose DTI self-link makes the walk endless.
  - dtorwatch.py shows it: DTOR 0x506e5e80 after unit frame 60, then WATCH-EXEC at 0 with r0 0x506e5e80.
  - The fix is the walker's 3 -> 4 -> delete order in proofunit.py. NOT APPLIED: it is the shared harness, for the
    coordinator's go-ahead.
""")

app('em050_00-effects-spec.md', """
## 5. The class keys (2026-10-18)

- **His only class request is `0xecce84`,** in vt+0x208 0xecce08. While enraged, every 30 frames (e+0xcb04), id 1001 =
  u 1120, or id 1002 = u 1121 while P+0x1bb == 2 (the blue form). The handler has no dying gate.
- **Ids 1003..1011 have no requester.** Their keys in [0x169ee10] are 531 / 530 / 531 / 12 / 38 / 40 / 11 / 37 / 39.
  - The scan: every vt+0x1d0 call in .text with an immediate id (zg/scan1d0.py). None of those ids is requested from his
    band 0xec480c..0xed0a38.
  - The shared computed-id sites give ids < 1000: 0x70444 (5 / 6), 0x9d534 (5 x part + 7), 0xca3c0 (byte + 0x2f),
    0xa4938 / 0xa49fc (2).
  - Positive control: the same scan finds Amatsu's 0xf09420 / 0xf09554 / 0xf09574 and his own 0xecce84.
  - The two other `#0x1d0` loads in his band (0xecab68, 0xecb29c) read P+0x1d0, a position.
- **Wired:** CLASS_TIMERS.em050_00, keyed by the Form rung (state.level, passed to the step as `rung`). u 1120 / u 1121
  retagged from ragePuff to event.
""")

app('em024_00-effects-spec.md', """
## 6. The sleep hold, read (2026-10-18)

- (10, 0x1e) is script 0x17b4370: op 1 -> 0x17b42bc, then end (fe). The stepper's op 0 / 1 / 2 arm 0x9f33c stores the
  record at P+0x560 and calls setMotion only for ops 0 / 2 / 0x35 (0x9fea8..0x9febc). The tracer shows no motion call.
- So the hold is the clip (10, 0x1d) leaves running: L3 M55, its last op. The row moved from L3 M10 to L3 M55; the L3 M10
  reading is withdrawn in rom-map.
- The same read for Chameleos ((10, 0x1e) 0x17b5aa0: op 1, end) gives L3 M10, which the row already used: now READ. For
  Teostra ((10, 0x1e) 0x17b7210) it gives L3 M17 (dev/em027_00-effects-spec.md 6).
""")

app('em027_00-effects-spec.md', """
## 6. The sleep hold, read (2026-10-18)

- (10, 0x1e) 0x17b7210 = op 1 -> 0x17b739c, then end. Op 1 sets no motion (dev/em024_00-effects-spec.md 6), so the hold
  is L3 M17, the last clip of (10, 0x1d) 0x17b7240.
- "op 1 -> 0x17b73a0: wait 200, L3 M5" read that record's words as a script from 4 bytes in: withdrawn.
- Now: L3 M17 copy B holds the zzz c 1102 / 90 and the puff off ((10, 0x1d) / (10, 0x1e)); copy A is (1, 8) and the wake
  (10, 0x44). L3 M5 copy C is gone.
""")

app('em013-effects-spec.md', """
## 5. The stun (2026-10-18)

- **The Fatalis line has no stun hold. That is the ROM.** (10, 0x20) has no case in his status-10 table. The default
  0xd89e74 goes to `0x76088`, a tail call of vt+0x3dc (the next action), so no clip plays and nothing is held. This is the
  same for all three variants and every side (the tracer, four sides).
- **c 1103 is not a clip's.** It is `0xa3ef0`'s, the shared per-frame request, held while any of these is set:
  - P+0x5e08 bit 4 (0xa1f0c(e, 0x10));
  - P+0x5cde == 1 (0x81f48);
  - P+0x59c > 0.
  Which of those his ailments ever set is NOT READ. If any is, the stars show over whatever he plays, and the viewer has
  no state for that: named.
""")

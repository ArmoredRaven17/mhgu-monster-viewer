# Append the re-walk's findings (2026-10-18) to each group spec, in place.
import os
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
H = '\n\n## Re-walk 2026-10-18 (Fanged-Wyvern effects agent): tracer diff, request census, word re-emulation\n\n'
N = {
 'em044_00-effects-spec.md':
  "**L0 M6's request is by action, not by clip.** `0xe86430` (the burrowed travel) maps its own r1: `cmp r5,#1; moveq r1,#2; movne r1,#0; b 0xa499c` "
  "(0xe864f0..0xe86504). Traced per action (reqtrace.py): (6, 6) r1 = 2 -> **u 1400**; (6, 3) / (6, 0xe) r1 = 0 -> **u 1120** "
  "(em044_00_010, joint 3 -- the puff's record, exported again as an event); the walk (2, 0) none. The earlier \"u 1400 held on every L0 M6 "
  "play\" is withdrawn (rom-map Withdrawn). Viewer: CLIP_ACTIONS copies A (2, 0) / B (6, 6) / C (6, 3) + (6, 0xe); MOTION_STATES "
  "'0|Motion[6]' {}, '#B' hold u 1400, '#C' hold u 1120; dev/checks/em044_00.mjs plays all three.\n"
  "vt+0x24c (the mud shed) `0xe8d490`: id 1006 once, behind e+0xcada bit 0x20 -- the tail mud, already the L3 M17 row.\n",
 'em007_00-effects-spec.md':
  "**L0 M7's posture-4 plays make two different requests** (reqtrace.py): `0xa499c(e, 2)` = **u 1400** for (6, 3 / 6 / 0x10 / 0x21 / 0x22 / 0x23 / 0x2a) "
  "(`0xd3bfcc`) and `0xa499c(e, 1)` = **u 1121** for (6, 0xf / 0x17 / 0x1c / 0x1d / 0x24 / 0x25 / 0x28 / 0x29 / 0x2b / 0x2c) (`0xd3c748`, "
  "which the u 1400 sweep closed as \"not a u 1400 site\"); the posture-0 plays (2, 6 / 7 / 8 / 0xc / 0x1a), (7, 0x6a) ask nothing. "
  "Viewer, both variants: CLIP_ACTIONS L0 M7 copies A (posture 0) / B (6, 3) / C (6, 0xf), posture 4; rows '#B' u 1400, '#C' u 1121 (event twin "
  "of the puff record), gated posture 4 as before. The class ids on L0 M1 match the copies already there: (6, 0xe / 0x11 / 0x18) c 1001 = c 30, "
  "(6, 0x1b / 0x26 / 0x27) c 1002 = c 40, (6, 0x32) u 1002 = Bloodbath's UNIQUE 230 (em007_00u has 230 only in SEQUENCE: nothing for Diablos).\n"
  "Bloodbath's (7, 0xb8) reaches L2 M19 only with `0x78b78` answered (0xd3d7a0..0xd3d808, table 0xd3d810 entry 19 -> 0xd3dc18): the CLIP_ACTIONS "
  "entry stands (deep.py FORCE=0x78b78=1, both variants).\n",
 'em033_00-effects-spec.md':
  "**L0 M2's burrow asks u 1121.** `0xe3a5c8` is `0xa499c(e, 1)`: the u 1400 sweep was right that it is not u 1400, and the request it is -- "
  "u 1121 (cm200_007), held while the clip plays -- had no row. Traced (reqtrace.py): (6, 2 / 6 / 7 / 8) ask it; every other L0 M2 play "
  "(the walks, (1, 0xb..0xd), (6, 3 / 9 / 0xc..0xf), (7, 6..0xd), (8, 0)) asks nothing. Viewer: CLIP_ACTIONS em033_00 L0 M2 copies A / "
  "B (6, 2), MOTION_STATES '0|Motion[2]#B' hold u 1121 (an event twin of the puff record); dev/checks/level-copies.mjs.\n",
 'em043_00-effects-spec.md':
  "**L0 M6's u 1400 is (6, 3)'s alone** (reqtrace.py, `0xe770a8`); the walks (2, n), (13, 1), (16, 0xd) play it with none. The row held it on "
  "every play: now copy B (EM043_ACTIONS (6, 3) `variant: 'B'`), both variants.\n",
 'em045_00-effects-spec.md':
  "**L0 M6's u 1400 is (6, 3) / (6, 6)'s** (reqtrace.py, `0xe941b0`); the walks and the curl (6, 2) ask nothing. Now copy B for Uragaan and "
  "Crystalbeard (whose MoguriBaseOfs 0 keeps it unsunk). The class ids: (7, 2) u 1001, (7, 4) u 1003, (7, 0x90) u 1005 (phase 1 / 1 / 4). "
  "CLIP_ACTIONS L2 M3 confirmed: (7, 2) / (7, 4) reach it once P+0x1a2 (the roll count, raised at each L2 M2 end) is >= 4 (`0xe95c3c..0xe95c88`), "
  "(7, 0x90) at phase 4 (`0xe990b0`).\n",
 'em055_00-effects-spec.md':
  "**L0 M6's u 1400 is (6, 5) / (6, 6)'s** (reqtrace.py, `0xed6354`); (6, 3) and the walks play it with none -- now copy B. (6, 4) plays its "
  "turn table `0x169ee4c` (L0 M15 / M4 / M3), which a tracer sweep cannot see (rom-map trap 94).\n",
 'em063_00-effects-spec.md':
  "**L0 M10's u 1400 is the burrows' (6, 2 / 3 / 6)** (reqtrace.py); the walks and the (7, n) plays set L0 M10 with none -- now copy B, both "
  "variants. **The arm rows are at [e+0xcacc]**, not ctl = [e+0xcac0]: `ldrh [[e+0xcacc] + 0x2c]` / `+ 0x20` (0xf469c8..0xf46a00); "
  "re-emulated with them there -- 657920 runs, 0 mismatches, 72 words (the transcription was right; the earlier emulation matched with both rows unread).\n",
 'em018_00-effects-spec.md':
  "**Deadeye's held u 30 is shown now.** vt+0x208 `0xda528c`, variant 4: 0x81bb0(e, 0) (P+0x5e08 bit 0 or P+0x522 -- the eye-shut test) or "
  "vt+0x3f4 (dying) -> the handle e+0xcae0 stopped (0x329c40(h, 0)); else with none held vt+0x1d0(1001) = u 30 (em018_04_003, joint 3). "
  "Exported (event, stop) and held by CLASS_TIMERS.em018_04 while his eyelid set 2 is not shown (his sleep rows and deaths draw it, no other row) "
  "-- dev/checks/em018_00.mjs asserts it at rest, off asleep, back awake; Garuga has none.\n",
 'em002-effects-spec.md':
  "**Silver Rathalos plays (7, 0xf5) too.** The line's g1 s224 / s235 issue it in op 0x6f(0xe)'s default -- vt+0x214 `0xcf15c8` selector 0xe "
  "(`0xcf1828`) = [ctl+0x2c] >= 0.0, no em or variant test -- and it plays L4 M38 for every variant (tracer). Silver's pick list left it out "
  "because his shell00 has no mode 31, which also took away the word's (7, 0xf5) play (bits 6-12 cleared: u 230 / 231 / 232 / 221 off). "
  "Listed now with no spawn (shells.js em002_02, op24 'else').\n",
 'em003_00-effects-spec.md':
  "Tracer diff: every CLIP_ACTIONS entry plays its clip once the landing is answered -- `0xbf52c` == 1 and [P+0x14] < 0 (stored from the float "
  "getter 0xc1010, +15.0 for (7, 0x57)) -> L2 M5 at phase 2 (`0xd167e8`); (7, 0x12) L2 M39 needs the current motion 0x235 (`0xd188d4`). "
  "The tracer's leftover s0 made those landings run-order noise in a plain sweep (rom-map trap 92).\n",
 'em005_00-effects-spec.md':
  "(6, 3) asks `0xa499c(e, 2)` (u 1400) on L0 M7 as Basarios does (`0xd27be4`, one class) -- em005_00u holds no key 1400, so nothing shows and "
  "no copy is made for him. His word re-emulated with the real .dtp +0x64 rows and part levels (jscheckpd.py LV=0,5,6: the gas arm's part 0 vs "
  "bytes 1 / 2, the ctl+0x24 latch's parts 5 / 6 / 0). L2 M31 / M32 are (7, 0x32)'s blend partners (r2 of 0xb03f8, 0xd29648..0xd2969c).\n",
 'em042_00-effects-spec.md':
  "Tracer diff: (7, 0x11) reaches L2 M8 once `0xbf4e4` answers (0xe6c400..0xe6c448 -> 0xe6c560); the CLIP_ACTIONS entry stands.\n",
}
for f, t in N.items():
    p = os.path.join(D, f)
    s = open(p, encoding='utf8', newline='').read()
    NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
    if 'Re-walk 2026-10-18 (Fanged-Wyvern' in s: print('already', f); continue
    open(p, 'w', encoding='utf8', newline='').write(s.rstrip() + (H + t).replace('\n', NL))
    print('ok', f)

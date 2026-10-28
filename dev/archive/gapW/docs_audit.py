import os
ARC = '<archive>' + chr(92) + 'gapW' + chr(92)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(R, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
d = raw.replace('\r\n', '\n'); lines = d.split('\n')
i = [k for k, l in enumerate(lines) if l.startswith("| Alatreon's (7, 0x19) meteors (L2 M21) -- their life and floor, READ 2026-10-26 (shells lane) |")]
assert len(i) == 1
row = ("| Alatreon's postures, every action -- AUDITED 2026-10-26 (shells lane) | his action main vt+0x1f4 `0xeccc1c` run under unicorn for every "
       "(status 0..0x11, number), phase 0..7 x sub-phase 0..3, calls out of the band answered 0 / 1 (" + ARC + "actpost.py, actpost.json; 119 actions): "
       "the posture each setMotion is played in. Every `0xbc984` takes FlyOfs (`0xbf4d4` before it). POSTURE 3 only: L1 M2 / M4 / M6 / M7 / M8 / M9 / M11 / "
       "M12 / M15 / M20, L2 M8 / M9 / M10 / M11 / M12 / M18 / M19 / M23, L3 M53 / M54. TWO postures, one ground (FlyOfs x S below the drawn body): L2 M7 / "
       "L2 M21 (3 under (7, 0xf / 0x38 / 0x39 / 0x3f), (7, 0x19); 1 under (7, 0x20), whose drops take the arena's points), L2 M24 (3 under (4, 7), 1 under "
       "(3, 3)). ROWED: all of those, posture 3 (motion-states.js AIR_HEIGHT.em050_00, standard false). NOT ROWED (named): L1 M1 (posture 1 after the takeoff "
       "(7, 0x1f) -- L1 M19's rise curve `0x17c7194`, ~2296 over 361 frames -- and posture 3 in (0, 6) / status 4: two heights); L1 M17 ((4, 0xa), curve "
       "`0x17c7124`), L2 M2 ((7, 5 / 6), curve `0x17c71dc`), L1 M19: posture 1 on a velocity curve and the 0xbf284 clamp (his P+0x92c not read); posture 0's "
       "clips keep the standard floor. His P+0x5c (the drawn body's offset) not read: L1 M4 / L3 M53 hang 931 / 617 below their origin (size 1), past the "
       "500 line. METERED, each clip one play before (the row taken out of the live table) and after, a fresh runtime per pass, 300 steps after the end "
       "(" + ARC + "posmeter.mjs, pos2.out): the floor moves from the stand-in (-1132 .. 0) to -600 (500 x his 1.2) on every one, the unit to the ground; "
       "79 records started after, every one draws (some off camera, as before); the start differences are the pick's rotation (L2 M9's sp_41 modes) and one "
       "c 4 start on L2 M7 | uEm050_00 / viewer | R (emulated) + built | " + ARC + " |")
lines.insert(i[0] + 1, row)
out = '\n'.join(lines)
if crlf: out = out.replace('\n', '\r\n')
open(R + '.tmp', 'wb').write(out.encode('utf-8')); os.replace(R + '.tmp', R); print('ok rom-map')
A = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\air-height.md'
raw = open(A, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
add = ("\n### Alatreon, every clip (audit 2026-10-26)\n\n"
       "The action main run for every action (<archive>/gapW/actpost.py) gives the posture each clip plays in. Posture 3 rows (the unit the\n"
       "ground, the body FlyOfs x S = 600 above it at his 1.2): L1 M2 / M4 / M6 / M7 / M8 / M9 / M11 / M12 / M15 / M20, L2 M7 / M8 / M9 / M10 /\n"
       "M11 / M12 / M18 / M19 / M21 / M23 / M24, L3 M53 / M54. Where a clip plays under posture 1 as well (L2 M7 / M21 in (7, 0x20), L2 M24 in\n"
       "(3, 3)), the posture-1 entry lifts him FlyOfs off the ground, so the ground is the same; the row is posture 3, the plays the viewer's\n"
       "picks stand for. Open: L1 M1 (posture 1 after a takeoff that climbs ~2296 on L1 M19's curve 0x17c7194, posture 3 in status 4), L1 M17 /\n"
       "L2 M2 / L1 M19 (posture 1 on their own velocity curves 0x17c7124 / 0x17c71dc / 0x17c7194 and the 0xbf284 clamp, P+0x92c not read), and\n"
       "his P+0x5c (the drawn body's own offset).\n")
if crlf: add = add.replace('\n', '\r\n')
open(A + '.tmp', 'wb').write((raw + add).encode('utf-8')); os.replace(A + '.tmp', A); print('ok air-height')

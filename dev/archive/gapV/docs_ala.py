import os
ARC = '<archive>' + chr(92) + 'gapV' + chr(92)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(R, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
d = raw.replace('\r\n', '\n')
lines = d.split('\n')
i = [k for k, l in enumerate(lines) if l.startswith('| SHELLS OUTLIVE A ONE-SHOT CLIP -- built 2026-10-26')]
assert len(i) == 1
row = ("| Alatreon's (7, 0x19) meteors (L2 M21) -- their life and floor, READ 2026-10-26 (shells lane) | **the game keeps them ~390 frames**: base41 "
       "(shells.js step41, read whole) holds each 31 + 10 frames (cmn floats 0 / 1), flies (life float 4 = 600, gravity vec 1 (0, -2, 0), vy -16), lands on the "
       "stage query (mask 0x30) with flag 4 -> state 3, a 240-frame hold (float 5), then ef 4 (u 214) and the end (0xfe, deleted when its handles finish) -- "
       "on the page they go at ~392 frames, as in node. **The FLOOR was the viewer's**: (7, 0x19) 0xec9af0 plays L2 M21 (0x215) with no posture call; its "
       "only issuer is (7, 0xf)'s follow `0xecc428` (issuers.py; no EMC stream issues it, control (7, 0xf) at g1 s32), and (7, 0xf) sets POSTURE 3 "
       "(`0xbc7f4(e, 3)` at `0xecc134`); no posture setter in the follow 0x768c8 / 0x76098 or his vt+0x204 `0xec4b3c` (direct calls; the same scan finds "
       "0xecc134 -- deeper calls I). Posture 3 pins the unit to the ground (0xbf284) and draws the body FlyOfs x S above it (0xbf74c); his dtbase FlyOfs "
       "500 (" + ARC + "flyofs.py, loader 0x53800 under tune_emu; controls Seregios / Rathian / Astalos 500, Malfestio 300). The viewer stood the unit at "
       "the clip origin and the floor at the lowest reach, 459 below (stand-in), so the meteors dropped from the drawn body + 2000 and fell 2459 to y -537. "
       "FIX: motion-states.js AIR_HEIGHT em050_00 { flyOfs 500, standard false, L2 M21 posture 3 } -- ground and unit 500 x S below the drawn origin (600 at "
       "his 1.2): they spawn at 1400, fall 2000, hit the floor at -600 and sit at -652 (+0x40 past the contact, the ROM's), all gone 305 steps after the clip "
       "end; u 210 / 212 / 214 / 215 draw, u 211 (the held glow, 2000 up) draws off camera (" + ARC + "alaprobe.mjs / alameter.mjs, ala_before.out / "
       "ala_after.out / alameter.out). His other L2 M21 sites: (7, 0x20) 0xecaed8 in posture 1 (0xbc984(FlyOfs) at 0xecad88) and three that set posture 3 "
       "(0xecb914 / 0xecba20 / 0xecbb18): the ground FlyOfs x S below the body in all | uEm050_00 / viewer | R + built | " + ARC + " |")
lines.insert(i[0] + 1, row)
out = '\n'.join(lines)
if crlf: out = out.replace('\n', '\r\n')
open(R + '.tmp', 'wb').write(out.encode('utf-8')); os.replace(R + '.tmp', R); print('ok rom-map')
A = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\air-height.md'
raw = open(A, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
add = ("\n## Alatreon (em050_00), L2 M21 -- added 2026-10-26 (shells lane)\n\n"
       "(7, 0x19) plays L2 M21 in POSTURE 3, set by (7, 0xf) at 0xecc134 (its only issuer, the follow at 0xecc428); FlyOfs 500 (dtbase, loader\n"
       "0x53800). So the unit is the ground and the body is drawn 500 x S above it: `AIR_HEIGHT.em050_00 = { flyOfs: 500, standard: false,\n"
       "clips: { '2|Motion[21]': { posture: 3 } } }`. His (7, 0x20) plays L2 M21 in posture 1 (0xbc984(FlyOfs) at 0xecad88: the unit with the\n"
       "body, the ground the same 500 x S below). No standard takeoff rule is read for him (`standard: false`). rom-map row \"Alatreon's (7, 0x19)\n"
       "meteors\".\n")
if crlf: add = add.replace('\n', '\r\n')
open(A + '.tmp', 'wb').write((raw + add).encode('utf-8')); os.replace(A + '.tmp', A); print('ok air-height')

import os
ARC = '<archive>' + chr(92) + 'gapX' + chr(92)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(R, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
d = raw.replace('\r\n', '\n'); lines = d.split('\n')
i = [k for k, l in enumerate(lines) if l.startswith("| Alatreon's postures, every action -- AUDITED 2026-10-26 (shells lane) |")]
assert len(i) == 1
rows = [
 "| Alatreon's P+0x92c / P+0x5c -- READ 2026-10-26 (shells lane) | **P+0x92c: never written by his class** (no `#0x92c` operand in `0xec4890..0xed0834`; control: the same scan finds Seregios's nine, `0xfe31b0`..`0xfe76b4`; the shared layer's writers are the enemy clears `0x6e3a4` / `0xa51f4` / `0xba398`) -- 0: the `0xbf284` posture-1 floor is the bare ground. **P+0x5c: never set** (no `0xbf700` / `0xbf71c` call in the band, no `+0x5c` store on the block; control: Astalos's 17 calls) -- it stays 0, so a posture-3 body is drawn exactly FlyOfs x S above the ground; L1 M4 / L3 M53's deep bones (931 / 617 below the origin at size 1) are the clips' own poses (their `reference` tracks carry no Y travel, glbroot.py) and are drawn as the ROM draws them | uEm050_00 | R (negatives with controls) | " + ARC + " |",
 "| Alatreon's posture-1 heights on the curves -- READ (E) 2026-10-26 (shells lane) | the ROM's own code frame by frame (" + ARC + "emu_rate.py = the air lane's emu_takeoff.Run with the frame stepped by the motion's rate `0xb0900` = e+0x50c, formed by `0xb07b4` from P+0x38c x +0x394 x +0x398 -- trap 169), size 1.2, ground 0, H = FlyOfs x S + D(f): **(7, 0x1f) `0xeca9cc`** L1 M19 lifted 600, curve `0x17c7194` from f198 -> 2899 at f360, then L1 M1 at **2902**; **(4, 0xa) `0xec6db0`** L1 M16 (posture 0), L1 M17 lifted 600 + D (716 at f0, 1298 at f33) down to the FlyOfs line at f85 (`0xbf4e4`) -> posture 3, L1 M1 at 600; **(7, 5) `0xec7f14`** L2 M1 at rate 0.6, L2 M2 lifted 600, rate 0.65 then 0.9 from f28, curve `0x17c71dc` up to 969 at f34, to the FlyOfs line at f47.5 -> posture 0, L2 M3. ROWED (motion-states.js AIR_HEIGHT.em050_00 ALA_CURVE_ROWS, posture 1 `at`): L1 M19, L1 M17, L2 M2 (its _loop piece reads the table from f0: the ROM leaves L2 M2 inside its _start), L1 M1 A (500 x S + 2302) and L1 M1 B (posture 3) | uEm050_00 / viewer | R (E) + built | " + ARC + "l1m19r.txt / l1m17r.txt / l2m2r.txt |",
 "| L1 M1 A / B -- the copy and the copy key (2026-10-26, shells lane; coordinator approved) | motion-states.js CLIP_VARIANTS.em050_00 + '1\\|Motion[1]' (A / B); psl-mask.js CLIP_ACTIONS.em050_00 '1\\|Motion[1]': A (7, 0x1f), (3, 0..4), (0, 3) -- posture 1; B (4, 1 / 2 / 4 / 5 / 6 / 0xa / 0xe), (0, 6) -- posture 3 (the word has no L1 M1 case: no bit moves); **airLift** reads `'list\\|Motion[N]#B'` before the bare key, **index.html airNow** passes `clip + '#' + state.clipVariant`. Every other AIR_HEIGHT monster resolves the same: 4320 lookups against the file with the old lookup, 0 differences (" + ARC + "aircmp.mjs); page spot check Rathian L1 M4, Seregios L1 M5, Astalos L4 M26, Malfestio L2 M35, Deviljho L2 M3 (no row) mount and play. METERED (" + ARC + "curvemeter.mjs, curve.out; before = the row out of the live table): L1 M19 floor -1142 -> -600 / -2794 (f325), L1 M17 -1216 -> -1111 / -1013 / -600, L2 M2 _start -1013 -> -681 / -891 / -625, L1 M1 A -546 -> -2902, L1 M1 B -> -600 with the unit on the ground; every record that started draws, the same before and after (L2 M2's u 451 starts on some plays and not others, in both passes) | viewer | built | -- |",
]
for k, r in enumerate(rows): lines.insert(i[0] + 1 + k, r)
import re
t = [k for k, l in enumerate(lines) if re.match(r'^\d{1,3}\. \*\*', l)]
last = max(int(lines[k].split('.')[0]) for k in t)
li = [k for k in t if lines[k].startswith(str(last) + '. ')][0]
lines.insert(li + 1, str(last + 1) + ". **A harness that steps the motion frame by 1 holds a rate-set action (2026-10-26, Alatreon (7, 5)).** emu_takeoff advances the frame by 1.0 whatever the motion's rate; the class's `0xb07b4` sets P+0x398 and the curve sampler `0xc1010` multiplies by e+0x50c = P+0x38c x +0x394 x +0x398, which the harness never seeded -- so L2 M2 sat at 623 for 230 frames. Seed the speed's factors and step the frame by `0xb0900` (" + ARC + "emu_rate.py).")
out = '\n'.join(lines)
if crlf: out = out.replace('\n', '\r\n')
open(R + '.tmp', 'wb').write(out.encode('utf-8')); os.replace(R + '.tmp', R); print('ok rom-map trap', last + 1)
A = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\air-height.md'
raw = open(A, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
add = ("\n### Alatreon's posture-1 heights and L1 M1's two (2026-10-26)\n\n"
       "P+0x92c is never written by his class (0: the bare-ground floor) and P+0x5c never set (the posture-3 body exactly FlyOfs x S up).\n"
       "Emulated on his own code (<archive>/gapX/emu_rate.py -- emu_takeoff with the frame stepped by the motion's rate): (7, 0x1f) L1 M19\n"
       "lifts 600 (size 1.2) and climbs on curve 0x17c7194 to 2899, L1 M1 then at 2902; (4, 0xa) L1 M17 hops on 0x17c7124 (1298 at f33) back\n"
       "to the 600 line at f85, posture 3; (7, 5) L2 M2 leaps on 0x17c71dc at rate 0.65 / 0.9 (969 at f34) to the 600 line at f47.5, then\n"
       "posture 0. Rows: L1 M19 / L1 M17 / L2 M2 `at` from those (the curve part unscaled), L1 M1 A `at` 500 x S + 2302, L1 M1 B posture 3\n"
       "(the copy: CLIP_VARIANTS / CLIP_ACTIONS; airLift reads the '#B' key).\n")
if crlf: add = add.replace('\n', '\r\n')
open(A + '.tmp', 'wb').write((raw + add).encode('utf-8')); os.replace(A + '.tmp', A); print('ok air-height')

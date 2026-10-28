import os, re
ARC = '<archive>' + chr(92) + 'gapY' + chr(92)
R = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
raw = open(R, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
d = raw.replace('\r\n', '\n'); lines = d.split('\n')
i = [k for k, l in enumerate(lines) if l.startswith('169. **A harness that steps the motion frame by 1 holds a rate-set action')]
assert len(i) == 1
lines[i[0]] += (" **[AUDITED 2026-10-26, shells lane: every handler the air lane ran through emu_takeoff (air-height.md 1.3 / 2 / 5.2: Seregios "
                "(3, 0) / (3, 1) / (3, 0x50), Rathian (3, 0) / (0, 6) / (4, 4) / (4, 5) / (4, 0xc) / (4, 3) / (7, 0x24) / (7, 0x78) / (7, 0x2d), "
                "Astalos 0x101d348 / 0x101d494 / 0x10247ec, Malfestio 0xff3ec4) re-run rate-stepped beside the old stepping (" + ARC + "ratediff.py): "
                "every one at rate 1.0, unit and drawn heights identical at every (motion, frame). Statically, over each handler and the in-band "
                "functions it reaches, the only rate call is Rathian's (4, 4) / (4, 0x15) `0xcfb0ec` (1.1, gated on e+0xb5f4 == 1 and e+0xb5f5 == 2; "
                "positive control: the gated run shows 1.1, and Alatreon's (7, 5) shows its 0.6 / 0.9 in the same scan), whose rows are RATH_LOW's "
                "constant (P+0x5c's -75 target, no curve): no row changes, nothing to re-meter. Kecha's hang 0xf51fc4 (not an emu_takeoff row) makes "
                "no rate call either.]**")
out = '\n'.join(lines)
if crlf: out = out.replace('\n', '\r\n')
open(R + '.tmp', 'wb').write(out.encode('utf-8')); os.replace(R + '.tmp', R); print('ok rom-map')
A = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\air-height.md'
raw = open(A, 'rb').read().decode('utf-8'); crlf = '\r\n' in raw
add = ("\n### The rate audit of the emu_takeoff rows (2026-10-26, rom-map trap 169)\n\n"
       "emu_takeoff stepped the motion frame by 1.0 whatever the rate. Every handler above was run again with the frame stepped by the\n"
       "motion's rate (<archive>/gapY/ratediff.py, beside the old stepping): all at rate 1.0, the heights identical. The only rate call in\n"
       "any of them, or in the functions they reach, is Rathian's (4, 4) / (4, 0x15) 0xcfb0ec (1.1, for e+0xb5f4 1 / e+0xb5f5 2), whose rows\n"
       "are the constant RATH_LOW. No row changed.\n")
if crlf: add = add.replace('\n', '\r\n')
open(A + '.tmp', 'wb').write((raw + add).encode('utf-8')); os.replace(A + '.tmp', A); print('ok air-height')

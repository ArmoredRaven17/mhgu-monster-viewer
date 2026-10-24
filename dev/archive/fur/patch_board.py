# Insert the fur-strobe task under the board's Monsters header, byte-level (the board carries NUL bytes; keep them).
import sys
P = r'C:\Coding Repos\MHGU-TASKS.md'
b = open(P, 'rb').read()
if b'em023-fur-check.md' in b: sys.exit('already there')
anchor = b'## Monsters (`MHGU-Monster-Viewer`, built 2026-09-04, deployed as TEST)\n'
if b.count(anchor) != 1: sys.exit('anchor count %d' % b.count(anchor))
item = ("- [ ] (bug) **Both Rajangs: the raised fur strobes -- the viewer's, not the ROM's** (Raven, 2026-10-17: \"Double check the\n"
"      fur rendering, it is currently strobing\"). READ (dev/em023-fur-check.md): m01_hairline's `Angry` is a 1-frame LOOP\n"
"      (fDiffuseColor 1.0 -> 0.6), sampled at (t*60)%1 after clipPicker's start->steady hand-off (monster.js :11217..11225,\n"
"      STATE_NAMES :9779). uEm023_00 never names `Angry`: Rajang holds Angry_Start f60 while enraged, Furious from spawn.\n"
"      Fix for the Viewer agent: SUPPRESS_CLIP.em023_00 `Angry` on m01_hairline + m02_hair_a; ROM_SPAWN_CLIP.em023_05\n"
"      both = 'Angry_Start' (measured in-page: strobe gone). Separate, INFERRED: the eye never gets a clip in the ROM\n"
"      (ctl+0x3c ends on m03_pumpup_arm) but the viewer ramps it 1 -> 2 on rage -- Raven's call.\n").encode('utf-8')
b = b.replace(anchor, anchor + item, 1)
open(P, 'wb').write(b)
print('ok', b.count(b'\0'), 'NULs kept')

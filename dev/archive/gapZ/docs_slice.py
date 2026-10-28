# docs_slice.py: Khezu's (7, 0x4d) slices into rom-map.md and hyper-states.md (append-only, in place).
import sys
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
A = '<archive>' + chr(92) + 'gapZ' + chr(92)
def load(p):
    b = open(p, 'rb').read().decode('utf8'); return b, ('\r\n' if '\r\n' in b else '\n')
P = D + r'\rom-map.md'
s, nl = load(P)
if "Khezu's lightning, the whole of `0xd16e08`" in s: print('already'); sys.exit(0)
L = s.split(nl)
j = [i for i, l in enumerate(L) if l.startswith('| Hyper ShellElements -- who reads the unit scale')]
assert len(j) == 1; j = j[0]
rows = [
('| Khezu\'s lightning, the whole of `0xd16e08` (READ 2026-10-27, shells lane; Raven: "the lines are much larger and part of the AoE '
 'attack, they create slices like a pizza") | the number switch sends (7, 5 / 0xe / 0x35 / 0x46 / 0x47 / 0x4d) to one handler with '
 'index 0 / 4 / 1 / 2 / 3 / 5 (args). Phases `0xd16e50` (offsets): 0 `0xd16e8c` sets L2 M3 (0x203, blend 8); 1 `0xd16ed8` arms at 160.0 '
 '(`0x7ded8`, 0x25) and at 176.0 (`0xb0974`) runs the index table `0xd16f30` (offsets): index 0 `0xd16f48` modes 0 / 1 / 2 (or 3 / 4 / 5 '
 'by `[+0x73e8] & 3`), **1 `0xd17df8` none**, 2 `0xd17304` mode 20, 3 `0xd173dc` 6 / 7 / 8 (or 9 / 10 / 11), 4 `0xd17630` 12 / 13 / 14, '
 '5 `0xd1780c` 15 / 16 / 17 (each `str rN, [setup, #8]` then `0x48b884`). The tail `0xd17df8`: at 254.0 (`0xd17f50`; index 5: 200.0, '
 '`0xd17f54`) -- every index but 5: phase + 1 and L2 M13 (0x20d, blend 2, `0xd17e58..`); **index 5: phase 3 and L2 M3 AGAIN, '
 '`0xafce8(e, 0x203, blend 20.0, start 40.0)` (`0xd17e30..0xd17e54`)**; phase 3 `0xd17130` makes **modes 18 / 19 at 176.0** of that play '
 '(`0xd17190` / `0xd1725c`) and at 254.0 goes to L2 M13. So (7, 0x4d) is FIVE bolts: 0 / +55 / -55 (life 72) and, 136 frames later, '
 '+33 / -33 (life 72): the fan of slices; each runs 40 a move for 71 moves -- reach 2840 from its launch (`' + A + 'w2len.mjs`, the same '
 'with Hyper). (7, 0xe) is three at 0 / +-55 with life 120 (119 moves: 4760, by the same step); (7, 0x47) 0 / +-20; (7, 0x46) one; (7, 0x35) none. The command table '
 'issues (7, 0x4d) from g1 s10 in op 0x0b\'s case 2 (`0b 00 00 .. 0b 01 02 | 14 54 | 00 07 4d`, the switch `0x8e088`, mode 0: P+0x5cb6 '
 'and the target\'s place); **no hyper read in the choice or the handler** (word scans of `0x8e088..0x8eb20` and `0xd16e08..0xd18200`: no '
 'e+0xb720 / +0xca88 / +0xca9c, no accessor slot; Khezu\'s table has no op 0x9b); (7, 0x4d) is in neither held ID\'s ModifyData. Under '
 'Hyper: every bolt x1.3 (ID 1, class 3) -- the look and the hit, not the reach | uEm003_00 | R | render/shells.js SHELL_DATA em003_00 '
 'actions; render/monster.js ROM_ANIMATIONS |'),
('| Khezu\'s bolts\' HIT (READ 2026-10-27, shells lane) | sp_03\'s reader `0xd21b10` reads HitParam int 0 (`0x4a23f4` r1 0, `0xd21b34`) into '
 '+0x15d8, which base00\'s registration (vt+0x164 `0x3f9aec`: +0x15d8 at `0x3f9b04`, vt+0x140 at `0x3f9b4c`) arms as slot 0; the files: '
 'em003_00_03_hit000..011 int 0, hit012..019 int 1, hit020 int 2; hitdata records 0 / 1 / 2 alike (delay 0, duration 99, kind 1, group 0); '
 'hitsize group 0 = one capsule j0 1001, **+0x40 to +0x1000 (this move\'s point and the last: base03\'s move `0x3fdd0c` copies +0x40 into '
 '+0x1000)**, r 150. So **the lines hit, the wedges do not**: each bolt is a 150-radius capsule over its last step running out along its '
 'own line (x ScaleRate under Hyper: 195); the contact is the plain capsule (shellHitShapes kind 2, no angle term). The viewer had no `hit` '
 'on sp_03 (it never hit the Solid hunter): added (shells.js, the loop after SHELL_DATA) | uShellEm003_sp_03 | R | render/shells.js |'),
('| Khezu\'s (7, 0x4d) -- BUILT (2026-10-27, shells lane) | render/monster.js ROM_ANIMATIONS em003_00 **\'S. Motion 3 (7:0x4d)\'**: pieces '
 'L2 M3_start to 200, L2 M3_start from 40 (blend 20), L2 M13 (blend 2), `motions`, `action` [7, 0x4d]. A Special piece may now carry a '
 'FRAME RANGE (4th element { from, to }: monster.js sequenceClipFor / specialMotionAt, index.html\'s Special builder; a ranged piece is its '
 'own run and, after the same motion, reaches the consumers as a wrap to `from` -- the same action goes on); an entry naming `action` '
 'with `motions` is that action for the shells\' pick (index.html rockInput). shells.js: the (7, 0x4d) row\'s `wave2` (modes 18 / 19 on '
 'the second play\'s 176.0, after the wrap to 40; the first wave not again); the overlay: **Attack Hitboxes now draws the shells\' live '
 'hit shapes** (shells.js shellHitShapesLive -> index.html stepShellHits; a shell the Solid-hunter pass has not counted is shown by its '
 'moves against its record\'s window: a stand-in, named). dev/shells-hyper-check.mjs 28 / 28. **Page** (slot 1, ' + A + 'kzslice.mjs, '
 'kzl.out): Hyper Off / holding 1 / 2, five sp_03 (15 / 16 / 17 at chain frame 177, 18 / 19 at 337), unit null / 1.3, hit r 150 / 195; '
 'top-down grabs with the overlay on at 230 (wave 1) and 372 (wave 2): ' + A + 'slice_off230.png, slice_on230.png, slice_off372.png, '
 'slice_on372.png. NOT READ: the PSL walker on a setMotion of the motion already playing (the viewer\'s wrap to 40 re-arms the bits from '
 '40) | viewer | built | -- |'),
]
L[j + 1:j + 1] = rows
open(P, 'wb').write(nl.join(L).encode('utf8')); print('rom-map ok')
P2 = D + r'\hyper-states.md'
s2, nl2 = load(P2)
anchor = 'and the burst u 1311 at frame 120 are the candidates (section 8).'
k = s2.index(anchor) + len(anchor)
add = nl2.join(['', '', '**The slices (same day; Raven: "they create slices like a pizza").** The fan is (7, 0x4d): Khezu\'s bolt handler 0xd16e08 makes',
 '0 / +55 / -55 at L2 M3 176, then plays L2 M3 AGAIN from frame 40 and makes +33 / -33 at its 176 -- five lines, each a bolt running',
 '2840 out (rom-map "Khezu\'s lightning, the whole of 0xd16e08"). The viewer listed only the first three; built as the Special entry',
 '\'S. Motion 3 (7:0x4d)\'. The lines are what hits (each bolt a 150-radius capsule over its last step, 195 under Hyper), not the wedges',
 'between them; the Attack Hitboxes overlay shows them. Hyper does not pick this action (no hyper read in the command switch or the',
 'handler) and does not lengthen the lines (no unit-scale read in base03): it makes each bolt x1.3.'])
s2 = s2[:k] + add + s2[k:]
open(P2, 'wb').write(s2.encode('utf8')); print('hyper-states ok')

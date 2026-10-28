# docs_scale.py: "who reads the shell unit's scale" into rom-map.md and hyper-states.md (append-only, in place).
import sys
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
A = '<archive>' + chr(92) + 'gapZ' + chr(92)
def load(p):
    b = open(p, 'rb').read().decode('utf8'); return b, ('\r\n' if '\r\n' in b else '\n')
P = D + r'\rom-map.md'
s, nl = load(P)
if 'Hyper ShellElements -- who reads the unit scale' in s: print('already'); sys.exit(0)
L = s.split(nl)
j = [i for i, l in enumerate(L) if l.startswith('| Hyper ShellElements -- the beam base / Deviljho')]
assert len(j) == 1; j = j[0]
row = ('| Hyper ShellElements -- who reads the unit scale +0x60..+0x68 (READ 2026-10-27, shells lane; the hyper lane\'s lead on Khezu\'s "much '
 'larger, added lines") | **Every load of +0x60 / +0x64 / +0x68 in the shell bases `0x3f0000..0x440000`** (' + A + 'rd60.py; no `add rX, rY, #0x60` '
 'pointer form there): the registration\'s s0 argument (base06 `0x401c50`, base25 `0x40f5c0`, base26 `0x40feec`, `0x412670`, `0x4132cc`: '
 '`vldr s0, [r4, #0x60]` then vt+0x140 -- the first half\'s hit scale, which the second half then sets to ScaleRate x factor); base01\'s init '
 '`0x3fae68` (`0x43ab74(+0x1650 x +0x60)`, AFTER the registration vt+0x158 at `0x3fae50`: so the unit stays +0x1650 x ScaleRate -- the '
 'viewer\'s composition, shells.js init011); base34 `0x41817c` / base38 `0x41cfd4` (a growth from +0x60 toward 1.0; no entry names class 34 '
 'or 38); `0x3f7758` / `0x3fb3e4` / `0x418018` / `0x429124` read +0x68 of a GLOBAL (r1 = a PIC load: the frame delta), not a shell. **base03\'s '
 'band has none**; Khezu\'s sp_03 own code none. Every reached class\'s own code (vtable slots in the class bands + callees, depth 3, ' + A +
 'cls60.py): only Gore Magala sp_01 (`0xe46da0` / `0xe46df8`: registration arguments) and the Rath line\'s sp_01 `0xd0e9d4` (`0xd0ea28` '
 '`0x43ab74(lerp(+0x1650, +0x15fc))` every step while +0x1600 > 0 -- it would override ScaleRate, but no listed sp_01 mode has float 1 > '
 '0). base00\'s 0x400 owner-size override after the registration (`0x3f933c..0x3f9350`) is on no reached mode (hyperall.json flag words). '
 'Getter `0x1f680` (`vldr s0, [r0, #0x60]`): no direct caller and no shell vtable slot. **So ScaleRate changes a shell\'s DRAWN size and '
 'its hit radii only: no base or class reads it for travel, spread, length, count or spacing.** Page, the same play state (' + A +
 'kzsame.mjs, kzs2.out; Hyper Off in both -- no motion rate, no aura -- the ShellElements injected through shellExtra in B only): Khezu L2 '
 'M3 (7, 0x0e) at frame 194, the three sp_03 at the same relative places (mode 12 - mode 13 = (590, -307) in both; the plays\' 140-unit '
 'world drift taken out of the camera), unit null vs 1.3: the same strands, each x1.3 (blue pixels 15813 -> 23079, x span 342..990 -> '
 '324..1008); kzsame_A.png / kzsame_B.png. A same-frame parent re-pose (B0) was tried and dropped: the effect units keep their matrices '
 'until the next step. The "added lines" are not the shell scale\'s: on L2 M3 Hyper also plays the motion rates and the burst u 1311 '
 'at frame 120 (hyper-motion.json hooks "L2 M3") -- the hyper lane\'s | enemy-shell bases / classes | R (scan, every site read) | -- |')
L[j + 1:j + 1] = [row]
open(P, 'wb').write(nl.join(L).encode('utf8')); print('rom-map ok')
P2 = D + r'\hyper-states.md'
s2, nl2 = load(P2)
anchor = 'Built in render/shells.js (BEAM02_HYPER); metered on the page'
k = s2.index(anchor); e = s2.index(nl2, k)
add = nl2.join(['', '', '**What ScaleRate changes (same day, the Khezu lead).** Only the drawn size and the hit radii. No shell base or reached class reads',
 'the unit scale (+0x60..+0x68) for travel, spread, length, count or spacing (rom-map "Hyper ShellElements -- who reads the unit scale"):',
 'base03 has no read at all. On the page, Khezu\'s bolts with only the shell scale changed (Hyper Off, the elements injected) land at the',
 'same places with the same strands, each x1.3. Whatever adds lines to his L2 M3 under Hyper is outside the shells: the motion rates',
 'and the burst u 1311 at frame 120 are the candidates (section 8).'])
s2 = s2[:e] + add + s2[e:]
open(P2, 'wb').write(s2.encode('utf8')); print('hyper-states ok')

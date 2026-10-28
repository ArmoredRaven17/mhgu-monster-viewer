# docs_beam.py: the beam base (base02g) and Deviljho rows into rom-map.md and hyper-states.md (append-only, in place).
import sys
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
A = '<archive>' + chr(92) + 'gapZ' + chr(92)
def load(p):
    b = open(p, 'rb').read().decode('utf8'); return b, ('\r\n' if '\r\n' in b else '\n')
P = D + r'\rom-map.md'
s, nl = load(P)
if 'Hyper ShellElements -- the beam base' in s: print('already'); sys.exit(0)
L = s.split(nl)
def find(prefix):
    h = [i for i, l in enumerate(L) if l.startswith(prefix)]; assert len(h) == 1, (prefix, h); return h[0]
i = find('| Hyper ShellElements -- the -1 aura ID (READ 2026-10-27')
old = '**No viewer shell of the class**: Rajang (em023_00) G ID 3 class 2, Agnaktor (em049_00) ID 1 class 2, Zamtrios (em067_00) ID 3 class 2 (no base02 shell in their SHELL_DATA)'
assert old in L[i]
L[i] = L[i].replace(old, old + ' [**RESOLVED the same day**: those are the beam base\'s (base02g, render/beam-types.js), not SHELL_DATA\'s -- row "Hyper ShellElements -- the beam base"]', 1)
old2 = 'em043_00\'s shells carry no reader address in SHELL_DATA, but base04 / base55 have no copy in their bands (-1)'
assert old2 in L[i]
L[i] = L[i].replace(old2, old2 + ' [confirmed: row "Hyper ShellElements -- the beam base / Deviljho"]', 1)
j = find('| Hyper ShellElements -- the -1 rule APPLIED (render/shells.js, 2026-10-27)')
row = ('| Hyper ShellElements -- the beam base / Deviljho (READ + APPLIED 2026-10-27, shells lane) | **Beams**: every beam class of the census (21 + '
 'the base, ' + A + 'b02all.out: vtable +0x158 0x3fd2d8 or +0x150 0x3fc610) has vt+0x140 = `0x43a8b0` and an init that is or reaches base02\'s '
 '`0x3fb9bc` (Zamtrios\'s own `0xf78788` calls it first); that init registers slot 0 (`0x3fbab0..0x3fbaf0`: vt+0x140 when +0x1654 >= 0 and '
 '`0x4a1ad8` twice). base02\'s ctor `0x3fb7f8` (run, ' + A + 'b02check.py): +0x15a8 = 2, +0x15ac = 1, +0x15bc = -1; no init of the family '
 'reaches an aura copy; no +0x15ac writer in base02\'s band. So a beam is class 2, aura -1: Rajang G ID 3 (x1.5), Agnaktor ID 1 (x1.6), '
 'Zamtrios ID 3 (x1.1), Basarios / Gravios ID 1 reach it. What the scale reaches: the shell unit\'s +0x60..+0x68 (its effects\' parent; '
 'base02\'s own +0x60 stores `0x3fc5dc..0x3fc5e4` are the EFFECT units\' (1, 1, length / 100), r7 = [h+0x150+4i], not the shell) and slot '
 '0\'s H+0x14 -- the radius of every hit-line capsule (shellHitShapes R = s x r); the hit line\'s points are world positions (`0x3fc1c8`, '
 'E\' / A\' from the ray), so the beam\'s REACH is not scaled; its look is, uniformly, through the parent. **Deviljho**: sp_04 (vtable '
 '`0x17c0ff4`, init base04 `0x3ff1a0`) and sp_55 (`0x17c12cc`, init base55 `0x42c5cc`), both vt+0x140 `0x43a8b0`; ctors `0x3ff080` / `0x42c484` '
 'run: +0x15a8 4 / 55, +0x15ac 1, +0x15bc -1; neither init reaches a copy; registration from the init (`0x3ff748` when +0x1620 >= 0, '
 '`0x42c90c` when +0x1640 >= 0). His ID 1 entries: class 4 (both files), class 55 (G). **Built**: shells.js BEAM02_HYPER (a base02g beam '
 'with a hit: cls 2, aura -1; unit base = the type\'s ShellScale); dev/shells-hyper-check.mjs 25 / 25. **Page** (slot 1, ' + A + 'bmshot2.mjs / '
 'bmshot3.mjs, bm2.out / bm3.out): Agnaktor L2 M4 holding 1 / 2 -- both beams (em049_00:0 / :6) at unit 1.6, ID 1 (the beam record\'s pixMax '
 'is at the meter\'s 1024000 cap in both passes: screenshots em049_00_off0.png / em049_00_on0.png, the same type, camera and frame 140); Deviljho '
 'L2 M25 (7, 6) holding 1 / 2 -- sp_04 at unit 1.3, ID 1, u 60 pixMax 444427 -> 999620, lit 60 / 61 both (em043_00_off0.png / _on0.png; the '
 'camera pinned at the grab, but he stands nearer the camera in the Hyper pass at the same clip frame -- not read why) | '
 'enemy-shell base02 / 04 / 55 | R (ctors run, registration read) / built | render/shells.js hyperShellElement |')
L[j + 1:j + 1] = [row]
open(P, 'wb').write(nl.join(L).encode('utf8')); print('rom-map ok')
P2 = D + r'\hyper-states.md'
s2, nl2 = load(P2)
anchor = 'shows Khezu\'s three bolts at unit 1.3 holding 1 / 2'
k = s2.index(anchor); e = s2.index(nl2 + nl2, k) if (nl2 + nl2) in s2[k:] else len(s2)
add = nl2.join(['', '**Beams and Deviljho (same day).** The three class-2 entries with no SHELL_DATA shell (Rajang G ID 3, Agnaktor ID 1, Zamtrios',
 'ID 3) name the beam base: every beam class registers from base02\'s init (`0x3fb9bc` -> vt+0x140 `0x43a8b0`) with +0x15a8 2 and +0x15bc -1,',
 'so they take ScaleRate -- the beam\'s look (its unit, the effects\' parent) and its capsules\' radius, not its reach (the hit line\'s',
 'points are world positions). Deviljho\'s breaths sp_04 (base04) and sp_55 (base55) are -1 and class 4 / 55: his ID 1 scales both (x1.3).',
 'Built in render/shells.js (BEAM02_HYPER); metered on the page (rom-map "Hyper ShellElements -- the beam base / Deviljho").'])
s2 = s2[:e] + nl2 + add + s2[e:]
open(P2, 'wb').write(s2.encode('utf8')); print('hyper-states ok')

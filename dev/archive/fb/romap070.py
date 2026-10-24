P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(P, encoding='utf8').read()
assert '### Temnoceran -- the shells' not in s
L = s.split('\n')
i = next(k for k, l in enumerate(L) if l.startswith('### Snake Wyvern -- the shells'))
j = i + 1
while not L[j].startswith('|'): j += 1
while L[j].startswith('|'): j += 1
SP = 'temnoceran spec'
rows = [
  '',
  '### Temnoceran -- the shells: Nerscylla (shells agent, 2026-10-18; dev/temnoceran-shells-spec.md)',
  '',
  '| Address / range | What it is | Class / monster | Status | Detail |',
  '|---|---|---|---|---|',
  '| `0xfab380` (vt+0x158) | registers 0x129 sp_00 / 0x12a sp_00_02 / 0x12b sp_01 / 0x12c sp_13 (immediates); vtables `0x17e3ba0` / `0x17e3d1c` / `0x17e3e98` / `0x17e4008`; res 0x8a7c..0x8a7f | uEm070_00 | R | %s 1 |' % SP,
  '| the makers `0xfa51f0` `0xfa5d44` `0xfa745c` `0xfa7b98` (sp_00) / `0xfa5814` (sp_13) | (7, 4) L2 M41 f20 / f42; (7, 7 / 9) L2 M31 f6 (15 / 16 / 17); (7, 0x32) L2 M13 f36 / f52 / f66 (18 + 3 tier + i); (7, 0x34) L2 M57 f64 / f82 / f96 (27 + 3 tier + i); (7, 5) L2 M57 f66 / f82 / f98 sp_13 (3 tier + i); tier = rank >= 5 ? 2 : rank >= 2 ? 1 : 0. (7, 4): kind 1 the tier\'s 0 / 5 / 10, kind 2 + 1 + (e+0x73e8 & 3), f20 kind (P+0x1a2 == 0 ? 1 : 2), f42 the other, P+0x1a2 = e+0x73e8 & 1 (0xfa5100) | uEm070_00 | R + E (cengen11 all statuses; fb/motqx.py the clips) | %s 2 |' % SP,
  '| `0xfa280c` (the drip) from `0xfa2610` (L0 M8: (3, 0xc / 0xd / 0x1a / 0x1b)) / `0xfa2930` (L0 M6: (3, 0xe..0x19)), phase 1 | skipped while P+0x3b5 bit 5 (P+0x3b4 0x2000: `0xf9d350` sets it at the Back\'s .dtp bytes 5 / 6); else [e+0xcac0]+0x90 by `0x7206c` (phase 0 = 20.0, each drip 40.0) -> sp_00_02 (rank > 4 ? 1 : 0). A census without the countdown answered never sees it (trap 86) | uEm070_00 | R + E (fb/drip070.py, the timer answered) | %s 2 |' % SP,
  '| `0xfa0468` -> `0xfa055c` | sp_01 8 (999, -1), a hit volume near joint 0 on the ground -- named, not built | uEm070_00 | R | %s 2 |' % SP,
  '| `0xfac410` / `0xfac5e8` | sp_00 reader (ef 0 / 1 / 2 -> +0x15c8 / +0x15d4 / +0x15cc; vec 0 the offset AND the from-vec; flags 0x84 + 1 (int 1) + 0x800 (int 2 == 0); +0x15c2 = 1) / landing (no contact start: sp_01 by tables `0x16a1120` (type 1) / `0x16a11b0` (type 0), then the end) | uShellEm070_00_00 | R + E | %s 3 |' % SP,
  '| `0xfac844` / `0xfac9e4` | sp_00_02 reader (floats 1 / 0 / 2 / 3 / 4 -> degX / degY / vz / vy / flight; vec 1 the offset, vec 0 the gravity) / landing (type 1: sp_01 6 / 7; `0xac030` behind block +0x2c0 == 1, NR) | uShellEm070_00_00_02 | R + E | %s 3 |' % SP,
  '| `0xfacc70` | sp_01 reader: ef 0 / 1; float 0 the timer; flags 8 int 1, 4 int 2, 0x1000 int 0 == 0; int 0 -> +0x1610 | uShellEm070_00_01 | R + E | %s 3 |' % SP,
  '| `0xface88` / `0xfad064` / `0xfab5c8` | sp_13 reader (floats 0 / 2 / 1 / 4 / 3 / 5; vec 2 -> +0x1630 the turn; +0x15c2 = mode <= 8 ? 0xfab5c8(owner): map 13 and area 7) / landing (sp_01 by `0x16a1240` {0,0,0,0,0,0,2,2,2} / `0x16a1270`, no state test) | uShellEm070_00_13 | R + E | %s 3 |' % SP,
  '| `0xf9d350` (vt+0x1dc tail) | part 1 (the Back): level >= .dtp byte 5 / 6 -> P+0x3b4 \\|= 0x2000 (and & ~0x800); else >= byte 1 / 2 -> \\|= 0x4000; part 4 >= byte 13 / 14 -> \\|= 0x8000 | uEm070_00 | R | %s 2 |' % SP,
  '| tooling: emu_fb\'s .shl file map (fb/shlmap.py) | a mode\'s sh / hit / ef are the files its .shl entry names (Nerscylla\'s sp_00 1..4 / 6..9 / 11..14 name 0\'s / 5\'s / 10\'s); disagreements with the numbered files logged (none in em066 / em068 / em070 / em082 / em057 / em084 / em088 / em001 / em037) | -- | R | %s 4 |' % SP,
]
L[j:j] = rows
s = '\n'.join(L)
k = s.index('89. **Under emu_fb a shell that tests its owner or its area')
e = s.index('\n', k)
s = s[:e + 1] + ('90. **A mode\'s shell files are the ones its .shl names, not the ones carrying its number (2026-10-18).** Nerscylla\'s sp_00 modes 1..4 / '
  '6..9 / 11..14 share mode 0\'s / 5\'s / 10\'s ef and hit files; emu_fb looked files up by number, found none, and the ROM run started no flight '
  'effect for them -- a harness gap that read like a ROM difference. emu_fb now takes the .shl\'s map (scratchpad fb/shlmap.py). (dev/temnoceran-shells-spec.md 4)\n') + s[e + 1:]
a = s.index('| `snake-wyvern-shells-spec.md` |')
e = s.index('\n', a)
s = s[:e + 1] + ('| `temnoceran-shells-spec.md` | Temnoceran shells (shells agent): Nerscylla\'s spits (sp_00 by rank tier, L2 M41 / M31 / M13 / M57), balls (sp_13), '
  'the drip on his walks (sp_00_02, the Back gate), their landings\' sp_01; the .shl file map in the harness | 2026-10-18 | 6 KB |\n') + s[e + 1:]
open(P, 'w', encoding='utf8').write(s)
print('ok')

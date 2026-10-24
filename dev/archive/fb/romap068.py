# romap068.py: the Snake Wyvern shells section (after the Amphibians section's last row), trap 89, the notes-index line
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(P, encoding='utf8').read()
assert '### Snake Wyvern -- the shells' not in s
L = s.split('\n')
i = next(k for k, l in enumerate(L) if l.startswith('### Amphibians -- the shells'))
j = i + 1
while not L[j].startswith('|'): j += 1
while L[j].startswith('|'): j += 1          # j: the first line after the Amphibians table
SP = 'snake-wyvern spec'
rows = [
  '',
  '### Snake Wyvern -- the shells: Najarala (shells agent, 2026-10-18; dev/snake-wyvern-shells-spec.md)',
  '',
  '| Address / range | What it is | Class / monster | Status | Detail |',
  '|---|---|---|---|---|',
  '| uEm068_00 shells 0x125 / 0x126 | sp_01 / sp_36: IMMEDIATES (`movw #0x126` in the maker 0xf7a4bc, `movw #0x125` in base36\'s blast 0x41a3f8); res 0x8a78 / 0x8a79; sp_36 vtable `0x17e0d58` | uEm068_00 | R | %s 1 |' % SP,
  '| `[e+0xcac0]` = P+0x60 (`0xf795ec`) | four slot handles +4..+0x10; the one-frame RING +0x14 mode / +0x16 id / +0x20.. centre / +0x30 radius; P+0x1bb two retire marks per slot (bits 2k, 2k+1) | uEm068_00 | R | %s 1a |' % SP,
  '| `0xf7a4bc` (e, type, count) | the scale MAKER: all or none against 4 - occupied; type modes 0 [0,1] 1 [2,3] 2 [4..7] 3 [8] 4 [9] (after 0xc460c) 5 [10], the first `count` into the empty slots in order; setup +0x10 the slot, +0x14 occupied + 1 (ORDER), +0x18 0x16b4b4 | uEm068_00 | R + E | %s 1a |' % SP,
  '| `0xf79d60` (vt+0x204) tables `0xf79d8c` (status) / `0xf79df4` (status 7) / `0xf79ee0` (status 10) | the action start: (7, 0x17) type 0 x2, (7, 0x1c) type 1 x2, (7, 0x22) type 2 x2, (7, 0x24) type 3 x1 -- all L2 M60; (7, 0x26 0x27 0x29..0x2c 0x2e 0x34 0x36 0x38 0x3a 0x3c 0x3d) -> 0xf7ab50. A census never runs it (trap 87) | uEm068_00 | R (tables decoded, fb/jt068.py) | %s 1a |' % SP,
  '| `0xf813f4` / `0xf81454` / `0xf82b34` | the maker in the actions, not tired (0x81614): (7, 0x26 / 0x3c / 0x3d) L2 M62 f32 type 4 x1, f68 type 5 x1; (7, 0x27) L2 M63 f104 type 0 x2 | uEm068_00 | R + E | %s 1a |' % SP,
  '| `0xf7ab50` | the RETIRE: rank >= 5 and four slots full -> per slot ORDER < 3: marks 3, slot emptied; else ORDER -= 2. P+0x1bb\'s only other writers: the ctor (0xf79620 / 0xf798e8) and `0xf88000` (one slot\'s marks cleared). MARK 2 IS NEVER SET | uEm068_00 | R | %s 1a |' % SP,
  '| `0xf7b794` `0xf7cba4` `0xf7d2f4` `0xf7da14` `0xf8297c` `0xf80780` `0xf82ce0` / `0xf7fa28` | the RING writers (mode 1, centre P+0x40, variant 0 only): (1, 0 / 0x16) L0 M50 f190 r5000; (2, 0x1e / 0x4a) L0 M27 f35, (2, 0x1f / 0x4b) L0 M28 f30, (2, 0x44 / 0x45) L0 M105 / M104 f30, (2, 0x46 / 0x47) L0 M115 / M114 f30 -- r2500; (7, 0x18 / 0x1a) L2 M61 f140 / f138 r3500; (7, 0x1e / 0x25) L2 M70 / M73 / M71 (block +0x44) f50, (7, 0x1f / 0x28) L2 M74 f50 r2500. The CALL-OFF (mode 2, r -1): (6, 0 / 0xa) L0 M36 f100 | uEm068_00 | R + E (fb/cenring068.py, all 16 statuses; fb/ctrq068.py the centre) | %s 1a |' % SP,
  '| `0xf7ad20` (vt+0x1dc) | every frame before the action: the ring cleared (+0x14 0, +0x30 -1.0), a slot whose unit\'s +0xc & 7 is not 1 / 2 emptied | uEm068_00 | R | %s 1a |' % SP,
  '| base36 `0x41900c..0x41ab84` | uShellEmBase36, READ WHOLE: ctor 0x41900c, init 0x419218, update 0x419990 (states 1 flight 0x419c68, 2 stuck 0x419ea0, 3 ringing 0x41a2c8, 4 fade 0x41a504, 0xfe), end 0x41a6c0, +0x150 `bx lr`, contact 0x41a810 | uShellEm068_sp_36 | R + E (dev/shells-najarala-check.mjs 25 / 25) | shells.js NAJARALA block; %s 1b |' % SP,
  '| `0xf88b6c` | sp_36\'s reader: ef 0,1,3,2,4,5,6 -> +0x15c8..; sh int 0 the index +0x161c; cmn f(rank > 4 ? 1 : 0) the hit count, f(rank > 4 ? 6 : 5) the ring step, f2 / f3 / f4 the flight limit / stuck life / fade step; sh f0 yaw, f1 aimed speed; vecs 0..2; sh int 1 != -1 AIMED | uShellEm068_sp_36 | R | %s 1b |' % SP,
  '| `0xf889b0` | sp_01\'s reader: ef 0; hit 0; +0x15ec 4 int 0 / 8 int 1; vec 0; the timer the ctor\'s 0 | uShellEm068_sp_01 | R | shells.js params068s01 |',
  '| `0x41a57c` (base36 state 4) | the fade\'s ORDER compare loads +0x1640 (the SLOT INDEX), not +0x166c: other slots\' ORDER drops unless it equals this one\'s slot -- as read, transcribed so | uShellEm068_sp_36 | R | %s 1b |' % SP,
  '| `0x7fe88` | the owner-present test (shells\' updates): 1 (gone) unless e+0xb5f9 != 0, `0x70768` (e+0x7652) == 1 and P+0x1a0 < 2 | shared | R | %s 1b |' % SP,
  '| tooling: fb/cenring068.py (block-write census), fb/motq068.py (all setMotion-family hooks), fb/jt068.py; emu_fb `slotSelf` | the ring / call-off / marks writers by action and frame; the ROM run\'s slot handle = the flown shell | -- | R | control: the census finds Tetsucabra\'s / the class\'s known creates; slotSelf off -> no ring (the mate search fails) |',
]
L[j:j] = rows
s = '\n'.join(L)
# trap 89 after 88
k = s.index('88. **A census line\'s motion is the PHASE-0 motion')
e = s.index('\n', k)
s = s[:e + 1] + ('89. **Under emu_fb a shell that tests its owner or its area dies or fades at once unless the case makes the owner present (2026-10-18).** '
  'base36\'s update calls 0x7fe88 (gone unless e+0xb5f9 != 0, e+0x7652 == 1, P+0x1a0 < 2) and its stuck state compares the unit\'s area byte '
  '+0x1054 with the owner\'s -- a harness-made shell keeps the base ctor\'s 0xff. Najarala\'s scales were deleted at move 1, then faded two moves '
  'after landing, both the harness talking. Set the owner bytes (and the area equal) before reading a "the ROM ends it" result. (dev/snake-wyvern-shells-spec.md 1c)\n') + s[e + 1:]
# the notes index
a = s.index('| `amphibian-shells-spec.md` |')
e = s.index('\n', a)
s = s[:e + 1] + ('| `snake-wyvern-shells-spec.md` | Snake Wyvern shells (shells agent): Najarala\'s scales (base36 new: the slots, the maker by type, the ring broadcast and its writers, '
  'the call-off, the retire marks, the blast sp_01 2) | 2026-10-18 | 9 KB |\n') + s[e + 1:]
open(P, 'w', encoding='utf8').write(s)
print('ok', j)

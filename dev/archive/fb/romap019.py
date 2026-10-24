P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(P, encoding='utf8').read()
assert '### Carapaceons -- the shells' not in s
L = s.split('\n')
i = next(k for k, l in enumerate(L) if l.startswith('### Temnoceran -- the shells'))
j = i + 1
while not L[j].startswith('|'): j += 1
while L[j].startswith('|'): j += 1
SP = 'carapaceon spec'
rows = [
  '',
  '### Carapaceons -- the shells: Stonefist Hermitaur, Rustrazor Ceanataur (shells agent, 2026-10-18; dev/carapaceon-shells-spec.md)',
  '',
  '| Address / range | What it is | Class / monster | Status | Detail |',
  '|---|---|---|---|---|',
  '| `0xdc09d4` / `0xdc3e8c` (vt+0x158) | uEm019_00: e+0xcac8 sp_01 0x99 / 0x9b, +0xcacc sp_02 0x9a / 0x9c, +0xcad0 0x19d (no row: Daimyo no sp_00) / 0x9d; uEm020_00: e+0xcad8 sp_02 0x9e / 0xa0, variant 4 registers 0x9f | uEm019_00 / uEm020_00 | R | %s 1 |' % SP,
  '| `0xdb5ebc` (e, mode, h) | the sp_01 maker: [e+0xcac8], +0x10 the block point, +0x30.. the block words, +0x3c h (variant 4) / 0xffff | uEm019_00 | R | %s 1 |' % SP,
  '| (7, 0xf2) phase 3 `0xdc2228..0xdc2260` | L9 M11 -> M12 -> (landed) L9 M13, f16 (0xb0968 mode 1, once by P+0x1a3): sp_01 0 (u 30 of em019_00c). Daimyo carries no L9 list | uEm019_00 (Stonefist) | R + E | %s 1 |' % SP,
  '| `0xdbc9f4` / `0xdbcd00` | Rustrazor\'s landing: 0xbf52c -> phase + 1, block +0x44 = +0x5b4 (the ground), L9 M36 (0x924), sp_01 0x9f mode 0 (+0x10 / +0x30 GOT zero vectors) -- (7, 0xa / 0xb / 0xc / 0x17..0x19 / 0x30 / 0x47..0x4d) | uEm020_00 (Rustrazor) | R + E | %s 1 |' % SP,
  '| `0xdcd998` / `0xdcde78` | sp_01 readers: uShellEm019_sp_01 (ef 0; 4 int 0, 8 int 1, 0x1000 int 2; float 0 timer; vec 0) / uShellEm020_04_01 (ef 0; bit 0 int 0; int 1 the joint; no vec, no timer) | -- | R + E | %s 2 |' % SP,
  '| `0x3fa8e4..0x3fa9ec` (base01 init, flag 1, joint -1) | flag 2 cleared; the matrix the global 0x172d744 (run-time filled: NR) copied; the base the owner\'s BLOCK point +0x40; the vec through that 3x3 (zero vec: the block point) | uShellEmBase01 | R (the matrix NR) | %s 2 |' % SP,
]
L[j:j] = rows
s = '\n'.join(L)
a = s.index('| `temnoceran-shells-spec.md` |')
e = s.index('\n', a)
s = s[:e + 1] + ('| `carapaceon-shells-spec.md` | Carapaceons\' drawing shells beside their beams (shells agent): Stonefist\'s L9 M13 slam sp_01 (u 30 of em019_00c), '
  'Rustrazor\'s L9 M36 landing sp_01 (u 31 of em020_00c, base01\'s joint -1 arm read), every other mode a hit volume | 2026-10-18 | 4 KB |\n') + s[e + 1:]
open(P, 'w', encoding='utf8').write(s)
print('ok')

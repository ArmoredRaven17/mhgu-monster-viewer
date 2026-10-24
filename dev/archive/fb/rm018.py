p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| base13 init joint -1 `0x404620..0x4046dc`")
L[i+1:i+1] = [
r"| Garuga / Deadeye makers (uEm018_00 main `0xdb0a2c`; ids e+0xcac4 / +0xcac8 / +0xcacc) | (7, 0x0a / 0x15) L4 M52 f78 / 120 / 164 sp_00 1 2 3 / 4 5 6; (7, 0x10 / 0x11) L4 M29 phase 2 f40 sp_00 10 / sp_01 0; (7, 0x12 / 0x13) L4 M68 f60 sp_00 10 / sp_01 0; (7, 0x23) L4 M51 f62 sp_00 0; Deadeye (7, 0x30 / 0x32) L4 M51 f62 sp_00 0, (7, 0xca) L9 M8 phase 3 f40 sp_00 15, (7, 0xcc) L9 M8 phase 4 f40 sp_00 15 + 04_07 0 / 1 / 2 at 40 / 42 / 44 | uEm018_00 | R (sites) / E | dev/em018-shells-spec.md 1; SHELL_DATA.em018_00 / em018_04 |",
r"| `0xdac748(e, row, n, ..)` (Garuga's fireball maker; caller `0xdaff6c`) | `0xb0974` crossings 78 / 120 / 164 -> sp_00 table `0x169ca70`[base + P+0x1a2] (base 1 / 4 / 7 by the row; P+0x1a2 the shot count), n == 3 -> none. The census had 120 / 164 and the first mode only | uEm018_00 | R + E | spec 1 |",
r"| Garuga sp_00 reader `0xdb34fc` / landing `0xdb36dc`; sp_01 reader `0xdb3b68` (+0x158 `0xdb3d34` hit side); Deadeye 04_07 reader `0xdb31f4` (+0x28 `0xdb33a0` marker) | sp_00: ef 0..3, hit 0, int 0 joint, ints 1 / 2 cameras, int 3 -> bit 0 (the X aim), floats X deg / Y deg / vz / flight / X clamp lo / hi, &vecs offset / aim origin / aim offset; landing: modes 14 / 15 nothing (no end), type 1 ef 2 + sp_01 1 (+ sp_01 3 unless the record's +8 & 0x1040), type 0 ef 1 + sp_01 2, type 2 ef 3. sp_01: ef 0 / 1, hit 0 / 1, flags 1 / 2 / 0x80 / 0x800 / 4 / 8 / 0x1000 from ints 0 / 2 / 3 / 4 / 5 / 6 / 7, int 1 joint, float 0 timer, &vec 0. 04_07: Bloodbath's base07 map | uShellEm018_sp_00 / _sp_01 / _04_07 | R + E | spec 2; shells.js params018s00 / landing018s00 / params018s01 |",
]
i = find(r"| tooling: `<scratchpad>\fb\mk014.py")
L[i+1:i+1] = [
r"| tooling: `<scratchpad>\fb\mk018.py <em018_00 \| em018_04>` -> dev/shells-garuga-check.mjs / dev/shells-deadeye-check.mjs (2026-10-20, shells agent); `fb\r18cap.py`, `fb\r18ph.py`, `fb\r18sw.py` (the primed sweep, MON / VAR env) | main `0xdb0a2c`, ids poked at +0xcac4 / +0xcac8 / +0xcacc; the children's slot holds per flight | controls joint 3 / target / Y word fail | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

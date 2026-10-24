p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8').read()
anchor = "| VIEWER (implemented) | Congalala's gas by index.html shellExtra `gas021`"
assert s.count(anchor) == 1
rows = """| uEm060_00 shells `0x103` / `0x104` / `0x10d` / `0x10e` / `0x10f` | uShellEm060_sp_00 (vt `0x17d7288`, reader `0xf23108`) / _sp_01 (`0x17d7404`, init `0xf23408`, reader `0xf234e8`) -- Redhelm's arc; Arzuros's (em060_00) ships none; uShellEm062_sp_00 (`0x17d7574`, reader `0xf236e4`, landing `0xf23818`) / _sp_01 (`0x17d76f0`, reader `0xf23a9c`) / _sp_43 (`0x17d7860`, base43 `0x421968` / `0x421af8`, reader `0xf23c28`) -- Lagombi's; the one class names all five as literals | uEm060_00 | R | spec 4 |
| `0xf23108` | Redhelm sp_00 reader: joint int 0 (+0x15dc), flags bit 0 int 1, bit 1 int 2; floats xDeg / yDeg / vz / flight / X lo / hi / Y lo / hi; &vec 0 offset, &vec 1 gravity -- init001 with joint -1 (the owner's point) | uShellEm060_sp_00 | R + E | params060s00 |
| `0xf1d284` -> `0xf191d8` / `0xf1de18` / `0xf1db54` -> `0xf189d8` | Redhelm: (7, 0xf5) L9 M9 f122 sp_00 0; the slam (7, 0xff) L9 M1 / (7, 0xfe) L9 M10 -> L9 M1 from 68, window 0xb0968 mode 1 at tune 0x47 (116): sp_01 1 (4 when variant 4 and `0x49930` > 8) at owner +0x40 + tune (0x58, 0x59) / (0x5a, 0x5b) turned x size, on `0x49a90`'s ground from 200 above (attribute & 6 -> 2 / 5 or 3 / 6 by stage 0x17 / 6 / 4: not reached on the plane) | uEm060_00 | R + E | slam060 |
| `0x49a90` -> `0x180f50` -> `0x180fd4` | the ground probe: with no second point a ray straight down from the point (the reach 0 / 50 / 100 applies only with one); hit byte, height s0, attribute record | shared | R | slam060; emu_fb probe49 |
| `0xf1ff90(e, k)` / `0xf236e4` / `0xf23818` | Lagombi: phase 0 L2 M28 (k == 4: L2 M37), phase 1 window mode 0 at 68 -> sp_00 k (4 -> 3; 3 none); reader joint int 0, floats degX / degY / vz / flight, &vec 0 offset, &vec 1 gravity, no flag; landing state 1, type 1 -> sp_01 2 at the contact | uEm062_sp_00 | R + E | params062s00 / landing062s00 |
| sp_43 (base43) | no EffectList (ef (999, -1)); base43's init starts only that, the band makes no shell: nothing drawn, not built | uShellEm062_sp_43 | R | spec 4 |
"""
s = s.replace(anchor, rows + anchor, 1)
open(p, 'w', encoding='utf8').write(s)
print('ok')

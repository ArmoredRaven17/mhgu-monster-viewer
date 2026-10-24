p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| shell hit slot 0 at +0x13a8")
L[i+1:i+1] = [
r"| Iodrome / Giadrome makers (uEm014_00 main `0xd956e0`; ids immediates) | Iodrome (7, 0x06 / 0x0e / 0x28) L4 M2 / M3 / M1 phase 1 f88 / 108 / 120 sp_00 0x8f 0 / 2 / 4, (7, 0x2a) L4 M2 f84 sp_13 0x91 0; Giadrome (7, 0x3c / 0x3e / 0x40) the same sp_00 0xc3 2 / 2 / 5, (7, 0x42) sp_13 0xc5 1 (d14cap.py) | uEm014_00 | R (sites) / E | dev/em014-shells-spec.md 1; SHELL_DATA.em016_00 / em034_00 |",
r"| drome shell classes (Iodrome `0x17a94a8` / `0x17a9624` / `0x17a9794`, Giadrome `0x17a9914` / `0x17a9a90` / `0x17a9c00`: one code, child id 0x90 / 0xc4) | sp_00 reader `0xd96280`: ef 0..3, hit 0, int 0 joint, floats 0 X deg / 1 Y deg / 2 vz / 3 vy / 4 flight, &vec 0 offset, &vec 1 gravity; landing `0xd963d0` (state 1): type 1 ef 2 + sp_01 table[mode] (Iodrome `0x169c6f0` 0 1 0 1 2 3, Giadrome `0x169c710` 0 0 1 1 2 3) at the contact with its words; sp_01 reader `0xd96690`: 4 / 8 ints 0 / 1, float 0 timer, &vec 0; sp_13 reader `0xd96868`: 0x50 \| (int 1 ? 2), floats speed / per / gravity / near / far / life (0 / 1 / 2 / 3 / 4 / 5 by slot), &vec 0 / &vec 1 the two points; landing `0xd96a00` (state 2): type 1 ef 2 + vt+0x174 `0xd96a90` sp_01 0 / 1 by mode | uShellEm016 / Em034 | R + E | spec 2; shells.js params014s00 / params014s13 |",
r"| base13 init joint -1 `0x404620..0x4046dc` | +0x40 = the owner block's, **flag 2 forced** (`0x4046d0`: the points turned by his words `0x43ae70`); with 0x80 the points are setup +0x10, else [+0x161c] / [+0x1620] (a reader's two vecs) at p1 + (p2 - p1) x 0.5 (`0x404768..`) | uShellEmBase13 | R + E (the dromes' sp_13) | shells.js init13t (vec2) |",
]
i = find(r"| tooling: `<scratchpad>\fb\mk009.py`")
L[i+1:i+1] = [
r"| tooling: `<scratchpad>\fb\mk014.py <em016_00 \| em034_00>` -> dev/shells-iodrome-check.mjs / dev/shells-giadrome-check.mjs (2026-10-20, shells agent); `fb\d14cap.py` (MON / EMN env) | 6 cases each: main `0xd956e0`, the children's slot held 120 | controls joint 2 / Y word fail | -- |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

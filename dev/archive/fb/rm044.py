p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n'; L = s.split(NL)
def find(prefix):
    i = [k for k, l in enumerate(L) if l.startswith(prefix)]; assert len(i) == 1, (prefix, i); return i[0]
i = find("| Diablos / Bloodbath `0xd35a94` (vt+0x208)")
L[i:i] = [
"| Barroth makers (main `0xe8c7b0`; e.g. `0xe86e48..0xe86f30`) | (7, 0 / 3 / 0xe / 0xf) L2 M12 phase 1 at 102 / 106, (7, 0x31) L2 M17 at 132 (`0xb0968(e, 1, 0, F)`, P+0x1a3 == 0): `0x49d0f8(0x40)` cSetupParamEm044_00_00 -- +4 **0xdd** (literal), +8 mode, +0x10 GOT zero, +0x20 0 / **+0x24 his Y + the site's offset** / +0x28 0, +0x2e 0xffff, **+0x30 e+0x73e8, +0x32 the site's byte** (per site in the spec) | uEm044_00 | R | dev/em044-shells-spec.md 1; shells.js SHELL_DATA.em044_00 / spawn044 |",
"| Barroth sp_00 vtable `0x17c2270` (base00 move `0x3f96a0`): init `0xe8e614`, +0x28 `0xe8e8ec`, reader `0xe8e930`, landing `0xe8ebc0`; sp_01 vtable `0x17c240c` (base01, reader `0xe8eeb0`) | reader: ef 0..3, hit 0, \\|= 0x20, float 0 flight, int 0 joint, &vec0 offset, vec1 z / y vz / vy, &vec2 gravity, ints 1..5 -> bits 0 / 1 / 2 / 3 / 8, floats 1..4 -> +0x1600..+0x160c, &vec3 +0x1614, &vec4 +0x1618. **Init: base00's then a push along his words** (s = F1 `0x1592918`[b>>4] + (rot(H, T8 `0x169e7c6`[b&15]) & 3) for mode < 4, F2 `0x1592928` for 4). Landing: type 1 (vy <= 0) -> ef 2 + shell01 0xde 0 at the contact with his three words (not for mode 5); type 0 / 2 ef 1 / 3; then the end. sp_01: ef 0, hit 0, int 0 -> 4, int 1 -> 8, float 0 timer | uShellEm044_00_00 / _01 | R | dev/em044-shells-spec.md 2-3; shells.js params044s00 / spread044 / landing044s00 |",
"| base00 `0x3f9378` X aim with bit 3 set | aims from **+0x40 as the first pass left it** (the base point + the offset turned by the setup's words, x size with 0x80) -- init00 used the bare base point: shells.js `bit3First00` (Barroth's mode 5: 1212 -> 1595 = the ROM's) | uShellEmBase00 | R (by the ROM run, dev/shells-barroth-check.mjs m31 / m31low) | shells.js init00 |",
]
i = find("| tooling: emu_fb `frame3` (2026-10-19)")
L[i+1:i+1] = [
"| tooling: `<scratchpad>\\fb\\mk044.py` -> dev/shells-barroth-check.mjs (2026-10-19, shells agent) | Barroth's mud: main `0xe8c7b0` phase 1, winFrames per frame, slot0Until 100 (sp_00) / 15 (sp_01); turned, aimed high / low, the floor | controls joint 2 / Y word / target / floor fail | the page's L2 M12 entry plays only its _start (0..99): the mud (102 / 106, the _loop's) is unreachable there |",
]
open(p, 'w', encoding='utf8', newline='').write(NL.join(L))
print('ok')

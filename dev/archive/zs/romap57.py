p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8').read()
assert 'Zinogre / Thunderlord -- the shells' not in s
sec = r"""### Zinogre / Thunderlord -- the shells (shells agent for the Viewer agent, 2026-10-17; dev/em057-shells-spec.md)

Transcribed: docs/render/shells.js `SHELL_DATA.em057_00` / `.em057_04`, `actions057` / `spawn057` / `perFrame057`, base18 `init18` / `step18` / `move18` / `landing057s18`, readers `params057s01` / `params057s18` / `params057s11`, `create057s11`, `endCreate057`; init00's `WORDS00` arm. Checked bit for bit by dev/shells-zinogre-check.mjs (24 ROM cases on the whole executable, controls FAIL).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `E+0xcafc` / `+0xcb00` / `+0xcb04` | the shell ids the spawners read: 0xf7 / 0xf8 / **0x19d** (variant 0: no sp_11 -- 0x19d is the table's unset sentinel) or 0xf9 / 0xfb / 0xfa (variant 4) | uEm057_00 | R | spec 1; trap 80 |
| shell table `0x175c3e8` rows 247..251 | 0xf7 / 0xf9 uShellEm057_sp_01 (vt `0x17cbad8`, ctor `0xf05314`) Base01; 0xfa uShellEm057_sp_11 (`0x17cbc48`, `0xf059c0`) base11; 0xf8 / 0xfb uShellEm057_sp_18 (`0x17cbdbc`, `0xf05ebc`) Base00's setup, **base18** | uEm057_00 | R | spec 1 |
| `0x4088fc` / `0x408980` / `0x408a10` | **base18** ctor (+0x1660..+0x1678 0, +0x15a8 0x12) / init (base00's 0x3f8b80, then +0x1668 = X word, +0x166c = Y word + u16(degY) -- degY a 2nd time, +0x1674 / +0x1678 0) / vt+0x160 step: the weave (T[low12(1.5x2^23 + t/period x 180 x 0.0174533 x 651.899)] x amp, its change / dt the x velocity, vz, turned by +0x1668 then +0x166c, kept past the period), `0x539224`, words from the velocity. Move base00's `0x3f96a0` -> `0x3f9738` | uEm057_sp_18 | R + E | spec 3; shells.js step18 |
| `0xf05358` -> `0xf0538c` / `0xf05488` | sp_01 readers by the shell's id: ef 0 / 1 -> +0x15c8 / +0x15d0 (the 0x20 switch's); 0x4 / 0x8 / 0x20 = ints 1 / 2 / 0 (Zinogre); joint int 0 + 0x1 / 0x4 / 0x8 / 0x20 = ints 0 / 2 / 3 / 1 (Thunderlord) + by mode (table `0xf055e0`) cmn int -> 0x10 and the snap reaches cmn floats | uEm057_sp_01 | R | spec 2 |
| `0xf05ef0` -> `0xf05f2c` / `0xf06140` | sp_18 readers: ef 0..3 in order; floats 0 flight, 1 / 2 X clamp, 3 vz, 4 degY, 5 amp +0x1660, 6 period +0x1664, 7 vy; joint int 0; vecs offset / gravity; flags (f & ~0xbf) or 0xa2 or (int 1 != -1); Zinogre int 2 == 0 -> 0x800, int 2 -> +0x1620 (no consumer read) | uEm057_sp_18 | R | spec 2 |
| `0xf059e0` / `0xf05b20` | sp_11 reader (count int 0, times floats) / create: vec k turned by its Y word + its point; mode 0 -> sp_01 0x17 + k, mode 1 -> 0x11 + k | uEm057_sp_11 | R + E | spec 2, 4 |
| `0xf06314` | sp_18 landing: ef 1 / 2 / 3 by type at the contact; type 1, modes 6..9 / 14..17 / 36 / 37 -> sp_01 15, 18..35 / 38..40 -> 16 (masks `0xc0000f0f` / `0x73ffff`); then vt+0x148(0) | uEm057_sp_18 | R + E | spec 4 |
| `0xf05730` / `0xf057a4` | sp_01 +0x150 (anchor = point + (0, 2000, 0) for 0..11 / 26..38: hit side, not modelled) / +0x154 in the end: modes 21 / 22 set +0x1654; +0x1654 -> shell11 0 at its point and words | uEm057_sp_01 | R + E | spec 4 |
| `0xf00590` / `0xf010e8` (e, kind, which) | the thunderbug leaps from `0xefdaf4` / `0xef77b8`: L2 M31 f88 / L2 M32 f58; setup words (P+0x50, `[+0xcac0]+0x18`, P+0x58), Thunderlord X = Z = 0; modes by kind / charged (spec 4); `[+0xcac0]+0x18` = P+0x54 at phase 0 (`0xefe014`, `0xef7e5c`) | uEm057_00 | R + E | spec 4 |
| `0xeef638` (vt+0x2a8) -> `0xeefc34(e, k)` | Zinogre's G escorts: L2 M15 / M18 f117, M24 f6, M26 f72, M30 f89, M38 / M37 f138 -> sp_18 0x2a + 2k (+ 0x2b + 2k charged), variant 0 and `0x3a8430 >= 5`, the owner's words | uEm057_00 | R + E | spec 4 |
| `0xef8478` -> `0xef870c(e, k)` | (7, 0x71) L0 M20: the strikes, k = P+0x1a2 at table `0x169f23c` (Thunderlord charged: tune floats 0x2a..0x35), modes `0x169f2ac` (0..11) / `0x169f2b8` (26..37); Zinogre at e+0x40, Thunderlord at the target, zero words; L0 M24 at f278 | uEm057_00 | R + E | spec 4 |
| `0xefa834` / `0xefd50c` / `0xefc044` | the rays (`0x183664` from joint 40 / 50 + 100 to - 300, mask 0x40): L2 M60 f18 -> 13 (Thunderlord charged 45 / 39 enraged, +0x1654 when r2 0: (7, 0xa6 / 0xa7)); L2 M1 / M2 f57 (7, 0xfb / 0xfc) -> 12 (charged 21 / 22); L2 M1 / M2 f57 (7, 0xe7..0xf0 / 0xf8) Thunderlord charged -> 19 / 20 | uEm057_00 | R + E | spec 4 |
| `0xef9554` / `0xefae84` / `0xefb470` / `0xef67a0` | L2 M30 tune 0x3b (82) sp_01 40 (Thunderlord enraged + charged + vt+0x370(e,1) == 0); L9 M1 tune 0x27 / 0x28 sp_01 41 / 42 (G) or 14 / 38; L9 M4 tune 0x10 shell11 1 (charged), L9 M5 tune 0x3d / 0x3e sp_01 43 / 44 ((7, 0xdb) only); L2 M15 / M18 tune 0x23..0x25 sp_18 24..26 / 27..29 (Thunderlord charged, `0x49930 >=` tune int 12) | uEm057_00 | R + E | spec 4; trap 82 |
| `0x3f8c9c` / `0x3f8da0..0x3f8fdc` (base00 init, for this class) | the 0x20 arm takes the setup's words; bit 3 clear: the offset through the joint's / the OWNER's +0xb0 3x3, THEN times the size (0x80) -- shells.js init00 `WORDS00` arm | base00 | R + E | trap 81 |
| VIEWER (implemented) | rows in SHELL_DATA; index.html shellExtra `charged` (the Charge State rung) and `action` (the play's, shellPlayAction057); stand-ins: the leap heading at the clip start, the owner's 3x3 as its yaw turn (ownerTurn057), the ray on the stage stand-in's floor | viewer | -- | spec 5 |
"""
anchor = "\n## 1b. The decode notes"
assert s.count(anchor) == 1
s = s.replace(anchor, "\n" + sec + anchor, 1)
note = "| `dev/em057-shells-spec.md` | Zinogre / Thunderlord -- their shells: the three classes and base18 (the weave), the readers, the landing, the end's shell11, every spawner (leaps, G escorts, strikes, rays, L2 M30, L9, the charged trio) with its clip / frame / gate; the viewer's rows and stand-ins; checked by dev/shells-zinogre-check.mjs |\n"
a2 = "| `dev/em069-em076-shells-spec.md` |"
i = s.index(a2)
s = s[:i] + note + s[i:]
tool = r"| `<scratchpad>\zs\emu_zinogre.py` (+ `tr57.py`, `callf.py`, `cen4.py`, `fn.py`, `show.py`, `gen57.py`, `band57.txt` / `base18.txt`) | Zinogre's / Thunderlord's shells on the WHOLE executable (the Seltas harness's machine): the class's own spawners run once per crossing, the shells flown from the setups the ROM built, children from theirs; the heap 0x7a75a0 faked (sp_11's table), the ray 0x183664 on the floor plane, tune / rank / quest answered. tr57.py: one action phase under unicorn (band native) with tune / rage / charged / ray hooks; callf.py: one function called directly; cen4.py: the status-7 census | dev/shells-zinogre-check.mjs controls (target, heading, facing, size, joint, floor) FAIL | the owner's +0xb0 is the case's yaw turn; no hit registration (0x4a1ad8 -> 0) |" + "\n"
j = s.index(r"| `<scratchpad>\seltas\emu_seltas.py`")
s = s[:j] + tool + s[j:]
traps = """80. **Zinogre's shell ids are fields, and his sp_11 is the sentinel (2026-10-17).** Every em057 spawner names its shell through `E+0xcafc` / `+0xcb00` / `+0xcb04`, which the class fills by variant (0xf7 / 0xf8 / 0x19d or 0xf9 / 0xfb / 0xfa); 0x19d is the table's unset id. A census by literal id finds nothing, and the same code makes Thunderlord's shells from his own files.
81. **base00's owner arm turns the offset by the OWNER'S matrix and scales after the turn (2026-10-17).** `0x3f8da0..0x3f8fdc`: joint -1 -> the unit's +0xb0 3x3, then 0x80's size at `0x3f8f9c`. shells.js init00's older owner arm turns by the SETUP's Y word and scales first: right only when that word is the owner's and the size 1. Zinogre's leaps carry a heading (`[+0xcac0]+0x18`), not the owner's yaw: the `WORDS00` arm does it the ROM's way (checked at size 1.1 x 0.95).
82. **A tracer that answers the frame test 1 for every literal reads Zinogre's tune frames as their first literal (2026-10-17).** His charged strikes, the L9 slams, the L2 M30 / M15 shells sit at actiontune floats (`0x6f618`); with the getter unanswered the census showed them at f2 / f4 / f36 / f0. Answer the getters from em057_04_actiontune (tr57.py does).
"""
s = s.rstrip('\n') + '\n' + traps
open(p, 'w', encoding='utf8').write(s)
print('ok')

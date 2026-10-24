# p_docs086.py (2026-10-19): Valstrax's shells -- the elder spec 9, rom-map rows, the engine doc's base56 row, the board
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
spec = """
## 9. Valstrax (em086_00) -- uEm086_00 (2026-10-19)

- **Which actions**: em086_00_cmdtbl.emc (fb/emcvar.py) closed over every change (fb/chainx.py, vt+0x3d0 and rage / tired walked):
  every action below that makes a shell is reached. Main 0x109f650, band 0x1094024..0x10a2e44. Ids 0x174 uShellEm086_sp_56 (BASE56;
  folder shell00, 12 modes) and 0x175 uShellEm086_sp_01 (base01; folder shell01, 15 modes).
- **The makers** (cengen11; the frames are his action_tune's; fb/crlr.py the sites):
  - 0x1098b2c(e, r1) (7, 0x08 / 0x1c (r1 0), 0xc8 / 0xc9 (r1 1)): phase 0 L2 M32 (0x220); phase 1 at tune floats 0xc..0x11 (50 / 52 /
    62 / 64 / 72 / 74) sp_56 (r1 ? 6 : 0) + i, setup 0x14 (0x42d9b4: byte +0x10 0, halfword +0x12 0xffff).
    - r1 1, phase 0: THE TARGET IN A CONE (shells.js cone086) -- O = his block point + tune vec 3 (0, 500, 0) x his size; d = block +0x1d0
      - O in his frame (vt+0x54(-1) = his world matrix +0xb0, rows 0 / 1 / 2 -> a, b, f); a within |f| tan(tune int 0xb = 30 deg), b
      within |f| tan(int 0xa = 30 deg); cut -> block +0x1d0 = O + a' row 0 + b' row 1 + f row 2 (+0x1dc 0); e+0xcad0.. = the block point.
  - 0x1098fa4(e, r5) (7, 0x09 / 0x1d (r5 0), 0x0a / 0x1e (r5 1)): phase 0 L2 M36 (0x224); phase 1 at tune 0x12 (120) sp_01 1 and 2; r5 1
    on to phase 2 L2 M37 at tune 0x13 (65) sp_01 3 and 4. Each at his +0x40 with his words e+0xfe8.., +0x3c 0x16b4b4's value.
  - 0x1099f20 (7, 0x30): phase 2 (L2 M63, after L2 M62) at tune 0x1d (6) sp_01 5.
  - 0x109a1a0 (7, 0x31): phase 1 L2 M66 (0x242; e+0xcae0 a clamped time from the target's distance); its end -> phase 2 L2 M67 (0x243),
    his block moved (0xbf4d4 / 0xbf6b8), e+0xcac0.. = the block's words; phase 2 turns him 0x8000 (0x76dd0) and at tune 0x21 (48)
    makes sp_01 8 with THOSE saved words, +0x3c the block's +0xb0a.
  - 0x109a5b4 (7, 0x32..0x35): (7, 0x34 / 0x35) phase 1's end moves his block, sets L2 M71 (0x247) and makes sp_01 7 at his point (a tail
    call). (7, 0x32 / 0x33: NOT REACHED by the walk -- (7, 0x33) is (7, 0x32)'s vt+0x3d0 chain; its sp_01 10 named.)
  - NOT BUILT, named: sp_01 0 / 12 / 13 / 14 (ef (999, -1), hit only: the contacts' children, (7, 0x00 / 0x01 / 0x0b..0x0f / 0x14 / 0x15 /
    0x21..0x23)'s p8); (3, 0) / (3, 4) / (13, 0) / (13, 1)'s sp_01 11 / 6 -- the walk reaches no status 3 or 13 action: (3, 0) / (3, 1)
    come from 0x1093018 (below his band), (3, 4) from 0x1095114 (vt+0x3d0), status 13 from no change in his band (the shared reaction
    layer, NOT READ).
- **The classes**:
  - sp_01 0x175 (base01): reader 0x10a25b0 (ef 0 +0x15c8, ef 1 +0x15d0 -- the 0x20 switch's; hit 0; 0x800 by int 0, 0x20 by int 3; &vec 0
    +0x1608; no joint, no timer: it lives while its hit slot does). Mode 7's switch has no ef 0 to stop (0x43b058 on none: nothing).
  - **BASE56** sp_56 0x174, the homing shots: init 0x42dce4, move 0x42e4dc, state 1 vt+0x158 0x42e5e8, flight vt+0x15c 0x42e7b8, end
    0x42e910, contact start 0x42dae8; reader 0x10a2788 (ef 0..3, hit 0, joint int 0, flag 1 by int 1, speed float 0, the life = the COMMON
    float 0 (0x4a2264: 240), vec 0 the start offset, vec 1 the aim offset; bit 1 always).
    - Init: the aim point = vec 1 x his size turned by the block's Z, X, Y words + (flag 1 ? block +0x1d0 : his +0x40); +0x40 = the
      joint's row 3 (joint -1: his +0x40) + vec 0 turned X, Y, Z by the block's words; the words re-aimed at the aim point (X = atan2(-dy,
      |dxz|), Y = atan2(dx, dz)); the velocity (0, 0, speed) turned Z (0), X, Y; ef 0 at +0x40.
    - Move: stepFlight (no acceleration), the words from the velocity, the life (common float 0) counted down, the contact query 0x43ac8c ->
      sp_56's +0x150 0x10a28bc: type 1 ef 2 / type 0 ef 1 (each with the sp_01 0 child, 14 when the shell's mode is 6..11 -- both hit only)
      / type 2 ef 3, at the contact into +0x1604; then the end. 0xfe: the life counted down, both handles gone -> deleted.
- **Viewer**: SHELL_DATA.em086_00 (code 'em086', spawn086). input.ownerMatrix feeds the cone.
- **Check**: dev/shells-valstrax-check.mjs 15/15 -- the six shots each way (a08 / c8 / c8far, their contacts and children), the blasts;
  controls: the facing, the target (two), the floor, the owner, joint 165. Page 3/3. The records (u 10 / 20 / 21 / 30 / 500 / 501) are
  NOT exported yet: recording requested.
"""
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
s = s.rstrip('\n') + '\n' + spec
open(p, 'w', encoding='utf8').write(s)

p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| `0x329c9c(h, pos, i)` / `0x329d04(h, rotDeg, i)` |"
i = s.index(a); j = s.index('\n', i)
rows = (
"| `0x1098b2c(e, r1)` / `0x1098fa4(e, r5)` / `0x1099f20` / `0x109a1a0` / `0x109a5b4` | Valstrax's makers: sp_56 0..5 / 6..11 on L2 M32 at tune 0xc..0x11 (r1 1: the target coned first); sp_01 1 / 2 L2 M36 f120 (r5 1: 3 / 4 L2 M37 f65); sp_01 5 L2 M63 f6; sp_01 8 L2 M67 f48 with the words saved at phase 1's end (e+0xcac0..); (7, 0x34 / 0x35) sp_01 7 at L2 M71's start | uEm086_00 | R + E | elder spec 9 |\n"
"| `0x1098bc8..0x1098e34` | Valstrax's cone: the target block +0x1d0 kept within tune ints 0xa / 0xb (30 deg) of his frame's forward axis (vt+0x54(-1) = +0xb0), from block +0x40 + tune vec 3 x size | uEm086_00 | R + E | elder spec 9 |\n"
"| `0x42dce4` / `0x42e4dc` / `0x42e5e8` / `0x42e7b8` / `0x42e910` / `0x42dae8` | **BASE56** init (aim point, joint row 3 + turned offset, re-aimed words, the velocity, ef 0) / move / state 1 / the flight (stepFlight, words from the velocity) / end / the contact effect into +0x1604 | uShellEmBase56 | R + E | elder spec 9 |\n"
"| `0x10a2788` / `0x10a28bc` / `0x10a25b0` | sp_56's reader (the life = the common float 0 by 0x4a2264) / sp_56's +0x150 (type 1 ef 2, 0 ef 1, 2 ef 3; sp_01 0 / 14 at the contact) / sp_01's reader (0x800 int 0, 0x20 int 3) | uEm086_00 | R + E | elder spec 9 |\n"
"| `0x4a2264(shell, i)` | the shell resource's COMMON FUP float i (0x489ea4, vt+0x4c) -- no mode | shared | R | elder spec 9 |\n"
"| `0x4a0ee4(shell)` | the shell's own mode (setup +8; no setup: 0xff) | shared | R | elder spec 9 |\n")
s = s[:j + 1] + rows + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "| base42 | the water line"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + "| base56 | the homing shot: from a joint, aimed at a point (the target or ahead of the owner, offset by its size), a straight flight, a contact effect by surface type, a life from the COMMON file | `0x42dce4` / `0x42e5e8` | elder 9 |\n" + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "      - [ ] (bug) Amatsu's water lines show nothing until em058_00u 50 / 51 are recorded and lifted.\n"
assert s.count(a) == 1
s = s.replace(a, a +
  "      - [x] 2026-10-19 -- VALSTRAX'S SHELLS (spec dev/elder-dragon-shells-spec.md 9): his six homing shots (L2 M32; the targeted set\n"
  "        kept in his forward cone) and his blasts (L2 M36 / M37 / M63 / M67 / M71). Check 15/15.\n"
  "      - [ ] (bug) Valstrax's shells show nothing until em086_00u 10 / 20 / 21 / 30 / 500 / 501 are recorded and lifted.\n")
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')

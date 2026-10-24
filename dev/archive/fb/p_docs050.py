D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
spec = """
## 7. Alatreon (em050_00) -- uEm050_00 (2026-10-19)

- **Which actions**: em050_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain050.py; edge (7, 0xf) -> (7, 0x19)).
  Class main 0xeccc1c, vtable 0x17c7254, band 0xec480c..0xed0a38 (fb/band050.txt). The status-7 table 0xecbc98 (82 offsets on
  e+0x73e1; fb/stdisp.py) gives the helpers' arguments. Not reached (named): (7, 0x48..0x51) (0xec91f0's sp_01).
- **The makers** (cengen11 + two timer makers it cannot see, trap 83: found by the id immediates; fb/motqx.py the clips; fb/setups.py the
  setups):
  - (4, 0x09 / 0x0f) phase 2 (L1 M11 / L1 M9) f6: sp_00 2. (7, 0x02 / 0x21) 0xec7ae0(side) L2 M6 f76: sp_00 0 / 1. Zero setups.
  - (7, 0x06) 0xec7f14 phase 3 (L2 M3, set at the landing 0xbf4e4) f2: sp_01 2 at the block point + (lat, 0, fwd) turned by Y, lat = 8 x
    (u8(h) - 128), fwd = 1000 + 5 x (h >> 8). (7, 0x18) 0xec7870(1) L2 M5 f170: the same with fwd = -200 - 5 x (h >> 8).
  - (7, 0x0d / 0x40) 0xec8544(k 0 / 3) phase 2 (L2 M9) f24 / 26 / 30: sp_41 5 / 6 / 7 and 2 / 3 / 4 (joint 3, zero setups). (7, 0x0e /
    0x25) (k 1 / 2): the beam sp_02 0 (render/beam-spawns.js, the beams lane's; its (7, 0x25) row is missing there -- reported).
  - (7, 0x19) 0xec9af0 phase 0 (with its setMotion L2 M21): three sp_41 0 at the block point + (4 x (u8 - 128), 2000, 1000 + 5 x u8)
    turned by Y, the bytes from hashes of h (h x 0x12d6f3 / 0x74a04f through 0xcccccccd's high word, h x 0x34bf15). +0xcad0 = 150.0.
  - (7, 0x1a) 0xec9eb8 L0 M14 f164 / 224 / 284: sp_01 3 at three of six points round him ((+-800, 0, +-800), (+-1200, 0, 0)) turned by
    Y: a = h % 6, b = (h >> 4) % 5 past a, c = (h >> 8) & 3 past both.
  - (7, 0x36 / 0x37) 0xecb4f8 L2 M6 f74: sp_11 0 / 1 at the block point. (7, 0x38 / 0x39 / 0x3f) 0xecb774(k 0 / 1 / 2) L2 M7: k 2 f96 sp_01
    5 at the target (0xc460c first); f164 phase 2 (L2 M21) and sp_11 2 / 3 (k 0 / 1) or sp_01 5 at the target (k 2).
  - **(7, 0x20)** 0xecad24 L2 M7: phase 1 from f130, every P+0x1bc > 14 (+ the step each call), 0xecaad8(e, h & 3, i, h) up to 35: sp_41
    1 from 2000 above V[T[sel][i]] (0x169ed48 4 x 35 bytes; V at BSS 0x212aa70, 69 WORLD points read on the booted executable) scattered
    by 0xc1420 (radius 0x1592938[sel] = 630 x u8(hash) / 255 at the angle hash & 0xff00, 0x232700), or -- the target a hunter (P+0x230
    <= 2) and (sel 0 ? i & 3 == 0 : i & 7 == (h x 0x4148654) & 4) -- above the target. At f164 with 35 made: phase 2 (L2 M21).
  - **(7, 0x35 / 0x3a..0x3e)** 0xecb36c(k 0..5) L2 M28: phase 1 from f158, every P+0x1bc > 7, 0xecb128(e, k, i, h) up to 10: sp_01 4 at
    the block point + V[T[k][i]] (0x169edd4 6 x 10 bytes; V at BSS 0x212aec0, 57 offsets, NOT turned) or -- k >= 2, the target a
    hunter, (h + i) % 10 == 0 -- sp_01 5 at the target. P+0x1bc is not zeroed by this action (a leftover in the game; 0 here, named).
  - Below them: sp_00's landing (sp_01 0 / 1 by mode), sp_11's strikes (sp_01 4).
- **The classes**:
  - sp_00 0xef (base00): reader 0xecf594 (ef 0 / 1, ef 2 -> +0x15d4, ef 3 -> +0x15d0; joint int 0; floats X / Y degrees, vz, vy, the flight;
    vec 0 the offset, vec 1 the gravity); init 0xecf56c (base00's, then +0x15c1 = 1); landing 0xecf6e4 (type 0: param 1 and the end; type
    1: param 3, sp_01 [0, 0, 1][mode] at the contact, the end; type 2: param 2 and NO end).
  - sp_01 0xf0 (base01): reader 0xecf990 (ef 0, ef 1 -> +0x15d0 the 0x20 switch's; flags 1 int 0, 0x20 int 1, 0x400 int 3, 4 int 4, 8 int
    5; joint int 2). Modes 2 / 3 switch u 90 -> u 91. Modes 6 / 7 made by no read maker (7's 0x400 refused by name).
  - sp_11 0xf2 (base11): reader 0xecff90 (the times; the owner's point and words kept; no ef); +0x168 0xed0140: sp_01 4 at the kept point +
    vec k turned by the kept Y (mode 4 none).
  - **BASE41** sp_41 0xf3 (ctor 0x41f210, init 0x41f410, step 0x41fbe8, states 0x41fd40 / 0x4200b0 / 0x420238, landing 0x41eed4, end
    0x420348); reader 0xed0478. Handles in a 9-slot block [+0x1634].
    - Init: the words (setup's zero -> the owner's + X / Y degrees); the point (setup's zero -> joint int 3's row 3 or the owner's point, +
      vec 0 turned X, Y, Z; else the setup's point). THE VELOCITY +0x1010 = (0, float 3, float 2) turned X, Y, Z; THE ACCELERATION +0x1020 =
      (0, vec 1's y, z) turned by Y. Flag 1: held (state 1); else state 2 with ef 0 / 2 and the hit.
    - State 1 (held): ef 1 at once, cmn float 0 (31) frames, ef 0, cmn float 1 (10), then state 2 with ef 2 and the hit.
    - State 2: the life float 4; stepFlight; the rocks' query -> the landing: FIRST the end, then type 0 ef 5, type 2 ef 8, type 1 (+8 &
      0x1040) ef 6, type 1 ef 7 at the contact plus -- flag 4 -- STATE 3 (the hold: float 5 frames, +0x40 += vec 2, ef 0 / 2 stopped at
      once, ef 3) or ef 4 at +0x40.
    - State 3: at its end (or byte +0x151e not 0xff: a hunter's hit, none here) ef 4 and the end. Flag 2: the ground marker (not drawn).
- **Viewer**: SHELL_DATA.em050_00 (22 rows; code 'em050', spawn050). Stand-ins: H73E8_STANDIN = 0, TARGET_KIND050 = 0 (P+0x230, the target
  slot's kind byte written with the target point by 0xcc368: <= 2 INFERRED a hunter). Base41's handles are the runtime's named slots
  (S.handles b0..b8).
- **Check**: dev/shells-alatreon-check.mjs 28/28 -- every maker, both timer makers called every step, the base41 states 1 / 2 / 3 / 0xfe
  all reached. Controls: the facing, the owner's point (twice), the target (twice), the floor, joint 3.
- **Open**: the (7, 0x20) drops' arena points are absolute WORLD coordinates (asked: anchor them to him like Lao's?). Page 19 / 20: u 211
  (the held meteor's) refused at 0xa96dcc until recorded.
"""
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
s = s.rstrip('\n') + '\n' + spec
open(p, 'w', encoding='utf8').write(s)

p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "**BASE21** ctor / init"
i = s.index(a); i = s.rindex('\n', 0, i) + 1; j = s.index('\n', i)
rows = """| `0xeccc1c` / `0xecbc98` | Alatreon's action main / status-7 table (82 offsets): 0xec8544(k) (7, 0xd / 0xe / 0x25 / 0x40 = 0..3), 0xecb36c(k) (7, 0x35 / 0x3a..0x3e = 0..5), 0xecb4f8 (7, 0x36 / 0x37), 0xecb774 (7, 0x38 / 0x39 / 0x3f), 0xec7ae0 (7, 2 / 0x21), 0xec7870 (7, 0x18 = 1), 0xec9af0 (7, 0x19), 0xec9eb8 (7, 0x1a), 0xecad24 (7, 0x20), 0xec91f0 (7, 0x48..0x51) | uEm050_00 | R | elder spec 7 |
| `0xec66d4` / `0xec7b80` / `0xec7f14` / `0xec7870` / `0xec8544` / `0xec9af0` / `0xec9eb8` / `0xecb4f8` / `0xecb774` | Alatreon's makers: sp_00 2 (4, 9 / 0xf) p2 f6; sp_00 side L2 M6 f76; sp_01 2 p3 L2 M3 f2 (lat 8(u8(h)-128), fwd 1000 + 5(h>>8)); sp_01 2 L2 M5 f170 (fwd -200 - 5(h>>8)); sp_41 5..7 / 2..4 p2 L2 M9 f24 / 26 / 30; three sp_41 0 at phase 0, 2000 up (hashes h x 0x12d6f3 / 0x74a04f / 0x34bf15); sp_01 3 at three of six points L0 M14 f164 / 224 / 284; sp_11 0 / 1 L2 M6 f74; sp_11 2 / 3 or sp_01 5 at the target L2 M7 f96 / f164 | uEm050_00 | R + E | elder spec 7 |
| `0xecb36c` -> `0xecb128` / `0x169edd4` / `0x212aec0` | Alatreon's rain (7, 0x35 / 0x3a..0x3e) L2 M28: from f158 every P+0x1bc > 7 x 10: sp_01 4 at the block point + V[T[k][i]] (57 offsets, BSS, not turned) or sp_01 5 at the target (k >= 2, P+0x230 <= 2, (h + i) % 10 == 0). P+0x1bc not zeroed by the action | uEm050_00 | R + E (BSS read on the booted executable) | elder spec 7 |
| `0xecad24` -> `0xecaad8` / `0x169ed48` / `0x212aa70` / `0x1592938` / `0xc1420` / `0x232700` | Alatreon's drops (7, 0x20) L2 M7: from f130 every P+0x1bc > 14 x 35: sp_41 1 2000 above V[T[h & 3][i]] (69 WORLD points, BSS) scattered by 0xc1420 (radius 630 x u8 / 255, angle hash & 0xff00 via 0x232700), or above the target (P+0x230 <= 2 and the i test) | uEm050_00 | R + E | elder spec 7 |
| `0xcc368` / P+0x230 | the target slot's kind byte, written with the target point P+0x1d0 + 16 k (from the target record +0x98); Alatreon's makers test it <= 2 (INFERRED: a hunter) | shared | R (the write) / I (the meaning) | elder spec 7 |
| `0xecf594` / `0xecf56c` / `0xecf6e4` / `0x169ee40` / `0xecf990` / `0xecff90` / `0xed0140` | Alatreon's sp_00 reader (ef 2 -> +0x15d4, ef 3 -> +0x15d0) / init (+0x15c1 = 1) / landing (type 1 param 3 + sp_01 [0,0,1][mode]; type 2 param 2, no end) / sp_01 reader (0x20 int 1, 0x400 int 3, ef 1 -> +0x15d0) / sp_11 reader (no ef) / sp_11 +0x168 (sp_01 4) | uEm050_00 | R + E | elder spec 7 |
| `0xed0478` | sp_41 reader: cmn floats -> +0x15c8 / +0x15cc (the waits) / +0x15d0; ef 0..5 +0x15d4.., 6 +0x15f0, 7 +0x15ec, 8 +0x15f4; hits; flags +0x1604 1 / 2 / 4 by ints 0 / 1 / 2; joint int 3; floats X / Y degrees, the velocity's z / y, the life, the hold; vecs the offset / the acceleration / the landing step | uEm050_00 | R + E | elder spec 7 |
| `0x41f210` / `0x41f410` / `0x41fbe8` / `0x41fd40` / `0x4200b0` / `0x420238` / `0x41eed4` / `0x420348` | **BASE41** ctor / init (words, point, VELOCITY +0x1010 = (0, f3, f2) turned X Y Z, ACCELERATION +0x1020 = vec 1 turned Y) / step / held (two waits) / flight (stepFlight, the query) / landed hold / landing (end first; by type) / end | uShellEmBase41 | R + E | elder spec 7 |
"""
s = s[:j + 1] + rows + s[j + 1:]
a = "| `<scratchpad>\\fb\\emu_fb.py` options 2026-10-18 (3):"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + ("| `<scratchpad>\\fb\\stdisp.py <band.txt> <table> <n>` (a PIC jump table's entries with their first instructions: the helpers' arguments by action); `fb/setups.py <class> <mon> st:n:phase:frame..` (the raw setups trgen's run makes); emu_fb's frame tests: `0xb0968` passes EVERY test when a step says `win`, so a case with several b0968 frames names `winFrames` | -- | Alatreon: the helper arguments, the zero setups, the per-frame cases | trgen's setups show the GOT's zero vector and an owner at 0 alike: read the maker before trusting a zero point |\n") + s[j + 1:]
a = "107. **A shell made by the last unit"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + """108. **emu_fb answers every `0xb0968` with the step's `win` (2026-10-19).** A helper with two b0968 tests in one call (Alatreon's (7, 0x1a) at f70 and f164) passes both under `win: 1`; name `winFrames: [F]` so only that frame's test passes. (T)
109. **A maker's zero setup point in trgen's run can be the owner's point (2026-10-19).** trgen's owner sits at the origin, so `+0x10 = (0, 0, 0)` is either the GOT's zero vector or the owner's +0x40 copied: read the maker's loads before transcribing (Alatreon's sp_01 / sp_11 makers do both). (T)
""" + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "| base21 | a placed effect that follows a joint"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + "| base41 | the held-then-flown meteor: two waits with their effects, a velocity and an acceleration (stepFlight), a landing that may hold it; nine named effect handles | `0x41f410` / `0x41fbe8` | elder 7 |\n" + s[j + 1:]
a = "  - 107 (T, order INFERRED) a child of the last unit of line 18 has its hit slot counted before its first move.\n"
assert s.count(a) == 1
s = s.replace(a, a + "  - 108 (T) emu_fb passes every `0xb0968` under `win`: name `winFrames` for a helper with two frame tests.\n"
                     "  - 109 (T) a zero setup point in a trgen run may be the owner's point (trgen's owner is at the origin): read the maker.\n"
                     "  - (G) timer makers: a phase that counts its own clock (P+0x1bc += the step) and makes a shell every n frames is no frame test;\n"
                     "    find it by the id immediate and run the action main every step in the harness (Alatreon's rain and drops).\n")
open(p, 'w', encoding='utf8').write(s)

p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "      - [x] 2026-10-18 -- TEOSTRA'S SHELLS"
i = s.index(a)
add = ("      - [x] 2026-10-19 -- ALATREON'S SHELLS (spec dev/elder-dragon-shells-spec.md 7): his fire / ice balls, the blasts behind and before\n"
       "        him, the three round him (L0 M14), the strike lines, the strikes at the hunter, the held meteors (L2 M9, L2 M21) and the two\n"
       "        rains (L2 M28 round him, L2 M7 over the arena). Check 28/28 against the ROM's own runs.\n"
       "      - [ ] (question for Raven) Alatreon's (7, 0x20) arena drops use WORLD points (+-6300): anchor them to him like Lao's rubble?\n"
       "      - [ ] (beams lane) beam-spawns.js em050_00 lacks the (7, 0x25) row its comment names (0xec8544 k 2: sp_02 0 at L2 M11 f22).\n")
s = s[:i] + add + s[i:]
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')

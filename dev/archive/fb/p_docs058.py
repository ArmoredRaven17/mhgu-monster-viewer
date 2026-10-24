D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
spec = """
## 8. Amatsu (em058_00) -- uEm058_00 (2026-10-19)

- **His actions keep their phase in the UNIT**: e+0x15e1 (sub-phases +0x15e2 / +0x15e3), not P+0x1a1 (only (1, 0xd) uses P+0x1a1). The
  census with trgen's default (P+0x1a1) finds NOTHING; with FB_PHASEAT=0x15e1 it finds every frame-test maker (trap 110).
- **Which actions**: em058_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain058.py, FB_PHASEAT: no edges). Class main
  0xf07584 (status table 0xf07618: 7 -> 0xf0809c), vtable 0x17cbfc4, band 0xf066ec..0xf111ec. Status-7 table 0xf080c4 (0x1c offsets).
  Not reached: (7, 0x08 / 0x0e / 0x18 / 0x19 / 0x1a / 0x1b) -- every sp_06 and sp_42 maker.
- **The makers** (the frames from his action_tune where the code reads them: 0x20 110, 0x23 220, 0x24 206, 0x25 806, 0x26 200):
  - (7, 0x09) 0xf0cd0c L2 M17 at tune 0x20: sp_00 0 (zero setup).
  - (7, 0x0b) 0xf0d1c4 L2 M19 at tune 0x23: sp_30 0 / 1 / 2 (id, mode, owner). Phase 0 also copies e+0x1480 / +0x1488 / +0x19f4 into ctl
    +0xcae0.. (read by nobody here).
  - (7, 0x0c) 0xf0d3a0 L2 M22 at tune 0x24: sp_01 8 (hit only); the hold P+0x1bc = tune 0x25 counted down (0x7206c); at its end L2 M23 and
    sp_01 1 at the block point with his words (a tail call) -- whose end (+0x154 0xf0fa28, mode 1) makes sp_01 2 at its point.
  - (7, 0x01) 0xf0bd10 L2 M14 f102: sp_01 4 (hit only) while e+0x17f4 bit 0 is clear (no writer of bit 0 found among the 6 `movw #0x17f4`
    sites; bit 1 is set at a part break, 0xf07518: E17F4_STANDIN 0). (7, 0x02) 0xf0be9c L2 M15 f130: sp_01 3 (hit only; +0x20 the block
    point -> its anchor, flag 0x200).
  - NOT BUILT (named; nothing shows): (7, 0x00) 0xf0bc0c L2 M16 f122 sp_29 0 (base29: no effect param, no child); (7, 0x03 / 0x04 / 0x06 /
    0x07) 0xf0c054(k) the dash trail -- sp_01 6 (no effect) each time 0x539d5c on P+0x1bc fires (T = 6 / 3 at the phases, 16 after each),
    on L2 M1 from f92, L2 M2, L2 M4 from f152, L2 M2; the phase moves on 0x78b78 (the dash's arrival: not viewer-visible).
- **The classes**:
  - sp_00 0xfc (base00): reader 0xf0f3a0 (ef 0..3, joint int 0, floats X / Y degrees / vz / the flight, vec 0; vy and the gravity 0); landing
    0xf0f4bc (type 1: sp_01 7 at the SHELL's point and words, then ef 2; types 0 / 2 ef 1 / 3; the end).
  - sp_01 0xfd (base01): reader 0xf0f794 (0x200 int 0, 1 int 2, 0x400 int 1, 2 int 4, 0x100 int 6, 0x80 int 5, 4 int 7, 8 int 8; joint int 3;
    timer float 0; vec 0, vec 1 the words' degrees; cmn floats -> +0x1654.. mode 8's hit windows). Base01's init: flag 0x200 (0x3fac20) the
    anchor = setup +0x20..; flag 0x400 (0x3fac58) y = the ground + vec.y (position and anchor) -- both READ and built (shells.js init011).
  - **BASE30** sp_30 0x101, the whirlwinds (ctor 0x412fb8, init 0x413080, step 0x41330c, move 0x4133d4, end 0x41359c); reader 0xf103b0 (ef
    0, hit 0, floats the anchor's rise / the turn (degrees a frame) / the life, vecs 0 (read by nobody) / the words' degrees / the velocity).
    - Init: the words = the block's + the degrees; +0x40 = the block point + the GOT's ZERO vector turned by Y, y = the ground; life float 2.
    - Move: the anchor = the point + (0, rise, 0); stepFlight; then the velocity = vec 2 turned by the Y word after Y += dt x u16(s32(0.5 +
      turn x 182.04)) (kept as the u32 of the float sum); the life counts down to the end.
- **Viewer**: SHELL_DATA.em058_00 (6 rows; code 'em058', spawn058). (7, 0xc)'s sp_01 1 is a `start` row on L2 M23 (the hold's end).
- **Check**: dev/shells-amatsu-check.mjs 12/12 -- his phase byte written per step (emu_fb step `owner`), 0x7206c unstubbed for the hold.
  Controls: the facing, the ground, the owner's point, joints 3 and 1.
"""
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
s = s.rstrip('\n') + '\n' + spec
open(p, 'w', encoding='utf8').write(s)

p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "**BASE41** ctor / init"
i = s.index(a); i = s.rindex('\n', 0, i) + 1; j = s.index('\n', i)
rows = """| e+0x15e1 / +0x15e2 / +0x15e3 (uEm058_00) | **Amatsu's action phase and sub-phases** (not P+0x1a1; (1, 0xd) alone uses P+0x1a1): every status-7 helper switches on it | uEm058_00 | R | elder spec 8 |
| `0xf07584` / `0xf080c4` | Amatsu's action main (status table 0xf07618) / status-7 table: 0 0xf0bc0c, 1 0xf0bd10, 2 0xf0be9c, 3 / 4 / 6 / 7 0xf0c054(k), 5 0xf0c948, 8 / 0xe 0xf0cae0, 9 0xf0cd0c, 0xa 0xf0cf34 (beam), 0xb 0xf0d1c4, 0xc 0xf0d3a0, 0x14 / 0x15 0xf0d8d0, 0x18 0xf0d9e8, 0x19 0xf0dda0, 0x1a 0xf0e194, 0x1b 0xf0e678 | uEm058_00 | R | elder spec 8 |
| `0xf0cd0c` / `0xf0d1c4` / `0xf0d3a0` / `0xf0bd10` / `0xf0be9c` / `0xf0bc0c` / `0xf0c054` | Amatsu's makers: sp_00 0 L2 M17 at tune 0x20; sp_30 0 / 1 / 2 L2 M19 at tune 0x23; sp_01 8 L2 M22 at tune 0x24, the hold tune 0x25 (0x7206c) -> L2 M23 + sp_01 1; sp_01 4 L2 M14 f102 (e+0x17f4 bit 0 clear); sp_01 3 L2 M15 f130 (+0x20 the block point); sp_29 0 L2 M16 f122 (hit only, not built); the dash trail sp_01 6 by 0x539d5c (hit only, not built) | uEm058_00 | R + E | elder spec 8 |
| `0xf0f3a0` / `0xf0f4bc` / `0xf0f794` / `0xf0fa28` / `0xf103b0` | Amatsu's sp_00 reader / landing (sp_01 7 at the shell's point) / sp_01 reader (0x200 / 0x400 / 0x100 ..) / sp_01 +0x154 (mode 1 -> sp_01 2) / sp_30 reader | uEm058_00 | R + E | elder spec 8 |
| `0x3fac20` / `0x3fac58` | base01 init: flag 0x200 -> the anchor +0x1000 = setup +0x20..; flag 0x400 (the vec pointer set) -> +0x44 and +0x1004 = block +0x5b4 + vec.y | uShellEmBase01 | R + E (Amatsu's check) | elder spec 8; shells.js init011 |
| `0x412fb8` / `0x413080` / `0x41330c` / `0x4133d4` / `0x41359c` | **BASE30** ctor / init (words + degrees; the block point + the GOT zero vector, y = the ground) / step / move (the anchor + rise; stepFlight; the velocity re-turned by Y += dt x u16(s32(0.5 + turn x 182.04)); the life) / end | uShellEmBase30 | R + E | elder spec 8 |
| `0x539d5c(e, &t, rate)` | a countdown: t <= 0 -> 0 and 1; else t -= dt x rate, 1 at <= 0, kept >= 0 (vselge) | shared | R | elder spec 8 |
"""
s = s[:j + 1] + rows + s[j + 1:]
a = "| `<scratchpad>\\fb\\stdisp.py <band.txt> <table> <n>`"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + "| `<scratchpad>\\fb\\trgen.py` env FB_PHASEAT=<off> (2026-10-19): the phase / sub-phase bytes written at E+off as well as P+0x1a1 (cengen11 / rungen11 / chain / motqx inherit it); emu_fb step `owner` {off: bytes} (owner bytes written before that call) | -- | Amatsu: an empty census without it, every maker with it (e+0x15e1) | motqx's printed phase numbers are still P+0x1a1's |\n" + s[j + 1:]
a = "109. **A maker's zero setup point in trgen's run"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + "110. **An empty census can mean the phase byte is elsewhere (2026-10-19).** Amatsu's actions switch on e+0x15e1, not P+0x1a1: cengen11 ran every phase into phase 0's setMotion and found no create. Before calling a class shell-less, read its first status-7 helper's phase load (FB_PHASEAT). (G: the phase byte is a class's choice; T: our tools assumed P+0x1a1)\n" + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "| base41 | the held-then-flown meteor"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + "| base30 | the whirlwind: a placed effect on the ground, flown on a velocity re-turned each frame by a yaw rate, a life | `0x413080` / `0x41330c` | elder 8 |\n" + s[j + 1:]
a = "  - 109 (T) a zero setup point in a trgen run may be the owner's point (trgen's owner is at the origin): read the maker.\n"
assert s.count(a) == 1
s = s.replace(a, a + "  - 110 (G / T) an empty census can be the phase byte living elsewhere (Amatsu's e+0x15e1): read the first helper's phase load.\n")
open(p, 'w', encoding='utf8').write(s)

p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "      - [x] 2026-10-19 -- ALATREON'S SHELLS"
i = s.index(a)
add = ("      - [x] 2026-10-19 -- AMATSU'S SHELLS (spec dev/elder-dragon-shells-spec.md 8): his water ball (L2 M17), the three whirlwinds\n"
       "        (L2 M19) and the burst after his long hold (L2 M23). Check 12/12 against the ROM's own runs. His hit-only shells (the dash\n"
       "        trail, sp_29) are named, not drawn.\n"
       "      - [ ] (idea) Kushala's / Alatreon's base01 flag-0x400 refusals can go now that the arm is read (0x3fac58): re-check their modes.\n")
s = s[:i] + add + s[i:]
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')

D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
spec = """
## 5. Chameleos (em025_00) -- uEm025_00 (2026-10-18)

- **Which actions**: em025_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain025.py: (7, 0x17) -> (7, 0x18),
  (7, 0x16) -> (7, 0x29), ..). Shell actions reached: (7, 0x08 / 0x0d / 0x16 / 0x17 / 0x18 / 0x1e / 0x1f / 0x24 / 0x29). Not reached
  (named): (7, 0x15 / 0x20 / 0x27 / 0x28). His class block [e+0xcac0] is P+0x60 (the ctor 0xe0ffec).
- **The makers** (cengen11; fb/motqx.py the phases' clips):
  - (7, 0x08 / 0x24) phase 2, L2 M15 f2: sp_00 1, joint -1 (the owner's point, its words); the create is the action's tail call.
  - (7, 0x1f) L2 M45 f70: sp_00 0, joint 3.
  - (7, 0x0d / 0x16 / 0x17) L2 M27 f64: sp_13 0; (7, 0x29) phase 2, L2 M27 f64: sp_13 3; (7, 0x1e) L2 M43 f64: sp_13 2.
  - (7, 0x18) L2 M36 (0xe0afb8), phase 0: P+0x30 (the target, stored by vt+0x204 0xdff4f0 at (7, 0x17)'s start: n - 0xe in
    0x2000200, i.e. 0x17 / 0x27) moves +-500 to the side the target's bearing is on (P+0x1a2 = 1 on the left; L2 M37 / M38 blended into
    M36 by 0xb03f8) and 500 ahead (-500 when e+0x73e8 & 0x64 > 0x13: H73E8_STANDIN 0). ctl+0x1c = the bearing to it less the facing,
    folded, at most 0x2aab. f44: ctl+0x1c negated on the left, sp_13 1, whose Y word is its bearing + ctl+0x1c.
  - The class's vt+0x208 0xe00344, every frame by the motion id (fb/probe025.py: 0xb0944 stubbed, every frame literal alone, ctl+0xc
    x ctl+0x13) -- sp_01 footfalls at the owner's +0x40 / words:
    - L2 M6 f84 and L2 M8 f64 / 160 / 256 / 354: mode 0 (joint 142).
    - L1 M2 f64, L1 M7 f22, L1 M8 f32: mode 2 (the owner's ground). Mode 1 instead when ctl+0x13 == 2 and visible; none when ctl+0x13
      == 2 and hidden.
    - L1 M9 f36, L1 M10 f40: mode 1 (none hidden).
    - ctl+0xc (the invisibility: vt+0x208's head copies ctl+0xd..+0x12 into the unit's draw bits e+0x110 / +0x11c) and ctl+0x13
      (written 1 / 2 by vt+0x370(e, 2), 0xe03cdc) are not held: 0, visible.
- **The classes**:
  - sp_00 0xb5 (base00): reader 0xe0eee0 -- joint int 0, offset &vec 0, vz / vy vec 1's z / y, gravity &vec 2. The flags and the
    flight +0x15fc are the ctor's 0 (0x3f8a74 clears +0x15ec..+0x1610), so it lives while hit slot 0 does.
  - sp_00 landing 0xe0efdc: type 1 also makes sp_01 4 (a hit volume). Every type makes the cloud (modes 0 / 3 sel 0, mode 1 sel 1).
  - sp_01 0xb6 (base01): reader 0xe0f2dc (1 int 0, 0x80 int 2, 0x800 int 3, 4 int 4, 8 int 5, the joint int 1). Its one list is
    em025_00c.
  - sp_13 0xb7 (base13): reader 0xe0f510 (flags 2 / 8 / 0x10 by ints 1 / 2 / 3 -- 0x1a on every mode: the points turned by the owner's
    words, times the size, the aim along the facing as it is).
  - sp_13's vt+0x16c 0xe0f7f0: mode 1's Y word.
  - sp_13's vt+0x170 0xe0f7b0: mode 4's target is ctl+0x60 (no action read makes mode 4).
  - sp_13's landing 0xe0f6fc: types 0 / 1 make the cloud (sel 0) and end; type 2 starts ef 3 and does not end.
  - **BASE39** sp_39 0xb8, the poison cloud: init 0x41d780, step 0x41d988, move 0x41da60, end 0x41de84; reader 0xe0f9a8.
    - Placement: the point + vec 0 turned by the OWNER's Y word. Its words are (0, the creator shell's Y word, 0).
    - Life 1200 frames; ef u 3 / u 4. Its hit capsules (ShellCmnParam floats / vecs x n) are not visual.
    - 0x41dc50 (blown away by a hunter's hit) is not reached in the viewer.
  - **The clouds' ring** 0xe0dad8: three slots ctl+0 / 4 / 8, the count ctl+0x95, the load ctl+0x94 (+5 / +10 per cloud), each cloud's
    rank +0x160d (its creation count).
    - Full, or the load >= 30: the rank-0 cloud is ended and its slot taken.
    - The full path's fallback overwrites slot 0, leaving that cloud running out of the ring.
    - A cloud's end (+0x150 0xe0fe78): count - 1, load - 5 / 10, every rank - 1, its slot emptied.
    - The ring is transcribed from the read (cloud025 / end039). The ROM check flies one shell per case, so it does not exercise the
      ring past one cloud.
- **Viewer**: SHELL_DATA.em025_00 (9 action rows + 7 footfall rows: pick 'always', `timer`); code 'em025' (spawn025).
- **Check**: dev/shells-chameleos-check.mjs 20/20 -- the ROM's own runs.
  - Cases: every maker; (7, 0x18) both sides; the footfalls through vt+0x208 with the motion id at e+0x4b4.
  - emu_fb options: `creatorCopy` (the cloud reads its creator's Y word) and `slot0Until` (the hit slot held for the module's count).
  - Controls: facing, target, floor, the (7, 0x18) target.
  - Page 11/11; soak 54 motions, 0 refused.
  - Exports em025_00u 0 / 1 / 2 / 3 / 11, em025_00c 30 / 31. **u 4 (the mode-1 cloud) withheld**: the runtime refuses it at 0xa953f0
    (unrecorded path) -- the effects lane's.
- **Seen**: L2 M45's gob (f70) starts about 13 below the viewer's floor (the head at the ground, offset (0, -80, 140)) and falls through
  it: no landing, no cloud, as the ROM's query would answer for that geometry.
"""
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
s = s.rstrip('\n') + '\n' + spec
open(p, 'w', encoding='utf8').write(s)

p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| Kushala / Tetsucabra snow modes in the viewer (2026-10-18) |"
i = s.index(a); j = s.index('\n', i)
rows = """| `0xe04b54` / `0xe09c78` / `0xe0bb98` / `0xe0c5a0` / `0xe0afb8` | Chameleos's makers: (7, 8 / 0x24) p2 L2 M15 f2 sp_00 1; (7, 0xd / 0x16 / 0x17) L2 M27 f64 sp_13 0; (7, 0x1f) L2 M45 f70 sp_00 0, (7, 0x1e) L2 M43 f64 sp_13 2; (7, 0x29) p2 L2 M27 f64 sp_13 3; (7, 0x18) L2 M36: P+0x30 +-500 aside / 500 ahead, ctl+0x1c the folded bearing (<= 0x2aab), f44 sp_13 1 | uEm025_00 | R + E | elder spec 5 |
| `0xdff4f0` (vt+0x204) | Chameleos: at (7, 0x17 / 0x27)'s start (n - 0xe in 0x2000200) P+0x30 = the target block +0x1d0 | uEm025_00 | R | elder spec 5 |
| `0xe00344` (vt+0x208) | Chameleos: the unit's draw bits from ctl+0xd..+0x12 (the invisibility), and the sp_01 footfalls by motion id / frame (L2 M6 / M8 mode 0; L1 M2 / M7 / M8 mode 2, 1 with ctl+0x13 == 2; L1 M9 / M10 mode 1; none hidden) | uEm025_00 | R + E (fb/probe025.py) | elder spec 5 |
| `0xe0eee0` / `0xe0efdc` / `0xe0f2dc` / `0xe0f510` / `0xe0f6fc` / `0xe0f7b0` / `0xe0f7f0` | Chameleos's sp_00 reader / landing (sp_01 4 on type 1; the cloud every type) / sp_01 reader / sp_13 reader (flags 2 / 8 / 0x10) / sp_13 landing (type 2 no end) / sp_13 target (mode 4 ctl+0x60) / sp_13 Y word (mode 1 + ctl+0x1c) | uEm025_00 | R + E | elder spec 5 |
| `0xe0dad8` / `0xe0fe78` / `0xe0da34` / `0xe0f9a8` | the clouds' ring (ctl+0 / 4 / 8, count +0x95, load +0x94, rank +0x160d) / a cloud's end bookkeeping / the ranks' shift / sp_39 reader | uEm025_00 | R | elder spec 5 |
| `0x41d514..` / `0x41d780` / `0x41d988` / `0x41da60` / `0x41dc50` / `0x41de84` | **BASE39** ctor / init (point + vec 0 by the owner's Y, words (0, the creator's Y, 0)) / step / move (the life) / the blow-away (a hunter's hit) / end | uShellEmBase39 | R + E | elder spec 5 |
"""
s = s[:j + 1] + rows + s[j + 1:]
a = "| `<scratchpad>\\fb\\sw.py <lo> <hi>` / `dz.py` |"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + ("| `<scratchpad>\\fb\\emu_fb.py` options 2026-10-18 (2): `creatorCopy` (a child whose setup +0x10 names its creator gets a copy of the creator as its flight left it), `slot0Until` {'id:mode': move} (hit slot 0 held through that move: the module's slot count) ; `<scratchpad>\\fb\\probe025.py` (a class's vt+0x208 by motion id, 0xb0944 stubbed, every frame literal alone, over class bytes) | -- | Chameleos: the cloud's words (failed without creatorCopy), the footfalls' and gobs' lives (failed at move 1 without slot0Until) | slot0Until mirrors the module's INFERRED slot order; it is not a ROM read |\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "      - [x] 2026-10-18 -- Lao-Shan Lung's rubble falls around him:"
i = s.index(a)
add = ("      - [x] 2026-10-18 -- CHAMELEOS'S SHELLS (spec dev/elder-dragon-shells-spec.md 5): his poison gobs and spat poison, the poison\n"
       "        cloud each landing leaves (at most three: the oldest gives way), his sideways spit (7, 0x18) aimed past the hunter, and the\n"
       "        dust of his footfalls. Check 20/20 against the ROM's own runs + page 11/11; soak 54 motions, 0 refused.\n"
       "      - [ ] (bug, effects lane) Chameleos u 4 (the mode-1 poison cloud) refused by the runtime at 0xa953f0: withheld from the export.\n")
s = s[:i] + add + s[i:]
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')

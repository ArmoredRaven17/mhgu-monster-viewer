# doc_patch2.py: 0x7dc9a0 transcribed -- dev/effect-runtime-engine.md (the shells' hunter contact section), dev/attack-hitshapes.md 4,
# dev/rom-map.md (the type-3 row in place, new rows, the Withdrawn entry). Patches in place.
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
def patch(name, pairs):
    p = D + '\\' + name
    s = open(p, encoding='utf8').read()
    for a, b in pairs:
        assert s.count(a) == 1, (name, a[:80])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8').write(s)

# ---- effect-runtime-engine.md ----
patch('effect-runtime-engine.md', [(
"""  a sphere (code 0) or capsule (1 / 2) at position + rotated (ZXY words) scaled offsets. Codes 4 / 6 and j0 1010 are unread.""",
"""  a sphere (code 0) or capsule (1 / 2) at position + rotated (ZXY words) scaled offsets. Codes 4 / 6: the third type, below (READ,
  effects lane, 2026-10-22). j0 1010 is unread."""),
("""- The viewer: shells.js hunterPass / collide's hunter arm, data docs/render/shell-hitshapes.js, input.hunterBody (the Hunter control).""",
"""- The viewer: shells.js hunterPass / collide's hunter arm, data docs/render/shell-hitshapes.js, input.hunterBody (the Hunter control).

### The third hit-shape type: hit-size codes 4 / 6, a flat-ended cylinder (effects lane, 2026-10-22; READ + transcribed)

Shared by a monster's attack records and a shell's hit slots (the same hit manager, the same HTS record). Portable: the build and the
test are hit-manager code, not class code, so another MT-framework MH with these codes should run the same routines (find them by
the shape-type byte 3 the builders leave, and the hunter pass's three-way switch on it).
- **Build** (both builders end at `mov sb, #3`, `0x170160`; R = s x the record's radius, s the builder's scale):
  - a joint's (enemy, `0x16ddd0`; table `0x16deac`): code 4 `0x16e89c`, code 6 `0x16ec78`;
  - the unit's / a shell's (j0 255, `0x16dbd4`; table `0x16dbf4`): code 4 `0x16e368` -> `0x16fcbc`, code 6 `0x16e470` -> `0x170058`;
  - P = the frame's point for s x o0 (exactly as codes 0..2 place o0);
  - code 4: the ends P + (0, s x o1.x, 0) and P + (0, s x o1.y, 0), along the WORLD's up; code 6: P + Y x s x o1.x / o1.y, Y the
    frame's row 1 (a joint: enemy vt+0x54 `0xc156c`, its world matrix; a shell / the unit: the angle words' row 1). The X / Z rows'
    factor is a literal 0.0 (`0x16e964` / `0x170238`), so o1.z is unused. Codes 3 / 5 build no shape.
- **Test** (the hunter pass `0x16b6cc`: the shape's type byte, mgr +0x2030: 1 -> `0x167d2c`, 2 -> `0x1676f0`, **3 -> `0x16b88c` ->
  `0x167f70`**): `0x167f70(shape, hunter capsule, out)` -> `0x7dda24` -> `0x7dc9a0(shape, capsule, &info, &t)`, which calls
  `0x806ce4` (the two axes' closest points), `0x7ebfd8` -> `0x80017c` (the hunter's line through the plane across the axis),
  `0x7db964` -> `0x8069d8`, `0x80448c` -> `0x8060ac`, sqrtf `0x13ecc14`. info: point +0x10, normal +0x20, distance +0x30.
  **Meets when the distance <= the capsule's r** (`0x7dda88`, movwls); **out = point + (distance - r) x normal** (`0x7ddadc..`), w 0
  (`0x167fd0`): the point on the hunter's surface toward the cylinder. The solid is a cylinder with FLAT ends (a probe above the
  end meets only within r of the cap).
- **What 0x7dc9a0 does** (its structure; the transcription is the authority): the two axes normalised; their closest points ->
  C on the cylinder's axis and the plane across the axis at C; if the hunter's line crosses that plane inside the disk (|P - C| < R,
  `0x7ebfd8`) the hunter's axis passes THROUGH the cylinder (normal (P - C) / |P - C|, or the world axis X / Y / Z least along the
  cylinder's when P is on the axis, `0x7dd3d0`; the axes are BSS constants at `0x19176e0` / `0x19176f0` / `0x1917700`, written by
  the static initialiser `0x7c4708..0x7c473c` -- a harness must run the initialisers or that branch reads zeros); else beside the
  SIDE (normal from the axis point, point on the surface, distance |d| - R, `0x7dcf0c`); else near an END (the nearer end's disk,
  `0x8069d8`, then the face or the rim through `0x7db964`, `0x7dd320..0x7dd380`).
- **Transcription**: docs/render/hit-type3.js, generated line by line from main.text by `<scratchpad>/t3/arm2js.py` (one statement
  per instruction, its address the label; f32 registers, unfused vmla / vmls, the FPSCR flags apart from the APSR until vmrs).
  Bit-exact against the ROM on 1537 cases (t3diff.py / t3hunt*.py -> t3diff.mjs), including the axis through the cylinder, rims,
  parallel and degenerate axes. The same method transcribes any other float leaf routine: generate, then diff against the ROM on
  an initialised machine. **Trap:** vcmpe writes the FPSCR flags; the APSR changes only at vmrs, so a conditional instruction between
  a vcmpe and its vmrs still sees the PREVIOUS compare (`0x7dd354..0x7dd368` relies on it).""")])

# ---- attack-hitshapes.md 4 ----
patch('attack-hitshapes.md', [(
"""* **Test**: the hunter pass `0x16b6cc` takes the attack shape's type byte (mgr +0x2030): 3 -> `0x16b88c` -> `0x167f70(attack, hunter
  capsule, out)` -> `0x7dda24` -> `0x7dc9a0`, its own routine, not the capsules' `0x1676f0` / `0x167024`. `0x7dc9a0` reads the
  shape's R (`0x7dcc3c` / `0x7dcea0` / `0x7dcee4`); `0x7dda24` meets when the returned distance <= the hunter's radius (`movwls`).
  The out point (`0x167fb8..0x167fd0`) is the hunter's axis point less r along the shape's outward normal there.""",
"""* **Test**: the hunter pass `0x16b6cc` takes the attack shape's type byte (mgr +0x2030): 3 -> `0x16b88c` -> `0x167f70(attack, hunter
  capsule, out)` -> `0x7dda24` -> `0x7dc9a0`, its own routine, not the capsules' `0x1676f0` / `0x167024`. `0x7dc9a0` (with
  `0x806ce4`, `0x7ebfd8` -> `0x80017c`, `0x7db964` -> `0x8069d8`, `0x80448c` -> `0x8060ac`) fills info: point +0x10, normal +0x20,
  distance +0x30. `0x7dda24` meets when the distance <= the hunter's radius (`movwls`); out = point + (distance - r) x normal
  (`0x7ddadc..`), w 0 (`0x167fd0`). Its structure: dev/effect-runtime-engine.md, "The third hit-shape type"."""),
("""* **The viewer's test** (`render/hit-type3.js`, shared with the shells' hunter pass): the Euclidean distance to a flat cylinder,
  solved numerically. Against the ROM-RUN (`t3check.mjs`; `t3check2.mjs` over `t3rand.py`'s cases): MEETS agrees on 20 / 20 aligned
  and 459 / 460 random placements (the miss is within 0.65 of the boundary); the out point agrees on the aligned ones and most random
  ones, not where the hunter's axis passes through the cylinder or skims a rim. OPEN: `0x7dc9a0` transcribed, for a float-exact
  contact point.""",
"""* **The viewer's test is the ROM's** (`render/hit-type3.js`, shared with the shells' hunter pass): `0x167f70`, `0x7dda24`,
  `0x7dc9a0` and its seven callees TRANSCRIBED LINE BY LINE, generated from main.text by `<scratchpad>/t3/arm2js.py` (2392
  instructions, one statement each under its address). Diffed against the ROM run natively after the static initialisers
  (`t3diff.py`, `t3hunt.py`, `t3hunt2.py` -> `t3diff.mjs`), **1537 cases**: the first check's 480 (20 aligned, 60 + 400 random),
  300 with the hunter's axis through the cylinder, 300 skimming a rim, 150 parallel, 100 degenerate, 200 game-sized, 7 targeted at
  unexercised blocks. **Meet / no-meet: 1537 / 1537 agree. Contact point: bit-exact in every meeting case (max error 0, max 0 ulp).**
  Coverage 2240 / 2392 instructions; the rest: 118 sqrtf-on-NaN fallbacks, 21 this caller cannot reach (`0x7dda84..0x7ddad0`,
  `0x7dcf20`), 13 not reached (`0x7dd57c..0x7dd5ac`, the axis path with R^2 under 1.19e-7).
  (It replaces the numeric cylinder test of the first pass, which agreed on meets 459 / 460 but not on the out point -- Withdrawn.)""")])

# ---- rom-map.md ----
p = D + '\\rom-map.md'
s = open(p, encoding='utf8').read()
a = """`0x7dc9a0` itself NOT transcribed: the viewer's numeric test agrees on meets 479 / 480 runs, the out point not where the axes cross or at a rim | shared hit | R (path, R read, meets rule) + ROM-RUN (shape) / NR (0x7dc9a0 lines) | dev/attack-hitshapes.md 4; `<scratchpad>/t3/t3emu.py`, `t3check.mjs`, `t3check2.mjs` |"""
b = """**TRANSCRIBED line by line 2026-10-22** (with its callees, next rows): info point +0x10 / normal +0x20 / distance +0x30; out = point + (distance - r) x normal (`0x7ddadc..`) | shared hit | R (transcribed; bit-exact vs the ROM on 1537 cases) | dev/attack-hitshapes.md 4; dev/effect-runtime-engine.md "The third hit-shape type"; docs/render/hit-type3.js |
| `0x7dc9a0` (0x7dc9a0..0x7dd8d8) and callees `0x806ce4` (..0x8077f8), `0x7db964` (..0x7dbdd4), `0x7ebfd8` (..0x7ec0d8), `0x80017c` (..0x800298), `0x80448c` (..0x8045e0), `0x8060ac` (..0x806108), `0x8069d8` (..0x806b04); `0x167f70`, `0x7dda24` | THE TYPE-3 CONTACT ROUTINE, transcribed: the axes' closest points (`0x806ce4`, eps 0.001) -> C on the cylinder's axis; the hunter's line through the plane across the axis at C (`0x7ebfd8` -> `0x80017c`, kept when \\|P - C\\| < R strictly): THROUGH the cylinder (normal (P - C) / \\|P - C\\|, or a world axis when P is on the axis `0x7dd3d0`); else the SIDE (s clear of both ends by 0.001: point on the surface, distance \\|d\\| - R `0x7dcf0c`); else an END (the nearer end's disk `0x7dd068`, `0x8069d8`, face / rim r3 0 / 1 / 2 `0x7dd320..0x7dd380`, rim through `0x7db964`) | shared hit | R (generated line by line from main.text; bit-exact vs the ROM, 1537 cases; 2240 / 2392 instructions exercised, the rest NaN-sqrt fallbacks, caller-unreachable `0x7dda84..0x7ddad0` / `0x7dcf20`, and unreached `0x7dd57c..0x7dd5ac`) | docs/render/hit-type3.js (GENERATED block); `<scratchpad>/t3/arm2js.py` |
| `0x19176e0` / `0x19176f0` / `0x1917700` (BSS; GOT `0x1832134` / `0x1832130` / `0x1832184`) | the world axes X (1, 0, 0) / Y / Z, 16 B each, written by the static initialiser `0x7c4708..0x7c473c`; read by `0x7dc9a0`'s axis-crossing branch (`0x7dd3e0..0x7dd448`, the axis least along the cylinder's, dot < 0.999) | shared math | R | a harness must run the static initialisers first, or these read 0 |
| tooling: `<scratchpad>/t3/arm2js.py` (+ `t3diff.py`, `t3hunt.py`, `t3hunt2.py`, `t3diff.mjs`, `cover.mjs`, `tracecmp.py`) | an ARM-VFP leaf routine -> JS, one statement per instruction under its address (f32 registers, unfused vmla / vmls, FPSCR flags apart from the APSR until vmrs, the GOT literals resolved, the stack and blocks in a DataView); the diff runs the ROM on build/arm emu after init_array | validated: 1537 cases bit-exact; tracecmp.py finds the first diverging instruction | **trap: vcmpe writes the FPSCR only; a conditional op before the vmrs sees the previous compare** (`0x7dd354..0x7dd368`) -- a translator that sets the APSR at vcmpe fails 27 of 1530 |"""
assert s.count(a) == 1, 'row'
s = s.replace(a, b)
wa = '### Withdrawn — kept so they are not rediscovered\n\n| claim | why wrong | correction |\n|---|---|---|\n'
assert s.count(wa) >= 1
i = s.index(wa) + len(wa)
w = """| render/hit-type3.js first pass (effects lane, 2026-10-22): the viewer's type-3 test as "the exact Euclidean distance to a flat cylinder, solved numerically", and the t3emu.py ROM-RUN as the reference | an approximation of the ROM's routine: its contact point differed where the hunter's axis passes through the cylinder or skims a rim, and one meet in 460 differed; t3emu.py ran without the static initialisers, so `0x7dc9a0`'s axis branch read zeros for the BSS axes `0x19176e0..` (its 20 aligned probes stand: re-run bit-exact on an initialised machine) | `0x167f70` / `0x7dc9a0` and callees transcribed line by line (hit-type3.js GENERATED block), bit-exact on 1537 cases; reference harness t3diff.py (build/arm emu after init_array) |
"""
s = s[:i] + w + s[i:]
open(p, 'w', encoding='utf8').write(s)
print('ok')

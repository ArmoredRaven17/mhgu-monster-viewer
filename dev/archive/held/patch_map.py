"""Patch dev/rom-map.md in place: upgrade / correct the uEm088_Rubble rows, add the held-object rows, a Withdrawn row,
the note index row, a tooling row and trap 60. Every anchor must match exactly once, or nothing is written."""
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
L = s.split(nl)

def one(pred, what):
    hits = [i for i, l in enumerate(L) if pred(l)]
    if len(hits) != 1:
        sys.exit('anchor %s: %d hits' % (what, len(hits)))
    return hits[0]

# 1. the vt+0x88..+0xa8 row: slot fix + +0x34 status upgrade
i = one(lambda l: l.startswith('| uEm088_Rubble vt+0x88..+0xa8 ('), 'vt88 row')
old_a = "`E+0xcb14` != 0xff -> `0x2b3c8(G?, 3, v, pos)` (vt+0x8c / `0x10af0d0`, meaning NR)"
new_a = ("`E+0xcb14` != 0xff -> `0x2b3c8(G, -, v, pos)` from **vt+0x28 `0x10af0d0`** (a pooled ground marker at the "
         "piece's x / z, never the piece; vt+0x8c is `0x10af294`: unit `+0x10` bits 2..3 = 3 / 1 -- corrected 2026-10-16, "
         "Withdrawn table)")
old_b = "| uEm088_Rubble | R (+0x34 a joint NUMBER: I) | spec §1b |"
new_b = ("| uEm088_Rubble | R (+0x34 a joint NUMBER: **R** 2026-10-16 -- `0x8a5480` -> vt+0x54 `0x939278`, rows below) | "
         "spec §1b; dev/em088-held-objects.md |")
assert L[i].count(old_a) == 1 and L[i].count(old_b) == 1, 'vt88 row text'
L[i] = L[i].replace(old_a, new_a).replace(old_b, new_b)

# 2. the 0x10af334 row: its slot is vt+0x94
j = one(lambda l: l.startswith('| `0x10af334` (uEm087_Rubble vt+0x90 neighbour)'), '10af334 row')
L[j] = L[j].replace('(uEm087_Rubble vt+0x90 neighbour)', '(uEm087_Rubble vt+0x94; corrected 2026-10-16, was "vt+0x90 neighbour")')

D = 'dev/em088-held-objects.md'
rows = [
 "| **held objects, all three k (2026-10-16, research agent; Raven: \"Double check how Frame is held\")** | the game holds rubble_01 / 02 / 03 (Spike / Wheel / Frame) IDENTICALLY: one uEm088_Rubble, parent E joint number **0x82 = 130 for every k**, local position **(0, 0, 0)**, local rotation **identity**, both rewritten every held frame; local scale = `0xbe518(E)` captured once at creation; only the model differs (`[E+0xcb00 + 4k]`). World = `s_unit` x joint 130's FULL world (inherit mode 3). At his size 1.0 that is exactly the viewer's draw (joint world, scale out, size in): **no viewer change** | uEm088_Rubble | R (s_unit's value at capture: I) | " + D + " §0 |",
 "| `0x10af348` / `0x10af334` / `0x10af3e0` (vt+0x94 of `0x17fa234` / `0x17fa180` / `0x17fa0cc`) | the parent joint: Ka `+0x34 = 0x82` constant; Neset `+0x34 = 0x82 + id` (`+0xfd8` <= 2); RubbleBase `bx lr`. Census control: the same depth-1 store scan finds Neset's `addls / strls` at `0x10af33c / 0x10af340` | uEm088_Rubble / uEm087_Rubble | R | " + D + " §1 |",
 "| `0x10af010..0x10af03c` (RubbleBase move, held branch) | `+0x40/+0x44/+0x48` = vec at GOT `0x1831a78` -> **`0x19176b0` = (0, 0, 0, 0)** (.bss, written by init_array #1383 at `0x7c46c0..0x7c46cc`; control: `0x19176c0` = (1, 1, 1, 0) in the same run), `+0x4c` = 0; `0x8a4dfc(unit, &0x19176b0)` -> quat `+0x50` = (0, 0, 0, 1); then vt+0x48 `0x457c8` (`strd` `+0x30` parent / `+0x34` joint) | RubbleBase | R (emulated) | " + D + " §2 |",
 "| `0x8a4dfc(unit, &angles)` | Euler -> quaternion `+0x50..+0x5c`: order `+0x38 & 0xffff` (6-way table; > 5 a constant matrix), `0x72dec`, negated when w < 0 (`0x8a5320`) | uCoord | R | " + D + " §2 |",
 "| `0x8a53bc` (uCoord vt+0x4c) / **`0x8a5480`** (uCoord vt+0x50; uModel vt+0x50 `0x94b288` -> `0x88de58` -> it) | local `+0x70` = R(quat `+0x50`) + T(`+0x40`), no scale. World: parent `+0x30` alive -> `[parent]vt+0x54(parent, +0x34)` (`+0x34` < 0 -> parent `+0xb0`), `0x29d00(out, +0x70, P)`; **inherit mode `+0x38 >> 16`: 0 rotation from constants (identity) / 1 rows normalised / 2 diag(row lengths) / 3+ the product as is**; then rows 0..2 x `+0x60/+0x64/+0x68`, translation untouched. No parent -> `+0x70` rows x scale | uCoord / uModel | R | " + D + " §3 |",
 "| `0x939278` (uModel vt+0x54; adds to the row above at line ~350) | joint NUMBER -> `byte [model+0x498][uxtb(n)]` (the .mod's 256-byte id -> index remap); 0xff -> model `+0xb0`; else `[model+0x494] + 0xa0 x idx + 0x10` (the joint's world matrix). **uCoord `+0x34` is a joint number (mod id)** | uModel | R | " + D + " §1 |",
 "| `0x94b734..0x94b760` | joint world = `0x1ebe8(out, local, parent)`, parent = `[joint+0x90]` bits 8..15: 0xff -> model `+0xb0` (which carries the model's `+0x60` scale), else parent joint `+0x10` -> joint worlds INCLUDE the monster size | uModel | R | " + D + " §3 |",
 "| uEm088_Rubble `+0x38` | **`0x00030004`** after its ctor `0x10aeef8` (emulated on a zeroed block; the bare uModel ctor `0x9366e0` gives the same -- the control): inherit **mode 3**, Euler order 4. No store to `+0x38 / +0x3a` in the class's methods, its creator, or the generic uModel methods it calls (depth-1 census; finds `+0x34 / +0x40 / +0x50 / +0x60`) | uEm088_Rubble | R (emulated) | " + D + " §3 |",
 "| `0x10af1b4(unit, owner, index)` | `+0xfd0` owner, `+0xfd4` index, **`+0x60..+0x68` = `0xbe518(owner)`**, `+0x6c` 0, `+0x100` = owner `+0x100`; the ONLY writer of the unit's scale; called once at creation (`0x10b311c` Ka, `0x10a30f4` Neset) | RubbleBase | R | " + D + " §2 |",
 "| `0xbe518(E)` at the rubble's creation | `P+0x1ac x P+0x1b0` (P = `[E+0x1428]`): `P+0x1ac` = 1.0 in the enemy ctor (`0xacbd0` -> `0xacce0`, `0xacdc8`) and = the dtbase multiplier only at `0xb94d0` (`0xb8b98`, called from the base init `0xad5b0` AFTER the capture; other callers `0x5ecd0 / 0x6643c / 0x66704 / 0xcc104` timing NR); `P+0x1b0` = spawn size at `0x6fbdc` (`0x6fa58`, spawner `0x4ebe4`, before `0xc03670`) and `0xa6750 / 0xa67cc` (`0xa6618` <- `0xada80` <- enemy move `0xad6f8`). E's own `+0x60` = `0xbe518(E)` at `0xad678` / `0xae0c4`. So `s_unit` = (1.0 or multiplier) x spawn size: = 1 for Ahtal-Ka in the viewer (sizeBase 1.0, no size options) | shared enemy | R (stores) / I (vt+0x18's call time vs those writers) | " + D + " §3 |",
 "| `E+0xcb14` | ctor `0x10b2e50` 0xff; frame update `0x10b4030` 0xff every frame BEFORE the event walker (`0x10b4040`); event type 7 `0x10bb280..0x10bb290` = u32(arg float `+0x1c`). Read by vt+0xa4 `0x10af3c4` -> `0x10bc1e0` (word) | uEm088_00 | R | " + D + " §4 |",
 "| `0x10af0d0` (RubbleBase vt+0x28) | owner alive, unit `+0xc & 0x4807 == 0x4802`, owner byte `+0x1054` == `[G]+0x49`, v = `E+0xcb14` != 0xff -> `0x2b3c8([GOT 0x1831c9c], 3, v, &{unit +0xe0, 0xc21f8(E) = [E+0x1428]+0x5b8, unit +0xe8, +0xec})`; tail `0x88c664` | RubbleBase | R | " + D + " §4 |",
 "| `0x2b3c8(pool, -, v, pos)` | r1 unused; the pool's next unit (`count +8 < max +0x4c`, slot `pool+0xc+4·count`): scale = `0x1593300[v]` (0.3 / 0.2 / 0.35 / 2.0 / 1.0 / 0.6 / 0.9 / **1.3** / 1.5 / 2.0 for v 0..9; else 1.0), `+0x40` = pos, `+0xc \\|= 0xc00`, vt+0x4c / +0x50. A marker under the piece -- **does not move the held piece** | shared | R (the marker's look: I a blob shadow) | " + D + " §4 |",
 "| `0x10af294` (uEm088_Rubble vt+0x8c) | unit `+0x10` bits 2..3 = 3 when `E+0xcb14` == 0xff, else 1 (RubbleBase vt+0x18 `0x10aef60` sets 3); meaning NR | uEm088_Rubble | R | " + D + " §4 |",
 "| em087_00_rubble_01 / 02 / 03 .mod (`em088_00.arc` type `58a15856`, = em087_00.arc's, md5) | MOD 0xd4, joint block at header `+0x24` (0x84: 24 + 64 + 64 + 256 = 0x21c = `+0x28`); **one joint, id 0, parent 255, local = identity**; the 'inverse' = the position dequantiser (diag 2628.5493 / 1762.7195 / 1522.2380, t (-211.03, -190.05, -875.17) / (-768.67, -108.05, -994.05) / (-429.83, -178.91, -1113.68)); groups 1 / 2 / 2. The viewer glbs carry it exactly (joint `0:0` identity, IBM = inverse / 100): **nothing dropped** | data | R | " + D + " §5 |",
]
k = one(lambda l: l.startswith('| `0x10af334` (uEm087_Rubble vt+0x94;'), '10af334 row (patched)')
L[k + 1:k + 1] = rows

# 3. Withdrawn row: at the end of the Withdrawn table
w = one(lambda l: l.startswith('### Withdrawn') and 'kept so they are not rediscovered' in l, 'withdrawn header')
t = w + 1
while not L[t].startswith('|'): t += 1
while L[t].startswith('|'): t += 1
L.insert(t, "| rom-map row `uEm088_Rubble vt+0x88..+0xa8` and dev/em088-shells-props-spec.md §1b (**shell / prop agent, 2026-10-15**): \"`E+0xcb14` != 0xff -> `0x2b3c8(...)` (vt+0x8c / `0x10af0d0`)\"; row `0x10af334` \"(uEm087_Rubble vt+0x90 neighbour)\"; \"+0x34 a joint NUMBER: I\" | the vtables were not dumped slot by slot: `0x10af0d0` is vt+**0x28** of all three rubble vtables, and vt+0x8c is `0x10af294`; `0x10af334` is uEm087_Rubble's vt+**0x94**; the consumer of `+0x34` was not read | `0x10af0d0` (vt+0x28) makes the `0x2b3c8` ground marker; vt+0x8c `0x10af294` sets unit `+0x10` bits 2..3; `0x10af334` = vt+0x94; `+0x34` READ as a joint number (`0x8a5480` -> `0x939278`). Rows \"held objects, all three k\" (2026-10-16) |")

# 4. note index row after em088-d410-writer.md
n = one(lambda l: l.startswith('| `em088-d410-writer.md` |'), 'note index')
L.insert(n + 1, "| `em088-held-objects.md` | em088_00 Ahtal-Ka -- how the carried object is held (Spike / Wheel / Frame), read for all three k: joint 130 for every k, local (0,0,0) / identity rewritten each held frame, scale = size captured at creation, inherit mode 3 (`0x8a5480`); `+0x34` a joint number (`0x939278`); `E+0xcb14` / `0x2b3c8` a ground marker; the three .mods' joint 0 = identity and the glbs match; no viewer change | 2026-10-16 | 12 KB |")

# 5. tooling row after the gotrefs row
g = one(lambda l: l.startswith('| `<scratchpad>\\ahtal\\gotrefs.py`'), 'gotrefs tooling row')
L.insert(g + 1, "| session scratch `<scratchpad>\\held\\` (2026-10-16): `d.py` (capstone sweep with literal / float notes), `ia.py` (init_array under build/arm/emu.py, then reads a .bss static and its writers), `ctor.py` (a ctor on a zeroed heap block -> uCoord fields `+0x30..+0x6c`), `clos.py <roots> <offs> [excl] [maxfn]` (flow-following store census by immediate offset; depth via maxfn), `blscan.py <target> <regex> <n>` (every `bl` to a target + a pattern in the next n words), `modj.py` (a .mod out of the .arc by type `58a15856` -> joint block at header `+0x24`; the glb's nodes / IBM) | the held piece's transform; a .mod's joint block | `clos.py` finds Neset's `0x82 + id` store `0x10af340` beside Ka's constant; `ia.py` reads `0x19176c0` = (1, 1, 1, 0) beside the zero vector; `ctor.py` on the bare uModel ctor gives the same `+0x38` | `clos.py` depth 1 = the listed roots only; its transitive mode wanders into other objects' stores (bound it); `.mod` bone offset is header **+0x24**, not +0x28 |")

# 6. trap 60 at the end
while L and L[-1] == '': L.pop()
L.append("60. **A uCoord's local scale multiplies its parent joint's FULL world -- check the inherit mode before stripping scale (2026-10-16).** `0x8a5480` takes `+0x38 >> 16`: 0 / 1 / 2 strip rotation or scale, 3 keeps the product, and then multiplies by the unit's own `+0x60`. A held unit given its owner's size (uEm088_Rubble, `0x10af1b4`) under mode 3 is drawn at size x (joint scale, which already carries the size). For a held piece, \"joint world, scale out, size in\" is right only while one of the two sizes is 1. Read the unit's `+0x38` (its ctor; `ctor.py`) and where its scale is captured. (dev/em088-held-objects.md §3)")
L.append('')
io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(L))
print('ok', len(rows), 'rows; withdrawn at', t, '; note at', n + 1, '; tooling at', g + 1)

# Ahtal-Ka (em088_00) -- the writer of `e+0xd410` (and `e+0xd440`, `e+0xd408`)

Research agent for the Viewer agent, 2026-10-15. Static reads of `main.text` plus ROM-runs on unicorn
(`<scratchpad>\ak\emu88b.py`, the class band and the shared layer native). Scripts in `<scratchpad>\d410\`
(this session's scratchpad: `symscan.py`, `rawimm.py`, `dyn.py`, `slotpts.py`, `formula.py`, `callers.py`, `ad.py`).

## 1. The answer

`e+0xd410..+0xd41c` is a vec4 **(x, y, z, 0)** written **once, at the START of (1, 0x1c) and (1, 0x22)**, by the
status-1 start arm **`0x10b5430`** of the action-start method vt+0x204 `0x10b4828` (status-1 table `0x10b4bac`,
index n - 1: entries 0x1b and 0x21 both -> `0x10b5430`). Stores: **`0x10b54c8` (x), `0x10b54d0` (y), `0x10b54d8` (z)**,
then the shared tail **`0x10b5798` (w = 0)**. READ (every instruction from `0x10b5430` to `0x10b579c`), and ROM-run
equal to the formula below on two input sets (section 4).

    v    = action-tune vec 17          0x6f640(e, 0x11) -> rFreeUseParam vt+0x54 = 0x3cb35c (vec i, stride 16)
         = (0, 4000, 0)                em088_00_actiontune.fup, vec 17 (sh88\tune.py)
    s    = size                        0xbe518(e) = [e+0x1428]+0x1ac x [e+0x1428]+0x1b0
    P    = [e+0x1428]                  his position P+0x40..+0x48, yaw word P+0x54 (u16)
    yaw  = u16(P+0x54) x 9.58738e-05   (literal 0x10b5850)
    c, sn = cosf(yaw), sinf(yaw)       0x13ecc2c / 0x13ecc20
    d410 = P.x + (v.x s c + v.z s sn)
    d414 = P.y + v.y s
    d418 = P.z + (v.z s c - v.x s sn)
    d41c = 0

With vec 17 = (0, 4000, 0) the yaw drops out: **the point is 4000 x size straight above his position at the frame
(1, 0x1c) / (1, 0x22) starts** (world coordinates; it is not updated afterwards).

**The twin, `e+0xd440..+0xd44c`**: the arm `0x10b56b0` -- status-1 entries 0x1d / 0x23, i.e. **(1, 0x1e) and (1, 0x24)**
-- computes the same point with the same tune vec 17 and stores it at **`0x10b5748` / `0x10b5750` / `0x10b5758`**, w = 0
through the same tail `0x10b5798`. READ + ROM-run.

The address trap that hid it: both arms reach the field through **`sb` after `ldr r0, [sb, #0x1428]!`** (pre-index
writeback, `0x10b545c` / `0x10b56dc`): sb = e + 0x1428, and the store offsets are `sb + 0xbfe8 / 0xbfec / 0xbff0 / 0xbff4`
(d410..d41c) and `sb + 0xc018 / 0xc01c / 0xc020 / 0xc024` (d440..d44c). No `#0xd410` / `#0xd440` immediate exists at any
store -- which is why "no #0xd410 store in the band" found nothing.

When, in the fight: (1, 0x1c) / (1, 0x22) and (1, 0x1e) / (1, 0x24) are the FIRST halves of the L2 M30 web pairs
(row `0x10bc764`: L2 M30, then chain to (1, n + 1)). (1, 0x1d) / (1, 0x23) then spawn the five anchors `e+0xd420..`,
(1, 0x1f) / (1, 0x25) the three / four anchors `e+0xd450..`. So the point is latched as he starts spinning, before the
anchors fly. The ctor (`0x10b2e14`: `0x13ecbfc(e+0xcb00, 0x9e0)`, the zero fill to `e+0xd4e0`) leaves both points at
(0, 0, 0) until the first web of each kind.

## 2. Who reads which point (CORRECTS the effects spec / rom-map row `e+0xd410`)

The two webs have two points. Emulated (`slotpts.py`: the thread pass vt+0x208 with d410 = (11, 12, 13) and d440 =
(41, 42, 43) as markers, L2 M0..M48 x every 2nd frame x object 0 / none x five webs x the 11 actions) and checked
statically at the copy sites:

| point | slot / id / key | kind | when (emulated) | copy site (static) |
|---|---|---|---|---|
| **d410** | slot 7, 1011, **u 340** | end 4 | L2 M30 under (1, 0x1c / 0x1d / 0x22 / 0x23); L2 M2 / M3 to 78, M16 to 62, M17 to 178 with a `d420` anchor and `d408` | `0x10b8328`, `0x10b860c`, `0x10b9590` |
| **d410** | slot 8, 1013, **u 342** | end 4 | L2 M2 80..98 (d420 anchors + d408) | `0x10b7e80` |
| **d410** | slot 9, 1017, **u 343** | end 4 | L2 M3 80..98, L2 M16 64..80 (d420 anchors + d408) | `0x10b8958`, `0x10b8a68` |
| **d410** | slots 10..14, 1015, **u 341** | START 3 | every motion while that `d420+4p` anchor is up (end kind 6) | `0x10b8704` (via `[sp+0x48]`, set at `0x10b8614` / `0x10b8adc` / `0x10b8c24` / `0x10b8d70` / `0x10b959c`) |
| **d440** | slots 15..17, 1014, **u 341** | START 3 | every motion while that `d450+4p` anchor is up (end kind 5) | `0x10b98f8..0x10b990c` (r5 / r6 / r7 = e+0xd440 / 444 / 448 by writeback at `0x10b9860..0x10b987c`) |
| **d440** | slot 19, 1011, **u 340** | end 4 | every motion with a `d450` anchor; L2 M30 under (1, 0x1e / 0x1f / 0x24 / 0x25) | `0x10b8f60`, `0x10b9858` |
| **d440** | slot 19, 1018, **u 344** | end 4 | L2 M35 from 180 (d450 anchors in a mixed state + d408) | `0x10b92e4` |
| **d440** | slot 8, 1013, **u 342** | end 4 | L2 M35 90..178 (same) | by pointer (emulated only) |

So "u 341 slots 10..17 start at e+0xd410" and "u 340 slot 19 / u 344 end at e+0xd410" (spec 3.2 / 3.3, rom-map row
`e+0xd410`, class-threads.js header) are wrong for slots 15..17, slot 19 and L2 M35's slot 8: those are `e+0xd440`.

## 3. `e+0xd408` is a byte FLAG, not a point

Writers (all READ; static v3 scan + ROM-run):

* `0x10b386c` vt+0x1dc `0x10b345c`: **0 every frame**.
* status-7 action bodies (`0x10be758`), **1 every frame of** (7, 0x2c) `0x10beff4`, (7, 0x31) `0x10bf048`,
  (7, 0x32) `0x10bf0a0`, (7, 0x33) `0x10bf104`, (7, 0x37) `0x10bf15c`, (7, 0x34) `0x10bf1d4`, and (7, 0x2f) / (7, 0x36)
  through the tail `0x10c1800` (`0x10c181c`). Each first calls `0x10bb970(e, s0)` (enraged -> `[e+0x1428]+0x38c = s0`).

So d408 = "this frame is one of the status-7 web attacks" ((7, 0x2c / 0x2f / 0x31 / 0x36) throw the d420 anchors,
(7, 0x34) the d450 orbit -- rom-map row `0x10b4d38`), and the thread pass reads it after the body has run.

## 4. Controls and the scans (what was scanned, and how it failed first)

1. **Static, v1/v2** (`symscan.py`: per-register (base, offset) tracking with writeback, post-index, stack spills, any
   base token reported; `rawimm.py`: every movw / mov / add / sub / orr immediate and `ldr` literal in the window).
   Positive controls passed: `e+0xcb0c` -> `0x10bb8cc`, `0x10b6114` (and the ctor `0x10b2e3c`, the setter `0x10b62fc`);
   `e+0xd3fc` -> `0x10bb10c`. **It found no d410 writer in the whole of main.text -- a false negative.** A linear sweep
   carries a register's value in ADDRESS order, so the arm `0x10b5430` (reached by the jump table, laid out after a block
   that had moved `sb` with its own writeback) saw the wrong `sb`. The v2 fix (keep callee-saved registers through an
   epilogue) found the six status-7 d408 writes it had also missed -- and still not d410.
2. **Dynamic** (`dyn.py`, write hook on e+0xd3fc..+0xd420 and +0xd440..+0xd450, sentinel 0x7fc0dead): action starts
   (0, 1, 2, 7, 10 x 0..0xc7, 11) x object 0 / none; each action's body 0x10b3f74 for 80 frames; vt+0x1dc / frame update
   `0x10b4024` / vt+0x208 on L2 M0..M48 x 100 frames; vt+0x218 (EMC op 0xa3) b1 0..12 x b2 0..15. **It found
   `0x10b54c8` / `0x10b54d0` / `0x10b54d8` / `0x10b5798`** (and `0x10b5748..0x10b5758` for d440) and nothing else. Its
   controls in the same run: d3fc by op 0xa3 b1 2 (`0x10baeb8`), d400's decrement (`0x720a8`), d408's clear
   (`0x10b386c`) and the eight status-7 sets. Starts that fault in the harness (so their tails are covered by the static
   scan only): (1, 0x10), (7, 0x10), (7, 0x1b..0x1e), (7, 0x32), (10, 0xa7), (10, 0xaf).
3. **Static, v3** (RESEED: a block reached only by a jump gets the callee-saved registers the function held after its
   entry block): finds `0x10b54c8..0x10b54d8` and `0x10b5748..0x10b5758` in the class band, plus every d408 write above.
   Whole `main.text` for e+0xd400..+0xd450: see section 5. It still misses the w stores at the shared tail
   `0x10b5798` (a merge of two arms), which the ROM-run sees.
4. **Formula ROM-run** (`formula.py`): (1, 0x1c) / (1, 0x22) / (1, 0x1e) / (1, 0x24) with P+0x40 = (1000, 50, -2000),
   yaw word 0x4000, size 1.2 x 1.0, vec (100, 4000, 300) -> (1360, 4850, -2120, 0) = the formula; P+0x40 = (-350, 0, 720),
   yaw 0x2aaa, size 1.0 x 1.1, vec (0, 4000, 0) -> (-350, 4400, 720, 0). (1, 0x1d) / (1, 0x1f) leave both points untouched.

## 5. Whole-binary result

v3 over ALL of `main.text` (0 .. 0x13ef000), window e+0xd400..+0xd450, any base register: the only stores into
`[+0xd410, +0xd41c)` are `0x10b54c8 / 0x10b54d0 / 0x10b54d8`, and into `[+0xd440, +0xd44c)` `0x10b5748 / 0x10b5750 /
0x10b5758`; no call anywhere passes a pointer into either range, and no such pointer is stored to memory. (Other hits
in the window, all in his / Neset's bands: the anchor handles d420..d430 (`0x10b35dc..`, `0x10b4a1c..`, `0x10b532c..`),
the slot bytes d434..d439 (ctor `0x10b2eec..`, op 0xa3 `0x10bb13c..`, `0x10b4dd4`), d400 / d404 timers, d408 above;
uEm087_00's own d430.. bytes `0x10a52b4..`, `0x10acb6c..`.) The scan leaves 6054 indexed stores whose index it cannot
resolve unexamined across the binary; for his own code the ROM-run census (2) is the cover, and it agrees.

## 6. What the viewer needs

Inputs: his world position P+0x40 and his size (the viewer has both: the monster root and its scale), latched at the
frame the web action starts -- (1, 0x1c) / (1, 0x22) for the five-anchor web (d410), (1, 0x1e) / (1, 0x24) for the
three / four-anchor web (d440). Point = position + (0, 4000 x size, 0) (tune vec 17; the yaw term is zero for this
vector, keep it if the transcription reads the tune generally). w = 0. Before the first such start the point is
(0, 0, 0). The class-threads.js rows that should take d440 rather than d410: u 341 slots 15..17 (start), u 340 slot 19,
u 344 slot 19, u 342 slot 8 on L2 M35. No viewer code was edited by this read.

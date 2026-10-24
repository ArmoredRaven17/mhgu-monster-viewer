"""Patch dev/rom-map.md in place (shared file): correct the e+0xd410 row, add the section, Withdrawn rows, a tooling
row, a trap and the note index line. Every anchor must match exactly once or nothing is written."""
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
orig = s


def once(anchor):
    n = s.count(anchor)
    assert n == 1, (n, anchor[:80])


# (a) the e+0xd410 row: correction appended in place (claim kept; Withdrawn table row below)
A = r"""**Its writer: not found** (no `#0xd410` store in the band outside the pass) | uEm088_00 | NR (writer) | class-threads.js `D410` |"""
once(A)
s = s.replace(A, r"""**Its writer: not found** (no `#0xd410` store in the band outside the pass) [**WRITER READ 2026-10-15 (research agent, dev/em088-d410-writer.md)**: `0x10b54c8 / 0x10b54d0 / 0x10b54d8` (+ w = 0 at `0x10b5798`) in the (1, 0x1c) / (1, 0x22) start arm `0x10b5430`, through `sb` = e+0x1428 (`ldr r0, [sb, #0x1428]!`) + `0xbfe8..` -- his position + tune vec 17 (0, 4000, 0) x size. And **CORRECTED**: u 341 slots 15..17, u 340 / u 344 slot 19 and L2 M35's u 342 slot 8 take `e+0xd440`, not d410 -- section "Ahtal-Ka -- the web points"] | uEm088_00 | R (writer, 2026-10-15) | class-threads.js `D410` |""")

# (b) the new section, before the shells / props section
B = r"""### Ahtal-Ka -- his shells and the carried objects' models (shell / prop agent for the Viewer agent, 2026-10-15; dev/em088-shells-props-spec.md)"""
once(B)
SEC = r"""### Ahtal-Ka -- the web points `e+0xd410` / `e+0xd440` and the flag `e+0xd408` (research agent for the Viewer agent, 2026-10-15; dev/em088-d410-writer.md)

Static (`<scratchpad>\d410\symscan.py` v3, whole `main.text`) and ROM-run (`dyn.py` write census, `slotpts.py` slot markers, `formula.py`) -- tooling row below. Nothing transcribed.

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0x10b5430` (vt+0x204 `0x10b4828`, status-1 table `0x10b4bac` entries 0x1b / 0x21 = **(1, 0x1c) / (1, 0x22)**) | **THE WRITER of `e+0xd410..+0xd41c`**: v = tune vec 17 (`0x6f640(e, 0x11)` -> rFreeUseParam vt+0x54 `0x3cb35c`) = **(0, 4000, 0)**; s = size `0xbe518`; P = `[e+0x1428]`; yaw = u16 P+0x54 x 9.58738e-05; d410 = P+0x40 + (v.x s cos + v.z s sin, v.y s, v.z s cos - v.x s sin), w = 0. Stores `0x10b54c8` x / `0x10b54d0` y / `0x10b54d8` z through **sb = e+0x1428** (writeback `0x10b545c`) + `0xbfe8 / 0xbfec / 0xbff0`; w at the shared tail `0x10b5798` (+ `0xbff4`). Once per action start: **the point 4000 x size straight above him when he starts the five-anchor web**, world-fixed after | uEm088_00 | R + ROM-RUN (= formula, two input sets) | note §1, §4 |
| `0x10b56b0` (same table, entries 0x1d / 0x23 = **(1, 0x1e) / (1, 0x24)**) | **the twin point `e+0xd440..+0xd44c`**: the same code and tune vec 17; stores `0x10b5748 / 0x10b5750 / 0x10b5758` (sb + `0xc018..`), w at `0x10b5798` (+ `0xc024`) -- the three / four-anchor web's point | uEm088_00 | R + ROM-RUN | note §1 |
| `e+0xd410` consumers (thread pass, emulated with markers, copy sites read) | u 340 slot 7 (end 4: L2 M30 under (1, 0x1c / 0x1d / 0x22 / 0x23); L2 M2 / M3 / M16 / M17 with d420 anchors + d408; `0x10b8328`, `0x10b860c`, `0x10b9590`); u 342 slot 8 (L2 M2 80..98, `0x10b7e80`); u 343 slot 9 (L2 M3 80..98, M16 64..80, `0x10b8958`, `0x10b8a68`); **u 341 slots 10..14 START** (`0x10b8704`) | uEm088_00 | R (sites) + ROM-RUN | note §2 |
| `e+0xd440` consumers | **u 341 slots 15..17 START** (`0x10b98f8..0x10b990c`, r5 / r6 / r7 = e+0xd440.. by writeback `0x10b9860..`); u 340 slot 19 end (`0x10b8f60`, `0x10b9858`; any motion with a d450 anchor, and L2 M30 under (1, 0x1e / 0x1f / 0x24 / 0x25)); u 344 slot 19 end (L2 M35 from 180, `0x10b92e4`); u 342 slot 8 end on L2 M35 90..178 (emulated only) | uEm088_00 | R (sites) + ROM-RUN | note §2 |
| `e+0xd408` (a BYTE flag) | cleared every frame by vt+0x1dc (`0x10b386c`); **set to 1 every frame of** (7, 0x2c) `0x10beff4`, (7, 0x31) `0x10bf048`, (7, 0x32) `0x10bf0a0`, (7, 0x33) `0x10bf104`, (7, 0x37) `0x10bf15c`, (7, 0x34) `0x10bf1d4`, (7, 0x2f) / (7, 0x36) via `0x10c1800` (`0x10c181c`) -- the status-7 web attacks; the pass reads it in the same frame | uEm088_00 | R + ROM-RUN | note §3 |
| `0x10b2e14` | ctor `0x13ecbfc(e+0xcb00, 0x9e0)`: both points (0, 0, 0) until the first web of each kind (no other writer: whole-binary v3 scan, any base) | uEm088_00 | R | note §5 |

"""
s = s.replace(B, SEC + B)

# (c) Withdrawn table rows, after the shell48 G-bytes row
C = r"""| rom-map row `0x10b345c` "shell48 ... (the G bytes' writer NR)"; dev/em088-shells-props-spec.md §2 "what sets the CU bytes: UNREAD" | read 2026-10-15 (b48\shell48-spec.txt) | G+0xc6+k is armed by Ka's vt+0x1dc from G+0xbc+k, which sp_01's end writes when a hunter cuts silk line k; `0x1f5c10` is the network copy (`netEm087_088_FreeUsePacket`), not a script |"""
once(C)
W = nl + r"""| rom-map row `e+0xd410..+0xd418` and dev/em088_00-effects-spec.md §3.2 / §3.3 / class-threads.js header (2026-10-15): "**its writer: not found** (no `#0xd410` store in the band)"; "`e+0xd408` ... **its writer was not found** (no other `#0xd408` / `#0xd400` base in the band)" | a scan for the literal offset: the d410 stores go through `sb` = e+0x1428 after `ldr r0, [sb, #0x1428]!` plus `0xbfe8..` (no `#0xd410` anywhere); the six status-7 d408 sets sit in jump-table arms after `pop {r4, lr}; b` tails, which a linear sweep enters with r4 clobbered | writer `0x10b5430` (`0x10b54c8..0x10b54d8`, `0x10b5798`) at (1, 0x1c) / (1, 0x22) start: his position + (0, 4000 x size, 0); d408 = 1 in (7, 0x2c / 0x2f / 0x31..0x34 / 0x36 / 0x37) bodies -- section "Ahtal-Ka -- the web points" (dev/em088-d410-writer.md) |""" + nl + r"""| rom-map row `e+0xd410..+0xd418` / spec §3.2 table / class-threads.js header: u 341 "slots 10..17" start at `e+0xd410`; u 340 slot 19 and u 342 / 343 / **344** end at `e+0xd410` (the spec's slot-19 / L2 M35 rows "+ `e+0xd408`") | the copy sites for slots 15..17 and slot 19 load `e+0xd440..+0xd448` (by writeback pointers, `0x10b9860..0x10b987c`, `0x10b8f60`, `0x10b92f8`); an emulated sweep that did not mark the two points apart could not tell them | **d410** = the five-anchor web's point (u 341 slots 10..14, u 340 slot 7, u 342 slot 8 on L2 M2, u 343 slot 9); **d440** = the three / four-anchor web's point (u 341 slots 15..17, u 340 / u 344 slot 19, u 342 slot 8 on L2 M35), written by (1, 0x1e) / (1, 0x24) (`0x10b56b0`) |"""
s = s.replace(C, C + W)

# (d) tooling row after the emu88 row
D = r"""`closure.py` does not follow `blx` / jump tables |"""
once(D)
T = nl + r"""| `<scratchpad>\d410\symscan.py` (+ `rawimm.py`, `dyn.py`, `slotpts.py`, `formula.py`) | `symscan.py LO HI band..`: every STORE whose address is (any base register) + offset in [LO, HI), pointers into the window passed to a call or stored, through writeback / post-index / stack spills; v3 RESEED (default): a block reached only by a jump gets the callee-saved registers held after the function's entry block. `rawimm.py`: every movw / mov / add / sub / orr immediate and `ldr` literal near a window. `dyn.py`: write census of e+0xd3fc..+0xd450 under emu88b over action starts, bodies, the per-frame passes and EMC op 0xa3 | controls: `e+0xcb0c` -> `0x10bb8cc` / `0x10b6114` (+ `0x10b2e3c`, `0x10b62fc`); `e+0xd3fc` -> `0x10bb10c`; dyn: d3fc `0x10baeb8`, d400 `0x720a8`, d408 `0x10b386c` + eight status-7 sets | **v1 / v2 (linear sweep) MISSED the d410 writer** -- a jump-table arm laid out after a block that moved the base with its own writeback; v3 still misses stores in a tail shared by two arms (`0x10b5798`) and leaves indexed stores with an unknown index unexamined (6054 binary-wide). Run the write census beside it. `dyn.py` needs `0x6f640 / 0x6f618 / 0x6f62c` stubbed (tune object unset) and a mapped object for spawned / anchor handles |"""
s = s.replace(D, D + T)

# (e) trap 58, at the end of the traps list (the file's end)
E58 = r"""   (Nargacuga); Ahtal-Ka's shell00 mode 0 has (0, 200, 0)."""
once(E58)
TR = nl + r"""58. **A field reached through a WRITEBACK base never shows its own offset -- and a linear sweep misses it (2026-10-15).**
   Ahtal-Ka's `e+0xd410` is stored as `[sb + 0xbfe8]` after `ldr r0, [sb, #0x1428]!` made sb = e+0x1428; `rawimm` finds no
   `#0xd410` at any store, and a symbolic scan that carries registers in address order reaches that jump-table arm with
   the PREVIOUS block's sb (moved by its own writeback) -- three scans read "no writer". A write hook on the field over
   the class's action starts found it in one run. For a "no writer" claim, run the ROM write census as the control, not
   only a static scan. (dev/em088-d410-writer.md §4)"""
s = s.replace(E58, E58 + TR)

# (f) the in-repo note index
F = r"""| `em088-shells-props-spec.md` |"""
once(F)
i = s.index(F)
j = s.index(nl, i)
s = s[:j] + nl + r"""| `em088-d410-writer.md` | Ahtal-Ka's web points: `e+0xd410` written at (1, 0x1c) / (1, 0x22) start (`0x10b5430`) and `e+0xd440` at (1, 0x1e) / (1, 0x24) (`0x10b56b0`) = his position + (0, 4000 x size, 0); which threads take which; `e+0xd408` the status-7 web-attack flag; the scans and why the first three missed it | 2026-10-15 | 9 KB |""" + s[j:]

assert s != orig
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('patched', len(orig), '->', len(s))

"""Patch dev/rom-map.md in place for the Barioth / Seregios specs (2026-10-16). Reads the file fresh, asserts each anchor
is unique, applies every edit, writes once. No checkout / regenerate: only these rows change."""
import io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
NL = '\r\n' if '\r\n' in s else '\n'


def rep(old, new):
    global s
    n = s.count(old)
    assert n == 1, (n, old[:90])
    s = s.replace(old, new)


def after_line(anchor, new_rows):
    """insert rows after the (unique) line that starts with anchor"""
    global s
    i = s.index(anchor)
    assert s.count(anchor) == 1, anchor[:80]
    j = s.index(NL, i) + len(NL)
    s = s[:j] + NL.join(new_rows) + NL + s[j:]


# 1. the per-class word index
rep("| uEm042_00 (Barioth) | `0x17be9a0` | `0xe70b78` | R (spec paused) |",
    "| uEm042_00 (Barioth) | `0x17be9a0` | `0xe70b78` | R (read whole, emulated: 74880 JS-vs-ROM runs, 0 mismatches; research agent 2026-10-16; not transcribed): L2 M8 (7, 0x0f / 0x14) / L2 M9-M10 (7, 0x21 / 0x22) tail-on bits 15-18, L0 M4 (1, 0 / 0xe) 19-20 |")
rep("| uEm077_00 (Seregios) | `0x17e7c08` | `0xfee088` | R (spec paused) |",
    "| uEm077_00 (Seregios) | `0x17e7c08` | `0xfee088` | R (read whole, emulated: 69120 JS-vs-ROM runs, 0 mismatches; research agent 2026-10-16; not transcribed): sever clears 5-7 / sets 18-20; L2 M26 (7, 0x3a / 0x3b) / L2 M34 (7, 0x3f / 0x40) 15-17 |")

# 2. the section header
rep("dev/em077_00-effects-spec.md, dev/em042_00-effects-spec.md -- both UNFINISHED, paused on a change of order)",
    "dev/em077_00-effects-spec.md, dev/em042_00-effects-spec.md -- both UNFINISHED, paused on a change of order) [**both COMPLETED 2026-10-16**, research agent: rows below the trap row]")

# 3. the reader row and the spawn-site row
rep("own only +0x4 `0xfeeccc`, +0x14 `0xfeecdc`, +0x14c reader `0xfeeb98` (NR) | uEm077_00 | R | em077_00-effects-spec §2 |",
    "own only +0x4 `0xfeeccc`, +0x14 `0xfeecdc`, +0x14c reader `0xfeeb98` (NR) [**READ 2026-10-16**: row `0xfeeb98` below] | uEm077_00 | R | em077_00-effects-spec §2 |")
rep("Mode-1 sites `0xfde3d8` `0xfde7e0` `0xfde89c` `0xfdea04` `0xfdeae8` `0xfdeba4` `0xfdec98`. What sets `+0x80`: NR |",
    "Mode-1 sites `0xfde3d8` `0xfde7e0` `0xfde89c` `0xfdea04` `0xfdeae8` `0xfdeba4` `0xfdec98`. What sets `+0x80`: NR [**READ 2026-10-16**: a one-frame pulse every 100.0 of a free-running clock, vt+0x1dc `0xfdae58` -- row below; \"every frame\" was the probe holding the byte at 1] |")

# 4. new rows after the trap row of that section
after_line("| trap | unicorn faults at `0x72750` (`vseleq`, ARMv8 VFP) inside `0x72714`", [
    "| `0xe64f48` (vt+0x1fc, status-7 table `0xe65034`, n <= 0x3d) | Barioth's action remap, READ whole (`..0xe65534`): (7, 0) -> 0x21 / (7, 1) -> 0x22 **while the tail is on** (`0xe6524c` / `0xe65268`, `ldrb [P+0x3b4]; tst #1`); (7, 0x0f / 0x11 / 0x14) -> 0x1c / 0x1d / 0x1e while both wing-arms are broken (parts 2 / 3 vs .dtp `+0x64` bytes 1-2 / 5-6 by rank `0x3a8430` <= 4); tired (`0x81614`): 2 / 0x2c / 0x2d -> 0x1f, 0x15 / 0x2e -> 0x20, 0x12 -> 0x29, 0x27 -> 0x2a, 0x34 -> 0x35; part 2 broken 0x3c -> 0x3e, part 3 broken 0x3d -> 0x3f. Called from changeAction `0x763f4` (iterated to a fixed point; gate mode 1, or mode != 3 with `e+0x7420`) | uEm042_00 | R | em042_00-effects-spec §5 |",
    "| Barioth clips <- actions | L2 M9 = (7, 0) / (7, 0x21) (`0xe6e6c4` / `0xe6e9b8`), L2 M10 = (7, 1) / (7, 0x22) (`0xe6e718` / `0xe6e818`), one phase each; L2 M8 = mode 0 of `0xe6b5ac` (7, 0x0f) L2 M7 -> M8, `0xe6c938` (7, 0x14) L1 M17 -> M14 -> M8, `0xe6c0c4` (7, 0x11) L2 M14 -> M8, `0xe6fa54` (13, 5) -- mode 1 of each ((7, 0x1c / 0x1e / 0x1d), (13, 6)) plays L2 M16 instead; L0 M4 = (1, 0) `0xe65aa4`, (1, 0x0b) `0xe660ac`, (1, 0x0e) `0xe65d6c`. (7, 0x11) is a class follow (`0xe676d0` / `0xe6776c`) in the (2, 0x12) body `0xe672f0`; streams: (7, 0 / 1) g1 s0 / s20 / s68, g8 s0; (7, 0x0f) g1 s13; (7, 0x14) g1 s39 / s85; (1, 0x0b) g0 s0; (1, 0x0e) g13 s0 | uEm042_00 | R | em042_00-effects-spec §5 |",
    "| Seregios clips <- actions | status-7 table `0xfdca70` (`cmp #0x40`): L2 M25 -> **L2 M26** body `0xfe0e8c` = (7, 0) / 3 / 0x38 / 0x3a / 0x3b (and a status-1 caller `0xfdb454`); L2 M33 -> **L2 M34** `0xfe9a5c` = (7, 8) / (7, 0x39); L2 M70 -> **L2 M34** `0xfeb7c8` = (7, 0x3e / 0x3f / 0x40). **(7, 0x3f) / (7, 0x40) are follows** from `0xfe0e8c` phase 2 at L2 M26 f80 (`0xfe1564`, s0 `0xfe165c`): r2 != 0 -> `0x768c8(e, 7, r3 == 1 ? 0x40 : 0x3f)` (`0xfe160c`); 5th arg 4 -> (7, 0x3e) (`0xfe1580`; no caller passes 4). Streams: (7, 0x3a) g1 s47, (7, 0x3b) g1 s54, (7, 0) g1 s0, (7, 3) / (7, 8) g1 s5 / s6 / s131 / s132 (+ g0 s23 for 8). Remap `0xfda310` (table `0xfda59c`, n - 3): 3 -> 0x38, 8 -> 0x39 at rank >= 5; none of 0x3a..0x40 | uEm077_00 | R | em077_00-effects-spec §4 |",
    "| `0xfeeb98` (uShellEm077_sp_01 +0x14c) | the c 30 / c 32 shell's reader, READ whole `..0xfeecc8`: getEffect 0 / 1 -> `+0x15c8` / `+0x15cc`; accA(hit, 0) -> `+0x15d8`; flags `+0x15ec` (bfc / orrne over 0): 0x80 = int 0, 0x800 = int 1, 0x4 = int 2, 0x8 = int 3, 0x1000 = int 4; vec 0 -> `+0x1608`. = Malfestio's `0xffd644` + ef 1 (NOT Nargacuga's `0xe597e4`). Arc: modes 0 / 1 ints [0, -1, -1, -1, 0] (0x1080), vec (0, 0, 100) / 0, ef (0, 30) / (0, 32) + (999, -1), hit 0 / 1, hitdata (14, 10) x 2, no ShellCmnParam | uEm077_00 | R | em077_00-effects-spec §7.1-7.2 |",
    "| `0xfdae58` (vt+0x1dc) `ctl+0x80` | `ctl+0x80 = 0` each frame (`0xfdaf64`), `ctl+0x54 += [e+0x1c] x 1.0` (`0x7264c` -> `0x539d48`), >= 100.0 (literal `0xfdb02c`) -> `ctl+0x54 = 0`, `ctl+0x80 = 1` (`0xfdaf9c`): a one-frame pulse per 100.0, free-running (no motion resets it; the only other writer is the reset `0xfda194`). Called from the +0x24 pass `0xada80` (`0xaddc8`), before the +0x28 pass `0xae370` runs vt+0x208 (`0xae774`). `[e+0x1c]` = the frame step: I | uEm077_00 | R | em077_00-effects-spec §7.3 |",
    "| `0xfddfcc` shell 0x13c sites, all twelve | list-1 table `0xfde0bc`: L1 M12 / M13 (not (4, 0x15)) / L1 M1 / L1 M2 (not (4, 0x15)) on `ctl+0x80` -> mode 0; L1 M4 f2, L1 M20 f52 -> mode 0; L1 M5 f46, L1 M19 / M29 / M32 / M34 f2, L1 M62 f4 -> mode 1; list-0 table `0xfde2e0` (motion - 5): L0 M24 / M27 / M30 f2 -> mode 1 (`0xfde3d8`). Gates `0xb09a4(e, 0, 0)`, frame in s0. Request +0x10 = P+0x40..48, +0x30 = P+0x50..58, +0x20 the empty vec, +0x3c 0xffff. Emulated (ARMv8 + zero .dtp): L1 M4 f2 / L1 M20 f52 mode 0, L1 M5 f46 mode 1 | uEm077_00 | R | em077_00-effects-spec §7.3 |",
    "| `0xfdae18` / `0xfdae24` | Seregios's one sever: `mov r3,#0x91` / `bl 0xc2274` under `cmp r0,#7` (`0xfdae04`) -> **CUT_TAIL joint 145** (tail-option.js has 144, u 900's: Withdrawn table) | uEm077_00 | R | em077_00-effects-spec §8 |",
    "| Barioth / Seregios plans | whole-block plans (bw1/planrows.py): Barioth 124 -> 130, nothing on bits 6-14; gated L0 M4 b19 c 90, L2 M8 b15 u 200, L2 M9 / M10 b17 u 240; L2 M32 / M33 b15-17 never enabled. Seregios 139 -> 148: +L1 M17 b0 c 21, +L2 M3 / M4 / M20 b6 / b9 / b18 (u 200-203, u 230: NOT exported), +L2 M34 b15 u 234 (NOT exported); gated L2 M20 b18 u 231, L2 M26 b15 u 233; no binding on bits 5 / 7 (the sever clear removes only the three b6 ones). c 32 UNIQUE (shell01 mode 1) not exported | uEm042_00 / uEm077_00 | R | the two specs §4 / §5 |",
])

# 5. the sevscan row
rep("uEm071_00 `0xfae5cc` r3 0x8f = 143; none in uEm068_00 / uEm070_00 bands -- dev/remaining-classes-effects-survey.md]",
    "uEm071_00 `0xfae5cc` r3 0x8f = 143; none in uEm068_00 / uEm070_00 bands -- dev/remaining-classes-effects-survey.md] [**uEm077_00 READ 2026-10-16**: the one sever `0xfdae24`, r3 `0x91` = **145** (part 7) -- CUT_TAIL.em077_00 holds 144: Withdrawn table; dev/em077_00-effects-spec.md §8]")

# 6. the in-repo note index
rep("| `em077_00-effects-spec.md` | Seregios effects spec -- **UNFINISHED**:",
    "| `em077_00-effects-spec.md` | Seregios effects spec -- **COMPLETED 2026-10-16** (plays of L2 M26 / M34, plan, 69120-run check, CLIP_ACTIONS, the c 30 reader / cadence / twelve sites, c 32 export, CUT_TAIL joint 145); was UNFINISHED:")
rep("| `em042_00-effects-spec.md` | Barioth effects spec -- **UNFINISHED**:",
    "| `em042_00-effects-spec.md` | Barioth effects spec -- **COMPLETED 2026-10-16** (the remap 0xe64f48, plays, plan, 74880-run check, CLIP_ACTIONS, SHELL_TAIL 14); was UNFINISHED:")

# 7. the Withdrawn table: after its header separator
i = s.index("| claim | why wrong | correction |" + NL + "|---|---|---|")
j = i + len("| claim | why wrong | correction |" + NL + "|---|---|---|" + NL)
row = ("| tail-option.js `CUT_TAIL.em077_00 = { piece: 'em077_00_tail', joint: 144, ... }` (Seregios decode / tail agent) and the "
       "sevscan row's \"em077_00 carries u 900's joint\" (I) | 144 is u 900's joint (states-em077_00.md 0); the drop's joint is option "
       "`+0x1477`, the sever's 4th argument (`0xc22f8`) | `0xfdae18` `mov r3,#0x91` -> **joint 145** (research agent, 2026-10-16; "
       "dev/em077_00-effects-spec.md §8) -- viewer change pending |")
s = s[:j] + row + NL + s[j:]
# undo the empty insert's stray blank line, if any
s = s.replace("| claim | why wrong | correction |" + NL + "|---|---|---|" + NL + NL, "| claim | why wrong | correction |" + NL + "|---|---|---|" + NL)

# 8. a trap and the jt.py caveat
rep("takes the first table in a handler; a handler with none prints `(no table)` |",
    "takes the first table in a handler; a handler with none prints `(no table)`. **Its bias scan takes ANY `sub` with one immediate (2026-10-16)**: a handler opening `sub sp, sp, #8` (uEm077_00 status 7 `0xfdca44`) prints every number 8 too high -- read the handler's head (trap 61) |")
s = s.rstrip(NL) + NL + ("61. **A jump-table helper that infers an index bias from the first `sub ... #imm` reads a stack adjust as the bias "
     "(2026-10-16).** `ng/jt.py` on Seregios's status 7 (`0xfdca44`: `sub sp, sp, #8` then `cmp r0, #0x40`) printed (7, 0x3a..0x40) "
     "as (7, 0x42..0x48): the L2 M26 / M34 plays came out on the wrong numbers until the head was read. Confirm the bias "
     "instruction operates on the index register. (dev/em077_00-effects-spec.md §4)") + NL
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ok')

# p_docs3d0b.py (2026-10-19): the chain-reached builds (Kushala, Alatreon, Amatsu's water lines / base42), the rage / tired fix, the
# re-check, the check-generator bug -- the elder spec, rom-map (rows, tooling, traps 112..114), the engine doc, the board
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
def sub(s, a, b, n=1):
    assert s.count(a) == n, (a[:80], s.count(a))
    return s.replace(a, b)

# ---------------- the elder spec ----------------
p = D + r'\elder-dragon-shells-spec.md'
s = open(p, encoding='utf8').read()
s = sub(s, "- **Which actions**: em024_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain024.py: no call adds an action).\n",
        "- **Which actions**: em024_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain024.py: no call adds an action --\n"
        "  **WITHDRAWN 2026-10-19**: trgen never saw the virtual change vt+0x3d0; fb/chainx.py with it adds (2, 0xb) -> (7, 4), (2, 0xa) -> (3,\n"
        "  0x29) -> (3, 0x2a) -> (3, 0x2b) -> (7, 0x41), (2, 0x1c) -> (3, 0x14), (2, 0xa) -> (3, 0x15), (4, 0x17) -> (3, 0x1b); rage / tired add none).\n")
s = sub(s, "  the beams (7, 0x15 / 0x16 / 0x18 / 0x1a / 0x1b, beam-spawns.js). Not reached (named, not listed): (7, 0x04 / 0x0a / 0x12..0x14 /\n  0x17 / 0x19 / 0x2b / 0x3b..0x41).\n",
        "  the beams (7, 0x15 / 0x16 / 0x18 / 0x1a / 0x1b, beam-spawns.js). Not reached (named, not listed): (7, 0x0a / 0x12..0x14 / 0x17 / 0x19\n"
        "  / 0x2b / 0x3b..0x40) -- (7, 0x04) and (7, 0x41) ARE reached (above) and built:\n"
        "  - (7, 0x04) 0xdf8ac8: phase 0 L2 M25 (0x219, blended with 0x21a by ctl+0x10 through 0xb0174 / 0x72620), phase 1 f118 0x7ded8(e, 0,\n"
        "    0x1b), f122 sp_33 2 (snow 14: ctl+0x2c and +0x2d), setup 0x10 at the owner; its end vt+0x3dc.\n"
        "  - (7, 0x41) 0xdf96a8(kind 2, r2 2): the airborne twin of (7, 0x11) -- phase 0 posture 1 (0xbf4d4 / 0xbc984), phase 2's shot on L2 M9\n"
        "    f20 sp_33 6 (snow 18) for r2 in 1..2 (kind 1's twin: 5 / 17), phase 3's end (3, 1) by vt+0x3d0 (r2 1: vt+0x3e0).\n"
        "  - sp_01's base01 flag 0x400 (mode 0 alone): the refusal lifted (init011 carries 0x3fac58); no maker makes mode 0.\n"
        "  - Check: dev/shells-kushala-check.mjs 52/52 (s04 / s41 and their snow cases), page 23/23, soak em024_00 53 motions 0 refused.\n")
s = sub(s, "e+0x73e1; fb/stdisp.py) gives the helpers' arguments. Not reached (named): (7, 0x48..0x51) (0xec91f0's sp_01).\n",
        "e+0x73e1; fb/stdisp.py) gives the helpers' arguments. Not reached (named): (7, 0x48..0x51) (0xec91f0's sp_01) -- **WITHDRAWN\n"
        "  2026-10-19** for five: (7, 0x10) -> 0x48, (7, 0x41) -> 0x4d, (7, 0x44) -> 0x4f, (7, 0x43) -> 0x50, (7, 0x45) -> 0x51 (vt+0x3d0,\n"
        "  fb/chainx.py); 0x49..0x4c / 0x4e stay unreached. 0xec91f0(e, k): phase 0 L2 M29 (0x21d); phase 1 at its end L2 M14 (0x20e) ->\n"
        "  phase 2: f28 sp_01 6, and f38 sp_01 7 when k >= 5, both with the GOT zero setup (+0x10.. and +0x20..); phase 2's end counts\n"
        "  P+0x1a2 and loops through phase 3 (L2 M14 again) or ends on L2 M15 (0x20f). sp_01 6: flag 1, joint 14; sp_01 7: flag 1, joint 9,\n"
        "  flag 0x400 (y = the ground + vec.y: base01 0x3fac58, the refusal lifted). Rows act050(7, 0x48 / 0x4d / 0x4f / 0x50 / 0x51) on L2\n"
        "  M14 (`at: 'zero'`). Check 33/33 (m48 / m4d / m51; controls: the ground on m4d, joint 14 on m48), page 22/22, soak 71 motions 0\n"
        "  refused. (The check generator's at-once-stop comparison was commented out by a patch -- trap 114: fixed; base41's landing\n"
        "  at-once stop of b0 / b2 after the end's graceful stop now reaches the handle, as 0x43b058 leaves it in its slot.)\n")
s = sub(s, "- **Which actions**: em058_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain058.py, FB_PHASEAT: no edges). Class main\n",
        "- **Which actions**: em058_00_cmdtbl.emc (fb/emcvar.py) closed over the set-action calls (fb/chain058.py, FB_PHASEAT: no edges -- **WITHDRAWN\n"
        "  2026-10-19**: the edges go through vt+0x3d0, which trgen stubbed; see below). Class main\n")
s = sub(s, "  Not reached: (7, 0x08 / 0x0e / 0x18 / 0x19 / 0x1a / 0x1b) -- every sp_06 and sp_42 maker.\n",
        "  ~~Not reached: (7, 0x08 / 0x0e / 0x18 / 0x19 / 0x1a / 0x1b) -- every sp_06 and sp_42 maker.~~ **WITHDRAWN 2026-10-19: all six are\n"
        "  CHAIN-issued** (not variant-gated, not HP-staged: a raw scan of every op of every stream finds none of them -- control (7, 0xb), 4\n"
        "  sites -- and no status script's 0xfe names them -- control his 0x17cca80 / 0x17cca88). His helpers change action through the VIRTUAL\n"
        "  vt+0x3d0 (0x6c178 = b 0x768c8; fb/vchain.py): (2, 8 / 9) 0xf07c08 -> (7, 6 / 7); (2, 0xd) 0xf0b380 -> (7, 8); (2, 0xe) -> (7, 0xe);\n"
        "  0xf0aed8 -> (7, 5); 0xf0ab30 (k 0..4, at its end) and (3, 1) -> (7, 0xf); (7, 5) 0xf0c948 -> (7, 0x18) and (7, 0xf) 0xf0d76c -> (7,\n"
        "  0x19) while e+0x7420 (the owner machine; set offline); (7, 0x19) -> (7, 0x1a) -> (7, 0x1b) -> (3, 2). fb/chainx.py (the fixed trgen)\n"
        "  reaches all six.\n")
s = sub(s, "  - (7, 0x01) 0xf0bd10 L2 M14 f102: sp_01 4 (hit only) while e+0x17f4 bit 0 is clear (no writer of bit 0 found among the 6 `movw #0x17f4`\n"
           "    sites; bit 1 is set at a part break, 0xf07518: E17F4_STANDIN 0).",
        "  - (7, 0x01) 0xf0bd10 L2 M14 f102: sp_01 4 (hit only) while e+0x17f4 bit 0 is clear. **No writer of bit 0 anywhere in the text**\n"
        "    (fb/fieldscan.py: every form that can address +0x17f4 -- movw, imm12, imm8, add-base -- finds 6 sites: in his band the bit-1 writer\n"
        "    0xf07518 (a part break; ldrh / orr #2 / strh through a post-indexed pointer) and the test 0xf0bd70; out of band 0x8d0d3c (an object\n"
        "    with an array at +0x30cec, not an enemy) and 0x3b065c / 0x3b3024 (a global's counter sums). His band has no other base movw in\n"
        "    0x17c0..0x180f and no add-imm base but +0x1480. CONTROLS, the same scan: it finds 0xf07518, and e+0x15fb's sole writer 0xf091ac\n"
        "    among 9 sites.) Its start value (the ctor's zeroing) NOT READ: E17F4_STANDIN 0, named.")
a = "- **Viewer**: SHELL_DATA.em058_00 (6 rows; code 'em058', spawn058). (7, 0xc)'s sp_01 1 is a `start` row on L2 M23 (the hold's end).\n"
s = sub(s, a, a +
        "- **The chain-reached makers (2026-10-19)**:\n"
        "  - sp_06 0xff (base06; reader 0xf0ff20): (7, 8) L2 M10 -> M11 and (7, 0xe) L2 M12 -> M13 at f58 mode 0 (0xf0cae0(k 0 / 1), at\n"
        "    0xf0cc74); (7, 0x18) 0xf0d9e8 L2 M7 -> M8 f78 mode 1. Both modes: no list, ef (999, -1) -- HIT ONLY, named, not built.\n"
        "  - **sp_42 0x102, the water lines** -- (7, 0x19) 0xf0dda0 / (7, 0x1a) 0xf0e194 / (7, 0x1b) 0xf0e678:\n"
        "    - Phase 0: L2 M27 / M28 / M29 (0x21b..0x21d); the line's points e+0xcb40.. (A) / +0xcb50.. (B) from the target's distance d (block\n"
        "      +0x1d0) and the facing he will turn to: block +0x54 + the delta to the target, clamped to tune float 3 degrees (e+0xcb64; turned in\n"
        "      phase 1 by 0x76dd0). Tune (length, near, far, degrees) = 0xe..0x11 / 0x13..0x16 / 0x18..0x1b = (8000, 100, 10000, 30).\n"
        "      0x19 near -> far: z from max(near, d - length / 2), its far end capped at far; 0x1a across: x -4000 -> +4000 at z = clamp(d,\n"
        "      near, far); 0x1b far -> near. y 0; turned by the new facing (op order transcribed: shells.js line058) and set on block +0x40.\n"
        "    - Phase 1: the turn; 0xc0dbc aims his head (e+0x1490) at the line -- NOT BUILT (the viewer's head is the clip's); at tune 6 / 7 / 8\n"
        "      (18 / 20 / 22) sp_42 mode 0 / 1 / 2, setup 0x30 (0x420684): +0x10 A, +0x20 B.\n"
        "  - **BASE42** (uShellEmBase42; vtable via sp_42's 0x17d5190): init 0x4207e4, the activation vt+0x18 0x420ac8, move 0x42124c -> vt+0x154\n"
        "    0x4212b8, end 0x4215a8, helpers 0x420d70 / 0x420fe0 / 0x421384. sp_42's reader 0xf105b0, +0x15c 0xf106ac, +0x158 0xf10830.\n"
        "    - The unit walker (0xc04588..0xc045b8) runs a new unit's vt+0x18 once (state 1 -> 2), then its move in the same pass.\n"
        "    - Init: A -> +0x1600, B -> +0x1610; both y = the lower; +0x40 = A; life +0x15f0 = float 0 (40); +0x1000 = vec 0 (0, -40, 50)\n"
        "      through joint int 0's (3) whole matrix.\n"
        "    - Activation: 0x420d70 (the joint point; the advance), the sound's ray 0x420fe0, ef 0 (u 50) at +0x1000 rotated (X, Y, Z) =\n"
        "      (atan2(-dy, |dxz|), atan2(dx, dz), atan2(-dx, dy)) of the joint point -> the shell.\n"
        "    - Each move: 0x420d70 -- +0x40 advances along A -> B at |B - A|xz / float 0 a frame (x the owner's +0x50c); the placement\n"
        "      0x421384: ef 0 at +0x1000, rotation (X, Y, the block's Z word); the life -= the step; out -> the end. Every 3 frames of life\n"
        "      (life < float 0 - 3 x count) sp_42's +0x15c rays the stage 1000 below to 1000 above the point: on a hit +0x44 = the ground and\n"
        "      ef 1 (u 51) starts there (15 slots).\n"
        "    - The end: ef 0 stopped gracefully, state 0xfe; sp_42's +0x158 waits for ef 0's handle to clear, then (once, past float 1) makes\n"
        "      three sp_01 0 (HIT ONLY: at A / B with y 0, +900, -900 -- not built) and stops every splash; all slots empty -> deleted.\n"
        "    - 0x329c9c / 0x329d04 ignore a unit index > 0 (`bgt` to bx lr): 0x421384's loop over the units places unit 0 alone.\n"
        "    - NOT BUILT, named: the sounds (+0x15cc / +0x15d0 / +0x15d4, 0x4ef25c / 0x4eeed0), the three end hits.\n"
        "  - Check: dev/shells-amatsu-check.mjs 18/18 -- w19 / w1a / w1b fly the three lines (700 moves each equal, the ground rays and 14\n"
        "    starts each); emu_fb `activate` runs vt+0x18 before move 1, `stubs` 0x420fe0 (the sound's ray). Controls: the target (w1a), joint\n"
        "    3 (w19: the stream's start point), the facing (w1b). u 50 / u 51 are NOT exported yet: recording requested.\n")
s = sub(s, "- **Check**: dev/shells-amatsu-check.mjs 12/12 -- his phase byte written per step",
        "- **Check** (before the lines): dev/shells-amatsu-check.mjs 12/12 -- his phase byte written per step")
open(p, 'w', encoding='utf8').write(s)

# ---------------- rom-map ----------------
p = D + r'\rom-map.md'
s = open(p, encoding='utf8').read()
a = "| vt+0x3d0 (uEnemy `0x6c178` = `b 0x768c8`) |"
i = s.index(a); j = s.index('\n', i)
rows = (
"| `0xdf8ac8` (Kushala, (7, 4)) / `0xdf96a8` r2 1..2 | (7, 4): L2 M25 (0x219 blended with 0x21a, 0xb0174 / 0x72620 by ctl+0x10), f118 0x7ded8(e, 0, 0x1b), f122 sp_33 2 (snow 14); (7, 0x41) = 0xdf96a8(2, 2): phase 2's shot sp_33 6 (snow 18; kind 1's twin 5 / 17), phase 0 posture 1, phase 3's end (3, 1) (r2 1: vt+0x3e0) | uEm024_00 | R + E | elder spec 4 |\n"
"| `0xec91f0(e, k)` (Alatreon (7, 0x48..0x51)) | phase 0 L2 M29; phase 1's end L2 M14 (0x20e) -> phase 2: f28 sp_01 6, f38 sp_01 7 (k >= 5), both the GOT zero setup (0xec9610 / 0xec96e8); phase 2's end: P+0x1a2 + 1, loop via phase 3 or L2 M15 (0x20f) | uEm050_00 | R + E | elder spec 7 |\n"
"| `0x43b058(h, flag)` | the shell's graceful / at-once stop: h null -> nothing; the unit's +0xca or state 1 -> 0x329c40(h, flag). It does NOT clear the slot: a later stop of the same handle still reaches it (base41's landing after its end) | shared | R | elder spec 7 |\n"
"| `0xc04544..0xc0460c` (the unit walker) | a unit's +0xc & 7: 1 (new) -> 2 and **vt+0x18 (the activation)**, then vt+0x24 (the move) in the same pass when active; 3 -> 0xc04150; 4 -> 0xc0462c and vt+4 (deleted). Shell classes with their own vt+0x18: base02 0x3fbaf8, base31 0x413c40, base42 0x420ac8, base58 0x433844, the player effects 0x44c388 (fb/vt18.py); the rest `bx lr` 0x4a1694 | shared | R | elder spec 8 |\n"
"| `0xf0dda0` / `0xf0e194` / `0xf0e678` phase 0 | Amatsu's water lines: L2 M27 / M28 / M29, the points e+0xcb40.. / +0xcb50.. (near -> far / across / far -> near) from the target's distance and the clamped turn e+0xcb64 (tune 0xe..0x11 / 0x13..0x16 / 0x18..0x1b); phase 1 0x76dd0 the turn, 0xc0dbc the head's aim (NOT BUILT), sp_42 0 / 1 / 2 at tune 6 / 7 / 8 (setup 0x30, 0x420684) | uEm058_00 | R + E | elder spec 8 |\n"
"| `0x4207e4` / `0x420ac8` / `0x42124c` / `0x4212b8` / `0x4215a8` / `0x420d70` / `0x420fe0` / `0x421384` | **BASE42** init (A / B, y the lower, +0x1000 the joint point, life float 0) / activation (ef 0 at +0x1000 aimed at the shell, Z = atan2(-dx, dy)) / move / state-1 move (advance, place, life) / end / the joint point + the advance along A -> B / a sound's ray (not visual) / the placement (Z = the block's word) | uShellEmBase42 | R + E | elder spec 8 |\n"
"| `0xf105b0` / `0xf106ac` / `0xf10830` | sp_42's reader (ef 0 +0x15c8, ef 1 +0x1660, sounds +0x15cc / +0x15d4 / +0x15d0, hit, joint int 0, float 0 the travel, &vec 0, float 1 the wait) / +0x15c the ground-rayed splash every 3 frames (15 slots) / +0x158 the end: ef 0's handle gone -> three sp_01 0 (hit only) once, the splashes stopped, deleted when all clear | uEm058_00 | R + E | elder spec 8 |\n"
"| `0x329c9c(h, pos, i)` / `0x329d04(h, rotDeg, i)` | i > 0 returns at once (`bgt` -> bx lr): only unit 0's [+0x150] / [+0x154] are written | shared | R | elder spec 8 |\n")
s = s[:j + 1] + rows + s[j + 1:]
# withdrawn: the check generator's disabled comparison
a = "| claim | why wrong | correction |\n|---|---|---|\n"
i = s.index("### Withdrawn"); k = s.index(a, i) + len(a)
s = s[:k] + ("| dev/shells-alatreon-check.mjs / shells-amatsu-check.mjs \"the at-once stops compared\" (2026-10-19, shells lane) | mk050spec / mk058spec's patch put its comment BEFORE the line's `return`, commenting the comparison out (the `if` then guarded the next `return null`) | the comment moved above the line; the restored comparison caught base41's landing (b0 / b2 stopped at once after the end's graceful stop: 0x43b058 keeps the handle) -- fixed in shells.js stop041; Alatreon 33/33, Amatsu 18/18 |\n") + s[k:]
# tooling
a = "| `<scratchpad>\\fb\\chainx.py <mon> [class]` (2026-10-19) |"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + (
"| `<scratchpad>\\fb\\trgen.py` rage / tired (2026-10-19) | the rage tests 0x81670 / 0x81688 / 0x816b8 answer kw `rage` (env FB_RAGE), the tired test 0x81614 kw `tired` (env FB_TIRED); before, only 0x81670 took kw rage and the rest answered 0 | chainx walks rage 0 / 1 x tired 0 / 1 | the effects agent's Brachydios (7, 0xa6) | cengen11 answers rage 0 / 1 itself; tired needs FB_TIRED |\n"
"| `<scratchpad>\\fb\\cen3.py <mon> [class]` (2026-10-19) | the census of the reached actions three ways: old trgen over the old reach, the fixed one over chainx's reach at tired 0 and 1; prints the creates the fixed runs add, and the TIRED-GATED ones (made at tired 0 only) | `fb/cenlane.sh` over every reach_<mon>.json | Kushala / Alatreon / Amatsu: their chain-reached makers | an id 0x0 = a class whose ids sit in its own fields (Mizutsune, Hermitaur): poke them (fb/crid.py) |\n"
"| `<scratchpad>\\fb\\vt18.py` / `cliplen.py <mon> <list> <motion>..` / `crid.py` (2026-10-19) | every shell class with its own vt+0x18; a clip's frame count (the poses glb, x 60: a check's `len`); creates with a class's id fields poked | -- | -- | -- |\n"
"| `<scratchpad>\\fb\\emu_fb.py` case `activate` / `stubs` 0x420fe0 (2026-10-19) | vt+0x18 run before move 1 (the walker's activation) for the ids named; base42's sound ray stubbed when named | -- | Amatsu's lines 700 moves equal | opt-in: other cases unchanged |\n") + s[j + 1:]
# traps
a = "111. **A chain walk must follow the VIRTUAL change (2026-10-19).**"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + (
"112. **A tracer's stub answers are game state (2026-10-19).** trgen answered the tired test 0x81614 and two of the three rage tests 0 -- the effects agent's Brachydios (7, 0xa6) hid behind them, and Mizutsune's / Hermitaur's / Lavasioth's makers are TIRED-GATED (fb/cen3.py lists them). Walk and census at rage 0 / 1 x tired 0 / 1. (G: actions and spawns gate on rage and fatigue; T: our stubs)\n"
"113. **A new shell unit runs vt+0x18 before its first move (2026-10-19).** The unit walker activates it (state 1 -> 2, vt+0x18) and moves it in the same pass; base42 starts its effect there, and emu_fb's harness never called it until `activate`. Check vt+0x18 (fb/vt18.py) before trusting a flown shell's starts. (G: the activation; T: our harness skipped it)\n"
"114. **A generated check can lose a comparison to its own patch (2026-10-19).** A replacement that put a `//` comment before the rest of a line commented out the at-once-stop comparison in two checks; the next `return null` hid it. After patching a check, grep the patched line. (T)\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

# ---------------- the engine doc ----------------
p = D + r'\effect-runtime-engine.md'
s = open(p, encoding='utf8').read()
a = "| base30 | the whirlwind"
i = s.index(a); j = s.index('\n', i)
s = s[:j + 1] + "| base42 | the water line: a point carried from A to B over its life, the stream ef aimed from a joint point at it (placed every move), ground-rayed splashes every 3 frames; started on the walker's ACTIVATION (vt+0x18), not in the init | `0x4207e4` / `0x420ac8` / `0x4212b8` | elder 8 |\n" + s[j + 1:]
a = "  - 111 (G / T) action chains go through the virtual vt+0x3d0"
i = s.index(a); j = s.index('\n', s.index('\n', i) + 1)
s = s[:j + 1] + ("  - 112 (G / T) rage and fatigue gate actions and spawns: a tracer that answers the rage / tired tests 0 hides them; run 0 / 1 of each.\n"
                 "  - 113 (G / T) a new unit is ACTIVATED (vt+0x18) before its first move, in the same pass: a shell may start its effect there.\n"
                 "  - 114 (T) a patched check can lose a comparison to a misplaced comment: grep the patched line.\n") + s[j + 1:]
open(p, 'w', encoding='utf8').write(s)

# ---------------- the board ----------------
p = r'C:\Coding Repos\MHGU-TASKS.md'
s = open(p, encoding='utf8', errors='surrogateescape').read()
a = "      - [ ] (idea) Kushala's / Alatreon's base01 flag-0x400 refusals can go now that the arm is read (0x3fac58): re-check their modes.\n"
s = sub(s, a, "      - [x] 2026-10-19 -- Kushala's / Alatreon's base01 flag-0x400 refusals lifted; their chain-reached attacks built: Kushala's (7, 4)\n"
              "        wind and his airborne shot (7, 0x41), Alatreon's L2 M14 pair (7, 0x48 / 0x4d / 0x4f..0x51). Checks 52/52 and 33/33.\n"
              "      - [x] 2026-10-19 -- AMATSU'S WATER LINES (L2 M27 / M28 / M29): the stream from his mouth to a point sweeping the ground, with\n"
              "        splashes along it (BASE42). Check 18/18. Waits on u 50 / u 51 being recorded before it shows. His head does not turn to\n"
              "        the line (the game aims it; the viewer plays the clip).\n"
              "      - [ ] (bug) Amatsu's water lines show nothing until em058_00u 50 / 51 are recorded and lifted.\n")
open(p, 'w', encoding='utf8', errors='surrogateescape').write(s)
print('ok')

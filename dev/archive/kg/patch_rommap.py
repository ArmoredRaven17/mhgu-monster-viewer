# Patch dev/rom-map.md in place for the Khezu / Gravios effects specs (research agent, 2026-10-16). Every anchor must be
# found exactly once in the file as it is NOW (other agents edit it); nothing is deleted.
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'

def once(anchor):
    c = s.count(anchor)
    if c != 1:
        sys.exit('anchor found %d times: %r' % (c, anchor[:90]))

def append_in_row(anchor_row_start, tail_old, tail_new):
    """replace the first occurrence of tail_old on the row beginning with anchor_row_start"""
    global s
    once(anchor_row_start)
    i = s.index(anchor_row_start)
    j = s.index(nl, i)
    row = s[i:j]
    if tail_old not in row:
        sys.exit('tail not on row: %r' % anchor_row_start[:60])
    row2 = row.replace(tail_old, tail_new, 1)
    s = s[:i] + row2 + s[j:]

# 1. per-class table rows
append_in_row('| uEm003_00 (Khezu) | `0x17958f0` | `0xd0f728` |', '| R / UNREAD |',
    '| R / UNREAD [**R (read whole `..0xd0f9a0`, emulated, 66744 JS-vs-ROM runs 0 mismatches) 2026-10-16, research agent**: '
    'bits 9-11 follow the ACTION -- (7, 0 / 2 / 0xf / 0x11 / 0x12 / 0x30 / 0x44 / 0x48 / 0x4e), (3, 0x43 / 0x4f / 0x55), (2, 0 / 5..8 / '
    '0xa / 0xe) clear them, (7, 9 / 0xa / 0xb / 0x10 / 0x3b / 0x49 / 0x4f) set them (op 0x1c\'s charged / plain pairs); L2 M37 15-16, '
    '17-18 on (7, 0x52) at P+0x1a1 == 3; L2 M38 19-20 on (7, 0x52); no record to export -- dev/em003_00-effects-spec.md] |')
append_in_row('| uEm004_00 (Basarios, Gravios) | `0x1797c8c` | `0xd2e0ec` |', 'em 5 tail 0xd2e35c UNREAD)',
    'em 5 tail 0xd2e35c UNREAD) [**em-5 tail READ 2026-10-16** (`0xd2e35c..0xd2e524`, emulated, 82800 runs 0 mismatches, research '
    'agent): L2 M3 / M4 / M30-32 (7, 0xa / 0x32 / 0x3c) 15-16 / back broken 19-20, (7, 7 / 0x3b) 17-18 / 21-22; L2 M24 / M33 / L4 M59 '
    '(7, 0xe / 0x11 / 0x34) ctl+0x24 back 29-31 / belly 23-25; L0 M7 27-28 unless sunk -- dev/em005_00-effects-spec.md]')
# 2. THE PSL ENABLE MASK row
append_in_row('| `0xd2e35c` | the em-5 (Gravios) arm of the same method |', 'R (entry) — body NOT READ |',
    'R (entry) — body NOT READ **-> READ 2026-10-16 (research agent): extent `..0xd2e524` (literals `0xd2e528` / `0xd2e52c`); see the '
    'section "Khezu / Gravios -- the PSL enable words" and dev/em005_00-effects-spec.md 1** |')
# 3. 0x169bb80
append_in_row('| `0x169bb80` | `uEm004_00`\'s id→key table:', '| dev/em004-fireball-actions.md |',
    '| dev/em004-fireball-actions.md [**2026-10-16**: the arms and `0xd2e0bc` have no em test, so GRAVIOS\'s (7, 0xa) / (7, 7) ask at '
    'f216 for **u 0 / u 30 of his own em005_00u UNIQUE** (both `em004_00_002`; NOT exported, no ACTION_EFFECTS row); his (7, 5 / 0xf / '
    '0x15 / 0x10) ask for 60 / 70 / 90 / 100, which his pel lacks -- dev/em005_00-effects-spec.md 3] |')
# 4. 0x9b76e4 row
append_in_row('| `0x9b76d8` / `0x9b76e4` (in `0x9b75e8`, draw) |', '| blocks L4 M59 before its beam',
    '[**soak 2026-10-16** (research agent, current tree): `effect-live-soak.mjs em005_00 "L4 Motion[59]" "L4 Motion[60]" '
    '--viewer-inputs` -> 0 refused (M59 20 started, beams em005_00:10 at f135; M60 22 started) -- dev/em005_00-effects-spec.md 5] '
    '| blocks L4 M59 before its beam')
# 5. the sever row
append_in_row('| `0xd22d14` / `0xd22d20` | Basarios\'s sever:', '| uEm004_00 | R | §1.2 |',
    '| uEm004_00 | R | §1.2; **and Gravios\'s** (2026-10-16: the vt+0x204 status-10 arm `0xd22c70` -> n <= 0x9a `0xd22ce8` -> 0x72 '
    'with part 7, no em test on the path -- the em tests are `0xd22c88` (0xa1 arm) and `0xd22ea0`, after the switch; CUT_TAIL.em005_00 '
    'joint 143 is the sever byte -- dev/em005_00-effects-spec.md 4) |')

# 6. the new section, before "## 1b."
SEC = [
 '### Khezu / Gravios -- the PSL enable words, Gravios\'s gas request and cut tail (research agent for the Viewer agent, 2026-10-16; dev/em003_00-effects-spec.md, dev/em005_00-effects-spec.md)',
 '',
 '| addr | what | class | st | detail |',
 '|---|---|---|---|---|',
 '| `0xd0f728` (vt+0x13c, vtable `0x17958f0`) | Khezu\'s PSL enable word, extent `..0xd0f9a0` (`popne` `0xd0f98c`, `pop` `0xd0f9a0`; next fn `0xd0f9a4`); jump table `0xd0f794` (0x50 words, `cmp #0x4f`). `0xca170`; then the ACTION: status 7 table -> `bfc r0,#9,#3` `0xd0f914` (n 0 / 2 / 0xf / 0x11 / 0x12 / 0x30 / 0x44 / 0x48 / 0x4e) or `orr #0xe00` `0xd0f8e0` (n 9 / 0xa / 0xb / 0x10 / 0x3b / 0x49 / 0x4f); status 3 n - 0x43 in mask 0x41001 (0x43 / 0x4f / 0x55) and status 2 n <= 0xe in mask 0x45e1 (0 / 5..8 / 0xa / 0xe) -> clear; then L2 M38 (0x226) `0x6fe88(e, 7, 0x52)` ? \\|= 0x180000 : return; L2 M37 (0x225) \\|= 0x18000, 0x60000 when (7, 0x52) and `[P+0x1a1]` == 3. Callees `0xca170`, `0x6fe88` only. Writeback base (`ldr r0,[r1,r0]!`) = e+0x13f4 | uEm003_00 | R (emulated; JS 66744 runs 0 mismatches) | em003 spec §1; psl-mask transcription there |',
 '| band `0xd0f1f0..0xd22438` | `#0x13f4` immediates only `0xd0f8d4` / `0xd0f908` / `0xd0f968` / `0xd0f990`, all in the method; the same scan over `0xd22438..0xd31b64` finds uEm004_00\'s six, all in `0xd2e0ec` | uEm003_00 / uEm004_00 | R (negative with control) | em003 / em005 spec §1 |',
 '| Khezu\'s charged / plain pairs | em003_00_cmdtbl: op 0x1c (enraged) issues the SET form, `1c 02` the CLEAR form: (7, 0) / (7, 9) g1 s8 / s11 / g8 s0, (7, 0x4e) / (7, 0x4f) g1 s68, (7, 2) / (7, 0xa) g1 s13, (7, 0xf) / (7, 0x10) g1 s54, (2, 3 / 7) / (7, 0xb) g1 s55; unpaired (7, 0x11) g1 s8 / s23, (7, 0x57) g1 s91, (7, 0x12) g1 s109, (7, 0x52) g1 s88, (7, 0x2c) g1 s56; no stream issues (7, 0x30 / 0x3b / 0x44 / 0x48 / 0x49), (3, 0x43) | em003_00 | R (emcfind) | em003 spec §1, §3 |',
 '| `0xd162b8` / `0xd18608` / `0xd14614` | Khezu\'s L2 M4 jump (phase 0, `0xd163e0`) -> landing L2 M5 (`0xd167e8`, phase 2, `0xbf52c` hit and P+0x14 < 0) or L2 M39 (`0xd16694`, after `0xb09c8`); reached as (7, 0 / 9) r1 0 / 1, (7, 0x4e / 0x4f), (7, 0x11) = (7, 0x57) (one arm `0xd1cab4`), (7, 0x30). `0xd18608` = (7, 0x12) / (7, 0x44): posture 5, turn tables, L2 M5 `0xd18864` / L2 M39 `0xd18adc`. `0xd14614` = (3, 0x43): L0 M21 then L2 M5 `0xd14754` / L2 M39 `0xd147e0` | uEm003_00 | R (sites, dispatcher `0xd1c920` table `0xd1c94c`) / I (which landing: the physics) | em003 spec §3 |',
 '| `0xd13a10` modes 4 / 5 | (3, 0x4f) / (3, 0x55) (status-3 table `0xd158a0`): posture 5, `0x7a284` on the wall turn array `0x1795f08`, then `0x768c8` -> (7, 0x12) / (7, 0x44) (`0xd13b04..0xd13b30`) | uEm003_00 | R | em003 spec §1 |',
 '| `0xd1b6c4` (7, 0x52) | phase 0 stores P+0x1a1 = 1 (`0xd1b71c`) then L2 M37 (`0xd1b740`); phase 2 (`0xd1b794`, the only way into `0xd1bbd8`) increments the phase (`0xd1bc10`) then L2 M37 again (`0xd1bc2c`, read at phase 3: no u 261); L2 M13 `0xd1bc90`; L2 M38 `0xd1bd70` | uEm003_00 | R | em003 spec §3 (CLIP_ACTIONS `phase`) |',
 '| `0xd2e35c..0xd2e524` | Gravios\'s half of `0xd2e0ec` (the head `0xd2e0fc..0xd2e108`: `e+0xb5f4` == 5 -> `pop` + `b 0xd2e35c`). k = motion - 0x203: mask **0x38000003** (L2 M3 / M4 / M30 / M31 / M32), status 7: n 0xa / 0x32 / 0x3c -> `0x9d36c(e, 0)` >= .dtp +0x64 byte 1 (rank <= 4) / 2 ? 0x180000 : 0x18000; n 7 / 0x3b -> 0x600000 : 0x60000. Mask **0x40200000** (L2 M24 / M33) or motion 0x43b (L4 M59), status 7, n 0xe / 0x11 / 0x34: `[[e+0xcac0]+0x24]` & 4 -> 0xe0000000, & 2 -> 0x3800000, else nothing. Motion 7: `0x81d6c` ? nothing : 0x18000000 | uEm004_00 | R (emulated; JS 82800 runs 0 mismatches) | em005 spec §1 |',
 '| `0xd22e8c..0xd22fac` re-read | ctl+0x24 for em 5: bit 1 = part 6 >= .dtp byte 9 / 0xa (row 2, the belly\'s second stage), bit 2 = part 0 >= byte 1 / 2 (row 0, the back); same rank choose `0x3a8430` <= 4 | uEm004_00 | R | em005 spec §1 (the row above `0xd22e8c` named them "late hit records only": they also gate the beam vents\' PSL bits) |',
 '| `em005_00_dtbparts.dtp` | dtp.py 237 / 237 EXACT; array A row 0 = (0, 1, 2, 2) back, row 2 = (6, 2, 2, 3) belly stage 2, row 3 = (5, 1, 2, 1) head; option rows `[+0x91]` = **0** (CUT_TAIL above 20, speed 1.0) | em005_00 | R (file) | em005 spec §1, §4 |',
 '| `em005_00_dtbase.dtb` +0xa8 | MoguriBaseOfs **-2000** (file +0x22+16; controls em007_00 -1100, em003_00 0, em045_00 -2000 as the row above) | em005_00 | R (file) | em005 spec §1 |',
 '| monsters.json em005_00 groups 18 / 12 | set 18 = {16 off, **17 on**} (the back broken, part pass `0xd2431c`), set 12 = {10 off, **11 on**} (the belly stage 2, `0xd2422c`) -- the only sets drawing 17 / 11: `SHELL_PARTS.em005_00` `backBroken: 17`, `bellyBroken: 11` (new keys) | em005_00 | R (file; the part pass theirs, states-em005_00.md 2.2) | em005 spec §1 |',
 '| `0xd2cdf8` / `0xd2ce04` / `0xd2cf78` -> `0xd28bb4` | (7, 0xd) r1 0 r2 0, (7, 0xe) 1 / 0, (7, 0x32) 1 / 1; r5 = r2 (`0xd28bd4`) picks the end `0xd295d0..0xd2969c`: 0 -> L2 M33 + M34 / M35, 1 -> L2 M30 + M31 / M32 (blend `0xb03f8`). Status 13 n 1 (`0xd2e03c` -> `0xd2dcc0`): L2 M27 + M28, then L2 M33 + M34 (`0xd2dd78`) | uEm004_00 | R | em005 spec §3 |',
 '| `0x159aaf8` = `[0x172ba68][113]` | Gravios\'s option descriptor: word 1 **0x8437**, word 2 -1, +0xb4 0x77ed; `0x159daa0[0x8437]` = {0x6fd5ce61 = jamcrc(`enemy\\em005\\em005_00\\mod\\em005_00_tail`), 0x58a15856}; control [0x8413] = em004_00_tail | em005_00 | R | em005 spec §4 |',
 '| em005_00u (`.pel`) | UNIQUE keys 0 / 10 / 30 / 40 (`em004_00_002`), 130 / 131, **150** (`em005_00_000`, requester NR: not one of the band\'s eight vt+0x1d0 calls, its only request sites), 900 / 905, breaks, rage puff, hyper; SEQUENCE 230 .. 390. Basarios\'s UNIQUE 0 / 30 / 60 / 70 / 90 / 100 | em005_00 | R (proof.parse) | em005 spec §3 |',
 '',
]
anchor = '## 1b. The decode notes'
once(anchor)
i = s.index(anchor)
s = s[:i] + nl.join(SEC) + nl + s[i:]

# 7. in-repo notes index rows, after the em007_00 spec row
ROWS = [
 '| `em003_00-effects-spec.md` | Khezu effects spec: the enable word `0xd0f728` (bits 9-11 follow the action -- the charged / plain pairs op 0x1c issues; L2 M37 / M38 by (7, 0x52) and its phase byte), CLIP_ACTIONS with `rage` forms and a new `phase` field (`clipPhaseFor`), no record to export | 2026-10-16 | 14 KB |',
 '| `em005_00-effects-spec.md` | Gravios effects spec: the enable word\'s em-5 tail `0xd2e35c` (gas clouds by action and the back, beam vents by ctl+0x24 back / belly), SHELL_PARTS backBroken / bellyBroken, CLIP_ACTIONS with the op-0x24 tired twins, ACTION_EFFECTS u 0 / u 30 at f216, records u 271 / 290 / 301 / 390 + u 0 / 30, CUT_TAIL verified (0x8f, no .dtp option rows), the 0x9b76e4 soak clean | 2026-10-16 | 17 KB |',
]
row_anchor = '| `em007_00-effects-spec.md` | Diablos effects spec:'
once(row_anchor)
i = s.index(row_anchor); j = s.index(nl, i)
s = s[:j + len(nl)] + nl.join(ROWS) + nl + s[j + len(nl):]

# 8. tooling row, after bw2/emu_fast.py
TOOL = ('| session scratch `<scratchpad>/kg/emu_kg.py` (+ `jscheck_kg.py`, `classify.py`, `kprobe.py`) | vt+0x13c with the em byte '
        '`e+0xb5f4`, ctl `[e+0xcac0]+0x24`, part levels P+0x3bc + 12 part (0x9d36c), the phase byte P+0x1a1, the real .dtp rows of any '
        'monster, rank, posture / P+0x5c / MoguriBaseOfs; `classify.py <mon>`: every whole-plan binding through the ROM word per '
        'CLIP_ACTIONS play x calm / enraged / tired x parts; `kprobe.py <class> <em> <statuses> [postures]`: probe.py over numbers '
        '0..0x5f | Deviljho / Tigrex / Basarios (em004 arms, L0 M7 sunk) words reproduced before Khezu / Gravios | `0x712a0` answered, '
        'not run; ctl+0x24 must be supplied consistent with the levels (as `0xd22e8c` builds it) |')
tool_anchor = '| session scratch `<scratchpad>/bw2/emu_fast.py`'
once(tool_anchor)
i = s.index(tool_anchor); j = s.index(nl, i)
s = s[:j + len(nl)] + TOOL + nl + s[j + len(nl):]

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('patched', len(s))

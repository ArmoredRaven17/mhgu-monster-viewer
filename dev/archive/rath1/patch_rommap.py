# Patch dev/rom-map.md in place (re-read at run time; anchored inserts, each anchor must match exactly once).
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
src = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in src else '\n'
lines = src.split(nl)

def find_one(pred, what):
    hits = [i for i, l in enumerate(lines) if pred(l)]
    if len(hits) != 1:
        sys.exit('anchor %s: %d hits' % (what, len(hits)))
    return hits[0]

if any('dev/em001-effects-spec.md' in l for l in lines):
    sys.exit('already patched')

# A. the per-class row (status upgrade appended, original text kept)
i = find_one(lambda l: l.startswith('| uEm001_00 (Rath line) | `0x1793c28` | `0xd09054` | R (slot) / override UNREAD |'), 'A')
lines[i] = lines[i].rstrip()
assert lines[i].endswith('|')
lines[i] = lines[i][:-1].rstrip() + (' [**R (read whole `..0xd09420`, emulated, 195840 JS-vs-ROM runs 0 mismatches) 2026-10-16, research agent**: '
    'L2 M3 / M4 (all variants) and, em byte 1 only, L4 M6 / M50 / M52 / M55 / M65 + L9 M2 / M6: severed 21-23 (L4 M65 also clears bit 1), else 15-17, '
    'variant 4 18-20 when part 7 >= .dtp A[0x11 / 0x12] or `0x49930` <= 5; L2 M1 ids 0x201 / 0x202 / 0x401 not tired 24-26; L0 M16 / M17 (1, 7 / 8) 18-19; '
    'L4 M38 (7, 0xf5) clears 6-12 sets 30-31; L4 M32 em byte 2 only 27-29. Transcribed for em 1 in the spec, NOT in psl-mask.js yet -- '
    'section "Rathian / Gold / Dreadqueen -- the PSL enable word"] | dev/em001-effects-spec.md |')

# B. the section, before "## 1b."
j = find_one(lambda l: l.startswith('## 1b. The decode notes'), 'B')
sec = [
'### Rathian / Gold / Dreadqueen -- the PSL enable word (research agent for the Viewer agent, 2026-10-16; dev/em001-effects-spec.md)',
'',
'| addr | what | class | st | detail |',
'|---|---|---|---|---|',
'| `0xd09054` (vt+0x13c, vtable `0x1793c28`) | PSL enable word, extent `..0xd09420` (one pop; literals `0xd09424` / `0xd09428` -> GOT `0x1831c54`; next fn `0xd0942c`); jump table `0xd09090` (60 offsets, `cmp #0x3b`) on motion - 0x406. `0xca170`; **L0 M16 / M17** status 1, n 7 / 8 -> `0xc0000`; **L2 M3 / M4** (`0xd0920c`): vt+0x370(e,1) ? `0xe00000` : `0x38000`, variant byte `e+0xb5f5` == 4 -> `0x1c0000` when `0x9d36c(e, 7)` >= A[0x11] (`0x3a8430` <= 4) / A[0x12] (A = `[[e+0x75f0]+0x64]`), else when `0x49930(e)` <= 5 (unsigned `movls`); **L2 M1** (`0xd0938c`): halfword `e+0xb5f0` in {0x201, 0x202} or 0x401, not `0x81614` -> `0x7000000`; **L4 M6 / M50 / M52 / M55 / M65, L9 M2 / M6** (`0xd09288`): em byte `e+0xb5f4` == 1 only, then the same tail form (severed: `0xe00000`, L4 M65 then `bfc` bit 1 `0xd092d0`); **L4 M32** (`0xd09180`): em byte 2, not tired, (7, 3 / 0x29 / 0x2b / 0x2c / 0x48 / 0x49) -> `0x38000000`; **L4 M38** (`0xd093d8`): `0x6fe88(e, 7, 0xf5)` -> `& 0x3fffe03f \\| 0xc0000000`. Writes via `ldr r0,[r4,r0]!` / `str r0,[r4]` | uEm001_00 | R (emulated; em 1 transcription 195840 runs 0 mismatches; the em-2 arm L4 M32 spot-emulated only) | em001 spec §1. Supersedes breaks-em001.md §5 "attack hit groups" (Withdrawn) |',
'| band `0xcecd20..0xd0f400` | `#0x13f4` immediates only `0xd091e0` / `0xd092b4` / `0xd092fc` / `0xd093c8` / `0xd093f0` / `0xd09410`, all in the method; control: the same scan over `0xe72738..0xe83434` finds Deviljho\'s two | uEm001_00 | R (negative with control) | em001 spec §1 |',
'| `0x49930` | `push / ldr [GOT 0x1831c54] / ldr [r0] / bl 0x3a8470 / pop` (`0x49930..0x49944`) -- the QUEST\'S NUMBER (`input.questLevel` in shells.js). `0x3a8470` (`..0x3a84d4`): `0x3b519c(g, [quest+0xe0]) == 1` -> sxtb `0x3b8eb4(..)` (NR; shells.js: "the quest id mod 100"); else quest id - 0xf906f in 0..14 -> 0x10 (index 5 -> 0); else 0 | shared | R (thunk and `0x3a8470`) / NR (`0x3b519c`, `0x3b8eb4`) | em001 spec §1; states-em037_04.md §5 (the thunk), states-em002_04.md §2.1 / §6 (other readers) |',
'| em001_04 `.dtp` array A (file +0x4d, rows of 4) | `06020201 01010102 02010102 00010103 07020200`: A[0x11] = A[0x12] = 2 (row 4, part 7) -- the word\'s and the poison\'s threshold (shells.js `D.poison.levels [2, 2]`); em001_00 / 02 have 4 rows (never read: variant != 4) | em001_04 | R (data; mapping as the Garuga harness) | em001 spec §1 |',
'| their PSLs vs the word | Rathian 57 out-of-mask: always 2 (u 200 L2 M5 b0, u 260 L2 M9 b0), calm 17 / enraged 17 (u 201 / 202, c 30), tired-calm 9 (u 221), tail-on 3 (u 502 / 503 / 530), severed 1 (u 510), (1, 7) 3 (c 60 / 61 no record), never 5. Gold 65: + L4 M18 u 230-232 calm / enraged, L2 M1 u 290 / 291 not tired, u 541 / 542 severed; **u 522 / 523 have records and are never enabled on Gold** (variant 2). Dreadqueen 70: + 7 always (c 2 / 4 / 6, u 630 / 631), three tail forms on L2 M3 / M4, L4 M6 / M50 / M52 / M55, L9 M2 / M6. Export: Rathian u 201 / 202 / 221 / 502 / 503 / 510; Gold + u 290 / 291 / 541 / 542; Dreadqueen + u 500 / 501 / 520 / 521 / 522 / 523 / 631. **No CLIP_ACTIONS needed** (the action arms name no record / have no clip); new pslMask input `questLevel` (SHELL_QUEST_LEVEL) | em001 | R (plan) | em001 spec §2 / §3 |',
'',
]
lines[j:j] = sec

# C. withdrawn row, right after the Withdrawn table's separator
k = find_one(lambda l: l.startswith('### Withdrawn'), 'C')
assert lines[k + 2].startswith('| claim |') and lines[k + 3].startswith('|---'), 'C layout'
lines.insert(k + 4, '| breaks-em001.md §5 "Attack hit groups: vtable +0x13c 0xd09054 sets e+0x13f4 bits for L2 M3 / M4 ... 0x38000 while the tail is on and 0xe00000 once severed ... Not visual"; states-em001.md §1 "+0x13c 0xd09054 (attack hit groups)" | the slot is the PSL enable word (THE PSL ENABLE MASK), so the bits pick EFFECTS -- visual; and the note read the first arm only | the whole method `0xd09054..0xd09420`: tail forms on L2 M3 / M4 and (em 1) L4 M6 / M50 / M52 / M55 / M65, L9 M2 / M6 incl. Dreadqueen\'s 18-20 by part 7 / the quest number; L2 M1 by enemy id; L0 M16 / M17 by (1, 7 / 8); L4 M32 (em 2); L4 M38 (7, 0xf5) (dev/em001-effects-spec.md §1) |')

# D. in-repo notes list, after the em043 spec row
d = find_one(lambda l: l.startswith('| `em043_00-effects-spec.md` |'), 'D')
lines.insert(d + 1, '| `em001-effects-spec.md` | Rathian / Gold / Dreadqueen effects spec: the enable word `0xd09054` (tail forms 15-17 / 18-20 / 21-23 incl. Dreadqueen\'s by part 7 and the quest number `0x49930`; L2 M1 24-26 by enemy id, not tired; L0 M16 / M17 by action; L4 M38 (7, 0xf5); the em-2 L4 M32 arm), records to export per monster, no CLIP_ACTIONS, new pslMask input `questLevel` | 2026-10-16 | 21 KB |')

# E. tooling, after the bw1 emulator row
e = find_one(lambda l: l.startswith('| session scratch `<scratchpad>/bw1/emu13c_bw.py`'), 'E')
lines.insert(e + 1, '| session scratch `<scratchpad>/rath1/emu13c_rath.py` (wraps bw1/emu13c_bw.py) + `jscheck_rath.py` + `classify.py` | uEm001_00 vt+0x13c with the em byte `e+0xb5f4`, the id halfword `e+0xb5f0`, a monster\'s own .dtp array, and `0x49930` (the quest number) answered by a hook; jscheck runs node on `em001.js` against it; classify evaluates each whole-plan binding by state | Deviljho L2 M10 `0x381ff` / `0xe3f` and Garuga L2 M2 `0x1bf` reproduced first; em 2 changes L9 M2 (`0x1ff`), so the comparator sees the em byte | `0x49930` answered, not run; the id defaults to (variant << 8) \\| em |')

io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(lines))
print('patched: A row', i + 1, 'section at', j + 1, 'withdrawn at', k + 5, 'notes at', d + 2, 'tooling at', e + 2)

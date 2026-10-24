# patch dev/rom-map.md in place for the Rathalos-line enable word (em002 spec). Re-reads the file; each edit anchored on an
# exact text; refuses if an anchor is missing or already patched. The Rathian-line agent mapped the method's addresses
# (section "Rathian / Gold / Dreadqueen -- the PSL enable word"); this adds only what is em 2's.
import sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(P, encoding='utf-8').read()
nl = '\r\n' if '\r\n' in s else '\n'
if 'em002-effects-spec.md' in s:
    sys.exit('already patched')

# 1. the per-class row: append the em-2 bracket (their bracket kept as is)
lines = s.split(nl)
hit = [i for i, l in enumerate(lines) if l.startswith('| uEm001_00 (Rath line) | `0x1793c28` | `0xd09054` |')]
assert len(hit) == 1, 'row anchor'
l = lines[hit[0]]
tail = ' | dev/flying-wyverns-effects-survey.md; dev/em001-effects-spec.md |'
assert l.endswith(tail), 'row tail'
add = (' [**em 2 side, 2026-10-16 (research agent, Rathalos line)**: there is NO uEm002_00 -- Rathalos / Silver / Dreadking run this class; '
       'read whole independently, the same arms; em-2 transcription vs ROM 14976 runs 0 mismatches (variants 0 / 2 / 4): L2 M1 bits 24-26 on Silver only '
       '(id 0x202), never Rathalos (2) / Dreadking (0x402); L4 M32 is em 2\'s; NOT in psl-mask.js yet]')
lines[hit[0]] = l[:-len(tail)] + add + ' | dev/flying-wyverns-effects-survey.md; dev/em001-effects-spec.md; dev/em002-effects-spec.md |'
s = nl.join(lines)

# 2. withdrawn row, right after the withdrawn table's header
hdr = '### Withdrawn \u2014 kept so they are not rediscovered' + nl + nl + '| claim | why wrong | correction |' + nl + '|---|---|---|' + nl
assert s.count(hdr) == 1, 'withdrawn anchor'
row = ('| dev/flying-wyverns-effects-survey.md "What closing each needs" 1 (**Viewer agent, 2026-10-14**): "the Rathalos line uEm002_00" is a class of its own to read | '
       'named by analogy with the per-em classes; main.rodata has no `uEm002_00` string (control: `uEm001_00`, `uEm003_00` found the same way) | '
       'Rathalos / Silver / Dreadking run **uEm001_00** (id map `0x50aa8`: 2 -> 3, 0x202 -> 4, 0x402 -> 5); ONE enable word `0xd09054` for all six Rath monsters -- em 2 side dev/em002-effects-spec.md, em 1 side dev/em001-effects-spec.md |')
s = s.replace(hdr, hdr + row + nl)

# 3. a section before 1b
anchor = '## 1b. The decode notes'
assert s.count(anchor) == 1, '1b anchor'
sec = [
    '### Rathalos / Silver / Dreadking -- the PSL enable word, em 2 side (research agent for the Viewer agent, 2026-10-16; dev/em002-effects-spec.md)',
    '',
    'The method\'s addresses are in the section above ("Rathian / Gold / Dreadqueen -- the PSL enable word"; read twice, independently, the same). Only what is em 2\'s:',
    '',
    '| addr | what | class | st | detail |',
    '|---|---|---|---|---|',
    '| main.rodata / `0x50aa8` (table `0x1594ca4`) | **no uEm002_00 class**: ids 1, 0x201, 0x401, 2, 0x202, 0x402 -> descriptors 0..5, all on uEm001_00 vtable `0x1793c28`; split by em `e+0xb5f4`, variant `e+0xb5f5`, id `e+0xb5f0` | uEm001_00 | R (string census, control uEm001_00 / uEm003_00) | em002 spec 0 |',
    '| `0xd09054` for em 2 | transcription `em002(silver, v4)` vs ROM (`<scratchpad>\\rath2\\emu13c_r.py` / `jscheck_r.py`; controls Deviljho / Garuga / Deadeye reproduced; checker negative control 32 mismatches) 14976 runs, 0 mismatches: L2 M3 / M4 15-17 / 18-20 (Dreadking: L7 >= 2 or quest no. <= 5) / 21-23 severed; L2 M1 24-26 Silver only, not tired; L4 M32 27-29; L4 M38 (7, 0xf5) clear 6-12 set 30-31; L0 M16 / M17 18-19 | em002_00 / 02 / 04 | R (emulated) | em002 spec 1 |',
    '| `0xcf2a14..0xcf2a98` (part driver `0xcf253c`, tail set) | variant != 4: severed -> set 12 else 11; Rathalos / Silver draw part 8 on set 12 only -> **SHELL_TAIL `em002_00` / `em002_02` `{ severed: 8 }` MISSING** in motion-states.js (their word reads the tail intact forever without it); Dreadking 13 / 12 / 11 as the existing `{ severed: 8, broken: 13, level: 2 }` | uEm001_00 | R (re-read) | em002 spec 1 |',
    '| em002_04 `.dtp` array A (file +0x4d) | row 4 = `07 02 02 00`: A[0x11] = A[0x12] = 2 (part 7) -- Dreadking\'s L2 M3 / M4 18-20 threshold; em002_00 / 02 have 4 rows (variant != 4: never read) | em002_04 | R (data) | em002 spec 1 |',
    '| their PSLs vs the word | 42 out-of-mask each: always 5, by state 26, L2 M3 / M4 5, L2 M1 2, L4 M32 1, L0 M16 / M17 3 (no record). Export R u 502 / 503 / 510; Silver u 290 / 291 / 502 / 503 / 510; Dreadking u 502 / 503 / 510 / 522 / 523. R / DK u 290 / 291 never enabled. In-mask gated: L2 M4 b21 u 511 (severed), L4 M22 / M29 / M48 groups, Silver / DK L4 M38 (b30 / 31 u 600 / 602 only on (7, 0xf5): DK\'s exported, Silver none) | em002_0X | R | em002 spec 2 |',
    '| L4 M32 / L4 M38 plays | actions from rathian-variants-scratch actions2 / actions3 `em002_0X` (theirs): L4 M32 (2, 4..6), (7, 3 / 0x29 / 0x2b / 0x2c / 0x35..0x38 / 0x48 / 0x49), (9, 3 / 4); L4 M38 (7, 0x43 / 0x45 / 0x46 / 0xf5), (7, 0x70)@f70, absent on Rathalos. The viewer\'s shell picks supply them (index.html takes `ri.variant` first) -> no CLIP_ACTIONS; **Silver\'s picks omit (7, 0xf5)** (who issues it for him: NR) | em002_0X | R (sweep, theirs) / R (code path) | em002 spec 3 |',
    '',
]
s = s.replace(anchor, nl.join(sec) + nl + anchor, 1)

# 4. the in-repo note index (1c), after the em001 spec row if present
idx = [x for x in s.split(nl) if x.startswith('| `em001-effects-spec.md` |')]
if len(idx) == 1:
    r = ('| `em002-effects-spec.md` | Rathalos / Silver / Dreadking effects spec: no uEm002_00 (Rathian\'s class); the enable word `0xd09054`\'s em-2 transcription '
         '(L2 M3 / M4 sever / Dreadking break / quest no.; L2 M1 Silver only; L4 M32 em 2; L4 M38 (7, 0xf5); L0 M16 / M17), SHELL_TAIL part 8 for R / Silver, '
         'questLevel into pslMask, no CLIP_ACTIONS (shell picks), records to export | 2026-10-16 | 15 KB |')
    s = s.replace(idx[0], idx[0] + nl + r, 1)
else:
    print('note index row not added (anchor count %d)' % len(idx))
open(P, 'w', encoding='utf-8', newline='').write(s)
print('patched')

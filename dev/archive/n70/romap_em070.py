# Patch dev/rom-map.md in place: the Nerscylla part-13 section, a Withdrawn row, a 1c note-index row.
# Anchors are text, re-read at run time (other agents edit the file).
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
if 'em070-part50-spec.md' in s:
    sys.exit('already patched')

SECTION = [
    '### Nerscylla (em070_00) -- the part pass, part 13 on the jaw motions (research agent for the Viewer agent, 2026-10-17; dev/em070-part50-spec.md)',
    '',
    '| addr | what | class | st | detail |',
    '|---|---|---|---|---|',
    '| `0xf9bd10` (vt+0x210, `..0xf9bfc8`, pool to `0xf9bfdc`) | the part pass, ALL 11 `setVisibleGroup` of the band: set 0; **set 4 (part 50 off) always -- set 3 applied nowhere**; rage `0x81670 == 1` -> **2** (parts 1 / 12 on) else 1 (`cmp r0,#1`, `0xf9bd34`); Back (part 1 vs `.dtp +0x64` bytes 5/6 then 1/2: 9/10 + 12, or 11 + 13), Claws (part 4, bytes 13/14: 14 / 15), Legs (part 2, bytes 9/10: 5 + 7 / 6 + 8); then the motion test; then the `"anger"` material once when enraged (latch `[e+0xcac0]+0xb4`) | uEm070_00 | R | spec §1 |',
    '| `0xf9becc..0xf9bf18`, `0xf9bfc0` | **set 16 (part 13 on) while `e+0x4b4` (`0xb0944`) is `0x206 / 0x207 / 0x20a / 0x21a` (k = m - 0x206 in mask `0x100013`), `0x254 / 0x255` or `0x422` = L2 M6 / M7 / M10 / M26 / M84 / M85, L4 M34; else set 17** -- the whole motion, no action / frame / state term | uEm070_00 | R | spec §1, §3; motion-states.js MOTION_STATES.em070_00 (to add) |',
    '| part 13 (glb Group[13]) | 362 v on joints 130 / 131 / 132 / 133 (eye / body / add materials): the jaws those seven motions stretch (130_s z-scale 0.5 -> 5..9.7; rest elsewhere; L0 M16 / M17 0.94 but not in the set). The panel\'s "Web" was a guess | em070_00 | R (model) / I (meaning) | spec §2 |',
    '| `0xf9bfe0` (vt+0x208, `..0xf9c084`) | after `0xf9c088` / `0xf9c174`: the SAME seven motions set `[[e+0x1428]+0x5cfc]` bit 0, others clear it, **L3 M25 (`0x319`) leaves it** (`popeq`). No reader found: every `movw #0x5cfc` in the binary (his 3 + shared `0x6e704` / `0xb9e04`, both zeroing), vt+0x1c8 = base `0x6be3c` (0), no `add #0x5c00..0x5cfc` base (controls: Tigrex `0xe3460c` / `0xe205f8`; `add #0x5b00` / `#0x1400` found) | uEm070_00 | R (writes) / I (no consumer; indirect pointers not excluded) | spec §4 |',
    '| `0x6f4e8` -> `0x6f578` | the ONLY shared `bl 0x72c78` in the binary (caller `0xae35c`): the eye set `e+0xb610 / b614 / b618`; Nerscylla never calls `0x71398` (control: uEm001_00 `0xcecfc4` etc. found) and has no `#0xb610..0xb61c` -> -1 -> `0x72c84` returns: no lid | shared / uEm070_00 | R | spec §1.1 |',
    '| (7, 1) / (7, 0x3e) / (7, 0xc) [f60] -> L2 M6; (7, 0x1e) M7; (7, 2) M10; (7, 0x3a) M26; (7, 0x3f) M84 (`0xfa9108`) -> M85 (`0xfa9168`, phase `P+0x1a1` 1 on `0x78b78(e,0,0x40)`); (7, 0x3b) / (6, 2) / (12, 0) -> L4 M34 | the actions playing the seven (probe.py first setMotion + static setMotion0 sites) -- every play has part 13 on, so no CLIP_ACTIONS / CLIP_VARIANTS | uEm070_00 | R | spec §3 |',
    '',
]
WITHDRAWN = ('| render/monster.js ROM_RAGE_SET `em070_00: [[2, 1]]` "confirmed at 0xf9bd30" (rows `[calmSet, rageSet]`) and its header\'s '
             '"the polarity is a property of the code SHAPE, identical at every site" (**2026-09-10**) | Nerscylla\'s site compares against **#1**: '
             '`bl 0x81670; cmp r0,#1; movne r1,#1; moveq r1,#2` (`0xf9bd30..0xf9bd44`) -- enraged takes set **2** | ROM row **`[[1, 2]]`**: enraged = set 2 '
             '(parts 1 / 12, the `XfB__m01_add` layer, on), calm = set 1 (research agent, 2026-10-17; dev/em070-part50-spec.md §5). part-review\'s `none|1,12` '
             'rage row already shows the ROM\'s polarity |')
INDEX = ('| `em070-part50-spec.md` | Nerscylla: the part a bite turns on is PART 13 (the jaws, joints 130-133), not 50: the part pass `0xf9bd10` draws set 16 '
         'on L2 M6 / M7 / M10 / M26 / M84 / M85 / L4 M34, set 17 otherwise; part 50 off every frame; vt+0x208\'s `P+0x5cfc` bit 0 (no reader); the rage pair '
         'backwards in ROM_RAGE_SET; MOTION_STATES rows + part-review default | 2026-10-17 | 10 KB |')

lines = s.split(nl)
# 1. the section, before '## 1b.'
i1b = next(i for i, l in enumerate(lines) if l.startswith('## 1b.'))
lines[i1b:i1b] = SECTION
# 2. the Withdrawn row: end of the table after '### Withdrawn'
iw = next(i for i, l in enumerate(lines) if l.startswith('### Withdrawn'))
j = iw + 1
while not lines[j].startswith('|'): j += 1
while j < len(lines) and lines[j].startswith('|'): j += 1
lines.insert(j, WITHDRAWN)
# 3. the 1c index row: end of the table after '## 1c.'
ic = next(i for i, l in enumerate(lines) if l.startswith('## 1c.'))
j = ic + 1
while not lines[j].startswith('|'): j += 1
while j < len(lines) and lines[j].startswith('|'): j += 1
lines.insert(j, INDEX)
io.open(P, 'w', encoding='utf-8', newline='').write(nl.join(lines))
print('patched: section before line', i1b + 1, '; withdrawn row; index row')

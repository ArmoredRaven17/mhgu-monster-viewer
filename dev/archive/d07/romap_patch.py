# Patch dev/rom-map.md in place (shared file: read fresh, anchor on unique strings, refuse on any ambiguity).
import io, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = io.open(P, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'

def once(hay, needle):
    n = hay.count(needle)
    if n != 1:
        sys.exit('anchor count %d: %r' % (n, needle[:80]))
    return hay.index(needle)

# 1. the per-class row for uEm007_00
old = '| uEm007_00 (Diablos, Bloodbath) | `0x17994cc` | `0xd4532c` | R, transcribed (em007_04) | psl-mask.js |'
new = ('| uEm007_00 (Diablos, Bloodbath) | `0x17994cc` | `0xd4532c` | R, transcribed (em007_04); **variant-0 side READ '
       '2026-10-16** (research agent, emulated 76032 runs 0 mismatches): ONE variant test, `0xd454b4` (L2 M22 (7, 0x67) bit 21 '
       'Bloodbath only) -- Diablos = Bloodbath\'s word minus that bit; em007_00 not yet in psl-mask.js | psl-mask.js; '
       'dev/em007_00-effects-spec.md |')
once(s, old)
s = s.replace(old, new)

# 2. the new address section, before "## 1b."
sec = [
'### Diablos (em007_00) -- the PSL enable word\'s variant-0 side, his tail input, his command-table repertoire (research agent for the Viewer agent, 2026-10-16; dev/em007_00-effects-spec.md)',
'',
'| addr | what | class | st | detail |',
'|---|---|---|---|---|',
'| `0xd454b4..0xd454c0` (in vt+0x13c `0xd4532c`) | **the word\'s ONE variant test**: L2 M22 (7, 0x67) -> `ldrb [e+0xb5f5]` `cmp #4` `popne` -- every variant but 4 returns with the tail bits only, Bloodbath ORs bit 21. No other `#0xb5f5` in `0xd4532c..0xd45524` or its callees `0xca170` / `0x81670` / `0x81614` / `0xa3bf4` / `0x7fed4` / `0x6fe88` (all read whole; control: the scan finds `0xd454b4`). Writeback base `0xd45360` = &e+0x13f4 only. **Diablos\'s word = em007_04\'s minus bit 21 on L2 M22**; JS `em007_00` vs ROM (`emu13c_bw.py`, vtable `0x17994cc`) 76032 runs at variants 0/4/1/2/3/5, 0 mismatches (v4 = the shipped em007_04) | uEm007_00 | R (emulated) | spec §1 |',
'| `0xd36e64..0xd36e70` (vt+0x210 `0xd36e50`) | Diablos\'s variant byte is **0**: the part pass runs his half `0xd36e74` only on `cmp #0` (4 -> Bloodbath `0xd36ea8`, else return) | uEm007_00 | R | spec §1; states-em007_00.md §2 |',
'| `0xd36f44..0xd36f64` | Diablos\'s sever set: vt+0x370(e, 1) == 1 -> **set 10** (`moveq r1,#0xa`), else 9; monsters.json em007_00 groups[10] = {4 on, 101 off}, the only set drawing group 4 -> **`SHELL_TAIL.em007_00 = { severed: 4 }` -- MISSING in motion-states.js** (his word reads the tail intact forever without it) | uEm007_00 | R | spec §1 |',
'| `0xd39474..0xd39560` / `0xd39c94..0xd39cac` / `0xd3b958..0xd3b970` / `0xd3ba7c..0xd3baa0` / `0xd3c4f8..0xd3c510` | the L0 M5 / L0 M7 plays at variant 0 with the posture set first (`0xbc7f4`): L0 M5 posture 0 (2, 0/4/9/0xd/0xe/0xf/0x10/0x17/0x18), posture 4 (6, 2); L0 M7 posture 0 (2, 6/7/8/0xc/0x1a), posture 4 (6, 3) the burrow + `0xd3c4a0` (action NR). No `#0xb5f5` between entry and setMotion in any. actprobe7 status-7 first motions identical v0 / v4 (138 numbers) | uEm007_00 | R (probe + read) | spec §1 |',
'| `em007_00_cmdtbl.emc` (both arcs, one md5 `bb385e7e...`) | the shared table splits by **op 0x92** (variant): g0 s3 `92 01 00 \\| 20 04 \\| 92 02 \\| 20 17` -> variant 0 g0 s4, else g0 s23 (-> s24 / s25 / s26). Walk (op 0x92 evaluated, op 0x14 = call g1 sN, op 0x20 = jump g0 sN, other conditions both ways): **v0 78 streams / 85 actions, v4 103 / 132**; v0 issues **no (7, 0xb4..0xb8)** (g1 s103, called only from g0 s26) and no (6, 2). Op 0x20 as a group-0 jump is **I** (from the data); which event-group-7 stream runs per variant **NR** | em007_00 / em007_04 | R (data, walk) / I (op 0x20) | spec §3 |',
'| his PSLs vs the word | 115 file-mask -> 134 whole; out-of-mask 19 = ON always 4 (u 380 L2 M15 b0, u 351 L2 M19 b0, **u 202** / **u 360** L2 M24 b0 / b1 -- export), posture-0 5 (c 0 / c 1 L0 M5 b24-25, c 2 / c 3 / c 30 L0 M7 b24-26), tail-on 1 (u 321 L2 M25 b15), death 1 (c 3000 L3 M20 b23), tail-cut no record 3 (c 60 / c 61 L0 M16 / M17), never 5 (u 910-912, no record); gated in-mask 10 (c 40 / u 320 / u 321 / c 21 / c 22 tail-on, c 42 L0 M2 / L2 M20 b18 tail-cut). L2 M22 b21 u 900 never on for him (exported as his sever `event`: the writer skips it) | em007_00 | R | spec §2 |',
'',
]
anchor = nl + '## 1b. The decode notes'
i = once(s, anchor)
s = s[:i] + nl + nl.join(sec) + s[i:]

# 3. the tooling row, at the end of the "## 2. Tooling" table (before the Lift roots heading)
anchor2 = nl + nl + '### Lift roots reported by the Armor Viewer agent'
j = once(s, anchor2)
tool = ('| `<scratchpad>\\d07\\issued_var2.py` (+ `issued_var.py`, `jscheck07.py`) (research agent, 2026-10-16) | every (status, n) an '
        'EMC table issues FOR ONE VARIANT: roots g0 s0 + groups 2..20, op 0x14 n -> g1 sN, op 0x20 n -> g0 sN, op 0x92 evaluated '
        'for the variant (nested), every other condition walked both ways. `jscheck07.py`: uEm007_00\'s word, JS vs ROM | '
        'em007 v4 reaches g0 s23..26 and g1 s103 (Bloodbath\'s (7, 0xb4..0xb8)), v0 does not; em007_04 JS = ROM at v4 '
        '(12672 runs) | op 0x20\'s meaning is INFERRED; op 0x6f / 0x02 / 0x0b ... not evaluated, so "issued" is an upper '
        'bound; `issued_var.py` (no op 0x20, all non-group-1 roots) over-reaches -- it reached Bloodbath\'s group-0 streams '
        'at variant 0 |')
s = s[:j] + nl + tool + s[j:]

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('patched', len(s))

# 4. the in-repo notes index (1c), after the em063_00 spec's row
s = io.open(P, encoding='utf-8', newline='').read()
k = once(s, '| `em063_00-effects-spec.md` |')
e = s.index(nl, k)
row = ('| `em007_00-effects-spec.md` | Diablos effects spec: the enable word `0xd4532c` variant-0 side (one variant test '
       '`0xd454b4`: no L2 M22 bit 21; otherwise Bloodbath\'s word), SHELL_TAIL part 4 (missing), CLIP_ACTIONS L0 M5 / M7 '
       'posture + L3 M20, the shared EMC table walked per variant (no (7, 0xb4..0xb8) for him), u 202 / u 360 to export '
       '| 2026-10-16 | 17 KB |')
s = s[:e] + nl + row + s[e:]
io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('index row added')

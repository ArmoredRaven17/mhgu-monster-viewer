import io
p=r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s=open(p,encoding='utf-8').read()
def once(a):
    assert s.count(a)==1, ('anchor count', s.count(a), a[:60])

SECTION = '''
### Bloodbath -- List 9 effects (research agent for the Viewer agent, 2026-10-08; dev/em007_04-list9-census.md)

Raven: "Look into Bloodbath's List 9 animation effects." 53 PSL bindings on L9 M4..M30: 36 running, 4 wrongly gated, 1 refusing (L9 M27), 11 missing (3 records unexported), 1 never enabled; 7 shell-carried records. No class request reaches List 9. Not yet transcribed (census only).

| addr | what | class | st | detail |
|---|---|---|---|---|
| `0xd4532c` (vt+0x13c) | the PSL enable word: `0xca170`, then EVERY motion `+0x13f4 \|= vt+0x370(e,1) ? 0x1c0000 : 0x38000` (bits 18-20 tail severed / 15-17 intact); L0 M5/M7 bits 24-26 if `[[e+0x1428]+0x1ba]==0`; L2 M15 / M19 / M22 (bit 21, variant 4, (7,0x67)) / M31 and **L9 M11** action arms; L3 M20 bit 22/23 by vt+0x3f4. Emulated (`emu13c.py`), identical | uEm007_00 | R | census §1.1 |
| `0x169bd20` (5 words) / `0x1592818` (4 words) | T1 for L2 M15, (7,0xb4..0xb8): bits 27 / 28-29 / 28-29 / 30-31 / 30-31; T2 for L2 M31 and **L9 M11**, (7,0xb5..0xb8): 28-29 / 28-29 / 30-31 / 30-31. Both arms then **clear bits 0-5** (bfc) | " | R | §1.1 |
| `0xa3bf4` (vt+0x370) | `([[e+0x1428]+0x3b4] & r1) != 0`; with r1 = 1 it is P+0x3b4 bit 0, which `0xc2274` (the sever) sets for option kind 1 (`e+0x8b94+slot*0x14f0`; kind 2 -> bit 1, 3 -> bit 3) = **tail severed** | shared | R | §1.1 |
| L9 PSL vs the word | out-of-mask, enabled: M9 b0 u 381, M10 b15 u 630 (intact) / b18 u 631 (severed), M11 b28 u 911 (7,0xb5) / b30 u 912 (7,0xb7), M14 b0 c 2, M19 b1 u 600, M22 b1 u 913, M25 b0 u 600, M30 b1 u 950 (em045_04_000); in-mask unexported M16 b0 u 904; enraged-only M16 b9/b10; never M11 b27 u 910 | em007_04 | R | §2, §4, §7 |
| control | 31 of the 35 named PSL bits >= 15 in all em007_04 PSLs are reached by an arm of `0xd4532c`; the 4 misses are u 910/911 on L2 M19, L2 M31, L9 M11 | " | R | §1.1 |
| `0xd44bf0` (7,0xc8) | five phases, table `0xd44c3c`: L9 M26 -> M27 -> M28 (`0xb0df4`) -> M29 -> **M30**; shell 0x71 mode 7 (u 300) at **L9 M30 f10** (gate `0xd44e20`, phase 4) | uEm007_00 | R | §1.3, §5 |
| `0xd41b48` (7,0x77/0x79/0x7a/0x7b) | L9 M10; three shell07 `0x72` spawns `0xd41de8/0xd41e94/0xd41f3c` at tune 24/25/26 = f128/132/134; modes from `0x169bc60` {0,1,2} intact / `0x169bc78` {3,4,5} severed (vt+0x370 at `0xd41d1c`), +6 when the arm's r1 == 0 -> u 0+u 1 / u 10+u 11. No variant test on the spawn | " | R | §5 |
| `0xd446dc` | shell 0x71 mode 5/6 spawner: r1 0 -> 5, 1 -> 6; callers `0xd4463c` ((7,0xa0)/(7,0xa1), L9 M22/M23) and `0xd449ac` ((7,0xa2)/(7,0xa3)) | " | R | §5 |
| `0xd421d8` | L9 M11 body (a 180-degree turn, `0x76dd0` f12-26), selector r1 0..8 from (7,0x6f/0x73/0x71/0x70/0x8d/0x8a/0x5a/0xb5/0xb7) | " | R | §1.3 |
| `0xa692a0` / `0xa6980c` | rotation between two unit directions; `0xa6980c` is its dot <= -0.999 (antiparallel) arm, never recorded = **L9 M27's refusal** (u 914). u 914 / u 912 are the only keys whose rows include em007_04_000's polyline row 22, and `0xa654a0` (-> `0xa692a0`) is called from the polyline layer: path INFERRED | effect runtime | R / I | §3 |
| em007_04_000 rows | per key (mask1 = payload +0x48): 900 `0x4` rows 0-6; 901 `0x2`; 910 `0x400`; 911 `0x800`; 912 `0x1000` (incl. poly 22); **913 `0x2000` = rows 12, 14 only, both MODEL**; 914 `0x4000` (incl. poly 22); UNIQUE 200 `0x1`. Only row 31 is mask2-gated (`w04 0xa2`) | data | R (gate rule: Row gate section) | §0 |
| trap | the 2026-09-20 "zero billboards on u 913" was read against `engdraw --proof`, which applies the wrong block words as masks; u 913's own mask1 selects two model rows, at every LOD rung | — | R | §0 |
'''
anchor = "\n\n## 1b. The decode notes"
once(anchor)
s = s.replace(anchor, "\n" + SECTION + anchor, 1)

WD_ANCHOR_START = '| "A RECORDING IS ONLY AS GOOD AS ITS ORDER OF CALLS"'
once(WD_ANCHOR_START)
i = s.index(WD_ANCHOR_START); j = s.index('\n', i)
WD = '''
| row "group-7 -> clip" (uEm007_00 section) and em007-shells-spec §2d: "`0xc8` -> **L9 M26** (mode 7)" (**EMC, 2026-09-30**) | the probe reports phase 0's clip; `0xd44bf0` is a five-phase machine (table `0xd44c3c`) and the mode-7 gate `0xd44e20` / submit `0xd44ee0` are in phase 4 | phase 4's motion is **L9 M30** (set at `0xd44dec`): mode 7 / u 300 spawns at **L9 M30 f10** (tune 124). Research agent, 2026-10-08, dev/em007_04-list9-census.md §8 |
| rows "`0xd3da74` `u 1034` requested: `0x7db70(enemy, 0, 0x40a, r6)`" and "`0xd421b4` `u 1016` requested (`0x3f8`)" (Part data section; em007_04-parts-read §4) | `0x7db70` arms a HIT record (row 48; `0x70f40` ids >= 1000 index `[unit+0x75d8]`); `0xd421b4`'s tail `b 0x7ded8` is `0x7db70` with r3 = 0 | 0x408 / 0x40a / 0x40c / 0x3f8 are hit ids, not effect ids; u 1016 / 1021 / 1034 are break records (`0xa442c` 999 + 5*part + level), so the parts-read "tension" dissolves. Census §8 |
| row "`0x72` Bloodbath only (`0xd41bb0` gate) ... modes from `[sl+4/0xc/0x14]` UNREAD" (uEm007_00 section) | `0xd41bb0`'s variant test picks the motion RATE (`[[e+0xcac0]+0x74]` or 1.0 into `0xb07b4` at `0xd41ff0`) | the shell07 spawns have no variant test; modes READ: tables `0x169bc60` / `0x169bc78` (+6 per arm). Census §5 |'''
s = s[:j] + WD + s[j:]

IDX_ANCHOR = "| `em081_04-effects-census.md` | Boltreaver's 124 effect records"
once(IDX_ANCHOR)
k = s.index(IDX_ANCHOR)
IDX = "| `em007_04-list9-census.md` | Bloodbath's List 9: 53 PSL bindings and 7 shell records; uEm007_00's enable word `0xd4532c` (tail bits, L9 M11 action bits); L9 M27's refusal; three rows withdrawn | 2026-10-08 | 20 KB |\n"
s = s[:k] + IDX + s[k:]

# markers on superseded rows
for old, new in [
  ("| `0x72` | Bloodbath only (`0xd41bb0` gate), **base07**, res `0x89c5`; modes from `[sl+4/0xc/0x14]` **UNREAD** | R | em007-shells-spec §2 |",
   "| `0x72` | Bloodbath only (`0xd41bb0` gate), **base07**, res `0x89c5`; modes from `[sl+4/0xc/0x14]` **UNREAD** | R | em007-shells-spec §2 -- **CORRECTED 2026-10-08 (Withdrawn): `0xd41bb0` is the rate, modes READ** |"),
  ("`0xa0`→L9 M22 / `0xa1`→L9 M23 (modes 5/6, the mirror pair); `0xc8`→L9 M26 (mode 7). Probed with `actprobe7.py`, horns control re-run | R | em007-shells-spec §2d |",
   "`0xa0`→L9 M22 / `0xa1`→L9 M23 (modes 5/6, the mirror pair); `0xc8`→L9 M26 (mode 7). Probed with `actprobe7.py`, horns control re-run | R | em007-shells-spec §2d -- **CORRECTED 2026-10-08 (Withdrawn): mode 7 spawns in `0xc8`'s phase 4, L9 M30 f10** |"),
]:
    once(old); s = s.replace(old, new)
for old in ["| `0xd3da74` | `u 1034` requested: `0x7db70(enemy, 0, 0x40a, r6)`.", "| `0xd421b4` | `u 1016` requested (`0x3f8`) |"]:
    once(old); s = s.replace(old, old.replace("requested", "requested [**WITHDRAWN 2026-10-08: a hit record, not an effect**]", 1))
open(p,'w',encoding='utf-8').write(s)
print('ok')

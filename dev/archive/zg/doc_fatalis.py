# The Fatalis-line gaps, Kushala's snow arm and the routed-step fix (2026-10-18): rom-map rows + spec lines, in place.
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
def patch(path, pairs):
    s = open(path, encoding='utf8', newline='').read()
    NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
    for a, b in pairs:
        a2, b2 = a.replace('\n', NL), b.replace('\n', NL)
        assert s.count(a2) == 1, (path, a[:80])
        s = s.replace(a2, b2)
    open(path, 'w', encoding='utf8', newline='').write(s)

ROWS = r"""### The Fatalis line's withheld shell records, Kushala's snow barrier, routed entries' step input (Fanged-Wyvern effects agent, 2026-10-18)

| address | what | class / monster | st | detail |
|---|---|---|---|---|
| shell `ef` records | **why they had never been recorded**: a shell's `(listId, uniqueId)` resolves in **UNIQUE** (rom-map `0x328ba0` row), and every Fatalis-line set was recorded from the clip exports -- the **SEQUENCE** records under the same keys (em013_00c 30 = SEQUENCE cm202_0xx vs UNIQUE **cm200_040**; em013_02u 100 / 200 / 201 = SEQUENCE vs UNIQUE em013_02_007 / 012 / 011; u 110 is UNIQUE only). Same key, different record, different efl | uEm013_00 | R (pel arrays) | rec_shellrec.py records the UNIQUE one |
| `0xa583c4` (`0xa5840c..0xa58428`) | per-particle step of `0xa582f0`'s live-list loop: a 9-way switch on `[gen+0x42] & 0xf`; arms 0 (`0xa58450` -> `0xa61a3c`) and 2 (`0xa58484` -> `0xa66320`) were recorded, **arm 1 `0xa5846c` -> `0xa66224`** only by cm200_040 (the dust). No writer of gen+0x42 in 0xa40000..0xb00000: a per-generator constant from the file | particle generator | R | lifted from add_em013_00_shellrec_c30 |
| `0xae9ce0..0xae9d38` | the unit's visibility tests on `[r4+0x50]`: bit 24 -> the sphere test `0x881d94` (scale x [r0+0xfc]); **bit 25 -> the second test at `0xae9d38`** (reached by em013_02_007, Old's lightning strike u 100 / 110) | effect draw | R (test) / lifted | add_em013_02_shellrec_u100 / u110 |
| `0xcacd5c..0xcace4c` | `[r1+0x10] & 3` == 0, then `max(1.0, s8, s6, s4)` of `[r2+0x80..0x8c]` > 1.0 -> the arm at `0xcace4c` (scale above 1). Reached by Old's fireball u 200 / 201 only with the clip's u 202 / 601 running: recorded in ONE schedule (vecdrawsched, four starts) | effect draw | R (test) / lifted | add_em013_02_shellrec_u200_with202_601; which of r2's owners (shared batch or slot) carries the scale: I |
| Kushala vt+0x208 `0xdeffc4` (snow) | ctl+0x2d (the snow maps) set: ids **1004 u 210 calm / 1005 u 220 enraged** (em024_00_100) in place of 1006 / 1007 (u 230 / 240) | uEm024_00 | R (the earlier read) | CLASS_TIMERS.em024_00 `c.snowMap`; em024_00u 210 exported (UNIQUE #22, event, stop) |
| viewer: index.html `motionStates.step` user input | the two ROUTED calls (a combined entry's whole clip, a Snow Variants / multi-piece entry) passed only rage / level / tired: class bytes, Boulder, the play's action and the snow map never reached the class timers there. One `userIn` for all three calls now | viewer | fixed | elders check: Kushala's snow hold on a Snow Variants entry |

"""
patch(V + r'\dev\rom-map.md', [("## 1b.", ROWS + "## 1b.")])
patch(V + r'\dev\elder-dragon-shells-spec.md', [
 ("- **Withheld from the exports (the effects runtime refuses them -- a lift is the effects lane's)**: em013_00c u30 (the dust:",
  "- **[BACK IN 2026-10-18 (effects lane): recorded as the UNIQUE records the shells start -- rec_shellrec.py; Old's fireball also\n"
  "  in one schedule with u 202 / 601 -- and lifted; 0xa5846c is [gen+0x42] & 0xf == 1, 0xae9d38 the unit's flag bit 25 test,\n"
  "  0xcace4c a scale above 1.0 (rom-map \"The Fatalis line's withheld shell records\"). Exported (export_plain), checks and soaks\n"
  "  clean -- the paragraph below is the gap as it stood]**\n"
  "- **Withheld from the exports (the effects runtime refuses them -- a lift is the effects lane's)**: em013_00c u30 (the dust:")])
patch(V + r'\dev\em024_00-effects-spec.md', [])
s = open(V + r'\dev\em024_00-effects-spec.md', encoding='utf8', newline='').read()
NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
open(V + r'\dev\em024_00-effects-spec.md', 'w', encoding='utf8', newline='').write(s.rstrip() + (NL + NL +
 "## 7. The snow barrier (2026-10-18)" + NL + NL +
 "On the snow maps (ctl+0x2d set) vt+0x208 holds id 1004 = u 210 calm / 1005 = u 220 enraged (em024_00_100) in place of u 230 / u 240. "
 "The viewer's snow input is the Snow Variants list (snowNow); CLASS_TIMERS.em024_00 reads c.snowMap. u 210 exported (UNIQUE #22, event, "
 "stop). The routed step calls now carry the same user input as the raw clip's (index.html userIn). dev/checks/elders.mjs: u 210 held on "
 "Snow Variants L2 Motion[7], back to u 230 off it." + NL))
print('ok')

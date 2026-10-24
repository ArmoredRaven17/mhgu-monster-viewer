# doc_patch4.py: Chameleos's cloak -- the three unread places closed, the both-broken search, On's look, restores (2026-10-22)
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
p = D + '\\rom-map.md'
s = open(p, encoding='utf8').read()
anchor = '| THE INVISIBLE CONTROL, Off / On, breaks live -- built 2026-10-22 |'
i = s.index(anchor); j = s.index('\n', i) + 1
rows = """| `0x82770` (the EMC walk start, mode != 2) `0x82798..0x827d8` -- group 13's starter | **e+0x758c > 0.0 and the table has group 13 -> +0x72fc = 13 (stream 0)** (before group 8: P+0x59c / P+0x5a4 > 0, `0x8282c`; group 14: status 0x10, `0x82868`). e+0x758c = 1200.0 by `0xb1a30` (from the action issue `0x75b30` and the area carry-over `0xcc740` / `0xccb10`: saved byte +0x47 / +0x66 == 1), zeroed by `0x757f4`, the damage step (`0x98f78` / `0x99064` / `0x990a0` / `0x994dc`), `0xa05b4..0xa0624`, `0xa53c0`, `0xb9884`, `0xcc748` / `0xccb18`; it is a 1200-frame timer (I: the leave-area urge -- his g13 s0 picks (1, 0x16) / (1, 0x17)). No break read on this path | shared | R (the start) / I (the timer's name) | spec 8.6 |
| vt+0x2f8 `0xe0204c` -> `0xe020ec` -- the status-7 cloaks' issuer | **a damage accumulator**: ctl+0x4c += the hit's value; refused while (1, 0x16) / (1, 0x17) run (`0x6fe88`), the latch e+0x73f0 or e+0x7420 == 0; at ctl+0x4c >= ctl+0x50 (the threshold, raised per use, table `0xe02350`, capped 9999): **(7, 0xf)**, or (7, 0x11) / (7, 0x26) by `0x81670` (`0xe02378..0xe023a8`, a follow) -> `0xe0a098` -> its phase-7 cloak at L2 M30 (`0xe0a910`, area-gated, horn pick). (7, 0x2a) is that body's own follow (`0xe0a7a8`). No break read | uEm025_00 | R | spec 8.6 |
| vt+0x3cc `0xe0de9c` -- the caller | **none for an enemy**: every `ldr rX, [rY, #0x3cc]` followed by `blx / bx rX` in main.text -- 2 sites, `0xe4a60` (fn `0xe44ac`) and `0xe55d0` (fn `0xe51a8`), both on an object whose vt+0x1b8 is asked skill masks (0x8000000 / 0x10000000): the hunter's class, not an enemy; no `ldr pc` form. Control: the same scan counts the 15 vt+0x370 loads in his band | uEm025_00 | R (negative, with control) | -- |
| (1, 0x11) / (2, 0x14) -- issuers | **none found**: no op `00` in his table; no (1, 0x11) / (2, 0x14) immediate before an action-change call (0x768c8 / 0x75230 / 0x76098 / 0x7699c / 0x76a40 / 0x754b8 / 0x769f4 / 0x76dd0) in his band or the shared 0x60000..0xd0000 (control: the same scan finds his (13, 0) at `0xe0279c` and the follows listed in the census); no follow in cloakcensus.py. Their setters exist (0xe03b70 r1 1, 0xe06a0c) | uEm025_00 | R (negative) / NR (a computed issue) | -- |
| the shared EMC on the breaks | 0x7c000..0x92000 (the walker, the op handlers, the selector glue): no P+0x3b4 load and no vt+0x370 call (the only #0x370 operands are vldr of the HP P+0x370: `0x816fc`, `0x81aac`, `0x81b68`, `0x85838`); the break reads reach the AI only through his vt+0x214 selectors 0 and 2 | shared | R (negative, the HP loads its control) | -- |
| THE CLOAK ENTRIES WITH BOTH BROKEN (the answer) | **(1, 3)** (g0 s18): REFUSED -- selector 0 is 0 once the horn is broken (`0xe01bbc..0xe01c34`: vt+0x370(e, 2) -> r5 0), the default `14 30` runs instead; **(1, 0x16)** (g13 s0 under the leave timer): REACHABLE -- no break read; cloakcensus.py with both broken reaches `0xe0496c` (+0x13 1); **(7, 0xf / 0x11 / 0x26)** (vt+0x2f8's damage threshold): REACHABLE -- cloakcensus.py with both broken and the gate answered 1 reaches `0xe0a910` (+0x13 1); **(1, 0x11) / (2, 0x14)**: no issuer; **the demo (13, 0)**: full, the opening only; **vt+0x3cc**: no caller. **So no instruction refuses a cloak for the pair: with both broken he still cloaks, semi** -- against Raven's "both broken would prevent him from going invisible at all" | uEm025_00 | R + ROM-RUN | spec 8.6 |
| THE INVISIBLE CONTROL -- 2026-10-22 second pass (viewer) | On's look with the horn intact = the command table's (1, 3) cloak: **+0x17 = 1, the FADE** (alpha 1 -> 0 over 30, `0xe01a14`; stealth materials at f30); horn broken = semi. **Restores** (viewer only: the game never repairs a part) mirror the breaks: any horn / tail change while cloaked ends the cloak and the next one starts at the new level. **The 90-frame re-cloak wait is a STAND-IN** (the game's re-cloak timing is not read; an open choice for Raven). The live update needed no listener: stepCloak025 reads the part state every frame -- the earlier gap was its break-only test. Teostra / Kushala / Kirin's horn rules (motion-states hornBroken) are per-step reads of the part state: restores already work there. Draw meter chmeter2.mjs 10 / 10; elders 403 / 0 | viewer | built | spec 8.6 |
"""
s = s[:j] + rows + s[j:]
open(p, 'w', encoding='utf8').write(s)

p = D + '\\em025_00-effects-spec.md'
s = open(p, encoding='utf8').read()
a = "## Open items read (2026-10-19)"
assert s.count(a) == 1
b = """### 8.7 Every cloak entry, and the breaks (2026-10-22, second pass)

The rows are in rom-map "Chameleos's invisibility levels" (the entries table, the issuers, the shared EMC).

* **The entries, and what the breaks do to each** (both broken in the last column):

  | entry | who starts it | level | timing | gate | both broken |
  |---|---|---|---|---|---|
  | (1, 3) | the command table, g0 s18 | horn: full (FADE, +0x17 1) / semi | AI choice | area gate + selector 0 = horn intact | **refused** (selector 0 = 0) |
  | (1, 0x16) | g13 s0; group 13 runs while e+0x758c > 0 (a 1200-frame timer, I: leave the area) | always semi | the timer | none read | **reachable** (census) |
  | (7, 0xf / 0x11 / 0x26), (7, 0x2a) | vt+0x2f8: accumulated damage >= a threshold | horn: full (cut) / semi | the threshold | area gate | **reachable** (census) |
  | (1, 0x11), (2, 0x14) | no issuer found | horn | -- | area gate | -- |
  | (13, 0) | the demo | always full | opening | -- | demo only |
  | vt+0x3cc | no caller | always full | -- | -- | -- |

* **A break or a sever while cloaked** ends the cloak (8.6). **The tail** never sets a level and never gates an entry; its only AI
  read (selector 2) picks between two cloaked walks.
* **Against Raven.** "One break -- no full invisibility": the HORN (the setters go semi; (1, 3) is refused). "Both broken -- no
  invisibility at all": **no instruction found**; with both broken (1, 0x16) and the status-7 cloaks still start, semi. The places
  searched: every cloak entry and its issuer (above), the shared EMC (no break read), his selectors (only 0 and 2 read breaks), every
  break read in his band. Still unread: the issuers of (1, 0x11) / (2, 0x14) (no immediate anywhere: a computed issue?).
* **Built (viewer).** Off / On. On: the horn intact -> the (1, 3) fade; broken -> semi. A horn or tail break -- or a RESTORE, which the
  game never does (the viewer mirrors the break) -- while cloaked ends the cloak; the next starts 90 frames later at the new level.
  **The 90 frames are a stand-in.** Draw meter (chmeter2.mjs, 10 / 10): On -> horn -> tail: full, uncloak, semi, uncloak, semi;
  On -> tail -> horn: full, uncloak, full, uncloak, semi; On -> horn -> horn restored: full, uncloak, semi, uncloak, full; On -> tail
  -> tail restored: full, uncloak, full, uncloak, full; both broken, On, restore the horn, the tail: semi, uncloak, full, uncloak,
  full; set before On: none fade -> full, horn semi, tail fade -> full, both semi. Elders 403 / 0.
* **Open choices for Raven** (the ROM gives several; the viewer has one control):
  - the look with the horn intact: the (1, 3) fade (built), the status-7 cut, or both;
  - the (1, 0x16) always-semi leave-area cloak: shown or not (it ignores the horn);
  - the re-cloak wait after a break (90 frames now, a stand-in: the game's timing depends on the AI, the leave timer or the damage
    threshold);
  - both broken: semi (the ROM as read) or not cloaked (his description, no instruction found).

## Open items read (2026-10-19)"""
s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s)
print('ok')

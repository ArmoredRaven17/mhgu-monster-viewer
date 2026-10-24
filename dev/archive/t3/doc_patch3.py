# doc_patch3.py: Chameleos's cloak vs the breaks (2026-10-22) -- dev/rom-map.md (the section's rows upgraded in place, new rows, the
# Withdrawn entry) and dev/em025_00-effects-spec.md 8.6. Patches in place.
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev'
def patch(name, pairs, append_after=None):
    p = D + '\\' + name
    s = open(p, encoding='utf8').read()
    for a, b in pairs:
        assert s.count(a) == 1, (name, a[:90])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf8').write(s)
    return s

# ---- rom-map: the tail-sever row, upgraded in place; the built row; new rows after the built row ----
old_tail = """| `0xdffd1c` (vt+0x204, the tail sever (10, 0x72) arm) -- READ | after 0xc2274 (the sever): tail severed (vt+0x370(e, 1)) AND horn broken AND a cloak up (ctl+0xc) -> sound 0xcf (0x4ef0ac), ctl+0xc = 0, +0x15 = 0, +0x16 = 0: **the cloak ends**. The tail's only other cloak reader is the EMC condition vt+0x214 -> 0xe01e48 (0 not cloaked / area / dying; 2 tail intact; 1 tail severed with the horn intact (+ motion tests); 0 both broken): AI choice only | uEm025_00 | R | -- |"""
new_tail = """| `0xdffd1c` (vt+0x204, the tail sever (10, 0x72) arm) -- READ; **upgraded 2026-10-22** | after 0xc2274 (the sever): tail severed (vt+0x370(e, 1)) AND horn broken AND a cloak up (ctl+0xc) -> sound 0xcf, ctl+0xc = 0, +0x15 = 0, +0x16 = 0. **This test never sees a cloak**: vt+0x204's status-10 arm (`0xdff778..0xdff810`, row below) has already ended it at the start of (10, 0x72) (Withdrawn table). EMC selector 2 = vt+0x214 -> `0xe01e48`: 0 when not cloaked (ctl+0xc 0), in the area state, number 0x19..0x1d excepted (-> 2), status 3 / 0xb, or the motion tests; else 2 tail intact; 1 tail severed with the horn intact; 0 both broken. Its ONE consumer: cmdtbl g1 s15 (row below) | uEm025_00 | R | spec 8.6 |"""
old_built = """| THE INVISIBLE LEVELS -- built | CLASS_CONTROLS em025_00: Off / **On** (the horn's pick: intact full, broken semi) / **Semi-invisible** (the (1, 0x16) cloak) / **On (fading)** (the (1, 0x11) cloak); index.html stepCloak025"""
new_built = """| THE INVISIBLE LEVELS -- built (**superseded 2026-10-22: Off / On with live breaks, next rows**) | CLASS_CONTROLS em025_00: Off / **On** (the horn's pick: intact full, broken semi) / **Semi-invisible** (the (1, 0x16) cloak) / **On (fading)** (the (1, 0x11) cloak); index.html stepCloak025"""
s = patch('rom-map.md', [(old_tail, new_tail), (old_built, new_built)])
anchor = new_built
i = s.index(anchor); j = s.index('\n', i) + 1
rows = """| `0xdff778..0xdff810` (vt+0x204 0xdff4f0, the status-10 arm; also status 11 `0xdff84c..0xdff8e4` and (13, 0) `0xdff94c..0xdff9e4`) | at the START of every status-10 action (every reaction: the break flinch, the sever (10, 0x72), knockdowns): a cloak up -> sound 0xcf (phase 0: also P+0x5cfc bit 0), **ctl+0xc = 0, +0x15 = 0, +0x16 = 0, LATCH OR NOT**, then alpha 1 over 60 (0xbee74). The general arm `0xdff50c..0xdff5b0` ends it for every other action start only with the latch +0x16 = 0. ROM-RUN (`<scratchpad>/zg/cloak204.py`, vt+0x204 run for 24 (st, n) x latch x breaks): (10, 7 / 0x72 / 0x14 / 0x1e), (11, 0), (13, 0), (7, 0x10) -> ended; **control** (1, 0 / 5), (2, 3 / 6), (3, 0x19) with the latch -> kept, without -> ended | uEm025_00 | R + ROM-RUN | spec 8.6 |
| the latch ctl+0x16 | set (=1) ONLY by `0xe03cf4` -- the (1, 3) / (1, 0x11) cloak 0xe03b70, every frame of its phase 1 past the gate; cleared (=0) by the cloak's ends (31 sites, all `strbne r1(0)` beside +0xc = 0). So only that cloak survives the action starts after it; (1, 0x16), (2, 0x14), the status-7 L2 M30 one, the demo and vt+0x3cc's end at the next action start | uEm025_00 | R | spec 8.6 |
| ctl+0x13 (the level) writers -- all of them | `0xdff1c0` (the init), the setters `0xe03cdc` ((1, 3) / (1, 0x11), horn `0xe03cc4`), `0xe049b0` ((1, 0x16): 1), `0xe06b64` ((2, 0x14), horn `0xe06b4c`), **`0xe0a970` (a fourth setter: 0xe0a098's phase 7 after L2 M30 0x21e, reached by (7, 0xf / 0x11 / 0x26 / 0x2a) -- area-gated, horn `0xe0a958`, +0x17 = 0)**, `0xe0d630` (the demo (13, 0): **2 always**), `0xe0df08` (vt+0x3cc 0xe0de9c: **2 always**; no caller found), and `0xe01740` (vt+0x210's uncloak: 2 -> 0). **Nothing rewrites it mid-cloak**: vt+0x210 reads it once at phase 1 -> 2 (`0xe014dc`) and in the uncloak (`0xe01618` / `0xe01730`). The horn reads in vt+0x210 (`0xe014b0` / `0xe01984`) gate ctl+0x10, not the level | uEm025_00 | R | spec 8.6 |
| the break-state readers in uEm025_00's band (`<scratchpad>/t3/brk025.py`: every vt+0x370 call with its r1, every P+0x3b4 load) | horn (2): the setters above, sel 0 `0xe01bc4`, sel 2 `0xe01f48`, vt+0x210 `0xe014b0` / `0xe01984`, the part pass `0xe0120c`; tail (1): sel 2 `0xe01f28`, the sever arm `0xdffd24`, and three status-7 attack bodies `0xe0905c` / `0xe09340` / `0xe097f0` (motion choice, not the cloak); part 8: `0xe0b4e4`. **No cloak setter reads the tail** | uEm025_00 | R (census) | -- |
| cmdtbl `em025_00_cmdtbl.emc` -- the cloak in the AI | **g0 s18**: `6f 00 00 \\| 6f 01 01 \\| 00 01 03 \\| 00 01 1b \\| 00 01 04 \\| 6f 02 \\| 14 30`: selector 0 == 1 -> the (1, 3) cloak (then (1, 0x1b) / (1, 4)), else g1 s48 (status-3 moves). **Selector 0 (`0xe01b7c`) = the area gate AND the horn intact** (vt+0x370(e, 2) == 0): **the horn's break stops the AI's (1, 3) cloak here.** **g1 s49**: selector 0xa == 0 -> (1, 3) -- selector 0xa (`0xe01e2c`) returns 1 always: never taken. **g1 s15** (selector 2's one consumer): `00 02 07 \\| 6f 00 02 \\| 6f 01 02 \\| 00 02 06 \\| 6f 02 \\| 00 02 03`: tail intact (2) -> (2, 6), else (1 tail severed, 0 both broken) -> (2, 3); both are cloaked walks (L0 M6) that keep the latched cloak (ROM-RUN `cloakact.py`, control: (1, 3)'s +0x16 write captured) -- **the value 0 (both broken) is never told apart from 1**. **g13 s0**: selector 5 (the area gate alone) -> (1, 0x16) / (1, 0x17) either way: the always-semi cloak, **no break test**; group 13's starter NOT READ (rom-map "groups started by the shared selectors"). No op `00` issues (1, 0x11), (2, 0x14) or (7, 0xf / 0x11 / 0x26 / 0x2a); a follow census (`<scratchpad>/zg/cloakcensus.py`, every op-00 action, phases 0..7, follows 3) reaches none of them: their issuers NOT READ | em025_00 | R (bytes, selectors) + ROM-RUN | spec 8.6 |
| THE INVISIBLE CONTROL, Off / On, breaks live -- built 2026-10-22 | CLASS_CONTROLS em025_00 Off / On (Raven); index.html stepCloak025: On = the cloak at the horn's pick when it starts (intact full: model gone at f30; broken semi: stealth materials); a horn break or a tail sever while cloaked ENDS it on the frame the break applies (the status-10 arm), the uncloak plays, and with On still set the next cloak starts 90 frames on at the new level. Draw meter `<scratchpad>/chmeter2.mjs`: On -> horn -> tail: FULL, uncloak, SEMI, uncloak, SEMI; On -> tail -> horn: FULL, uncloak, FULL, uncloak, SEMI; before On: none FULL, horn SEMI, tail FULL, both SEMI. Working labels | viewer | built | elders 403 / 0 |
| tooling: `<scratchpad>/zg/cloak204.py`, `cloakact.py`, `cloakcensus.py` | vt+0x204 / an action main / the op-00 actions with follows on tracec's machine, a cloak poked in, the breaks P+0x3b4 and the area gate answered | controls: the latched status 1 / 2 / 3 starts keep the cloak; (1, 3)'s +0x16 write captured | **trap: tracec stubs every call outside the class band, vt+0x370 (0xa3bf4) included -- add it to TR.NATIVE or every break reads 0** (the first census showed the horn without effect) |
"""
s = s[:j] + rows + s[j:]
wa = '### Withdrawn — kept so they are not rediscovered\n\n| claim | why wrong | correction |\n|---|---|---|\n'
k = s.index(wa) + len(wa)
w = """| rom-map `0xdffd1c` row / em025_00 spec 9 / CLASS_CONTROLS em025_00 title (effects lane, 2026-10-22): "the tail ends a cloak only when it is severed while the horn is already broken (0xdffd1c)"; and the viewer's cut-off on that case alone | the sever is (10, 0x72): vt+0x204's status-10 arm `0xdff778..0xdff810` ends ANY cloak at that start, latch or not, before the 0x72 arm's test runs, so 0xdffd1c's "a cloak up" never holds; every other break flinch (status 10) ends it the same way | a break or sever while cloaked ends the cloak whatever the other part (ROM-RUN cloak204.py); the next cloak takes the horn's pick (spec 8.6) |
"""
s = s[:k] + w + s[k:]
open(D + '\\rom-map.md', 'w', encoding='utf8').write(s)

# ---- spec 8.6 ----
p = D + '\\em025_00-effects-spec.md'
s = open(p, encoding='utf8').read()
a = "## Open items read (2026-10-19)"
assert s.count(a) == 1
b = """### 8.6 The breaks and the cloak (2026-10-22; Raven: "one breaking caused him to no longer be able to go full invisible and that both broken would prevent him from going invisible at all"; Off / On with live breaks)

The rows are in rom-map "Chameleos's invisibility levels".

* **The level is the horn's, chosen when a cloak starts.** Every setter but two picks it from the horn (vt+0x370(e, 2), P+0x3b4
  bit 1): intact full (+0x13 = 2), broken semi (1). They are 0xe03b70 ((1, 3) / (1, 0x11)), 0xe06a0c ((2, 0x14)) and a fourth one
  found now, 0xe0a098's phase 7 after L2 M30 (status-7 attacks (7, 0xf / 0x11 / 0x26 / 0x2a)). (1, 0x16) is always semi; the demo
  (13, 0) and vt+0x3cc always full. **No setter reads the tail.** Nothing rewrites +0x13 while a cloak runs.
* **A break while cloaked ends the cloak.** A break or a sever starts his status-10 reaction, and vt+0x204's status-10 arm ends any
  cloak at that action's start, latch or not (0xdff778..0xdff810). ROM-RUN with a control: the latched cloak survives status 1 / 2 / 3
  starts. So the horn breaking does not turn a full cloak into a semi one live: the cloak ends, and the next one is semi. The tail
  sever ends it too, with the horn intact or broken (the earlier "only with the horn already broken" is withdrawn).
* **The AI.** The command table's cloak (g0 s18, (1, 3)) needs selector 0 = the area gate AND the horn intact: **once the horn is
  broken the AI no longer picks that cloak.** The tail's selector (2, 0xe01e48) is read only while cloaked, and its one consumer
  (g1 s15) picks between two cloaked walks; "both broken" (0) takes the same branch as "tail severed" (1). The always-semi (1, 0x16)
  is picked by g13 s0 with no break test.
* **Against Raven's description.**
  - "One break -- no full invisibility": **the horn** does it (every horn-picking setter goes semi, and the AI's (1, 3) cloak is no
    longer chosen). **The tail alone does not**: with only the tail severed every setter still gives the full cloak.
  - "Both broken -- no invisibility at all": **not found.** With both broken the setters give semi and nothing in the class code or
    the command table refuses a cloak for the pair. Still unread, so the place it may live: who starts group 13 (the (1, 0x16)
    cloak's stream) and who issues (1, 0x11), (2, 0x14) and (7, 0xf / 0x11 / 0x26 / 0x2a) -- no op 00 and no follow in the census
    reaches them. Raven's statement stands; the search has not found the mechanism.
* **Built.** The Invisible control is Off / On. On = the cloak at the horn's pick; a break or a sever while cloaked ends it on that
  frame (the uncloak plays), and with On still set the next cloak starts 90 frames later at the new level. Breaks set before On take
  effect at once. The (1, 0x16) always-semi and the (1, 0x11) fading look are no longer options. Note: the AI's command-table cloak
  (1, 3) is 0xe03b70, which sets +0x17 = 1 -- the FADING look (alpha 1 -> 0 over 30) with the horn intact; On draws 0xe06b04's cut
  (as asked). Draw meter (`<scratchpad>/chmeter2.mjs`): On -> horn -> tail: full, uncloak, semi, uncloak, semi; On -> tail -> horn:
  full, uncloak, full, uncloak, semi; set before On: none full, horn semi, tail full, both semi. Elders 403 / 0.

## Open items read (2026-10-19)"""
s = s.replace(a, b)
s = s.replace("""* **The horn** picks full or semi. **The tail** ends a cloak only when it is severed while the horn is already broken (0xdffd1c). No
  setter tests the tail, and its EMC condition is AI-only.""", """* **The horn** picks full or semi. **The tail** ends a cloak only when it is severed while the horn is already broken (0xdffd1c). No
  setter tests the tail, and its EMC condition is AI-only. **(Withdrawn 2026-10-22 in part: any break or sever while cloaked ends it,
  8.6.)**""")
open(p, 'w', encoding='utf8').write(s)
print('ok')

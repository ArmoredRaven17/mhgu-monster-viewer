# rom-map.md: the Flying / Brute / Bird Wyvern re-walk (2026-10-18). Patched in place; withdrawn entries marked, not deleted.
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
s = open(p, encoding='utf8', newline='').read()
NL = '\r\n' if s.count('\r\n') > s.count('\n') / 2 else '\n'
lines = s.split(NL)
def find(prefix, start=0):
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix) and i >= start]
    assert len(hits) >= 1, prefix
    return hits[0]
TAG = ' [**re-walk 2026-10-18 (Fanged-Wyvern effects agent)**: %s]'

# 1. rows corrected in place
i = find('| `0xe86430` (6, 3 / 6 / 0xe)')
lines[i] += TAG % ('the u 1400 is (6, 6) ONLY -- 0xe864f0..0xe86504 pass 0xa499c r1 = (caller r1 == 1) ? 2 : 0, so (6, 3) / (6, 0xe) ask u 1120; traced per action (reqtrace.py). Copies A / B / C, motion-states.js em044_00 L0 M6')
i = find('| " | `0xd3c748` | 1 | 1121 |')
lines[i] += TAG % ('not u 1400, but a REAL u 1121 request: (6, 0xf / 0x17 / 0x1c / 0x1d / 0x24 / 0x25 / 0x28 / 0x29 / 0x2b / 0x2c) on L0 M7 (reqtrace.py); now L0 M7 copy C, both variants')
i = find('| `em033_00` Akantor | `0xe3a5c8`')
lines[i] += TAG % ('"closes on the latch" is true of u 1400 only: the site asks u 1121 (cm200_007) on (6, 2 / 6 / 7 / 8) L0 M2 plays -- now L0 M2 copy B')
i = find('| uEm063_00 (Brachydios, Raging) | `0x17d92c4`')
lines[i] += TAG % ('the "ctl+0x2c / +0x20" arm rows are halfwords at **[e+0xcacc]** + 0x2c / + 0x20 (0xf469c8..0xf46a00), not ctl = [e+0xcac0]; re-emulated with the rows there: 657920 runs, 0 mismatches, 72 words')

# 2. withdrawn rows
i = find('| claim | why wrong | correction |', find('### Withdrawn'))
W = [
 "| motion-states.js em044_00 '0\\|Motion[6]' u 1400 held on every L0 M6 play; rom-map `0xe86430` row \"(6, 3/6/0xe) then u 1400\" | the level was read from the site's `b 0xa499c` and the caller's r1 assumed | 0xe86430 maps its r1: 1 -> level 2 (u 1400), else 0 (u 1120). (6, 6) u 1400, (6, 3) / (6, 0xe) u 1120, (2, 0) none -- copies A / B / C (re-walk 2026-10-18, reqtrace.py) |",
 "| motion-states.js rows holding u 1400 on EVERY play of Basarios L0 M7, Diablos / Bloodbath L0 M7 (posture 4), Deviljho / Savage L0 M6, Uragaan / Crystalbeard L0 M6, Duramboros L0 M6, Brachydios / Raging L0 M10 | the clip was taken for the request (the Seltas Queen trap, row 710 above, again) | reqtrace.py: only the burrows ask -- em004 (6, 3); em007 (6, 3 / 6 / 0x10 / 0x21..0x23 / 0x2a); em043 (6, 3); em045 (6, 3 / 6); em055 (6, 5 / 6); em063 (6, 2 / 3 / 6). Each is now copy B (CLIP_VARIANTS); copy A asks nothing (dev/checks/level-copies.mjs) |",
 "| rom-map u 1400 sweep: Diablos `0xd3c748` and Akantor `0xe3a5c8` \"not a u 1400 site\", closed | true for u 1400, and the request they DO make (u 1121) was never wired | Diablos / Bloodbath L0 M7 copy C holds u 1121 (10 status-6 actions), Akantor L0 M2 copy B holds u 1121 ((6, 2 / 6 / 7 / 8)); event twins of the puff records exported |",
 "| motion-states.js garugaLine note: Deadeye's vt+0x208 u 30 \"has no slot that means always, so it is named here\" | a named gap left on a walked monster | CLASS_TIMERS.em018_04 holds it, off while his eyelid set 2 is shown (0x81bb0(e, 0) / death) -- em018_04u 30 exported (event, stop) |",
 "| shells.js em002_02: (7, 0xf5) \"not listed\" for Silver Rathalos's L4 M38 (its shell00 has no mode 31) | the pick list is also the word's only action source for L4 M38; dropping it dropped the play | listed with no spawn: g1 s224 / s235 issue it in op 0x6f(0xe)'s default (vt+0x214 0xcf15c8 sel 0xe = [ctl+0x2c] >= 0.0, no variant test); the word then clears bits 6-12 (u 230 / 231 / 232 / 221 off) |",
]
lines[i + 2:i + 2] = W     # after the header and its rule

# 3. the section
j = find('## 1b.')
SEC = [
 "### Flying / Brute / Bird Wyverns -- the re-walk to today's standard (Fanged-Wyvern effects agent, 2026-10-18)",
 "",
 "Tracer diff (sweep2.py over all 42, `cmpactions.mjs`), the gates the forward diff hit, each answered with `deep.py` and the clip then played; the request census by action (`reqtrace.py`); the per-clip word diff (`wordclip.py`).",
 "",
 "| address | what | class / monster | st | detail |",
 "|---|---|---|---|---|",
 "| `0xe864f0..0xe86504` | `cmp r5,#1; moveq r1,#2; movne r1,#0; b 0xa499c` -- the burrow's level by its caller's r1 | uEm044_00 | R (traced (6, 3 / 6 / 0xe)) | motion-states.js em044_00 L0 M6 |",
 "| `0xd167a0..0xd167e8` | Khezu's landing: `0xbf52c` == 1 and [P+0x14] < 0 -> phase + 1, L2 M5; [P+0x14] is stored from the float getter `0xc1010` (+15.0 for (7, 0x57), 0xd16738) | uEm003_00 | R (deep.py HIT=1 PZ=-1 / -20) | CLIP_ACTIONS em003_00 L2 M4 / M5 / M39 confirmed |",
 "| `0xd188c4..0xd188dc` | (7, 0x12): `0xb0944` (the current motion) == 0x235 (L2 M53) -> L2 M39 `0xd18adc`, else the landing L2 M5 `0xd18864` | uEm003_00 | R (deep.py MOTNOW=0x235) | |",
 "| `0xd3d7a0..0xd3d808` | Bloodbath's 0xd3cd40 phase 1: `0x78b78` != 0 then the 20-way table `0xd3d810` (r5 - 1): r5 17 -> 0xd3dbe4, r5 20 -> 0xd3dc18 -> L2 M19 `0xd3dc34` | uEm007_00 v4 | R (deep.py FORCE=0x78b78=1; v0 the same arm) | CLIP_ACTIONS em007_04 L2 M19 (7, 0xb8) |",
 "| `0xe6c400..0xe6c448` | Barioth (7, 0x11): `0xbf4e4` != 0 (else [P+0x1bc] > the literal) -> phase + 1, r5 == 0 -> L2 M8 `0xe6c560` | uEm042_00 | R (deep.py FORCE=0xbf4e4=1) | CLIP_ACTIONS em042_00 L2 M8 |",
 "| `0xe95c3c..0xe95c88` | Uragaan's roll count: each L2 M2 end raises P+0x1a2; at >= 4 phase + 1 and L2 M3 | uEm045_00 | R (deep.py PB=0x1a2=4) | CLIP_ACTIONS EM045 L2 M3 (7, 2 / 4); (7, 0x90) reaches L2 M3 at phase 4 (`0xe990b0`) |",
 "| `0xd29648..0xd296b4` | Gravios's beam end `0xb03f8(e, 0x21e, r2 = 0x21f / 0x220)`: L2 M31 / M32 are the BLEND partner (r2), never r1 | uEm004_00 em 5 | R | trap 93 |",
 "| `0x169ee4c` | Duramboros's (6, 4) turn table: +0x10 L0 M15, +0x20 L0 M4, +0x30 L0 M3 (u16 words) | uEm055_00 | R (bytes; em055 spec row) | trap 94 |",
 "| `0xf469c8..0xf46a00` | Brachydios's arm rows: `ldrh [[e+0xcacc] + 0x2c]` / `+ 0x20` in {0, 3} -> 0x180000 / 0x600000 | uEm063_00 v0 | R (re-emulated, 0 mismatches) | psl-mask.js em063 |",
 "| `0xcf15c8` sel 0xe (`0xcf1828`) | the Rath line's op-0x6f callback, selector 0xe: [ctl+0x2c] (float) >= 0.0 -> 1, else 0; no em / variant test | uEm001_00 | R | g1 s224 / s235 issue (7, 0xf5) in its default (6f 02) |",
 "| `0xda52f8..0xda539c` | Deadeye's vt+0x208: variant 4; 0x81bb0(e, 0) or vt+0x3f4 -> stop e+0xcae0 (0x329c40(h, 0)); else none held -> vt+0x1d0(1001) = u 30 held | uEm018_00 v4 | R | CLASS_TIMERS.em018_04 |",
 "| `0x81bb0(e, 0)` | (P+0x5e08 & 1) \\|\\| P+0x522 -- the eyes-shut test (0xae3e8; posture-em003_00.md 14.1) | shared | R (re-read) | |",
 "| `0xe48820` / `0xe8d490` / `0xda538c` / `0xff0400` | the four group vt+0x1d0 sites outside the action main the map did not name: Nargacuga's part driver (vt+0x210) 1001 / 1002 by the head level (the trails), Barroth's mud shed vt+0x24c 1006, Deadeye's 1001 (above), Malfestio's frame handler -- all `ldr r0,[rB],r0` post-indexed (the vtable read, then rB += 0xb640) | uEm037 / 044 / 018 / 079 | R | covered by rows / CLASS_TIMERS (sitefn.py) |",
 "",
 "**Request census by action (reqtrace.py; Barroth (6, 6) r1 = 2 as the positive control).** Level requests: em004 / em005 (6, 3) L0 M7 u 1400 (em005_00u holds no 1400: nothing to show); em007_00 / 04 L0 M7 u 1400 x7 / u 1121 x10 actions; em033 L0 M2 u 1121 x4; em043 / 05 (6, 3) L0 M6; em044 (6, 3 / 0xe) u 1120, (6, 6) u 1400; em045 / 04 (6, 3 / 6) L0 M6; em055 (6, 5 / 6) L0 M6 ((6, 3) none); em063 / 05 (6, 2 / 3 / 6) L0 M10. Class ids: em004 / 005 (7, 5 / 7 / 0xa / 0xf / 0x10 / 0x15 / 0x3b / 0x3c) 1001..1008 (ACTION_EFFECTS; 0x3b / 0x3c issued by no stream); em007 (6, 0xe / 0x11 / 0x18) c 1001, (6, 0x1b / 0x26 / 0x27) c 1002, (6, 0x32) u 1002 (L0 M1 copies B / C / D; em007_00u has no UNIQUE 230); em045 (7, 2 / 4 / 0x90) u 1001 / 1003 / 1005. No action-main request in em001 / 002 / 003 / 008 / 009 / 014-016 / 032 / 034 / 037 / 038 / 042 / 077 / 079 / 080 / 081 / 085 (their sites are frame / part / break handlers, row above).",
 "",
]
lines[j:j] = SEC

# 4. tooling rows
t = find('| script | resolves | validated control | caveats |', find('## 2. Tooling'))
TOOLS = [
 "| `<scratchpad>\\zg\\deep.py` (Fanged-Wyvern effects agent, 2026-10-18) | one action under tracec.py over phases 0..9 x ended x frame {0, 1, 20, 40, 80, 160, 999}, with gates answered: HIT (0xbf52c), PZ (the float getter 0xc1010's s0), MOTNOW (0xb0944), FORCE=addr=v (any stub), PB=off=v (P bytes) | Khezu (7, 0) L2 M5 at phase 2 only with HIT + PZ < 0; control HIT=0 none | the gate values are the caller's; name each in the result |",
 "| `<scratchpad>\\zg\\cmpactions.mjs` | CLIP_ACTIONS vs sweep/r3_<mon>.jsonl: every entry's action must play its clip (setMotion, script, or a follow) | 20 forward mismatches found, each a gate deep.py then answered | blend partners (r2) and turn-table clips are not in the sweep (traps 93 / 94) |",
 "| `<scratchpad>\\zg\\wordclip.py` | per clip the tracer finds 2+ actions playing: the ROM word per action (calm / enraged, posture 0 / 4, depth 0 / -1000) masked to the clip's BOUND bits, against the plays CLIP_ACTIONS / picks can show | NOCA=1 (no CLIP_ACTIONS) flags Khezu L2 M10 / M39 | entries' `rage` / `tired` forms count as showable plays |",
 "| `<scratchpad>\\zg\\reqtrace.py` | per action, every 0xa499c (level) and vt+0x1d0 / +0x1cc call the action main makes, with r1 and the motion set at that moment | Barroth (6, 6) r1 = 2, (6, 3 / 0xe) r1 = 0 | a request made in a later phase of a fresh run shows motion L0 M0; frame / part handlers are not run (sitefn.py lists those sites) |",
 "| `<scratchpad>\\zg\\jscheckpd.py` (2026-10-18 additions) | + streamed chunks (bounded memory), DEPTHS, LV=parts / LVLS (part break levels against the monster's real .dtp +0x64 rows; Gravios's ctl+0x24 latch), AXIS=heat / mud / arms on the CHG axis, SEV with beardOff | em063 arms 0 mismatches with the rows at [e+0xcacc] (72 words); with them unset the same JS matched by accident | a list of 15M cases x 12 workers swapped the machine before streaming |",
 "| `<scratchpad>\\zg\\exp_rec.py` | merge-export one request record into docs/effects/<mon>.json (temp export, entries appended to the re-read file) | em018_04u 30 (UNIQUE #4, joint 3) | never regenerates the shared file |",
]
lines[t + 2:t + 2] = TOOLS

# 5. traps
k = max(i for i, l in enumerate(lines) if l.startswith('91. '))
TRAPS = [
 "92. **tracec.py's unanswered float getters leave s0 from the PREVIOUS run (2026-10-18).** Khezu's L2 M5 landing appeared or not by the order phases were run (P+0x14 is stored from 0xc1010's s0). A plain sweep's physics-gated clips are run-order noise: answer the getter (deep.py PZ).",
 "93. **The tracer prints r1 only; a blend setMotion (0xb03f8 / 0xb00b4) names its partner in r2 (2026-10-18).** Gravios's L2 M31 / M32 never appear in a sweep although every (7, 0x32) play sets them.",
 "94. **Turn-table plays name their motions in data (2026-10-18).** (6, 4) -> 0x7a258 on a table: the sweep sees TURN, not L0 M3 / M4 / M15. Read the table's +0x10 / +0x20 / +0x30.",
 "95. **A copy picked from the Clip menu on a _loop clip was not a new play (2026-10-18, fixed in index.html playNow).** The play key had no variant, so the first copy's entry -- its action and posture -- stayed: Diablos's posture-gated copies never held. The key now carries state.clipVariant.",
 "96. **CLASS_TIMERS holds reach the runtime only on a change (2026-10-18, fixed).** A runtime made after the hold went up (the Effects toggle) never had it; index.html now re-asserts motionStates.classT.held on a new runtime, as the charge holds were.",
 "97. **`ldr r0,[rB],r0` with r0 = 0xb640 is the VTABLE read (post-indexed: [rB] first, then rB += 0xb640) (2026-10-18).** The four 'unmapped' vt+0x1d0 sites all load the call this way; reading it as [rB+0xb640] loses the request.",
]
lines[k + 1:k + 1] = TRAPS
open(p, 'w', encoding='utf8', newline='').write(NL.join(lines))
print('ok', NL == '\r\n')

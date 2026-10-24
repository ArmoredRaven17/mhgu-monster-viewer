"""Fanged Beasts effects survey note (adapted from the Brute / Bird Wyvern bw_note.py; inputs in this directory)."""
import json, os, re, glob
SP = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(SP, 'survey.json')))
D = json.load(open(os.path.join(SP, 'detail.json')))
names = {m['id']: m['name'] for m in json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf-8'))['monsters']}
DELIB = {1106, 1500, 1200, 1201} | set(range(1130, 1138)) | set(range(1301, 1316))
SHARED_OK = {1100, 1108}          # driven by SharedStates (the Poisoned / Dung toggles); the classifier miscounts them
# Exported records the ROM never requests for this monster (READ), so not gaps: name -> why
NEVER = {
    'em023_00': {1120: 'u', 1121: 'u'},
    'em023_05': {1104: 'c', 1109: 'c'},
}
NEVER_WHY = {
    'em023_00': 'u1120 u1121 -- plain Rajang has NO rage puff: vtable +0x1d8 writes `e+0xb7d2 = 0` for variant 0 and 0xa41b8 '
                'tests it before every request (states-em023_05.md 4.2; motion-states.js em023_05 comment)',
    'em023_05': 'c1104 c1109 -- he never tires and the exhaust never procs: his tune+0x30 (stamina) and tune+0x44 are NULL '
                '(states-em023_05.md 1.1, 7; motion-states.js em023_05 comment)',
}
WORD = {   # class, vt+0x13c, short status for the table
    'em021_00': ('uEm021_00', '0xdd7cf4', 'override, READ (states-em021_00.md 3.4), untranscribed'),
    'em022_00': ('uEm022_00', '0xdda5ac', 'override, first look'),
    'em023_00': ('uEm023_00', '0xded0f4', 'override, first look'),
    'em023_05': ('uEm023_00', '0xded0f4', 'override, first look'),
    'em030_00': ('uEm030_00', '0xe1c4b0', 'override, first look'),
    'em060_00': ('uEm060_00', '0xf1911c', 'override, first look'),
    'em060_04': ('uEm060_00', '0xf1911c', 'override, first look'),
    'em061_00': ('uEm061_00', '0xf32bac', 'override, first look'),
    'em061_04': ('uEm061_00', '0xf32bac', 'override, first look'),
    'em062_00': ('uEm060_00', '0xf1911c', 'override, first look'),
    'em065_00': ('uEm065_00', '0xca170', '**base -- no override**'),
    'em083_00': ('uEm083_00', '0x1054b8c', 'override, first look'),
    'em083_04': ('uEm083_00', '0x1054b8c', 'override, first look'),
}
# The hand assessment of each gap's cause and cost (this pass, 2026-10-15)
ASSESS = {
'em021_00': [
    '**c 1105 (shock trap)**: (10, 0x6e) holds **L3 M6** and recovers on L3 M3 (states-em021_00.md 69, 779) -- L3 M6 is also '
    'the paralysis hold, and motion-states.js em021_00 `\'3|Motion[6]\'` shows paralysis (c 1101) "as every monster wired '
    'before him is". No clip of the trap\'s own. Config-only: a `cycle: [{ every: [c 1101, 60] }, { every: [c 1105, 42] }]` '
    'as Bulldrome\'s L3 M11 carries -- a choice, not a read.',
    '**Enable word**: vt+0x13c 0xdd7cf4 (0xdd7cf4..0xdd7f98) is already READ in states-em021_00.md 3.4 -- under the name '
    '"attack hit-group mask", which rom-map withdrew (it is the PSL enable word, rom-map line ~700). By motion: L0 M43 / '
    'L2 M16 by the gas type `ctl[1]` (1 -> bits 15-16, 2 -> 19-20, 3 -> 17-18, 4 -> 21-22); L0 M25 by the item `ctl[0]` (0 '
    'by the action number via 0xb0944, 1 none, 2 -> 15-16, 3 -> 21-22, 4 -> 17-18, 5 -> 19-20); L0 M28 `ctl[0] == 1` and '
    'action (1, 9) -> 27-28; L2 M2 (7, 1) / (7, 0) -> 25-26 / 23-24; L3 M15 alive (vt+0x3f4) -> 27-28, else asleep '
    '(0x81bb0(e, 0)) -> 29-30. **So eating DOES change his effects**, against motion-states.js em021_00 "HIS GAS TYPE '
    'CHANGES NO VISUAL ... a PSL binding the class does not make": today the viewer fires all four gas records u 200-203 '
    'on L2 M16 at once (the file mask; four byte-identical records, so four copies stacked) where the game fires one, and '
    'both c 3001 and c 50 on L3 M15 where the game fires one. Transcribing it needs a gas-type / item state in the viewer '
    '(the item is a stage-keyed random pick, the gas type a status-1 eating action).',
    'Unexported, outside the file mask (come in with the class --apply): c 150-153 (L0 M25), u 261-263 (L0 M43), u 281 '
    '(L2 M2), u 241 (L2 M5 bit 12, the tired group -- the base word fires it).',
    'Unexported ground-ray records (payload +0x52 set, +0x5c bit 4 -- refused before 2026-10-07, now recordable): c 40 '
    '(L0 M9), c 190 / c 191 (L0 M39).',
],
'em022_00': [
    '**c 1105 (shock trap)**: (10, 0x6e) holds **L3 M9** -> L0 M30 (states-em022_00.md 77, 679) -- the paralysis hold too; '
    'motion-states.js em022_00 left it DELIBERATELY ("its record c 1105 is byte-identical to c 1101 but for the key -- so '
    'paralysis is what it shows and nothing is lost by it"). Only the period differs (42 against 60). Config-only cycle '
    'if wanted.',
    '**u 1400**: "requester not found in this class" (states-em022_00.md 743); rom-map\'s u 1400 table has em022_00 '
    'UNRESOLVED because class-effects.json gives him the shared layer 0x6bb14..0xcad08 (his frame handler is the base '
    '0x6be64). This pass: his vtable\'s own slots span 0xdd9c64..0xde0c50 (the enable word 0xdda5ac among them); a branch '
    'scan (b / bl, any condition) of 0xdd8508..0xde1a08 finds NO call to 0xa499c; control: the same scan finds Bulldrome\'s '
    'tail call at 0xe1e8d0. Transitive calls not scanned, so INFERRED: nothing in his class asks for u 1400 -- probably '
    'never requested, not a gap.',
    '**Enable word**: vt+0x13c 0xdda5ac (first look: the whole method to its pop 0xdda65c, not emulated): base, then L0 M5 / '
    'M6 / M7 / M8 / M18 -> bits 15-17, or 18-20 when 0x81d6c (posture 4 and sunk); L0 M32 / M33 -> bits 21-23 while the '
    'fangs\' break level 0x9d36c(e, 0) is BELOW the .dtp threshold byte (`[[e+0x75f0]+0x64]` +1, +2 above rank 4: `cmp r5, '
    'r0; popls`). So c 120 on the rage roar (L0 M32) and the summon howl (L0 M33) stops once the fangs break -- the same '
    'gate as the summon (+0x2a8). The viewer fires it always. 0 bindings outside the file mask.',
    'Unexported ground-ray records, now recordable: c 40 (L2 M7), c 41 (L2 M5), c 42 (L2 M6).',
],
'em023_00': [
    '**No MOTION_STATES block at all**: c 1101-1105, c 1109, u 1000 / u 1001 are undriven for that reason alone. The read '
    'exists: states-em023_05.md enumerated every (status, number) for variant 0 AND 5 ("not one action differs", section '
    '7) and gives Rajang\'s own arms -- his tune+0x30 (stamina) and +0x44 are present, so he tires (the tired idle (0, 2) '
    '= L0 M17 with the drool c 1104, section 6) and the '
    'exhaust c 1109 procs on L3 M2; paralysis L3 M13 (c 1101 / 60; the trap c 1105 shares it), sleep L0 M23 / M24 (c 1102 '
    '/ 90, lids set 8), stun L3 M11 -> M7 -> M8 (c 1103 held), the head break on L3 M1 / M2 (his .dtp has a third row '
    '`{4, 255, 255, 2}` Furious lacks), rage L0 M5 with the variant-0 mane / hairline / tail sets (4.2). Config-only, '
    'from a read note -- the largest config job here.',
    'Not gaps: ' + NEVER_WHY['em023_00'] + '.',
    '**Enable word**: vt+0x13c 0xded0f4 (first look, to its pop 0xded23c): base, then L2 M8 only -- not tired (0x81614) '
    'and the action NUMBER (status not tested) in {6, 0xa, 0x34, 0x35, 0x3e, 0x3f, 0x40} (table 0xded140, number - 6 <= '
    '0x3a) -> bits 15-17: u 291 (L2 M8 b15) fires only on those actions (the viewer fires it always). The 11 bindings '
    'outside his file mask are all on BASE bits (u 293 / 295 / 310 on 6 / 7 / 9 / 10 / 12, c 153 / c 60 / u 294 on 0 / 3): '
    'they fire in the game whatever the override does, and c 153 / u 294 come in with --apply.',
],
'em023_05': [
    '**c 1105 (shock trap)**: (10, 0x6e) holds **L3 M13** -> L3 M3 (states-em023_05.md 64, 672), the paralysis hold too; '
    'motion-states.js em023_05 shows paralysis. Config-only cycle.',
    'Not gaps: ' + NEVER_WHY['em023_05'] + '.',
    '**Enable word**: the class is Rajang\'s, uEm023_00 (no em-number test in the class; variant 5): as Rajang -- u 291 on '
    'L2 M8 by action number; the out-of-mask bindings are base bits; c 153 / u 294 come in with --apply.',
],
'em030_00': [
    '**u 1400**: the site is READ (states-em030_00.md 142, 535): a tail call `b 0xa499c` with r1 = 2 (u id 2 -> key 1400) '
    'at 0xe1e8d0, inside the status-7 attack code. WHICH action and clip reach it is UNREAD, so no row can be written yet; '
    'once read it is a `hold: [u, 1400]` row as Barroth\'s L0 M6. (rom-map\'s u 1400 table still lists em030_00 as '
    'UNRESOLVED -- the states note has the site.)',
    '**Enable word**: vt+0x13c 0xe1c4b0 (first look, the whole method, 20 instructions): base, then L0 M5 / M6 / M7 / M14 '
    '-> bits 15-17, or 18-20 when 0x81d6c. His three bindings above bit 14 (c 30 / c 31 on L0 M5 b15 / b16, c 91 on L0 M14 '
    'b15) are exactly those and fire at the surface, so transcription changes only the state gating of bits 6-14.',
],
'em060_00': [
    '**No states decode** (no E:\\offline\\decode\\notes\\states-em060_00.md), **no MOTION_STATES block, not in '
    '_autoOnRage, no RAGE_PUFF**: c 1101-1105, c 1109 and the puff u 1120 / u 1121 all wait on it. His class writes neither '
    '`e+0xb7d2` nor `+0xb7d3` (whole-text `movw #0xb7d2 / #0xb7d3` scan: 15 sites, none in 0xf110ec..0xf23e20; controls '
    'Rajang 0xde1dd0 and Alatreon 0xec4a94 found), so the base ctor\'s 1 stands and the puff and drool run -- INFERRED '
    '(an immediate scan; transitive calls not scanned).',
    '**Enable word**: vt+0x13c 0xf1911c (first look, to its pop 0xf191d4): base, then L0 M1 / M4 / M8 / M9 -> bits 21-23 '
    'unless 0x81d6c; and only when variant 4 AND em 0x3c (Redhelm): L0 M13 / L0 M17 -> bit 15, L9 M1 -> bits 18-20 if '
    'the byte `e+0xcaee` != 0 (UNREAD). So **Arzuros\'s c 60 on L0 M13 / M17 bit 15 never fires in the game** and the '
    'viewer binds it (mis-gated); c 30 / c 31 / c 34 (L0 M4 / M8 / M9) are on the shared arm.',
],
'em060_04': [
    'As Arzuros (no states decode, no MOTION_STATES block, not in _autoOnRage, no RAGE_PUFF): c 1101-1105, c 1109, '
    'u 1001 (a break record) and the puff.',
    '**Enable word**: his variant-4 arm -- c 60 on L0 M13 / M17 bit 15 is his; u 320 on L9 M1 bit 18 fires only while '
    '`e+0xcaee` != 0, a byte this pass did not read.',
    'Board: "Redhelm Arzuros key 120 -- the emptied-list branch 0x9b76e4" (L0 M22); rom-map withdrew 0x9b76e4 as a '
    'recording gap on 2026-10-14 (the viewer drawing an ENDED unit, closed in host.js) -- see this soak.',
],
'em062_00': [
    '**He has no class of his own**: no `uEm062_00` string or DTI exists in the ROM; uEm060_00 runs him (its em-number '
    'test, dev/notice-marks.md step 3: em062 -> uEm060_00; the shell map agrees, dev/shell-map.md 55). class-effects.json '
    'correctly has no uEm062_00.',
    'As Arzuros: no states decode, no MOTION_STATES block, not in _autoOnRage, no RAGE_PUFF -- c 1101-1105, c 1109, u 1000 '
    'and the puff wait on it.',
    '**Enable word**: Arzuros\'s method; its L0 M1 / M4 / M8 / M9 arm has no em test, so his c 20 / c 21 (L0 M4 b21 / b22) '
    'and c 50 (L0 M8 / M9 b21) fire unless 0x81d6c (posture 4 and sunk -- whether his roll is posture 4 is UNREAD).',
],
'em061_00': [
    '**c 1105 (shock trap)**: (10, 0x6e) holds **L3 M13** (or L3 M73 -> M13 from f42 when sel0) and recovers on L3 M17 '
    '(states-em061_00.md 63, 623) -- both are the paralysis holds; motion-states.js lagombiLine shows paralysis ("byte-'
    'identical but for the key"). Config-only cycle on both clips.',
    '**Enable word**: vt+0x13c 0xf32bac (first look, to its pop 0xf32c4c): base, then L0 M6 / M51 / M60 / M61 -> bits 21-23 '
    'unless 0x81d6c; and only when variant 4 (Snowbaron): L0 M2 / L0 M52 -> bit 15, L2 M57 -> bit 18. So **Lagombi\'s c 10 '
    'on L0 M2 / M52 bit 15 never fires in the game** and the viewer binds it (mis-gated). His u 302 (L2 M57 b18) has no '
    'record in em061_00u: not an effect.',
],
'em061_04': [
    '**c 1105**: as Lagombi (L3 M13 / L3 M73, shared with paralysis) -- config-only cycle.',
    '**Enable word**: Lagombi\'s method, his variant-4 arm: c 10 (L0 M2 / M52 b15) and u 302 (L2 M57 b18) are his.',
],
'em065_00': [
    '**No states decode** (no states-em065_00.md), **no MOTION_STATES block, not in _autoOnRage, no RAGE_PUFF**: c 1101-1105, '
    'c 1109, u 1001 and the puff wait on it. No `movw #0xb7d2 / #0xb7d3` in his band 0xf48f20..0xf56698 (same scan and '
    'controls as Arzuros), so the puff and drool run -- INFERRED.',
    '**Enable word: BASE** -- vt+0x13c holds 0xca170 itself (no override). `() => 0` + --apply, as the dromes: c 50 '
    '(L3 M11 bit 0, outside the file mask, always on in the game) comes in; u 210 / u 211 (bits 6 / 9 / 12 on L2 M77 / '
    'M78 / M80 / M117) become state-gated.',
    'Unexported ground-ray records, now recordable: c 42 (L2 M63 / M83 / M84 / M123), c 43 (L2 M63 / M83 / M84), c 44 '
    '(L2 M72 / M109 / M124), c 110 (L5 M31).',
],
'em083_00': [
    'No undriven gap.',
    '**The soak refuses two motions**, both at **0x3294c4** in the request routine (lifted-request.js; the same in the '
    'committed file): `blx [vt+0x68]` on the unit (0x3294ac) answered 0 and the arm after it (`+0x30 = 1`, return) was '
    'never recorded. L0 M30 (alive u 265 / u 256) and L2 M21 (u 256 / u 244). A refusal stops every effect of the monster '
    'until reload, so this is the one live fault in the category. Needs a recorder pass that drives +0x68 to 0 for one '
    'of those records (which one, and why +0x68 answers 0: NOT READ). rom-map has the row.',
    '**Enable word**: vt+0x13c 0x1054b8c (first look, the whole method, 18 instructions): base, then L9 M16 only -- '
    '0x6fe88(e, 7, 0x6a) (the current action is (7, 0x6a)) -> bits 18-20, else 21-23. Gammoth has no L9 binding, so for '
    'him it is the base word: state gating of c 25 (L0 M33 b6 / b9 / b12).',
    'Unexported ground-ray records, now recordable: u 242 (L2 M23), u 261 (nine motions), u 302 (L0 M33, L2 M11 / M16 / '
    'M19), u 303 (L2 M30 / M44), u 340 (L2 M29), u 400 (L2 M33).',
],
'em083_04': [
    'No undriven gap.',
    '**The soak refuses the same two motions as Gammoth** (L0 M30, L2 M21) at 0x3294c4, with his own u 265 / u 256 / '
    'u 244 alive -- one recording should close both.',
    '**Enable word**: Gammoth\'s method -- on his L9 M16, u 511 (bit 18) fires only under action (7, 0x6a) and u 220 (bit '
    '21) otherwise; the viewer fires both on every play.',
    'Unexported ground-ray records, now recordable: u 261, u 302, u 303, u 340, u 400, u 472 (L9 M6), u 473 (L9 M8), '
    'u 520 (L9 M16).',
],
}
soak = {}
for f in glob.glob(os.path.join(SP, 'soak', '*.log')):
    mon = os.path.basename(f)[:-4]
    t = open(f, encoding='utf-8', errors='replace').read()
    last = [l for l in t.splitlines() if 'motions played' in l]
    ref = [re.sub(r'\s+', ' ', l.strip())[:160] for l in t.splitlines() if 'REFUSED' in l]
    soak[mon] = (last[-1].split(': ', 1)[1] if last else 'no result', ref)


def gaps(mon, r):
    nv = NEVER.get(mon, {})
    return [w for w in r['wiredList'] if int(w.split('(')[0][1:]) not in DELIB | SHARED_OK
            and int(w.split('(')[0][1:]) not in nv]


L = []
L.append('# Fanged Beasts -- effects survey (survey agent for the Viewer agent, 2026-10-15)\n')
L.append('Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."\n')
L.append('ASSESS ONLY: nothing under docs/ was changed, no recorder or lift was run. Same method as the Flying, Brute and Bird '
         'Wyvern passes (dev/bird-wyverns-effects-survey.md, dev/brute-wyverns-effects-survey.md).\n')
L.append('## How it was measured\n')
L.append('- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared '
         'states). Corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the '
         'state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the '
         'deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), '
         'c 1500 (lying in water), c 1106 (Raven). New in this pass: records the ROM is READ never to request for that monster '
         'are not gaps either (Rajang u 1120 / 1121, Furious Rajang c 1104 / 1109; per monster below).')
L.append('- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks\' FILE masks (what the viewer binds today '
         'for a monster whose class +0x13c is untranscribed) and on the WHOLE blocks (every named bit). The difference is what '
         'the game decides with the monster\'s enemy +0x13f4 word. None of the thirteen is in psl-mask.js PSL_MASK_MONSTERS. '
         '`*` = named outside the file mask. A name with no file (`-`) is a bit naming a key that has no record in any array: '
         'not an effect. Each class\'s vt+0x13c word was read off its vtable (efx/class-effects.json; controls uEm004_00 '
         '0xd2e0ec, uEm032_00 / uEm014_00 0xca170 match); "first look" = the override disassembled whole to its return here, '
         'NOT emulated and not transcribed.')
L.append('- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs, every bound motion in the viewer, one at a time '
         'through the shared two-slot lock. A refusal stops every effect of the monster until reload.')
L.append('- **Unexported records with a file**: every one in the file mask is a ground-ray record (payload +0x52 set, +0x5c '
         'bit 4) -- the stage ray refused before 2026-10-07 and recordable since (add_effects.py stage_ray retired); the plan '
         'now gives each `ok`. Those outside the mask come in with their class\'s --apply.\n')
L.append('## Summary\n')
L.append('| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word (vt+0x13c) | bindings outside file mask | PSL records not exported (with a file) | soak |')
L.append('|---|---|---|---|---|---|---|---|---|')
for i, (mon, r) in enumerate(S.items(), 1):
    ow = gaps(mon, r)
    det = D.get(mon, {})
    ne = [k for k, v in det.items() if not v['exported'] and v['efl']]
    sk = soak.get(mon, ('not run', []))
    cls, word, st = WORD[mon]
    L.append('| %d | %s `%s` | %d | %d | %s | %s `%s`: %s | %d | %s | %s |' % (
        i, names.get(mon, mon), mon, r['exported'], r['implemented'] + sum(1 for w in r['wiredList'] if int(w.split('(')[0][1:]) in SHARED_OK),
        ' '.join(ow) or '--', cls, word, st, r['outsideMaskBindings'],
        ' '.join(ne) or '--', ('**%d refused**' % len(sk[1])) if sk[1] else ('clean' if sk[0] != 'not run' and sk[0] != 'no result' else sk[0])))
L.append('')
L.append('## Per monster\n')
for mon, r in S.items():
    L.append('### %s (`%s`)\n' % (names.get(mon, mon), mon))
    sk = soak.get(mon, ('not run', []))
    L.append('- Soak: %s' % sk[0])
    for x in sk[1]: L.append('  - REFUSED: `%s`' % x)
    L.append('- Enable word: class %s, vt+0x13c `%s` -- %s; %d bindings named outside the file mask (%d file-mask '
             'bindings, %d whole-block).' % (WORD[mon][0], WORD[mon][1], WORD[mon][2], r['outsideMaskBindings'],
                                             r['pslBindingsFileMask'], r['pslBindingsWhole']))
    ow = gaps(mon, r)
    if ow: L.append('- Exported but undriven (not deliberate): %s' % ' '.join(ow))
    for a in ASSESS.get(mon, []): L.append('- ' + a)
    det = D.get(mon, {})
    if det:
        L.append('- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):')
        for k, v in det.items():
            if not v['efl']:
                continue
            L.append('  - %s %s `%s` (%s): %s%s' % (k, 'exported' if v['exported'] else '**not exported**', v['efl'],
                     v['types'], ' '.join(v['motions'][:8]), ' +%d more' % (v['nMotions'] - 8) if v['nMotions'] > 8 else ''))
        empty = [k for k, v in det.items() if not v['efl']]
        if empty: L.append('  - named with no record in any array (not effects): %s' % ' '.join(empty))
    L.append('')
L.append(open(os.path.join(SP, 'closing.md'), encoding='utf-8').read().rstrip())
out = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\fanged-beasts-effects-survey.md'
open(out, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('\n'.join(L[:30]))

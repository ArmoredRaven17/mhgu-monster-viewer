"""Amphibians + Piscine Wyverns effects survey note (adapted from bw_note.py; survey agent, 2026-10-15)."""
import json, os, re, glob
SP = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(SP, 'survey.json')))
D = json.load(open(os.path.join(SP, 'detail.json')))
B = json.load(open(os.path.join(SP, 'bits.json')))
U = json.load(open(os.path.join(SP, 'unexp.json')))
names = {m['id']: m['name'] for m in json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf-8'))['monsters']}
DELIB = {1106, 1500, 1200, 1201} | set(range(1130, 1138)) | set(range(1301, 1316))
SHARED_OK = {1100, 1108}
OUT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\amphibians-piscine-effects-survey.md'

soak = {}
for f in glob.glob(os.path.join(SP, 'soak', '*.log')):
    mon = os.path.basename(f)[:-4]
    t = open(f, encoding='utf-8', errors='replace').read()
    last = [l for l in t.splitlines() if 'motions played' in l]
    ref = [re.sub(r'\s+', ' ', l.strip())[:160] for l in t.splitlines() if 'REFUSED' in l]
    soak[mon] = (last[-1].split(': ', 1)[1] if last else ('viewer never came up' if 'never came up' in t else 'no result'), ref)

WORD = {   # class, vt, +0x13c, extent, insns
    'em066_00': ('uEm066_00', '0x17dc1ec', '0xf63fc0', '0xf63fc0..0xf641f4', 142),
    'em066_04': ('uEm066_00', '0x17dc1ec', '0xf63fc0', '0xf63fc0..0xf641f4', 142),
    'em067_00': ('uEm067_00', '0x17dd730', '0xf772ec', '0xf772ec..0xf77364', 31),
    'em010_00': ('uEm010_00', '0x179e2b8', '0xd6bbc8', '0xd6bbc8..0xd6bc68', 41),
    'em017_00': ('uEm017_00', '0x17a9d80', '0xda3738', '0xda3738..0xda3780', 19),
    'em036_00': ('uEm036_00', '0x17baff4', '0xe3f6c4', '0xe3f6c4..0xe3f770', 44),
}

# Per-monster assessment, hand-written from the reads cited in each line.
NOTES = {
 'em066_00': [
  'Enable word: override `0xf63fc0` (the largest of the five). 0 bindings outside the file mask, but **16 in-mask bindings on bits 15-31 fire on every play today**, where the game picks one by state: L4 M7 / L4 M17 `u 410 b15` and `u 412 b21` (+ `u 440` b16 / b22 / b25 / b28) are ALTERNATIVES -- the boulder kind `ctl+0x30` (`[e+0xcac0]+0x30`, states-em066_00.md:199) x part 0\'s break level against the .dtp bytes 1/2 and 5/6 -- so the viewer shows both at once; L4 M28 / M29 `u 391 b15` + `u 392 b18` (and `u 390` / `u 393`) are the 0x3a8430 split (> 4 -> bits 18-20, else 15-17) on variant 0; L0 M7 / M11 / M12 `c 0 b27`, `c 1 b28` on unless `0x81d6c` (sunk).',
  'Not exported, trigger READ but motion not: **u 50** (`em066_00_017`, joint 131) = class id 1003 at `0xf591cc` inside `vtable +0x208`\'s motion switch (states-em066_00.md:903, 919) -- boulder kind 3; the motion that case runs on is not in the note. Category 5.',
  'Not exported, shells (no SHELL_DATA for the class): shell13 `u 0 / 1 / 2`; shell00 `u 20..25`; shell16 = THE BOULDER (motion-states.js em066_00 block comment: "its hit part (part 7) and `shell16` are the shell session\'s") `u 30..33`, `u 40..43`, `u 100 / 101 / 110 / 111`. 21 records. Category 5.',
 ],
 'em066_04': [
  'Enable word: the same override (`0xf63fc0`), variant 4 arm. **30 in-mask bindings on bits 15-31 fire on every play today**: L4 M7 / L4 M17 all six boulder-kind x break alternatives (`u 410 / 412 / 420 / 421 / 430 / 431` + `u 440 / 441`) at once; L4 M14 / M15 `u 460..463` (only under action (7, 0xf7) / (7, 0xf8), bits 17-18); L9 M13 `u 500 b21` / `u 510 b24` (`ctl+0x30` == 2 / 3); L4 M28 / M29 `u 392 / 393 b18` (variant 4 -> bits 18-20 always: correct as bound); L0 M7 / M11 / M12 bits 27-28 unless sunk.',
  'Not exported: **u 50** (`em066_04_004`, id 1003, `0xf591cc`, motion unread -- as Tetsucabra) and **u 60** (`em066_04_004`, id 1004): states-em066_00.md:155-156 reads all five `vtable +0x1d0` sites as asking 1001 / 1002 / 1003 only, so **u 60 has no requester** -- not a gap unless a site turns up.',
  'Not exported, shells: the same 21 as Tetsucabra (shell13 / shell00 / shell16). Category 5.',
 ],
 'em067_00': [
  'Shock trap **c 1105** exported with no row: (10, 0x6e) plays L3 M2 (P+0x568 = 60) then holds L3 M13 with c 1105 every 42 (cm200_001, joint 1, scale 5) -- states-em067_00.md:72, 820. L3 M2 is already a three-way `cycle` (head, tail, c 1109): a fourth entry `{ every: [[\'em067_00c\', 1105], 42] }`, the Rath / Tetsucabra / Lavasioth shape. Category 1.',
  '**THE BLOATED POSTURE HAS NO AILMENT ROWS** (not counted by the classifier, because the records fire on the posture-0 clips): posture 2 plays L3 M100 (the stun\'s start, c 1103 held, and the trap\'s start), L4 M1 (the stun\'s hold, c 1103), L3 M101 (paralysis hold, c 1101 every 60, and the trap\'s hold from f20, c 1105 every 42), L3 M102 (every recovery), L3 M103 (sleep fall; the sleep HOLD is no motion, so c 1102 has no clip to hang on), L3 M106..M109 (pit) -- states-em067_00.md:815-822. The viewer has every one of those clips (L3 M100..M103, M106..M109) and MOTION_STATES em067_00 names none. Category 1.',
  'Enable word: override `0xf772ec` -- L0 M7 / M11 / M12 / M13 (mask 0x3880) bits 27-29 unless `0x81d6c` (sunk, rom-map "0x81d6c / 0xbf62c"); L4 M31 / M32 (0x41f / 0x420) bits 15-17 iff `0x81d18` == 1 -- posture 4 AND P+0x5c >= 0.9 x MoguriBaseOfs (`0x81d18..0x81d64`, the literal `0x81d68` = 0x3f666666, read here): **u 340 fires only in posture 4 at that depth** (the converse depth arm of `0x81d6c`), which the viewer cannot show today (no depth; the play from the surface leaves it off). Outside the mask: `u 340` (b15, the override), and four BASE bits that fire whatever the override says -- `c 23` L4 M90 b0, `u 470` L4 M74 b12 / `u 471` L4 M58 b12 (tired-calm), `u 481` L4 M58 b9 (enraged; not exported, comes in with --apply).',
  'Not exported, trigger partly read: **u 60** (`em067_00_019`, mode 3, pos (150, 0, 0)) = class id 1005 at `0xf69690`, "inside an attack with a computed world position" (states-em067_00.md:217, 902) -- which attack / clip / frame is not in the note. Category 4 once read.',
  'Not exported, shells: shell13 `u 0 / u 10` (modes 0 / 3 and 1 / 4) and `u 1 / u 11` (shell01 modes 8-11 and shell13). His beam shells (u 30 / u 31) are wired. Category 5.',
 ],
 'em010_00': [
  'Shock trap **c 1105** exported with no row: (10, 0x6e) plays L3 M2 to frame 52 (P+0x568 = 52) then holds L3 M9 with c 1105 every 42 (cm200_001, joint 1, scale 4) -- states-em010_00.md:92, 653; motion-states.js em010_00 already says "It is also the shock trap\'s first 52 frames, which shows nothing of its own" (written before c 1105 was wired anywhere, as the Rath line\'s was -- withdraw it with the row). A fourth entry in the L3 M2 `cycle`. Category 1.',
  '**u 1400**: rom-map "u 1400 -- the per-class sweep": `em010_00` has NO branch into the record family in the whole class band, so he closes on the shared one-shot latch `0xadc98` (enemy +0x1404 bits 20/21 AND +0x1408 bit 0), whose setters are NOT READ. One shared read, not his. Category 5.',
  'Enable word: override `0xd6bbc8` -- L0 M18 (0x12) bits 15-17, or bits 18-20 when posture 4 and P+0x5c < -550.0 (literal at `0xd6bc6c` = 0xc4098000); L2 M2 (0x202) status 7: number 0x12 -> bits 21-23, 0x13 -> bits 24-26, else nothing. 0 bindings outside the mask, but **6 in-mask bindings fire on every play today**: L2 M2 shows BOTH (7, 0x12)\'s set (`c 41 b22`, `u 260 b21`) and (7, 0x13)\'s (`c 41 b25`, `u 260 b24`, `c 300 b26`); L0 M18 `c 270 b15` (right except submerged deep).',
  'Nothing else unexported: his triage has no record missing; his beam shells are wired.',
 ],
 'em017_00': [
  'No undriven record. Enable word: override `0xda3738`, the smallest of the five -- L4 M9..M11 (0x409..0x40b) bits 15-17 unless `0x6fe88(e, 7, 0xc)` (the current-action test, rom-map `0x6fe88`): `c 60 b15` on those three today fires even under (7, 0xc). Outside the mask: four bindings, **all on base bits 0-2** (`c 121` L2 M29 / M30 b1, `c 30` L2 M30 b2, `u 200` L2 M30 b0) -- bits 0-5 are always on (0xca170), so these fire in the game on every play whatever the override says.',
  'Not exported, shells: shell00 `u 0` (`em017_00_001`) and `u 1` (`em017_00_002`) across all eighteen modes (a spit, by its shape: INFERRED). No SHELL_DATA for him. Category 5 (base00 is translated).',
 ],
 'em036_00': [
  '**u 1400**: rom-map: his two record-family sites `0xe41e10` / `0xe44314` ask level **0** (key 1120), not 2, so u 1400 closes on the shared latch (setters NOT READ). Category 5.',
  '**A CLASS-REQUESTED u 1120 THE VIEWER DOES NOT MODEL**: both sites are tail-calls `b 0xa499c` with `mov r1, #0` (re-read here: `0xe41e04` / `0xe44308`), in a function that calls `0xbc7f4` (posture), `0xbf62c` (MoguriBaseOfs) and `0xafce8(e, 0x15)` -- L0 M21 (rom-map row; the setMotion identity of `0xafce8` is INFERRED). 0xa499c holds its record at `e+0xb7c4`, so this is a `hold` row like the u 1400 ones. **It contradicts states-em036_00.md:118 / 792 ("Key 1120 is never requested")** -- that note read the rage path; resolve which is right (open the site\'s function from its entry `0xe41d20`) before wiring. u 1120 counts as implemented only because the rage puff names it. Category 1 after that read.',
  'Enable word: override `0xe3f6c4` -- L2 M14 (0x20e) bits 15-17, or 18-20 when `0x3a8430` > 4 (the chooser whose byte is NOT READ, rom-map `0x3a8430`); L0 M21 (0x15) bit 15 iff `0x81d6c`; L0 M13 (0xd) bits 15-17 iff action (1, 0x30 / 0x31). Outside the mask: `u 231 b15` / `u 241 b18` on L2 M14 (one or the other by the chooser; u 241 not exported) and two BASE bit-0 bindings, `c 16` L0 M17 (not exported) and `c 60` L2 M12, which fire whatever the override says.',
  'Not exported, trigger READ: **u 60** (`em036_00_011_s`, no joint, mode 3, scale 1.3, end 1) -- "held while the action is (7, 0xf)..(7, 0x14) or (6, 4) / (6, 5)", the class\'s one effect request from `vtable +0x208` (states-em036_00.md:108, 168, 262, 992). Export + record, then rows on those actions\' clips. Category 4.',
  'Not exported, shells: shell00 `u 0..4`, `u 30..33`, `u 100..102` (23 modes; a spit, by its shape: INFERRED) and shell01 `u 90` (`em036_00_010`) / `u 91` (`em045_00_003`). 14 records, no SHELL_DATA. Category 5 (base00 / base01 are translated).',
 ],
}

GROUPS = [('Amphibians', ['em066_00', 'em066_04', 'em067_00']), ('Piscine Wyverns', ['em010_00', 'em017_00', 'em036_00'])]

L = []
L.append('# Amphibians and Piscine Wyverns -- effects survey (survey agent for the Viewer agent, 2026-10-15)\n')
L.append('Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."\n')
L.append('Assess only: no edit under docs/, no recorder or lift run. Method and format: dev/bird-wyverns-effects-survey.md and '
         'dev/brute-wyverns-effects-survey.md (their scripts, copied to the scratchpad\'s `survey_ap/`), plus two additions '
         'marked below.\n')
L.append('## How it was measured\n')
L.append('- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared '
         'states). Corrections kept: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates; deliberate '
         'exclusions, not gaps: blast c 1130-1137, notice c 1200/1201, hyper u 1301-1315, c 1500, c 1106.')
L.append('- **The PSL enable word**: add_effects.py plan() on the FILE masks and on the WHOLE blocks; the difference is what '
         'the class\'s vt+0x13c decides. `*` = named outside the file mask. A name with no file is a bit naming a key with no '
         'record: not an effect. None of the six is in PSL_MASK_MONSTERS.')
L.append('- **New here, the bindings split by who decides them** (`survey_ap/bits.py`): bits 0-5 always on and bits 6-14 by '
         'rage / tiredness are the BASE `0xca170` (READ, psl-mask.js); bits 15-31 are the class override\'s. An out-of-mask '
         'binding on a base bit fires in the game whatever the override says; an IN-mask binding on bits 15-31 fires on '
         'every play in the viewer today, where the game gates it -- that is where alternatives show at once.')
L.append('- **New here, records the triage names that are not exported** (`survey_ap/unexp.py`: dev/effects-triage/<mon>.md '
         'rows whose (pel, key) is not in the effects json, less "no motion fires it") -- shells and class requests, which the '
         'PSL plan cannot see.')
L.append('- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs through the shared two-slot lock, one at a time.\n')

for title, mons in GROUPS:
    L.append('## %s\n' % title)
    L.append('| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | in-mask bits 15+ bound unconditionally | PSL records not exported | triage records not exported (shells / class) | soak |')
    L.append('|---|---|---|---|---|---|---|---|---|---|---|')
    for i, mon in enumerate(mons, 1):
        r = S[mon]
        ow = [w for w in r['wiredList'] if int(w.split('(')[0][1:]) not in DELIB | SHARED_OK]
        det = D.get(mon, {})
        ne = [k for k, v in det.items() if not v['exported'] and v['efl']]
        sk = soak.get(mon, ('not run', []))
        firing = r['implemented'] + sum(1 for w in r['wiredList'] if int(w.split('(')[0][1:]) in SHARED_OK)
        inm = B[mon]['counts'].get('override15+ in', 0)
        ux = U[mon]
        shells = sum(1 for f in ux if f[8].startswith('shells'))
        cls = [f[0] + f[2] for f in ux if not f[8].startswith('shells')]
        sres = sk[0]
        m = re.match(r'(\d+) motions played in the viewer, (\d+) refused', sres)
        soakcell = ('**%s refused**' % m.group(2) if m and m.group(2) != '0' else 'clean (%s)' % m.group(1)) if m else '**%s**' % sres
        L.append('| %d | %s `%s` | %d | %d | %s | **override `%s`, unread** | %d | %d | %s | %d shell%s | %s |' % (
            i, names.get(mon, mon), mon, r['exported'], firing, ' '.join(ow) or '--', WORD[mon][2], r['outsideMaskBindings'],
            inm, ' '.join(ne) or '--', shells, (' + ' + ' '.join(cls)) if cls else '', soakcell))
    L.append('')
    for mon in mons:
        r = S[mon]
        L.append('### %s (`%s`)\n' % (names.get(mon, mon), mon))
        sk = soak.get(mon, ('not run', []))
        L.append('- Soak: %s' % sk[0])
        for x in sk[1]: L.append('  - REFUSED: `%s`' % x)
        w = WORD[mon]
        L.append('- Enable word **unread**: class %s, vtable `%s`, +0x13c = `%s` (an override; extent %s, %d instructions, derived by '
                 'following every branch to the last return). %d bindings outside the file mask (%d file-mask, %d whole-block).'
                 % (w[0], w[1], w[2], w[3], w[4], r['outsideMaskBindings'], r['pslBindingsFileMask'], r['pslBindingsWhole']))
        c = B[mon]['counts']
        L.append('- Bindings by decider (records only): ' + ', '.join('%s %d' % (k, v) for k, v in sorted(c.items())))
        ov = B[mon]['override_bits']
        if ov:
            L.append('  - bits 15-31 per motion: ' + '; '.join('%s %s' % (k, ' '.join(v)) for k, v in ov.items()))
        ow = [w_ for w_ in r['wiredList'] if int(w_.split('(')[0][1:]) not in DELIB | SHARED_OK]
        if ow: L.append('- Exported but undriven (not deliberate): %s' % ' '.join(ow))
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
        if U[mon]:
            L.append('- Triage records not exported:')
            for f in U[mon]:
                L.append('  - %s %s `%s` (%s; joint %s, mode %s, end %s): %s' % (f[0], f[2], f[3], f[7], f[4], f[5], f[6], f[8][:140]))
        L.append('- **Assessment**:')
        for n in NOTES[mon]:
            L.append('  - ' + n)
        L.append('')

L.append('## The five enable words\n')
L.append('All five classes OVERRIDE vt+0x13c (none is the base `0xca170`, so none is a `() => 0` entry). Control, the same run: '
         'uEm004_00 `0x1797c8c` -> `0xd2e0ec`, uEm032_00 / uEm014_00 -> `0xca170`, as rom-map lists them; the word at '
         'vt+0x140 is `0x6bdd4` on all eight. Each override calls `0xca170` first and then ORs by MOTION ID in r1 (`mov r5, r1`; '
         'the motion ids they compare -- 0x202, 0x12, 0x409..0x40b, 0x20e, 0x407..0x41d, 0x90d, 0x41f / 0x420 -- are exactly the '
         'motions bits.py finds carrying bits 15+, (list << 8) | slot), so they are motion-keyed like Basarios\'s, not '
         'action-only like Great Maccao\'s. Read statically end to end by this survey; NOT emulated and NOT transcribed -- '
         'the spec pass owns that.\n')
L.append('| class (monsters) | vt | +0x13c | extent | inputs it needs from the viewer | cost |')
L.append('|---|---|---|---|---|---|')
L.append('| uEm017_00 (Cephadrome) | `0x17a9d80` | `0xda3738` | `..0xda3780`, 19 insns | motion, action (7, 0xc) | smallest |')
L.append('| uEm067_00 (Zamtrios) | `0x17dd730` | `0xf772ec` | `..0xf77364`, 31 | motion, posture 4 + depth (0x81d6c sunk / 0x81d18 deep) | small; the sunk case cannot be shown (no depth) |')
L.append('| uEm010_00 (Plesioth) | `0x179e2b8` | `0xd6bbc8` | `..0xd6bc68`, 41 | motion, action (7, 0x12 / 0x13), posture 4 + P+0x5c vs -550.0 | small; fixes L2 M2 showing two attacks at once |')
L.append('| uEm036_00 (Lavasioth) | `0x17baff4` | `0xe3f6c4` | `..0xe3f770`, 44 | motion, action (1, 0x30 / 0x31), sunk, **0x3a8430** | small code; the 0x3a8430 byte is NOT READ (rom-map), so u 231 vs u 241 needs a rank-like input |')
L.append('| uEm066_00 (Tetsucabra, Drilltusk) | `0x17dc1ec` | `0xf63fc0` | `..0xf641f4`, 142 | motion, variant `+0xb5f5`, action (7, 0xf7 / 0xf8), part 0 break level vs .dtp bytes 1/2, 5/6, **0x3a8430**, **the boulder kind `ctl+0x30`** | largest; the boulder kind is an action-start state the viewer does not carry |')
L.append('')

L.append('## What closing each needs (easiest first)\n')
L.append('1. **Config-only rows** (motion-states.js; records already exported, no recording):')
L.append('   - **The shock trap c 1105** on Zamtrios and Plesioth (2 monsters): a fourth `{ every: [[c, 1105], 42] }` entry in '
         'each one\'s existing L3 M2 `cycle` (states-em067_00.md:820; states-em010_00.md:653). Tetsucabra, Drilltusk, Cephadrome and '
         'Lavasioth already have theirs.')
L.append('   - **Zamtrios\'s bloated-posture ailment clips** (1 monster): L3 M100 and L4 M1 (stun, c 1103), L3 M101 (paralysis '
         'c 1101; trap hold c 1105) carry the posture-0 clips\' records (states-em067_00.md:815-822); the viewer has the clips and no rows.')
L.append('   - **Lavasioth\'s class-requested u 1120 on L0 M21** (1 monster): one `hold` row -- AFTER the contradiction with '
         'states-em036_00.md:118 is settled (above).')
L.append('2. **Base-only enable words**: none -- all five classes override (0 monsters). The ten out-of-mask bindings on BASE bits '
         '(Zamtrios 4, Cephadrome 4, Lavasioth 2) fire in the game whatever the override says, but listing a class in '
         'PSL_MASK_MONSTERS needs its override, so they ride item 3.')
L.append('3. **Override enable words to read** (spec pass: transcribe, emulate, --apply), smallest first: uEm017_00 Cephadrome '
         '(1; brings c 121 / c 30 / u 200 in, gates c 60); uEm067_00 Zamtrios (1; brings u 340, c 23, u 470 / 471, u 481 -- '
         'u 481 exported with it); uEm010_00 Plesioth (1; 0 outside, gates 6 -- L2 M2 shows two attacks\' sets at once today); '
         'uEm036_00 Lavasioth (1; brings u 231 / u 241, c 16, c 60; needs a 0x3a8430 input); uEm066_00 Tetsucabra + Drilltusk '
         '(2; 0 outside, gates 16 / 30 -- L4 M7 / M17 show every boulder x break alternative at once; needs the boulder '
         'kind). rom-map "The PSL enable word per class" has the five rows.')
L.append('4. **Records needing a recorder pass** (trigger read or readable): Lavasioth u 60 (1; the held magma, read: export, '
         '--record, rows on the (7, 0xf..0x14) / (6, 4 / 5) clips); Zamtrios u 60 (1; class id 1005 at `0xf69690`, the attack\'s '
         'clip and frame to read first); the unexported PSL records Zamtrios u 481 and Lavasioth c 16 / u 241 (2; all `ok` in the '
         'whole plan, nothing left out -- they export and record with item 3\'s --apply / --record).')
L.append('5. **Shells / undecoded**:')
L.append('   - **u 1400** on Plesioth and Lavasioth (2): the shared latch\'s setters (enemy +0x1404 bits 20/21, +0x1408 bit 0) -- '
         'NOT READ; one shared read for every latch monster.')
L.append('   - **The boulder\'s u 50** on Tetsucabra and Drilltusk (2): class id 1003 at `0xf591cc` in vt+0x208\'s motion switch -- the '
         'motion is unread. (Drilltusk\'s u 60, id 1004, has no requester per the note: not a gap.)')
L.append('   - **Non-beam shells, no SHELL_DATA** (5 monsters, 62 records): Tetsucabra 21 and Drilltusk 21 (shell13, shell00, '
         'shell16 = the boulder), Lavasioth 14 (shell00, shell01), Zamtrios 4 (shell13, shell01), Cephadrome 2 (shell00). By the '
         'board\'s folder rule (shell folder number = base number; to be confirmed per class from its vtable), Cephadrome and '
         'Lavasioth need no new base (base00 / base01 are translated), Zamtrios needs base13 (partly translated, Khezu\'s orbs), and '
         'Tetsucabra\'s boulder needs **base16, which has no transcription at all** -- the largest single item here.')
open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(x for x in L if x is not None) + '\n')
print('\n'.join(x for x in L[:40] if x is not None))

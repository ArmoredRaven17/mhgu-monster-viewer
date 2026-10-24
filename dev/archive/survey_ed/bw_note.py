import json, os, re, glob
SP = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(SP, 'bw_survey.json')))
D = json.load(open(os.path.join(SP, 'bw_detail.json')))
names = {m['id']: m['name'] for m in json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf-8'))['monsters']}
DELIB = {1106, 1500, 1200, 1201} | set(range(1130, 1138)) | set(range(1301, 1316))
SHARED_OK = {1100, 1108}          # driven by SharedStates (the Poisoned / Dung toggles); the classifier miscounts them
soak = {}
for f in glob.glob(os.path.join(SP, 'bw_soak', '*.log')):
    mon = os.path.basename(f)[:-4]
    t = open(f, encoding='utf-8', errors='replace').read()
    last = [l for l in t.splitlines() if 'motions played' in l]
    ref = [re.sub(r'\s+', ' ', l.strip())[:160] for l in t.splitlines() if 'REFUSED' in l]
    soak[mon] = (last[-1].split(': ', 1)[1] if last else 'no result', ref)

L = []
L.append('# Brute Wyverns -- effects survey (Viewer agent, 2026-10-15)\n')
L.append('Raven: "Start looking over the flying wyverns now ... Check to ensure all effects for each have been implemented. '
         'If they have not been implemented, see what effects they have, make a note, then move onto the next monster for the '
         'time being."\n')
L.append('## How it was measured\n')
L.append('- **Exported / firing**: efx/effects_status.py per record (clip bits, shells, rage, MOTION_STATES events, the shared '
         'states). Two corrections to its output: c 1100 (Poisoned) and c 1108 (Dung Bombed) are driven by SharedStates from the '
         'state toggles -- the classifier returns `wired` for any `event` record before it checks the shared keys -- and the '
         'deliberate exclusions are not gaps: blast c 1130-1137, notice c 1200/1201 (off the list), hyper u 1301-1315 (withheld), '
         'c 1500 (lying in water), c 1106 (Raven).')
L.append('- **The PSL enable word**: add_effects.py plan() run twice -- on the blocks\' FILE masks (what the viewer binds today '
         'for a monster whose class +0x13c is unread) and on the WHOLE blocks (every named bit). The difference is what the game '
         'decides with the monster\'s enemy +0x13f4 word: those bindings may fire in the game and are not bound in the viewer '
         '(Boltreaver had 102, Bloodbath 11 C-group + 4 mis-gated). Only Basarios, Bloodbath and Boltreaver have the word read '
         '(psl-mask.js PSL_MASK_MONSTERS). `*` = named outside the file mask. A name with no file (`-`) is a bit naming a key '
         'that has no record in any array: not an effect.')
L.append('- **Refusals**: dev/effect-live-soak.mjs <mon> --viewer-inputs, every bound motion in the viewer. A refusal stops '
         'every effect of the monster until reload.\n')
L.append('## Summary\n')
L.append('| # | monster | exported | firing | gaps (undriven, not deliberate) | enable word | bindings outside file mask | PSL records not exported (with a file) | soak |')
L.append('|---|---|---|---|---|---|---|---|---|')
for i, (mon, r) in enumerate(S.items(), 1):
    ow = []
    for w in r['wiredList']:
        k = int(w.split('(')[0][1:])
        if k in DELIB or k in SHARED_OK: continue
        ow.append(w)
    det = D.get(mon, {})
    ne = [k for k, v in det.items() if not v['exported'] and v['efl']]
    sk = soak.get(mon, ('not run', []))
    L.append('| %d | %s `%s` | %d | %d | %s | %s | %d | %s | %s |' % (
        i, names.get(mon, mon), mon, r['exported'], r['implemented'] + sum(1 for w in r['wiredList'] if int(w.split('(')[0][1:]) in SHARED_OK),
        ' '.join(ow) or '--', 'read' if r['enableWordRead'] else '**unread**', r['outsideMaskBindings'],
        ' '.join(ne) or '--', ('**%d refused**' % len(sk[1])) if sk[1] else 'clean'))
L.append('')
L.append('## Per monster\n')
for mon, r in S.items():
    L.append('### %s (`%s`)\n' % (names.get(mon, mon), mon))
    sk = soak.get(mon, ('not run', []))
    L.append('- Soak: %s' % sk[0])
    for x in sk[1]: L.append('  - REFUSED: `%s`' % x)
    if r['enableWordRead']:
        L.append('- Enable word read: every named PSL bit is bound as the class gives it.')
    else:
        L.append('- Enable word **unread**: %d bindings named outside the file mask (%d file-mask bindings, %d whole-block).'
                 % (r['outsideMaskBindings'], r['pslBindingsFileMask'], r['pslBindingsWhole']))
    ow = [w for w in r['wiredList'] if int(w.split('(')[0][1:]) not in DELIB | SHARED_OK]
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
    L.append('')
L.append('## What closing each needs (in the order the gaps recur)\n')
L.append('1. **Read the class\'s PSL enable word** (enemy vt+0x13c; the method that ORs bits 15-31 over the base 0xca170) and '
         'transcribe it in psl-mask.js, then add_effects.py --apply / --record / --check -- as done for Basarios (0xd2e0ec), '
         'Bloodbath (0xd4532c) and Boltreaver (0x1019eb4). The classes, not the variants, are the unit: Rathian / Gold / '
         'Dreadqueen share uEm001_00, the Rathalos line uEm002_00, Diablos / Bloodbath uEm007_00 (read: one word, variant 4 '
         'arm), Tigrex / Grimclaw uEm032_00, Nargacuga / Silverwind uEm037_00, Astalos / Boltreaver uEm081_00 (read for '
         'variant 4 only; variant 0 ORs the charge-keyed bits 15-29, unread).')
L.append('2. **The 0x9b76e4 refusal** (Gravios L4 M59/M60, Tigrex and Grimclaw L0 M76): one unrecorded path, record and lift.')
L.append('3. **Undriven non-deliberate records** listed per monster (shells with no SHELL_DATA driver -- Silverwind\'s 13; '
         'MOTION_STATES rows missing for state events; rage puffs on monsters not in _autoOnRage).')
open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\brute-wyverns-effects-survey.md', 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('\n'.join(L[:40]))

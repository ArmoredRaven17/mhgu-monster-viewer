"""The remaining classes' effects survey note (adapted from bw_note.py): data blocks generated, assessment from assess_*.md."""
import json, os, re, glob
SP = os.path.dirname(os.path.abspath(__file__))
S = json.load(open(os.path.join(SP, 'survey.json')))
D = json.load(open(os.path.join(SP, 'detail.json')))
LAY = json.load(open(os.path.join(SP, 'layers.json')))
names = {m['id']: m['name'] for m in json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json', encoding='utf-8'))['monsters']}
names['em087_00'] = names.get('em087_00') or 'Ahtal-Neset'   # null in monsters.json; part-review.json authors the name
DELIB = {1106, 1500, 1200, 1201} | set(range(1130, 1138)) | set(range(1301, 1316))
SHARED_OK = {1100, 1108}
# READ absences (not gaps): Thunderlord has no tired state, so the shared c 1104 drool never fires for him
READ_ABSENT = {('em057_04', 'c1104(event)'): 'c1104 (no tired state: [tune+0x30] NULL, motion-states.js em057_04 header)'}
CATS = [('Fanged Wyvern', ['em057_00', 'em057_04']), ('Snake Wyvern', ['em068_00']), ('Temnoceran', ['em070_00']),
        ('Unclassified', ['em087_00']), ("'???' (docs/monster-classes.json)", ['em071_00', 'em071_05'])]
WORD = {'em057_00': 'override 0xf0279c', 'em057_04': 'override 0xf0279c', 'em068_00': 'override 0xf88044 (read)',
        'em070_00': 'override 0xfab634 (read)', 'em071_00': 'override 0xfc08a8 (read)', 'em071_05': 'override 0xfc08a8 (read)',
        'em087_00': 'override 0x10ad838 (part read)'}

soak = {}
for f in glob.glob(os.path.join(SP, 'soak', '*.log')):
    mon = os.path.basename(f)[:-4]
    t = open(f, encoding='utf-8', errors='replace').read()
    last = [l for l in t.splitlines() if 'motions played' in l]
    ref = [re.sub(r'\s+', ' ', l.strip())[:200] for l in t.splitlines() if 'REFUSED' in l]
    soak[mon] = (last[-1].split(': ', 1)[1] if last else ('viewer never came up' if 'never came up' in t else 'no result'), ref)


def gaps(mon, r):
    ow, ra = [], []
    for w in r['wiredList']:
        k = int(w.split('(')[0][1:])
        if k in DELIB or k in SHARED_OK:
            continue
        if (mon, w) in READ_ABSENT:
            ra.append(READ_ABSENT[(mon, w)])
            continue
        ow.append(w)
    return ow, ra


def assess(name):
    p = os.path.join(SP, 'assess_%s.md' % name)
    return open(p, encoding='utf-8').read().rstrip('\n') if os.path.exists(p) else '(assessment missing)'


L = []
L.append('# Remaining classes -- effects survey: Fanged Wyvern, Snake Wyvern, Temnoceran, Unclassified, \'???\' (survey agent for the Viewer agent, 2026-10-15)\n')
L.append('Raven: "For each category of large monster remaining, have a sub agent assess the missing effects."\n')
L.append('Seven monsters, five classes: Zinogre / Thunderlord Zinogre (uEm057_00), Najarala (uEm068_00), Nerscylla (uEm070_00), '
         'Ahtal-Neset (uEm087_00), Gore Magala / Chaotic Gore Magala (uEm071_00). Assess only: nothing under docs/ was changed, '
         'no recorder or lift was run.\n')
L.append(assess('method'))
L.append('')
L.append('## Summary\n')
L.append('| # | class | monster | exported | firing | gaps (undriven, not deliberate) | enable word (vt+0x13c) | bindings outside file mask | PSL records not exported (with a file) | soak |')
L.append('|---|---|---|---|---|---|---|---|---|---|')
i = 0
for cat, mons in CATS:
    for mon in mons:
        i += 1
        r = S[mon]
        ow, ra = gaps(mon, r)
        det = D.get(mon, {})
        ne = [k for k, v in det.items() if not v['exported'] and v['efl']]
        sk = soak.get(mon, ('not run', []))
        firing = r['implemented'] + sum(1 for w in r['wiredList'] if int(w.split('(')[0][1:]) in SHARED_OK)
        L.append('| %d | %s | %s `%s` | %d | %d | %s | %s | %d | %s | %s |' % (
            i, cat.split(' (')[0], names.get(mon, mon), mon, r['exported'], firing, ' '.join(ow) or '--', WORD[mon],
            r['outsideMaskBindings'], ' '.join(ne) or '--',
            ('**%d refused**' % len(sk[1])) if sk[1] else ('clean' if 'motions played' in sk[0] or 'refused' in sk[0] else sk[0])))
L.append('')
L.append('`firing` counts c 1100 / c 1108 (SharedStates). Thunderlord\'s c 1104 is not counted as a gap: he has no tired state '
         '(read). The PSL counts are the PSL motion layer only; the shell and class-code layers are counted per monster below '
         '(from dev/effects-triage/<mon>.md, which predates later exports -- regenerate before trusting a count).\n')
for cat, mons in CATS:
    L.append('## %s\n' % cat)
    for mon in mons:
        r = S[mon]
        L.append('### %s (`%s`)\n' % (names.get(mon, mon), mon))
        sk = soak.get(mon, ('not run', []))
        L.append('- Soak: %s' % sk[0])
        for x in sk[1]:
            L.append('  - REFUSED: `%s`' % x)
        L.append('- Enable word **not transcribed** (not in PSL_MASK_MONSTERS): %d bindings named outside the file mask (%d file-mask bindings, %d whole-block).'
                 % (r['outsideMaskBindings'], r['pslBindingsFileMask'], r['pslBindingsWhole']))
        ow, ra = gaps(mon, r)
        if ow:
            L.append('- Exported but undriven (not deliberate): %s' % ' '.join(ow))
        if ra:
            L.append('- Exported, undriven, and correctly so (read absence): %s' % '; '.join(ra))
        det = D.get(mon, {})
        if det:
            L.append('- Records the whole blocks name that the viewer does not fire (`*` = outside the file mask):')
            for k, v in det.items():
                if not v['efl']:
                    continue
                L.append('  - %s %s `%s` (%s): %s%s' % (k, 'exported' if v['exported'] else '**not exported**', v['efl'],
                         v['types'], ' '.join(v['motions'][:8]), ' +%d more' % (v['nMotions'] - 8) if v['nMotions'] > 8 else ''))
            empty = [k for k, v in det.items() if not v['efl']]
            if empty:
                L.append('  - named with no record in any array (not effects): %s' % ' '.join(empty))
        lay = LAY.get(mon, {})
        for k, lab in (('shells', 'Shell-layer records not exported (no SHELL_DATA entry)'),
                       ('class', 'Class-code records not exported (request sites unread)')):
            ne = [x for x in lay.get(k, []) if not x[2]]
            if ne:
                L.append('- %s: %d -- %s' % (lab, len(ne), ' '.join('%s `%s`' % (x[0], x[1]) for x in ne)))
        L.append('')
        L.append(assess(mon))
        L.append('')
L.append(assess('closing'))
open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\remaining-classes-effects-survey.md', 'w', encoding='utf-8', newline='\n').write('\n'.join(L) + '\n')
print('\n'.join(L[:30]))

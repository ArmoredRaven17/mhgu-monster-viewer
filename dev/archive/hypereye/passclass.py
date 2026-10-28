# hypereye/passclass.py (hyper-eye lane, 2026-10-27): passaudit.out -> the changed records, classed by what the 0x15 -> 0x11 change does:
#   SUB    a changed row (unsorted at 0x15: depth WRITE) is subtractive (RevSub*): it darkens, and its depth write hides what the record
#          draws behind it after it (the GU Hyper eye's halo over its core): black at 0x15, lit at 0x11
#   OCC    changed rows only add / blend, and the record draws other rows: a changed row's depth write can hide those (and itself in parts)
#   SOLO   the changed rows are the record's only model rows: no row of its own to hide; the change is its depth write against later
#          effects and its own overlapping particles
# Writes passchanged.jsonl (SUB first) for pagepass.mjs and prints the tallies.
#   python dev/archive/hypereye/passclass.py
import json, os, collections
H = os.path.dirname(os.path.abspath(__file__))
recs, summary = [], None
for l in open(os.path.join(H, 'passaudit.out'), encoding='utf8'):
    if l.startswith('SUMMARY'): summary = l.strip(); continue
    if not l.startswith('{'): continue
    d = json.loads(l)
    if d.get('refused') or not d.get('changed'): continue
    ch = [r for r in d['rows'] if r['unsorted15'] > 0]
    sub = any('RevSub' in r['id'] for r in ch)
    cls = 'SUB' if sub else ('OCC' if len(d['rows']) > len(ch) else 'SOLO')
    recs.append(dict(mon=d['mon'], key=d['key'], when=d['when'], efl=d['efl'], cls=cls, changed=[r['id'] for r in ch]))
order = {'SUB': 0, 'OCC': 1, 'SOLO': 2}
recs.sort(key=lambda r: (order[r['cls']], r['mon'], r['key']))
with open(os.path.join(H, 'passchanged.jsonl'), 'w', encoding='utf8') as f:
    for r in recs: f.write(json.dumps(r) + '\n')
print(summary)
print('changed records', len(recs), dict(collections.Counter(r['cls'] for r in recs)))
print('monsters with a change', len({r['mon'] for r in recs}))
print('by when', dict(collections.Counter(r['when'] for r in recs)))
print('changed rows (model#mesh blend), top 15:', collections.Counter(c for r in recs for c in r['changed']).most_common(15))
for r in recs:
    if r['cls'] == 'SUB': print('SUB', r['mon'], r['key'], r['when'], r['efl'], r['changed'])

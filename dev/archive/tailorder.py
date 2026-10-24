import os, json
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'

# ---- part-review.json ----
p = os.path.join(D, 'part-review.json')
t = open(p, encoding='utf-8', newline='').read()
def entry_span(mid):
    i = t.index('"' + mid + '": {')
    depth = 0
    for pos in range(t.index('{', i), len(t)):
        if t[pos] == '{': depth += 1
        elif t[pos] == '}':
            depth -= 1
            if depth == 0: return i, pos + 1
# Glavenus: rungs Sharpened / Dulled / Heated; each option key's segments follow (S | H | D -> S | D | H)
i, j = entry_span('em080_00')
seg = t[i:j]
a = '"Sharpened",'
assert seg.count('"rungs": [') == 1
import re
m = re.search(r'"rungs": \[\s*"Sharpened",\s*"Heated",\s*"Dulled"\s*\]', seg)
assert m, 'glavenus rungs'
seg = seg[:m.start()] + '"rungs": ["Sharpened", "Dulled", "Heated"]' + seg[m.end():]
for old in ['5,6,107|5,6,40,45,47,107|5,6,107', '6,15,16,107|6,15,16,40,46,47,55,56,107|6,15,16,107', '15,17|15,17,40,55,57|15,17']:
    a, b, c = old.split('|')
    new = '|'.join([a, c, b])
    n = seg.count('"' + old + '"')
    assert n >= 2, (old, n)
    seg = seg.replace('"' + old + '"', '"' + new + '"')
t = t[:i] + seg + t[j:]
# Hellblade: rungs Blasted / Heated, Blasted the first (so no default needed)
i, j = entry_span('em080_04')
seg = t[i:j]
m = re.search(r'"rungs": \[\s*"Heated",\s*"Blasted"\s*\],?', seg)
assert m, 'hellblade rungs'
seg = seg[:m.start()] + '"rungs": ["Blasted", "Heated"],' + seg[m.end():]
m = re.search(r'\s*"default": 1,', seg)
assert m, 'hellblade default'
seg = seg[:m.start()] + seg[m.end():]
t = t[:i] + seg + t[j:]
d = json.loads(t)
assert d['em080_00']['levels']['rungs'] == ['Sharpened', 'Dulled', 'Heated']
assert d['em080_04']['levels']['rungs'] == ['Blasted', 'Heated'] and 'default' not in d['em080_04']['levels']
r = d['em080_00']['rows']['5,6,15,16,17,40,45,46,47,55,56,57,107']
assert r['default'] == '5,6,107|5,6,107|5,6,40,45,47,107' and all(k in r['options'] for k in r['order'])
open(p + '.tmp', 'w', encoding='utf-8', newline='').write(t); os.replace(p + '.tmp', p)

# ---- monster.js ----
q = os.path.join(D, 'render', 'monster.js')
s = open(q, encoding='utf-8', newline='').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, (s.count(a), a[:80])
    s = s.replace(a, b)
rep("""  // GLAVENUS's TAIL STATE (em080_00; part-review.json `levels` Sharpened / Heated / Dulled, Raven 2026-10-15). The tail""",
    """  // GLAVENUS's TAIL STATE (em080_00; part-review.json `levels` Sharpened / Dulled / Heated -- Raven's order, 2026-10-17). The tail""")
rep("""    byLevel: ['normal', 'normal', 'dark_Change_Loop_End'],""", """    byLevel: ['normal', 'dark_Change_Loop_End', 'normal'],""")
rep("""  // HELLBLADE's TAIL STATE (em080_04; part-review `levels` Heated / Blasted, Raven 2026-10-17 "the same layout as Glavenus"):""",
    """  // HELLBLADE's TAIL STATE (em080_04; part-review `levels` Blasted / Heated, Raven 2026-10-17 "the same layout as Glavenus"):""")
rep("""    byLevel: ['heat_Loop', 'overheat_Loop'],""", """    byLevel: ['overheat_Loop', 'heat_Loop'],""")
rep("""    level: { tailBlast: [1] },""", """    level: { tailBlast: [0] },""")
open(q + '.tmp', 'w', encoding='utf-8', newline='').write(s); os.replace(q + '.tmp', q)
print('ok')

import json, sys
KEYS = {200, 201, 210}
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects\em082_04.json'
t = open(P, encoding='utf8', newline='').read()
NL = '\r\n' if '\r\n' in t else '\n'
L = t.split(NL)
# the effects array's entries open with '  {' and close with '  }' / '  },' at indent 2
starts = [i for i, l in enumerate(L) if l == '  {']
hits = []
for s in starts:
    e = s
    while not (L[e] in ('  }', '  },')): e += 1
    blob = NL.join(L[s:e + 1]).rstrip(',')
    o = json.loads(blob)
    r = o.get('record') or {}
    if o.get('when') == 'shell' and r.get('pel') == 'em082_04u' and r.get('key') in KEYS: hits.append((s, e))
if not hits: sys.exit('no hits')
for s_, e in reversed(hits):
    if L[e] == '  }':
        assert L[s_ - 1] == '  },'; L[s_ - 1] = '  }'
    del L[s_:e + 1]
out = NL.join(L)
j = json.loads(out)
assert not any(x.get('record', {}).get('key') in KEYS and x.get('record', {}).get('pel') == 'em082_04u' and x.get('when') == 'shell' for x in j['effects'])
open(P, 'w', encoding='utf8', newline='').write(out)
print('removed', len(hits), 'effects', len(j['effects']))

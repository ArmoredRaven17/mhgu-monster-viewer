import json, sys
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects\em046_00.json'
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
    if o.get('when') == 'shell' and r.get('pel') == 'em046_00u' and r.get('key') == 61: hits.append((s, e))
if len(hits) != 1: sys.exit('hits %r' % hits)
s, e = hits[0]
if L[e] == '  }':                      # the last entry: drop the comma of the one before
    assert L[s - 1] == '  },'; L[s - 1] = '  }'
del L[s:e + 1]
out = NL.join(L)
j = json.loads(out)
assert not any(x.get('record', {}).get('key') == 61 and x.get('record', {}).get('pel') == 'em046_00u' for x in j['effects'])
open(P, 'w', encoding='utf8', newline='').write(out)
print('removed lines', s, e, 'effects', len(j['effects']))

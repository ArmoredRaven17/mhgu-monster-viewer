import re
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
L = open(P, encoding='utf-8').read().split('\n')
def cells(x): return len(re.split(r'(?<!\\)\|', x.strip().strip('|')))
def section(head):
    s = [i for i, x in enumerate(L) if x.startswith(head)][0]
    e = s + 1
    while not L[e].startswith('### ') and not L[e].startswith('## '): e += 1
    return s, e
s, e = section('### Withdrawn — kept')
print('withdrawn', s + 1, e)
for i in range(s, e):
    if L[i].startswith('|') and cells(L[i]) != 3: print(i + 1, cells(L[i]), L[i][:150])
p, q = section('### The PSL enable word per class')
print('psl', p + 1, q, 'header', L[p + 2][:100] if L[p+2].startswith('|') else [x for x in L[p:p+8] if x.startswith('|')][0][:100])
hdr = [x for x in L[p:q] if x.startswith('|')][0]
n = cells(hdr)
for i in range(p, q):
    if L[i].startswith('|') and (cells(L[i]) != n or 'gapK' in L[i]): print(i + 1, cells(L[i]), L[i][:150])
si, se = section('### Shell infrastructure')
print('SI', si + 1, se)
for i in range(si, se):
    if L[i].startswith('|'): print(i + 1, cells(L[i]), L[i][:60]);
    if i > si + 6: break
print('--- SI rows by cells')
from collections import Counter
c = Counter()
for i in range(si, se):
    if L[i].startswith('|'):
        n = cells(L[i]); c[n] += 1
        if n != 5: print(i + 1, n, L[i][:140])
print(c)

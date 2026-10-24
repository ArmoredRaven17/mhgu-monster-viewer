# addwd.py <rows.txt>: append rows to the end of the rom-map Withdrawn table
import sys, io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
t = io.open(P, encoding='utf8', newline='').read(); nl = '\r\n' if '\r\n' in t else '\n'
rows = [l for l in io.open(sys.argv[1], encoding='utf8').read().split('\n') if l.strip()]
k = t.index('### Withdrawn ' + chr(0x2014) + ' kept so they are not rediscovered')
e = t.index(nl + nl, t.index('| claim |', k))
t = t[:e] + nl + nl.join(rows) + t[e:]
io.open(P, 'w', encoding='utf8', newline='').write(t); print('ok', len(rows))

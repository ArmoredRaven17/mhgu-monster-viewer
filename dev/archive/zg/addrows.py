# addrows.py <rows.txt> [tool]  -- append rows to the 2026-10-19 open-items section of rom-map.md (made if missing),
# or with 'tool' insert them at the end of the tooling table (before '### Lift roots').
import sys, io
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
t = io.open(P, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in t else '\n'
rows = [l.rstrip('\r\n') for l in io.open(sys.argv[1], encoding='utf8').read().split('\n') if l.strip()]
H = '### Effects open items -- the sweep\'s reads (Fanged-Wyvern effects agent, 2026-10-19; dev/effects-open-items.md)'
if len(sys.argv) > 2 and sys.argv[2] == 'tool':
    k = t.index(nl + '### Lift roots')
    t = t[:k].rstrip('\r\n') + nl + nl.join(rows) + nl + nl + t[k + len(nl):]
else:
    if H not in t:
        k = t.index(nl + '## 1b. The decode notes')
        t = t[:k].rstrip('\r\n') + nl + nl + H + nl + nl + '| address | what | class | st | detail |' + nl + '|---|---|---|---|---|' + nl + nl + t[k + len(nl):]
    k = t.index(H)
    e = t.index(nl + nl, t.index('|---|', k))
    t = t[:e] + nl + nl.join(rows) + t[e:]
io.open(P, 'w', encoding='utf8', newline='').write(t)
print('ok', len(rows))

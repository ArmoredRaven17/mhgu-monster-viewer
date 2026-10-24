# romins.py <kind> <rows file> [anchor text]: insert table rows into dev/rom-map.md (CRLF kept, os.replace of a .tmp)
#   kind 'after-anchor-table': after the |---| separator of the first table following the line containing the anchor text
#   kind 'withdrawn': after the Withdrawn table's separator; 'tooling': after the "## 2. Tooling" table's separator
import sys, os
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
kind, rows_file = sys.argv[1], sys.argv[2]
anchor = sys.argv[3] if len(sys.argv) > 3 else None
b = open(P, 'rb').read()
nl = b'\r\n' if b'\r\n' in b else b'\n'
rows = [l.rstrip('\r\n') for l in open(rows_file, encoding='utf8') if l.startswith('|')]
assert rows, 'no rows'
if kind == 'withdrawn': anchor = '### Withdrawn'
elif kind == 'tooling': anchor = '## 2. Tooling'
i = b.index(anchor.encode('utf8'))
j = b.index(b'|---', i)
k = b.index(nl, j) + len(nl)
ins = nl.join(r.encode('utf8') for r in rows) + nl
b = b[:k] + ins + b[k:]
open(P + '.tmp', 'wb').write(b)
os.replace(P + '.tmp', P)
print('inserted', len(rows), 'rows after', anchor[:60])

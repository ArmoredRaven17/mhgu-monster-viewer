# rmops.py <RESULT.md> <ops.json>: apply a decode helper's rom-map blocks (section (c)) to dev/rom-map.md.
# ops: list of [op, block, lines, arg]: op 'after-row' (insert after the first row starting with arg), 'replace-row' (replace the
# first row starting with arg by the line), 'withdrawn' / 'tooling' (after that table's separator), 'trap' (after the last numbered
# trap line, renumbered to the next number). `lines` a list of line indices of the block, or null for all.
import sys, re, json, os
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md'
t = open(sys.argv[1], encoding='utf8').read()
c = t[t.index('## (c)'):]
nxt = re.search(r'\n## \(d\)', c)
c = c[:nxt.start()] if nxt else c
blocks = [b.splitlines() for b in re.findall(r'```[a-z]*\n(.*?)```', c, re.S)]
ops = json.load(open(sys.argv[2]))
b = open(P, 'rb').read().decode('utf8')
nl = '\r\n' if '\r\n' in b else '\n'
L = b.split(nl)
def sep_after(head):
    i = next(k for k, l in enumerate(L) if l.startswith(head))
    return next(k for k in range(i, len(L)) if L[k].startswith('|---'))
for op, bi, idx, arg in ops:
    rows = [blocks[bi][j] for j in (idx if idx is not None else range(len(blocks[bi])))]
    if op == 'after-row':
        i = next(k for k, l in enumerate(L) if l.startswith(arg)); L[i + 1:i + 1] = rows
    elif op == 'replace-row':
        i = next(k for k, l in enumerate(L) if l.startswith(arg)); L[i] = rows[0]
    elif op == 'withdrawn':
        i = sep_after('### Withdrawn'); L[i + 1:i + 1] = rows
    elif op == 'tooling':
        i = sep_after('## 2. Tooling'); L[i + 1:i + 1] = rows
    elif op == 'trap':
        nums = [(k, int(m.group(1))) for k, l in enumerate(L) for m in [re.match(r'^(\d+)\. \*\*', l)] if m]
        k, n = max(nums, key=lambda x: x[1])
        r = re.sub(r'^\d+\.', '%d.' % (n + 1), ' '.join(x.strip() for x in rows)); L[k + 1:k + 1] = [r]
    print(op, len(rows))
open(P + '.tmp', 'wb').write(nl.join(L).encode('utf8'))
os.replace(P + '.tmp', P)

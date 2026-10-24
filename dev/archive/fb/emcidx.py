import subprocess, sys
from collections import defaultdict
out = subprocess.run([sys.executable, 'fb/emcdump.py', sys.argv[1]], capture_output=True, text=True).stdout
m = defaultdict(set)
for line in out.splitlines():
    ops = line.split(': ', 1)[1].split(' | ')
    for i, o in enumerate(ops):
        if o.startswith('a3 00 '):
            idx = int(o.split()[2], 16)
            nxt = ops[i + 1] if i + 1 < len(ops) else ''
            if nxt.startswith('00 '):
                b = nxt.split(); m[idx].add('(%d,%#x)' % (int(b[1], 16), int(b[2], 16)))
            else: m[idx].add('next:' + nxt)
for k in sorted(m): print(k, sorted(m[k]))

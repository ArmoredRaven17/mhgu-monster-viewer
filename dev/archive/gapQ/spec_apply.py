import os, sys
G = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\gapQ'
p = r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\em063_00-effects-spec.md'
meter = sys.argv[1] if len(sys.argv) > 1 else ''
d = open(p, 'rb').read().decode('utf-8')
N = '\r\n'
assert d.count(N) == d.count('\n')
s = open(os.path.join(G, 'spec5a.md'), encoding='utf-8').read()
s = s.replace('METERLINE\n', (meter + '\n') if meter else '')
s = s.replace('\n', N)
anchor = '## Open items read (2026-10-19)'
assert d.count(anchor) == 1
if '## 5a. The shells' in d:
    a = d.index('## 5a. The shells'); b = d.index(anchor)
    d = d[:a] + s + N + d[b:]
else:
    d = d.replace(anchor, s + N + anchor)
old = 'SHELL_DATA yet -- the shells lane.'
if old in d and 'section 5a.**' not in d:
    d = d.replace(old, 'SHELL_DATA yet -- the shells lane. -> **Built 2026-10-25: section 5a.**')
open(p + '.tmp', 'wb').write(d.encode('utf-8'))
os.replace(p + '.tmp', p)
print('spec ok')

# rmapply.py <RESULT.md>: pull the fenced blocks of section (c) out as lists of lines (printed with indices) -- a helper for the edits
import sys, re
t = open(sys.argv[1], encoding='utf8').read()
c = t[t.index('## (c)'):]
nxt = re.search(r'\n## \(d\)', c)
c = c[:nxt.start()] if nxt else c
for i, b in enumerate(re.findall(r'```[a-z]*\n(.*?)```', c, re.S)):
    for j, l in enumerate(b.splitlines()): print(i, j, l[:110])

import re, sys
P = r'C:\Users\humph\.claude\projects\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\subagents\agent-a2ee209ce9705cfa5.jsonl'
L = open(P, encoding='utf-8').read().splitlines()
pat = re.compile(r'.{0,220}(?:' + sys.argv[1] + r').{0,220}')
seen = set()
for l in L[-300:]:
    for m in pat.finditer(l):
        h = m.group(0)
        if h in seen: continue
        seen.add(h); print('---', h)
        if len(seen) > 30: sys.exit()

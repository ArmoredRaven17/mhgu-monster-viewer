import sys, ast, glob, re
def load(p):
    S = {}
    for l in open(p):
        m = re.match(r"(\d+) (\S+) (\[.*?\]) (\{.*\})$", l.strip())
        if not m: continue
        d = ast.literal_eval(m.group(4))
        S[m.group(2)] = sorted(set(' '.join(k.split()[:2]) + ' ' + k.split()[3] for k in d))
    return S
B = load(sys.argv[1])
for p in sys.argv[2:]:
    S = load(p); print('==', p)
    for a in sorted(set(B) | set(S)):
        if B.get(a) != S.get(a): print('  ', a, 'base', B.get(a), '->', S.get(a))

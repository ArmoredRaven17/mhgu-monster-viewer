import json, re, sys, os
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer'
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
src = open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(V, 'dev', 'archive', 'zg', 'attrace_all.py')).read()
SHARED = eval(re.search(r'SHARED = (\{.*\})', src).group(1))
import emclasses
CL = emclasses.load()
nm = {}
for l in open(os.path.join(V, 'dev', 'notice-marks.md'), encoding='utf8'):
    m = re.match(r'### .* -- (em\d{3}_\d\d) -- (uEm\d{3}_00)', l)
    if m: nm[m[1]] = m[2]
mj = json.load(open(os.path.join(V, 'docs', 'monsters.json')))
ok = bad = 0; nocls = []; notin = []
for m in mj['monsters']:
    i = m['id']; mm = re.match(r'em(\d{3})_(\d\d)$', i)
    if not mm: continue
    n = int(mm[1]); c = 'uEm%03d_00' % SHARED.get(n, n)
    if c not in CL: nocls.append(i); continue
    if i in nm:
        if nm[i] == c: ok += 1
        else: bad += 1; print('BAD', i, c, nm[i])
    else: notin.append((i, c))
# the old rule, as a control: it must reproduce the two known errors
old_bad = []
for m in mj['monsters']:
    i = m['id']; mm = re.match(r'em(\d{3})_(\d\d)$', i)
    if not mm or i not in nm: continue
    n = int(mm[1]); c = None
    for k in range(n, max(n - 3, 0), -1):
        if 'uEm%03d_00' % k in CL: c = 'uEm%03d_00' % k; break
    if c != nm[i]: old_bad.append((i, c, nm[i]))
print('new rule: agree', ok, 'disagree', bad, 'refused', nocls, 'not in notice-marks', notin)
print('old rule (control): disagree', old_bad)

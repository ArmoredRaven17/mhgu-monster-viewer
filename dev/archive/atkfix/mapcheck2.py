import json, re, sys
V = 'C:/MHGU-Extract/MHGU-Monster-Viewer'
nm = {}
for l in open(V + '/dev/notice-marks.md', encoding='utf8'):
    m = re.match(r'### .* -- (em\d{3}_\d\d) -- (uEm\d{3}_00)', l)
    if m: nm[m[1]] = m[2]
for p in sys.argv[1:]:
    S = eval(re.search(r'(?m)^SHARED = (\{.*\})', open(p).read()).group(1))
    bad = [(i, S.get(i[2:5], 'uEm%s_00' % i[2:5]), c) for i, c in nm.items() if S.get(i[2:5], 'uEm%s_00' % i[2:5]) != c]
    print(p, 'agree', len(nm) - len(bad), 'of', len(nm), bad)

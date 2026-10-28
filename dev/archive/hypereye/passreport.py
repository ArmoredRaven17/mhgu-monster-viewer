# hypereye/passreport.py (hyper-eye lane, 2026-10-27): pagepass.out -> per class, how many sampled records change visibly between 0x15 and
# 0x11 (changed px >= 400 AND > 2 x the same-pass noise of one step), and whether they read brighter (lit) or darker under 0x11; the meter
# verdicts at 0x11; the largest real changes.
#   python dev/archive/hypereye/passreport.py
import re, json, collections, os
H = os.path.dirname(os.path.abspath(__file__))
rows = []
for l in open(os.path.join(H, 'pagepass.out'), encoding='utf8'):
    m = re.match(r'(PASS|FAIL) PASS-PAIR (\S+) (\S+) ?(\S*) ?(\S*)\s+-- (.*)', l.strip())
    if not m: continue
    ok, mon, key, when, cls, rest = m.groups()
    try: d = json.loads(rest)
    except Exception: rows.append(dict(mon=mon, key=key, err=rest[:120])); continue
    rows.append(dict(mon=mon, key=key, when=when, cls=cls, **d))
good = [r for r in rows if 'err' not in r]
print('measured', len(good), 'errors', [(r['mon'], r['key'], r['err']) for r in rows if 'err' in r])
t = collections.defaultdict(collections.Counter)
for r in good:
    real = r['diffPx'] >= 400 and r['diffPx'] > 2 * r['noisePx']
    t[r['cls']]['n'] += 1
    t[r['cls']]['visible' if real else 'not visible'] += 1
    if real: t[r['cls']]['brighter at 0x11' if r['dLuma'] > 2 else ('darker at 0x11' if r['dLuma'] < -2 else 'same luma')] += 1
for c in ('SUB', 'OCC', 'SOLO'): print(c, dict(t[c]))
print('meter at 0x11: ', collections.Counter((r['meter11'] or {}).get('verdict') for r in good))
real = sorted([r for r in good if r['diffPx'] >= 400 and r['diffPx'] > 2 * r['noisePx']], key=lambda r: -r['diffPx'])
for r in real[:30]: print(' ', r['mon'], r['key'], r['when'], r['cls'], 'px', r['diffPx'], 'noise', r['noisePx'], 'dLuma', r['dLuma'], 'shot', r['shot'])

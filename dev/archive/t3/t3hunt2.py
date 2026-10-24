# t3hunt2.py -- the 0x7dd4dc -> 0x7dd57c path: the hunter's line meets the cylinder's axis exactly (0x7ebfd8's point on the axis,
# s18 <= 1.19e-7) with R^2 below that (R < 3.4e-4): appended to t3diff.json as 'targeted'
import json, struct, random
exec(open('t3hunt.py').read().split('random.seed(99)')[0])
random.seed(5); keep = []; got = set()
for n in range(4000):
    R = random.choice([1e-4, 2e-4, 3e-4, 1e-5, 0.0]); L = random.uniform(10, 200); h = random.uniform(0, L)
    p0 = [0.0, 0.0, 0.0]; p1 = [0.0, L, 0.0]
    d = random.choice([[1, 0, 0], [0, 0, 1], [0.6, 0, 0.8]]); half = random.uniform(1, 100); c = [0.0, h, 0.0]
    a, b = (p0, p1, R), ([c[i] - d[i] * half for i in range(3)], [c[i] + d[i] * half for i in range(3)], random.uniform(5, 60))
    r, seen = run(a, b)
    if r and (seen - got):
        got |= seen; r['fam'] = 'targeted'; r['reach'] = sorted(hex(x) for x in seen if 0x7dd57c <= x <= 0x7dd5ac)[:2]; keep.append(r)
cs = json.load(open('t3diff.json')); cs += keep; json.dump(cs, open('t3diff.json', 'w'))
print('added', len(keep), '0x7dd57c reached:', 0x7dd57c in got)

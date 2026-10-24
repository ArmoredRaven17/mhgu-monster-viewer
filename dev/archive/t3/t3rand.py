# t3rand.py -- 60 random tilted cylinders x oblique hunter capsules through 0x167f70 native -> t3rand.json (t3check2.mjs compares)
import json, random
from t3emu import run
random.seed(int(__import__("sys").argv[1]) if len(__import__("sys").argv) > 1 else 7); out = []
for k in range(int(__import__("sys").argv[2]) if len(__import__("sys").argv) > 2 else 60):
    p0 = [random.uniform(-50, 50) for _ in range(3)]; ax = [random.uniform(-150, 150) for _ in range(3)]
    p1 = [p0[i] + ax[i] for i in range(3)]; R = random.uniform(20, 120)
    c = [random.uniform(-150, 150) for _ in range(3)]; dd = [random.uniform(-60, 60) for _ in range(3)]
    h0 = [c[i] - dd[i] for i in range(3)]; h1 = [c[i] + dd[i] for i in range(3)]; r = random.uniform(10, 50)
    m, pt = run((p0, p1, R), (h0, h1, r))
    out.append({'A': [p0, p1, R], 'B': [h0, h1, r], 'meets': m, 'point': pt if m else None})
json.dump(out, open('t3rand.json', 'w'))
print(sum(o['meets'] for o in out), 'of', len(out), 'meet')

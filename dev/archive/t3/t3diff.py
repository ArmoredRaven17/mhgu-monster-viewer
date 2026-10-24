# t3diff.py -- the type-3 test 0x167f70 run NATIVELY on the whole executable after its static initialisers (build/arm emu: the BSS
# axis constants 0x19176e0.. set), over the case families below; writes t3diff.json for t3diff.mjs (render/hit-type3.js, the
# transcription) to compare bit for bit.
#   families: 'aligned' (the 20 axis-aligned probes), 'rand7' (60, seed 7) and 'rand11' (400, seed 11) -- the 480 of the first
#   check; 'through' (the hunter's axis crossing the cylinder), 'rim' (skimming an end's rim), 'parallel' (the axes parallel, in and
#   outside), 'degenerate' (a zero-length hunter, a zero-length cylinder, axes along each other), 'scale' (game-sized: R 200..2000)
import sys, struct, json, random, math
sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import emu
E = emu.Emu(); uc = E.uc
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.fault = None; E.call(fn, (), tag='init', budget=2_000_000)
BLK = emu.HEAP_LO + 0xf00000
A, B, OUT = BLK, BLK + 0x40, BLK + 0x80
f32 = lambda x: struct.unpack('<f', struct.pack('<f', x))[0]
def blk(p0, p1, r): return struct.pack('<12f', *p0, 0, *p1, 0, r, 0, 0, 0)
def run(a, b):
    a = ([f32(v) for v in a[0]], [f32(v) for v in a[1]], f32(a[2])); b = ([f32(v) for v in b[0]], [f32(v) for v in b[1]], f32(b[2]))
    uc.mem_write(A, blk(*a)); uc.mem_write(B, blk(*b)); uc.mem_write(OUT, b'\xee' * 16)
    r0 = E.call(0x167f70, (A, B, OUT), tag='t3', budget=200000)
    if E.fault: return {'A': a, 'B': b, 'fault': str(E.fault)}
    out = list(struct.unpack('<4I', bytes(uc.mem_read(OUT, 16))))
    return {'A': a, 'B': b, 'meets': r0 & 0xff, 'out': out}
cases = []
hb = lambda x, y, z=0, r=10.0: ((x, y, z - 20), (x, y, z + 20), r)
seg = ((0, 0, 0), (0, 100, 0), 50.0)
for p in [(40, 50), (55, 50), (59, 50), (60, 50), (61, 50), (70, 50), (0, 105), (0, 109), (0, 110), (0, 111), (0, 150), (0, 160),
          (0, -5), (0, -10), (0, -11), (45, 130), (45, 108), (58, 105), (30, 140), (55, 100)]:
    cases.append(('aligned', seg, hb(*p)))
def rnd(seed, n):
    random.seed(seed); out = []
    for k in range(n):
        p0 = [random.uniform(-50, 50) for _ in range(3)]; ax = [random.uniform(-150, 150) for _ in range(3)]
        p1 = [p0[i] + ax[i] for i in range(3)]; R = random.uniform(20, 120)
        c = [random.uniform(-150, 150) for _ in range(3)]; dd = [random.uniform(-60, 60) for _ in range(3)]
        out.append(((p0, p1, R), ([c[i] - dd[i] for i in range(3)], [c[i] + dd[i] for i in range(3)], random.uniform(10, 50))))
    return out
for a, b in rnd(7, 60): cases.append(('rand7', a, b))
for a, b in rnd(11, 400): cases.append(('rand11', a, b))
random.seed(23)
def unit(v): l = math.sqrt(sum(x * x for x in v)); return [x / l for x in v]
def rvec(): return unit([random.uniform(-1, 1) for _ in range(3)])
def cross(a, b): return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
for k in range(300):                                   # through: the hunter's segment crosses the cylinder's inside
    p0 = [random.uniform(-50, 50) for _ in range(3)]; u = rvec(); L = random.uniform(20, 300); R = random.uniform(20, 150)
    h = random.uniform(-0.2, 1.2) * L; w = cross(u, rvec()); w = unit(w); rho = random.uniform(0, 1.1) * R
    c = [p0[i] + u[i] * h + w[i] * rho for i in range(3)]; d = rvec(); half = random.uniform(5, 200)
    cases.append(('through', (p0, [p0[i] + u[i] * L for i in range(3)], R), ([c[i] - d[i] * half for i in range(3)], [c[i] + d[i] * half for i in range(3)], random.uniform(5, 60))))
for k in range(300):                                   # rim: the hunter near an end's rim
    p0 = [random.uniform(-50, 50) for _ in range(3)]; u = rvec(); L = random.uniform(20, 300); R = random.uniform(20, 150)
    end = random.choice([0, 1]); w = unit(cross(u, rvec())); r = random.uniform(5, 60)
    base = [p0[i] + u[i] * L * end for i in range(3)]
    off = random.uniform(-1.5, 1.5) * r
    c = [base[i] + w[i] * (R + random.uniform(-1, 1) * r) + u[i] * off for i in range(3)]; d = rvec(); half = random.uniform(0, 80)
    cases.append(('rim', (p0, [p0[i] + u[i] * L for i in range(3)], R), ([c[i] - d[i] * half for i in range(3)], [c[i] + d[i] * half for i in range(3)], r)))
for k in range(150):                                   # parallel axes
    p0 = [random.uniform(-50, 50) for _ in range(3)]; u = rvec(); L = random.uniform(20, 300); R = random.uniform(20, 150)
    w = unit(cross(u, rvec())); rho = random.uniform(0, 2) * R; h = random.uniform(-1, 2) * L; half = random.uniform(0, 150)
    c = [p0[i] + u[i] * h + w[i] * rho for i in range(3)]
    cases.append(('parallel', (p0, [p0[i] + u[i] * L for i in range(3)], R), ([c[i] - u[i] * half for i in range(3)], [c[i] + u[i] * half for i in range(3)], random.uniform(5, 60))))
for k in range(100):                                   # degenerate
    p0 = [random.uniform(-50, 50) for _ in range(3)]; u = rvec(); L = random.choice([0.0, random.uniform(20, 300)]); R = random.uniform(20, 150)
    c = [random.uniform(-150, 150) for _ in range(3)]; d = rvec(); half = random.choice([0.0, random.uniform(5, 100)])
    cases.append(('degenerate', (p0, [p0[i] + u[i] * L for i in range(3)], R), ([c[i] - d[i] * half for i in range(3)], [c[i] + d[i] * half for i in range(3)], random.uniform(5, 60))))
for k in range(200):                                   # game-sized: Basarios's 580 cylinder vs a hunter's capsule (r 40, length ~100)
    p0 = [random.uniform(-3000, 3000), random.uniform(-200, 200), random.uniform(-3000, 3000)]; L = random.uniform(100, 800); R = random.uniform(200, 2000)
    up = [0, 1, 0] if random.random() < 0.6 else rvec()
    c = [p0[0] + random.uniform(-1.3, 1.3) * R, p0[1] + random.uniform(-200, L + 200), p0[2] + random.uniform(-1.3, 1.3) * R]
    d = rvec(); half = 60
    cases.append(('scale', (p0, [p0[i] + up[i] * L for i in range(3)], R), ([c[i] - d[i] * half for i in range(3)], [c[i] + d[i] * half for i in range(3)], 40.0)))
res = []
for fam, a, b in cases:
    r = run(a, b); r['fam'] = fam; res.append(r)
json.dump(res, open(__file__.replace('.py', '.json'), 'w'))
from collections import Counter
print(len(res), 'cases', Counter(r['fam'] for r in res), 'meets', sum(1 for r in res if r.get('meets')), 'faults', sum(1 for r in res if 'fault' in r))

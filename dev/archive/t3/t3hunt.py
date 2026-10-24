# t3hunt.py -- search for inputs that reach the transcription's unexercised blocks (miss.json, less the sqrtf-on-NaN fallbacks) on
# the ROM, and append them to t3diff.json as family 'targeted' (each with the block it reaches)
import sys, json, struct, random, math
sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import emu
from unicorn import UC_HOOK_CODE
E = emu.Emu(); uc = E.uc
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.fault = None; E.call(fn, (), tag='init', budget=2_000_000)
miss = json.load(open('miss.json'))
want = set()
for k, v in miss.items():
    for x in v: want.add(int(x, 16))
SEEN = set()
def hk(u, addr, size, ud):
    if addr in want: SEEN.add(addr)
uc.hook_add(UC_HOOK_CODE, hk, begin=0x160000, end=0x810000)
BLK = emu.HEAP_LO + 0xf00000; A, B, OUT = BLK, BLK + 0x40, BLK + 0x80
f32 = lambda x: struct.unpack('<f', struct.pack('<f', x))[0]
def run(a, b):
    a = ([f32(v) for v in a[0]], [f32(v) for v in a[1]], f32(a[2])); b = ([f32(v) for v in b[0]], [f32(v) for v in b[1]], f32(b[2]))
    uc.mem_write(A, struct.pack('<12f', *a[0], 0, *a[1], 0, a[2], 0, 0, 0)); uc.mem_write(B, struct.pack('<12f', *b[0], 0, *b[1], 0, b[2], 0, 0, 0))
    uc.mem_write(OUT, b'\xee' * 16)
    SEEN.clear()
    r0 = E.call(0x167f70, (A, B, OUT), tag='t3', budget=200000)
    if E.fault: return None, set()
    return {'A': a, 'B': b, 'meets': r0 & 0xff, 'out': list(struct.unpack('<4I', bytes(uc.mem_read(OUT, 16))))}, set(SEEN)
random.seed(99)
def unit(v): l = math.sqrt(sum(x * x for x in v)) or 1; return [x / l for x in v]
def rvec(): return unit([random.uniform(-1, 1) for _ in range(3)])
def gen():
    k = random.randrange(8)
    p0 = [random.choice([0.0, random.uniform(-50, 50)]) for _ in range(3)]
    u = random.choice([[0, 1, 0], [1, 0, 0], [0, 0, 1], rvec()])
    L = random.choice([0.0, 1e-4, random.uniform(10, 300)]); R = random.choice([0.0, random.uniform(10, 150)])
    p1 = [p0[i] + u[i] * L for i in range(3)]
    if k == 0:   # the hunter a point
        c = [p0[i] + u[i] * random.uniform(-0.5, 1.5) * L + random.uniform(-1.5, 1.5) * R for i in range(3)]
        return (p0, p1, R), (c, list(c), random.uniform(5, 60))
    if k == 1:   # the hunter along the cylinder's axis (collinear)
        a0 = random.uniform(-1, 2) * L; a1 = random.uniform(-1, 2) * L
        return (p0, p1, R), ([p0[i] + u[i] * a0 for i in range(3)], [p0[i] + u[i] * a1 for i in range(3)], random.uniform(5, 60))
    if k == 2:   # the hunter tangent to the side
        w = unit([u[1] * 1 - u[2] * 0, u[2] * 0 - u[0] * 1, 0]) if abs(u[2]) < 0.9 else [1, 0, 0]
        w = unit([u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]])
        h = random.uniform(-0.2, 1.2) * L; c = [p0[i] + u[i] * h + w[i] * (R + random.choice([0, 10, 20])) for i in range(3)]
        d = random.choice([u, unit([u[i] + w[i] * 1e-3 for i in range(3)]), rvec()]); half = random.uniform(0, 100)
        return (p0, p1, R), ([c[i] - d[i] * half for i in range(3)], [c[i] + d[i] * half for i in range(3)], random.choice([10.0, 20.0]))
    if k == 3:   # the hunter through the centre, perpendicular to the axis
        h = random.uniform(-0.2, 1.2) * L; c = [p0[i] + u[i] * h for i in range(3)]
        d = rvec(); half = random.uniform(0, 3) * max(R, 1)
        return (p0, p1, R), ([c[i] - d[i] * half for i in range(3)], [c[i] + d[i] * half for i in range(3)], random.uniform(5, 60))
    if k == 4:   # the hunter an end-cap's plane
        end = random.choice([0, 1]); base = [p0[i] + u[i] * L * end for i in range(3)]
        w = rvec(); w = unit([w[i] - u[i] * sum(w[j] * u[j] for j in range(3)) for i in range(3)])
        c = [base[i] + w[i] * random.uniform(0, 2) * R for i in range(3)]; half = random.uniform(0, 100)
        return (p0, p1, R), ([c[i] - w[i] * half for i in range(3)], [c[i] + w[i] * half for i in range(3)], random.uniform(5, 60))
    if k == 5:   # the hunter's end on the axis
        h = random.uniform(-0.5, 1.5) * L; c = [p0[i] + u[i] * h for i in range(3)]; d = rvec(); l = random.uniform(1, 200)
        return (p0, p1, R), (c, [c[i] + d[i] * l for i in range(3)], random.uniform(5, 60))
    if k == 6:   # tiny everything
        s = random.choice([1e-3, 1e-2, 1e-4])
        return ([x * s for x in p0], [x * s for x in p1], R * s), ([random.uniform(-1, 1) * s * 100 for _ in range(3)], [random.uniform(-1, 1) * s * 100 for _ in range(3)], random.uniform(0, 1) * s * 50)
    # parallel, offset exactly R + r
    w = rvec(); w = unit([w[i] - u[i] * sum(w[j] * u[j] for j in range(3)) for i in range(3)]); r = random.uniform(5, 60)
    off = R + r * random.choice([1.0, 0.999, 1.001, 0.5])
    a0 = random.uniform(-1, 2) * L; a1 = random.uniform(-1, 2) * L
    return (p0, p1, R), ([p0[i] + u[i] * a0 + w[i] * off for i in range(3)], [p0[i] + u[i] * a1 + w[i] * off for i in range(3)], r)
got = set(); keep = []
for n in range(40000):
    a, b = gen()
    r, seen = run(a, b)
    if r is None: continue
    new = seen - got
    if new:
        got |= seen; r['fam'] = 'targeted'; r['reach'] = sorted(hex(x) for x in new)[:4]; keep.append(r)
cs = json.load(open('t3diff.json'))
cs = [c for c in cs if c.get('fam') != 'targeted'] + keep
json.dump(cs, open('t3diff.json', 'w'))
nonnan = {a for a in want}
print('targeted cases', len(keep), 'reached', len(got), 'of', len(want), 'unexercised addresses')
left = sorted(want - got)
print('still not reached:', ' '.join(hex(x) for x in left))

# rkrun.py <cases.json> <out.json>: emu_fb with the rocket's model resource stood in (0x152530 -> a zeroed block, setModel vt+0x58
# 0x936ddc and the release 0x884698 answered), and a ring of block addresses on a fault
import sys, json, collections
cases_path, out_path = sys.argv[1], sys.argv[2]
sys.argv = ['emu_fb.py']
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb')
import emu_fb as F
from unicorn import UC_HOOK_BLOCK
DUMMY = None
for cand in (0x7f000000, 0x6f000000, 0x5f000000, 0x3f000000):
    try: F.uc.mem_map(cand, 0x10000); DUMMY = cand; break
    except Exception as e: print('map', hex(cand), e)
assert DUMMY
F.hook(0x152530, lambda: F.ret(DUMMY))
F.hook(0x936ddc, lambda: F.ret(0))
F.hook(0x884698, lambda: F.ret(0))
# 0x276e0c: a global (the player / camera side: its +0x1054 against the shell's area byte, then 0x29fe7c(it, 0xd, 0)) -- not built here
F.hook(0x276e0c, lambda: F.ret(0))
# state 3 -> 4: 0x664918(the shell's point, area) and the object 0x31a2ac (a global manager's create: id setup +0x26, count +0x28) -- not built
F.hook(0x664918, lambda: F.ret(0))
F.hook(0x31a2ac, lambda: F.ret(0))
RING = collections.deque(maxlen=60)
F.uc.hook_add(UC_HOOK_BLOCK, lambda uc, a, s, u: RING.append(a))
# a case's `patrol`: his own rAreaPatrolData built in memory as the file holds it (record map 27, area 1, index 0x7f; 10 points,
# radius 100) and hung at e+0x760c, with e+0x1053 = 27 (the map, vt+0x9c) and e+0x1054 = 1 (the area) -- 0x69bb74 then finds it
PTS = [(3500, 0, 3800), (1700, 0, 4200), (2000, 0, 4500), (-3600, 0, -1200), (-2600, 0, -1700), (-2300, 0, -1500),
       (3500, 0, 3800), (1700, 0, 4200), (2000, 0, 4500), (700, 0, 4300)]
def patrol(on):
    M = DUMMY + 0x1000
    F.uc.mem_write(M, bytes(0x2000))
    F.w32(M + 0x68, 1); F.w32(M + 0x74, M + 0x100); F.w32(M + 0x100, M + 0x200)
    R = M + 0x200
    F.w8(R + 4, 27); F.w8(R + 5, 1); F.w8(R + 6, 0x7f); F.w32(R + 0xc, len(PTS)); F.w32(R + 0x18, M + 0x300)
    for i, p in enumerate(PTS):
        P = M + 0x400 + 0x40 * i; F.w32(M + 0x300 + 4 * i, P)
        for j in range(3): F.wf(P + 0x10 + 4 * j, float(p[j]))
        F.wf(P + 0x20, 100.0)
    F.w32(F.OWNER + 0x760c, M if on else 0); F.w8(F.OWNER + 0x1053, 27); F.w8(F.OWNER + 0x1054, 1)
    # the player's area byte (base59's tail 0x435834: [[0x1831ae0]]+0x49 against the shell's): his area, as in the arena
    # (the variable [0x1831ae0] -> 0x18858a8 is null in the harness: the byte read is page 0's. A stand-in object in the scratch
    # block holds his area there, for the patrol cases only)
    V = F.r32(0x1831ae0); G = DUMMY + 0x3000
    F.uc.mem_write(G, bytes(0x100)); F.w8(G + 0x49, 1); F.w32(V, G)
out = {}
SETUP0 = F.owner_setup
def setup_patrol(cc):
    SETUP0(cc); patrol(True)
def setup_plain(cc):
    SETUP0(cc); F.w32(F.r32(0x1831ae0), 0)
ROW = None
def setup_row(cc, base):
    base(cc)
    # a case's `row`: one event row (0x2c bytes: +0 type, +4 motion, +8 kind, +0xc f0, +0x10 f1, +0x14 byte, +0x18, +0x1c.. a0 a1 a2 as floats)
    r = cc['row']; A = DUMMY + 0x5000
    F.uc.mem_write(A, bytes(0x40))
    F.w32(A, r['type']); F.w32(A + 4, r.get('motion', 0)); F.w32(A + 8, r.get('kind', 1)); F.wf(A + 0xc, r.get('f0', 0.0))
    for j, v in enumerate(r['args']): F.wf(A + 0x1c + 4 * j, float(v))
for c in json.load(open(cases_path)):
    F.owner_setup = setup_patrol if c.get('patrol') else setup_plain
    if c.get('row'):
        _b = F.owner_setup
        F.owner_setup = (lambda cc, _b=_b: setup_row(cc, _b))
        for st in c['steps']:
            if st.get('rowArg') is not None: st['args'] = [st['rowArg'][0], st['rowArg'][1], DUMMY + 0x5000]
    try: out[c['name']] = F.run(c)
    except AssertionError as e:
        print('FAULT', c['name'], e); print(' '.join(hex(a) for a in RING)); out[c['name']] = {'fault': str(e)}
json.dump(out, open(out_path, 'w'))

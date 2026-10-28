# cen063.py <statuses> <variant> [slotstate] -- cengen11's census (every action, phases 0..8, each frame literal answered alone, rage 0 / 1,
# ended / landed scenarios) on trgen063 (gapQ): the slime makers 0xf458ec / 0xf3b7e8 / 0xf3e984 logged with their args, the fist ground
# probes answered (a hit, normal up), the sp_35 allocator 0x41876c served, the class's ids at e+0xcac0.. and a slot block at [e+0xcacc]:
# variant 0 -- both arm levels 2 (rows 1); variant 5 -- every slot's colour state = slotstate (0 Yellow / 2 Red).
import sys, json, os, struct
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
os.environ.setdefault('FB_CLASS', 'uEm063_00')
st_list = [int(x, 0) for x in sys.argv[1].split(',')]; var = int(sys.argv[2]); slotstate = int(sys.argv[3]) if len(sys.argv) > 3 else 0
lvl = int(os.environ.get('G_LEVEL', '2'))
os.environ['FB_MON'] = 'em063_05' if var == 5 else 'em063_00'
sys.argv = ['x']
import trgen063 as T
STUB = {0x3a8430: int(os.environ.get('FB_RANK', '5')), 0x49930: 10}
BLK = T.E + 0x380000
ids = (0x113, 0x114, 0x115) if var == 5 else (0x110, 0x111, 0x112)
POKE = {T.E + 0xcac0: list(struct.pack('<4I', ids[0], ids[1], ids[2], BLK))}
blk = bytearray(0x100)
for k in range(2):                                   # the arm rows ctl+0x20+12k / level +0x24+12k (rom-map 0xf4653c)
    struct.pack_into('<HHh', blk, 0x20 + 12 * k, 1 if lvl > 0 else 3, 0x1234 + k, lvl)
for k in range(4):                                   # Raging's slot k: countdown +0x50+8k, state +0x54+8k
    struct.pack_into('<fH', blk, 0x50 + 8 * k, 1000.0, slotstate)
POKE[BLK] = list(blk)
POKE[T.P + 0xb0a] = list(struct.pack('<H', 0x0b0a))
POKE_FALL = dict(POKE); POKE_FALL[T.P + 0x14] = list(struct.pack('<f', -1.0))
KEEP = ('create', 'mk', 'mk2', 'mk3', 'spend', 'probe')
def key(e):
    if e[0] == 'create': return 'create %s m%d %s' % (e[1], e[2], e[5])
    if e[0] == 'mk': return 'mk slot%d kind%d attr%#x b2c%d %s' % (e[1], e[2], e[3], e[4], e[5])
    if e[0] == 'mk2': return 'mk2 r1=%d r2=%d r3=%d stk=%s %s' % (e[1], e[2], e[3], e[4], e[5])
    if e[0] == 'mk3': return 'mk3 r1=%d r2=%d r3=%d %s' % (e[1], e[2], e[3], e[4])
    if e[0] == 'spend': return 'spend slot%d %+d %s' % (e[1], e[2], e[3])
    if e[0] == 'probe': return 'probe %s slot%d %s' % (e[1], e[2], e[3])
for st in st_list:
  for n in range(256):
    seen = {}; mots = set()
    for ph in range(9):
      lits = set()
      for scn in ({'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}, {'frame': 0, 'frame2': 0}, {'frame': 0, 'frame2': 0, 'ended': 1},
                  {'frame': 1, 'frame2': 1, 'landed': 1, 'fall': 1}, {'frame': 0, 'frame2': 0, 'landed': 1, 'fall': 1}):
        for rg in (0, 1):
          r = T.run(st, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE_FALL if scn.get('fall') else POKE, **scn)
          for e in r.get('ev', []):
            if e[0] == 'mot' and ph == 0: mots.add(e[1])
            if e[0] == 'ftest': lits.add(e[1])
            if e[0] == 'ftest2': lits.add(e[2][1])
            if e[0] in KEEP:
              seen.setdefault(key(e) + ' fALL%d' % scn['frame'], set()).add('p%d r%d%s%s' % (ph, rg, ' land' if scn.get('landed') else '', ' end' if scn.get('ended') else ''))
      done = set()
      while True:
        todo = sorted(x for x in lits if x is not None and x not in done)
        if not todo: break
        L = todo[0]; done.add(L)
        for rg, ld in ((0, 0), (1, 0), (0, 1), (1, 1)):
          r = T.run(st, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE_FALL if ld else POKE, only=L, landed=ld)
          for e in r.get('ev', []):
            if e[0] == 'ftest': lits.add(e[1])
            if e[0] == 'ftest2': lits.add(e[2][1])
            if e[0] in KEEP:
              seen.setdefault(key(e) + ' f%s' % L, set()).add('p%d r%d%s' % (ph, rg, ' land' if ld else ''))
    if seen: print(var, slotstate, '%d:%#04x' % (st, n), sorted(mots), json.dumps({k: sorted(v)[:4] for k, v in sorted(seen.items())}), flush=True)

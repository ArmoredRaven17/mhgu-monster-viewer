# cengen11.py (= cengen10 + the landing answered: landed=1 with P+0x14 < 0, 2026-10-18; Tetsucabra's (3, 0x50..0x55) landing sp_01) -- was cengen10.py <statuses> [variant] -- every action's creates with EACH frame test answered alone (env FB_CLASS / FB_MON / FB_RANK):
# a first pass (every test passing) collects the frame literals the helpers test, then one pass per literal
import sys, json, os
st_list = [int(x, 0) for x in sys.argv[1].split(',')]; var = int(sys.argv[2]) if len(sys.argv) > 2 else 0
NS = json.loads(os.environ.get('FB_NS', 'null'))
sys.argv = ['x']
import trgen as T
STUB = {0x3a8430: int(os.environ.get('FB_RANK', '5')), 0x49930: 10}
# FB_POKE: owner bytes {offset: [bytes]} written before every run (Mizutsune's shell ids live in e+0xcac0..)
POKE = {T.E + int(k, 0): v for k, v in json.loads(os.environ.get('FB_POKE', '{}')).items()}
import struct as _st
POKE.update({T.P + int(k, 0): v for k, v in json.loads(os.environ.get('FB_PPOKE', '{}')).items()})   # block [e+0x1428] bytes (Soulseer's flame P+0x1bb)
POKE_FALL = dict(POKE); POKE_FALL[T.P + 0x14] = list(_st.pack('<f', -1.0))
for st in st_list:
  for n in (NS.get(str(st), []) if NS else range(256)):
    seen = {}; mots = set()
    for ph in range(9):
      lits = set()
      for scn in ({'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}, {'frame': 0, 'frame2': 0}, {'frame': 0, 'frame2': 0, 'ended': 1}, {'frame': 1, 'frame2': 1, 'landed': 1, 'fall': 1}, {'frame': 0, 'frame2': 0, 'landed': 1, 'fall': 1}):
        for rg in (0, 1):
          r = T.run(st, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE_FALL if scn.get('fall') else POKE, **scn)
          for e in r.get('ev', []):
            if e[0] == 'mot' and ph == 0: mots.add(e[1])
            if e[0] == 'ftest': lits.add(e[1])
            if e[0] == 'ftest2': lits.add(e[2][1])
            if e[0] == 'create':      # cengen11: the first pass's creates too (a create behind no frame test: the landing)
              k = '%s m%d f%s %s' % (e[1], e[2], 'ALL%d' % scn['frame'], e[5]); seen.setdefault(k, set()).add('p%d r%d%s%s' % (ph, rg, ' land' if scn.get('landed') else '', ' end' if scn.get('ended') else ''))
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
            if e[0] == 'create':
              k = '%s m%d f%s %s' % (e[1], e[2], L, e[5]); seen.setdefault(k, set()).add('p%d r%d%s' % (ph, rg, ' land' if ld else ''))
    if seen: print(var, '%d:%#04x' % (st, n), sorted(mots), {k: sorted(v)[:3] for k, v in sorted(seen.items())}, flush=True)

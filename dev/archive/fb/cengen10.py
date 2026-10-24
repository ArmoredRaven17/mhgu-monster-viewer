# cengen10.py <statuses> [variant] -- every action's creates with EACH frame test answered alone (env FB_CLASS / FB_MON / FB_RANK):
# a first pass (every test passing) collects the frame literals the helpers test, then one pass per literal
import sys, json, os
st_list = [int(x, 0) for x in sys.argv[1].split(',')]; var = int(sys.argv[2]) if len(sys.argv) > 2 else 0
NS = json.loads(os.environ.get('FB_NS', 'null'))
sys.argv = ['x']
import trgen as T
STUB = {0x3a8430: int(os.environ.get('FB_RANK', '5')), 0x49930: 10}
# FB_POKE: owner bytes {offset: [bytes]} written before every run (Mizutsune's shell ids live in e+0xcac0..)
POKE = {T.E + int(k, 0): v for k, v in json.loads(os.environ.get('FB_POKE', '{}')).items()}
for st in st_list:
  for n in (NS.get(str(st), []) if NS else range(256)):
    seen = {}; mots = set()
    for ph in range(9):
      lits = set()
      for scn in ({'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}, {'frame': 0, 'frame2': 0}, {'frame': 0, 'frame2': 0, 'ended': 1}):
        for rg in (0, 1):
          r = T.run(st, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE, **scn)
          for e in r.get('ev', []):
            if e[0] == 'mot' and ph == 0: mots.add(e[1])
            if e[0] == 'ftest': lits.add(e[1])
            if e[0] == 'ftest2': lits.add(e[2][1])
      done = set()
      while True:
        todo = sorted(x for x in lits if x is not None and x not in done)
        if not todo: break
        L = todo[0]; done.add(L)
        for rg in (0, 1):
          r = T.run(st, n, ph, var, 0, rage=rg, stub=STUB, poke=POKE, only=L)
          for e in r.get('ev', []):
            if e[0] == 'ftest': lits.add(e[1])
            if e[0] == 'ftest2': lits.add(e[2][1])
            if e[0] == 'create':
              k = '%s m%d f%s %s' % (e[1], e[2], L, e[5]); seen.setdefault(k, set()).add('p%d r%d' % (ph, rg))
    if seen: print(var, '%d:%#04x' % (st, n), sorted(mots), {k: sorted(v)[:3] for k, v in sorted(seen.items())}, flush=True)

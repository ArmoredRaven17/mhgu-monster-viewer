# cengen.py <statuses> [variant] -- every action's creates (env FB_CLASS / FB_MON), the band native on unicorn
import sys, json, os
st_list = [int(x, 0) for x in sys.argv[1].split(',')]; var = int(sys.argv[2]) if len(sys.argv) > 2 else 0
import os
CTL = json.loads(os.environ.get('FB_CTL', '[[0]]')); ctlv = range(len(CTL)); S2 = [int(x) for x in os.environ.get('FB_S2', '0').split(',')]
sys.argv = ['x']
import trgen as T
POKE = {T.E + int(k, 0): v for k, v in json.loads(os.environ.get('FB_POKE', '{}')).items()}
NS = json.loads(os.environ.get('FB_NS', 'null'))
CH = [0, 1] if os.environ.get('FB_CHARGED') else [0]
for st in st_list:
  for n in (NS.get(str(st), []) if NS else range(256)):
    seen = {}; mots = set()
    for ph in range(9):
      for ch in CH:
        for rg in (0, 1):
          for cv in ctlv:
           for s2 in S2:
            for sub in (0, 1):
             for scn in ({'frame': 1}, {'frame': 1, 'ended': 1}, {'frame': 1, 'landed': 1}, {'frame': 1, 'frame2': 1}, {'ended': 1}):
              r = T.run(st, n, ph, var, sub, s2=s2, charged=ch, rage=rg, ctl=CTL[cv], stub={0x3a8430: 5, 0x49930: 10}, poke=POKE, **scn)
              for e in r.get('ev', []):
                if e[0] == 'mot' and ph == 0: mots.add(e[1])
                if e[0] == 'create':
                  k = '%s m%d f%s %s' % (e[1], e[2], e[6], e[5]); seen.setdefault(k, set()).add('p%d c%d r%d' % (ph, ch, rg))
    if seen or mots: print(var, '%d:%#04x' % (st, n), sorted(mots), {k: sorted(v)[:3] for k, v in sorted(seen.items())}, flush=True)

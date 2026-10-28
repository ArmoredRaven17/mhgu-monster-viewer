import sys, os
here = os.path.dirname(os.path.abspath(sys.argv[0]))
src = open(os.path.join(here, 'cen063.py')).read().split('for st in st_list:')[0].replace('os.path.dirname(os.path.abspath(__file__))', repr(here))
ph = int(sys.argv[1]); n = int(sys.argv[2])
sys.argv = ['x', '3', '0', '0']
exec(src)
from unicorn import UC_HOOK_CODE
pcs = []
h = T.mu.hook_add(UC_HOOK_CODE, lambda uc, a, s, u: pcs.append(a) if 0xf3a234 <= a < 0xf3b520 else None)
r = T.run(3, n, ph, 0, 0, rage=0, stub=STUB, poke=POKE, frame=1, frame2=1)
print(r.get('end'), len(pcs), [hex(x) for x in pcs[-25:]])

# p4all.py (effects lane A4, 2026-10-26): p4trace.py over every enemy class x the em ids it serves (em byte e+0xb5f4,
# variant byte e+0xb5f5), statuses 0..15, in parallel.  Class -> em ids: the spawn table 0x172ae2c (index -> class) read
# against the scratch-em dtb set (the em ids with no class of their own: em002 -> uEm001, em005 -> uEm004, em015 / em016 ->
# uEm014, em034 -> uEm017, em062 -> uEm060, em072 -> uEm071; the variants _0N are the variant byte).  Output out/<cls>_<em>_<v>.txt
import sys, os, subprocess
from concurrent.futures import ThreadPoolExecutor
H = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(H, 'out'); os.makedirs(OUT, exist_ok=True)
EMS = [x for x in os.listdir(r'C:\MHGU-Extract\scratch-em')]
SHARE = {'em002': 'uEm001_00', 'em005': 'uEm004_00', 'em015': 'uEm014_00', 'em016': 'uEm014_00', 'em034': 'uEm017_00',
         'em062': 'uEm060_00', 'em072': 'uEm071_00'}
import json
CLS = json.load(open(r'C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.json'))
jobs = []
for e in sorted(EMS):
    base, v = e.split('_')
    if base.startswith('ems'):
        cls = 'uEms%s_00' % base[3:]
        em = int(base[3:])
    else:
        cls = SHARE.get(base, 'uEm%s_00' % base[2:])
        em = int(base[2:])
    if cls not in CLS:
        print('no class for', e); continue
    jobs.append((cls, em, int(v)))
only = sys.argv[1:]
if only:
    jobs = [j for j in jobs if j[0] in only]

def go(j):
    cls, em, v = j
    p = os.path.join(OUT, '%s_em%03d_%d.txt' % (cls, em, v))
    with open(p, 'w') as f:
        subprocess.run([sys.executable, os.path.join(H, 'p4trace.py'), cls, str(em), str(v)], stdout=f, stderr=subprocess.STDOUT)
    return j

with ThreadPoolExecutor(8) as ex:
    for j in ex.map(go, jobs):
        print('done', j, flush=True)

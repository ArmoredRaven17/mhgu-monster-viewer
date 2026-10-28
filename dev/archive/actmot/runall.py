"""actmot/runall.py <outdir> [jobs] [ids,..]: census.py over every large monster in docs/monsters.json (the 94 em entries), one
process per id, `jobs` at once. The class: the monster's own uEmNNN_00 when it exists, else the shared class (dev/notice-marks.md
step 3, from the spawn table 0x172ae2c): em002 -> uEm001_00, em005 -> uEm004_00, em015 / em016 / em034 -> uEm014_00, em062 ->
uEm060_00, em072 -> uEm071_00; EM = the monster's own em number, the variant its _NN."""
import os, sys, re, json, subprocess, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import emclasses
CL = emclasses.load()
SHARED = {2: 1, 5: 4, 15: 14, 16: 14, 34: 14, 62: 60, 72: 71}
outdir = sys.argv[1]; jobs = int(sys.argv[2]) if len(sys.argv) > 2 else 6
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
mj = json.load(open(os.path.join(HERE, '..', '..', '..', 'docs', 'monsters.json')))
todo = []
for m in mj['monsters']:
    mm = re.match(r'em(\d{3})_(\d\d)$', m['id'])
    if not mm or (only and m['id'] not in only): continue
    num = int(mm.group(1)); cls = 'uEm%03d_00' % SHARED.get(num, num)
    if cls not in CL: print('NO CLASS', m['id']); continue
    todo.append((m['id'], cls, num))
os.makedirs(outdir, exist_ok=True)
running = []
while todo or running:
    while todo and len(running) < jobs:
        i, cls, num = todo.pop(0)
        log = open(os.path.join(outdir, i + '.log'), 'w')
        env = dict(os.environ, CLS=cls, EM=str(num))
        p = subprocess.Popen([sys.executable, os.path.join(HERE, 'census.py'), i, os.path.join(outdir, i + '.json')], env=env,
                             stdout=log, stderr=subprocess.STDOUT)
        running.append((i, p, log, time.time()))
    for r in list(running):
        if r[1].poll() is not None:
            r[2].close(); running.remove(r)
            print('%s rc=%d %.0fs' % (r[0], r[1].returncode, time.time() - r[3]), flush=True)
    time.sleep(0.5)
print('ALL DONE')

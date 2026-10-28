"""attrace_all.py [jobs] [id,id,...]: attrace.py (the attack-arm census) over every monster in docs/monsters.json, one process per id,
`jobs` at once; out: <here>/ctl/<id>.txt (what attexport.py reads). A shared class (em002 on uEm001_00, em034 on uEm014_00, em062 on
uEm060_00, ...) runs as the spawn-table map's class with its own EM byte. (Header was ctlflip_all.py's, from which this was copied.)"""
import os, sys, re, json, subprocess, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import emclasses
CL = emclasses.load()
# the monsters without a class of their own -> the class that runs them (dev/notice-marks.md step 3, from the spawn table 0x172ae2c and
# each class's cmp on enemy+0xb5f4): em002 -> uEm001, em005 -> uEm004, em015 / 016 / 034 -> uEm014, em062 -> uEm060, em072 -> uEm071
SHARED = {2: 1, 5: 4, 15: 14, 16: 14, 34: 14, 62: 60, 72: 71}
mode = 'att'; jobs = int(sys.argv[1]) if len(sys.argv) > 1 else 4
only = set(sys.argv[2].split(',')) if len(sys.argv) > 2 else None
mj = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json'))
todo = []
for m in mj['monsters']:
    i = m['id']
    mm = re.match(r'em(\d{3})_(\d\d)$', i)
    if not mm or (only and i not in only): continue
    num = int(mm.group(1))
    # FIXED 2026-10-27 (atkfix lane; rom-map trap 176): the class is the SPAWN-TABLE map, never "the nearest uEmNNN_00 at or below the
    # em number" -- that rule (range(num, num - 3, -1)) ran Giadrome (em034) as Akantor's uEm033_00 and Volvidon (em062) as
    # Lagombi's uEm061_00. The map is dev/notice-marks.md step 3 (each class's own tests on the em byte enemy+0xb5f4), the same one
    # fb/pfarm.py and actmot/runall.py use. A number with no class of its own and no map entry is refused, not guessed.
    cls = 'uEm%03d_00' % SHARED.get(num, num)
    if cls not in CL: print('no class for', i, '(not in the spawn-table map, no uEm%03d_00)' % num); continue
    todo.append((i, cls, num, int(mm.group(2))))
os.makedirs(os.path.join(HERE, 'att'), exist_ok=True)
running = []
while todo or running:
    while todo and len(running) < jobs:
        i, cls, num, var = todo.pop(0)
        args = [sys.executable, 'attrace.py', str(var)]
        out = open(os.path.join(HERE, 'ctl', '%s.txt' % i), 'w')
        out.write('# %s %s EM=%d variant=%d\n' % (i, cls, num, var)); out.flush()
        env = dict(os.environ, CLS=cls, EM=str(num))
        running.append((i, subprocess.Popen(args, cwd=HERE, env=env, stdout=out, stderr=subprocess.STDOUT), out, time.time()))
    for r in list(running):
        if r[1].poll() is not None:
            r[2].close(); running.remove(r)
            print('%s done rc=%d %.0fs' % (r[0], r[1].returncode, time.time() - r[3]), flush=True)
    time.sleep(1)
print('ALL DONE')

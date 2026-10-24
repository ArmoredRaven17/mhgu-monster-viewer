"""ctlflip_all.py <mode action|word> [jobs]: ctlflip.py over every large monster in docs/monsters.json, one process per id, `jobs` at
once; out: <here>/ctl/<mode>_<id>.txt. A shared class (em002 on uEm001_00, em072 on uEm071_00, ...) runs as its sibling's class
with its own EM byte."""
import os, sys, re, json, subprocess, time
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import emclasses
CL = emclasses.load()
mode = sys.argv[1]; jobs = int(sys.argv[2]) if len(sys.argv) > 2 else 4
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
mj = json.load(open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\monsters.json'))
todo = []
for m in mj['monsters']:
    i = m['id']
    mm = re.match(r'em(\d{3})_(\d\d)$', i)
    if not mm or (only and i not in only): continue
    num = int(mm.group(1))
    cls = None
    for k in range(num, max(num - 3, 0), -1):
        if 'uEm%03d_00' % k in CL: cls = 'uEm%03d_00' % k; break
    if not cls: print('no class for', i); continue
    todo.append((i, cls, num, int(mm.group(2))))
os.makedirs(os.path.join(HERE, 'ctl'), exist_ok=True)
running = []
while todo or running:
    while todo and len(running) < jobs:
        i, cls, num, var = todo.pop(0)
        args = [sys.executable, 'ctlflip2.py', mode, str(var)] + ([i] if mode == 'word' else [])
        out = open(os.path.join(HERE, 'ctl', '%s_%s.txt' % (mode, i)), 'w')
        out.write('# %s %s EM=%d variant=%d\n' % (i, cls, num, var)); out.flush()
        env = dict(os.environ, CLS=cls, EM=str(num))
        running.append((i, subprocess.Popen(args, cwd=HERE, env=env, stdout=out, stderr=subprocess.STDOUT), out, time.time()))
    for r in list(running):
        if r[1].poll() is not None:
            r[2].close(); running.remove(r)
            print('%s done rc=%d %.0fs' % (r[0], r[1].returncode, time.time() - r[3]), flush=True)
    time.sleep(1)
print('ALL DONE')

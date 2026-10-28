"""simall.py <sim dir> [jobs]: carrysim.py over every run_<id>.json in the dir (CLS / EM from the case), `jobs` processes at once."""
import sys, os, json, glob, subprocess, time
S = sys.argv[1]; jobs = int(sys.argv[2]) if len(sys.argv) > 2 else 4
HERE = os.path.dirname(os.path.abspath(__file__))
todo = sorted(glob.glob(os.path.join(S, 'run_*.json')))
running = []
while todo or running:
    while todo and len(running) < jobs:
        f = todo.pop(0); c = json.load(open(f))[0]
        mid = os.path.basename(f)[4:-5]
        env = dict(os.environ, CLS=c['cls'], EM=str(c['em']))
        log = open(os.path.join(S, 'log_%s.txt' % mid), 'w')
        running.append((mid, subprocess.Popen([sys.executable, os.path.join(HERE, 'carrysim.py'), f, os.path.join(S, 'out_%s.json' % mid)],
                                              env=env, stdout=log, stderr=subprocess.STDOUT), log))
    for r in list(running):
        if r[1].poll() is not None:
            r[2].close(); running.remove(r); print(r[0], 'rc', r[1].returncode, flush=True)
    time.sleep(0.5)
print('ALL DONE')

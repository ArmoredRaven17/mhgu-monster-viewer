# runpf.py (2026-10-19): pfgen.py over the FBB monsters (neset/fbb_list.txt), four at a time -> pf_<mon>.txt; skips a monster already done
import os, sys, subprocess, time
D = os.path.dirname(os.path.abspath(__file__))
mons = [l.split()[0] for l in open(os.path.join(D, '..', 'neset', os.environ.get('PF_LIST', 'fbb_list.txt'))) if l.startswith('em')]   # (PF_LIST: another list)
if sys.argv[1:]: mons = [m for m in mons if m in sys.argv[1:]]
queue = [m for m in mons if not (os.path.exists(os.path.join(D, 'pf_%s.txt' % m)) and '# done' in open(os.path.join(D, 'pf_%s.txt' % m)).read())]
running = []
while queue or running:
    while queue and len(running) < 4:
        m = queue.pop(0)
        running.append((m, subprocess.Popen([sys.executable, os.path.join(D, 'pfgen.py'), m], cwd=D,
                        stdout=open(os.path.join(D, 'pf_%s.txt' % m), 'w'), stderr=open(os.path.join(D, 'pf_%s.err' % m), 'w'))))
        print('start', m, flush=True)
    time.sleep(5)
    for r in list(running):
        if r[1].poll() is not None: print('done', r[0], r[1].returncode, flush=True); running.remove(r)
print('ALL DONE', flush=True)

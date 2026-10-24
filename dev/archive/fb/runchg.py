# runchg.py (2026-10-19): chgpass.py (the class's own action changes, timers answered) over the FBB monsters, four at a time, all
# statuses, with the shared classes (FB_EM) and the loader ids (ids_fbb.json) as runfbb.py gives them -> chg_<mon>_v<var>_t.txt
import os, sys, subprocess, time, json, struct
D = os.path.dirname(os.path.abspath(__file__))
mons = [l.split()[0] for l in open(os.path.join(D, '..', 'neset', 'fbb_list.txt')) if l.startswith('em')]
if sys.argv[1:]: mons = [m for m in mons if m in sys.argv[1:]]
SHARED = {'002': 'uEm001_00', '005': 'uEm004_00', '015': 'uEm014_00', '016': 'uEm014_00', '034': 'uEm014_00'}
IDS = json.load(open(os.path.join(D, 'ids_fbb.json')))
# a monster already passed (its .done marker) is skipped: a second runner (queued earlier) does only what is left
queue = [m for m in mons if not os.path.exists(os.path.join(D, 'chg_%s_v%d_t.done' % (m, int(m[6:8]))))]; running = []
def start(mon):
    var = int(mon[6:8]); cls = SHARED.get(mon[2:5], 'uEm%s_00' % mon[2:5])
    env = dict(os.environ, FB_CLASS=cls, FB_MON=mon, FB_EM=str(int(mon[2:5])))
    if IDS.get(mon): env['FB_POKE'] = json.dumps({k: list(struct.pack('<I', int(v, 16))) for k, v in IDS[mon].items()})
    base = os.path.join(D, 'chg_%s_v%d_t' % (mon, var))
    p = subprocess.Popen([sys.executable, os.path.join(D, 'chgpass.py'), ','.join(str(i) for i in range(16)), str(var)], cwd=D, env=env,
                         stdout=open(base + '.txt', 'w'), stderr=open(base + '.err', 'w'))
    print('start', mon, flush=True); return (mon, p)
while queue or running:
    while queue and len(running) < 4: running.append(start(queue.pop(0)))
    time.sleep(5)
    for r in list(running):
        if r[1].poll() is not None:
            print('done', r[0], r[1].returncode, flush=True); running.remove(r)
            if r[1].returncode == 0: open(os.path.join(D, 'chg_%s_v%d_t.done' % (r[0], int(r[0][6:8]))), 'w').close()
print('ALL DONE', flush=True)

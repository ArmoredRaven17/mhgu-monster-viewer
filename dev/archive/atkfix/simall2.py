"""simall2.py <dir> <lead|carry> [jobs]: carrysim2.py over every lead_<id>.json (--lead) or run_<id>.json in the dir, CLS / EM from
the job, `jobs` processes at once; lead mode merges the answers into leadjobs_out.json {jid: {kind, t, why}}."""
import sys, os, json, glob, subprocess, time
S, MODE = sys.argv[1], sys.argv[2]; jobs = int(sys.argv[3]) if len(sys.argv) > 3 else 6
HERE = os.path.dirname(os.path.abspath(__file__))
pat = 'lead_*.json' if MODE == 'lead' else 'run_*.json'
todo = sorted(glob.glob(os.path.join(S, pat)))
running = []
while todo or running:
    while todo and len(running) < jobs:
        f = todo.pop(0); c = json.load(open(f))[0]
        mid = os.path.basename(f).split('_', 1)[1][:-5]
        out = os.path.join(S, ('leadout_%s.json' if MODE == 'lead' else 'out2_%s.json') % mid)
        env = dict(os.environ, CLS=c['cls'], EM=str(c['em']))
        log = open(os.path.join(S, 'log2_%s_%s.txt' % (MODE, mid)), 'w')
        args = [sys.executable, os.path.join(HERE, 'carrysim2.py'), f, out] + (['--lead'] if MODE == 'lead' else [])
        running.append((mid, subprocess.Popen(args, env=env, stdout=log, stderr=subprocess.STDOUT), log))
    for r in list(running):
        if r[1].poll() is not None:
            r[2].close(); running.remove(r)
            if r[1].returncode: print(r[0], 'rc', r[1].returncode, flush=True)
    time.sleep(0.5)
if MODE == 'lead':
    allr = {}
    for f in glob.glob(os.path.join(S, 'lead_*.json')):
        mid = os.path.basename(f)[5:-5]; js = json.load(open(f))
        o = json.load(open(os.path.join(S, 'leadout_%s.json' % mid)))
        for k, j in enumerate(js): allr[mid + ' ' + j['jid']] = o[str(k)]
    json.dump(allr, open(os.path.join(S, 'leadjobs_out.json'), 'w'), indent=0)
    print(len(allr), 'lead answers')
print('ALL DONE')

"""actmot/census.py <monster id> <out.json> (action-motion census lane, 2026-10-27): every action of one viewer monster, every
motion it plays, under amtrace.py (CLS / EM env set by runall.py from the class map).

Pass 1 (which actions are handled): every (status 0..0x14, number 0..0xff) at phase 0, sub-phase 0, every out-of-class call
answered 0 and then 1 (actpost.py's two answers): live = any motion / partner / rate / posture / turn / script event, a phase
written, or a change other than the defaults.
Pass 2: each live action x phase P+0x1a1 0..7 (more while a run writes a higher phase, to 15) x sub-phase P+0x1a2 0..3 x
(ended, frame) in (0, 0) / (0, 1) / (1, 1) x RET 0 / 1. Every run's events kept as `runs` (deduplicated: the same event list under
several conditions is one row with all its conditions). The PSL word vt+0x13c for every (motion, action) found, RET 0 / 1.
Out: {"id", "class", "em", "variant", "actions": {"st:0xno": {"runs": [{"ev": [...], "next": [phases], "cond": [[ph, sub, e, f, RET]..]}],
      "stubs": [...], "outband": [...], "err": [...]}}, "words": {"st:0xno": {"<motion>": [w0, w1]}}, "pass1": n}"""
import sys, os, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import amtrace as A
mid, out = sys.argv[1], sys.argv[2]
var = int(mid[6:8])
SCEN = [(0, 0), (0, 1), (1, 1)]
LIVE = {'M', 'W', 'R', 'P', 'T', 'S'}


def live(st, n):
    for RET in (0, 1):
        ev, stubs, ob, nph, err = A.run(var, st, n, 0, 0, 0, 0, RET)
        if nph != 0 or any(e[0] in LIVE for e in ev) or any(e[0] == 'C' and not e[1].startswith('default') for e in ev):
            return True
    return False


acts = [(st, n) for st in range(0x15) for n in range(0x100) if live(st, n)]
res = {}
for st, n in acts:
    rows = {}; stubs = set(); obs = set(); errs = set()
    maxph = 7; ph = 0
    while ph <= maxph:
        for sub in range(4):
            for (e, f) in SCEN:
                for RET in (0, 1):
                    ev, sb, ob, nph, err = A.run(var, st, n, ph, sub, e, f, RET)
                    stubs |= sb; obs |= ob
                    if err: errs.add(err)
                    if nph > maxph and nph < 16: maxph = nph
                    key = json.dumps(ev)
                    r = rows.setdefault(key, {'ev': ev, 'next': set(), 'cond': []})
                    r['next'].add(nph); r['cond'].append([ph, sub, e, f, RET])
        ph += 1
    res['%d:0x%02x' % (st, n)] = {'runs': [dict(ev=r['ev'], next=sorted(r['next']), cond=r['cond']) for r in rows.values() if r['ev'] or any(x != c[0] for c in r['cond'] for x in r['next'])],
                                  'stubs': sorted(stubs), 'outband': sorted(obs), 'err': sorted(errs)}
# the PSL word per (action, motion)
words = {}
for a, r in res.items():
    st, n = int(a.split(':')[0]), int(a.split(':')[1], 16)
    mots = sorted({e[1] for run in r['runs'] for e in run['ev'] if e[0] == 'M' and e[1] is not None})
    if mots:
        words[a] = {str(m): [A.word(var, st, n, m, 0), A.word(var, st, n, m, 1)] for m in mots}
json.dump({'id': mid, 'class': A.CLN, 'em': A.EMN, 'variant': var, 'pass1': len(acts), 'actions': res, 'words': words}, open(out, 'w'))
print(mid, len(acts), 'live actions', sum(1 for r in res.values() if any(e[0] == 'M' for run in r['runs'] for e in run['ev'])), 'with motions')

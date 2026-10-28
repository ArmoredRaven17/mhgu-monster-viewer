"""hypermotion/modmotions.py (hyper-motion lane, 2026-10-27): WHICH MOTIONS EACH MODIFYDATA ACTION PLAYS, per monster -- the
action main (vt+0x1f4) of the monster's class run under zg/tracec.py (the action tracer: class code native, shared calls stubbed,
every setMotion recorded) for each (ActionStatus, ActionNo) the monster's .mdd ModifyData names, phases 0..5 x ended 0 / 1 x frame
test 0 / 1, the same-update follow included -- every motion it sets. The viewer uses it to give a play with no named action the
ModifyData factor of the actions that set that motion (index.html hyperMotionAt).
   python dev/archive/hypermotion/modmotions.py <monster id>   (one class per process: tracec reads CLS / EM at import)
   -> {"<st>:<no>": ["<list>|Motion[<n>]", ..]}"""
import sys, os, json, re
mid = sys.argv[1]
em, var = int(mid[2:5]), int(mid[6:8])
CLASS_OF = {'em002': 'uEm001_00', 'em005': 'uEm004_00'}
os.environ['CLS'] = CLASS_OF.get(mid[:5], 'uEm%03d_00' % em)
os.environ['EM'] = str(em)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'zg'))
import tracec as TR
T = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'docs', 'hyper-motion.json')))
acts = sorted({(e[0], e[1]) for fk in ('normal', 'g') if fk in T.get(mid, {}) for r in T[mid][fk]['modify'].values() for e in r})
out = {}
for st, n in acts:
    mots = []
    for ph in range(6):
        for ended in (0, 1):
            for fr in (0, 1):
                for l in TR.run(var, st, n, ph, ended, fr, 0, follows=1):
                    if l.startswith('  '): continue              # a follow is another action's motion
                    m = re.search(r'MOT L(\d+) M(\d+) ', l)
                    if m:
                        k = '%s|Motion[%s]' % (m.group(1), m.group(2))
                        if k not in mots: mots.append(k)
    out['%d:0x%02x' % (st, n)] = mots
json.dump(out, sys.stdout)

"""actmot/resolve21.py: the ModifyData actions hypermotion/modmotions.py found setting no motion (modmotions.json, 21), answered
from docs/action-motions.json: the motions the full census finds (and by which path: a setter in the class code, a turn table's
record, a status script), the chains (follow / changeAction ..), or none (with the shared calls the action makes)."""
import os, json
H = os.path.dirname(os.path.abspath(__file__))
MM = json.load(open(os.path.join(H, '..', 'hypermotion', 'modmotions.json')))
AM = json.load(open(os.path.join(H, '..', '..', '..', 'docs', 'action-motions.json')))
for mon, acts in MM.items():
    for a, ms in acts.items():
        if ms: continue
        M = AM[mon]
        rows = M['actions'].get(a) or []
        line = ['%s %s' % (mon, a)]
        if rows:
            line.append('MOTIONS ' + '; '.join('%s ph%s via %s posture %s%s' % (r['m'], ','.join(map(str, r['ph'])), '/'.join(r['via']),
                        '/'.join(map(str, r['posture'])), (' when %s' % json.dumps(r['when'])) if r.get('when') else '') for r in rows))
        if M['chains'].get(a): line.append('CHAINS ' + '; '.join('%s -> %s ph%s' % (k, t, p) for k, t, p in M['chains'][a]))
        if a in M['none']: line.append('NONE stubs ' + ' '.join(M['none'][a]['stubs']))
        if a not in M['actions'] and a not in M['none']: line.append('NOT LIVE (pass 1: no event, no phase written)')
        print(' | '.join(line))

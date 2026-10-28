"""overrun.py: every arm in docs/attack-hitshapes.json whose window (attack-hitboxes.js windowOf) runs past the end of the clip it is
credited to. Split by the arm's flags bit 0 (0x7ddb8: bit 0 CLEAR -> 0x169258 locks the hit to the motion at the arm, H+0x74, and the
countdown 0x168d58.. kills it on any other motion; bit 0 SET -> no lock, the countdown 0x168df4.. runs on across motion changes).
Clip lengths from the viewer's own glbs (a _start / _loop pair is open-ended: skipped)."""
import json, struct, re, sys
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
D = json.load(open(V + r'\attack-hitshapes.json'))
MJ = json.load(open(V + r'\monsters.json'))['monsters']
def lengths(ent):
    out = {}; loops = set()
    for li in ent.get('lists', []):
        if not str(li.get('id', '')).isdigit(): continue
        b = open(V + '\\' + li['file'].replace('/', '\\'), 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]
        J = json.loads(b[20:20 + n])
        for an in J.get('animations', []):
            m = re.match(r'(Motion\[\d+\])(_start|_loop)?$', an.get('name', ''))
            if not m: continue
            key = li['id'] + '|' + m[1]
            if m[2]: loops.add(key); continue
            mx = max(J['accessors'][s['input']].get('max', [0])[0] for s in an['samplers'])
            out[key] = round(mx * 60)
    return out, loops
def windowOf(rec, gate):
    arm = gate if gate >= 0 else 0; start, dur = rec[0], rec[1]
    if start < 1: return [arm, arm + dur] if dur >= 1 else None
    a, b = max(start, arm), start + dur
    return [a, b] if b > a else None
res = []
for ent in MJ:
    i = ent['id']
    if i not in D: continue
    L, loops = lengths(ent)
    d = D[i]
    for key, arms in d['arms'].items():
        if key in loops or key not in L: continue
        for slot, hid, fl, gate, act in arms:
            second = hid >= 1000
            recs = d.get('records2') if second else d.get('records')
            rec = recs and (recs[hid - 1000] if second else recs[hid]) if recs and (hid - 1000 if second else hid) < len(recs) else None
            if not rec: continue
            w = windowOf(rec, gate)
            if not w or w[1] <= L[key]: continue
            res.append((i, key, L[key], act, hid, hex(fl), w, 'free' if fl & 1 else 'locked'))
for r in res: print(*r)
print('overruns', len(res), 'free (bit 0 set)', sum(r[-1] == 'free' for r in res), 'locked', sum(r[-1] == 'locked' for r in res),
      'starting after the clip', sum(r[6][0] >= r[2] for r in res))

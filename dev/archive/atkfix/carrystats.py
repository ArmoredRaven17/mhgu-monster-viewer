import json, re, os, sys, struct, collections
sys.path.insert(0, r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\zg')
import atkcarry as AC
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
Z = r'C:\MHGU-RE\offline\decode\monster-viewer-scratch\zg'
D = json.load(open(V + r'\attack-hitshapes.json'))
AMJ = json.load(open(V + r'\action-motions.json'))
MJ = json.load(open(V + r'\monsters.json'))['monsters']
LINE = re.compile(r'^\((\d+), (0x[0-9a-f]+)\) (\w+) slot (\d+) hit (0x[0-9a-f]+) flags (0x[0-9a-f]+)\s+motion L(\d+) M(\d+)\s+phase (\d+) gate (-?[\d.]+)')
def clips(ent):
    L, O = {}, set()
    for li in ent.get('lists', []):
        if not str(li.get('id', '')).isdigit(): continue
        b = open(os.path.join(V, li['file']), 'rb').read(); n = struct.unpack_from('<I', b, 12)[0]; J = json.loads(b[20:20 + n])
        for an in J.get('animations', []):
            m = re.match(r'(Motion\[\d+\])(_start|_loop)?$', an.get('name', ''))
            if not m: continue
            k = li['id'] + '|' + m[1]
            if m[2]: O.add(k)
            else: L[k] = round(max(J['accessors'][s['input']].get('max', [0])[0] for s in an['samplers']) * 60)
    return L, O
res = collections.Counter(); rows = []
for ent in MJ:
    i = ent['id']
    if i not in D: continue
    d = D[i]; L, O = clips(ent)
    PH = {}
    cp = os.path.join(Z, 'ctl', i + '.txt')
    if os.path.exists(cp):
        for l in open(cp, encoding='utf8', errors='replace'):
            m = LINE.match(l.strip())
            if not m: continue
            st, n, kind, slot, hid, fl, LL, M, ph, gate = m.groups()
            k = (LL + '|Motion[' + M + ']', int(slot), int(hid, 16), int(fl, 16), float(gate), '%s:%s' % (st, n))
            PH[k] = min(PH.get(k, 99), int(ph))
    AM = AMJ[i]['actions']
    for key, arms in d['arms'].items():
        for r in arms:
            if len(r) > 5: continue
            slot, hid, fl, gate, act = r
            second = hid >= 1000; recs = d.get('records2') if second else d.get('records'); ix = hid - 1000 if second else hid
            rec = recs[ix] if recs and ix < len(recs) else None
            if not rec: continue
            ph = PH.get((key, slot, hid, fl, gate, act), 0 if str(act).startswith('pf') else None)
            if ph is None: res['no-phase'] += 1; rows.append((i, key, act, hid, 'no-phase')); continue
            kind, hops, why = AC.carry(r, key, ph, rec, AM, L, O, AMJ[i]['chains'])
            if kind is None: continue
            res[kind if kind != 'refused' else 'refused:' + why.split(':')[0]] += 1
            if kind == 'carried' and why: res['  (chain stopped short: ' + why.split(':')[0] + ')'] += 1
            rows.append((i, key, act, hid, kind, hops, why))
for r in rows: print(*r)
print(dict(res))

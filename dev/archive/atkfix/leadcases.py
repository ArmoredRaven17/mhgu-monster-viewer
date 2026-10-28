"""leadcases.py <raw census dir> <ctl dir> <out dir> (atkfix lane, 2026-10-27): per attack arm, THE LEAD and the carry cases.

THE LEAD (READ: 0x7dc88..0x7dd18 with 0x951678 / 0x94ed14..): the arm writes the delay start + g - prev, g = the blend gate
e+0x4f4 (0x951678 sets it to the setMotion blend, 0x94ed14.. counts it down a tick at a time), 0 when e+0x13c0 bit 0 -- the setMotion
flags bit 0 (0x7256c) -- and prev = the motion's frame, which ADVANCES through the blend (0x94eee8..0x94ef08). So a record armed t
frames into a motion set with blend b goes live at the motion's frame start + max(0, b - t): `lead` = max(0, b - t). Applies to
start >= 1 without arm flag 0x800 (0x7dc74: flag 0x800 or start < 1 take the record's -start as the delay).
b and the setMotion flags come from the action census's raw runs (actmot/raw/<id>.json: 'M' events [motion, blend, start, flags, via]):
setMotion0 (0xafe84) and setMotionL (0xafef0) pass flags 0 (`mov r2, #0`), setMotion / setMotionC pass r2 (logged), a turn record its
+0x1c. |blend| (0xafd30..0xafd5c: a negative blend is negated, flags | 2). Not modelled: e+0x1408 bit 0x800 (0xafd60: blend 0, one-shot).
t: 0 when the arm's run sets the motion (the census arm phase is a phase that sets it), the arm's frame gate when it asked one (gate >= 0);
else unknown -> lead 0, logged 'lead-unknown' (only matters when b > 0).
Out: leads.json {id: {"<key>|<slot>|<id>|<flags>|<gate>|<action>": lead}}, cases_<id>.json for carrysim.py, leadlog.txt."""
import sys, os, json, re, struct
RAW, CTL, OUT = sys.argv[1:4]
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
sys.path.insert(0, r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\zg')
import atkcarry as AC
D = json.load(open(os.path.join(V, 'attack-hitshapes.json')))
MJ = json.load(open(os.path.join(V, 'monsters.json')))['monsters']
SHARED = {2: 1, 5: 4, 15: 14, 16: 14, 34: 14, 62: 60, 72: 71}
LINE = re.compile(r'^\((\d+), (0x[0-9a-f]+)\) (\w+) slot (\d+) hit (0x[0-9a-f]+) flags (0x[0-9a-f]+)\s+motion L(\d+) M(\d+)\s+phase (\d+) gate (-?[\d.]+)')
FLAGS0 = {'setMotion0', 'setMotionL'}
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
leads, log = {}, []
for ent in MJ:
    i = ent['id']
    if i not in D: continue
    raw = json.load(open(os.path.join(RAW, i + '.json')))['actions']
    L, O = clips(ent)
    PH = {}
    cp = os.path.join(CTL, i + '.txt')
    if os.path.exists(cp):
        for l in open(cp, encoding='utf8', errors='replace'):
            m = LINE.match(l.strip())
            if not m: continue
            st, n, kind, slot, hid, fl, LL, M, ph, gate = m.groups()
            k = (LL + '|Motion[' + M + ']', int(slot), int(hid, 16), int(fl, 16), float(gate), '%s:%s' % (st, n))
            PH[k] = min(PH.get(k, 99), int(ph))
    d = D[i]; leads[i] = {}; cases = []
    for key, arms in d['arms'].items():
        for r in arms:
            if len(r) > 5: continue
            slot, hid, fl, gate, act = r
            second = hid >= 1000; recs = d.get('records2') if second else d.get('records'); ix = hid - 1000 if second else hid
            rec = recs[ix] if recs and 0 <= ix < len(recs) else None
            if not rec: continue
            rk = '%s|%d|%d|%d|%s|%s' % (key, slot, hid, fl, gate, act)
            lead = 0
            if rec[0] >= 1 and not (fl & 0x800) and not str(act).startswith('pf'):
                st, n = act.split(':'); an = '%s:0x%02x' % (st, int(n, 16))
                ph = PH.get((key, slot, hid, fl, gate, act))
                L_, M_ = key.split('|'); mid = (int(L_) << 8) | int(M_[7:-1])
                sets = []                                          # (phase-set-here, blend, flags) of every setMotion of the motion
                for run in raw.get(an, {}).get('runs', []):
                    for e in run['ev']:
                        if e[0] == 'M' and e[1] == mid:
                            fb = 0 if e[5] in FLAGS0 else (e[4] if isinstance(e[4], int) and e[4] < 0x10000 else None)
                            sets.append((ph in {cc[0] for cc in run['cond']}, abs(e[2]) if e[2] is not None else None, fb))
                bs = {(b, f) for _, b, f in sets}
                here = any(s[0] for s in sets)
                if not sets: log.append('%s %s lead-unknown (the action sets no %s in the census)' % (i, rk, key)); bf = None
                elif len(bs) != 1: log.append('%s %s lead-unknown (blends / flags %s)' % (i, rk, sorted(bs, key=str))); bf = None
                else: bf = next(iter(bs))
                if bf and bf[0] is not None and bf[1] is not None:
                    b, fb = bf
                    if fb & 1: lead = 0
                    elif gate >= 0: lead = max(0, int(round(b - gate)))
                    elif here: lead = int(round(b))
                    elif b > 0: log.append('%s %s lead-unknown (set before the arm phase, no frame gate; blend %s)' % (i, rk, b))
                elif bf: log.append('%s %s lead-unknown (blend / flags not logged)' % (i, rk))
            if lead: leads[i][rk] = lead
            # THE CARRY CASE: unlocked, the window (with the lead) past the clip's end
            if not (fl & 1) or key in O: continue
            w = AC.windowOf(rec, gate)
            if not w: continue
            end = w[1] + lead
            if key not in L:
                cases.append({'rk': rk, 'refuse': 'not-in-lists'}); continue
            if end <= L[key]: continue
            if str(act).startswith('pf'):
                cases.append({'rk': rk, 'refuse': 'per-frame'}); continue
            st, n = act.split(':')
            cls = 'uEm%03d_00' % SHARED.get(int(i[2:5]), int(i[2:5]))
            cases.append({'rk': rk, 'id': i, 'cls': cls, 'em': int(i[2:5]), 'var': int(i[6:8]), 'st': int(st), 'n': int(n, 16),
                          'phase': PH.get((key, slot, hid, fl, gate, act), 0), 'gate': gate, 'key': key, 'end': end,
                          'clipLen': L, 'open': sorted(O)})
    json.dump(cases, open(os.path.join(OUT, 'cases_%s.json' % i), 'w'))
json.dump(leads, open(os.path.join(OUT, 'leads.json'), 'w'), indent=0)
open(os.path.join(OUT, 'leadlog.txt'), 'w').write('\n'.join(log) + '\n')
print('leads', sum(len(v) for v in leads.values()), 'lead-unknown', len(log),
      'cases', sum(len(json.load(open(os.path.join(OUT, 'cases_%s.json' % i)))) for i in leads))

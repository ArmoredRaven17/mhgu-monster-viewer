"""leadcases2.py <jobs|final> <raw census dir> <ctl dir> <out dir> (atkfix lane, 2026-10-27): the lead per arm (leadcases.py's
reading, see there) with the unknowns resolved where the ROM allows, then the carry cases for carrysim2.py.

Per arm (action A, its census phase pa and frame gate g, motion K):
  1. the setMotions of K in A's runs AT the arm's phase (the arm's own run): one (blend, flags) -> t = g >= 0 ? g : 0;
     more than one -> 'several-in-phase' (named with the condition that splits them);
  2. none there but K set by A in another phase, one (blend, flags): t = g when the arm asked a frame gate, else the arm's frame is
     STEPPED by carrysim2.py --lead from the setMotion's run to the arm's phase (job);
  3. A sets no K: the arm was credited to A by the attack census's follow rerun (trap 176): the followed action B (A's chains
     'follow', one level) that sets K and arms the same record on K in its own census line -> 1 / 2 with B's phase and gate;
  4. the rest named: 'sentinel-motion' (K = 0xfff, the tracer's no-motion), 'follow-unresolved', 'several', 'flags-not-logged'.
Out (final): leads.json, leadlog.txt (every arm left without a lead, by cause), cases_<id>.json (+ 'blend' of K for carrysim2)."""
import sys, os, json, re, struct
MODE, RAW, CTL, OUT = sys.argv[1:5]
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
sys.path.insert(0, r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\archive\zg')
import atkcarry as AC
D = json.load(open(os.path.join(V, 'attack-hitshapes.json')))
AMJ = json.load(open(os.path.join(V, 'action-motions.json')))
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
def newwin(rec, gate, lead, fl):
    # render/attack-hitboxes.js windowOf (READ: 0x7dc74.. and the lead)
    arm = gate if gate >= 0 else 0; start, dur = rec[0], rec[1]
    if start < 1 or (fl & 0x800):
        d = 0 if (fl & 0x800) else -start
        return [arm + d, arm + d + dur] if dur >= 1 else None
    S = start + lead; a, b = max(S, arm), S + dur
    return [a, b] if b > a else None
def an_(act):
    st, n = act.split(':'); return '%s:0x%02x' % (st, int(n, 16))
def ksets(raw, an, mid):
    out = []
    for run in raw.get(an, {}).get('runs', []):
        for e in run['ev']:
            if e[0] == 'M' and e[1] == mid:
                fb = 0 if e[5] in FLAGS0 else (e[4] if isinstance(e[4], int) and e[4] < 0x10000 else None)
                out.append({'ph': sorted({c[0] for c in run['cond']}), 'b': abs(e[2]) if e[2] is not None else None, 'f': fb,
                            'cond': run['cond'], 'subs': sorted({c[1] for c in run['cond']})})
    return out
def splitby(sets):
    fields = ['phase', 'sub', 'ended', 'frame', 'ret']
    groups = {}
    for s in sets: groups.setdefault((s['b'], s['f']), []).append(s)
    for fi, nm in enumerate(fields):
        vals = [set(c[fi] for s in g for c in s['cond']) for g in groups.values()]
        if all(not (vals[i] & vals[j]) for i in range(len(vals)) for j in range(i + 1, len(vals))): return nm
    return 'mixed'
LEADRES = json.load(open(os.path.join(OUT, 'leadjobs_out.json'))) if MODE == 'final' else {}
leads, log, jobs = {}, [], {}
for ent in MJ:
    i = ent['id']
    if i not in D: continue
    raw = json.load(open(os.path.join(RAW, i + '.json')))['actions']
    L, O = clips(ent)
    PH = {}; LN = {}
    cp = os.path.join(CTL, i + '.txt')
    if os.path.exists(cp):
        for l in open(cp, encoding='utf8', errors='replace'):
            m = LINE.match(l.strip())
            if not m: continue
            st, n, kind, slot, hid, fl, LL, M, ph, gate = m.groups()
            key = LL + '|Motion[' + M + ']'; act = '%s:%s' % (st, n)
            k = (key, int(slot), int(hid, 16), int(fl, 16), float(gate), act)
            PH[k] = min(PH.get(k, 99), int(ph))
            LN.setdefault((key, int(slot), int(hid, 16), int(fl, 16), an_(act)), []).append((int(ph), float(gate)))
    d = D[i]; leads[i] = {}; cases = []
    chains = AMJ[i]['chains']
    for key, arms in d['arms'].items():
        for r in arms:
            if len(r) > 5 and r[5]: continue                      # a carried row: its lead is its source's
            slot, hid, fl, gate, act = r[:5]
            second = hid >= 1000; recs = d.get('records2') if second else d.get('records'); ix = hid - 1000 if second else hid
            rec = recs[ix] if recs and 0 <= ix < len(recs) else None
            if not rec: continue
            rk = '%s|%d|%d|%d|%s|%s' % (key, slot, hid, fl, gate, act)
            lead, why, blendK = 0, None, 0.0
            if rec[0] >= 1 and not (fl & 0x800) and not str(act).startswith('pf'):
                an = an_(act); pa = PH.get((key, slot, hid, fl, gate, act), 0); g = gate
                L_, M_ = key.split('|'); mid = (int(L_) << 8) | int(M_[7:-1])
                src = an
                sets = ksets(raw, an, mid)
                if not sets:
                    if mid == 0xfff: why = 'sentinel-motion'
                    else:
                        fol = [c[1] for c in chains.get(an, []) if c[0] == 'follow']
                        hit = [(b, LN[(key, slot, hid, fl, b)]) for b in fol if (key, slot, hid, fl, b) in LN and ksets(raw, b, mid)]
                        if len(hit) == 1:
                            src = hit[0][0]; pa, g = min(hit[0][1]); sets = ksets(raw, src, mid)
                        else: why = 'follow-unresolved' if fol else 'no-setter'
                if sets and not why:
                    here = [s for s in sets if pa in s['ph']]
                    use = here or sets
                    bf = {(s['b'], s['f']) for s in use}
                    if len(bf) != 1: why = ('several-in-phase:' if here else 'several:') + splitby(use)
                    else:
                        b, f = next(iter(bf)); blendK = b or 0.0
                        if b is None or f is None: why = 'flags-not-logged'
                        elif f & 1: lead = 0
                        elif g >= 0: lead = max(0, int(round(b - g)))
                        elif here: lead = int(round(b))
                        elif b > 0:
                            pk = min(min(s['ph']) for s in sets); sk = min(min(s['subs']) for s in sets if pk in s['ph'])
                            jid = '%s|%s|%d' % (rk, src, pk)
                            if MODE == 'jobs':
                                jobs.setdefault(i, []).append({'jid': jid, 'id': i, 'var': int(i[6:8]), 'st': int(src.split(':')[0]),
                                    'n': int(src.split(':')[1], 16), 'pk': pk, 'sk': sk, 'pa': pa, 'b': b, 'key': key, 'len': L.get(key, 9999),
                                    'cls': 'uEm%03d_00' % SHARED.get(int(i[2:5]), int(i[2:5])), 'em': int(i[2:5])})
                                why = 'stepping'
                            else:
                                rr = LEADRES.get(i + ' ' + jid)
                                if rr and rr['kind'] == 't': lead = max(0, int(round(b - rr['t'])))
                                else: why = 'arm-frame:' + (rr['why'] if rr else 'no-job')
            if why and why != 'stepping': log.append('%s %s %s' % (i, rk, why))
            if lead: leads[i][rk] = lead
            if MODE != 'final': continue
            if not (fl & 1) or key in O: continue
            w = newwin(rec, gate, lead, fl)
            if not w: continue
            end = w[1]
            if key not in L: cases.append({'rk': rk, 'refuse': 'not-in-lists'}); continue
            if end <= L[key]: continue
            if str(act).startswith('pf'): cases.append({'rk': rk, 'refuse': 'per-frame'}); continue
            st, n = act.split(':')
            cases.append({'rk': rk, 'id': i, 'cls': 'uEm%03d_00' % SHARED.get(int(i[2:5]), int(i[2:5])), 'em': int(i[2:5]), 'var': int(i[6:8]),
                          'st': int(st), 'n': int(n, 16), 'phase': PH.get((key, slot, hid, fl, gate, act), 0), 'gate': gate, 'key': key,
                          'end': end, 'blend': blendK, 'clipLen': L, 'open': sorted(O), 'slot': slot,
                          'win': newwin(rec, gate, lead, fl)})
    if MODE == 'final': json.dump(cases, open(os.path.join(OUT, 'cases_%s.json' % i), 'w'))
if MODE == 'jobs':
    for i, js in jobs.items(): json.dump(js, open(os.path.join(OUT, 'lead_%s.json' % i), 'w'))
    print('lead jobs', sum(len(v) for v in jobs.values()), 'named', len(log))
else:
    json.dump(leads, open(os.path.join(OUT, 'leads.json'), 'w'), indent=0)
    open(os.path.join(OUT, 'leadlog.txt'), 'w').write('\n'.join(log) + '\n')
    import collections
    print('leads', sum(len(v) for v in leads.values()), 'left without', len(log), dict(collections.Counter(l.split()[-1].split(':')[0] for l in log)))

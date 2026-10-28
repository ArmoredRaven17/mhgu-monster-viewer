"""actmot/build.py <rawdir> <docs/action-motions.json>: the census (census.py's raw per-monster files) -> the viewer table.

Per monster:
  actions["st:0xNN"] = [ {m: "L|Motion[N]", ph: [phases], via: [setter / turn:<side>:<record> / script:<addr>:op<k>],
                          posture: [..] (the posture set before the motion in the same run; "in" = none set in that run: the
                          postures the action set in earlier phases, listed after it), rate: [..] (0xb07b4 after it, same run),
                          start: [..], blend: [..], when: {sub, ef, ret} (only the dimensions the motion does NOT appear under all
                          values of: sub = P+0x1a2, ef = "<ended><frame>", ret = the answer of the stubbed shared calls), psl: [w0, w1]
                          (vt+0x13c's e+0x13f4 with that action and motion, shared calls 0 / 1; null = no word) } ]
  partner["st:0xNN"] = ["L|Motion[N]", ..]       the partner layer (vt+0x3d8: 0xb00b4 / 0xb0174's r2, 0xb032c / 0xb0004)
  chains["st:0xNN"] = [[kind, "st:0xNN", [phases]], ..]   the change family (follow / hold / req / set / changeAction)
  none["st:0xNN"] = {chains, stubs}                live actions that set no motion in any run (the shared calls they make)
  motions["L|Motion[N]"] = ["st:0xNN", ..]         the inverse (main layer only)
  err = actions whose runs faulted / ran out of budget (named, not dropped)"""
import sys, os, json, glob
raw, out = sys.argv[1], sys.argv[2]
SUBS, EFS, RETS = {0, 1, 2, 3}, {'00', '01', '11'}, {0, 1}


def mk(m):
    # the list nibble as tracec / attrace read it ((m >> 8) & 0xf); 0xffff = no motion (-1). Ids above 0xfff (em046 / em049 0x27xx)
    # keep that reading: how the motion player takes the high byte is NOT READ (dev/action-motions.md, open items)
    if m == 0xffff: return None
    return '%d|Motion[%d]' % ((m >> 8) & 0xf, m & 0xff)


def akey(st, n): return '%d:0x%02x' % (st, n)


res = {}
for p in sorted(glob.glob(os.path.join(raw, 'em*.json'))):
    D = json.load(open(p)); mid = D['id']
    acts, partner, chains, none, inv, errs = {}, {}, {}, {}, {}, {}
    nomot, rawid = set(), {}
    for a, r in D['actions'].items():
        ent = {}; pp = set(); ch = {}
        # postures this action sets, by phase (for motions in a phase that sets none)
        post_by_ph = {}
        for run in r['runs']:
            for e in run['ev']:
                if e[0] == 'P':
                    for c in run['cond']: post_by_ph.setdefault(c[0], set()).add(e[1])
        for run in r['runs']:
            post = None; last = None
            for e in run['ev']:
                if e[0] == 'P': post = e[1]
                elif e[0] == 'M':
                    k = mk(e[1])
                    if k is None: nomot.add(a); continue
                    if e[1] > 0xfff: rawid.setdefault(a, set()).add('%#x' % e[1])
                    x = ent.setdefault(k, dict(ph=set(), via=set(), posture=set(), rate=set(), start=set(), blend=set(), conds=[]))
                    for c in run['cond']:
                        x['ph'].add(c[0]); x['conds'].append(c)
                        if post is None:
                            inh = sorted({q for ph2, s in post_by_ph.items() if ph2 < c[0] for q in s})
                            x['posture'].add('in' + (':' + '/'.join(map(str, inh)) if inh else ''))
                    if post is not None: x['posture'].add(post)
                    x['via'].add(e[5].split(':0x')[0] if e[5].startswith('script') else e[5])
                    if e[3] is not None: x['start'].add(e[3])
                    if e[2] is not None: x['blend'].add(e[2])
                    last = x
                elif e[0] == 'R' and last is not None: last['rate'].add(e[1])
                elif e[0] == 'W' and mk(e[1]): pp.add(mk(e[1]))
                elif e[0] == 'C' and not e[1].startswith('default'):
                    t = ch.setdefault((e[1], akey(e[2], e[3])), set())
                    for c in run['cond']: t.add(c[0])
        if r['err']: errs[a] = r['err']
        if ch: chains[a] = [[k, t, sorted(v)] for (k, t), v in sorted(ch.items())]
        if pp: partner[a] = sorted(pp)
        if not ent:
            none[a] = {'chains': chains.get(a, []), 'stubs': ['%#x' % s for s in r['stubs']]}
            continue
        rows = []
        for k, x in ent.items():
            cs = x['conds']; when = {}
            subs = {c[1] for c in cs}; efs = {'%d%d' % (c[2], c[3]) for c in cs}; rets = {c[4] for c in cs}
            if subs != SUBS: when['sub'] = sorted(subs)
            if efs != EFS: when['ef'] = sorted(efs)
            if rets != RETS: when['ret'] = sorted(rets)
            m = int(k.split('|')[0]) << 8 | int(k.split('[')[1][:-1])
            w = (D['words'].get(a) or {}).get(str(m))
            row = dict(m=k, ph=sorted(x['ph']), via=sorted(x['via']), posture=sorted(x['posture'], key=str), rate=sorted(x['rate']),
                       start=sorted(x['start']), blend=sorted(x['blend']))
            for z in ('rate', 'start', 'blend'):
                if not row[z]: del row[z]                       # (none set: omitted)
            if when: row['when'] = when
            if w: row['psl'] = [('%#x' % v) if v is not None else None for v in w]
            rows.append(row)
            inv.setdefault(k, set()).add(a)
        acts[a] = sorted(rows, key=lambda q: (q['ph'][0], q['m']))
    res[mid] = dict(cls=D['class'], em=D['em'], variant=D['variant'], live=D['pass1'], actions=acts, partner=partner, chains=chains,
                    none=none, motions={k: sorted(v) for k, v in sorted(inv.items())}, err=errs,
                    minus1=sorted(nomot), raw={a: sorted(v) for a, v in rawid.items()})
about = ('ACTION -> MOTION CENSUS (action-motion census lane, 2026-10-27; dev/action-motions.md; tools dev/archive/actmot/). Each '
         'monster\'s action main (vt+0x1f4) run under unicorn for every handled (status, number) x phase P+0x1a1 x sub-phase P+0x1a2 '
         'x (ended, frame) x the stubbed shared calls answered 0 / 1; every setMotion of the family, turn-table motion (0x772b4\'s '
         'records) and status-script motion (0xa1290) recorded with the posture, rate, start, blend and the PSL word. Keys: '
         'actions, partner, chains, none, motions (the inverse), err, minus1 (actions that set motion 0xffff), raw (ids above 0xfff).')
json.dump(dict(_about=about, **res), open(out, 'w'), separators=(',', ':'))
print('monsters', len(res), 'bytes', os.path.getsize(out))
print('actions with motions', sum(len(v['actions']) for v in res.values()), 'no-motion live', sum(len(v['none']) for v in res.values()),
      'err', sum(len(v['err']) for v in res.values()))

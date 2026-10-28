"""hypermotion/anyaction.py (hyper-motion lane, 2026-10-28): what the viewer's ModifyData speed rule change does, clip by clip.

Raven, 2026-10-28: "We don't need to worry about actions then. If a part is hyper and impacts a clip's speed, use the hyper speed".
index.html hyperMotionAt now plays a clip at the ModifyData factor when ANY action that plays it (the play's own action, the attack
census `arms`, ModifyData's `actMotions`, the full census action-motions.json `motions`) has a factor other than 1 for the held pair
(0xc9e88's own pick per action: both groups' ActionElements held, group 0's entries then group 1's, the first naming it); two or more
different non-1 factors -> the largest. A VIEWER CHOICE: the game applies the factor only when that action plays the clip.

Per monster, file (below G / G) and pair the Hyper row offers, every clip in the viewer's lists: the OLD factor (the play's named
action -- the shells' pick / CLIP_ACTIONS, hyperattacks.py viewer_actions -- else the census when its factors all agree, else 1) and
the NEW one, the hook's rates (unchanged), and the predicted played length (1/60 s render frames, the meter's model).
   python dev/archive/hypermotion/anyaction.py   -> anyaction.json + anyaction.out (beside this file)
"""
import json, os, re, sys, importlib.util, collections
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('hyperattacks', os.path.join(HERE, '..', 'hyperattacks', 'hyperattacks.py'))
HA = importlib.util.module_from_spec(spec); spec.loader.exec_module(HA)

def durations(mon):
    m = HA.MONS.get(mon) or {}; out = {}
    for L in m.get('lists', []):
        for c in L.get('clips', []):
            if re.fullmatch(r'Motion\[\d+\]', c['clip']): out['%s|%s' % (L['id'], c['clip'])] = round(c['dur'] * 60)
    return out
def played(length, factor, rates):
    """motionmeter.mjs's prediction: the frame step = factor x the hook's rate at that frame, seen from the step after its crossing"""
    t, steps, r = 0, 0, 1
    while t < length and steps < 5000:
        hr = 1
        for fr, x in rates:
            if t >= fr: hr = x
        t += r; steps += 1; r = factor * hr
    return steps

rows, multi, powmulti = [], [], []
for mon in [m for m in HA.HM if m != '_about']:
    M = HA.Mon(mon); dur = durations(mon)
    for fk in M.files:
        for pair in HA.pairs(mon, fk):
            hooks = M.T[fk]['hooks'].get(pair, {})
            for ck in sorted(M.vclips, key=lambda c: [int(x) for x in re.findall(r'\d+', c)]):
                fac = lambda a: HA.factor(HA.modify_entry(M, fk, pair, a)[0])
                how, named = M.viewer_actions(ck)
                cen = M.census(ck)
                if how == 'census' or not named:                 # (a CLIP_ACTIONS entry naming no action: the play has none)
                    fs = {fac(a) for a in cen}
                    old = sorted(fs) if len(fs) == 1 else [1]
                else:
                    old = sorted({fac(a) for a in named})
                acts = set(cen) | set(named or ())
                by = collections.defaultdict(list)
                for a in acts:
                    f = fac(a)
                    if f != 1: by[f].append(HA.aname(a))
                new = max(by) if by else 1
                hk = hooks.get(HA.hkey(ck))
                if old == [new] and not by: continue
                rates = hk['rates'] if hk else []
                n = dur.get(ck)
                r = dict(mon=mon, rank=HA.RANK[fk], pair=pair, clip=HA.hkey(ck), route=how, old=old, new=new,
                         factors={('%g' % f): sorted(v) for f, v in sorted(by.items())}, census=len(acts), hook=bool(hk),
                         len=n, before=[played(n, f, rates) for f in old] if n else None, after=played(n, new, rates) if n else None)
                rows.append(r)
                if len(by) > 1: multi.append(r)
            # the power (the Attack Hitboxes tooltip only), the same rule: AttackRate / PowerRate other than x1 / +0, the largest
            for ck in sorted(M.vclips, key=lambda c: [int(x) for x in re.findall(r'\d+', c)]):
                how, named = M.viewer_actions(ck)
                pw = collections.defaultdict(list)
                for a in set(M.census(ck)) | set(named or ()):
                    e = HA.modify_entry(M, fk, pair, a)[0]
                    if e and len(e) > 6 and (e[5] != 1 or e[6] != 0): pw[(e[5], e[6])].append(HA.aname(a))
                if len(pw) > 1:
                    powmulti.append(dict(mon=mon, rank=HA.RANK[fk], pair=pair, clip=HA.hkey(ck), pick='x%g +%g' % max(pw),
                                         values={'x%g +%g' % k: sorted(v) for k, v in sorted(pw.items())}))
json.dump({'_about': __doc__.strip().splitlines()[0], 'rows': rows, 'powerMulti': powmulti},open(os.path.join(HERE, 'anyaction.json'), 'w', encoding='utf8'), indent=0)
ch = [r for r in rows if r['old'] != [r['new']]]
with open(os.path.join(HERE, 'anyaction.out'), 'w', encoding='utf8') as o:
    def p(s=''): o.write(s + '\n')
    p('clips (monster x rank x pair x clip) with a non-1 factor from any action: %d; whose factor changes: %d (%d of them hooked); '
      'with two or more different non-1 factors (the largest taken): %d' % (len(rows), len(ch), sum(r['hook'] for r in ch), len(multi)))
    p(); p('== CHANGED (old -> new; played length at 1/60 s, the viewer\'s own list; "split" = _start / _loop, no single length) ==')
    for r in ch:
        p('%s %-5s %-5s %-8s route %-12s x%s -> x%g  %s%s  %s' % (r['mon'], r['rank'], r['pair'], r['clip'], r['route'], '/'.join('%g' % f for f in r['old']), r['new'],
          ('%s -> %d' % ('/'.join(map(str, r['before'])), r['after'])) if r['len'] else 'split', ' [hooked]' if r['hook'] else '',
          '; '.join('x%s: %s' % (f, ' '.join(a)) for f, a in r['factors'].items())))
    p(); p('== TWO OR MORE DIFFERENT NON-1 FACTORS (the largest is played) ==')
    for r in multi:
        p('%s %-5s %-5s %-8s -> x%g   %s' % (r['mon'], r['rank'], r['pair'], r['clip'], r['new'], '; '.join('x%s: %s' % (f, ' '.join(a)) for f, a in r['factors'].items())))
    p(); p('== POWER (tooltip only): TWO OR MORE DIFFERENT AttackRate / PowerRate ON ONE CLIP (the largest is listed): %d ==' % len(powmulti))
    for r in powmulti:
        p('%s %-5s %-5s %-8s -> %s   %s' % (r['mon'], r['rank'], r['pair'], r['clip'], r['pick'], '; '.join('%s: %s' % (k, ' '.join(a)) for k, a in r['values'].items())))
print(open(os.path.join(HERE, 'anyaction.out'), encoding='utf8').readline().strip())

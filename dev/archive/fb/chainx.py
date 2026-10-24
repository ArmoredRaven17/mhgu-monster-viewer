# chainx.py <mon> [class] (2026-10-19): the actions a monster's EMC issues (emcvar, its own variant = the mon suffix) closed over every
# action change their phases make, with trgen BEFORE the vt+0x3d0 / e+0x7420 fix (old3d0/trgen.py) and AFTER it; prints the actions only
# the new walk reaches and, for each, the shell creates trgen sees in phases 0..5 x the frame / ended / landed scenarios (id, mode, the
# last frame test). env FB_PHASEAT passes through (Amatsu).
import sys, os, subprocess, importlib.util, json
mon = sys.argv[1]; cls = sys.argv[2] if len(sys.argv) > 2 else 'uEm%s_00' % mon[2:5]
v = int(mon.split('_')[1])
emc = r'C:\MHGU-Extract\scratch-em\%s\enemy\cmd_tbl\%s_cmdtbl.emc' % (mon, mon)
HERE = os.path.dirname(os.path.abspath(__file__))
import glob as _g
if not os.path.exists(emc):   # (Shagaru's folder holds em071_00_cmdtbl.emc: take the folder's one table)
    _c = _g.glob(os.path.join(r'C:\MHGU-Extract\scratch-em', mon, 'enemy', 'cmd_tbl', '*_cmdtbl.emc'))
    if len(_c) == 1: emc = _c[0]
if not os.path.exists(emc):   # a subspecies / variant shares the base's command table (the 0x92 switch on e+0xb5f5 picks)
    base = mon[:6] + '00'; emc = r'C:\MHGU-Extract\scratch-em\%s\enemy\cmd_tbl\%s_cmdtbl.emc' % (mon, base)   # (the subspecies' own folder holds its copy under the base's name)
iss = subprocess.check_output([sys.executable, os.path.join(HERE, 'emcvar.py'), emc, str(v)], text=True).split()
os.environ['FB_CLASS'] = cls; os.environ['FB_MON'] = mon
sys.argv = ['x']
def load(path, name):
    sp = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m); return m
SC = ({}, {'frame': 1, 'frame2': 1}, {'ended': 1}, {'landed': 1, 'ended': 1})
RT = ((0, 0),)
def walk(T, rt=None):
    todo = [tuple(int(x, 0) for x in a.split(':')) for a in iss]; seen = set(todo); edges = []
    while todo:
        st, n = todo.pop()
        for ph in range(6):
            for sc0 in SC:
              for rg, td in (rt or RT):
                sc = dict(sc0, rage=rg, tired=td) if rt else sc0
                r = T.run(st, n, ph, v, 0, stub={0x3a8430: 5}, **sc)
                for e in r.get('ev', []):
                    if e[0] == 'chg':
                        t = (e[1] & 0xff, e[2] & 0xff)
                        if t not in seen: seen.add(t); todo.append(t); edges.append('%d:%#04x->%d:%#04x' % (st, n, t[0], t[1]))
    return seen, edges
sys.path.insert(0, HERE)
To = load(os.path.join(HERE, 'old3d0', 'trgen.py'), 'trgen_old'); so, eo = walk(To)
Tn = load(os.path.join(HERE, 'trgen.py'), 'trgen_new'); sn, en = walk(Tn, ((0, 0), (1, 0), (0, 1), (1, 1)))   # rage x tired
sv, _ = walk(Tn, ((0, 0),))   # the fixed walk at rage 0 / tired 0 alone: what the rage / tired answers add
new = sorted(sn - so)
json.dump({'old': sorted(so), 'new': sorted(sn), 'rt00': sorted(sv)}, open(os.path.join(HERE, 'reach_%s.json' % mon), 'w'))
print(mon, cls, 'v%d' % v, 'issued %d, old %d, new %d' % (len(iss), len(so), len(sn)))
print('  edges (new walk):', ' '.join(en))
for st, n in new:
    cr = set(); mots = {}
    # (+ the timers answered: 0x7206c / 0x7264c and the countdown 0x539d5c -- trap 83's census-blind makers)
    for ph in range(6):
        for sc in SC + ({'frame': 1, 'frame2': 1, 'ended': 1}, {'timer': 1}, {'timer': 1, 'frame': 1, 'frame2': 1}):
            stub = {0x3a8430: 5}
            if sc.get('timer'): stub[0x539d5c] = 1
            for rg, td in ((0, 0), (1, 0), (0, 1), (1, 1)):
              r = Tn.run(st, n, ph, v, 0, stub=stub, **dict(sc, rage=rg, tired=td))
              for e in r.get('ev', []):
                if e[0] == 'create': cr.add('%s m%d f%s p%d%s' % (e[1], e[2], e[6], ph, ' T' if sc.get('timer') else ''))
                if e[0] == 'mot': mots.setdefault(ph, set()).add(e[1])
    ms = ' | '.join('p%d %s' % (k, '/'.join(sorted(x))) for k, x in sorted(mots.items()))
    print('  NEW %d:%#04x%s' % (st, n, '' if (st, n) in sv else ' (RAGE/TIRED)'), '; '.join(sorted(cr)) if cr else '(no create)', ' [' + ms + ']')

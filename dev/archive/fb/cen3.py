# cen3.py <mon> [class] (2026-10-19): the census of the REACHED actions three ways -- old trgen (pre vt+0x3d0 / e+0x7420 / rage arms) over
# the old reach, and the fixed trgen over the fixed reach (fb/chainx.py's reach_<mon>.json) at tired 0 and tired 1 (rage 0 / 1 inside
# cengen11, now on 0x81670 / 0x81688 / 0x816b8) -- and prints every create key (id, mode, frame) the fixed runs add, by action
import os, sys, json, struct, subprocess, re, ast
D = os.path.dirname(os.path.abspath(__file__))
mon = sys.argv[1]; cls = sys.argv[2] if len(sys.argv) > 2 else 'uEm%s_00' % mon[2:5]; v = int(mon.split('_')[1])
R = json.load(open(os.path.join(D, 'reach_%s.json' % mon)))
out = subprocess.run([sys.executable, r'C:\MHGU-Extract\efx\agents\diablos-scratch\dtp.py', mon], capture_output=True, text=True, cwd=r'C:\MHGU-Extract\efx').stdout
a = out.split('array A')[1].split('array')[0] if 'array A' in out else ''
d = []
for m in re.finditer(r'blk=0x([0-9a-f]+)', a): d += list(struct.pack('<I', int(m.group(1), 16)))
E = 0x30000000; A = 0x200000
poke = {'0x75f0': list(struct.pack('<I', E + A)), hex(A + 0x64): list(struct.pack('<I', E + A + 0x100)), hex(A + 0x100): d} if d else {}
def ns(L):
    o = {}
    for st, n in L: o.setdefault(str(st), []).append(n)
    return o
def run(cg, L, tired):
    env = dict(os.environ, FB_CLASS=cls, FB_MON=mon, FB_POKE=json.dumps(poke), FB_NS=json.dumps(ns(L)), FB_TIRED=str(tired))
    sts = ','.join(sorted({str(st) for st, n in L}, key=int))
    p = subprocess.run([sys.executable, cg, sts, str(v)], cwd=os.path.dirname(cg), env=env, capture_output=True, text=True)
    res = {}
    for line in p.stdout.splitlines():
        try:
            vv, act, rest = line.split(' ', 2)
            mots, dd = rest.split('] ', 1)
            dd = ast.literal_eval(dd)
        except Exception: continue
        res[act] = {' '.join(k.split(' ')[:3]) for k in dd}, mots + ']'
    return res
old = run(os.path.join(D, 'old3d0', 'cengen11.py'), [tuple(x) for x in R['old']], 0)
n0 = run(os.path.join(D, 'cengen11.py'), [tuple(x) for x in R['new']], 0)
n1 = run(os.path.join(D, 'cengen11.py'), [tuple(x) for x in R['new']], 1)
print('==', mon, cls, 'v%d' % v, 'actions with creates: old %d, fixed t0 %d, t1 %d' % (len(old), len(n0), len(n1)))
for act in sorted(set(n0) | set(n1), key=lambda x: (int(x.split(':')[0]), int(x.split(':')[1], 16))):
    o = old.get(act, (set(), ''))[0]
    a0 = n0.get(act, (set(), ''))[0]; a1 = n1.get(act, (set(), ''))[0]
    add = sorted((a0 | a1) - o)
    if add:
        tag = 'NEW ACTION' if act not in old else 'new creates'
        print('  %s %s %s: %s' % (act, (n0.get(act) or n1.get(act))[1], tag, '; '.join(k + ('' if k in a0 else ' (tired)') for k in add)))
for act in sorted(set(n0) | set(n1), key=lambda x: (int(x.split(':')[0]), int(x.split(':')[1], 16))):
    a0 = n0.get(act, (set(), ''))[0]; a1 = n1.get(act, (set(), ''))[0]
    if a0 - a1: print('  %s TIRED-GATED (made at tired 0, not at tired 1): %s' % (act, '; '.join(sorted(a0 - a1))))
    if a1 - a0: print('  %s TIRED-ONLY: %s' % (act, '; '.join(sorted(a1 - a0))))
for act in sorted(set(old) - set(n0) - set(n1)): print('  %s lost in the fixed runs: %s' % (act, sorted(old[act][0])))

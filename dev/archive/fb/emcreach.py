# emcreach.py (2026-10-19): the actions a monster's command table can issue FOR ITS VARIANT -- the walk of <scratchpad>\duo\emclink.py
# (roots g0 s0 + every stream of groups >= 2; op 0x20 n -> g0 sn, op 0x14 n -> g1 sn) with op 0x92 (the variant switch on e+0xb5f5)
# EVALUATED for the monster's variant byte (its sub id) and every other block walked on all branches (a superset of what it issues).
# -> emcreach.json {mon: ['st:0xnn', ..]}, for fbbcmp.mjs
import sys, json, os, glob
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\zamtrios-scratch')
import emc
D = os.path.dirname(os.path.abspath(__file__))
def live(seq, var):
    out = []; stack = []; act = True
    for b in seq:
        if b[0] == 0x92 and len(b) >= 2:
            sub = b[1]
            if sub == 0x00: stack.append([False, False, act]); act = False
            elif sub == 0x01 and stack:
                top = stack[-1]; top[1] = top[2] and not top[0] and len(b) > 2 and b[2] == var
                if top[1]: top[0] = True
                act = top[1]
            elif sub == 0x02 and stack:
                top = stack[-1]; top[1] = top[2] and not top[0]; top[0] = True; act = top[1]
            elif sub == 0xff and stack:
                top = stack.pop(); act = top[2]
            continue
        if act: out.append(b)
    return out
def reach(path, var):
    ver, groups = emc.load(path)
    ops = {(g, k): live([[int(x, 16) for x in o.split(' ')] for o in emc.parse(s) if not o.startswith('?')], var)
           for g, ss in enumerate(groups) for k, s in enumerate(ss)}
    seen = set(); acts = set()
    def walk(key):
        if key in seen: return
        seen.add(key)
        for b in ops.get(key, []):
            if b[0] == 0xff: break
            if b[0] == 0x00 and len(b) == 3: acts.add('%d:0x%02x' % (b[1], b[2]))
            elif b[0] == 0x20 and len(b) == 2: walk((0, b[1]))
            elif b[0] == 0x14 and len(b) == 2: walk((1, b[1]))
    walk((0, 0))
    for (g, k) in ops:
        if g >= 2: walk((g, k))
    return sorted(acts)
mons = [l.split()[0] for l in open(os.path.join(D, '..', 'neset', 'fbb_list.txt')) if l.startswith('em')]
out = {}
for mon in mons:
    g = glob.glob(r'C:\MHGU-Extract\scratch-em\%s\enemy\cmd_tbl\*_cmdtbl.emc' % mon)
    out[mon] = reach(g[0], int(mon[6:8])) if g else None
json.dump(out, open(os.path.join(D, 'emcreach.json'), 'w'), indent=0)
print({k: (len(v) if v is not None else None) for k, v in out.items()})

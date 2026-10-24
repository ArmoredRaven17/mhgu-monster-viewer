# emcvar.py <file.emc> <variant>: the actions a command table can issue for one variant -- op 0x92 (the variant switch on e+0xb5f5:
# 92 00 open / 92 01 v case / 92 02 default / 92 ff close) evaluated, every other block op walked on all branches; op 0x20 n -> g0
# stream n, op 0x14 n -> g1 stream n. Roots: g0 s0 and every stream of groups >= 2. (After duo/emclink.py.)
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\zamtrios-scratch')
import emc
ver, groups = emc.load(sys.argv[1])
VAR = int(sys.argv[2])
def live(seq, var):
    out = []; stack = []; act = True
    for b in seq:
        if b[0] == 0x92:
            sub = b[1]
            if sub == 0x00: stack.append([False, False, act]); act = False
            elif sub == 0x01:
                top = stack[-1]; top[1] = top[2] and not top[0] and b[2] == var
                if top[1]: top[0] = True
                act = top[1]
            elif sub == 0x02:
                top = stack[-1]; top[1] = top[2] and not top[0]; top[0] = True; act = top[1]
            elif sub == 0xff:
                top = stack.pop(); act = top[2]
            continue
        if act: out.append(b)
    return out
ops = {(g, k): live([[int(x, 16) for x in o.split(' ')] for o in emc.parse(s) if not o.startswith('?')], VAR)
       for g, ss in enumerate(groups) for k, s in enumerate(ss)}
seen, issued = set(), {}
def walk(key):
    if key in seen: return
    seen.add(key)
    for b in ops.get(key, []):
        if b[0] == 0xff: break
        if b[0] == 0x00 and len(b) == 3: issued.setdefault((b[1], b[2]), set()).add('g%ds%d' % key)
        elif b[0] == 0x20 and len(b) == 2: walk((0, b[1]))
        elif b[0] == 0x14 and len(b) == 2: walk((1, b[1]))
walk((0, 0))
for (g, k) in ops:
    if g >= 2: walk((g, k))
print(' '.join('%d:%#04x' % a for a in sorted(issued)))

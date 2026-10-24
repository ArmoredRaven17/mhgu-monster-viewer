# emclink.py <file.emc> <out.json>: the command table walked with THE LINK BIT (P+0x1bb & 1) as context -- which
# actions the table issues while combined (1), while not (0), or both. op 0x6f is the class callback switch
# (vtable +0x214): 6f 00 sel open / 6f 01 v case / 6f 02 default / 6f ff close (as z67/emcform.py). Selector 0 is the
# link bit for BOTH classes (Queen 0xf89c5c case 0 `P+0x1bb & 1`, states-em069_00.md 1.3; Seltas 0xfc528c case 0 ->
# 0xfc532c `ldrb [P+0x1bb]; and #1`), so only selector 0 is evaluated; every other block op, and every other selector,
# is walked on all branches. op 0x20 n -> g0 stream n, op 0x14 n -> g1 stream n. Roots: g0 s0 and every stream of
# groups >= 2.
import sys, json
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\zamtrios-scratch')
import emc
ver, groups = emc.load(sys.argv[1])
# op 0x92 (the variant switch on e+0xb5f5, 92 00 open / 92 01 v case / 92 02 default / 92 ff close) is EVALUATED for
# variant 0 first -- MHGU ships only variant 0 of both monsters (states-em069_00.md 1.4; the id table 0x01594ca4)
def live(seq, var=0):
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
ops = {(g, k): live([[int(x, 16) for x in o.split(' ')] for o in emc.parse(s) if not o.startswith('?')])
       for g, ss in enumerate(groups) for k, s in enumerate(ss)}
DESC = emc.DESC
ALL = frozenset({0, 1})
seen = {}
issued = {}
calls = {}
def walk(key, ctx):
    old = seen.get(key, frozenset())
    if ctx <= old: return
    seen[key] = old | ctx
    stack = []
    cur = ctx
    for b in ops.get(key, []):
        op = b[0]
        if op == 0xff: break
        blk = op <= 0xa6 and DESC[op] & 0x80
        if blk and len(b) >= 2:
            mode = b[1]
            if mode == 0:
                sel = b[2] if op == 0x6f and len(b) > 2 else None
                stack.append([op, sel, frozenset(), cur]); continue
            if not stack: continue
            top = stack[-1]
            if mode == 1:
                v = b[2] if len(b) > 2 else None
                if top[0] == 0x6f and top[1] == 0:
                    cs = frozenset({v}) & ALL
                    top[2] = top[2] | cs
                    cur = top[3] & cs
                else:
                    cur = top[3]
                continue
            if mode == 2:
                cur = (top[3] - top[2]) if (top[0] == 0x6f and top[1] == 0) else top[3]
                continue
            if mode == 0xff:
                stack.pop(); cur = top[3]; continue
        if not cur: continue
        if op == 0x00 and len(b) == 3:
            for f in cur: issued.setdefault((b[1], b[2]), {}).setdefault(f, set()).add('g%ds%d' % key)
        elif op == 0x20 and len(b) == 2:
            calls.setdefault(key, set()).add(('g0s%d' % b[1], tuple(sorted(cur)))); walk((0, b[1]), cur)
        elif op == 0x14 and len(b) == 2:
            calls.setdefault(key, set()).add(('g1s%d' % b[1], tuple(sorted(cur)))); walk((1, b[1]), cur)
walk((0, 0), ALL)
for (g, k) in ops:
    if g >= 2: walk((g, k), ALL)
out = {}
for (st, n) in sorted(issued):
    fs = issued[(st, n)]
    tag = 'both' if fs.keys() == {0, 1} else ('COMBINED' if 1 in fs else 'solo')
    out['%d,%#x' % (st, n)] = {'tag': tag, 'streams': {str(f): sorted(v) for f, v in fs.items()}}
    print('(%d, %#04x): %-8s %s' % (st, n, tag, ' | '.join('%d: %s' % (f, ','.join(sorted(fs[f])[:6])) for f in sorted(fs))))
print('g0 contexts:', ' '.join('s%d=%s' % (k[1], ''.join(map(str, sorted(v)))) for k, v in sorted(seen.items()) if k[0] == 0))
print('unreached:', ' '.join('g%ds%d' % k for k in sorted(ops) if k not in seen))
json.dump(out, open(sys.argv[2], 'w'), indent=0)

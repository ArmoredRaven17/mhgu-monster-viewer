# Zamtrios's .emc walked with the FORM (P+0x1bb & 3) as context: which actions the command table issues in which form.
# Selectors (vtable +0x214 = 0xf7580c, states-em067_00.md 1.5, read): sel 0 -> 1 / 4 / 5 for form 0 / 1 / 2;
# sel 4 -> 1 iff form 2; sel 6..9 -> 1 only in form 1 (an armour section still on). op 0x6f = switch(sel): mode 0 open
# (byte 2 = selector), mode 1 case v, mode 2 default, 0xff close. op 0x20 n -> g0 stream n, op 0x14 n -> g1 stream n.
# Entries: g0 s0 and every stream of groups >= 2, all forms. Every other block op is walked on every branch.
import sys, json
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\zamtrios-scratch')
import emc
ver, groups = emc.load(r'C:\MHGU-Extract\scratch-em\em067_00\enemy\cmd_tbl\em067_00_cmdtbl.emc')
ops = {(g, k): [[int(x, 16) for x in o.split(' ')] for o in emc.parse(s) if not o.startswith('?')]
       for g, ss in enumerate(groups) for k, s in enumerate(ss)}
DESC = emc.DESC
ALL = frozenset({0, 1, 2})
def case_set(sel, v):
    if sel == 0: return frozenset({ {1: 0, 4: 1, 5: 2}[v] }) if v in (1, 4, 5) else frozenset()
    if sel == 4: return frozenset({2}) if v == 1 else frozenset({0, 1}) if v == 0 else frozenset()
    if sel == 1: return frozenset({0, 1}) if v in (2, 3) else ALL
    if sel in (6, 7, 8, 9): return frozenset({1}) if v == 1 else ALL if v == 0 else frozenset()
    return ALL
seen = {}           # stream -> union ctx
issued = {}         # (st, n) -> {form: set(streams)}
def walk(key, ctx, path):
    old = seen.get(key, frozenset())
    if ctx <= old: return
    seen[key] = old | ctx
    stack = []      # [op, sel, cased_union, cur_ctx, ctx_at_open]
    cur = ctx
    for b in ops.get(key, []):
        op = b[0]
        if op == 0xff: break
        blk = op <= 0xa6 and DESC[op] & 0x80
        if blk and len(b) >= 2:
            mode = b[1]
            if mode == 0:
                sel = b[2] if op == 0x6f and len(b) > 2 else None
                stack.append([op, sel, frozenset(), cur, cur])
                continue
            if not stack: continue
            top = stack[-1]
            if mode == 1:
                v = b[2] if len(b) > 2 else None
                cs = case_set(top[1], v) if top[0] == 0x6f else ALL
                if top[0] == 0x6f: top[2] = top[2] | cs
                cur = top[4] & cs
                continue
            if mode == 2:
                cur = top[4] - top[2] if top[0] == 0x6f and top[1] in (0, 4, 1) else top[4]
                continue
            if mode == 0xff:
                stack.pop(); cur = top[4]
                continue
        if not cur: continue
        if op == 0x00 and len(b) == 3:
            for f in cur: issued.setdefault((b[1], b[2]), {}).setdefault(f, set()).add('>'.join('g%ds%d' % p for p in path + [key]))
        elif op == 0x20 and len(b) == 2: walk((0, b[1]), cur, path + [key])
        elif op == 0x14 and len(b) == 2: walk((1, b[1]), cur, path + [key])
walk((0, 0), ALL, [])
for (g, k) in ops:
    if g >= 2: walk((g, k), ALL, [])
unreached = [k for k in ops if k not in seen]
print('streams reached', len(seen), 'unreached', len(unreached), ' '.join('g%ds%d' % k for k in sorted(unreached)[:60]))
out = {}
for (st, n) in sorted(issued):
    fs = issued[(st, n)]
    out['%d,%#x' % (st, n)] = sorted(fs)
    print('(%d, %#04x): forms %s   %s' % (st, n, ''.join(str(f) for f in sorted(fs)), ' '.join('%d:%s' % (f, ','.join(sorted(fs[f])[:4])) for f in sorted(fs))))
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else 'emcform.json', 'w'), indent=0)
print('stream ctx (g0):', ' '.join('s%d=%s' % (k[1], ''.join(map(str, sorted(v)))) for k, v in sorted(seen.items()) if k[0] == 0))

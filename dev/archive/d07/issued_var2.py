# every (status, n) an EMC command table can issue FOR ONE VARIANT: op 0x00 in any stream reached -- every stream of the
# groups other than 1, and the group-1 streams those call (op 0x14 n), transitively -- with op 0x92 (the switch on the
# variant byte e+0xb5f5: 92 00 open / 92 01 v case / 92 02 default / 92 ff close, states-em001.md) EVALUATED for the
# given variant; every other conditional op is NOT evaluated (all its branches are walked).
#   python issued_var.py <file.emc> <variant> [status]
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\state-scratch')
import emc
path, var = sys.argv[1], int(sys.argv[2], 0)
stat = int(sys.argv[3], 0) if len(sys.argv) > 3 else None
ver, groups = emc.load(path)
ops = {(g, k): [o.split(' ') for o in emc.parse(s)] for g, ss in enumerate(groups) for k, s in enumerate(ss)}


def live(seq):
    """the ops of a stream that run for this variant (op 0x92 resolved, nested)"""
    out = []
    stack = []          # per open 0x92: [matched_any, active_now, parent_active]
    act = True
    for b in seq:
        if b[0] == '92':
            sub = b[1]
            if sub == '00':
                stack.append([False, False, act]); act = False
            elif sub == '01':
                top = stack[-1]
                top[1] = top[2] and not top[0] and int(b[2], 16) == var
                if top[1]: top[0] = True
                act = top[1]
            elif sub == '02':
                top = stack[-1]
                top[1] = top[2] and not top[0]
                top[0] = True
                act = top[1]
            elif sub == 'ff':
                top = stack.pop(); act = top[2]
            continue
        if act: out.append(b)
    return out


# roots: g0 s0 (the binding starts there, rom-map 0x825f8) and every stream of the event groups 2..20; op 0x20 n is
# followed as a jump to group-0 stream n (INFERRED from the data: 92-variant split 20 04 / 20 17 in g0 s3), op 0x14 n
# as a call of group-1 stream n
todo = [(0, 0)] + [k for k in ops if k[0] >= 2]
seen = set(todo)
while todo:
    key = todo.pop()
    for b in live(ops[key]):
        if b[0] in ('14', '20') and len(b) == 2:
            nk = (1 if b[0] == '14' else 0, int(b[1], 16))
            if nk in ops and nk not in seen: seen.add(nk); todo.append(nk)
got = {}
for key in seen:
    for b in live(ops[key]):
        if b[0] == '00' and len(b) == 3 and (stat is None or int(b[1], 16) == stat):
            got.setdefault((int(b[1], 16), int(b[2], 16)), []).append('g%ds%d' % key)
print('variant', var, 'streams reached', len(seen), 'actions', len(got))
for (s, n), w in sorted(got.items()):
    print('(%d, %#04x) %s' % (s, n, ' '.join(sorted(set(w)))))

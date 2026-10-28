# every (7, n) an em081 command table can issue: op 0x00 7 n in any stream REACHED -- every stream of the groups other
# than 1, and the group-1 streams those call (op 0x14 n), transitively (rathian-variants-scratch/op24.py's `called`)
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\state-scratch')
import emc
res = {}
for path in sys.argv[1:]:
    ver, groups = emc.load(path)
    ops = {(g, k): [o.split(' ') for o in emc.parse(s)] for g, ss in enumerate(groups) for k, s in enumerate(ss)}
    todo = [key for key in ops if key[0] != 1]
    seen = set(todo)
    while todo:
        key = todo.pop()
        for b in ops[key]:
            if b[0] == '14' and len(b) == 2:
                nk = (1, int(b[1], 16))
                if nk in ops and nk not in seen: seen.add(nk); todo.append(nk)
    got = {}
    for key in seen:
        for b in ops[key]:
            if b[0] == '00' and len(b) == 3 and int(b[1], 16) == 7:
                got.setdefault(int(b[2], 16), []).append('g%ds%d' % key)
    name = path.replace(chr(92), '/').split('/')[-1]
    res[name] = got
    print(name, 'streams reached', len(seen), 'actions', len(got))
    print('  ' + ' '.join('%#04x' % n for n in sorted(got)))
if len(res) == 2:
    a, b = list(res.values())
    print('only first:', ' '.join('%#04x' % n for n in sorted(set(a) - set(b))))
    print('only second:', ' '.join('%#04x' % n for n in sorted(set(b) - set(a))))

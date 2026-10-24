import sys, os, struct, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef as s
root = r'C:\MHGU-Extract\scratch-em'
kinds = collections.Counter(); spec = collections.defaultdict(set); grp = collections.Counter()
for mon in sorted(os.listdir(root)):
    p = os.path.join(root, mon, mon + '.arc')
    if not os.path.exists(p): continue
    F = s.load_typed(p)
    for (nm, th), b in sorted(F.items()):
        if not (nm.startswith('shell') and nm.endswith('_hitdata')): continue
        if b[:4] != b'HDS\0': print('BAD', nm); continue
        n = struct.unpack_from('<I', b, 8)[0]
        for k in range(n):
            o = 0x10 + 0x38 * k
            if o + 0x38 > len(b): print('SHORT', nm, k); break
            kind = b[o + 6] or 1; g = b[o + 0x19]
            kinds[kind] += 1; grp[g] += 1
            if kind in (8, 9, 0x34, 0x45, 0xc, 0xd, 0x1e, 0x41): spec[kind].add('%s r%d' % (nm.split(chr(92))[-1], k))
print('kinds', sorted((hex(k), v) for k, v in kinds.items()))
print('groups', sorted(grp.items())[:30])
for k, v in spec.items(): print(hex(k), len(v), sorted(v)[:20])

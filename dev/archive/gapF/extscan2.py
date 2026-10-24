# extscan2.py -- extscan.py with the out-of-band slots of the seven vtables (the shells' base methods, the enemy's uEnemy methods)
# added as roots: does any submit 0x48b884 reached from them build a 0xb0 setup? Each reached submit's function is printed with
# the literal ids stored to +4 before it.
import sys, json, re
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, '.')
import armdis, rdesc
SC = json.load(open(r'C:\MHGU-Extract\efx\agents\shells-scratch\shellclasses.json'))
d = json.load(open('band024.json'))
LO, HI = 0xdeee40, 0xdfeec4
roots = set(int(k, 16) for k in d['ext'] if k.startswith('0x') and int(k, 16) != 0x48b884)
for nm in ['uEm024_00'] + ['uShellEm024_sp_%s' % s for s in ('00', '01', '02', '33', '34', '38')]:
    v = SC[nm]['vtable']; n = 0
    while not (armdis.u32(v + n) == 0 and armdis.u32(v + n + 4) == 0): n += 4
    for w in rdesc.vt_words(v, n):
        if w and 0x10000 <= w < len(armdis.TEXT) and not (LO <= w < HI) and (w & 3) == 0: roots.add(w)
print('roots', len(roots))
seen, ent, ext, unres, tables, fptr = rdesc.walk(sorted(roots), 0x10000, len(armdis.TEXT))
subs = sorted(a for a, (m, o) in seen.items() if m in ('bl', 'b') and o == '#0x48b884')
print('closure %d insns; submits reached: %d' % (len(seen), len(subs)))
for s in subs:
    ids = []
    for b in range(s - 4, s - 0x200, -4):
        m, o = rdesc.dis(b)
        if m == 'push' or (m.startswith('pop') and 'pc' in o): break
        mm = re.match(r'(\w+), \[(\w+), #4\]$', o)
        if m == 'str' and mm:
            src = mm.group(1)
            for c in range(b - 4, b - 0x80, -4):
                cm, co = rdesc.dis(c)
                if co.startswith(src + ', ') and cm in ('mov', 'movw', 'ldr', 'ldrh', 'ldrb'): ids.append('%s %s @%#x' % (cm, co, c)); break
    print('  submit %#x: +4 from %s' % (s, ids[:3]))

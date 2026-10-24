"""Direct-call closure from root functions; report every store whose immediate offset is in OFFS.
Flow-following (b / bcc / bl / tail b), stops a path at pop..pc / bx lr / ldm..pc. Indirect calls logged.
usage: clos.py roots(comma hex) offs(comma hex) [exclude(comma hex)] [maxfn]"""
import d, capstone, sys, re
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
roots = [int(x, 16) for x in sys.argv[1].split(',')]
offs = set(int(x, 16) for x in sys.argv[2].split(','))
excl = set(int(x, 16) for x in sys.argv[3].split(',')) if len(sys.argv) > 3 and sys.argv[3] else set()
maxfn = int(sys.argv[4]) if len(sys.argv) > 4 else 100000
def ins_at(va):
    l = list(md.disasm(d.rd(va), va))
    return l[0] if l else None
fns = list(roots); seenfn = set(roots); hits = []; indirect = set(); seen = set()
i = 0
while i < len(fns) and i < maxfn:
    f = fns[i]; i += 1
    work = [f]
    while work:
        va = work.pop()
        while va not in seen and 0 <= va < len(d.TEXT):
            seen.add(va)
            x = ins_at(va)
            if x is None: break
            m, o = x.mnemonic, x.op_str
            if m.startswith(('str', 'vstr', 'stm', 'vstm')):
                mm = re.search(r'#(0x[0-9a-f]+|\d+)\]', o)
                if mm and int(mm.group(1), 0) in offs:
                    hits.append((f, va, m, o))
            if m in ('bl', 'blx') and o.startswith('#'):
                t = int(o[1:], 0)
                if t not in seenfn and t not in excl and t < 0x13ecb90:
                    seenfn.add(t); fns.append(t)
            elif m.startswith('blx'):
                indirect.add((f, va))
            elif m.startswith('b') and o.startswith('#') and m not in ('bic', 'bics', 'bfi', 'bfc'):
                t = int(o[1:], 0)
                cond = m not in ('b',)
                if t in excl: pass
                else: work.append(t)
                if not cond: break
            if (m.startswith('pop') and 'pc' in o) or (m.startswith('ldm') and 'pc' in o) or (m == 'bx' and o == 'lr'):
                if m in ('pop', 'bx', 'ldm') or m.startswith('ldm') and len(m) <= 5: break
            if m.startswith('add') and o.startswith('pc,'):
                indirect.add((f, va)); break
            if m.startswith('ldr') and o.startswith('pc,'):
                indirect.add((f, va)); break
            va += 4
print('functions', len(fns), 'scanned', min(i, len(fns)))
for h in hits: print('fn %x  %x  %s %s' % h)
print('indirect sites', len(indirect))

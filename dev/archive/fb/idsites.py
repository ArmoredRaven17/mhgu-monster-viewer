# idsites.py lo hi off..: every load of e+off (the class's shell id fields) in [lo, hi), with the mode store (+8) that follows
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16); offs = [int(x, 16) for x in sys.argv[3:]]
S = armdis.sweep(lo, hi)
for i, (a, m, o) in enumerate(S):
    if m in ('movw', 'mov') and any(o.endswith('#0x%x' % x) for x in offs):
        win = S[max(0, i - 30): i + 40]
        regs = {}
        modes = []
        for (b, mm, oo) in win:
            if mm in ('mov', 'movw') and '#' in oo and oo.split(',')[0].strip().startswith('r'):
                try: regs[oo.split(',')[0].strip()] = int(oo.split('#')[1], 0)
                except ValueError: pass
            if mm == 'str' and oo.endswith('#8]'):
                r = oo.split(',')[0].strip(); modes.append('%x:%s=%s' % (b, r, regs.get(r)))
        print('%x %s %s | %s' % (a, m, o, ' '.join(modes)))

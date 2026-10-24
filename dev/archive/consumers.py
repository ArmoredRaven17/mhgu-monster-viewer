from scan import *
import armdis, re
def show_after(site, n=8):
    out = []
    for a, m, o in armdis.sweep(site + 4, site + 4 + n*4):
        out.append('%s %s' % (m, o))
    return ' | '.join(out)
print('== bl 0x49648 (G+0x48)')
for a, t, k in branches_to({0x49648}):
    print(hex(a), k, show_after(a, 6))
print('== vt+0x9c virtual calls followed by cmp/tst within 6')
def ldr_imm(imm):
    return [i*4 for i, w in enumerate(W) if (w & 0x0ff00000) == 0x05900000 and (w & 0xfff) == imm]
for a in ldr_imm(0x9c):
    ins = list(armdis.sweep(a, a + 0x30))
    bi = [i for i, (x, m, o) in enumerate(ins) if m == 'blx']
    if not bi: continue
    rest = ins[bi[0]+1: bi[0]+7]
    if any(m in ('cmp', 'tst', 'sub', 'uxtb') and o.startswith('r0') for _, m, o in rest):
        print(hex(a), ' | '.join('%s %s' % (m, o) for _, m, o in ins[:bi[0]+7]))

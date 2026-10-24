from scan import *
import armdis, json, re
d = json.load(open(r'C:\MHGU-Extract\efx\class-effects.json'))['classes']
bands = []
items = d.items() if isinstance(d, dict) else [(c.get('class') or c.get('name'), c) for c in d]
for name, c in items:
    lo = c.get('code_lo') or (c.get('code') or [None, None])[0]
    hi = c.get('code_hi') or (c.get('code') or [None, None])[1]
    if isinstance(lo, str): lo = int(lo, 16)
    if isinstance(hi, str): hi = int(hi, 16)
    if lo and hi: bands.append((lo, hi, name, c.get('ems') or c.get('em') or ''))
def owner(a):
    hits = [b for b in bands if b[0] <= a < b[1] and (b[1]-b[0]) < 0x100000]
    return ','.join('%s%s' % (b[2], b[3]) for b in hits) or '-'
def ldr_imm(imm):
    return [i*4 for i, w in enumerate(W) if (w & 0x0ff00000) == 0x05900000 and (w & 0xfff) == imm]
for a in ldr_imm(0x9c):
    ins = list(armdis.sweep(a, a + 0x40))
    bi = [i for i, (x, m, o) in enumerate(ins) if m == 'blx']
    if not bi or bi[0] > 3: continue
    rest = ins[bi[0]+1: bi[0]+9]
    cmps = [o for _, m, o in rest if m.startswith('cmp') and re.match(r'r0, #', o)]
    if cmps:
        print(hex(a), owner(a), cmps)

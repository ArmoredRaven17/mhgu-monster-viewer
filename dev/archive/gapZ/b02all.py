# b02all.py: every beam class (base02 family: vtable +0x158 = 0x3fd2d8 or +0x150 = 0x3fc610) in the shell class census:
# vt+0x140, vt+0x13c and whether that init reaches an aura copy (depth 6) or 0x3fb9bc (base02's init, the registration 0x3fbad0).
import json, struct
DA = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DA_VA = 0x1728000
rd = lambda va: struct.unpack_from('<I', DA, va - DA_VA)[0]
ac = {}; exec(compile(open('auraclass.py', encoding='utf8').read().split('# the reader under unicorn')[0], 'ac', 'exec'), ac)
C = json.load(open(r'C:\MHGU-Extract\efx\agents\shells-scratch\shellclasses.json'))
for name, v in sorted(C.items()):
    if not name.startswith('uShellEm') or not isinstance(v, dict) or 'vtable' not in v: continue
    vt = v['vtable']
    try:
        s158, s150 = rd(vt + 0x158), rd(vt + 0x150)
    except Exception: continue
    if s158 != 0x3fd2d8 and s150 != 0x3fc610: continue
    init = rd(vt + 0x13c)
    seen = set(); front = {init}; hit = set(); reg = False
    for d in range(6):
        nxt = set()
        for fn in front:
            if fn in seen: continue
            seen.add(fn)
            if fn in ac['COPY']: hit.add(ac['COPY'][fn][0])
            if fn == 0x3fb9bc: reg = True
            for t in ac['callees'](fn):
                if 0 <= t < len(ac['T']) - 4: nxt.add(t)
        front = nxt
    print('%-24s vt+0x140 %x init %x reaches 0x3fb9bc %s copies %s' % (name, rd(vt + 0x140), init, reg or init == 0x3fb9bc, sorted(hit)))

# uidscan.py (effects lane, 2026-10-25): every class-request call through vt+0x1d0 (u) / vt+0x1cc (c) -- an `ldr rN, [rM, #0x1d0]`
# then `blx rN` within 16 instructions -- and every direct `bl 0xa3ddc` (base u) / `bl 0xa3dc0` (base c), with the id r1 holds at the
# call when it was set by an immediate (mov / movw / mvn) in the 16 instructions before. Prints id, kind, site, the immediate's site.
# Positive controls: the shared rage puff 0xa425c..0xa42a0 (u id 0 / 1, rom-map 0xa41b8) and Nakarkos's c 1001 at 0x106f0dc.. must appear.
import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.detail = False
T = armdis.TEXT
lo, hi = 0x40000, 0x1130000
win = []
out = []
a = lo
while a < hi:
    n = 0
    for i in md.disasm(T[a:min(hi, a + 0x10000)], a):
        n = i.address + 4
        win.append(i); win = win[-17:]
        m, o = i.mnemonic, i.op_str
        kind = None
        if m == 'blx' and o.startswith('r'):
            reg = o
            for j in reversed(win[:-1]):
                if j.mnemonic == 'ldr' and j.op_str.startswith(reg + ',') and ('#0x1d0]' in j.op_str or '#0x1cc]' in j.op_str):
                    kind = 'u' if '#0x1d0]' in j.op_str else 'c'; break
                if j.op_str.startswith(reg + ',') : break
        elif m == 'bl' and o in ('#0xa3ddc', '#0xa3dc0'):
            kind = 'U' if o == '#0xa3ddc' else 'C'
        if kind:
            vals = []; src = None
            for j in reversed(win[:-1]):
                if j.op_str.startswith('r1,'):
                    mn = j.mnemonic; cond = mn[-2:] in ('eq','ne','hs','lo','mi','pl','vs','vc','hi','ls','ge','lt','gt','le') and mn not in ('movw',)
                    if mn.startswith(('mov', 'mvn')) and '#' in j.op_str and ',' in j.op_str and j.op_str.count(',') == 1:
                        v = int(j.op_str.split('#')[1], 0); vals.append((~v & 0xffffffff) if mn.startswith('mvn') else v); src = j.address
                        if not cond: break
                    else: break
            out.append((kind, i.address, '/'.join(map(str, vals)) if vals else None, src))
    a = max(n, a + 4) if n else a + 4
for k, s, v, src in out:
    print('%s %08x %s %s' % (k, s, v if v is not None else '-', ('%08x' % src) if src else '-'))

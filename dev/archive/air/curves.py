import sys, struct, capstone
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\held')
import d
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
def ins(va):
    r = list(md.disasm(d.TEXT[va:va+4], va)); return r[0] if r else None
def curve(a):
    pts = []
    while len(pts) < 40:
        f, v = d.f32(a), d.f32(a + 4)
        if f is None or f < 0: break
        pts.append((f, v)); a += 8
    return pts
def integ(pts):
    # discrete sum of v(f) for f = 1 .. last (the emulated order), linear interpolation
    if not pts: return 0
    last = int(pts[-1][0]); s = 0
    for f in range(1, last + 1):
        for (f0, v0), (f1, v1) in zip(pts, pts[1:]):
            if f0 <= f <= f1: s += v0 + (f - f0) / (f1 - f0) * (v1 - v0); break
    return s
for va in range(lo, hi, 4):
    i = ins(va)
    if not i or i.mnemonic != 'bl' or i.op_str != '#0xc1010': continue
    # find r1 = pc-relative curve before it
    cur = None; dst = None
    for k in range(1, 8):
        j = ins(va - 4 * k)
        if j and j.mnemonic == 'add' and j.op_str.endswith(', pc, r0'):
            p = ins(va - 4 * k - 4)
            if p and p.mnemonic == 'ldr' and '[pc, #' in p.op_str:
                lit = va - 4 * k - 4 + 8 + int(p.op_str.split('#')[1].rstrip(']'), 0)
                cur = j.address + 8 + d.u32(lit)
            break
    for k in range(1, 4):
        j = ins(va + 4 * k)
        if j and j.mnemonic.startswith('vstr') and '#0x' in j.op_str: dst = j.op_str; break
    pts = curve(cur) if cur else []
    print('%x curve %s -> %s  pts %s  sum %.1f' % (va, hex(cur) if cur else '?', dst, pts, integ(pts)))

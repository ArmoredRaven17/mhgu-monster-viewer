"""Fanged Beasts shells toolkit: a class band's disassembly (cached), a function's start / callers, a range shown with its
pc-literals, the create sites (0x48b884) with their function, the shell vtables' slots against the base's.
  python fbt.py sites <class>            every 0x48b884 call in the band, its function and the function's callers
  python fbt.py show <class> <lo> [hi]   a function or range
  python fbt.py vt <vtable> [base-vtable]  slots 0..0x17c (and the differing ones against the base)"""
import sys, os, re, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis as A, emclasses
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
HERE = os.path.dirname(os.path.abspath(__file__))
md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
CLS = emclasses.load()
def rd(va):
    for base, data in ((A.RO_VA, A.RODATA), (A.DA_VA, A.DATA)):
        if base <= va < base + len(data): return struct.unpack_from('<I', data, va - base)[0]
    return None
def band(cls, pad=0x400):
    c = CLS[cls]; lo, hi = c['lo'], c['hi'] + pad
    fn = os.path.join(HERE, 'band_%s.txt' % cls)
    if not os.path.exists(fn):
        with open(fn, 'w') as o:
            a = lo
            while a < hi:
                got = False
                for i in md.disasm(A.TEXT[a:hi], a):
                    o.write('%08x  %-9s %s\n' % (i.address, i.mnemonic, i.op_str)); a = i.address + 4; got = True
                if a < hi:
                    w = struct.unpack_from('<I', A.TEXT, a)[0]; o.write('%08x  .word     %#010x\n' % (a, w)); a += 4
    L = [l.rstrip('\n') for l in open(fn)]
    return L, {int(l[:8], 16): i for i, l in enumerate(L)}
def start(L, idx, a):
    i = idx[a]
    while i > 0 and not (re.search(r'\spush\s', L[i]) and 'lr' in L[i]): i -= 1
    return int(L[i][:8], 16)
def callers(L, t):
    return [l[:8] for l in L if re.search(r'\s(bl|b|beq|bne|blo|bhi|bls|bhs|bgt|blt|bge|ble)\s+#0x%x$' % t, l)]
def show(L, idx, lo, hi=None):
    i = idx[lo]; out = []
    while i < len(L):
        l = L[i]; a = int(l[:8], 16)
        if hi and a >= hi: break
        m = re.search(r'\[pc, #(0x[0-9a-f]+|\d+)\]', l)
        note = ''
        if m and ('vldr' in l or 'ldr ' in l):
            t = a + 8 + int(m.group(1), 0); w = A.u32(t); note = '   ; [%x]=%#x (%g)' % (t, w, struct.unpack('<f', struct.pack('<I', w))[0])
        out.append(l + note); i += 1
        if not hi and re.search(r'\spop\s.*pc|\sbx\s+lr', l) and i - idx[lo] > 3 and i < len(L) and re.search(r'\spush\s', L[i]): break
    return out
if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'sites':
        L, idx = band(sys.argv[2])
        for l in L:
            if l.endswith('#0x48b884'):
                a = int(l[:8], 16); s = start(L, idx, a)
                print(l[:8], 'fn', hex(s), 'callers', callers(L, s)[:8])
    elif cmd == 'show':
        L, idx = band(sys.argv[2]); lo = int(sys.argv[3], 16); hi = int(sys.argv[4], 16) if len(sys.argv) > 4 else None
        print('\n'.join(show(L, idx, lo, hi)))
    elif cmd == 'vt':
        vt = int(sys.argv[2], 0); bv = int(sys.argv[3], 0) if len(sys.argv) > 3 else None
        for o in range(0, 0x180, 4):
            v = rd(vt + o); b = rd(bv + o) if bv else None
            if bv is None or v != b: print('+%#05x %#x%s' % (o, v, '' if bv is None else '  (base %#x)' % b))

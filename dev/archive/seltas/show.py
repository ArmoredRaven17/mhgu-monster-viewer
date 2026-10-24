import sys, re, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis as A
import fn
def lit(a):
    w = A.u32(a); return w, struct.unpack('<f', struct.pack('<I', w))[0]
def show(lo, hi=None, band=None):
    L, idx = fn.B[band or fn.which(lo)]
    i = idx[lo]
    out = []
    while True:
        l = L[i]; a = int(l[:8], 16)
        if hi and a >= hi: break
        m = re.search(r'\[pc, #(0x[0-9a-f]+|\d+)\]', l)
        note = ''
        if m and ('vldr' in l or 'ldr ' in l):
            t = a + 8 + int(m.group(1), 0)
            w, fl = lit(t)
            note = '   ; [%x]=%#x (%g)' % (t, w, fl)
        out.append(l + note)
        i += 1
        if not hi and re.search(r'\spop\s.*pc|\sbx\s+lr', l) and i - idx[lo] > 3: 
            # stop at the second return after a literal pool start
            nxt = L[i] if i < len(L) else ''
            if re.search(r'\spush\s', nxt): break
    return out
if __name__ == '__main__':
    lo = int(sys.argv[1], 16); hi = int(sys.argv[2], 16) if len(sys.argv) > 2 else None
    print('\n'.join(show(lo, hi)))

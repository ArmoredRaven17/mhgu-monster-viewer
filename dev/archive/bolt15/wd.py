import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
def dis(lo, hi):
    a = lo; out = []
    while a < hi:
        # find decodable run
        b = a
        lines = armdis.run(a, hi)
        if not lines:
            out.append('%08x  .word 0x%08x' % (a, armdis.u32(a))); a += 4; continue
        out.extend(lines)
        last = int(lines[-1].split()[0], 16)
        a = last + 4
        if a < hi:
            out.append('%08x  .word 0x%08x' % (a, armdis.u32(a))); a += 4
    return out
if __name__ == '__main__':
    print('\n'.join(dis(int(sys.argv[1], 16), int(sys.argv[2], 16))))

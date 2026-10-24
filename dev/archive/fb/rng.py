import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as A
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
def dis(lo, hi):
    out = []; a = lo
    while a < hi:
        got = False
        for i in md.disasm(A.TEXT[a:hi], a):
            out.append((i.address, i.mnemonic, i.op_str)); a = i.address + 4; got = True
        if a < hi: out.append((a, '.word', hex(struct.unpack_from('<I', A.TEXT, a)[0]))); a += 4
    return out
if __name__ == '__main__':
    lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16); pat = sys.argv[3:]
    L = dis(lo, hi)
    for k, (a, m, o) in enumerate(L):
        if not pat or any(p in o or p == m for p in pat):
            if pat:
                for x in L[max(0, k-3):k+3]: print('%x  %-8s %s' % x)
                print('--')
            else: print('%x  %-8s %s' % (a, m, o))

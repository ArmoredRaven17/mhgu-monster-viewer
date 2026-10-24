# d.py -- disassembly helpers for the cloak verify (cv)
import sys, re, pickle, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def dis1(a):
    x = next(md.disasm(armdis.TEXT[a:a+4], a), None)
    return x
def lines(lo, hi):
    out = []
    for a in range(lo, hi, 4):
        x = dis1(a)
        out.append((a, (x.mnemonic + ' ' + x.op_str) if x else '.word %#x' % armdis.u32(a)))
    return out
_cache = {}
def band(lo=0xdfeec4, hi=0xe0ff10):
    k = (lo, hi)
    if k not in _cache:
        p = 'cache_%x_%x.pkl' % k
        if os.path.exists(p): _cache[k] = pickle.load(open(p, 'rb'))
        else:
            _cache[k] = lines(lo, hi); pickle.dump(_cache[k], open(p, 'wb'))
    return _cache[k]
def fstart(L, k):
    for j in range(k, -1, -1):
        s = L[j][1]
        if s.startswith('push') and 'lr' in s: return L[j][0]
    return None
if __name__ == '__main__':
    lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
    for a, s in lines(lo, hi): print('%#x  %s' % (a, s))

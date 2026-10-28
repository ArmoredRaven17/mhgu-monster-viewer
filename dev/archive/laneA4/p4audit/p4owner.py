# p4owner.py (effects lane A4): for each site, the function holding it (back to the nearest `push {..., lr}` -- a heuristic
# start, checked by the callers found), the bl / b callers of that start in the whole text, and the vtable slots of the class
# (emclasses.json vtable, 0x4a0 bytes) that hold it.  usage: p4owner.py <class> <addr> [...]
import sys, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
import numpy as np
T = armdis.TEXT
W = np.frombuffer(T[:len(T) & ~3], dtype='<u4')
CLS = json.load(open(r'C:\MHGU-Extract\efx\agents\notice-scratch\emclasses.json'))
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)

def start(a):
    for b in range(a, a - 0x4000, -4):
        i = next(md.disasm(T[b:b + 4], b), None)
        if i and i.mnemonic.startswith('push') and 'lr' in i.op_str:
            return b
    return None

def callers(t):
    idx = np.arange(len(W), dtype=np.int64)
    isb = (W & 0x0E000000) == 0x0A000000
    imm = (W & 0xFFFFFF).astype(np.int64)
    imm = np.where(imm & 0x800000, imm - 0x1000000, imm)
    tg = idx * 4 + 8 + imm * 4
    hit = np.nonzero(isb & (tg == t) & ((W >> 28) != 0xF))[0]
    return [int(h) * 4 for h in hit]

def vslots(cls, t):
    vt = CLS[cls]['vtable']
    out = []
    for o in range(0, 0x4a0, 4):
        if armdis.u32(vt + o) == t: out.append('vt+%#x' % o)
    return out

if __name__ == '__main__':
    cls = sys.argv[1]
    for x in sys.argv[2:]:
        a = int(x, 16)
        s = start(a)
        c = callers(s) if s else []
        print('%#x in fn %s  callers %s  vslots %s' % (a, hex(s) if s else '?', ' '.join(hex(y) for y in c[:12]) or '-',
                                                         ' '.join(vslots(cls, s)) or '-'))

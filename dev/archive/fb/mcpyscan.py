# mcpyscan.py: every call of memcpy / memmove-like targets whose window mentions the enemy's param block (e+0x1428) -- the struct copies
# a field scan of +0x380 cannot see. Prints the window for each hit.
import sys, struct
sys.path.insert(0, r'C:/MHGU-Extract/efx')
import armdis, capstone
T = armdis.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
targets = set(int(x, 16) for x in sys.argv[1].split(','))
n = len(T) // 4
W = struct.unpack('<%dI' % n, T[:4 * n])
hits = []
for i in range(n):
    w = W[i]
    if (w >> 28) == 0xf or (w & 0x0f000000) != 0x0b000000: continue
    off = w & 0xffffff
    if off & 0x800000: off -= 0x1000000
    t = (4 * i + 8 + off * 4) & 0xffffffff
    if t in targets: hits.append(4 * i)
print(len(hits), 'calls')
for a in hits:
    lo = max(0, a - 4 * 24)
    ins = list(md.disasm(T[lo:a + 4], lo))
    txt = ' | '.join('%x %s %s' % (x.address, x.mnemonic, x.op_str) for x in ins)
    if (sys.argv[2] if len(sys.argv) > 2 else '0x1428') in txt:
        print('==', hex(a))
        for x in ins[-14:]: print('   %08x  %-7s %s' % (x.address, x.mnemonic, x.op_str))

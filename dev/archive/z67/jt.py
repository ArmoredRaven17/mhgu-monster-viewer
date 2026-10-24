# decode the two motion jump tables in 0xf76088 and the float literals the windows use
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
def w(a): return struct.unpack_from('<I', T, a)[0]
def f(a): return struct.unpack_from('<f', T, a)[0]
for base, lo, n in ((0xf761a0, 0x20d, 11), (0xf7622c, 0x450, 0x15)):
    print('table %#x (motion %#x..)' % (base, lo))
    for i in range(n):
        tgt = (base + w(base + i * 4)) & 0xffffffff
        print('  motion %#05x L%d M%d -> %#x' % (lo + i, (lo + i) >> 8, (lo + i) & 0xff, tgt))
# literals referenced by vldr [pc,#x]: pc = insn + 8
for ins, off in ((0xf761cc, 0x39c), (0xf761d0, 0x388), (0xf76294, 0x2d8), (0xf76298, 0x2b4), (0xf762fc, 0x254), (0xf76300, 0x24c),
                 (0xf76340, 0x20c), (0xf76364, 0x20c), (0xf76368, 0x1e4), (0xf7638c, 0x1e0), (0xf763f4, 0x164), (0xf763f8, 0x164),
                 (0xf76430, 0x124), (0xf76438, 0x12c), (0xf76440, 0x120), (0xf76444, 0x108), (0xf764a0, 0xac), (0xf764b4, 0x94), (0xf764b8, 0x94)):
    a = ins + 8 + off
    print('%#x: [%#x] = %g' % (ins, a, f(a)))

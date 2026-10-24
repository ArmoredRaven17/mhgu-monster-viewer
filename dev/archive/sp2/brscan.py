# every b/bl (any cond) to TARGET in [lo,hi); prints the preceding N instructions
import sys, struct, fwread as f
TG = int(sys.argv[1], 16); lo = int(sys.argv[2], 16); hi = int(sys.argv[3], 16); N = int(sys.argv[4]) if len(sys.argv) > 4 else 0
T = f.T
for a in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 25) & 7 == 5 and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        if a + 8 + off * 4 == TG:
            print('--- %x %s' % (a, 'bl' if (w >> 24) & 1 else 'b'))
            if N:
                for i in f.md.disasm(T[a - 4 * N:a + 4], a - 4 * N):
                    print('   %x: %s %s' % (i.address, i.mnemonic, i.op_str))

import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\brachy-scratch'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.argv = ['x']
import actprobe as A
for st, nums in ((7, [0x08,0x09,0x14,0x15,0x98,0xa1,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,0xa8,0xa9,0xaa,0xae,0xaf,0xb0,0xb1,0xb2]),):
    for n in nums:
        for v in (0, 5):
            out = []
            for ph in range(0, 6):
                out.append('ph%d %s' % (ph, A.probe(st, n, 0, v, extra=[(A.P + 0x1a1, bytes([ph]))])))
            print('(%d, %#x) v%d: %s' % (st, n, v, ' | '.join(out)))

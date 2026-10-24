# shvt.py lo hi: shell vtables whose reader slot +0x14c lies in [lo, hi) -- slots +0x13c..+0x174 printed
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
D = armdis.DATA
for o in range(0, len(D) - 0x180, 4):
    w = struct.unpack_from('<I', D, o + 0x14c)[0]
    if lo <= w < hi:
        i13c = struct.unpack_from('<I', D, o + 0x13c)[0]
        if 0x3f0000 <= i13c < 0x420000 or lo <= i13c < hi:
            print(hex(armdis.DA_VA + o), ' '.join('%x:%x' % (k, struct.unpack_from('<I', D, o + k)[0]) for k in range(0x13c, 0x178, 4)))

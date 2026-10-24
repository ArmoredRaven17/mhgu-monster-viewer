# callers.py <hex>.. -- every bl / b / blx-imm to each target in the whole .text, and every 4-byte data word equal to it (.rodata / .data)
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
tg = [int(x, 16) for x in sys.argv[1:]]
import numpy as np
w = np.frombuffer(T[:len(T) // 4 * 4], dtype='<u4')
idx = np.arange(len(w), dtype=np.int64) * 4
cond = (w >> 28) != 0xf
isb = ((w >> 25) & 7) == 5
off = ((w & 0xffffff).astype(np.int64) ^ 0x800000) - 0x800000
dest = idx + 8 + off * 4
for t in tg:
    hits = idx[isb & cond & (dest == t)]
    print(hex(t), 'branches:', [(hex(int(a)), 'bl' if (w[a // 4] >> 24) & 1 else 'b') for a in hits])
    for nm, base, blob in (('ro', armdis.RO_VA, armdis.RODATA), ('data', armdis.DA_VA, armdis.DATA)):
        b = blob[:len(blob) // 4 * 4]; ww = np.frombuffer(b, dtype='<u4')
        print('   ', nm, 'words:', [hex(base + int(i) * 4) for i in np.nonzero(ww == t)[0]][:20])

# dtbsurvey.py: every scratch-em monster's dtbase +0x6c (the word 0x9cd50 copies into P+0x3a8), via the loader 0x53800
import sys, os, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\narga-scratch')
from tune_emu import Loader
R = r'C:\MHGU-Extract\scratch-em'
for v in sorted(os.listdir(R)):
    p = os.path.join(R, v, 'enemy', 'dt_base', v + '_dtbase.dtb')
    if not os.path.exists(p): continue
    try:
        L = Loader(p, 0x53800)
    except Exception as e:
        print(v, 'ERR', e); continue
    w = L.u32(L.obj + 0x6c)
    d = open(p, 'rb').read()
    fw = struct.unpack_from('<I', d, 0x1d)[0]
    print('%s %#010x b15=%d b16=%d file+0x1d=%#010x %s consumed %d/%d' % (v, w, w >> 15 & 1, w >> 16 & 1, fw, 'OK' if fw == w else 'DIFF', L.pos, len(d)))

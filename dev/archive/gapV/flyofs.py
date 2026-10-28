# flyofs.py <mon...>: FlyOfs = [[e+0x75e8] + 0x98] (dev/air-height.md 1.4: 0xbf4d4 -> 0x712a0) -- the dtbase object +0x98 after the
# loader 0x53800 (tune_emu, emulated). Controls: Seregios / Rathian / Astalos 500, Malfestio 300 (air-height.md 1.3's table).
import sys, os, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\narga-scratch')
from tune_emu import Loader
R = r'C:\MHGU-Extract\scratch-em'
for v in sys.argv[1:]:
    p = os.path.join(R, v, 'enemy', 'dt_base', v + '_dtbase.dtb')
    L = Loader(p, 0x53800)
    raw = L.u32(L.obj + 0x98)
    print(v, 'FlyOfs', struct.unpack('<f', struct.pack('<I', raw))[0], 'TenjoOfs? +0x9c', struct.unpack('<f', struct.pack('<I', L.u32(L.obj + 0x9c)))[0])

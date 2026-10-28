import sys
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
e = emu.Emu()
for i, f in enumerate(emu.init_array()):
    e.call(f, tag='ia%d' % i)
for va in (0x19176b0, 0x19176f0, 0x1917700): print(hex(va), [round(e.f32(va + 4 * k), 4) for k in range(4)])

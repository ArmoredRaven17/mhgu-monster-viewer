import sys
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
e = emu.Emu()
faults = 0
for i, f in enumerate(emu.init_array()):
    e.call(f, tag='ia%d' % i)
    if e.fault: faults += 1
print('init_array faults', faults)
base = 0x2125018
for va in (0x19176b0, 0x19176c0, 0x19176d0, 0x19176e0, 0x19176f0, 0x1917700): print(hex(va), [round(e.f32(va + 4 * k), 3) for k in range(4)])
for i in range(34, 40):
    print(i, [round(e.f32(base + 12 * i + 4 * k), 3) for k in range(3)])
print('writers', [(hex(p), t) for p, t in e.writers(base, 16)][:4])

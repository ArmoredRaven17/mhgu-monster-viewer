import sys
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
e = emu.Emu()
faults = 0
for i, f in enumerate(emu.init_array()):
    e.call(f, tag='ia%d' % i)
    if e.fault: faults += 1
print('init_array faults', faults)
for va in (0x19176b0,):
    print(hex(va), [e.f32(va + 4 * k) for k in range(4)], [hex(e.u32(va + 4 * k)) for k in range(4)],
          'writers', [(hex(p), t) for p, t in e.writers(va, 16)])
# positive control: a known non-zero static vector somewhere? print any writes in the 0x40 window
for (a, n, v, pc, tag) in e.writes:
    if 0x19176a0 <= a < 0x19176d0:
        print('write', hex(a), n, v, hex(pc), tag)

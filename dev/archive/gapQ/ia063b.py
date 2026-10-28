import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import emu, armdis
e = emu.Emu()
for i, f in enumerate(emu.init_array()):
    e.call(f, tag='ia%d' % i)
for ldr, add, off in ((0xf3bde8, 0xf3bdec, 0x1c), (0xf3c334, 0xf3c338, 0x2c), (0xf3c610, 0xf3c614, 0x3c)):
    lit = armdis.u32(ldr + 8 + int(armdis.sweep(ldr, ldr + 4)[0][2].split('#')[-1].rstrip(']'), 16))
    base = (add + 8 + lit) & 0xffffffff
    m = e.u32(base + off) & 0xffff
    print(hex(ldr), 'table', hex(base), 'motion', hex(m), 'L%d M%d' % (m >> 8, m & 0xff), 'start/blend', e.f32(base + off + 4), e.f32(base + off + 8))

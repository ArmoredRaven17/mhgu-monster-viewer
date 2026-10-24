"""Run uEm088_Rubble's construction (0x10b30a4's steps) on the ROM and dump its uCoord fields.
Also the same for uEm087_Rubble and a positive control: a fresh uModel ctor 0x9366e0 alone."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
e = emu.Emu()
for i, f in enumerate(emu.init_array()):
    e.call(f, tag='ia%d' % i)

def fields(u, label):
    w = lambda o: e.u32(u + o)
    f = lambda o: e.f32(u + o)
    print(label, 'vt %x' % w(0), '+0xc %08x' % w(0xc), '+0x30 %x +0x34 %d' % (w(0x30), struct.unpack('<i', struct.pack('<I', w(0x34)))[0]),
          '+0x38 %08x (inherit mode %d, rot order %d)' % (w(0x38), w(0x38) >> 16, w(0x38) & 0xffff))
    print('   pos', [f(0x40 + 4 * k) for k in range(4)], 'quat', [f(0x50 + 4 * k) for k in range(4)],
          'scale', [f(0x60 + 4 * k) for k in range(4)])
    print('   fd0 %x fd4 %x fd8 %x' % (w(0xfd0), w(0xfd4), w(0xfd8)))

for ctor, name in ((0x10aeef8, 'RubbleBase ctor'), (0x9366e0, 'uModel ctor')):
    u = e.heap; e.heap += 0x1000
    e.uc.mem_write(u, b'\0' * 0x1000)
    e.call(ctor, (u,), tag=name)
    print(name, 'fault', e.fault)
    fields(u, name)
    print('   +0x38 writers', [(hex(p), t) for p, t in e.writers(u + 0x38, 4)] if hasattr(e, 'last') else '')

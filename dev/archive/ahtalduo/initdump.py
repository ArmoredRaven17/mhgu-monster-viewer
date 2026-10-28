"""Run every static initialiser (init_array) on the ROM (build/arm emu) and dump the node-rotation table it fills
(0x2132bf0, 6 x 16 bytes, read by (1, 0x14) 0x10b01a8 / (1, 0x15) 0x10b04b4 against the joint ids at 0x16a33e4)
and, as the CONTROL, G's spots 0x21328b0 (rom-map: (1800, -90, 1600), (-2100, -90, 1900), (3300, -90, 3800))."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
E = emu.Emu(); uc = E.uc
E.fault = None
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.fault = None
    E.call(fn, (), tag='init', budget=2_000_000)
E.fault = None
def vec(a, n=3): return struct.unpack('<%df' % n, bytes(uc.mem_read(a, 4 * n)))
print('control spots', [vec(0x21328b0 + 16 * k) for k in range(3)])
for i in range(6): print('node', i, 'rot deg (x, y, z, w)', vec(0x2132bf0 + 16 * i, 4))
# Ka's approach targets, Neset-local (yaw-turned): (2, 0x11) 0x10c04dc(e, 2) reads 0x2132dd0, (2, 0x12) 0x10c0848(e, 2) 0x21329d0
print('(2,0x11) turn-target local', vec(0x2132dd0), ' (2,0x12) walk-target local', vec(0x21329d0))
# the node's initial vector 0x10ad6e8: ldr r1, [pc, #0xf0] (literal 0x10ad7e0) ; ldr r1, [pc, r1] at 0x10ad6ec (pc + 8)
lit = struct.unpack('<I', bytes(uc.mem_read(0x10ad7e0, 4)))[0]
got = (0x10ad6ec + 8 + lit) & 0xffffffff
ptr = struct.unpack('<I', bytes(uc.mem_read(got, 4)))[0]
print('node init vector: GOT %#x -> %#x =' % (got, ptr), vec(ptr))

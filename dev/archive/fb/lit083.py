import sys, struct
sys.argv = ['x']
import emu_fb as E
for a in (0x1064850, 0x1064984, 0x1064988, 0x106498c, 0x1064994, 0x10649a0, 0x10649a4, 0x10649ac, 0x10649bc):
    w = E.r32(a); print(hex(a), hex(w), struct.unpack('<f', struct.pack('<I', w))[0])
for pcrel in (0x10649a8, 0x1064990, 0x10649b0, 0x10649b8):
    off = E.r32(pcrel); print('ptr', hex(pcrel), hex(off))

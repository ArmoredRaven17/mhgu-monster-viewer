import sys, json
sys.argv = ['x']
import emu_fb as E
ids = [int(x, 0) for x in sys.stdin.read().split()]
base = {}
for sid in ids:
    newf, _ = E.kind_of(sid)
    E.uc.mem_write(E.SHELL, b'\0' * 0x1800)
    E.E.call(newf, ())
    vt = E.r32(E.SHELL)
    slots = [E.r32(vt + o) for o in range(0, 0x180, 4)]
    print(hex(sid), E.ROWS[sid]['cls']['name'], 'vt', hex(vt))
    print('   ', ' '.join('+%x=%x' % (o * 4, v) for o, v in enumerate(slots) if o * 4 in (0x28, 0x24, 0x13c, 0x148, 0x14c, 0x150, 0x154, 0x158, 0x15c, 0x160, 0x164, 0x168, 0x16c, 0x170)))

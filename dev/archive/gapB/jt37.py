# jt37.py: the two jump tables of 0xe47b0c (PIC offsets from the table base) and the handler's GOT literals
import os, sys, struct
os.environ['FB_CLASS'] = 'uEm037_00'; os.environ['FB_MON'] = 'em037_00'
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fb'))
sys.argv = ['x']
import trgen as T
rd = lambda a: struct.unpack('<I', bytes(T.mu.mem_read(a, 4)))[0]
rf = lambda a: struct.unpack('<f', bytes(T.mu.mem_read(a, 4)))[0]
for base, n, first, name in ((0xe47b4c, 0x21, 2, 'list-0 (id 2..0x22)'), (0xe47c20, 0x15, 0x201, 'list-2 (0x201..0x215)')):
    arms = {}
    for i in range(n): arms.setdefault(base + rd(base + 4 * i), []).append(hex(first + i))
    print(name, {hex(k): v for k, v in arms.items()})
# GOT slots used by the create (pc-relative words in the pool) -> their targets
for slot in (0x1831ccc, 0x1835c6c, 0x18321b0, 0x1831a78):
    t = rd(slot); print('GOT %#x -> %#x' % (slot, t), [rd(t + 4 * k) for k in range(3)] if t else '')
print('floats 0xe47f70 %r 0xe48584 %r 0xe4857c %r' % (rf(0xe47f70), rf(0xe48584), rf(0xe4857c)))

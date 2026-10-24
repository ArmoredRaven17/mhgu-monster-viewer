# the setup 0x105fd94 hands 0x48b884: block point / words poked; slot 0 / 4 and a break level (0x9d36c answered 1) as controls
import sys, os, struct
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, FB); os.chdir(FB)
sys.argv = ['x']
import trgen as T
def go(slots, stub=None, n=5, F=230.0):
    poke = {T.E + 0xcb50: list(struct.pack('<6i', *slots)), T.E + 0xcae0: list(struct.pack('<3I', 0x161, 0x163, 0x164)),
            T.P + 0x40: list(struct.pack('<3f', 100.5, 200.25, -300.0)), T.P + 0x50: list(struct.pack('<3I', 0x1111, 0x2222, 0x3333))}
    for part in range(8): poke[T.P + 0x3c0 + 12 * part] = list(struct.pack('<h', 1))
    r = T.run(7, n, 1, 0, 0, poke=poke, only=F, stub=stub or {})
    nxt = struct.unpack('<6i', bytes(T.mu.mem_read(T.E + 0xcb68, 24))); base = struct.unpack('<6i', bytes(T.mu.mem_read(T.E + 0xcb38, 24)))
    return [(e[1], e[2], e[3], e[4]) for e in r.get('ev', []) if e[0] == 'create'], r.get('raw'), 'next', nxt, 'base', base
print('L2 at slot 2, f230:', go([2, 2, 2, 2, 0, 0]))
print('slot 2 at 0:', go([2, 2, 0, 2, 0, 0]))
print('slot 2 at 4:', go([2, 2, 4, 2, 0, 0]))
print('slot 2 at 3:', go([2, 2, 3, 2, 0, 0])[0])
print('slot 2 at 1:', go([2, 2, 1, 2, 0, 0])[0])
print('break level 1 (0x9d36c -> 1):', go([2, 2, 2, 2, 0, 0], stub={0x9d36c: 1}))

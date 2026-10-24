import sys, struct
sys.argv = ['x', '/dev/null', '/dev/null']
import importlib.util
spec = importlib.util.spec_from_file_location('emu_fb_mod', 'emu_fb.py')
# load without running main: emu_fb guards with __name__ == '__main__'
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
r = lambda a: struct.unpack('<4f', bytes(m.uc.mem_read(a, 16)))
for base, n in ((0x2128fb0, 14), (0x2129090, 14), (0x2129170, 6), (0x21291d0, 6), (0x2128f50, 6)):
    print(hex(base), [tuple(round(x, 1) for x in r(base + 16 * i)) for i in range(n)])

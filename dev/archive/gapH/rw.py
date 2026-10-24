import sys, os, struct
os.environ.setdefault('FB_CLASS', 'uEm084_00'); os.environ.setdefault('FB_MON', 'em084_00')
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'fb'))
a0 = int(sys.argv[1], 16); n = int(sys.argv[2]) if len(sys.argv) > 2 else 16
sys.argv = ['x']
import trgen as T
for i in range(n):
    w = struct.unpack('<I', bytes(T.mu.mem_read(a0 + 4*i, 4)))[0]
    print('%08x +%03x  %08x' % (a0+4*i, 4*i, w))

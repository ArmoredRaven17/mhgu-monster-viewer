# stdisp.py <band.txt> <table addr> <count>: each entry of a PIC jump table (offsets from the table) -> its first instructions
import sys, os, struct
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('FB_CLASS', 'uEm050_00'); os.environ.setdefault('FB_MON', 'em050_00')
argv = sys.argv[1:]; sys.argv = ['x']
import trgen as T
r = lambda a: struct.unpack('<I', bytes(T.mu.mem_read(a, 4)))[0]
L = open(argv[0]).read().splitlines()
D = {int(l[:8], 16): l[8:].strip() for l in L if len(l) > 8 and all(c in '0123456789abcdef' for c in l[:8])}
b = int(argv[1], 0)
for n in range(int(argv[2], 0)):
    t = (b + r(b + 4 * n)) & 0xffffffff
    seq = []; a = t
    for k in range(7):
        seq.append(D.get(a, '?')); a += 4
    print(hex(n), hex(t), ' | '.join(seq))

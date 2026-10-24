# every BL / B (any condition) in main.text whose target is one of the given addresses
import sys, struct
sys.path.insert(0, __file__.rsplit('\\', 1)[0])
from fdis_lib import TEXT
tg = {int(a, 0) for a in sys.argv[1:]}
n = len(TEXT) // 4
hits = {t: [] for t in tg}
for i in range(n):
    v = struct.unpack_from('<I', TEXT, 4 * i)[0]
    if (v >> 28) == 0xf: continue
    if (v & 0x0e000000) != 0x0a000000: continue
    off = v & 0xffffff
    if off & 0x800000: off -= 0x1000000
    t = 4 * i + 8 + off * 4
    if t in tg: hits[t].append((4 * i, 'bl' if v & 0x01000000 else 'b'))
for t in sorted(hits):
    print('%#x: %d sites' % (t, len(hits[t])))
    print('   ' + ' '.join('%x%s' % (a, '' if k == 'bl' else '(b)') for a, k in hits[t]))

# callers.py <target>...: every b / bl (any condition) in main.text to each target, and every literal word equal to it (a pointer)
import struct, sys
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
tg = [int(x, 16) for x in sys.argv[1:]]
hits = {t: [] for t in tg}; words = {t: [] for t in tg}
for a in range(0, len(T) - 3, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if w in hits: words[w].append(a)
    if (w >> 25) & 7 == 5 and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        d = a + 8 + off * 4
        if d in hits: hits[d].append((a, 'bl' if w & (1 << 24) else 'b'))
for t in tg:
    print('%#x: %d calls %s | %d literal words %s' % (t, len(hits[t]), ' '.join('%#x(%s)' % c for c in hits[t]), len(words[t]), ' '.join('%#x' % x for x in words[t][:10])))

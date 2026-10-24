import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
TAB, N = 0x1803de8, 0x240 // 8
def mot(m):
    return 'L%d M%d' % (m >> 8, m & 0xff) if m else '-'
for i in range(N):
    for side in (0, 1):
        p = armdis.u32(TAB + 8 * i + 4 * side)
        if not p: continue
        rows = []
        if armdis.rd(p, 12) is None or len(armdis.rd(p, 12)) < 12:
            print('idx %2d list %d @%#x: not in the file (bss: built at run time)' % (i, side, p)); continue
        while True:
            w = struct.unpack('<3I', armdis.rd(p, 12))
            if w[0] == 0: break
            fl = struct.unpack('<8f', armdis.rd(p + 12, 32))
            rows.append((p, w, fl))
            p += 0x2c
            if len(rows) > 200: break
        for (a, w, fl) in rows:
            print('idx %2d list %d @%#x type %2d motion %#x (%s) kind %2d  f %s' % (i, side, a, w[0], w[1], mot(w[1]), w[2], ' '.join('%g' % x for x in fl)))

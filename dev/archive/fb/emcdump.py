"""Dump an EMC file's streams as op lists (grammar: enemy-actions-emc.md 1, descriptor table 0x172bc8c).
python emcdump.py <file.emc> [grep-op-hex]"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
DESC = [armdis.DATA[0x172bc8c - armdis.DA_VA + i] for i in range(0xa7)]
def oplen(b, p):
    op = b[p]
    if op > 0xa6: return None
    d = DESC[op]
    if not d & 0x80: return d
    mode = b[p + 1]
    if mode == 0: return (d + 1) & 0xf
    if mode == 1: return {0x80: 2, 0x90: 3, 0xa0: 4, 0xb0: 5}[d & 0xf0]
    return 1
B = open(sys.argv[1], 'rb').read()
want = int(sys.argv[2], 16) if len(sys.argv) > 2 else None
for g in range(21):
    cnt, off = struct.unpack_from('<II', B, 0x10 + g * 16)
    for k in range(cnt):
        ln, so = struct.unpack_from('<II', B, off + k * 16)
        p, ops = so, []
        while p < so + ln and B[p] != 0xff:
            n = oplen(B, p)
            if n is None: ops.append('?%02x' % B[p]); break
            ops.append(' '.join('%02x' % x for x in B[p:p + 1 + n])); p += 1 + n
        s = ' | '.join(ops)
        if want is None or any(o.startswith('%02x ' % want) for o in ops): print('g%d s%d: %s' % (g, k, s))

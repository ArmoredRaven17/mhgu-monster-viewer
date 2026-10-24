"""Dump a status script (8-byte ops {op, arg} until op 0xff): ops 0 / 2 name a motion record (first word the motion id, +0x10
its flags), other ops their argument.   python scrdump.py <addr hex> [...]"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
D = armdis.DATA; DA = armdis.DA_VA
def dump(a):
    out = []
    for i in range(24):
        op, arg = struct.unpack_from('<II', D, a - DA + 8 * i)
        if op in (0xff, 0xfe): out.append('end' if op == 0xff else 'end(fe)'); break
        if op in (0, 2) and DA <= arg < DA + len(D):
            m, f = struct.unpack_from('<I', D, arg - DA)[0], struct.unpack_from('<I', D, arg - DA + 0x10)[0]
            out.append('op%d L%d M%d%s' % (op, (m >> 8) & 0xf, m & 0xff, (' f%#x' % f) if f != 1 else ''))
        else: out.append('op%#x(%d)' % (op, arg))
    return ' ; '.join(out)
for x in sys.argv[1:]: print(x, dump(int(x, 16)))

import sys, os, struct, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, 'C:/MHGU-Extract/efx/agents/rathian-shell-scratch')
import shellef, shlparse
SEP = chr(92)
ENTRY = re.compile(rb'\x05\x00......\x01\x00\x00\x00....\x01\x00\x00\x00\x02', re.S)

def parse_any(b):
    """the ShellInfoList without assuming entry 0's ShellScale is 1.0: the first entry header is
    u16 5 (class<<1|1), u16 id, u32 size, then ShellScale (u32 1, f32) and EffectParam (u32 1, byte 2 = a resource)"""
    i = b.index(b'ShellParam\0') + len('ShellParam\0')
    m = ENTRY.search(b, i)
    hdr = m.start()
    count = struct.unpack_from('<I', b, hdr - 4)[0]
    p = hdr; out = []
    for k in range(count):
        cls, idd, size = struct.unpack_from('<HHI', b, p); p += 8
        n = struct.unpack_from('<I', b, p)[0]; p += 4
        scale = struct.unpack_from('<%df' % n, b, p); p += 4 * n
        names = []
        for _ in range(4):
            nn = struct.unpack_from('<I', b, p)[0]; p += 4
            v = None
            for _ in range(nn):
                assert b[p] == 2, hex(p); p += 1
                z = b.index(b'\0', p); t = b[p:z].decode(); p = z + 1
                if t == 'null': p += 1
                else:
                    z = b.index(b'\0', p); v = b[p:z].decode().split(SEP)[-1]; p = z + 1
            names.append(v)
        out.append({'index': k, 'scale': scale, 'ef': names[0]})
    return count, out

if __name__ == '__main__':
    for mon in sys.argv[1:]:
        T = shellef.load_typed(r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy' + SEP + mon + '.arc')
        b = T.get(('shell' + SEP + 'em' + SEP + mon + '_shell02' + SEP + mon + '_02', '4aa69872'))
        if b is None: print(mon, 'no shell02 .shl'); continue
        count, rows = parse_any(b)
        try:
            c0, rows0, _ = shlparse.parse(b)
            same = [(r['index'], r['scale']) for r in rows0] == [(r['index'], r['scale']) for r in rows]
        except Exception as e:
            same = 'shlparse failed: ' + str(e)
        print(mon, 'count', count, 'shlparse agrees:', same)
        print('   non-1:', [(r['index'], round(r['scale'][0], 4), r['ef']) for r in rows if abs(r['scale'][0] - 1) > 1e-6] or 'none')

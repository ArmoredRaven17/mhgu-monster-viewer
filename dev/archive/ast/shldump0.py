import sys, json, re, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
SEP = chr(92)
arc = r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em081_00.arc'
T = shellef.load_typed(arc)
_ENTRY = re.compile(rb'\x05\x00......\x01\x00\x00\x00....\x01\x00\x00\x00\x02', re.S)

def entries(b):
    p = _ENTRY.search(b, b.index(b'ShellParam\0')).start()
    count = struct.unpack_from('<I', b, p - 4)[0]
    out = {}
    for k in range(count):
        p += 8
        n = struct.unpack_from('<I', b, p)[0]; p += 4
        sc = struct.unpack_from('<%df' % n, b, p)[0]; p += 4 * n
        names = []
        for _ in range(4):
            nn = struct.unpack_from('<I', b, p)[0]; p += 4
            for _ in range(nn):
                assert b[p] == 2, hex(p)
                z = b.index(b'\0', p + 1); t = b[p + 1:z]; p = z + 1
                if t == b'null':
                    p += 1; names.append(None)
                else:
                    z2 = b.index(b'\0', p); names.append(b[p:z2].decode().split(SEP)[-1]); p = z2 + 1
        out[k] = (sc, names)
    return count, out, p

def hds(raw):
    # HDS v0x20160209, records 0x38 from +0x10: s16 delay, s16 duration
    n = (len(raw) - 0x10) // 0x38
    return [struct.unpack_from('<hh', raw, 0x10 + 0x38 * i) for i in range(n)], raw[:4], hex(struct.unpack_from('<I', raw, 4)[0])

want = sys.argv[1:] or ['00', '01', '14', '15']
for nn in want:
    base = 'shell' + SEP + 'em' + SEP + 'em081_00_shell%s' % nn + SEP + 'em081_00_%s' % nn
    b = T[(base, '4aa69872')]
    runs = [m.group().decode() for m in re.finditer(rb'[ -~]{4,}', b)]
    print('=== shell%s' % nn, 'lists:', [s for s in runs if s.startswith('effect')])
    cm = T.get((base, '496f8f22'))
    print('  cmn', shellef.fup(cm) if cm else None)
    count, ents, p = entries(b)
    print('  entries', count)
    for m, (sc, names) in ents.items():
        efk = (base + '_ef%03d' % m, '1eb12c38')
        shk = (base + '_sh%03d' % m, '496f8f22')
        hk = (base + '_hit%03d' % m, '496f8f22')
        ef = None
        if efk in T:
            ef = [[pp[0], pp[1] if pp[1] < 0x80000000 else -1] for prm in shellef.parse_ef(T[efk])['params'] for pp in prm['arr']]
        sh = shellef.fup(T[shk]) if shk in T else None
        hit = shellef.fup(T[hk])['ints'] if hk in T else None
        if any(names) or sc != 1.0:
            print('  [%2d] scale %r ef %s sh %s hit %s names %s' % (m, sc, ef, json.dumps(sh), hit, names))
    hd = T.get((base + '_hitdata', '4eb68cee'))
    if hd: print('  hitdata', hds(hd))

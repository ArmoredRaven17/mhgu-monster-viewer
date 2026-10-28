"""classreq.py <uEmNNN_00> (effects lane A2, 2026-10-26): a class's vt+0x1d0 funnel, its id -> key table read only at the ids its own
request sites name (hyperid/uids.txt: every vt+0x1d0 / +0x1cc / 0xa3ddc / 0xa3dc0 call with an immediate r1, or '-' for a register id),
so the table is never read past its end; band = emclasses lo..hi. Control: Blangonga's 0xdda6f0 id 1001 -> u 60."""
import sys, struct, os
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
cls = sys.argv[1]
c = emclasses.load()[cls]; vt = c['vtable']
g = lambda o: struct.unpack_from('<I', armdis.DATA, vt - armdis.DA_VA + o)[0]
f = g(0x1d0)
tab = None
for l in armdis.run(f, f + 0x30):
    if 'literal' in l and tab is None:
        a = int(l.split()[0], 16); lit = int(l.split('literal ')[1], 16); got = (a + 8 + 4 + lit) & 0xffffffff  # ldr r2,[pc,#x]; ldr r2,[pc,r2] next
        tab = armdis.u32(got)
print('%s vt %#x band %#x..%#x vt+0x1d0 %#x table %s' % (cls, vt, c['lo'], c['hi'], f, hex(tab) if tab else None))
U = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'hyperid', 'uids.txt')
for l in open(U):
    p = l.split()
    if len(p) >= 3 and c['lo'] <= int(p[1], 16) < c['hi']:
        ids = p[2]
        keys = []
        for x in ids.split('/'):
            if x.lstrip('-').isdigit() and int(x) >= 1000 and tab and p[0] == 'u':
                keys.append('%s->u %d' % (x, struct.unpack('<i', armdis.rd(tab + 4 * (int(x) - 1000)))[0]))
            else: keys.append(x)
        print('  %s site %s ids %s  %s' % (p[0], p[1], ids, ' '.join(keys)))

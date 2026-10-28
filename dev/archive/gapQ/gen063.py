# gen063.py: the em063 SHELL_DATA mode / hitdata literals, generated from the arcs (gapQ, 2026-10-25) -> data063.js
import sys, os, struct, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import shldump
sys.path.insert(0, 'C:/MHGU-Extract/efx')
import shellef
BS = chr(92)

def num(x):
    if isinstance(x, int): return str(x)
    r = repr(float(x))
    return r[:-2] if r.endswith('.0') and False else r

def arr(a): return '[' + ', '.join(num(x) for x in a) + ']'

def hds(T, folder, n):
    b = T[(BS.join(['shell', 'em', folder, folder.replace('_shell', '_') + '_hitdata']), '4eb68cee')]
    assert b[:4] == b'HDS\0'
    cnt = struct.unpack_from('<I', b, 8)[0]
    assert len(b) == 0x10 + 0x38 * cnt
    return [list(struct.unpack_from('<hh', b, 0x10 + 0x38 * k)) for k in range(cnt)]

out = []
for mon in ('em063_00', 'em063_05'):
    T = shellef.load_typed(BS.join(['C:', 'MHGU-Extract', 'scratch-em', mon, mon + '.arc']))
    D = shldump.dump(mon)
    for sh in ('01', '11', '35'):
        nm = BS.join(['shell', 'em', '%s_shell%s' % (mon, sh), '%s_%s' % (mon, sh)])
        d = D[nm]
        lines = []
        for k, row in enumerate(d['modes']):
            if not row['sh'] and not row['ef']: continue
            ef = []
            for auto, pairs in row['ef'][1]:
                ef += [[a, b] for a, b in pairs]
            hit = row['hit'][1]['ints'] if row['hit'] else []
            s = row['sh'][1]
            lines.append('      %d: m057(%s, %s, %s, %s, %s, %s),' % (k, num(row['scale']), json.dumps(ef), json.dumps(hit), arr(s['ints']),
                                                                   arr(s['floats']), '[' + ', '.join(arr(v) for v in s['vecs']) + ']'))
        out.append('// %s shell%s (%s): %d modes in the ShellInfoList, %d with files' % (mon, sh, nm, len(d['modes']), len(lines)))
        out.append('const MODES063_%s_%s = {\n%s\n};' % (mon[-2:], sh, '\n'.join(lines)))
        if sh != '11':
            out.append('const HITDATA063_%s_%s = %s;' % (mon[-2:], sh, json.dumps(hds(T, '%s_shell%s' % (mon, sh), 0))))
open(os.path.join(HERE, 'data063.js'), 'w').write('\n'.join(out) + '\n')
print('\n'.join(out))

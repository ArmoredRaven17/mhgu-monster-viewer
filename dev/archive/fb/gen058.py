# gen027.py: Teostra's SHELL_DATA shells (modes from shl_em058_00.txt, hitdata from the arc) as JS text
import json, re, struct, sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
txt = open('shl_em058_00.txt', encoding='utf8').read().split('== ')[1:]
F = shellef.load_typed(r'C:\MHGU-Extract\scratch-em\em058_00\em058_00.arc')
HD = {}
for (n, t), b in F.items():
    if n.endswith('_hitdata'):
        cnt = (len(b) - 0x10) // 0x38
        HD[n.split(chr(92))[-1].split('_')[2]] = [list(struct.unpack_from('<hh', b, 0x10 + 0x38 * i)) for i in range(cnt)]
out = []
for blk in txt:
    lines = blk.strip().split('\n')
    nn = re.search(r'shell(\d\d)', lines[0]).group(1)
    modes = []
    for l in lines[2:]:
        m = re.match(r'\s*mode (\d+) (.*)$', l)
        if not m: continue
        d = json.loads(m.group(2))
        ef = [[a, (b if b < 0x80000000 else b - 0x100000000)] for a, b in d['ef'][0]['arr']]
        sh = d['sh']
        modes.append('      %s: m057(%r, %s, %s, %s, %s, %s),' % (m.group(1), d['scale'][0], json.dumps(ef), json.dumps(d['hit']['ints']),
                     json.dumps(sh['ints']), json.dumps(sh['floats']), json.dumps(sh['vecs'])))
    out.append((nn, modes, HD.get(nn)))
for nn, modes, hd in out:
    print('MODES', nn); print('\n'.join(modes)); print('      }, hitdata: %s },' % json.dumps(hd))

import sys, json
sys.argv = ['x']
import tr57 as T
acts = [0x00,0x01,0x20,0x21,0x22,0x3d,0x42,0x57,0x69,0x6a,0x6b,0x6c,0x71,0x76,0x77,0x78,0x79,0x7a,0xcf,0xd0,0xd3,0xd4,0xd5,0xdb,0xdd,0xde,0xdf,0xe0,0xe1,0xe2,0xe3,0xe5,0xf3,0xf4,0xf5]
for var in (0, 4):
    for n in acts:
        line = []
        for ph in range(6):
            for scn in ({}, {'ended': 1}, {'landed': 1}, {'timer': 1}):
                r = T.run(7, n, ph, var, 0, charged=1, **scn)
                m = [e[1] + (' s%g' % e[3] if e[3] else '') for e in r.get('ev', []) if e[0] == 'mot']
                if m: line.append('p%d%s:%s' % (ph, ''.join(k[0] for k in scn), ','.join(m)))
        print('%d (7,%#x)  %s' % (var, n, '  '.join(dict.fromkeys(line))))

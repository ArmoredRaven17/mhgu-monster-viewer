import sys
sys.argv=['x']
import trgen as T
for n in (0x10, 0x11, 0x35, 0x36, 0x42):
    for ph in range(3):
        for scn in ({}, {'ended': 1}):
            r = T.run(7, n, ph, 4, 0, stub={0x3a8430: 5}, **scn)
            print(hex(n), ph, scn, [e for e in r.get('ev', []) if e[0] == 'mot'])

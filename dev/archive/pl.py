import sys, os, struct
ROOT = r'C:\MHGU-Extract'
sys.path.insert(0, os.path.join(ROOT, 'build', 'arm')); sys.path.insert(0, ROOT); sys.path.insert(0, os.path.join(ROOT,'efx'))
import proof
for pel in sys.argv[1:]:
    f = os.path.join(ROOT, 'scratch-effects-em', 'effect', 'pel', 'em', pel + '.pel')
    if not os.path.exists(f): print('missing', pel); continue
    d = proof.parse(f)
    n52 = 0; nb = 0; tot = 0
    for a, rs in d.items():
        for r in rs:
            p = bytes(r['payload']); tot += 1
            ray = p[0x52] != 0 and (p[0x5c] & 0x10)
            if p[0x52]: n52 += 1
            if ray: nb += 1
            if ray or r['key'] in (100, 101, 604, 605, 606):
                print(pel, a, r['key'], r.get('path'), 'j', struct.unpack_from('<h', p, 0x32)[0], 'mode', p[0x36], 'space', p[0x38],
                      '+52', p[0x52], '+5c', hex(p[0x5c]), '+58', struct.unpack_from('<f', p, 0x58)[0], '+40', p[0x40:0x44].hex(), 'off', struct.unpack_from('<3f', p, 0))
    print(pel, 'records', tot, '+52 set', n52, 'ray', nb)

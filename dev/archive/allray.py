import sys, os, struct, glob, collections
ROOT = r'C:\MHGU-Extract'
sys.path.insert(0, os.path.join(ROOT, 'efx')); sys.path.insert(0, os.path.join(ROOT, 'build', 'arm')); sys.path.insert(0, ROOT)
import proof
tot = 0; ray = 0; per = collections.Counter(); bits = collections.Counter(); v5c = collections.Counter()
for f in sorted(glob.glob(os.path.join(ROOT, 'scratch-effects-em', 'effect', 'pel', 'em', '*.pel'))):
    try: d = proof.parse(f)
    except Exception as ex: continue
    for a, rs in d.items():
        for r in rs:
            p = bytes(r['payload']); tot += 1
            if p[0x52]:
                v5c[p[0x5c]] += 1
            if p[0x52] and (p[0x5c] & 0x10):
                ray += 1; per[os.path.basename(f)[:-4]] += 1
print('records', tot, 'ray', ray, 'pels', len(per))
print('+0x5c values among +0x52-set records', dict(v5c))
print(dict(per))

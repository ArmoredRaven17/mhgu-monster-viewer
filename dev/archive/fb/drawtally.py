# drawtally.py <glob>..: per recorded set, the calls of each generator-kind DRAW routine (not just the sGpuParticle draw the
# recorder's "GPU draws" counts): record A / E 0xb918c4 / 0xb978cc, genType-2 0xa996c8, the 0xa7b7a0 -> 0x8827e0 path, polylines
# 0xab5090 / 0xab4f64, prims 0xc8cdb0 / 0xbab558, and the other lifted-draw roots
import sys, json, glob, os
LEAF = {'gpuA': ['0xb918c4'], 'gpuE': ['0xb978cc'], 'gt2': ['0xa996c8'], 'a7b7a0': ['0xa7b7a0', '0x8827e0'], 'poly': ['0xab5090', '0xab4f64'],
        'prim': ['0xc8cdb0', '0xbab558'], 'other': ['0xa54e84', '0xcac004', '0xa6a3ec', '0xafa464', '0xab65a4', '0xa71bd4', '0xa785b8', '0xaec21c',
        '0xa71954', '0x889004', '0xaaec24', '0xab5d0c', '0xab5530', '0xa72004', '0xa92710', '0xa718b8', '0xa97f78']}
rows = []
for g in sys.argv[1:]:
    for p in sorted(glob.glob(os.path.join(r'C:\MHGU-Extract\efx\vectors', g, 'draw.json'))):
        fn = json.load(open(p))['functions']
        c = {k: sum(fn[a]['calls'] for a in v if a in fn) for k, v in LEAF.items()}
        rows.append((os.path.basename(os.path.dirname(p)), c))
for n, c in rows:
    print('%-44s %s %s' % (n, 'NONE ' if not any(c.values()) else '     ', ' '.join('%s %d' % (k, v) for k, v in c.items() if v)))
print(len(rows), 'sets,', sum(1 for _, c in rows if not any(c.values())), 'with no draw routine called')

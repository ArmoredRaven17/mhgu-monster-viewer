"""How BIG is the skin disagreement at a seam, and are we truncating influence sets?

A tiny disagreement (one 2/255 influence pointing at a different joint) opens a hairline.
A large one opens a real hole. Separating them says whether this is an export truncation or a
genuine binding error -- and whether the .mod itself already disagrees, which decides whether the
fix is ours at all.
"""
import json
import struct
import sys
import collections

CT = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}


def load(path):
    raw = open(path, 'rb').read()
    jlen = struct.unpack_from('<I', raw, 12)[0]
    js = json.loads(raw[20:20 + jlen].decode('utf-8'))
    return raw, js, 20 + jlen + 8


def read(raw, js, binoff, ai):
    a = js['accessors'][ai]
    n, ncomp = a['count'], NC[a['type']]
    fmt, sz = CT[a['componentType']]
    bv = js['bufferViews'][a['bufferView']]
    base = binoff + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or (sz * ncomp)
    return [struct.unpack_from('<' + fmt * ncomp, raw, base + k * stride) for k in range(n)]


def main(path):
    raw, js, binoff = load(path)
    print('=== %s' % path)

    sets = collections.Counter()
    for mesh in js.get('meshes', []):
        for pr in mesh.get('primitives', []):
            a = pr['attributes']
            sets[tuple(sorted(k for k in a if k.startswith('JOINTS') or k.startswith('WEIGHTS')))] += 1
    print('skin attribute sets present: %s' % dict(sets))

    data = []
    for mi, mesh in enumerate(js.get('meshes', [])):
        for pi, pr in enumerate(mesh.get('primitives', [])):
            a = pr['attributes']
            if 'POSITION' not in a or 'JOINTS_0' not in a:
                continue
            data.append(((mesh.get('name') or 'm%d' % mi) + '#' + str(pi),
                         read(raw, js, binoff, a['POSITION']),
                         read(raw, js, binoff, a['JOINTS_0']),
                         read(raw, js, binoff, a['WEIGHTS_0'])))

    QT = 10000.0
    idx = collections.defaultdict(list)
    for pi_, (nm, pos, jj, ww) in enumerate(data):
        for k, p in enumerate(pos):
            idx[(round(p[0] * QT), round(p[1] * QT), round(p[2] * QT))].append((pi_, k))

    def wmap(j, w):
        tot = float(sum(w)) or 1.0
        d = {}
        for i in range(len(j)):
            if w[i] > 0:
                d[j[i]] = d.get(j[i], 0.0) + w[i] / tot
        return d

    buckets = collections.Counter()
    worst = []
    n = 0
    for key, hits in idx.items():
        if len(set(h[0] for h in hits)) < 2:
            continue
        for i in range(len(hits)):
            for jx in range(i + 1, len(hits)):
                a_, ak = hits[i]
                b_, bk = hits[jx]
                if a_ == b_:
                    continue
                A = wmap(data[a_][2][ak], data[a_][3][ak])
                B = wmap(data[b_][2][bk], data[b_][3][bk])
                # total absolute weight that disagrees, 0..2 -> halve for 0..1
                keys = set(A) | set(B)
                d = sum(abs(A.get(k, 0.0) - B.get(k, 0.0)) for k in keys) / 2.0
                n += 1
                if d < 1e-6:
                    buckets['identical'] += 1
                elif d <= 0.01:
                    buckets['<=1% of the influence'] += 1
                elif d <= 0.05:
                    buckets['1-5%'] += 1
                elif d <= 0.25:
                    buckets['5-25%'] += 1
                else:
                    buckets['>25% -- a real binding difference'] += 1
                    if len(worst) < 5:
                        worst.append((data[a_][0], data[b_][0], round(d, 3), A, B))
    print('coincident pairs: %d' % n)
    for k in ['identical', '<=1% of the influence', '1-5%', '5-25%', '>25% -- a real binding difference']:
        if buckets[k]:
            print('   %-38s %6d  (%4.1f%%)' % (k, buckets[k], 100.0 * buckets[k] / max(1, n)))
    for w in worst:
        print('   worst e.g. %s vs %s  delta=%.3f' % (w[0], w[1], w[2]))
        print('        A %s' % w[3])
        print('        B %s' % w[4])


if __name__ == '__main__':
    for p in sys.argv[1:]:
        main(p)
        print()

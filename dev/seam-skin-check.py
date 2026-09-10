"""Do coincident boundary vertices across two meshes carry the SAME skin binding?

Raven, 2026-09-10: "the Bind Pose doesn't show the small gaps near break-able parts."
That rules the GEOMETRY in and the SKINNING out: at rest the two meshes' shared edge sits at one
place, so any gap that only opens once the skeleton moves is the two copies of that edge being
driven by different joints or different weights.

Test: find vertices at the same position (bind pose) in two different primitives, then compare
their JOINTS_0 / WEIGHTS_0. A pair that agrees can never separate. A pair that disagrees WILL.
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
    out = []
    for k in range(n):
        off = base + k * stride
        out.append(struct.unpack_from('<' + fmt * ncomp, raw, off))
    return out


def prims(js):
    for mi, mesh in enumerate(js.get('meshes', [])):
        for pi, pr in enumerate(mesh.get('primitives', [])):
            yield (mesh.get('name') or ('mesh%d' % mi)), pi, pr


def main(path):
    raw, js, binoff = load(path)
    print('%s' % path)
    data = []
    for name, pi, pr in prims(js):
        a = pr['attributes']
        if 'POSITION' not in a or 'JOINTS_0' not in a or 'WEIGHTS_0' not in a:
            data.append((name, pi, None, None, None))
            continue
        data.append((name, pi, read(raw, js, binoff, a['POSITION']),
                     read(raw, js, binoff, a['JOINTS_0']),
                     read(raw, js, binoff, a['WEIGHTS_0'])))

    skinned = [d for d in data if d[2] is not None]
    print('primitives: %d total, %d skinned' % (len(data), len(skinned)))

    # index bind-pose positions -> (prim, vertex)
    QT = 10000.0
    idx = collections.defaultdict(list)
    for pi_, (name, pi, pos, jj, ww) in enumerate(skinned):
        for k, p in enumerate(pos):
            idx[(round(p[0] * QT), round(p[1] * QT), round(p[2] * QT))].append((pi_, k))

    def norm(j, w):
        """the binding as a comparable set: joint -> weight, dropping zero-weight slots"""
        pairs = [(j[i], round(w[i], 4)) for i in range(len(j)) if w[i] > 1e-6]
        return tuple(sorted(pairs))

    shared = 0
    agree = 0
    disagree = collections.Counter()
    examples = []
    for key, hits in idx.items():
        pset = set(h[0] for h in hits)
        if len(pset) < 2:
            continue
        for i in range(len(hits)):
            for jx in range(i + 1, len(hits)):
                a_, ak = hits[i]
                b_, bk = hits[jx]
                if a_ == b_:
                    continue
                shared += 1
                na = norm(skinned[a_][3][ak], skinned[a_][4][ak])
                nb = norm(skinned[b_][3][bk], skinned[b_][4][bk])
                if na == nb:
                    agree += 1
                else:
                    pair = tuple(sorted((skinned[a_][0] + '#' + str(skinned[a_][1]),
                                         skinned[b_][0] + '#' + str(skinned[b_][1]))))
                    disagree[pair] += 1
                    if len(examples) < 6:
                        examples.append((pair, na, nb))
    print('coincident vertex pairs ACROSS primitives : %d' % shared)
    print('  identical skin binding                  : %d' % agree)
    print('  DIFFERENT skin binding                  : %d' % (shared - agree))
    if disagree:
        print()
        print('  by primitive pair (these seams will open when posed):')
        for pair, c in disagree.most_common(14):
            print('    %-46s %s  x%d' % (pair[0], pair[1], c))
        print()
        for pair, na, nb in examples[:4]:
            print('    e.g. %s' % (pair,))
            print('         A %s' % (na,))
            print('         B %s' % (nb,))


if __name__ == '__main__':
    for p in sys.argv[1:]:
        main(p)
        print()

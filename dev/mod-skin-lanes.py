"""Locate the joint and weight lanes inside a MOD vertex, per vertex format.

The mesh record is already decoded (48 bytes: count @+0x02, stride @+0x0a, format id @+0x14, and
sum(count*stride) == vertexBufferSize @+0x18 is a self-check that passes). What is NOT known is
where inside each vertex the skin binding lives, and that is the last thing needed to answer
whether the .mod already disagrees at a seam or whether our export introduces it.

The weight signature is unmistakable: N consecutive bytes that sum to 255 on essentially every
vertex. Joint indices sit beside them as small integers bounded by the model's bone count.
"""
import collections
import struct
import sys


def meshes(path):
    d = open(path, 'rb').read()
    assert d[:4] == b'MOD\0', 'not a MOD'
    n = struct.unpack_from('<H', d, 8)[0]
    mesh_off = struct.unpack_from('<I', d, 0x30)[0]
    vtx_off = struct.unpack_from('<I', d, 0x34)[0]
    vbuf = struct.unpack_from('<I', d, 0x18)[0]
    out, base = [], vtx_off
    for i in range(n):
        b = mesh_off + i * 48
        cnt = struct.unpack_from('<H', d, b + 2)[0]
        stride = d[b + 0x0A]
        fmt = struct.unpack_from('<I', d, b + 0x14)[0]
        out.append({'i': i, 'count': cnt, 'stride': stride, 'fmt': fmt, 'start': base,
                    'rec': b})
        base += cnt * stride
    assert base - vtx_off == vbuf, 'stride self-check failed'
    return d, out


def lanes(d, m, sample=400):
    """For each byte offset, what does that lane look like across the mesh's vertices?"""
    st, start, cnt = m['stride'], m['start'], min(m['count'], sample)
    cols = []
    for off in range(st):
        vals = [d[start + k * st + off] for k in range(cnt)]
        cols.append(vals)
    return cols


def weight_runs(cols, cnt, width):
    """Offsets where `width` consecutive byte lanes sum to 255 on (almost) every vertex."""
    hits = []
    for off in range(len(cols) - width + 1):
        ok = 0
        for k in range(cnt):
            s = sum(cols[off + w][k] for w in range(width))
            if s == 255:
                ok += 1
        if ok >= cnt * 0.95:
            hits.append((off, width, ok / float(cnt)))
    return hits


def main(path, bones=None):
    d, ms = meshes(path)
    byfmt = collections.defaultdict(list)
    for m in ms:
        byfmt[(m['fmt'], m['stride'])].append(m)
    print('%s' % path)
    print('%d meshes, %d vertex formats' % (len(ms), len(byfmt)))
    for (fmt, stride), group in sorted(byfmt.items(), key=lambda kv: -len(kv[1])):
        m = max(group, key=lambda x: x['count'])
        cnt = min(m['count'], 400)
        if cnt < 8:
            continue
        cols = lanes(d, m)
        print()
        print('fmt %08x  stride %2d  meshes %2d   probe mesh #%d, %d verts'
              % (fmt, stride, len(group), m['i'], m['count']))
        found = []
        for width in (4, 3, 2):
            for off, w, frac in weight_runs(cols, cnt, width):
                if any(off >= o and off + w <= o + ow for o, ow, _ in found):
                    continue
                found.append((off, w, frac))
                print('   WEIGHTS?  bytes %2d..%-2d sum to 255 on %.0f%% of vertices'
                      % (off, off + w - 1, 100 * frac))
        # candidate joint lanes: small ints, low distinct count, plausible as bone ids
        for off in range(stride):
            v = cols[off]
            mx, distinct = max(v), len(set(v))
            if bones and mx < bones and distinct > 1 and mx > 0:
                near = any(abs(off - (o + ow)) <= 4 or abs((off + 4) - o) <= 4
                           for o, ow, _ in found)
                if near:
                    print('   joints?   byte %2d  max %3d  distinct %3d  (bones=%d)'
                          % (off, mx, distinct, bones))
        # what the lanes look like overall, so an eye can catch anything the rules miss
        desc = []
        for off in range(stride):
            v = cols[off]
            desc.append('%02d:[%3d-%3d/%d]' % (off, min(v), max(v), len(set(v))))
        for i in range(0, len(desc), 8):
            print('      ' + ' '.join(desc[i:i + 8]))


if __name__ == '__main__':
    bones = int(sys.argv[2]) if len(sys.argv) > 2 else None
    main(sys.argv[1], bones)

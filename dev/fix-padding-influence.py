"""Zero the weight our conversion leaks into MT's PADDING joint slot, and renormalise.

Raven, 2026-09-12: "Repair the fatalis line."

WHAT THE ROM SAYS. MT pads a vertex's unused joint slots by repeating an index rather than
zeroing, and gives the padding NO weight. Read straight out of the .mod for em013, vertex format
14d40022, joint lanes at bytes 16..19 of each 28-byte vertex:

    crimson mesh #14   16: 22x14   17: 28x8, 22x5, 29x1   18: 22x12, 29x2   19: 0x14
    fatalis mesh #18   16: 11x14   17: 17x8, 11x5, 18x1   18: 11x12, 18x2   19: 0x14

Byte 16 is 22 on Crimson and 11 on Fatalis, which are exactly their local indices for global bone
3 -- so these lanes are LOCAL NODE INDICES, and byte 19 is index 0, the root, on both. That is the
padding. The three real influences are global bones 3, 240 and 241/242.

WHAT WE SHIP. The conversion gives that padding slot a real weight of 0.0078 .. 0.0118, on 18
vertices of Crimson, 18 of Fatalis and 16 of Old Fatalis -- every one of them in the snout pair
Group[1]#0 / Group[10]#0 and nowhere else in the model. The weld then MASKED it rather than fixing
it: it reassigned those vertices to whichever bone it welded them against, and picked a different
one per model -- Fatalis to gid 13, Crimson to gid 143. Both carry rotation tracks, and they are
not the same track, which is why Crimson's snout swings 2.4x further than Fatalis's:

    in the head bone's own frame, worst over all 129 clips
                                  Group[1]#0   Group[10]#0
      crimson  as shipped            0.405        0.409
      fatalis  as shipped            0.171        0.168
      BOTH, padding dropped          0.022        0.022     <- identical

THE RULE HERE is taken from the .mod, not from the symptom: on these two primitives the only
legitimate influences are global bones 3, 240, 241 and 242. Anything else is the leaked padding,
whatever bone the weld happened to move it to, so this repairs the pre-weld root binding and the
post-weld 13/143 binding alike. Weights are renormalised afterwards.

This is a targeted repair of three shipped models. The defect is the CONVERTER's and it is
library-wide; the real fix belongs in fix-skin-influences.py, and this exists so the Fatalis line
can be judged before 186 models move.

    python dev/fix-padding-influence.py            # report only
    python dev/fix-padding-influence.py --write
"""
import argparse
import json
import os
import struct

import numpy as np

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'docs')
MODELS = ['em013_00', 'em013_01', 'em013_02']
PRIMS = {'Group[1]#0', 'Group[10]#0'}
# the bones the .mod actually binds on those two primitives, by GLOBAL id
KEEP = {'3', '240', '241', '242'}

CT = {5121: (np.uint8, 1, 255.0), 5123: (np.uint16, 2, 65535.0), 5126: (np.float32, 4, None)}


def load(path):
    b = bytearray(open(path, 'rb').read())
    off = 12
    js = js_off = js_len = None
    bin_off = bin_len = None
    while off < len(b):
        ln, ty = struct.unpack_from('<II', b, off)
        if ty == 0x4E4F534A:
            js = json.loads(bytes(b[off + 8:off + 8 + ln]).decode('utf-8')); js_off, js_len = off + 8, ln
        elif ty == 0x004E4942:
            bin_off, bin_len = off + 8, ln
        off += 8 + ln
    return b, js, bin_off


def acc_view(js, b, bin_off, i):
    """Return (array, writeback) for an accessor, handling interleaved bufferViews."""
    a = js['accessors'][i]
    dt, sz, norm = CT[a['componentType']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    bv = js['bufferViews'][a['bufferView']]
    base = bin_off + bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or sz * n
    cnt = a['count']
    vals = np.zeros((cnt, n), dtype=np.float64)
    for r in range(cnt):
        raw = np.frombuffer(bytes(b[base + r * stride: base + r * stride + sz * n]), dtype=dt)
        vals[r] = raw
    if norm and a.get('normalized'):
        vals = vals / norm

    def write(newvals):
        for r in range(cnt):
            v = newvals[r]
            if norm and a.get('normalized'):
                v = np.clip(np.round(v * norm), 0, norm)
            arr = np.asarray(v, dtype=dt)
            b[base + r * stride: base + r * stride + sz * n] = arr.tobytes()

    return vals, write


def prims_of(js):
    out = []
    for nd in js['nodes']:
        if 'mesh' not in nd:
            continue
        for pi, pr in enumerate(js['meshes'][nd['mesh']]['primitives']):
            out.append(('%s#%d' % (nd.get('name', '?'), pi), pr))
    return out


def gid(name):
    return name.split(':', 1)[1].rstrip('_s') if ':' in name else name


def fix(mon, write):
    path = os.path.join(DOCS, 'models', 'monsters', mon + '.glb')
    b, js, bin_off = load(path)
    jn = [js['nodes'][i].get('name', '') for i in js['skins'][0]['joints']]
    touched = 0
    for tag, pr in prims_of(js):
        if tag not in PRIMS or 'JOINTS_0' not in pr['attributes']:
            continue
        J, _ = acc_view(js, b, bin_off, pr['attributes']['JOINTS_0'])
        W, wwrite = acc_view(js, b, bin_off, pr['attributes']['WEIGHTS_0'])
        J = J.astype(int)
        changed = False
        for r in range(len(W)):
            for c in range(W.shape[1]):
                if W[r, c] > 0 and gid(jn[J[r, c]]) not in KEEP:
                    W[r, c] = 0.0
                    touched += 1
                    changed = True
            s = W[r].sum()
            if s > 0:
                W[r] = W[r] / s
        if changed and write:
            wwrite(W)
    if write and touched:
        open(path, 'wb').write(bytes(b))
    return touched


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true')
    args = ap.parse_args()
    for mon in MODELS:
        n = fix(mon, args.write)
        print('%-12s padding influences %s: %d' % (mon, 'REMOVED' if args.write else 'found', n))
    if not args.write:
        print('\n(report only -- pass --write to apply)')


if __name__ == '__main__':
    main()

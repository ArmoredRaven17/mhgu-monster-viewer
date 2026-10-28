# laneB2/puffpick.py <mon> <joint gid> [rath|fatalis] (lane B2, 2026-10-25): the shared rage puff's pick (vt+0x2a4) over EVERY rotation key of
# the joint in every motion of every pose list the viewer ships (docs/poses/monsters/<mon>_<list>.glb), plus the model's rest pose for a
# motion with no channel on it. rath = rathianPuffPick (0xd08afc / Gore's 0xfbec80: 1 -> u 1120 unless the u16 angle is in [0x8000, 0xee38]);
# fatalis = fatalisPuffPick (0xd7e800). Prints per list the keys that pick u 1121 (pick 0) and the extreme angles.
# The quaternion is the joint's LOCAL rotation (relative to its parent), the joint record's +0x60 the ROM reads (motion-states.js).
import json, struct, sys, glob, os, math
import numpy as np, warnings; warnings.filterwarnings("ignore")
f32 = np.float32
D = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
def glb(path):
    b = open(path, 'rb').read()
    n = struct.unpack_from('<I', b, 12)[0]
    j = json.loads(b[20:20 + n])
    off = 20 + n
    ln = struct.unpack_from('<I', b, off)[0]
    return j, b[off + 8:off + 8 + ln]
def acc(j, bin_, i):
    a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
    k = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
    o = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    if a['componentType'] == 5122:   # normalized int16 (the rotation keys): three.js's dequantize, max(c / 32767, -1)
        r = np.frombuffer(bin_, dtype='<i2', count=a['count'] * k, offset=o).astype(np.float32) / f32(32767)
        return np.maximum(r, f32(-1)).reshape(a['count'], k)
    return np.frombuffer(bin_, dtype='<f4', count=a['count'] * k, offset=o).reshape(a['count'], k)
def angle_u(q):
    x, y, z, w = (f32(c) for c in q)
    z2, y2, x2 = f32(z + z), f32(y + y), f32(x + x)
    vx = f32(f32(x * z2) + f32(y2 * w)); vy = f32(f32(y * z2) - f32(x2 * w))
    vz = f32(f32(1) - f32(f32(x * x2) + f32(y * y2)))
    h = f32(math.sqrt(f32(f32(vz * vz) + f32(vx * vx))))
    a = f32(math.atan2(f32(-vy), h))
    return int(math.trunc(float(f32(f32(0.5) + f32(a * f32(10430.378))))))
def pick(u, kind):
    if kind == 'fatalis': return 1 if ((0xfffff1c7 + (u & 0xffff)) & 0xffffffff) < 0x71c7 else 0
    return 1 if ((0xffff8000 + (u & 0xffff)) & 0xffffffff) > 0x6e38 else 0
mon, gid = sys.argv[1], int(sys.argv[2]); kind = sys.argv[3] if len(sys.argv) > 3 else 'rath'
mj, _ = glb(os.path.join(D, 'models', 'monsters', mon + '.glb'))
rest = next((n.get('rotation') for n in mj['nodes'] if (n.get('name') or '').split(':')[-1] == str(gid)), None)
tot0 = tot = 0
for p in sorted(glob.glob(os.path.join(D, 'poses', 'monsters', mon + '_*.glb'))):
    j, b = glb(p)
    node = next((i for i, n in enumerate(j['nodes']) if (n.get('name') or '').split(':')[-1] == str(gid)), None)
    rows = []; zero = []; us = []
    for a in j.get('animations', []):
        ch = [c for c in a['channels'] if c['target'].get('node') == node and c['target']['path'] == 'rotation']
        qs = acc(j, b, a['samplers'][ch[0]['sampler']]['output']) if ch else ([rest] if rest else [])
        ts = acc(j, b, a['samplers'][ch[0]['sampler']]['input'])[:, 0] if ch else [0.0]
        for t, q in zip(ts, qs):
            u = angle_u(q); us.append(u); tot += 1
            if pick(u, kind) == 0: tot0 += 1; zero.append('%s f%d' % (a['name'], round(float(t) * 60)))
    if us:
        print(os.path.basename(p), 'keys', len(us), 'angle u16 min %d max %d (deg %.1f .. %.1f)' % (min(us), max(us), min(us) / 10430.378 * 180 / math.pi, max(us) / 10430.378 * 180 / math.pi),
              'pick 0 (u 1121):', len(zero), zero[:6])
print('TOTAL keys', tot, 'pick 0', tot0, '(joint node %s, rest %s)' % (gid, rest))

# every em025_00 clip: the viewer's lowest-reach floor (24 steps, every proxy bone, -12 pad) at size 1, vs the clip origin
import subprocess, json, struct, sys
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\poses\monsters'
for L in range(5):
    fn = ROOT + r'\em025_00_%d.glb' % L
    b = open(fn, 'rb').read(); l = struct.unpack_from('<I', b, 12)[0]; j = json.loads(b[20:20 + l])
    for a in j['animations']:
        sys.argv = ['x', 'em025_00', str(L), a['name']]
        g = {}
        exec(open(__file__.replace('allmin.py', 'jpos.py')).read().split('if __name__')[0], g)
        mn = min(min(v[1] for v in g['pose'](i / 24 * g['dur'])[0].values()) for i in range(24 if g['dur'] > 0.001 else 1))
        if mn - 12 < 0: print('L%d %s lowest %.1f -> floor %.1f' % (L, a['name'], mn, mn - 12))

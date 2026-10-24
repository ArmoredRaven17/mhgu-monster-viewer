# try012.py: Lao-Shan Lung's vt+0x2a8 0xd759f4 on one event entry under emu_fb.py -- the creates and their flights, printed short
import sys, os, json, struct
os.environ.setdefault('FB_CLASS', 'uEm012_00'); os.environ.setdefault('FB_MON', 'em012_00')
sys.argv = ['x']
import emu_fb as H
def case(entry, motion, frame, **x):
    p = 0x17a50f4 + 8 * entry
    I = lambda m: [0.0 if i % 5 else 1.0 for i in range(15)] + [1.0]
    c = {'name': 'e%d' % entry, 'mon': 'em012_00', 'variant': 0, 'owner': [0, 0x1234, 0], 'target': [900.0, 40.0, 2400.0],
         'ownerPos': [120.5, 15.25, -80.75], 'joints': {'0': I(0)}, 'folders': {str(0x80): ['em012_00', '01'], str(0x81): ['em012_00', '13']},
         'owner_bytes': {'0x73e0': [7, 0], '0xcae0': list(struct.pack('<I', p)), '0x4b4': list(struct.pack('<H', motion))},
         'steps': [{'fn': 'd759f4', 'win': 1, 'frame': frame}], 'stubs': ['0xc44c70', '0x3ae2c8'], 'setupLen': 0x70, 'frames': 400}
    c.update(x)
    return c
if __name__ == '__main__':
    e = int(sys.argv[1]) if len(sys.argv) > 1 else 25
    r = H.run(case(e, 0x201, 720.0))
    for sh in r['shells']:
        run = sh['run']
        fr = run['frames'] if run else []
        print(hex(sh['id']), sh['mode'], sh['raw'][32:64], 'init', run and run['init'], 'spawn', run and run['spawn'],
              'n', len(fr), 'last', fr and {k: fr[-1][k] for k in ('k', 'state', 'pos')}, [l for f in fr for l in f['log']][:4])

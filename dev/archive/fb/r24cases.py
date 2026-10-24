# Rustrum's (em061_04) sp_24 / its conversions on the harness: what the ROM does, before any transcription
import json, sys
J = lambda x, y, z: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
IDS = {'0xcac8': [8, 1, 0, 0], '0xcacc': [9, 1, 0, 0], '0xcad0': [10, 1, 0, 0], '0xcad4': [11, 1, 0, 0], '0xcad8': [12, 1, 0, 0]}
F = {0x108: ['em061_04', '00'], 0x109: ['em061_04', '01'], 0x10a: ['em061_04', '13'], 0x10b: ['em061_04', '19'], 0x10c: ['em061_04', '24']}
def C(name, n, phase, frame=None, win=0, **x):
    ob = dict(IDS); ob['0x73e0'] = [7, n]
    c = dict(name=name, mon='em061_04', folders={str(k): v for k, v in F.items()}, variant=4, owner=[0, 0x3000, 0],
             ownerPos=[120.5, 15.25, -80.75], target=[900.0, 40.0, 2400.0], floorY=0.0, ground=0.0, size=[1.0, 1.0], base=1.0,
             rank=5, quest=10, owner_bytes=ob, joints={'0': J(120.5, 200.0, -80.75), '9': J(100.0, 220.0, -60.0), '14': J(140.0, 180.0, -90.0),
             '15': J(130.0, 240.0, -70.0)}, steps=[{'fn': 'f32798', 'phase': phase, 'win': win, 'frame': frame}], frames=300)
    c.update(x); return c
cases = [
    C('ed_p0', 0xed, 0, convert={'id': '0x10c', 'fn': 'f34a20', 'args': [8], 'after': 20}),
    C('ee_p0', 0xee, 0, convert={'id': '0x10c', 'fn': 'f34a20', 'args': [7], 'after': 20}),
    C('f5_p0', 0xf5, 0, convert={'id': '0x10c', 'fn': 'f34a20', 'args': [2], 'after': 20}),
    C('f1_p1', 0xf1, 1, 85.0, 1),
    C('e5_p0', 0xe5, 0, convert={'id': '0x10c', 'fn': 'f34b4c', 'args': [], 'after': 20}),
    C('fa_p1', 0xfa, 1, 104.0, 1),
    C('fb_p0', 0xfb, 0), C('fb_p1', 0xfb, 1, 50.0, 1),
]
json.dump(cases, open(sys.argv[1], 'w'))
cases2 = [
    C('e5_hold_throw', 0xe5, 0, convert={'id': '0x10c', 'fn': 'f34b4c', 'args': [], 'after': 20}, track={'1': [0x90a, 0]},
      pokes={'30': {'0xcae0': [2, 0, 0, 0]}}, pokeDepth=1, ownvt54=1),
]
if len(sys.argv) > 2: json.dump(cases2, open(sys.argv[2], 'w'))

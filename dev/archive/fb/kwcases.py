# Kecha Wacha's (em065_00) shells on the harness: what the ROM does, before any transcription
import json, sys
J = lambda x, y, z: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
F = {0x116: ['em065_00', '00'], 0x117: ['em065_00', '01'], 0x118: ['em065_00', '13'], 0x119: ['em065_00', '23']}
def C(name, st, n, phase, frame=None, win=0, **x):
    c = dict(name=name, mon='em065_00', folders={str(k): v for k, v in F.items()}, variant=0, owner=[0, 0x3000, 0],
             ownerPos=[120.5, 15.25, -80.75], target=[900.0, 40.0, 2400.0], floorY=0.0, ground=0.0, size=[1.0, 1.0], base=1.0,
             rank=5, quest=10, owner_bytes={'0x73e0': [st, n]},
             joints={'0': J(120.5, 200.0, -80.75), '131': J(160.0, 260.0, -40.0)},
             steps=[{'fn': 'f55740', 'phase': phase, 'win': win, 'frame': frame}], frames=300)
    c.update(x); return c
cases = [
    C('k23_0', 7, 6, 1, 108.0), C('k23_1', 7, 6, 1, 130.0), C('k23_2', 7, 6, 1, 150.0),
    C('k13_0', 7, 7, 1, 108.0), C('k13_5', 7, 0x3b, 1, 156.0),
    C('k01_0', 3, 7, 1, 16.0),
    C('k00_0', 7, 0x15, 6, 33.0),
]
json.dump(cases, open(sys.argv[1], 'w'))

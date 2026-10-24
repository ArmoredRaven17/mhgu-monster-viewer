# Gammoth's (em083_00) shells on the harness: what the ROM does, before any transcription
import json, sys
J = lambda x, y, z: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
F0 = {0x161: ['em083_00', '00'], 0x162: ['em083_00', '00_02'], 0x163: ['em083_00', '01'], 0x164: ['em083_00', '13']}
def C(name, n, phase, frame, win=0, st=7, **x):
    c = dict(name=name, mon='em083_00', folders={str(k): v for k, v in F0.items()}, variant=0, owner=[0, 0x3000, 0],
             ownerPos=[120.5, 15.25, -80.75], target=[900.0, 40.0, 2400.0], floorY=0.0, ground=0.0, size=[1.0, 1.0], base=1.0,
             rank=5, quest=10, owner_bytes={'0x73e0': [st, n], '0xcae0': [0x61, 1, 0, 0], '0xcae4': [0x63, 1, 0, 0], '0xcae8': [0x64, 1, 0, 0]},
             joints={'0': J(120.5, 200.0, -80.75), '157': J(160.0, 260.0, -40.0), '7': J(100.0, 120.0, 0.0), '11': J(140.0, 120.0, 0.0),
                     '14': J(110.0, 60.0, -120.0), '17': J(150.0, 60.0, -120.0), '140': J(130.0, 300.0, -10.0)},
             steps=[{'fn': '1050a1c', 'phase': phase, 'win': win, 'frame': frame}], frames=300)
    c.update(x); return c
cases = [
    C('g00_c9', 0xc9, 1, 26.0, 1), C('g00_d3', 0xd3, 1, 18.0, 1), C('g00_d4', 0xd4, 1, 18.0, 1),
    C('g13_1d', 0x1d, 1, 220.0, 1), C('g13_1c', 0x1c, 1, 220.0, 1), C('g13_1b', 0x1b, 1, 220.0, 1),
    C('g01_04', 0x04, 1, 245.0, 1), C('g01_0a', 0x0a, 1, 80.0, 1), C('g01_0e', 0x0e, 1, 190.0, 1), C('g01_0f', 0x0f, 1, 76.0, 1),
    C('g01_12a', 0x12, 1, 90.0, 1), C('g01_12b', 0x12, 2, 100.0, 1), C('g01_12c', 0x12, 2, 44.0, 1),
    C('g01_5a', 0x5a, 1, 172.0, 0), C('g01_5c', 0x5c, 2, 172.0, 0),
]
json.dump(cases, open(sys.argv[1], 'w'))

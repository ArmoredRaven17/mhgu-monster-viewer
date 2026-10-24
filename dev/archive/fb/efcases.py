# Elderfrost's (em083_04) shells on the harness: what the ROM does, before any transcription
import json, sys
J = lambda x, y, z: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
F4 = {0x165: ['em083_04', '00'], 0x166: ['em083_04', '00_02'], 0x167: ['em083_04', '00_03'], 0x168: ['em083_04', '01'],
      0x169: ['em083_04', '02'], 0x16a: ['em083_04', '13'], 0x16b: ['em083_04', '13_02']}
def C(name, n, steps, **x):
    c = dict(name=name, mon='em083_04', folders={str(k): v for k, v in F4.items()}, variant=4, owner=[0, 0x3000, 0],
             ownerPos=[120.5, 15.25, -80.75], target=[900.0, 40.0, 2400.0], floorY=0.0, ground=0.0, size=[1.0, 1.0], base=1.0,
             rank=5, quest=10, owner_bytes={'0x73e0': [7, n], '0xcae0': [0x65, 1, 0, 0], '0xcae4': [0x68, 1, 0, 0], '0xcae8': [0x6a, 1, 0, 0]},
             joints={'0': J(120.5, 200.0, -80.75), '157': J(160.0, 260.0, -40.0), '7': J(100.0, 120.0, 0.0), '11': J(140.0, 120.0, 0.0),
                     '14': J(110.0, 60.0, -120.0), '17': J(150.0, 60.0, -120.0), '140': J(130.0, 300.0, -10.0), '2': J(125.0, 210.0, -70.0),
                     '160': J(170.0, 280.0, 60.0)},
             steps=steps, frames=300, post28=1, noEm=1)
    c.update(x); return c
S = lambda ph, fr, win=0: {'fn': '1050a1c', 'phase': ph, 'win': win, 'frame': fr}
cases = [
    C('e00_c9', 0xc9, [S(1, 26.0, 1)]),
    C('e00_77', 0x77, [S(1, 95.0)]),
    C('e03_6f0', 0x6f, [S(0, None)]),
    C('e03_6f2', 0x6f, [S(2, 12.0), S(2, 47.0)]),
    C('e02_6c', 0x6c, [S(1, 111.0)]),
    C('e13_72', 0x72, [S(1, 30.0)]),
    C('e01_70', 0x70, [S(1, 30.0)]), C('e01_71', 0x71, [S(1, 30.0)]), C('e01_75', 0x75, [S(1, 120.0)]), C('e01_76', 0x76, [S(1, 120.0)]),
    C('e13b_1d', 0x1d, [S(1, 220.0)]), C('e13b_1c', 0x1c, [S(1, 220.0)]), C('e13b_1b', 0x1b, [S(1, 220.0)]), C('e13b_7e', 0x7e, [S(1, 220.0)]),
    C('e01_04', 0x04, [S(1, 245.0, 1)]),
]
json.dump(cases, open(sys.argv[1], 'w'))

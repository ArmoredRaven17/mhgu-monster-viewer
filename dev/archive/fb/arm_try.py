import json, sys
J = lambda x, y, z: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
F4 = {0x165: ['em083_04', '00'], 0x168: ['em083_04', '01'], 0x16a: ['em083_04', '13']}
cs = []
for n, fr, st, dur in ((0x10, 158.0, 2, [50, 0]), (0x10, 158.0, 1, [50, 0]), (0x10, 158.0, 0, [50, 0]), (0x42, 85.0, 2, [50, 0]), (0x42, 85.0, 1, [50, 0]), (0x11, 165.0, 3, [50, 0])):
    cs.append(dict(name='a%x_%d' % (n, st), mon='em083_04', folders={str(k): v for k, v in F4.items()}, variant=4, owner=[0, 0x3000, 0],
        ownerPos=[120.5, 15.25, -80.75], target=[900.0, 40.0, 2400.0], floorY=0.0, ground=0.0, size=[1.0, 1.0], base=1.0, rank=5, quest=10,
        owner_bytes={'0x73e0': [7, n], '0xcae0': [0x65, 1, 0, 0], '0xcae4': [0x68, 1, 0, 0], '0xcae8': [0x6a, 1, 0, 0], '0xcb64': [st, 0, 0, 0]},
        block_bytes={'0x3cc': dur}, joints={'0': J(120.5, 200.0, -80.75), '157': J(160.0, 260.0, -40.0)},
        steps=[{'fn': '1050a1c', 'phase': 1, 'win': 0, 'frame': fr}], frames=30))
json.dump(cs, open(sys.argv[1], 'w'))

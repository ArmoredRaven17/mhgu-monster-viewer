import json, math, subprocess, sys
def jointOf(a, b, c, t):
    ca, sa, cb, sb, cc, sc = math.cos(a), math.sin(a), math.cos(b), math.sin(b), math.cos(c), math.sin(c)
    Ry = [ca, 0, -sa, 0, 1, 0, sa, 0, ca]; Rx = [1, 0, 0, 0, cb, sb, 0, -sb, cb]; Rz = [cc, sc, 0, -sc, cc, 0, 0, 0, 1]
    mul = lambda A, B: [sum(A[i*3+k]*B[k*3+j] for k in range(3)) for i in range(3) for j in range(3)]
    R = mul(mul(Rz, Rx), Ry)
    return [R[0], R[1], R[2], 0, R[3], R[4], R[5], 0, R[6], R[7], R[8], 0, t[0], t[1], t[2], 1]
J = {'0': jointOf(0.2, 0, 0, [118.0, 210.5, -60.25]), '130': jointOf(2.4, -0.2, 0.3, [-30.0, 120.5, -250.25])}
F = {'164': ['em022_00', '00'], '165': ['em022_00', '01'], '166': ['em022_00', '13']}
base = dict(mon='em022_00', folders=F, variant=0, owner=[0, 0x3000, 0], ownerPos=[120.5, 15.25, -80.75], target=[900.0, 40.0, 2400.0],
            floorY=0.0, ground=0.0, size=[1.0, 1.0], base=1.0, rank=5, quest=10, joints=J, frames=900)
cases = []
for nm, kind, sub in (('t0', 1, 0), ('t1', 1, 1), ('t2', 1, 2), ('t3', 2, 0), ('t14', 3, 0), ('t8', 4, 1), ('t12', 5, 1)):
    cases.append(dict(base, name=nm, steps=[{'fn': 'ddd6dc', 'frame': 100.0, 'args': [kind, sub], 'phase': 1}]))
for nm, sub in (('s0', 0), ('s1', 2)):
    cases.append(dict(base, name=nm, block={'0x1a3': [0]}, steps=[{'fn': 'ddd840', 'frame': 98.0, 'args': [sub], 'phase': 1}]))
json.dump(cases, open('bl_cases.json', 'w'))

import sys, json
sys.argv = ['headdrop.py', '2', '3', '7', '{"owner_pos":[100.0,0.0,50.0],"joint142":[300.0,400.0,-500.0],"owner_yaw_u16":16384,"size_a":1.5}']
src = open('headdrop.py').read().split('t, out = TE.run')[0]
exec(src)
t = TE.TailEmu(cfg); t.frame = -1; t.build()
for k in range(2): t.frame = k - 2; t.pass24(); t.pass28()
t.sever()
for k in range(3):
    t.frame = k; t.pass24(); t.pass28()
    X = t.OPT
    print(k, 'scale14e0', [round(t.f32(X + 0x14e0 + 4*i), 4) for i in range(3)], 'angles', [hex(t.u32(X + 0x1450 + 4*i)) for i in range(3)],
          'nts', t.vec(X + 0xed0, 3), 'pos', [round(v, 2) for v in t.vec(X + 0x40, 3)])

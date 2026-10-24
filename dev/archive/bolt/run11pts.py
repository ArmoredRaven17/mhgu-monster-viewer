import struct, math, emu
from emu import S
from unicorn.arm_const import *
ints=[138,0,20,2]; floats=[72.0,84.0,96.0,108.0,120.0,122.0,134.0,146.0,158.0,170.0,181.0,192.0,202.0,210.0,220.0,230.0,240.0,250.0,260.0,270.0,40.0,60.0]
vecs=[[0,0,0],[0,0,600]]+[[0,0,0]]*19
VB=0x30100000
def sf(uc,v): uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I',struct.pack('<f',v))[0])
def gf(uc): return struct.unpack('<f',struct.pack('<I',uc.reg_read(UC_ARM_REG_S0)))[0]
def fl(uc): i=uc.reg_read(UC_ARM_REG_R1); sf(uc, floats[i] if i<len(floats) else 0.0); return 0
def vec(uc):
    i=uc.reg_read(UC_ARM_REG_R1); a=VB+16*i; uc.mem_write(a, struct.pack('<3f',*(vecs[i] if i<len(vecs) else [0,0,0]))); return a
def m(fn): return lambda uc: (sf(uc, fn(gf(uc))), 0)[1]
stubs={0x4a2470: lambda uc: ints[uc.reg_read(UC_ARM_REG_R1)] if uc.reg_read(UC_ARM_REG_R1)<len(ints) else -1,
       0x4a24f8: fl, 0x4a2584: vec, 0x13ecc20: m(math.sin), 0x13ecc2c: m(math.cos), 0x13ecc5c: m(math.acos), 0x13ecc14: m(math.sqrt)}
TB=0x30110000
mem={S+0x1668: TB}
emu.mu.mem_write(0x19176e0, struct.pack('<4f',1,0,0,0))
log,err,r0=emu.run(0x1031d28, {'r0':S,'r1':20}, mem, stubs)
print(err, [l for l in log if l[0]!='call'][:5])
for k in range(20):
    x,y,z,w=struct.unpack('<4f', bytes(emu.mu.mem_read(TB+16*k,16)))
    print(k, round(x,2), round(y,2), round(z,2), ' r=%.1f ang=%.1f'%(math.hypot(x,z), math.degrees(math.atan2(z,x))))

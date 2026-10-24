import sys
sys.path.insert(0, r'C:\MHGU-Extract\build\arm')
import emu
ia=emu.init_array()
print('560bd4 in init_array:', 0x560bd4 in ia)
e=emu.Emu()
bad=0
for f in ia:
    e.call(f)
    if e.fault: bad+=1
print('init faults',bad)
p=e.u32(0x18380cc); print('pair ptr',hex(p))
for i in range(24):
    a,b=e.u32(p+8*i),e.u32(p+8*i+4)
    h=lambda v:'#%02X%02X%02X'%(v&255,(v>>8)&255,(v>>16)&255)
    print(i, hex(a),hex(b), h(a),h(b), e.writers(p+8*i))
c=e.u32(0x18380b0); print('cat ptr',hex(c))
for i in range(16): print('cat',i,[hex(e.u32(c+16*i+4*j)) for j in range(4)])
v=e.u32(0x18922b8); print('[0x18922b8]=',hex(v), 'writers', e.writers(0x18922b8))
print('[0x18380cc]=',hex(e.u32(0x18380cc)))
for i in range(18):
    r=e.call(0x55f474,(v,i,0)); r2=e.call(0x55f474,(v,i,1)); print('get',i,hex(r),hex(e.u32(r)),hex(e.u32(r2)))

import sys, struct, collections
sys.path.insert(0,'.')
import emu88
from unicorn.arm_const import *
emu88.LOGN.update({0xafe84, 0xafef0, 0x10b62f4, 0x10bb7c0, 0x10aebac, 0x10b613c, 0xafce8})
E=emu88.E
out=[]
for st in range(0,16):
    for n in range(0,256):
        k=emu88.Ka(mode=0, action=(st,n))
        k.mu.mem_write(E+0xd470, bytes([1,2]))
        try:
            lg=k.call(0x10b4828, st, n)
        except Exception as ex:
            print(st,hex(n),'ERR',ex, hex(k.mu.reg_read(UC_ARM_REG_PC))); continue
        cb=struct.unpack('<I',k.mu.mem_read(E+0xcb0c,4))[0]
        d=bytes(k.mu.mem_read(E+0xd470,2))
        calls=[(hex(x[1]),hex(x[2]),x[3]) for x in lg if x[0]=='call']
        mot=[c for c in calls if c[0] in ('0xafe84','0xafef0','0xafce8')]
        oth=[c for c in calls if c[0] not in ('0xafe84','0xafef0','0xafce8')]
        if cb!=0 or d!=bytes([1,2]) or oth or mot:
            print('(%d,%#04x) cb0c=%d d470/1=%d/%d motion=%s other=%s'%(st,n,cb,d[0],d[1],[m[1] for m in mot],oth))

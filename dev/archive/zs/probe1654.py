import sys, struct
sys.argv=['x']
import tr57 as T
from unicorn.arm_const import *
NEW=[0]
_old=T.hook
def h(uc, addr, size, ud):
    if addr==0x48b884 and not (T.rng[0]<=addr<T.rng[1]):
        s=uc.reg_read(UC_ARM_REG_R1)
        sid,mode=struct.unpack('<II',bytes(uc.mem_read(s+4,8)))
        a=T.nxt[0]; T.nxt[0]+=0x2000; uc.mem_write(a,b'\0'*0x2000); NEW[0]=a
        T.cur.setdefault('ev',[]).append(['create',hex(sid),mode,a,[round(x,3) for x in struct.unpack('<3f',bytes(uc.mem_read(s+0x10,12)))],hex(uc.reg_read(UC_ARM_REG_LR))])
        T.ret(uc,a); return
    return _old(uc,addr,size,ud)
T.mu.hook_add(T.UC_HOOK_CODE,h,begin=0x48b884,end=0x48b884)

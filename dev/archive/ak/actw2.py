import sys, struct
sys.path.insert(0,'.')
import emu88b as emu88
from unicorn import UC_HOOK_MEM_WRITE
from unicorn.arm_const import *
E=emu88.E
emu88.LOGN.update({0xafe84,0xafef0}); emu88.RETVAL[0x48b884]=0x5a5a0000
for st in (0,1,2,7):
    for n in range(0,0x40):
        k=emu88.Ka(mode=0, action=(st,n))
        W=[]
        def wh(uc,acc,a,size,val,ud):
            for lo,hi,name in ((0xd420,0xd434,'d420'),(0xd450,0xd460,'d450'),(0xd408,0xd409,'d408'),(0xd470,0xd472,'pend')):
                if E+lo<=a<E+hi: W.append('%s+%d=%#x'%(name,a-E-lo,val))
        k.mu.hook_add(UC_HOOK_MEM_WRITE, wh)
        try: lg=k.call(0x10b4828, st, n); err=''
        except Exception as ex: lg=k.log; err=' ERR@%#x'%k.mu.reg_read(UC_ARM_REG_PC)
        mot=['%#x'%x[2] for x in lg if x[0]=='call']
        W=[w for w in W if not w.endswith('=0x0')]
        if W: print('(%d,%#04x)'%(st,n), 'motion', mot, 'writes', W, err)

import sys, struct
sys.argv=['x']
import tr57 as T
from unicorn import UC_HOOK_MEM_WRITE
W=[]
T.mu.hook_add(UC_HOOK_MEM_WRITE, lambda uc,acc,addr,size,val,ud: W.append(hex(uc.reg_read(T.UC_ARM_REG_PC))) if addr==T.C+0x18 else None)
for var in (0,4):
  for st in range(1,13):
    for n in range(256):
      res={}
      for ph in range(5):
        for scn in ({}, {'frame':1}, {'ended':1}):
          W.clear()
          try: r=T.run(st,n,ph,var,0,**scn)
          except Exception: continue
          if W:
            mots=[e[1] for e in r.get('ev',[]) if e[0]=='mot']
            res.setdefault((tuple(sorted(set(W))),),set()).add('p%d%s %s'%(ph,''.join(k[:2] for k in scn),','.join(mots)))
      if res: print(var, st, hex(n), {str(k[0]):sorted(v)[:4] for k,v in res.items()}, flush=True)

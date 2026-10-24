# per clip: the actions whose FIRST update sets it (phase 0), and what each writes to [+0xcac0]+0x18 in that update
import sys, struct, json
sys.argv=['x']
import tr57 as T
from unicorn import UC_HOOK_MEM_WRITE
W=[]
T.mu.hook_add(UC_HOOK_MEM_WRITE, lambda uc,acc,addr,size,val,ud: W.append(hex(uc.reg_read(T.UC_ARM_REG_PC))) if addr==T.C+0x18 else None)
out={}
for var in (0,4):
  for st in range(1,13):
    for n in range(256):
      W.clear()
      try: r=T.run(st,n,0,var,0)
      except Exception: continue
      mots=[e[1] for e in r.get('ev',[]) if e[0]=='mot']
      if not mots: continue
      out.setdefault('%d|%s'%(var,mots[-1]),[]).append(['%d:0x%02x'%(st,n), sorted(set(W))])
json.dump(out,open('headw2.json','w'),indent=0)
for k,v in sorted(out.items()):
    ws=set(tuple(x[1]) for x in v)
    print(k, 'ALL' if all(x[1] for x in v) else 'NONE' if not any(x[1] for x in v) else 'MIXED', len(v), sorted(ws))

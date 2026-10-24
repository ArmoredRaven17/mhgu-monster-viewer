import sys, json
sys.argv=['x']
import tr57 as T
out={}
for var in (0,4):
  for n in range(256):
    seen={}; mots=set()
    for ph in range(5):
      for s2 in (0,1,2):
        for ch in (0,1):
          for rg in (0,1):
            for scn in ({'frame':1},{'frame':1,'ended':1},{'frame':1,'landed':1}):
              r=T.run(7,n,ph,var,0,s2=s2,charged=ch,rage=rg,stub={0x49930:10,0x3a8430:5},**scn)
              for e in r.get('ev',[]):
                if e[0]=='mot' and ph==0: mots.add(e[1])
                if e[0]=='create':
                  k='%s m%d f%s %s'%(e[1],e[2],e[6],e[5]); seen.setdefault(k,set()).add('p%d c%d r%d'%(ph,ch,rg))
    if seen: print(var,hex(n),sorted(mots),{k:sorted(v) for k,v in sorted(seen.items())}, flush=True)

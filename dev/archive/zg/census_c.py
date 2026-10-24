"""census_c.py CLS=<class> python census_c.py <variants> <statuses> -- every action x phase 0..5 x ended/frame 0/1 (follows=0):
for each run the MOT lines and CHG lines. Output json {(v,st,n,ph,e): [events]}"""
import sys, os, json
import tracec as TR
vs=[int(x,0) for x in sys.argv[1].split(',')]; sts=[int(x,0) for x in sys.argv[2].split(',')]
out={}
for v in vs:
  for st in sts:
    for n in range(0,0x100):
      for ph in range(0,6):
        for e in (0,1):
          try: ev=TR.run(v,st,n,ph,e,e,0,follows=0)
          except Exception as x: ev=['ERR '+str(x)[:80]]
          ev=[x for x in ev if x.startswith('MOT') or x.startswith('CHG')]
          if ev: out['%d,%d,%d,%d,%d'%(v,st,n,ph,e)]=ev
json.dump(out,open(sys.argv[3],'w'))
print(len(out))

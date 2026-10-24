import os, sys, json
os.environ['FB_CLASS']='uEm004_00'; os.environ['FB_EM']='4'
sys.argv=['x']
import trgen as T
ids=json.load(open('ids_fbb.json')).get('em004_00',{})
import struct
POKE={T.E+int(k,16):list(struct.pack('<I',int(v,16))) for k,v in ids.items()}
for ph in range(4):
  for scn in ({'frame':1,'frame2':1},{'frame':1,'frame2':1,'ended':1},{'frame':0,'frame2':0},{'frame':0,'frame2':0,'ended':1}):
    for rg in (0,1):
      r=T.run(2,0x0f,ph,0,0,rage=rg,stub={0x3a8430:5,0x49930:10},poke=POKE,**scn)
      ev=[e for e in r.get('ev',[]) if e[0] in ('chg','mot')]
      if ev: print(ph,scn,rg,ev)

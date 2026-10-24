import struct
src=open(r'C:/MHGU-Extract/build-map-areas.py',encoding='utf-8').read()
i=src.index('K_L0, K_L1, K_L2 ='); j=src.index('def sh_coefficients')
ns={}; exec(src[i:j], ns)
d=open(r'C:/MHGU-ROM/romfs/nativeNX/system/texture/DefaultCube_CM.tex','rb').read()
c=[round(x,6) for x in struct.unpack_from('<27f', d, 0x10)]
print(c)
p=ns['pack_sh'](c)
for v in p: print(v)
def ev(n):
  x,y,z=n; n4=[x,y,z,1]
  r=[sum(p[ch][k]*n4[k] for k in range(4)) for ch in range(3)]
  q=[x*y,y*z,z*z,z*x]
  r=[r[ch]+sum(p[3+ch][k]*q[k] for k in range(4)) for ch in range(3)]
  r=[r[ch]+p[6][ch]*(x*x-y*y) for ch in range(3)]
  return [round(v,3) for v in r]
for n in [(0,1,0),(0,-1,0),(1,0,0),(-1,0,0),(0,0,1),(0,0,-1)]: print(n, ev(n))

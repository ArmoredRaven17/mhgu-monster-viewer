import json, struct, sys
import numpy as np
fn = sys.argv[1]; anims = sys.argv[2:]
b=open(fn,'rb').read()
l=struct.unpack_from('<I',b,12)[0]
j=json.loads(b[20:20+l]); bin_off = 20+l+8
nodes=j['nodes']; acc=j['accessors']; bv=j['bufferViews']
def read(ai):
    a=acc[ai]; v=bv[a['bufferView']]; o=bin_off+v.get('byteOffset',0)+a.get('byteOffset',0)
    n={'SCALAR':1,'VEC3':3,'VEC4':4}[a['type']]
    if a['componentType']==5126: arr=np.frombuffer(b,dtype='<f4',count=a['count']*n,offset=o).reshape(a['count'],n)
    elif a['componentType']==5122: arr=np.maximum(np.frombuffer(b,dtype='<i2',count=a['count']*n,offset=o).reshape(a['count'],n)/32767.0,-1.0)
    else: raise Exception(a['componentType'])
    return arr
par={}
for i,n in enumerate(nodes):
    for c in n.get('children',[]): par[c]=i
def mat(t,r,s):
    x,y,z,w=r
    R=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    T=np.eye(4); T[:3,:3]=R*np.array(s); T[:3,3]=t; return T
names={n.get('name'):i for i,n in enumerate(nodes)}
for an in anims:
    A=[a for a in j['animations'] if a.get('name')==an][0]
    for frame in (0, 'mid'):
        trs={i:[list(n.get('translation',[0,0,0])),list(n.get('rotation',[0,0,0,1])),list(n.get('scale',[1,1,1]))] for i,n in enumerate(nodes)}
        for ch in A['channels']:
            s=A['samplers'][ch['sampler']]; tt=read(s['input'])[:,0]; vv=read(s['output'])
            k=0 if frame==0 else len(tt)//2
            p=ch['target']['path']; nd=ch['target']['node']
            idx={'translation':0,'rotation':1,'scale':2}.get(p)
            if idx is not None: trs[nd][idx]=list(vv[k])
        def world(i):
            M=mat(*trs[i])
            while i in par: i=par[i]; M=mat(*trs[i])@M
            return M
        out={nm: np.round(world(names[nm])[:3,3]*100,2) for nm in ('0:0','3:19','6:16','10:4','9:3')}
        print(an, frame, out)

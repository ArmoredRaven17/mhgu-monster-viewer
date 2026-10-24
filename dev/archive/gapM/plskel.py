import json, struct, sys
import numpy as np
fn = sys.argv[1]
b=open(fn,'rb').read()
l=struct.unpack_from('<I',b,12)[0]
j=json.loads(b[20:20+l])
nodes=j['nodes']
par={}
for i,n in enumerate(nodes):
    for c in n.get('children',[]): par[c]=i
def local(n):
    if 'matrix' in n: return np.array(n['matrix']).reshape(4,4).T
    T=np.eye(4)
    t=n.get('translation',[0,0,0]); r=n.get('rotation',[0,0,0,1]); s=n.get('scale',[1,1,1])
    x,y,z,w=r
    R=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    T[:3,:3]=R*np.array(s); T[:3,3]=t; return T
def world(i):
    M=local(nodes[i])
    while i in par: i=par[i]; M=local(nodes[i])@M
    return M
for i,n in enumerate(nodes):
    nm=n.get('name','')
    if ':' in nm and not nm.endswith('_s'):
        p=world(i)[:3,3]; print(nm, np.round(p,3), 'parent', nodes[par[i]]['name'] if i in par else None)

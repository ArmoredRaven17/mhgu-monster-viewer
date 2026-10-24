import sys, os, math
sys.path.insert(0, r'C:\MHGU-Extract\build\frag\motion-audit\aud5')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\posture-scratch')
import gl
from rootmove import qrot, sample
P = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\poses\monsters\em003_00_%s.glb'
def get(lst, clip, which):
    js, bn = gl.glb(P % lst)
    nodes = js['nodes']; name = {n.get('name',''):i for i,n in enumerate(nodes)}
    ref, r0 = name['reference'], name['0:0']
    an = [a for a in js['animations'] if a['name']==clip][0]
    _, vr = sample(js, bn, an, ref, 'translation')
    _, rr = sample(js, bn, an, ref, 'rotation')
    _, v0 = sample(js, bn, an, r0, 'translation')
    _, vq = sample(js, bn, an, r0, 'rotation')
    k = 0 if which=='first' else -1
    t = [ (vr[k] if vr else [0,0,0])[i] + (v0[k] if v0 else [0,0,0])[i] for i in range(3)]
    q = vq[k]
    return [x*100 for x in t], q, rr is not None
def axes(q): return [qrot(q,(1,0,0)), qrot(q,(0,1,0)), qrot(q,(0,0,1))]
def fl(v, axis):
    x,y,z=v
    return {'Rz':(-x,-y,z),'Rx':(x,-y,-z),'Ry':(-x,y,-z),'I':(x,y,z)}[axis]
def ang(a,b): 
    d=sum(i*j for i,j in zip(a,b)); return math.degrees(math.acos(max(-1,min(1,d))))
cases = [(('2','Motion[7]','last'),('2','Motion[40]_start','first'))]
for (l1,c1,w1),(l2,c2,w2) in cases:
    t1,q1,r1 = get(l1,c1,w1); t2,q2,r2 = get(l2,c2,w2)
    print('ref rot tracks?', r1, r2)
    print(c1,w1,'root T',[round(x,1) for x in t1],' axes',[tuple(round(c,2) for c in v) for v in axes(q1)])
    print(c2,w2,'root T',[round(x,1) for x in t2],' axes',[tuple(round(c,2) for c in v) for v in axes(q2)])
    A1=axes(q1); A2=axes(q2)
    for f in ('I','Rz','Rx','Ry'):
        print('  %s(pi) applied to %s: X %.1f  Y %.1f  Z %.1f deg off; root T -> %s' % (f, c1, ang(fl(A1[0],f),A2[0]), ang(fl(A1[1],f),A2[1]), ang(fl(A1[2],f),A2[2]), [round(x,1) for x in fl(t1,f)]))

import struct,re,sys,bisect
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
S=r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/m079/band.txt'
L=[l.rstrip() for l in open(S)]
ins=[(int(l[:8],16),l[10:18].strip(),l[19:].strip()) for l in L]
idx={a:i for i,(a,m,o) in enumerate(ins)}
LO,HI=0xfee698,0xffe0dc
starts=sorted(a for a,m,o in ins if m=='push' and 'lr' in o)
def fn_of(a):
    k=bisect.bisect_right(starts,a)-1; return starts[k] if k>=0 else None
def fn_end(s):
    k=starts.index(s); return starts[k+1] if k+1<len(starts) else HI
def targets(lo,hi):
    out=set()
    for a,m,o in ins[idx[lo]:idx.get(hi,len(ins))]:
        if re.match(r'^b(l|lx)?(eq|ne|hs|lo|hi|ls|ge|lt|gt|le|mi|pl|cs|cc)?$',m) and o.startswith('#0x'):
            t=int(o[1:],16)
            if LO<=t<HI and not (lo<=t<hi): out.add(t)
            elif not (LO<=t<HI): out.add(('ext',t))
    return out
SPAWN={0xff2514:'s01(cb58)',0xff2604:'s31',0xff267c:'s40',0xff26fc:'s00(cb54)',0xff27cc:'s40end?'}
memo={}
def reach(f,seen=None):
    if seen is None: seen=set()
    if f in seen: return set()
    seen.add(f)
    r=set()
    if f in SPAWN: r.add(SPAWN[f]); return r
    s=fn_of(f) if f not in starts else f
    if s is None: return r
    for t in targets(s,fn_end(s)):
        if isinstance(t,tuple): continue
        r|=reach(fn_of(t) if fn_of(t)==t or t in starts else t,seen)
    return r
def case_targets(t):
    out=set(); i=idx[t]
    for a,m,o in ins[i:i+40]:
        if re.match(r'^b(l|lx)?(eq|ne|hi|ls|ge|lt|gt|le)?$',m) and o.startswith('#0x'):
            out.add(int(o[1:],16))
        if m=='b' or m.startswith('pop') or m=='bx' or (m=='add' and o.startswith('pc')): break
    return out
def table(hdl):
    i=idx[hdl]
    for j in range(i,i+60):
        a,m,o=ins[j]
        if m=='add' and o.startswith('pc,'):
            # find cmp before
            tab=None
            for k in range(j-1,j-6,-1):
                if ins[k][1]=='add' and 'pc, #4' in ins[k][2]: tab=ins[k][0]+12
            n=None
            for k in range(j-1,j-10,-1):
                mm=re.match(r'r\d+, #(0x[0-9a-f]+|\d+)',ins[k][2])
                if ins[k][1]=='cmp' and mm: n=int(mm.group(1),0)+1; break
            sub=any(ins[k][1]=='sub' and '#1' in ins[k][2] for k in range(j-10,j))
            return tab,n,1 if sub else 0
    return None,None,0
for st,h in [(0,0xff2e30),(1,0xff30ac),(2,0xff3648),(3,0xff3a30),(4,0xff4a28),(7,0xff5fe8),(10,0xff83a0),(11,0xff8b94),(12,0xff8c9c),(13,0xff8cc0)]:
    tab,n,b0=table(h)
    if tab is None: print('status',st,'no table'); continue
    for k in range(n):
        w=struct.unpack_from('<i',T,tab+4*k)[0]; t=tab+w
        r=set()
        for c in case_targets(t):
            if LO<=c<HI: r|=reach(c if c in starts else (fn_of(c) if fn_of(c)!=h else c))
        if r: print('(%d, 0x%02x) case %06x ->'%(st,k+b0,t), sorted(r), sorted(hex(c) for c in case_targets(t)))

import sys, re
def load(fn):
    L=[l.rstrip() for l in open(fn)]
    return L, {int(l[:8],16):i for i,l in enumerate(L)}
B={}
for nm in ('band69.txt','band76.txt'):
    B[nm]=load(nm)
def which(a):
    for nm,(L,idx) in B.items():
        if a in idx: return nm
def start(a):
    L,idx=B[which(a)]; i=idx[a]
    while i>0 and not (re.search(r'\spush\s', L[i]) and 'lr' in L[i]): i-=1
    return int(L[i][:8],16)
def callers(t):
    out=[]
    for nm,(L,idx) in B.items():
        for l in L:
            if re.search(r'\s(bl|b|blx|beq|bne|bxx)\s+#0x%x$'%t, l): out.append(l[:8])
    return out
if __name__=='__main__':
    for a in sys.argv[1:]:
        s=start(int(a,16)); print(a,'in fn',hex(s),'callers',callers(s))

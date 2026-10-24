import sys,re
L=[l.rstrip('\n') for l in open('band88.txt')]
idx={int(l[:8],16):k for k,l in enumerate(L) if re.match(r'^[0-9a-f]{8} ',l)}
ids=set(range(0x3e9,0x407))
for k,l in enumerate(L):
    p=l.split(None,2)
    if len(p)<3: continue
    if not p[1].startswith(('mov','movw')): continue
    m=re.search(r'#(0x[0-9a-f]+)$',p[2])
    if not m or int(m.group(1),16) not in ids: continue
    reg=p[2].split(',')[0]
    nxt=[]
    for j in range(k+1,min(k+40,len(L))):
        q=L[j].split(None,2)
        if len(q)>=2 and (q[1] in ('bl','blx') or q[1].startswith('b') and q[1] not in ('bic','bics','bfc','bfi')):
            nxt.append(q[0]+' '+q[1]+' '+(q[2] if len(q)>2 else '')); 
            if q[1] in ('bl','blx','b'): break
    print(p[0], int(m.group(1),16), reg, '|', ' ; '.join(nxt[-2:]))

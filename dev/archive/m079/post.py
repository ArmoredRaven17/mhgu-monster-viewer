import re,bisect
L=[l.rstrip() for l in open('band.txt')]
ins=[(int(l[:8],16),l[10:18].strip(),l[19:].strip()) for l in L]
starts=sorted(a for a,m,o in ins if m=='push' and 'lr' in o)
SET={'#0xafe84','#0xafce8'}
for i,(a,m,o) in enumerate(ins):
    if m in('bl','b') and o in SET:
        mid=None
        for j in range(i-1,i-14,-1):
            mm=re.match(r'r1, #(0x[0-9a-f]+|\d+)$',ins[j][2])
            if ins[j][1].startswith('mov') and mm: mid=int(mm.group(1),0); break
        f=starts[bisect.bisect_right(starts,a)-1]
        post=None; lift=False
        for j in range(i-1,-1,-1):
            if ins[j][0]<f: break
            if ins[j][1]=='bl' and ins[j][2]=='#0xbc984': lift=True
            if ins[j][1]=='bl' and ins[j][2]=='#0xbc7f4':
                mm=re.match(r'r1, #(\d+|0x[0-9a-f]+)$',ins[j-1][2]) or re.match(r'r1, #(\d+|0x[0-9a-f]+)$',ins[j-2][2])
                post=mm.group(1) if mm else '?'; break
        if mid is not None and (mid>>8)==2 and (mid&0xff) in (12,13,14,15,20,21,22,23,24,25,34,35,36,37,41,42,43,44,45,46): print('%x fn %x L2 M%d posture %s lift %s'%(a,f,mid&0xff,post,lift))
        if mid is not None and (mid>>8)==1 and (mid&0xff) in (26,27,28,29,22): print('%x fn %x L1 M%d posture %s lift %s'%(a,f,mid&0xff,post,lift))

import d, struct
T=d.TEXT
hits=[]
for a in range(0,len(T)-4,4):
    w=struct.unpack_from('<I',T,a)[0]
    if (w>>25)&7==1 and (w&0xfff)==0xfed and (w>>28)!=0xf:
        op=(w>>21)&0xf
        if op in (4,0xd):   # add, mov
            hits.append(a)
print(len(hits))
for a in hits:
    lines=d.dis(a-8,a+24)
    txt='\n'.join(lines)
    if 'strh' in txt or 'str ' in txt or 'orr' in txt:
        print('----'); print(txt)

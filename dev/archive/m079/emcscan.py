import re,sys
want={0x10,0x12,0x15,0x16,0x18,0xca,0xd2,0xcb,0xda}
for f in ('emc_00.txt','emc_04.txt'):
    print('==',f)
    for line in open(f):
        m=re.match(r'g(\d+) s(\d+): (.*)',line.strip())
        if not m: continue
        g,s,body=m.groups(); ops=body.split(' | ')
        stack=[]; hits=[]
        for o in ops:
            b=o.split()
            if len(b)>=2 and b[0] in('92','1c','98','16','0b','6a','1d','6f','02','4b','2e','0c','24') :
                if b[1]=='00': stack.append(b[0]+'['); 
                elif b[1]=='01': 
                    if stack: stack[-1]=b[0]+'['+' '.join(b[2:])
                elif b[1]=='02':
                    if stack: stack[-1]=b[0]+'[else'
                elif b[1]=='ff':
                    if stack: stack.pop()
            if len(b)==3 and b[0]=='00' and b[1]=='07' and int(b[2],16) in want:
                hits.append('(7,%s)@%s'%(b[2],'/'.join(x for x in stack if x.startswith(('92','1c','98','16')))))
        if hits: print('g%s s%s'%(g,s),' '.join(hits))
    for line in open(f):
        m=re.match(r'g(\d+) s(\d+): (.*)',line.strip())
        if m and re.search(r'\b14 (5f|60|61|36)\b',m.group(3)): print('  calls s95/96/97/54 from g%s s%s'%m.groups()[:2], re.findall(r'\b14 (5f|60|61|36)\b',m.group(3)))

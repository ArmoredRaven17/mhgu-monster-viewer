import struct,re,sys
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
S=r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/m079/band.txt'
L=[l.rstrip() for l in open(S)]
ins=[(int(l[:8],16),l[10:18].strip(),l[19:].strip()) for l in L]
idx={a:i for i,(a,m,o) in enumerate(ins)}
def walk(t,lo,hi):
    regs={}; i=idx[t]; calls=[]
    for _ in range(60):
        a,m,o=ins[i]
        mm=re.match(r'(r\d), #(0x[0-9a-f]+|\d+)$',o)
        if m in('mov','movw') and mm: regs[mm.group(1)]=int(mm.group(2),0)
        if m=='str' and 'sp]' in o: regs['[sp]']=regs.get(o.split(',')[0])
        if m=='bl': calls.append((o, dict(regs)))
        if m=='b':
            x=int(o[1:],16)
            if lo<=x<hi: i=idx[x]; continue
            return 'b %s r1=%s r2=%s r3=%s sp0=%s'%(o,regs.get('r1'),regs.get('r2'),regs.get('r3'),regs.get('[sp]')), calls
        if m.startswith('pop') and 'pc' in o: return 'return', calls
        i+=1
    return '?',calls
tab=int(sys.argv[1],16); n=int(sys.argv[2],16)+1; b0=int(sys.argv[3]); lo=int(sys.argv[4],16); hi=int(sys.argv[5],16); dflt=int(sys.argv[6],16) if len(sys.argv)>6 else -1
for k in range(n):
    w=struct.unpack_from('<i',T,tab+4*k)[0]; t=tab+w
    if t==dflt: continue
    r,c=walk(t,lo,hi)
    print('(0x%02x) %06x %s %s'%(k+b0,t,r,' '.join('bl'+x[0] for x in c)))

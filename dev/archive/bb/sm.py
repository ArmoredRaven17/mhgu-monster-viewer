from d import *
import sys
lo,hi=0xd31a64,0xd46da0
T={0xafe84,0xafef0,0xafce8,0xb0df4,0x7256c,0x726cc}
ins=list(md.disasm(TEXT[lo:hi], lo))
want=[int(x,0) for x in sys.argv[1:]]
for k,i in enumerate(ins):
    if i.mnemonic in('bl','b'):
        try: t=int(i.op_str.strip('#'),16)
        except: continue
        if t in T:
            # find last write to r1 in previous 12
            r1=None
            for j in range(k-1,max(0,k-14),-1):
                p=ins[j]
                if p.op_str.startswith('r1,') and p.mnemonic.startswith(('mov','movw','add','ldr')):
                    r1=(p.address,p.mnemonic,p.op_str);break
            s=r1[2] if r1 else ''
            hit=any(s.endswith('#%d'%w) or s.endswith('#0x%x'%w) for w in want)
            if hit or not want: print(hex(i.address),hex(t),r1 and (hex(r1[0]),r1[1],r1[2]))

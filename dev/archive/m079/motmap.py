import re,bisect,subprocess,sys
S=r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/m079/'
L=[l.rstrip() for l in open(S+'band.txt')]
ins=[(int(l[:8],16),l[10:18].strip(),l[19:].strip()) for l in L]
idx={a:i for i,(a,m,o) in enumerate(ins)}
starts=sorted(a for a,m,o in ins if m=='push' and 'lr' in o)
def fn_end(s):
    k=starts.index(s); return starts[k+1] if k+1<len(starts) else 0xffe0dc
SETM={'#0xafe84','#0xafe8c','#0xafe80','#0xafe88'}
def motions(s):
    out=[]
    for i in range(idx[s], idx[fn_end(s)]):
        a,m,o=ins[i]
        if m in('bl','b') and o in SETM:
            for j in range(i-1,i-12,-1):
                mm=re.match(r'r1, #(0x[0-9a-f]+|\d+)$',ins[j][2])
                if ins[j][1] in('mov','movw','moveq','movweq','movne','movwne') and mm:
                    v=int(mm.group(1),0); out.append('L%dM%d%s'%(v>>8,v&0xff,'?' if ins[j][1].endswith(('eq','ne')) else ''))
                    if not ins[j][1].endswith(('eq','ne')): break
    return out
for f in sys.argv[1:]:
    s=int(f,16); print(f, motions(s))

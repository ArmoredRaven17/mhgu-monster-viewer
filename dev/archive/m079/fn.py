import sys
S=r'C:/Users/humph/AppData/Local/Temp/claude/C--MHGU-Extract-MHGU-Monster-Viewer/bbae25d7-5c4a-424f-bb47-777ad4066372/scratchpad/m079/band.txt'
L=[l.rstrip() for l in open(S)]
idx={int(l[:8],16):i for i,l in enumerate(L)}
def start(a):
    i=idx[a]
    while i>0 and not (' push ' in L[i] and 'lr' in L[i]): i-=1
    return i
for arg in sys.argv[1:]:
    a=int(arg,16); i=start(a)
    print('#### fn start', L[i][:8], 'for', arg)

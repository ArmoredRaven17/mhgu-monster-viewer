import re,sys
src=open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js',encoding='utf-8').read().split('\n')
start=[i for i,l in enumerate(src) if l.startswith('export const CLIP_EFFECTS')][0]
def block(mon):
    out=None
    for i in range(start,len(src)):
        l=src[i]
        if out is None:
            if l.startswith('  %s: {'%mon): out=[l]
        else:
            if re.match(r'^  em\d{3}_\d{2}: \{',l) or l.startswith('};'): break
            out.append(l)
    return out or []
for mon in sys.argv[2:]:
    open('%s_%s.txt'%(mon,sys.argv[1]),'w',encoding='utf-8').write('\n'.join(block(mon)))
    print(mon,len(block(mon)))

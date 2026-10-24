import re
L=open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md',encoding='utf-8').read().split('\n')
for i,l in enumerate(L):
    if 'em001-effects-spec' in l or 'emu13c_rath' in l or ('0xd09' in l and l.startswith('|')):
        s = re.sub(r'`[^`]*`', '', l.replace('\|', ''))
        print(i+1, s.count('|'))

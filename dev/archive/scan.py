import re,glob,os
V='C:/MHGU-Extract/MHGU-Monster-Viewer'
board=open('C:/Coding Repos/MHGU-TASKS.md',encoding='utf-8',errors='replace').read().split('\n')
rm=open(V+'/dev/rom-map.md',encoding='utf-8',errors='replace').read().lower()
docs=''
for f in glob.glob(V+'/dev/**/*.md',recursive=True)+glob.glob(V+'/docs/render/**/*.js',recursive=True):
    if f.endswith('rom-map.md'): continue
    try: docs+=open(f,encoding='utf-8',errors='replace').read().lower()
    except: pass
pat=re.compile(r'0x[0-9a-fA-F]{5,8}')
out=[]
for i in range(1116,7178):
    l=board[i]
    adds=[a.lower() for a in pat.findall(l)]
    miss=[a for a in adds if a not in rm]
    if not miss: continue
    ind=[a for a in miss if a in docs]
    if ind and len(ind)==len(miss):
        out.append((i+1,ind))
for n,a in out: print(n,' '.join(a))
print(len(out))

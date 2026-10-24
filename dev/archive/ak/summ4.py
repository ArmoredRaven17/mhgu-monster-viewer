import re, collections
# lines: env action L2 Mx  (slotk, id, sk, sp, ek, ep, stop) a-b,...; ...
R=collections.defaultdict(lambda: collections.defaultdict(list))
for l in open('sw4.txt'):
    m=re.match(r'^(\S+) (\(\d+, \d+\)) L2 M(\d+) (.*)$', l.strip())
    if not m: continue
    env,act,mot,rest=m.groups()
    for part in rest.split('; '):
        mm=re.match(r'\((\d+), (\d+), (\d+), (\d+), (\d+), (\d+), (\d+)\) (.*)$', part)
        if mm:
            k,i,sk,sp,ek,ep,st,fr=mm.groups()
            R[(int(i),sk,sp,ek,ep,st)][(env,act)].append('M%s:%s'%(mot,fr))
        else:
            R[('other',part)][(env,act)].append('M%s'%mot)
for key in sorted(R, key=str):
    print(key)
    byfr=collections.defaultdict(list)
    for ea,lst in R[key].items(): byfr[' '.join(lst)].append('%s%s'%ea)
    for fr,eas in byfr.items(): print('    ', ', '.join(eas)[:200], '=>', fr[:400])

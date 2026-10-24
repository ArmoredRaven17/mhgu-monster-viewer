import re,json,collections
txt=open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\render\monster.js',encoding='utf-8').read()
CE={}
for mon in ('em079_00','em079_04'):
    i=txt.index('\n  %s: {'%mon); j=txt.index('\n  },',i)
    blk=txt[i:j]
    for m in re.finditer(r"'L(\d+) (Motion\[\d+\])': \{ frames: \d+, bits: \[(.*?)\] \},",blk):
        li,mo,b=m.groups()
        CE[(mon,li,mo)]=[(int(x.group(1)),int(x.group(2))) for x in re.finditer(r"bit: (\d+), efl: '[^']+', key: (\d+)",b)]
D=json.load(open('census.json'))
try:
    D2={}
    for l in open('census2.log',encoding='utf-8'):
        m=re.match(r'FAIL (em\S+) ([CR]) L(\d+) (\S+) p(\d)  -- (.*)',l.strip())
        if m:
            mon,rg,li,mo,p,js=m.groups(); d=json.loads(js); k='|'.join((mon,rg,li,mo))
            e=D2.setdefault(k,{'fx':[],'shells':0,'ref':[],'fail':None,'plays':0}); e['plays']+=1
            e['fx'].append([x for x in d['fx'] if 'ragePuff' not in x]); e['shells']+=d['shells']; e['ref']+=d['refused']
            if d['failed']: e['fail']=d['failed']
    D.update(D2)
except FileNotFoundError: pass
def obs(mon,rg,li,mo):
    v=D.get('|'.join((mon,rg,li,mo)))
    if not v: return None
    s=set()
    for p in v['fx']:
        for x in p: s.add(x.split('@')[0])
    return s
miss=[]
for (mon,li,mo),bits in sorted(CE.items()):
    for rg in ('C','R'):
        o=obs(mon,rg,li,mo)
        if o is None: continue
        for b,k in bits:
            want = b<=5 or (rg=='C' and 6<=b<=8) or (rg=='R' and 9<=b<=11) or (b==15 and mon=='em079_04' and (li,mo)==('1','Motion[27]'))
            pel = ('0c' if k in (40,41,12,13,11,50,20,22,31,80,100,111,120,121,130,131,3000) else ('0u' if mon=='em079_00' else '4u'))
            got = any(x.startswith(pel+':%d/'%k) for x in o)
            if want and not got: miss.append(('MISS',mon,rg,li,mo,'b%d'%b,pel,k))
            if not want and got and b not in range(0,6): miss.append(('EXTRA',mon,rg,li,mo,'b%d'%b,pel,k))
for m in miss: print(*m)
# union summary per clip: non-clip fx
print('--- non-clip starts per clip')
for k,v in sorted(D.items()):
    s=collections.Counter()
    for p in v['fx']:
        for x in p:
            if '/clip' not in x: s[x.split('@')[0]]+=1
    if s or v['ref'] or v['fail']: print(k, dict(s), v['shells'], v['ref'][:2] if v['ref'] else '', v['fail'] or '')

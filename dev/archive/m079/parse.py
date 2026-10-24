import re,json,collections
R=collections.OrderedDict()
for l in open('census.log',encoding='utf-8'):
    m=re.match(r'FAIL (em\S+) ([CR]) L(\d+) (\S+) p(\d)  -- (.*)',l.strip())
    if not m: continue
    mon,rg,li,mo,p,js=m.groups(); d=json.loads(js)
    k=(mon,rg,li,mo)
    e=R.setdefault(k,{'fx':[],'shells':0,'ref':set(),'fail':None,'plays':0})
    e['plays']+=1; e['fx'].append([x for x in d['fx'] if 'ragePuff' not in x]); e['shells']+=d['shells']; e['ref']|=set(d['refused'])
    if d['failed']: e['fail']=d['failed']
json.dump({'|'.join(k):{**v,'ref':sorted(v['ref'])} for k,v in R.items()},open('census.json','w'),indent=0)
for k,v in R.items():
    if v['fail']: print('FAILED',k,v['fail'])
# which motions per (mon,rg,list) seen
import itertools
seen=collections.defaultdict(set)
for (mon,rg,li,mo) in R: seen[(mon,rg,li)].add(mo)
for k in sorted(seen): print(k,len(seen[k]))

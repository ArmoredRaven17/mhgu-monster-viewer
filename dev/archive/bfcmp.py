import json,re,sys,glob
def load(p):
    d={}
    for line in open(p,encoding='utf8').read().splitlines():
        m=re.match(r'\S+ METER (\S+)\s+--\s+(\{.*\})',line)
        if m: d[m.group(1)]=json.loads(m.group(2))
        elif 'FAILED:' in line or 'MISSING' in line: d['!'+line[:80]]={}
    return d
for p in sorted(glob.glob('bfm_new_*.out')):
    mon=p[8:-4]; q='bfm_ctl_'+mon+'.out'
    try: a=load(q); b=load(p)
    except Exception as e: print(mon,'ERR',e); continue
    print('==',mon,'records new',len(b),'ctl',len(a))
    for k in sorted(set(a)|set(b)):
        x,y=a.get(k),b.get(k)
        if k.startswith('!'): print('  ',k); continue
        if x is None or y is None or x.get('starts')!=y.get('starts') or x.get('verdict')!=y.get('verdict'):
            f=lambda r: None if r is None else (r['starts'], r['verdict'], r['lit'], r['draws']['models']+r['draws']['prims']+r['draws']['gpu'])
            print('  ',k,'ctl',f(x),'new',f(y))

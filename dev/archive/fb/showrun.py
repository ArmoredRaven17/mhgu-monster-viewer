import json, sys
R=json.load(open(sys.argv[1]))
only=sys.argv[2:]
def show(run, ind=''):
    fr=run['frames']; sp=run['spawn']
    print(ind,'init',run['init'],'pos',[round(v,2) for v in sp['pos']],'vel',[round(v,2) for v in sp['vel']],'acc',[round(v,3) for v in sp['acc']],'ang',sp['ang'],'t',round(sp['timer'],2),'sc',round(sp['scale'],3),'log',[e for e in run['log'] if e[0]!='query'][:4],'nfr',len(fr))
    ps=None
    for f in fr:
        ev=[e for e in f['log'] if e[0] not in ('query','hit')]
        if f['k']<=2 or ev or f['state']!=ps or f is fr[-1]:
            print(ind,'  k',f['k'],f['state'],[round(v,2) for v in f['pos']],[round(v,2) for v in f['vel']],f['ang'],round(f['timer'],2),round(f['scale'],3),ev[:4])
        ps=f['state']
    for ch in run['children']:
        print(ind,' CHILD at',ch['at'],hex(ch['id']), 'mode', int(ch['run']['setup'][16:18],16)); show(ch['run'], ind+'    ')
for n,c in R.items():
    if only and n not in only: continue
    print('=====',n,[(hex(s['id']),s['mode']) for s in c['shells']])
    for s in c['shells']:
        if s['run']: show(s['run'])

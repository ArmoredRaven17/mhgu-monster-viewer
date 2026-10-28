import re,json,sys
for fn in sys.argv[1:]:
    s=open(fn,encoding='utf8',errors='replace').read()
    n=0
    for m in re.finditer(r'(?:PASS|FAIL) CASE (.*?)\s+--\s+(\{.*)', s):
        n+=1; d=json.loads(m.group(2)); ch=d['changeAt']
        post=[x for x in d['curve'] if x[0]>=ch+60]
        bad=[x for x in post if any(v>0 for v in x[1:])]
        lr=[(r['shell'],r['base'],[e for e in r['reqs'] if e['pastChange'] is not None and e['pastChange']>30]) for r in d['contacts']]
        lr=[x for x in lr if x[2]]
        if bad or lr: print('LINGER', m.group(1), 'change', ch, bad[:4], json.dumps(lr)[:400])
    print(fn, 'cases', n)
    for l in s.splitlines():
        if ('ERR ' in l or 'FAILED' in l) and 'CASE' not in l: print(l[:250])

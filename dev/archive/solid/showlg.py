import re,json,sys
s=open(sys.argv[1],encoding='utf8',errors='replace').read()
for m in re.finditer(r'(?:PASS|FAIL) CASE (.*?)\s+--\s+(\{.*)', s):
    d=json.loads(m.group(2)); print('==', m.group(1), 'change', d['changeAt'], 'end', d['end'], 'curve>', [x for x in d['curve'] if x[0]>=d['changeAt']][:6])
    for r in d['contacts']: print('   ', json.dumps(r)[:500])
for l in s.splitlines():
    if 'CASE' not in l and l.strip(): print(l[:300])

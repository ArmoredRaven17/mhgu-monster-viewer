python -c "
import re,json,sys
t=open('fullsw3/sm_$1.log',encoding='utf8',errors='replace').read()
m=re.search(r'REPORT (\S+)  -- (\{.*\})',t)
if not m: print('$1 NO REPORT', t[-300:]); sys.exit()
d=json.loads(m.group(2)); print('$1', d.get('played'), d.get('missing'), [(r['k'].split('|')[1][-2:]+r['k'].split('|')[2], r['st'], r['verdict'][:12]) for r in d['recs']])"

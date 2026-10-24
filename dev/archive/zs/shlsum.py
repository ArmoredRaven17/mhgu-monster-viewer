import re, json, sys
for l in open(sys.argv[1] if len(sys.argv) > 1 else 'shl.txt'):
    if l.startswith('=='): print(l.strip()[:140]); continue
    m = re.match(r'\s+mode (\d+) (.*)', l)
    if m:
        d = json.loads(m.group(2)); ef = d['ef'][0]['arr'] if d.get('ef') else None
        sh = d.get('sh', {})
        print('  m%s sc=%s ef=%s ints=%s fl=%s vecs=%s hit=%s' % (m.group(1), d.get('scale'), ef, sh.get('ints'),
              [round(x, 4) for x in sh.get('floats', [])], sh.get('vecs'), d.get('hit', {}).get('ints') if isinstance(d.get('hit'), dict) else d.get('hit')))
    elif 'cmn' in l: print(l.rstrip()[:200])

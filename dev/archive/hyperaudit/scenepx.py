"""scenepx.py page_*.out: per monster / rank: the noise control and each aura's in-scene pixel change (> 8, > 3, max delta)
alone under None / GPU-particle, and each option's -- the visibility a viewer sees with the default camera."""
import sys, re, json, glob
for f in sorted(sys.argv[1:] or glob.glob('page_*.out')):
    for l in open(f, encoding='utf8', errors='replace'):
        m = re.match(r'(PASS|FAIL) (em\d+_\d+) (r\d)\s+--\s+(.*)$', l.strip())
        if not m: continue
        R = json.loads(m.group(4))
        au = ' '.join(f"{k}:{a['none']['scenePx'][0]}/{a['node']['scenePx'][0]}(lit{a['none']['lit']})" for k, a in R.get('auras', {}).items())
        op = ' '.join(f"{k}:{v['scenePx'][0]}" for k, v in R.get('opts', {}).items())
        print(m.group(2), m.group(3), 'noise', R.get('noisePx'), '| auras', au, '| opts', op)

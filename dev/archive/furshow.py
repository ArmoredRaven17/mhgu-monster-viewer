import json, re, sys
SP = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'
fn = sys.argv[1] if len(sys.argv) > 1 else SP + r'\furprobe.out'
what = sys.argv[2] if len(sys.argv) > 2 else 'all'
for line in open(fn, encoding='utf-8'):
    m = re.match(r'FAIL (\S+) (.*?)  -- (.*)', line)
    if not m:
        if line.strip(): print(line.rstrip()[:300])
        continue
    mon, label = m.group(1), m.group(2)
    try: d0 = json.loads(m.group(3))
    except Exception: d0 = m.group(3)
    d = d0
    if label == 'CLIPS':
        if what not in ('all', 'clips'): continue
        print('==', mon, 'CLIPS')
        for mat, cl in d.items():
            print(' ', mat)
            for c in cl:
                h = c.get('hash')
                print('    ', c['name'], hex(h & 0xffffffff) if isinstance(h, int) else h, 'fr', c['frames'], 'loop', c['loop'], 'auto', c['auto'])
                for t in c['tracks']:
                    print('        ', t['p'], 'k', t['kind'], 'i', t['interp'], t['keys'][:10])
        continue
    if what == 'clips': continue
    print('==', mon, label)
    if isinstance(d, str): print('  ', d); continue
    print('   state', d.get('state'), 'joint150', d.get('joint150'))
    for k, v in d.get('varying', {}).items():
        print('   VAR', k, 'changes', v['changes'], 'distinct', v['distinct'], 'samp', v['samp'][:24])
    for k, v in d.get('visVar', {}).items():
        if not v.startswith('const'):
            # compress
            parts = v.split('|'); runs = []
            for p in parts:
                if runs and runs[-1][0] == p: runs[-1][1] += 1
                else: runs.append([p, 1])
            print('   VIS', k, runs[:30])
    cv = [k + '=' + v[6:] for k, v in d.get('visVar', {}).items() if v.startswith('const')]
    print('   visconst', ' '.join(cv))

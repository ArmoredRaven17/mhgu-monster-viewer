import json, sys
R = json.load(open(sys.argv[1]))
only = sys.argv[2:]
def show(run, ind=''):
    fr = run['frames']
    print(ind, 'init', run['init'], 'spawn', {k: run['spawn'][k] for k in ('state', 'pos', 'vel', 'ang', 'timer', 'scale')}, 'log', run['log'][:6], 'nfr', len(fr))
    prev = None
    for f in fr:
        key = (f['state'], tuple(round(v, 3) for v in f['vel']), tuple(f['ang']))
        if f['k'] <= 2 or f['log'] and any(e[0] not in ('query',) for e in f['log']) or key != prev and f['k'] % 1 == 0 and (prev is None or key[0] != prev[0]) or f is fr[-1]:
            print(ind, '  k', f['k'], f['state'], [round(v, 2) for v in f['pos']], [round(v, 2) for v in f['vel']], f['ang'], round(f['timer'], 2),
                  round(f['scale'], 3), [e for e in f['log'] if e[0] != 'query'][:5], len(f['created']))
        prev = key
    for ch in run['children']:
        print(ind, ' CHILD at', ch['at'], hex(ch['id'])); show(ch['run'], ind + '    ')
for n, c in R.items():
    if only and n not in only: continue
    print('=====', n, [(hex(s['id']), s['mode']) for s in c['shells']])
    for s in c['shells']:
        if s['run']: show(s['run'])

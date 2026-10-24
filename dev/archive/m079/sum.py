import json, sys
t = open(sys.argv[1]).read(); i = t.index('{'); d = json.loads(t[i:])
for tr in d['trials']:
    print('==', tr['name'], tr['clip'], 'f', tr['atFrame'], 'picks', tr['picks'], 'fail', tr['fail'])
    print('   starts', [(s['key'], s['frame']) for s in tr['starts']], 'tally', tr['tally']['spawned'], tr['tally']['refused'])
    for s in tr['shells']:
        if s['state'] == 1: print('   live', s)
    print('   running', tr['runningShellRecords'], 'shot', (tr['shot'] or '').split('\\')[-1])

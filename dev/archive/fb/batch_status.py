# batch_status.py: for the batch's reachable shell records, which are exported (docs/effects/<mon>.json when=shell),
# recorded (efx/vectors/add_<mon>_shellrec_<x><key>[_near]/draw.json) and on lift-effects.sh's V
import json, os, re
ROOT = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects'
EFX = r'C:\MHGU-Extract\efx'
REACH = {
 'em005_00': 'em005_00c:0 em005_00u:150',
 'em032_00': 'em032_00c:32 em032_00u:0,30',
 'em032_04': 'em032_04u:0,30,70,71,72,73,74,75,76,77,78,79,80,90,100,110,122,123,124,125',
 'em033_00': 'em033_00u:10',
 'em042_00': 'em042_00u:10,20,21,30',
 'em077_00': 'em077_00c:30,32 em077_00u:30,31,32,40,41,42',
 'em044_00': 'em044_00u:10,11,20,21,30',
 'em045_00': 'em045_00u:30,50,200',
 'em045_04': 'em045_04u:30,32,33,34,40,50,60,61,62,80,200,230',
 'em080_00': 'em080_00u:0,1,2,40',
 'em080_04': 'em080_04u:0,1,2,3,40,220,221,225,226,227,230,240',
 'em008_00': 'em008_00c:30,31 em008_00u:0,1,2',
 'em009_00': 'em009_00c:30,31 em009_00u:0,1,2,3,4,10,20',
 'em016_00': 'em016_00u:0,30,50,60,80,90,110',
 'em034_00': 'em034_00u:10,20,30,50',
 'em018_00': 'em018_00u:0,1,2,3',
 'em018_04': 'em018_04u:0,1,2,3,60,61,110',
 'em007_00': 'em007_00c:0,1,2',
}
V = set(re.search(r'^V=(\S+)$', open(os.path.join(EFX, 'lift-effects.sh'), newline='').read(), re.M).group(1).split(','))
for mon, s in REACH.items():
    p = os.path.join(ROOT, mon + '.json')
    d = json.load(open(p, encoding='utf8')) if os.path.exists(p) else {'effects': []}
    shell = {(e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record') and e.get('when') == 'shell'}
    anyrec = {(e['record']['pel'], e['record']['key']) for e in d['effects'] if e.get('record')}
    need_exp, need_rec, need_v = [], [], []
    for part in s.split():
        pel, ks = part.split(':')
        for k in map(int, ks.split(',')):
            if (pel, k) not in shell: need_exp.append('%s:%d%s' % (pel, k, '(other)' if (pel, k) in anyrec else ''))
            for near in ('', '_near'):
                n = 'add_%s_shellrec_%s%d%s' % (mon, pel[-1], k, near)
                if not os.path.exists(os.path.join(EFX, 'vectors', n, 'draw.json')): need_rec.append(n)
                elif 'vectors/' + n not in V: need_v.append(n)
    print(mon, 'export:', ' '.join(need_exp) or '-', '| unrecorded:', len(need_rec), '| recorded-not-on-V:', len(need_v))

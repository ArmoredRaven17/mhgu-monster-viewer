# every shell folder of a monster's arc: the .shl's ShellInfoList by mode, each resource's contents (gapQ, 2026-10-25)
import sys, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, 'C:/MHGU-Extract/efx'); sys.path.insert(0, os.path.join(HERE, '..', 'gapO'))
import shellef, shlinfo
BS = chr(92)
def dump(mon):
    T = shellef.load_typed(BS.join(['C:', 'MHGU-Extract', 'scratch-em', mon, mon + '.arc']))
    out = {}
    for (nm, th) in sorted(T):
        if th != '4aa69872' or 'shell' not in nm: continue
        info = shlinfo.shell_info(T, nm)
        cm = T.get((nm, '496f8f22'))
        modes = []
        for k, e in enumerate(info):
            row = {'scale': e['scale']}
            for p in ('sh', 'hit', 'snd'):
                row[p] = (e[p][1].split(BS)[-1], shellef.fup(T[(e[p][1], '496f8f22')])) if e[p] else None
            if e['ef']:
                ef = shellef.parse_ef(T[(e['ef'][1], '1eb12c38')])
                row['ef'] = (e['ef'][1].split(BS)[-1], [(pp['auto'], pp['arr']) for pp in ef['params']])
            else: row['ef'] = None
            modes.append(row)
        out[nm] = {'cmn': shellef.fup(cm) if cm else None, 'modes': modes}
    return out
if __name__ == '__main__':
    for mon in sys.argv[1:]:
        D = dump(mon)
        for nm, d in D.items():
            print('==', mon, nm, 'modes', len(d['modes']), 'cmn', d['cmn'])
            for k, row in enumerate(d['modes']):
                print('  mode %d' % k, json.dumps(row))

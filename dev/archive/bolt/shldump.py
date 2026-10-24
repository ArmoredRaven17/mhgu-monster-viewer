import sys, json, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\rathian-shell-scratch')
import shellef, shlparse
SEP = chr(92)
arc = r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em081_04.arc'
T = shellef.load_typed(arc)
folders = sorted({k[0].rsplit(SEP, 1)[0] for k in T if 'shell' in k[0]})
out = {}
for fo in folders:
    shl = [k for k in T if k[0].startswith(fo + SEP) and k[1] == '4aa69872']
    print('=== folder', fo, 'shl', [k[0].split(SEP)[-1] for k in shl])
    for k in shl:
        b = T[k]
        runs = [m.group().decode() for m in re.finditer(rb'[ -~]{4,}', b)]
        print('  strings with pel/effect:', [s for s in runs if 'pel' in s or 'effect' in s.lower()][:10])
        try:
            count, ents, p = shlparse.parse(b)
        except Exception as e:
            print('  parse err', e); ents = []
        cm = T.get((k[0], '496f8f22'))
        if cm: print('  cmn', shellef.fup(cm))
        for e in ents:
            m = e['index']
            efk = (k[0] + '_ef%03d' % m, '1eb12c38')
            shk = (k[0] + '_sh%03d' % m, '496f8f22')
            hk = [kk for kk in T if kk[0] == k[0] + '_hit%03d' % m]
            ef = None
            if efk in T:
                ef = [[pp[0], pp[1] if pp[1] < 0x80000000 else -1] for prm in shellef.parse_ef(T[efk])['params'] for pp in prm['arr']]
            sh = shellef.fup(T[shk]) if shk in T else None
            hit = shellef.fup(T[hk[0]]) if hk and hk[0][1] == '496f8f22' else (hk[0][1] if hk else None)
            if ef or sh or e['ef'] or e['sh']:
                print('  [%2d] scale %s ef %s(%s) sh %s(%s) hit %s' % (m, e['scale'], ef, e['ef'], sh, e['sh'], hit))
    others = sorted({(k[0].split(SEP)[-1], k[1]) for k in T if k[0].startswith(fo + SEP)})
    print('  files:', len(others), sorted({x[1] for x in others}))
    print('  nonmode:', [x for x in others if not re.search(r'_(ef|sh|hit|snd)\d{3}$', x[0])])

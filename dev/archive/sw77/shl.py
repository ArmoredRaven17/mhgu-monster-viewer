import sys, struct, re, json
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\rathian-shell-scratch')
import shellef, shlparse
_OLD = "j = b.index(b'" + chr(92) + "x01" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x80" + chr(92) + "x3f')"
_NEW = "o = b.index(b'ShellParam') + 11; j = o + re.search(rb'" + chr(92) + "x01" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00...." + chr(92) + "x01" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x02[rn]', b[o:], re.S).start()"
_src0 = open(shlparse.__file__).read(); _src = _src0.replace(_OLD, _NEW)
assert _src != _src0
_ns = {'re': re, '__name__': 'shlparse2'}; exec(compile(_src, 'shlparse2', 'exec'), _ns); shlparse.parse = _ns['parse']
SEP = chr(92)
B = re.escape(SEP.encode())
for mon in ['em077_00']:
    p = r'C:\MHGU-Extract\scratch-em\%s\%s.arc' % (mon, mon)
    F = shellef.load_typed(p)
    pat = re.compile(rb'effect' + B + rb'pel' + B + rb'em' + B + rb'([a-z0-9_]+)')
    spat = re.compile(rb'shell' + B + rb'em' + B + rb'[A-Za-z0-9_' + B + rb']+')
    for (nm, th), b in sorted(F.items()):
        if th != '4aa69872': continue
        lists = [m.group(1).decode() for m in pat.finditer(b)]
        count, ents, _ = shlparse.parse(b)
        print('==', mon, nm, 'count', count, 'lists', lists)
        strs = [s.decode() for s in spat.findall(b)]
        for s in strs:
            if not re.search(r'_(sh|ef|hit|snd)\d{3}$', s) and not s.endswith(('hitdata', 'hitsize')):
                print('   cmn path', s, shellef.fup(F[(s, '496f8f22')]) if (s, '496f8f22') in F else 'NOT IN ARC')
        print('   other strs', [s for s in strs if s.endswith(('hitdata', 'hitsize'))])
        folder = nm.rsplit(SEP, 1)[0]
        for e in ents:
            if not any(e[x] for x in ('ef', 'snd', 'hit', 'sh')): continue
            row = {'scale': e['scale']}
            for k in ('sh', 'hit', 'snd'):
                if e[k]:
                    key = (folder + SEP + e[k], '496f8f22')
                    row[k] = shellef.fup(F[key]) if key in F else 'MISSING ' + e[k]
            if e['ef']:
                key = (folder + SEP + e['ef'], '1eb12c38')
                row['ef'] = shellef.parse_ef(F[key])['params'] if key in F else 'MISSING'
            print('  mode', e['index'], json.dumps(row))

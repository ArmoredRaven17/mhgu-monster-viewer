# shlmap.py: each .shl's mode -> its sh / hit / ef files (the paths its entries name), parsed as shl.py does
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\rathian-shell-scratch')
import shellef, shlparse
_OLD = "j = b.index(b'" + chr(92) + "x01" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x80" + chr(92) + "x3f')"
_NEW = "o = b.index(b'ShellParam') + 11; j = o + re.search(rb'" + chr(92) + "x01" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00...." + chr(92) + "x01" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x00" + chr(92) + "x02[rn]', b[o:], re.S).start()"
_src0 = open(shlparse.__file__).read(); _src = _src0.replace(_OLD, _NEW)
assert _src != _src0
_ns = {'re': re, '__name__': 'shlparse2'}; exec(compile(_src, 'shlparse2', 'exec'), _ns)
SEP = chr(92)

def modes(FT):
    """FT: shellef.load_typed(arc). Returns {(folder number '00' / '00_02', mode index): {'sh', 'hit', 'ef'}}."""
    out = {}
    for (nm, th), b in sorted(FT.items()):
        if th != '4aa69872': continue
        m = re.search(r'(em\d{3}_\d{2})_(\d{2}(?:_\d{2})?)$', nm.split(SEP)[-1])
        if not m: continue
        try: count, ents, _ = _ns['parse'](b)
        except Exception: continue
        folder = nm.rsplit(SEP, 1)[0]
        for e in ents:
            row = {}
            for k in ('sh', 'hit'):
                if e.get(k):
                    key = (folder + SEP + e[k], '496f8f22')
                    if key in FT and FT[key][:4] == b'FUP' + bytes(1): row[k] = shellef.fup(FT[key])
            if e.get('ef'):
                key = (folder + SEP + e['ef'], '1eb12c38')
                if key in FT: row['ef'] = [tuple(x) for x in shellef.parse_ef(FT[key])['params'][0]['arr']]
            if row: out[(m.group(2), e['index'])] = row
    return out

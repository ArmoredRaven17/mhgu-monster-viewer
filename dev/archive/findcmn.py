import sys, os, glob
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import shellef
SEP = chr(92)
hits = []
arcs = ['C:/MHGU-Extract/scratch-em/em005_00/em005_00.arc'] + sorted(glob.glob('C:/MHGU-Extract/scratch-em/*/*.arc'))
for arc in arcs:
    try: F = shellef.load(arc)
    except Exception: continue
    for nm, (th, b) in F.items():
        low = nm.lower()
        base = nm.split(SEP)[-1]
        if th == '496f8f22' and base in ('em004_00_02', 'em005_00_02'):
            hits.append((arc, th, nm, len(b), b[:64].hex()))
        if th == '496f8f22' and 'shell' in low and base.count('_') == 2 and base.startswith('em00'):
            hits.append((arc, th, nm, len(b), 'cmn-like'))
for h in hits[:40]: print(h)
print(len(hits), 'hits over', len(arcs), 'arcs')

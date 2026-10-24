import sys, glob, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
sys.path.insert(0, 'C:/MHGU-Extract/efx/agents/rathian-shell-scratch')
import shellef, shlparse
SEP = chr(92)
for arc in sorted(glob.glob(r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em*.arc')):
    mon = os.path.basename(arc)[:-4]
    T = shellef.load_typed(arc)
    base = 'shell' + SEP + 'em' + SEP + mon + '_shell02' + SEP + mon + '_02'
    if (base, '4aa69872') not in T: continue
    count, rows, _ = shlparse.parse(T[(base, '4aa69872')])
    sc = {r['index']: r['scale'][0] for r in rows}
    odd = {k: v for k, v in sc.items() if abs(v - 1.0) > 1e-6}
    print(mon, 'modes', sorted(sc), 'non-1 scales', odd)

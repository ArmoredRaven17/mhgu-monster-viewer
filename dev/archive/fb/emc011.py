import sys, glob
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\barioth-scratch')
import emc
mon = sys.argv[1]
p = glob.glob(r'C:\MHGU-Extract\scratch-em\%s\enemy\cmd_tbl\*_cmdtbl.emc' % mon)
ver, groups = emc.load(p[0]); acts = {}
for gi, st in enumerate(groups):
    for si, s in enumerate(st):
        for o in emc.parse(s):
            b = o.split()
            if b[0] == '00' and len(b) >= 3:
                k = '%d:0x%02x' % (int(b[1], 16), int(b[2], 16)); acts.setdefault(k, set()).add((gi, si))
want = sys.argv[2].split(',') if len(sys.argv) > 2 else None
print(p[0], 'status-2:', sorted(k for k in acts if k.startswith('2:')))
if want: print({k: sorted(acts.get(k, []))[:6] for k in want})

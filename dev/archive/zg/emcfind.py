# emcfind.py <file.emc> <status> <number>[,<number>...]  -- every parsed op 00 issuing (status, n), by group / stream
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\barioth-scratch')
import emc
ver, groups = emc.load(sys.argv[1])
st = int(sys.argv[2], 0); ns = [int(x, 0) for x in sys.argv[3].split(',')]
for g, ss in enumerate(groups):
    for k, s in enumerate(ss):
        ops = emc.parse(s)
        for j, o in enumerate(ops):
            b = o.split()
            if b[0] == '00' and len(b) >= 3 and int(b[1], 16) == st and int(b[2], 16) in ns:
                print('g%d s%d op#%d: %s   ctx: %s' % (g, k, j, o, ' | '.join(ops[max(0, j-3):j+2])))

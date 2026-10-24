# emcsel.py: em088_00 EMC streams -- every op 0xa3 (b1, b2) with the ops around it (the parse is barioth-scratch/emc.py's)
import sys, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\barioth-scratch')
import emc
ver, groups = emc.load(r'C:\MHGU-Extract\scratch-em\em088_00\enemy\cmd_tbl\em088_00_cmdtbl.emc')
for g, st in enumerate(groups):
    for k, s in enumerate(st):
        ops = emc.parse(s)
        if any(o.startswith('a3 ') for o in ops):
            print('g%d s%d: %s' % (g, k, ' | '.join(ops)))

import sys, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import add_effects as A
import effects_triage as T
from dp_loader import dp
import glob, os
mon = sys.argv[1] if len(sys.argv) > 1 else 'em081_00'
cfg = T.MONSTERS.get(mon) or T.generic(mon)
globs = cfg['psl'] if isinstance(cfg['psl'], list) else [cfg['psl']]
paths = sorted({q for g in globs for q in glob.glob(os.path.join(A.ROOT, g))})
bybit = collections.defaultdict(list)
for p in paths:
    lst = os.path.basename(p)[:-4].split('_')[-1]
    for blk in sorted(dp.decode_psl(open(p, 'rb').read())['sched'], key=lambda b: b['slot']):
        fm = sum(1 << b for b, *_ in blk['bits'])
        for b in range(32):
            if blk['p1'][b] not in A.BANK: continue
            on = [(f0, f1) for (f0, f1, v) in blk['events'] if (v >> b) & 1]
            if not on: continue
            bybit[b].append('L%s M%d %s%d%s' % (lst, blk['slot'], A.BANK[blk['p1'][b]], blk['ids'][b], '' if (fm >> b) & 1 else '*'))
for b in sorted(bybit):
    print('bit %2d (%d): %s' % (b, len(bybit[b]), ' '.join(bybit[b])))

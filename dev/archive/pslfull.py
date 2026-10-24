"""Every NAMED PSL bit of a monster (p1 3 = c.pel, 4 = u.pel) whose events switch it on, marked in / out of the block's
file mask -- the whole-block view add_effects.py uses for PSL_MASK_MONSTERS, run here for a monster NOT in that list."""
import sys, os, glob, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import add_effects as A
import effects_triage as T
from dp_loader import dp
mon = sys.argv[1]
cfg = T.MONSTERS.get(mon) or T.generic(mon)
globs = cfg['psl'] if isinstance(cfg['psl'], list) else [cfg['psl']]
paths = sorted({q for g in globs for q in glob.glob(os.path.join(A.ROOT, g))})
seqkeys = collections.defaultdict(list)
for p in paths:
    lst = os.path.basename(p)[:-4].split('_')[-1]
    for blk in sorted(dp.decode_psl(open(p, 'rb').read())['sched'], key=lambda b: b['slot']):
        inmask = {b for b, _, _, _ in blk['bits']}
        for b in range(32):
            if blk['p1'][b] not in (3, 4): continue
            on = []
            for (f0, f1, v) in blk['events']:
                if (v >> b) & 1:
                    if on and f0 == on[-1][1]: on[-1][1] = f1 + 1
                    else: on.append([f0, f1 + 1])
            if not on: continue
            pel = 'c' if blk['p1'][b] == 3 else 'u'
            tag = 'IN ' if b in inmask else 'OUT'
            print('%s L%s M%d bit %2d %s %4d on %s  [%s]' % (tag, lst, blk['slot'], b, pel, blk['ids'][b], on, os.path.basename(p)))

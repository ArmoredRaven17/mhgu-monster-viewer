import sys, os, glob
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import add_effects as A
import effects_triage as T
from dp_loader import dp
real = A.psl_mask_monsters
A.psl_mask_monsters = lambda: real() | {'em007_04'}
cfg, entry, rows, records = A.plan('em007_04')
for (lst, slot, frames, bit, pel, eff, r, on, clip_state, state, types) in rows:
    if lst != 9: continue
    print('L9 M%-2d %3df b%-2d %s %4s %-14s %-10s %s | %s | %s' % (slot, frames, bit, pel, eff, r['efl'] if r else '-', r['array'] if r else '-', on, clip_state, state))
print()
p = os.path.join(A.ROOT, 'scratch-em')  # unused
paths=[q for g in (cfg['psl'] if isinstance(cfg['psl'],list) else [cfg['psl']]) for q in glob.glob(os.path.join(A.ROOT,g))]
for p in paths:
    if not p.endswith('_9.psl'): continue
    print(p)
    for blk in sorted(dp.decode_psl(open(p,'rb').read())['sched'], key=lambda b:b['slot']):
        fm = sum(1<<b for b,_,_,_ in blk['bits'])
        named=[(b,blk['p1'][b],blk['p2'][b],blk['ids'][b]) for b in range(32) if blk['p1'][b]]
        print('slot %d frames %d filemask %#x named %s' % (blk['slot'], blk['frames'], fm, named))

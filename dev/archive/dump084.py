import sys, os, glob
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import add_effects as A
cfg = A.T.MONSTERS.get('em084_00') or A.T.generic('em084_00')
print('psl cfg', cfg['psl'])
globs = cfg['psl'] if isinstance(cfg['psl'], list) else [cfg['psl']]
paths = sorted({q for g in globs for q in glob.glob(os.path.join(A.ROOT, g))})
for p in paths:
    d = A.dp.decode_psl(open(p, 'rb').read())
    print('==', os.path.basename(p))
    for blk in sorted(d['sched'], key=lambda b: b['slot']):
        fm = blk.get('mask')
        named = [(b, blk['ids'][b], blk['p1'][b]) for b in range(32) if blk['p1'][b] in A.BANK]
        if not named: continue
        filebits = set(x[0] for x in blk['bits'])
        s = []
        for b, eff, p1 in named:
            on = []
            for (f0, f1, v) in blk['events']:
                if (v >> b) & 1:
                    if on and f0 == on[-1][1]: on[-1][1] = f1 + 1
                    else: on.append([f0, f1 + 1])
            s.append('%s%d:%s%d%s' % ('' if b in filebits else '*', b, A.BANK[p1], eff, ('' if on else '(noev)') if len(on)<4 else ''))
            if on and len(on) < 4: s[-1] += str(on)
            elif on: s[-1] += '[%d runs from %d]' % (len(on), on[0][0])
        print(' slot', blk['slot'], 'fr', blk['frames'], 'mask', hex(fm) if fm is not None else '?', ' '.join(s))

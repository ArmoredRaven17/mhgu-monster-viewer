# positive control: the lowest-reach floor (viewer rule, size 1) vs the unit (clip origin) on another monster's shell clips
import sys
SRC = open(__file__.replace('ctl.py', 'jpos.py')).read().split('if __name__')[0]
mon = sys.argv[1]
for spec in sys.argv[2:]:
    L, clip = spec.split('|')
    sys.argv = ['x', mon, L, clip]; g = {}
    try: exec(SRC, g)
    except Exception as e: print(spec, 'ERR', e); continue
    n = 24 if g['dur'] > 0.001 else 1
    mn = min(min(v[1] for v in g['pose'](i / n * g['dur'])[0].values()) for i in range(n))
    print('%s %s lowest bone %.1f -> lowest-reach floor %.1f (unit 0; differs by %.1f)' % (mon, spec, mn, min(0, mn - 12), -min(0, mn - 12)))

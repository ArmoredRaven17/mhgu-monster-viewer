import os, sys
src = open('jscheckpd.py', encoding='utf8').read()
sys.argv = ['jscheckpd.py', sys.argv[1], sys.argv[2], '0', '0']
os.environ.setdefault('MOGURI', '-1000')
exec(src[:src.index('ACT = [')])
from wordsweep import motions
for m in motions(sys.argv[2]):
    for a in [None] + [(s, n) for s in (0,1,2,4,6,7,10,12,13) for n in range(256)]:
        try: rom(m, a, 0, 0.0, 0, 0, 5)
        except Exception as ex:
            print('%#x' % m, a, ex, 'pc %#x' % mu.reg_read(UC_ARM_REG_PC)); raise SystemExit
print('no crash')

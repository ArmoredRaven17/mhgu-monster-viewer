import os, sys
src = open('jscheckpd.py', encoding='utf8').read()
sys.argv = ['jscheckpd.py', '17d92c4', 'em063_00', '0', '0']
os.environ.update(EM='63', VAR='0', AXIS='arms')
exec(src[:src.index('ACT = [')])
for cg in range(16):
    print(cg & 3, cg >> 2, hex(rom(0x208, (7, 0), 0, 0.0, 0, 0, 5, cg, 0)))

import sys, os, io, contextlib, glob
sys.path.insert(0, r'C:\MHGU-Extract\efx')
from efx_load import LoadedEffect
D = r'C:\MHGU-Extract\scratch-effects-em\effect'
names = sys.argv[1:]
for n in names:
    p = glob.glob(os.path.join(D, '*', '*', n + '.efl')) + glob.glob(os.path.join(D, '*', n + '.efl'))
    if not p: print(n, 'MISSING'); continue
    try:
        with contextlib.redirect_stdout(io.StringIO()):
            x = LoadedEffect(p[0])
        mods = [nm for dti, nm, h in x.loaded if dti == hex(0x211e1c8)]
        print(n, 'models:', mods)
    except Exception as ex:
        print(n, 'ERR', ex)

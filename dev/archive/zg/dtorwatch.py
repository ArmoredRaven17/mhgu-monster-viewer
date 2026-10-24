# vecdrawsched.py with every harness unit destructor logged (unit, frame) -- the u60-stop hang
import sys, os, runpy
sys.path[:0] = [r'C:\MHGU-Extract\efx', r'C:\MHGU-Extract\build\arm', r'C:\MHGU-Extract']
os.chdir(r'C:\MHGU-Extract\efx')
import proofunit
orig = proofunit._vcall
F = {'n': 0}
def vc(x, obj, slot, args, label):
    if label.endswith('dtor'):
        print('DTOR %#x after %d unit frames, vtable %#x' % (obj, F['n'], x.e.u32(obj)), file=sys.stderr)
    return orig(x, obj, slot, args, label)
proofunit._vcall = vc
ouf = proofunit.unit_frame
def uf(x, between=None):
    F['n'] += 1
    return ouf(x, between)
proofunit.unit_frame = uf
sys.argv = ['vecdrawsched.py'] + sys.argv[1:]
runpy.run_path('vecdrawsched.py', run_name='__main__')

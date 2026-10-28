# run notice-scratch probe.py on uEm082_00 (10, n) over directions 0..7, variants 0 / 4; control (10, 0x20) and (10, 0x14)
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
sys.argv = ['probe']
import probe
for var in (0, 4):
    for n, part in ((0xaf, 0), (0x14, 1), (0x20, 0)):
        for d in range(8):
            r = probe.probe('uEm082_00', 10, n, 0x52, var, 0, part, d)
            print('v%d (10, %#x) part %d dir %d: %s' % (var, n, part, d, r['hit']))

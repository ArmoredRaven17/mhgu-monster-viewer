import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import probe as P
print([k for k in P.CLS if '44' in k or '45' in k or '07' in k][:10])
for cls, em, var in (('uEm007_00', 7, 4), ('uEm044_00', 0x2c, 0), ('uEm045_00', 0x2d, 0), ('uEm045_00', 0x2d, 4)):
    for part in range(8):
        r = P.probe(cls, 10, 0x72, em, var, part=part)
        print(cls, hex(em), var, 'part', part, r['hit'])

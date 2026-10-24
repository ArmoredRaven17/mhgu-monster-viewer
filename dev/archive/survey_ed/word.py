import struct, json
D = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); BASE = 0x1728000
w = lambda va: struct.unpack_from('<I', D, va - BASE)[0]
cls = {c['class']: c for c in json.load(open(r'C:\MHGU-Extract\efx\class-effects.json'))['classes']}
# controls from rom-map: uEm004_00 0xd2e0ec, uEm007_00 0xd4532c, uEm084_00 0x106cae8 (rom-map 1037/1042)
for k in ['uEm004_00', 'uEm007_00', 'uEm084_00', 'uEm011_00', 'uEm012_00', 'uEm013_00', 'uEm024_00', 'uEm025_00', 'uEm027_00', 'uEm050_00', 'uEm058_00', 'uEm071_00', 'uEm086_00']:
    vt = int(cls[k]['vtable'], 16)
    print('%s vt 0x%x +0x13c 0x%x  (vt+4: +0x13c 0x%x)  +0x14 getDTI 0x%x  code 0x%s..%s' % (k, vt, w(vt + 0x13c), w(vt + 4 + 0x13c), w(vt + 0x14), cls[k]['code_lo'][2:], cls[k]['code_hi'][2:]))

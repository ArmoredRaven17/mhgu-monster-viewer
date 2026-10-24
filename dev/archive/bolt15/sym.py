import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
R = armdis.RODATA
def finds(s):
    out=[]; i=R.find(b'\0'+s+b'\0')
    while i>=0: out.append(i+1); i=R.find(b'\0'+s+b'\0', i+1)
    return out
ps, pa = finds(b'sinf'), finds(b'atan2f')
print(ps, pa)
for p1 in ps:
  for p2 in pa:
    d = p1 - p2
    for B in range(0, len(R) - 0x500, 4):
        n20 = struct.unpack_from('<I', R, B + 0x14*16)[0]; n10 = struct.unpack_from('<I', R, B + 0xa*16)[0]
        if n20 - n10 == d and 0 < n10 < 0x100000:
            S = p2 - n10
            n4d = struct.unpack_from('<I', R, B + 0x4d*16)[0]
            e = R.find(b'\0', S + n4d)
            print('dynsym', hex(B + armdis.RO_VA), 'dynstr', hex(S + armdis.RO_VA), 'sym4d', R[S+n4d:e])
            break

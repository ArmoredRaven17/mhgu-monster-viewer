import sys, struct
sys.path.insert(0, r'C:/MHGU-Extract/efx')
import armdis
T = armdis.TEXT
# movw rX, #0xcac0 : cond 1110 0011 0000 imm4=0xc Rd imm12=0xac0  -> 0xe30c?ac0
hits = []
for off in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, off)[0]
    if (w & 0xfff00fff) == 0xe3000ac0 and ((w >> 16) & 0xf) == 0xc:
        hits.append(off)
print(len(hits))
lo = [h for h in hits if not (0xfa8000 <= h < 0xfc0b00)]
print(len(lo), [hex(h) for h in lo[:60]])

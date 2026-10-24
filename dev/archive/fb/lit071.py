import sys, struct
sys.path.insert(0, r'C:/MHGU-Extract/efx')
import armdis
T = armdis.TEXT
def s(addr):
    b = T[addr:addr+64]; return b.split(b'\0')[0]
for ldr, add, off in [(0xfad854,0xfad85c,0x488),(0xfad864,0xfad868,0x47c),(0xfad870,0xfad874,0x474),(0xfad87c,0xfad880,0x46c),(0xfad888,0xfad88c,0x464),(0xfad890,0xfad894,0x460),(0xfad898,0xfad89c,0x45c)]:
    v = struct.unpack('<i', T[ldr+8+off:ldr+12+off])[0]
    a = (add + 8 + v) & 0xffffffff
    try: print(hex(ldr), hex(a), s(a))
    except Exception as e: print(hex(ldr), hex(a), e)

# va.py: read words / floats at any VA of main (text, rodata, data)
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
def rd(a, n=4):
    for base, buf in ((0, armdis.TEXT), (armdis.RO_VA, armdis.RODATA), (armdis.DA_VA, armdis.DATA)):
        if base <= a < base + len(buf): return buf[a - base:a - base + n]
    return None
def w(a): b = rd(a); return struct.unpack('<I', b)[0] if b else None
def fl(a): b = rd(a); return struct.unpack('<f', b)[0] if b else None
def pcrel(ldr_at, add_at):
    ins = w(ldr_at); lit = w(ldr_at + 8 + (ins & 0xfff)); return (add_at + 8 + lit) & 0xffffffff
if __name__ == '__main__':
    for a in sys.argv[1:]:
        a = int(a, 16); print(hex(a), hex(w(a)), fl(a))

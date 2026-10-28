# rd60.py <lo> <hi>: every load from [rX, #0x60 / #0x64 / #0x68] (ldr / vldr / ldm) in [lo, hi), with its function start
import struct, sys, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
def fstart(a):
    while a > 0:
        w = struct.unpack_from('<I', T, a)[0]
        if (w & 0xffff4000) == 0xe92d4000: return a
        a -= 4
    return 0
for a in range(lo, hi, 4):
    l = list(md.disasm(T[a:a + 4], a))
    if not l: continue
    i = l[0]
    if (i.mnemonic.startswith('ldr') or i.mnemonic.startswith('vldr')) and any(x in i.op_str for x in ('#0x60]', '#0x64]', '#0x68]')) and 'sp,' not in i.op_str and 'pc,' not in i.op_str:
        print('%x fn %x  %s %s' % (a, fstart(a), i.mnemonic, i.op_str))

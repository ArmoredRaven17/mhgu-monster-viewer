# group / stream selections: every movw #0x72fc / #0x72fd site, with the mov-immediates in the 24 instructions after it
import struct, sys, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
n = len(T) // 4
for i in range(n):
    w = struct.unpack_from('<I', T, 4 * i)[0]
    if (w & 0x0FF00000) == 0x03000000 and (((w >> 4) & 0xF000) | (w & 0xFFF)) in (0x72fc, 0x72fd):
        a = 4 * i
        ins = list(md.disasm(T[a - 48:a + 120], a - 48))
        imms = ['%s' % x.op_str for x in ins if x.mnemonic in ('mov', 'movw') and '#' in x.op_str and not x.op_str.endswith(('#0x72fc', '#0x72fd', '#0x72f4', '#0x72f8'))]
        sts = ['%s %s' % (x.mnemonic, x.op_str) for x in ins if x.address > a and x.mnemonic in ('strb', 'strh')]
        print('%08x' % a, ((w >> 4) & 0xF000) | (w & 0xFFF) == 0x72fd and 'S' or 'G', ' ; '.join(imms)[:200], ' || ', ' ; '.join(sts)[:160])

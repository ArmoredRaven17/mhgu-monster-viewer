# every movw rd, #ID in main.text whose rd is stored to [rX, #4] within 8 instructions (a shell request's id), and the mode stored to [rX, #8]
import struct, sys, capstone
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
ID = int(sys.argv[1], 0)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
n = len(T) // 4
for i in range(n):
    w = struct.unpack_from('<I', T, 4 * i)[0]
    if (w & 0x0FF00000) == 0x03000000 and (((w >> 4) & 0xF000) | (w & 0xFFF)) == ID and (w >> 28) == 0xE:
        a = 4 * i; rd = (w >> 12) & 15
        ins = list(md.disasm(T[a - 40:a + 48], a - 40))
        s4 = [x for x in ins if x.address > a and x.mnemonic == 'str' and x.op_str.startswith('%s, [' % ins[0].reg_name(capstone.arm.ARM_REG_R0 + rd) if False else 'r%d, [' % rd if rd < 10 else '') and x.op_str.endswith('#4]')]
        s8 = [x for x in ins if x.mnemonic == 'str' and x.op_str.endswith('#8]')]
        movs = [x for x in ins if x.mnemonic.startswith('mov') and '#' in x.op_str]
        print('%08x r%d' % (a, rd), 'id-store' if s4 else '-', ' | '.join('%x %s %s' % (x.address, x.mnemonic, x.op_str) for x in s8),
              ' || ', ' '.join('%s' % x.op_str for x in movs if x.address >= a - 12 and x.address <= a + 24))

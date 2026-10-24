import sys, struct, capstone
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def dis(lo, hi):
    a = lo
    while a < hi:
        got = False
        for ins in md.disasm(TEXT[a:hi], a):
            note = ''
            if 'pc, #' in ins.op_str and ins.mnemonic.startswith('ldr') or ins.mnemonic.startswith('vldr') and 'pc' in ins.op_str:
                try:
                    off = int(ins.op_str.split('#')[-1].rstrip(']'), 0)
                    lit = ins.address + 8 + off
                    note = '   ; [0x%x] = 0x%08x' % (lit, struct.unpack('<I', TEXT[lit:lit+4])[0])
                except Exception:
                    pass
            print('%08x  %08x  %-8s %s%s' % (ins.address, struct.unpack('<I', TEXT[ins.address:ins.address+4])[0], ins.mnemonic, ins.op_str, note))
            a = ins.address + 4
            got = True
        if a < hi:
            print('%08x  %08x  .word' % (a, struct.unpack('<I', TEXT[a:a+4])[0]))
            a += 4
if __name__ == '__main__':
    dis(int(sys.argv[1], 0), int(sys.argv[2], 0))

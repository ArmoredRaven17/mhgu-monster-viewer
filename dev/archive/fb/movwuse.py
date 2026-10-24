# movwuse.py <imm16 hex> [...]: every `movw rX, #imm` in main.text and the next instruction (within 6) that uses rX as a
# register offset ([rB, rX] / [rB, rX]!), printed as load / store so the writers and readers of a struct offset are listed
import sys, struct, capstone
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
for a in sys.argv[1:]:
    imm = int(a, 16)
    want = 0xE3000000 | ((imm >> 12) << 16) | (imm & 0xfff)
    n = 0
    for off in range(0, len(TEXT) - 4, 4):
        w = struct.unpack_from('<I', TEXT, off)[0]
        if (w & 0xFFFF0FFF) != want: continue
        rd = (w >> 12) & 0xf
        rn = md.reg_name(capstone.arm.ARM_REG_R0 + rd) if rd < 13 else None
        names = {0: 'r0', 1: 'r1', 2: 'r2', 3: 'r3', 4: 'r4', 5: 'r5', 6: 'r6', 7: 'r7', 8: 'r8', 9: 'sb', 10: 'sl', 11: 'fp', 12: 'ip'}
        r = names.get(rd)
        hit = None
        for i in md.disasm(TEXT[off + 4: off + 4 + 24], off + 4):
            if r and (', ' + r + ']') in i.op_str and i.mnemonic.startswith(('ldr', 'str')):
                hit = '%08x %s %s' % (i.address, i.mnemonic, i.op_str); break
            if r and i.op_str.startswith(r + ',') and not i.mnemonic.startswith(('str', 'cmp', 'tst')): break
        print('%s %08x -> %s' % (a, off, hit or '(other use)'))
        n += 1
    print(a, n, 'movw sites')

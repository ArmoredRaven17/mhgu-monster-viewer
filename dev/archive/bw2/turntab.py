import capstone, struct, sys, re
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
RO = open(r'C:\MHGU-ROM\exefs\main.rodata', 'rb').read(); ROV = 0x13EF000
D = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DV = 0x1728000
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
def rd(a, n):
    if a < len(T): return T[a:a+n]
    if ROV <= a < ROV + len(RO): return RO[a-ROV:a-ROV+n]
    return D[a-DV:a-DV+n]
for s in sys.argv[1:]:
    site = int(s, 16)
    ins = list(md.disasm(T[site-0x40:site+4], site-0x40))
    r0 = None; r1 = None
    for i in ins:
        m = re.match(r'r0, \[pc, #(0x[0-9a-f]+|\d+)\]', i.op_str)
        if i.mnemonic == 'ldr' and m: r0 = struct.unpack('<I', rd(i.address + 8 + int(m.group(1), 0), 4))[0]
        if i.mnemonic == 'add' and i.op_str == 'r1, pc, r0' and r0 is not None: r1 = (i.address + 8 + r0) & 0xffffffff
    if r1 is None: print(s, 'unresolved'); continue
    b = rd(r1, 0x40)
    print('%s table %#x: %s' % (s, r1, ' '.join('%04x' % x for x in struct.unpack('<32H', b))))

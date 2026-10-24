import os, struct, sys
import capstone
EX = r'C:\MHGU-ROM\exefs'
T = open(os.path.join(EX, 'main.text'), 'rb').read()
RO = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)

def rd(va, n=4):
    if 0 <= va < len(T): return T[va:va+n]
    if RO_VA <= va < RO_VA+len(RO): return RO[va-RO_VA:va-RO_VA+n]
    if DA_VA <= va < DA_VA+len(DA): return DA[va-DA_VA:va-DA_VA+n]
    return b''
def u32(va):
    b = rd(va); return struct.unpack('<I', b)[0] if len(b) == 4 else None
def s16(va):
    b = rd(va, 2); return struct.unpack('<h', b)[0] if len(b) == 2 else None

def dis(lo, hi, title):
    print('==', title, hex(lo), hex(hi))
    for i in md.disasm(T[lo:hi], lo):
        print('  %x: %s %s' % (i.address, i.mnemonic, i.op_str))

if __name__ == '__main__':
    what = sys.argv[1]
    if what == 'dis':
        dis(int(sys.argv[2], 0), int(sys.argv[3], 0), sys.argv[4] if len(sys.argv) > 4 else '')
    elif what == 'words':
        a = int(sys.argv[2], 0); n = int(sys.argv[3], 0)
        print([hex(u32(a + 4*i)) for i in range(n)])
    elif what == 'u16s':
        a = int(sys.argv[2], 0); n = int(sys.argv[3], 0)
        print([s16(a + 2*i) for i in range(n)])

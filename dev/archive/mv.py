import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT
imm = int(sys.argv[1], 16)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
hits = []
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0FF00000) == 0x03000000 and (((w >> 16) & 0xf) << 12 | (w & 0xfff)) == imm:
        rd = (w >> 12) & 0xf
        seq = list(md.disasm(T[a:a+24], a))
        stores = [i for i in seq[1:] if i.mnemonic.startswith(('str', 'vstr')) and ('r%d' % rd) in i.op_str.split('[')[1] if '[' in i.op_str]
        tag = 'STORE' if stores else ''
        hits.append(a)
        print('%08x r%d %s | %s' % (a, rd, tag, ' ; '.join('%s %s' % (i.mnemonic, i.op_str) for i in seq[1:5])))
print(len(hits))

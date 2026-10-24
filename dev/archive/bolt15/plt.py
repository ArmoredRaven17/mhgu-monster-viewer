import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T, R, D = armdis.TEXT, armdis.RODATA, armdis.DATA
def got_of(plt):
    # add ip, pc, #a ; add ip, ip, #b ; ldr pc, [ip, #c]!
    import capstone
    md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
    ins = list(md.disasm(T[plt:plt+12], plt))
    w = [struct.unpack_from('<I', T, plt + 4*i)[0] for i in range(3)]
    def imm(x):
        rot = (x >> 8) & 0xf; v = x & 0xff
        return ((v >> (2*rot)) | (v << (32 - 2*rot))) & 0xffffffff
    return (plt + 8 + imm(w[0]) + imm(w[1]) + (w[2] & 0xfff)) & 0xffffffff
for plt in [int(x, 16) for x in sys.argv[1:]]:
    g = got_of(plt)
    hits = []
    for name, buf, base in (('ro', R, armdis.RO_VA), ('da', D, armdis.DA_VA)):
        needle = struct.pack('<I', g)
        i = buf.find(needle)
        while i >= 0:
            if i % 4 == 0:
                info = struct.unpack_from('<I', buf, i + 4)[0]
                hits.append((name, hex(base + i), hex(info)))
            i = buf.find(needle, i + 1)
    print(hex(plt), 'got', hex(g), hits)

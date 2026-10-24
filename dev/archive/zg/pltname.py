"""pltname.py <plt addr> [...]: the imported symbol a main.text PLT stub jumps through.
The stub is `add ip, pc, #a; add ip, ip, #b; ldr pc, [ip, #c]!` -> GOT slot; .rela.plt (DT_JMPREL) names the slot's symbol
(DT_SYMTAB / DT_STRTAB). The dynamic section comes from MOD0 (text+4 -> MOD0, +4 the dynamic offset)."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT
mod0 = struct.unpack_from('<I', T, 4)[0]
dyn = mod0 + struct.unpack_from('<i', T, mod0 + 4)[0]
D = {}
k = 0
while True:
    tag, val = struct.unpack('<iI', armdis.rd(dyn + 8 * k, 8))
    if tag == 0: break
    D.setdefault(tag, val); k += 1
SYMTAB, STRTAB, JMPREL, PLTRELSZ = D[6], D[5], D[23], D[2]
def name(slot):
    for i in range(PLTRELSZ // 8):
        off, info = struct.unpack('<II', armdis.rd(JMPREL + 8 * i, 8))
        if off == slot:
            si = info >> 8
            st_name = struct.unpack('<I', armdis.rd(SYMTAB + 16 * si, 4))[0]
            return armdis.cstr(STRTAB + st_name, 200)
    return None
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
for x in sys.argv[1:]:
    a = int(x, 16)
    ins = list(md.disasm(T[a:a + 12], a))
    ip = a + 8
    for i in ins[:2]:
        ops = i.op_str.split('#')
        v = int(ops[1].split(',')[0], 0); r = int(ops[2], 0) if len(ops) > 2 else 0
        ip = (ip if i.address == a else ip) + ((v >> r) | (v << (32 - r))) % (1 << 32) if r else ip + v
    c = int(ins[2].op_str.split('#')[1].rstrip(']!'), 0)
    slot = ip + c
    print(x, 'GOT %#x' % slot, name(slot))

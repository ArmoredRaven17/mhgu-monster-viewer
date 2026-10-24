"""gotuse.py GOTSLOT FIELD -- every site that loads the GOT slot (ldr rX,[pc,#a] ; ldr rX,[pc,rX]) and within the
next 12 instructions uses FIELD (movw / mov / immediate offset). Prints the 14 instructions from the slot load."""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
slot = int(sys.argv[1], 16); field = sys.argv[2].lower()
hits = 0
for a in range(0, len(T) - 8, 4):
    w = struct.unpack_from('<I', T, a)[0]
    # ldr rX, [pc, rX]  = e79fX00X
    if (w & 0x0FFF0FF0) != 0x079F0000: continue
    rx = (w >> 12) & 0xf
    if (w & 0xf) != rx: continue
    # find the literal load of rx above (within 8)
    lit = None
    for b in range(a - 4, a - 40, -4):
        v = struct.unpack_from('<I', T, b)[0]
        if (v & 0x0FFF0000) == 0x059F0000 and ((v >> 12) & 0xf) == rx:
            off = v & 0xfff
            lit = struct.unpack_from('<I', T, b + 8 + off)[0] if b + 8 + off < len(T) else None
            break
    if lit is None: continue
    if ((a + 8 + lit) & 0xffffffff) != slot: continue
    lines = [('%08x  %s %s' % (i.address, i.mnemonic, i.op_str)) for i in md.disasm(T[a - 16:a + 4 * 16], a - 16)]
    if any(field in l for l in lines):
        hits += 1
        print('--- %#x' % a); print('\n'.join(lines))
print('hits', hits)

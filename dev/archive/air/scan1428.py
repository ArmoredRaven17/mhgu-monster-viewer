import sys, struct, capstone
sys.path.insert(0, r'..\held'.replace('..', r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad'))
import d
T = d.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
# find 'movw rX, #0x1428' followed within 4 insns by 'str rY, [rZ, rX]'
hits = []
for va in range(0, len(T) - 32, 4):
    w = struct.unpack_from('<I', T, va)[0]
    # movw: cond 0011 0000 imm4 Rd imm12
    if (w & 0x0ff00000) == 0x03000000:
        imm = ((w >> 4) & 0xf000) | (w & 0xfff)
        if imm != 0x1428: continue
        rd = (w >> 12) & 0xf
        for k in range(1, 6):
            ins = list(md.disasm(T[va + 4*k: va + 4*k + 4], va + 4*k))
            if not ins: break
            i = ins[0]
            if i.mnemonic.startswith('str') and ('r%d]' % rd in i.op_str.replace('sb','r9').replace('sl','r10').replace('fp','r11').replace('ip','r12')):
                hits.append((va + 4*k, i.mnemonic, i.op_str))
for h in hits: print('%x %s %s' % h)
print(len(hits))

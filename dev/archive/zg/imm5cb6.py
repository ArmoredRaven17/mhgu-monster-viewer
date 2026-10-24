"""every #0x5cb6 immediate (movw / add / ldrb offset) in a code range, with the next 6 instructions
   python imm5cb6.py lo hi [imm]"""
import sys, re; sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); T = armdis.TEXT
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16); imm = sys.argv[3] if len(sys.argv) > 3 else '0x5cb6'
for a in range(lo, hi, 4):
    i = next(md.disasm(T[a:a + 4], a), None)
    if i and re.search(r'#%s\b' % imm, i.op_str):
        nxt = [next(md.disasm(T[b:b + 4], b), None) for b in range(a + 4, a + 28, 4)]
        print('%x %s %s  ||  %s' % (a, i.mnemonic, i.op_str, ' ; '.join('%s %s' % (n.mnemonic, n.op_str) for n in nxt if n)))

import d, capstone, sys
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
ins = []
va = lo
while va < hi:
    l = list(md.disasm(d.rd(va), va))
    ins.append((va, l[0].mnemonic, l[0].op_str) if l else (va, '.word', ''))
    va += 4
for i, (va, m, o) in enumerate(ins):
    if m.startswith('ldr') and o.endswith('#0x34]'):
        win = ins[i:i + 10]
        if any(mm.startswith('ldr') and oo.endswith('#0x54]') for _, mm, oo in win) and \
           any(mm.startswith('blx') for _, mm, oo in win):
            print(hex(va), m, o)

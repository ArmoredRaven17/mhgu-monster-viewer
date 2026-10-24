import d, capstone, sys
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
keys = sys.argv[3].split(',')
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
va = lo
while va < hi:
    l = list(md.disasm(d.rd(va), va))
    if l:
        s = l[0].mnemonic + ' ' + l[0].op_str
        for k in keys:
            if s.endswith('#' + k) or ('#' + k + ']') in s or ('#' + k + ',') in s:
                print(hex(va), s)
    va += 4

"""every bl TARGET in .text followed within N words by an instruction matching PATTERN"""
import d, capstone, sys, struct, re
target = int(sys.argv[1], 16); pat = re.compile(sys.argv[2]); N = int(sys.argv[3]) if len(sys.argv) > 3 else 8
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
T = d.TEXT
n = 0
for va in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, va)[0]
    if (w >> 24) & 0xf == 0xb and (w >> 28) != 0xf:
        off = w & 0xffffff
        if off & 0x800000: off -= 0x1000000
        if va + 8 + off * 4 == target:
            n += 1
            for k in range(1, N + 1):
                l = list(md.disasm(T[va + 4 * k: va + 4 * k + 4], va + 4 * k))
                if l and pat.search(l[0].mnemonic + ' ' + l[0].op_str):
                    print(hex(va), '->', hex(va + 4 * k), l[0].mnemonic, l[0].op_str)
print('calls', n)

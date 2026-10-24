# every instruction in [lo,hi) whose operands carry an immediate in the given set (movw/movt/add/sub/cmp...), skipdata
import sys, capstone, re
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
want = [int(x, 16) for x in sys.argv[3].split(',')]
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
for i in md.disasm(T[lo:hi], lo):
    for m in re.findall(r'#(-?0x[0-9a-f]+|-?\d+)', i.op_str):
        v = int(m, 0) & 0xffffffff
        if v in want: print('%x  %s %s' % (i.address, i.mnemonic, i.op_str))

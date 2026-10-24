import sys, os
os.environ.setdefault('FB_CLASS', 'uEm024_00'); os.environ.setdefault('FB_MON', 'em024_00')
a0 = int(sys.argv[1], 16); n = int(sys.argv[2]) if len(sys.argv) > 2 else 64
sys.argv = ['x']
import trgen as T
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
code = bytes(T.mu.mem_read(a0, n * 4))
for i in md.disasm(code, a0):
    print('%08x  %-7s %s' % (i.address, i.mnemonic, i.op_str))

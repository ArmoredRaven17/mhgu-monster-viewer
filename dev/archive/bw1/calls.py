# every bl/b to the given targets in [lo, hi), with the containing function (nearest preceding push ... lr)
import sys, capstone, bisect
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
tg = {int(x, 16) for x in sys.argv[3:]}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[lo:hi], lo))
starts = sorted(i.address for i in ins if i.mnemonic.startswith('push') and 'lr' in i.op_str)
for k, i in enumerate(ins):
    if i.mnemonic in ('bl', 'b', 'blx') and i.op_str.startswith('#') and int(i.op_str[1:], 16) in tg:
        f = starts[bisect.bisect_right(starts, i.address) - 1]
        prev = ' ; '.join('%s %s' % (p.mnemonic, p.op_str) for p in ins[max(0, k - 3):k])
        print('%08x %s %s  fn %#x  | %s' % (i.address, i.mnemonic, i.op_str, f, prev))

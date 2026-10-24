# for each address: its containing function (nearest preceding push in the band) and that function's callers, recursively
import capstone, sys, collections
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
LO, HI = 0xf35038, 0xf48200
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[LO:HI], LO))
starts = sorted(i.address for i in ins if i.mnemonic == 'push' and 'lr' in i.op_str)
callers = collections.defaultdict(set)
for i in ins:
    if i.mnemonic in ('bl', 'b', 'blx') and i.op_str.startswith('#'):
        callers[int(i.op_str[1:], 16)].add(i.address)
import bisect
def fn(a):
    k = bisect.bisect_right(starts, a) - 1
    return starts[k] if k >= 0 else None
DISP = {int(x, 16) for x in open(sys.argv[1]).read().split()} if len(sys.argv) > 1 and not sys.argv[1].startswith('0x') else set()
def up(a, depth=0, seen=None):
    seen = seen or set()
    f = fn(a)
    if f in seen or depth > 6: return
    seen.add(f)
    cs = sorted(callers.get(f, ()))
    print('  ' * depth + '%#x in fn %#x  <- %s' % (a, f, ' '.join('%#x' % c for c in cs) or '(no direct caller)'))
    for c in cs:
        if False:
            print('  ' * (depth + 1) + '%#x  (status-7 dispatcher)' % c); continue
        up(c, depth + 1, seen)
for x in sys.argv[1:]:
    up(int(x, 16))

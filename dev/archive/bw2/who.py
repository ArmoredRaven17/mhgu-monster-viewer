# for each address: containing function (nearest preceding push {.., lr}) and its direct callers (b/bl), recursively
import capstone, sys, collections, bisect, struct
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
D = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DA = 0x1728000
LO, HI = int(sys.argv[1], 16), int(sys.argv[2], 16)
VT = int(sys.argv[3], 16)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[LO:HI], LO))
starts = sorted(i.address for i in ins if i.mnemonic == 'push' and 'lr' in i.op_str)
callers = collections.defaultdict(set)
for i in ins:
    if i.mnemonic.startswith('b') and i.op_str.startswith('#'):
        callers[int(i.op_str[1:], 16)].add(i.address)
vslots = collections.defaultdict(list)
for o in range(0, 0x478, 4):
    vslots[struct.unpack_from('<I', D, VT + o - DA)[0]].append(o)
def fn(a):
    k = bisect.bisect_right(starts, a) - 1
    return starts[k] if k >= 0 else None
def up(a, depth=0, seen=None):
    seen = seen if seen is not None else set()
    f = fn(a)
    if f in seen or depth > 7: return
    seen.add(f)
    cs = sorted(callers.get(f, ()))
    vs = ' '.join('vt+%#x' % o for o in vslots.get(f, []))
    print('  ' * depth + '%#x in fn %#x %s <- %s' % (a, f, vs, ' '.join('%#x' % c for c in cs) or '(no direct caller)'))
    for c in cs: up(c, depth + 1, seen)
for x in sys.argv[4:]:
    up(int(x, 16)); print()

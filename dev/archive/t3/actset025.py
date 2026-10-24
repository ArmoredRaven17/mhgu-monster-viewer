# actset025.py: every action-change call in uEm025_00's band (0x768c8 / 0x75230 / 0x76098 / 0x7699c / 0x76a40, b or bl) with the
# r1 / r2 immediates before it (status, number) and the enclosing function
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
LO, HI = 0xdfee0c, 0xe10054
CH = {0x768c8, 0x75230, 0x76098, 0x7699c, 0x76a40}
ins = [next(md.disasm(armdis.TEXT[a:a+4], a), None) for a in range(LO, HI, 4)]
def imm(k, reg):
    for j in range(k - 1, max(k - 14, 0), -1):
        y = ins[j]
        if not y: continue
        s = y.mnemonic + ' ' + y.op_str
        m = re.match(r'movw? %s, #(0x[0-9a-f]+|\d+)$' % reg, s)
        if m: return int(m.group(1), 0)
        if re.match(r'\w+ %s,' % reg, s) and not s.startswith(('cmp', 'str', 'tst')): return '?'
        if y.mnemonic in ('bl', 'blx') : return '?'
    return '?'
def fstart(k):
    for j in range(k, -1, -1):
        x = ins[j]
        if x and x.mnemonic.startswith('push') and 'lr' in x.op_str: return x.address
want = set(tuple(map(lambda v: int(v, 0), w.split(','))) for w in sys.argv[1:])
for k, x in enumerate(ins):
    if x and x.mnemonic in ('b', 'bl') and x.op_str.startswith('#') and int(x.op_str[1:], 16) in CH:
        st, n = imm(k, 'r1'), imm(k, 'r2')
        if not want or (st, n) in want or '?' in (st, n):
            if want and '?' in (st, n): continue
            print('%#x %s %#x  (%s, %s)  fn %#x' % (x.address, x.mnemonic, int(x.op_str[1:], 16), st, n if n == '?' else hex(n), fstart(k)))

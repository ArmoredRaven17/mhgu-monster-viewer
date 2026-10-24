# every bl/b to a changeAction-family function in a band with the r1/r2 immediates set before it (last write, 12 ins back)
import capstone, sys, re
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
LO, HI = int(sys.argv[1], 16), int(sys.argv[2], 16)
CHG = {0x768c8: 'follow', 0x7699c: 'hold', 0x76a40: 'req', 0x75230: 'set', 0x76088: 'default', 0x76094: 'default2', 0x76098: 'changeAction'}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[LO:HI], LO))
for k, i in enumerate(ins):
    if i.mnemonic in ('bl', 'b') and i.op_str.startswith('#') and int(i.op_str[1:], 16) in CHG:
        v = {}
        for j in range(k - 1, max(0, k - 14), -1):
            p = ins[j]
            for r in ('r1', 'r2'):
                if r not in v and re.match(r'^%s\b' % r, p.op_str) and not p.mnemonic.startswith(('str', 'cmp', 'tst')):
                    m = re.match(r'^%s, #(0x[0-9a-f]+|\d+)$' % r, p.op_str)
                    v[r] = hex(int(m.group(1), 0)) if m and p.mnemonic in ('mov', 'movw') else p.mnemonic + ' ' + p.op_str
        print('%08x %-12s r1=%s r2=%s' % (i.address, CHG[int(i.op_str[1:], 16)], v.get('r1'), v.get('r2')))

# every setMotion call in the uEm018_00 band with the r1 immediate it is given (last write to r1 before the bl)
import capstone, sys, re
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
LO, HI = int(sys.argv[1],16), int(sys.argv[2],16)
MOT = {0xafce8: 'setMotion', 0xafe84: 'setMotion0', 0xafe8c: 'setMotionC', 0xafef0: 'setMotionL'}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[LO:HI], LO))
want = set(int(x, 0) for x in sys.argv[3:]) if len(sys.argv) > 3 else None
for k, i in enumerate(ins):
    if i.mnemonic in ('bl', 'b') and i.op_str.startswith('#'):
        t = int(i.op_str[1:], 16)
        if t not in MOT:
            continue
        val = None
        for j in range(k - 1, max(0, k - 30), -1):
            p = ins[j]
            if re.match(r'^r1\b', p.op_str) and p.mnemonic.startswith(('mov', 'movw', 'add', 'ldr', 'orr', 'sub', 'pop')):
                m = re.match(r'^r1, #(0x[0-9a-f]+|\d+)$', p.op_str)
                val = (int(m.group(1), 0), p.mnemonic, p.address) if m and p.mnemonic in ('mov', 'movw') else ('?', p.mnemonic + ' ' + p.op_str, p.address)
                break
        if want is None or (val and val[0] in want):
            print('%08x %-10s r1=%s' % (i.address, MOT[t], val if val is None else (hex(val[0]) if val[0] != '?' else val)))

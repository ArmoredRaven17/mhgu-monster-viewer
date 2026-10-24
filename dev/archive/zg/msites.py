"""setMotion sites of one motion id in a class band: `mov/movw r1, #id` within 6 instructions before a bl/b into any of the
eight wrappers.   python msites.py <class> <motion hex> ..."""
import sys, json, re, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
W = {0xafce8, 0xafe84, 0xafe8c, 0xafef0, 0xb032c, 0xb0230, 0xb00b4, 0xb0174, 0xb03f8, 0xb04d0, 0xb0004}
CL = {c['class']: c for c in json.load(open(r'C:\MHGU-Extract\efx\class-effects.json'))['classes']}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
c = CL[sys.argv[1]]; lo, hi = int(c['code_lo'], 16), int(c['code_hi'], 16)
ins = []
for a in range(lo, hi, 4):
    g = list(md.disasm(armdis.TEXT[a:a + 4], a))
    if g: ins.append(g[0])
want = {int(x, 16) for x in sys.argv[2:]}
for k, i in enumerate(ins):
    if i.mnemonic in ('b', 'bl') and i.op_str.startswith('#') and int(i.op_str[1:], 16) in W:
        for j in ins[max(0, k - 8):k][::-1]:
            m = re.match(r'movw? r1, #(0x[0-9a-f]+|\d+)$', j.mnemonic + ' ' + j.op_str)
            if m:
                if int(m.group(1), 0) in want: print('%#x %s -> %#x' % (i.address, m.group(1), int(i.op_str[1:], 16)))
                break

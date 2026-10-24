import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = 0x900000, 0xc00000
win = []
for a in range(lo, hi, 4):
    ins = list(md.disasm(armdis.TEXT[a:a+4], a))
    s = ('%s %s' % (ins[0].mnemonic, ins[0].op_str)) if ins else '?'
    win.append((a, s)); win = win[-6:]
    m = re.match(r'(ubfx|lsr|and)\S* (\w+), (\w+), #(0x18|0xf000000)', s)
    if m and (m.group(1) != 'and' or True):
        src = m.group(3)
        for pa, ps in win[:-1]:
            if re.match(r'ldr\S* %s, \[\w+, #0x50\]' % src, ps):
                print(hex(a), s, '<-', hex(pa), ps)

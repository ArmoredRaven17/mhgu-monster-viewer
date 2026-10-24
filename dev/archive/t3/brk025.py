# brk025.py: every read of Chameleos's break state in uEm025_00's band (0xdfee0c..0xe10054): vt+0x370 calls (ldr rX, [r?, #0x370] ;
# blx) with the r1 immediate before, direct P+0x3b4 loads, and the class bytes ctl+0x95 / +0x49 (EMC selectors 6 / 11) writers
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
LO, HI = 0xdfee0c, 0xe10054
ins = [next(md.disasm(armdis.TEXT[a:a+4], a), None) for a in range(LO, HI, 4)]
def fstart(k):
    for j in range(k, -1, -1):
        x = ins[j]
        if x and x.mnemonic.startswith('push') and 'lr' in x.op_str: return x.address
for k, x in enumerate(ins):
    if not x: continue
    s = x.mnemonic + ' ' + x.op_str
    if re.search(r'#0x370\]', s) and x.mnemonic.startswith('ldr'):
        r1 = None
        for j in range(k - 1, max(k - 8, 0), -1):
            y = ins[j]
            m = y and re.match(r'movw? r1, #(0x[0-9a-f]+|\d+)$', y.mnemonic + ' ' + y.op_str) if y else None
            if m: r1 = int(m.group(1), 0); break
        if r1 is None:
            for j in range(k + 1, k + 4):
                y = ins[j]
                m = y and re.match(r'movw? r1, #(0x[0-9a-f]+|\d+)$', y.mnemonic + ' ' + y.op_str) if y else None
                if m: r1 = int(m.group(1), 0); break
        print('vt370 %#x part %s  fn %#x' % (x.address, r1, fstart(k)))
    if re.search(r'#0x3b4\]', s): print('P+0x3b4 %#x %s  fn %#x' % (x.address, s, fstart(k)))
    if re.search(r'#0x95\]|#0x49\]', s) and x.mnemonic.startswith('str'): print('ctl store %#x %s  fn %#x' % (x.address, s, fstart(k)))

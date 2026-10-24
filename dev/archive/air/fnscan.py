# air/fnscan.py <fn> [maxlen]: a function's direct calls (to the pop that ends it, by a sweep up to maxlen) and its setMotion ids
import sys, capstone
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\held')
import d
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
fn = int(sys.argv[1], 16); n = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0x800
NAMES = {0xbc7f4: 'posture', 0xbc984: 'lift', 0xbca24: 'toPosture1(joint)', 0xbf700: 'P5c=', 0xbf71c: 'P5c+=', 0xc1010: 'curve',
         0x7d810: 'flystep(floor)', 0x7d8d8: 'step(floor)', 0xbf038: 'floor', 0x7b53c: 'pos+=v', 0x7c9fc: 'integ', 0x7c860: 'integ+g',
         0x7a820: 'move', 0xafe84: 'setMotion', 0xafef0: 'setMotion', 0xafce8: 'setMotion', 0xbf4d4: 'FlyOfs', 0xbf52c: 'reach'}
last = None
for va in range(fn, fn + n, 4):
    r = list(md.disasm(d.TEXT[va:va + 4], va))
    if not r: continue
    i = r[0]
    if i.mnemonic in ('movw', 'mov') and i.op_str.startswith('r1, #'):
        try: last = int(i.op_str.split('#')[1], 0)
        except ValueError: pass
    if i.mnemonic in ('bl', 'b') and i.op_str.startswith('#'):
        t = int(i.op_str[1:], 16)
        if t in NAMES:
            print('%x %s %s%s' % (va, i.mnemonic, NAMES[t], (' r1=%#x' % last) if NAMES[t] in ('setMotion', 'posture') and last is not None else ''))

# offscan.py <hexoff> [lo hi]: every ldr*/str* whose immediate offset is <hexoff> over main.text (default 0x40000..0x1130000)
# positive control: '0x24d' must find the OR at 0xc37f8 (strb r1, [r0, #0x24d]) -- the sense scan's detection bit.
import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
off = sys.argv[1].lower(); lo = int(sys.argv[2], 16) if len(sys.argv) > 2 else 0x40000; hi = int(sys.argv[3], 16) if len(sys.argv) > 3 else 0x1130000
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
T = armdis.TEXT
pat = '#%s]' % off
a = lo
while a < hi:
    n = 0
    for i in md.disasm(T[a:min(hi, a + 0x10000)], a):
        n = i.address + 4
        if pat in i.op_str and (i.mnemonic.startswith('ldr') or i.mnemonic.startswith('str')):
            print('%08x  %-8s %s' % (i.address, i.mnemonic, i.op_str))
    a = max(n, a + 4) if n else a + 4

# laneB3/armlist.py (lane B3, 2026-10-25): disassemble main.text ranges, with literal-pool words and PIC pairs left to the reader.
#   python dev/archive/laneB3/armlist.py <start> <end> [<start> <end> ...]      (hex addresses)
# Uses efx/armdis.py's loaded text (C:\MHGU-ROM\exefs split). Plain capstone ARM mode, skipdata on.
import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
a = sys.argv[1:]
for k in range(0, len(a), 2):
    lo, hi = int(a[k], 16), int(a[k + 1], 16)
    for i in md.disasm(T[lo:hi], lo):
        print('%08x  %-8s %s' % (i.address, i.mnemonic, i.op_str))
    print('--')

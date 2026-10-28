# hypermotion/hmdis.py (hyper-motion lane, 2026-10-27): plain disassembly of main.text [lo, hi) with literal-pool words shown.
#   python dev/archive/hypermotion/hmdis.py <lo> <hi>
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
for i in md.disasm(D.TEXT[lo:hi], lo):
    note = ''
    if i.mnemonic.startswith('vldr') and '[pc' in i.op_str:
        try:
            off = int(i.op_str.split('#')[-1].rstrip(']'), 16) if '#' in i.op_str else 0
            if '#-' in i.op_str: off = -int(i.op_str.split('#-')[-1].rstrip(']'), 16)
            a = ((i.address + 8) & ~3) + off
            note = '  ; =%g' % struct.unpack('<f', D.TEXT[a:a+4])[0]
        except Exception: pass
    print('%08x  %-8s %s%s' % (i.address, i.mnemonic, i.op_str, note))

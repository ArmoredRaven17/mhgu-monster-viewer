# wd.py lo hi [grep...]: word-by-word disassembly (capstone stops at an undecodable word; this does not)
import sys, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def dis(lo, hi):
    out = []
    for a in range(lo, hi, 4):
        r = list(md.disasm(armdis.TEXT[a:a + 4], a))
        out.append('%08x  %-9s %s' % (a, r[0].mnemonic, r[0].op_str) if r else '%08x  .word %s' % (a, armdis.TEXT[a:a+4].hex()))
    return out
if __name__ == '__main__':
    lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
    L = dis(lo, hi)
    pats = sys.argv[3:]
    if not pats: print('\n'.join(L))
    else:
        for i, l in enumerate(L):
            if all(p in l for p in pats): print('\n'.join(L[max(0, i - 8):i + 1])); print('----')

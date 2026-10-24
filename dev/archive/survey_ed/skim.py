"""Skim an override: disassemble from its entry; report the instructions up to the furthest-reaching return
(a branch target beyond the first return extends the walk). Extent derived from intra-function branches."""
import sys, capstone, re
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
for a in sys.argv[1:]:
    lo = int(a, 16); far = lo; out = []
    for i in md.disasm(TEXT[lo:lo + 0x1000], lo):
        out.append(i)
        if i.mnemonic.startswith('b') and not i.mnemonic.startswith(('bl', 'bx', 'bic')):
            m = re.match(r'#0x([0-9a-f]+)', i.op_str)
            if m: far = max(far, int(m.group(1), 16))
        ret = (i.mnemonic.startswith('pop') and 'pc' in i.op_str) or (i.mnemonic == 'bx' and i.op_str == 'lr') or (i.mnemonic.startswith('ldm') and 'pc' in i.op_str) \
              or (i.mnemonic == 'b' and int(i.op_str[3:], 16) < lo if i.op_str.startswith('#0x') else False)
        if ret and i.mnemonic in ('pop', 'bx', 'ldm', 'ldmia', 'b') and i.address >= far:
            break
    print('== 0x%x .. 0x%x  (%d instructions)' % (lo, out[-1].address + 4, len(out)))
    for i in out: print('%08x  %-8s %s' % (i.address, i.mnemonic, i.op_str))

"""each census site (census.out) -> its function start (the nearest push {.., lr} before it) and whether rom-map names the site,
the function, or neither"""
import sys, re, ast; sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); T = armdis.TEXT
RM = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\dev\rom-map.md', encoding='utf8').read().lower()
cls = None
for line in open('census.out'):
    if line.startswith('=='): cls = line.split()[1]; continue
    t = ast.literal_eval(line.strip())
    a = int(t[0], 16)
    f = None
    for b in range(a, a - 0x3000, -4):
        i = next(md.disasm(T[b:b + 4], b), None)
        if i and i.mnemonic.startswith('push') and 'lr' in i.op_str: f = b; break
    site, fn = '%#x' % a, '%#x' % f if f else '?'
    where = 'site' if site in RM else ('fn' if fn in RM else '-')
    print(cls, t[0], t[1], t[2], 'fn', fn, 'rom-map:', where)

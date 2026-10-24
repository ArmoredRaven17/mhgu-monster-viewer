# storescan.py <lo> <hi> <off>[,<off>...] [ctx]: every store (str / strb / strh / vstr / stm not) with an immediate offset in the list,
# in a code band, with the lines before it -- and every movw #0xcac0 (the control block pointer e+0xcac0) seen in that window marked
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
offs = [int(x, 16) for x in sys.argv[3].split(',')]
ctx = int(sys.argv[4]) if len(sys.argv) > 4 else 8
lines = list(armdis.sweep(lo, hi))
pat = re.compile(r'\[(\w+), #(0x[0-9a-f]+|\d+)\]')
for i, (a, m, o) in enumerate(lines):
    if not m.startswith(('str', 'vstr')): continue
    mm = pat.search(o)
    if not mm: continue
    if int(mm.group(2), 0) not in offs: continue
    print('-----')
    for a2, m2, o2 in lines[max(0, i - ctx):i + 1]:
        print('%08x  %-8s %s%s' % (a2, m2, o2, '   <== ' if a2 == a else ''))

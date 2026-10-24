# lit.py <file of armd output>: annotate pc-relative vldr / ldr with the literal's value
import sys, re, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
for l in open(sys.argv[1]):
    l = l.rstrip()
    m = re.match(r'(0x[0-9a-f]+) (vldr|ldr) (\w+), \[pc, #(-?0x[0-9a-f]+)\]', l)
    if m:
        a = int(m.group(1), 16) + 8 + int(m.group(4), 16)
        w = struct.unpack_from('<I', T, a)[0]; fv = struct.unpack_from('<f', T, a)[0]
        l += '    ; [%#x] = %#x / %r' % (a, w, fv)
    print(l)

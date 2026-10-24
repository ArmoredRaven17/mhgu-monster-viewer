import sys, struct, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
ins = armdis.sweep(lo-0x80, hi+0x20)
idx = {a:i for i,(a,m,o) in enumerate(ins)}
for i,(a,m,o) in enumerate(ins):
    if not (lo <= a < hi): continue
    mm = re.match(r'#0x(745[123])$', o.split(', ')[-1]) if m=='movw' else None
    if not mm: continue
    rd = o.split(',')[0]
    for j in range(i+1, i+8):
        b,m2,o2 = ins[j]
        if m2.startswith('strb') and re.search(r'\[\w+, %s\]'%rd, o2):
            src = o2.split(',')[0]
            val='?'
            for k in range(j-1, j-40, -1):
                c,m3,o3 = ins[k]
                if o3.split(',')[0]==src and not m3.startswith(('str','cmp','tst','vst','push')):
                    val='%x: %s %s'%(c,m3,o3); break
            print('%x 0x%s  %s %s   value <- %s' % (b, mm.group(1), m2, o2, val))
            break

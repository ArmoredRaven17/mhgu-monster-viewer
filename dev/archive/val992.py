import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
lo, hi = int(sys.argv[1],16), int(sys.argv[2],16)
ins = armdis.sweep(lo-0x100, hi)
for i,(a,m,o) in enumerate(ins):
    if a < lo: continue
    if m.startswith('strb') and o.endswith('#0x992]'):
        src = o.split(',')[0]
        val='?'
        for k in range(i-1, i-60, -1):
            c,m3,o3 = ins[k]
            if o3.split(',')[0]==src and not m3.startswith(('str','cmp','tst','vst','push')):
                val='%x: %s %s'%(c,m3,o3); break
        # nearest preceding posture set
        post='-'
        for k in range(i-1, i-40, -1):
            c,m3,o3=ins[k]
            if m3 in ('bl','b') and o3 in ('#0xbc7f4','#0xbc984','#0xbca24'):
                # find r1
                r1='?'
                for q in range(k-1,k-12,-1):
                    if ins[q][2].startswith('r1,') and ins[q][1] in ('mov','movw'): r1=ins[q][2]; break
                post='%x %s %s (%s)'%(c,m3,o3,r1); break
        print('%x %s %s   val<- %s   | %s'%(a,m,o,val,post))

"""Lane A4 joint -1 audit: a sweep listing (efx/armdis.py sweep(), every word on its own) of lo..hi,
with PIC literal resolution like run(), and an optional grep. Usage: python sw.py LO HI [substr ...]"""
import sys
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis

lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
subs = sys.argv[3:]
for a, m, o in armdis.sweep(lo, hi):
    note = ''
    if m == 'ldr' and '[pc, #' in o:
        try:
            off = int(o.split('[pc, #')[-1].rstrip(']'), 0)
            lit = armdis.u32(a + 8 + off)
            note = '   ; literal 0x%x' % lit
        except Exception:
            pass
    line = '%08x  %-8s %-40s%s' % (a, m, o, note)
    if not subs or any(s in line for s in subs):
        print(line)

from scan import *
import armdis
# movw #0x1050 / #0x1052 sites followed by a word/half store
for imm in (0x1050, 0x1052, 0x1051):
    for x in movw_hits(imm):
        ins = list(armdis.sweep(x, x + 0x10))
        for a, m, o in ins:
            if m.startswith('str') and m not in ('strb',):
                print(hex(imm), hex(x), hex(a), m, o)
                break
# strb Rt,[Rn,#0x53] immediate form: cond 010P U1W0 ; P=1,U=1,B=1,W=0,L=0 -> 0x05c00000
for i, w in enumerate(W):
    if (w & 0x0ff00000) == 0x05c00000 and (w & 0xfff) == 0x53:
        print('strb #0x53', hex(i*4))

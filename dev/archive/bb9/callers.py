import d, struct, sys
T=d.TEXT
def callers(tgt, lo=0, hi=None):
    hi = hi or len(T)
    out=[]
    for a in range(lo, hi, 4):
        w=struct.unpack_from('<I',T,a)[0]
        if (w>>25)&7==5 and (w>>28)!=0xf:
            off=w&0xffffff
            if off&0x800000: off-=0x1000000
            if a+8+off*4==tgt: out.append((a, 'bl' if (w>>24)&1 else 'b', w>>28))
    return out
if __name__=='__main__':
    for t in sys.argv[1:]:
        print(t, [(hex(a),k,c) for a,k,c in callers(int(t,16), 0xd30000, 0xd50000)])

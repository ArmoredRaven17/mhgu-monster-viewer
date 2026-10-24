import sys, os, struct, capstone
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RODATA = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata=True
def rd(va, n=4):
    if 0 <= va < len(TEXT): return TEXT[va:va + n]
    if RO_VA <= va < RO_VA + len(RODATA): return RODATA[va - RO_VA:va - RO_VA + n]
    if DA_VA <= va < DA_VA + len(DATA): return DATA[va - DA_VA:va - DA_VA + n]
    return b''
def u32(va): return struct.unpack('<I', rd(va,4))[0]
def f32(va): return struct.unpack('<f', rd(va,4))[0]
def dis(a,n=64):
    for i in md.disasm(TEXT[a:a+n*4], a):
        print("%08x  %-8s %s"%(i.address, i.mnemonic, i.op_str))
def scan(lo,hi,tgts):
    for i in md.disasm(TEXT[lo:hi], lo):
        if i.mnemonic in ('bl','b','blx') or i.mnemonic.startswith('b'):
            s=i.op_str.strip('#')
            try: t=int(s,16)
            except: continue
            if t in tgts: print(hex(i.address), i.mnemonic, hex(t))
if __name__=='__main__':
    if sys.argv[1]=='scan': scan(int(sys.argv[2],16),int(sys.argv[3],16),[int(x,16) for x in sys.argv[4:]])
    elif sys.argv[1]=='w': 
        a=int(sys.argv[2],16)
        for k in range(int(sys.argv[3])): print(hex(a+4*k), hex(u32(a+4*k)), f32(a+4*k))
    else: dis(int(sys.argv[1],16), int(sys.argv[2]) if len(sys.argv)>2 else 64)

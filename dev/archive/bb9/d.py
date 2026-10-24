import sys, os, struct, capstone
EX = r'C:\MHGU-ROM\exefs'
TEXT = open(os.path.join(EX, 'main.text'), 'rb').read()
RODATA = open(os.path.join(EX, 'main.rodata'), 'rb').read()
DATA = open(os.path.join(EX, 'main.data'), 'rb').read()
RO_VA, DA_VA = 0x13EF000, 0x1728000
def rd(va, n=4):
    if 0 <= va < len(TEXT): return TEXT[va:va + n]
    if RO_VA <= va < RO_VA + len(RODATA): return RODATA[va - RO_VA:va - RO_VA + n]
    if DA_VA <= va < DA_VA + len(DATA): return DATA[va - DA_VA:va - DA_VA + n]
    return b''
def u32(va):
    b = rd(va); return struct.unpack('<I', b)[0] if len(b) == 4 else None
def i32(va):
    b = rd(va); return struct.unpack('<i', b)[0] if len(b) == 4 else None
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def dis(lo, hi):
    out=[]
    a=lo
    while a<hi:
        ins=list(md.disasm(TEXT[a:a+4],a))
        if ins:
            i=ins[0]; s='%x: %s %s'%(a,i.mnemonic,i.op_str)
            if i.mnemonic.startswith('ldr') and '[pc, #' in i.op_str:
                try:
                    imm=int(i.op_str.split('#')[-1].rstrip(']'),16) if '0x' in i.op_str.split('#')[-1] else int(i.op_str.split('#')[-1].rstrip(']'))
                    s+='   ; =%#x'%u32(a+8+imm)
                except Exception: pass
            out.append(s)
        else: out.append('%x: .word %#x'%(a,u32(a)))
        a+=4
    return out
if __name__=='__main__':
    lo=int(sys.argv[1],16); hi=int(sys.argv[2],16)
    print('\n'.join(dis(lo,hi)))

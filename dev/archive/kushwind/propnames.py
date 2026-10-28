import armdis, struct, capstone, sys
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata=True
T=armdis.TEXT
lo,hi=int(sys.argv[1],16),int(sys.argv[2],16)
lastname=None; regs={}
for ins in md.disasm(T[lo:hi],lo):
    if ins.mnemonic=='ldr' and '[pc, #' in ins.op_str:
        rd=ins.op_str.split(',')[0]; off=int(ins.op_str.split('#')[1].rstrip(']'),16)
        regs[rd]=armdis.u32(ins.address+8+off)
    elif ins.mnemonic=='add' and ', pc, ' in ins.op_str:
        rd,_,rm=[x.strip() for x in ins.op_str.split(',')]
        if rm in regs:
            v=(regs[rm]+ins.address+8)&0xffffffff; o=v-armdis.RO_VA
            if 0<=o<len(armdis.RODATA):
                s=armdis.RODATA[o:o+40].split(b'\0')[0]
                if s and all(32<c<127 for c in s): lastname=s.decode()
    elif ins.mnemonic=='add' and '#0x' in ins.op_str and lastname and ins.op_str.startswith('r1'):
        print(hex(ins.address), lastname, ins.op_str); lastname=None

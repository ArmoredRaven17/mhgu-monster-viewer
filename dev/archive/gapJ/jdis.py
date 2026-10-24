import sys, os, struct, capstone
EX = r'C:\MHGU-ROM\exefs'
T = open(os.path.join(EX,'main.text'),'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
lo=int(sys.argv[1],16); hi=int(sys.argv[2],16)
for ins in md.disasm(T[lo:hi], lo):
    note=''
    if ins.mnemonic.startswith('ldr') and '[pc, #' in ins.op_str:
        try:
            off=int(ins.op_str.split('[pc, #')[-1].rstrip(']'),0); a=ins.address+8+off
            note='   ; lit 0x%x' % struct.unpack('<I',T[a:a+4])[0]
        except Exception: pass
    print('%08x  %-8s %s%s' % (ins.address, ins.mnemonic, ins.op_str, note))

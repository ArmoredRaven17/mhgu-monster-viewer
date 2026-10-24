import capstone
t=open('C:/MHGU-ROM/exefs/main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM,capstone.CS_MODE_ARM); md.skipdata=True
a,b=0x9a0000,0xb20000
n=0; hits=[]
for off in range(a,b,4):
    for x in md.disasm(t[off:off+4],off):
        if x.mnemonic=='ubfx' and x.op_str.endswith('#0x10, #4'): hits.append(off)
        if x.mnemonic in ('and','ands','tst','bic','bics','orr') and ('#0xf0000' in x.op_str and '#0xf00000' not in x.op_str and '#0xf000000' not in x.op_str): hits.append(off)
        if x.mnemonic in ('bfi','bfc') and '#0x10, #4' in x.op_str: hits.append(off)
for h in hits:
    s=' ; '.join('%x %s %s'%(y.address,y.mnemonic,y.op_str) for y in md.disasm(t[h-8:h+20],h-8))
    print(s)

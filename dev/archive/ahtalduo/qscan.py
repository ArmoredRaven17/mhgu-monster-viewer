"""Every `ldrh rD, [rN, #0x64]` in main.text with the 4 instructions before it (the quest's mEmType_1 at cQuestData +0x64, the
bosses 0xe apart -- registration 0x371a94 / 0x371fa8): candidates for the boss reader / the quest spawner."""
import capstone
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata=True
win=[]
for i in md.disasm(T, 0):
    win.append(i); win=win[-6:]
    if i.mnemonic=='ldrh' and i.op_str.endswith('#0x64]'):
        ctx=' | '.join('%s %s'%(x.mnemonic,x.op_str) for x in win[:-1])
        if 'lsl' in ctx or 'mul' in ctx or 'mla' in ctx: print('%08x %s %s  <- %s'%(i.address,i.mnemonic,i.op_str,ctx))

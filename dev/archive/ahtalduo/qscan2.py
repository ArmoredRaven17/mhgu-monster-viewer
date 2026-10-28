"""Second scan for the quest boss reader: a x7 (`rsb rX, rY, rY, lsl #3`) or x14 index within 8 instructions before an access at #0x64
(or an `add rX, rY, #0x64`), anywhere in main.text -- the boss records are 0xe bytes apart in cQuestData from +0x64."""
import capstone
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata=True
win=[]
for i in md.disasm(T, 0):
    win.append(i); win=win[-9:]
    if '#0x64' in i.op_str and (i.mnemonic in ('ldrh','ldrb','add') ):
        prev=win[:-1]
        if any(x.mnemonic=='rsb' and x.op_str.endswith('lsl #3') for x in prev) or any('#0xe' == x.op_str.split(', ')[-1] for x in prev if x.mnemonic in ('mov','mul','mla')):
            print('%08x %s %s  <- %s'%(i.address,i.mnemonic,i.op_str,' | '.join('%s %s'%(x.mnemonic,x.op_str) for x in prev)))

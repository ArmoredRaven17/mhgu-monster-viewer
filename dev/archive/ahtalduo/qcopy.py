"""The quest's boss block as a COPY (coordinator, 2026-10-26): every memcpy (0x13ecc08) / ldm whose 10 instructions before set a source
at +0x64 / +0x72 of a base, or a length 0xe / 0x1c / 0x46 (one / two / five boss records of 0xe) -- main.text."""
import capstone
T=open(r'C:\MHGU-ROM\exefs\main.text','rb').read()
md=capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata=True
win=[]
for i in md.disasm(T, 0):
    win.append(i); win=win[-11:]
    if i.mnemonic in ('bl','b') and i.op_str in ('#0x13ecc08',):
        prev=win[:-1]
        src=[x for x in prev if x.mnemonic=='add' and (x.op_str.endswith('#0x64') or x.op_str.endswith('#0x72'))]
        ln=[x for x in prev if x.mnemonic=='mov' and x.op_str.split(', ')[0]=='r2' and x.op_str.split(', ')[-1] in ('#0xe','#0x1c','#0x46')]
        if src or ln:
            print('%08x memcpy  <- %s'%(i.address, ' | '.join('%s %s'%(x.mnemonic,x.op_str) for x in prev[-7:])))
# second form: an `add rX, rY, #0x64` (or #0x72) whose register is the base of an ldm / vld1 / ldrd within the next 4 instructions
pend = []
for i in md.disasm(T, 0):
    pend = [(r, a, n - 1) for (r, a, n) in pend if n > 0]
    for (r, a, n) in pend:
        if i.mnemonic.startswith(('ldm', 'vld1', 'ldrd', 'vldm')) and (i.op_str.startswith(r + ',') or i.op_str.startswith(r + '!') or ('[' + r) in i.op_str):
            print('%08x %s %s  <- add at %08x' % (i.address, i.mnemonic, i.op_str, a))
    if i.mnemonic == 'add' and (i.op_str.endswith('#0x64') or i.op_str.endswith('#0x72')):
        pend.append((i.op_str.split(', ')[0], i.address, 4))

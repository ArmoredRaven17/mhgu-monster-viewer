"""Every way bit 20 of enemy +0x1404 can be raised: (a) orr #imm with bit 20 after a +0x1404 address (latch1404.py's set),
(b) a register-built mask holding bit 20 (mov/movw/movt) or'd into a +0x1404 load, (c) byte +0x1406 written (bit 20 = byte
+0x1406 bit 4), (d) a whole-word store of a constant with bit 20. Windows of 16 instructions after each +0x1404 / +0x1406 address.
Printed: sites outside the known class sites."""
import sys
from capstone import *
from capstone.arm import *
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); md.detail = True
def ins(a):
    for i in md.disasm(T[a:a + 4], a): return i
KNOWN_CLASS = {0xd64980, 0xd9d5bc, 0xdbb368, 0xe9415c, 0xeb952c, 0xed62cc, 0xee7984, 0xf5d8b4, 0xf6cbc8, 0xf7fd20, 0xf92680}
out = []
for a in range(0, len(T) - 4, 4):
    i = ins(a)
    if not i or not i.operands: continue
    imm = [o.imm for o in i.operands if o.type == ARM_OP_IMM]
    if not any(v in (0x1404, 0x1406) for v in imm): continue
    win = [ins(a + 4 * k) for k in range(1, 17)]
    win = [j for j in win if j]
    regmask = set()
    hit = None
    for j in win:
        im = [o.imm & 0xffffffff for o in j.operands if o.type == ARM_OP_IMM]
        if j.mnemonic.startswith(('mov', 'movw', 'mvn')) and im and (im[0] & 0x100000): regmask.add(j.operands[0].reg)
        if j.mnemonic.startswith('movt') and im and (im[0] & 0x10): regmask.add(j.operands[0].reg)
        if j.mnemonic.startswith('orr'):
            if im and im[-1] & 0x100000: hit = 'imm'
            elif len(j.operands) == 3 and j.operands[2].type == ARM_OP_REG and j.operands[2].reg in regmask: hit = 'reg'
        if j.mnemonic.startswith('strb') and 0x1406 in imm: hit = hit or 'byte1406'
        if j.mnemonic.startswith(('bfi',)): hit = hit or 'bfi'
    if hit and a not in KNOWN_CLASS:
        out.append('%#x %s :: %s' % (a, hit, ' ; '.join('%x %s %s' % (j.address, j.mnemonic, j.op_str) for j in win[:12])))
print('\n'.join(out))
print(len(out), 'sites', file=sys.stderr)

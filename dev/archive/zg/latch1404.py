"""Who writes enemy +0x1404 bits 20-22 and +0x1408 bit 0 (the u 1400 latch read at 0xadc98). Word-by-word decode of .text:
every `movw rX, #0x1404 / #0x1408` (and `add rX, rY, #0x1400`), then the next 12 instructions for an orr / bic / bfc / and touching
bit 20 / 21 / 22 (or bit 0 for +0x1408) followed by a store. Prints the site and the window. Control: Uragaan's 0xe94118 roll
(e+0x1404 |= 0x100000) and Duramboros's 0xed6288 must appear."""
import sys, struct
from capstone import *
from capstone.arm import *
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); md.detail = True
def ins(a):
    for i in md.disasm(T[a:a + 4], a): return i
    return None
OFF = {0x1404: 'b1404', 0x1408: 'b1408'}
hits = []
for a in range(0, len(T) - 4, 4):
    i = ins(a)
    if not i: continue
    tag = None
    if i.mnemonic.startswith('movw') and len(i.operands) == 2 and i.operands[1].type == ARM_OP_IMM and i.operands[1].imm in OFF:
        tag = OFF[i.operands[1].imm]
    elif i.mnemonic.startswith('add') and len(i.operands) == 3 and i.operands[2].type == ARM_OP_IMM and i.operands[2].imm == 0x1400:
        tag = 'add1400'
    if not tag: continue
    win = []
    for k in range(1, 14):
        j = ins(a + 4 * k)
        if j: win.append(j)
    txt = ' ; '.join('%x %s %s' % (j.address, j.mnemonic, j.op_str) for j in win)
    def touches(j):
        m = j.mnemonic
        if m.startswith(('orr', 'bic', 'eor')) and j.operands and j.operands[-1].type == ARM_OP_IMM:
            v = j.operands[-1].imm & 0xffffffff
            return (v & 0x700000) or (tag != 'b1404' and v & 1)
        if m.startswith('bfc') or m.startswith('bfi'):
            lsb = j.operands[1].imm; w = j.operands[2].imm
            return (lsb <= 22 and lsb + w > 20) or (tag != 'b1404' and lsb == 0)
        return False
    if any(touches(j) for j in win) and any(j.mnemonic.startswith('str') for j in win):
        hits.append((a, tag, txt))
for a, tag, txt in hits:
    print('%#x %s :: %s' % (a, tag, txt))
print(len(hits), 'sites', file=sys.stderr)

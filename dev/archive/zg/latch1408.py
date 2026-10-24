"""Every store that can reach enemy +0x1408 bit 0 (the u 1400 latch's second condition): after `movw rX, #0x1408` (index) or
`add rX, rY, #0x1400` (base, then [rX, #8]) or `movw rX, #0x1408; ... ldr rV, [rB, rX]!` (pointer, then [rB]), the next 16
instructions' str / strb / strh into that address, with the 4 instructions before the store. Control: uEm036's 0xe42bd0
(orr #1) and the ctor 0x71888 (= 4) must appear."""
import sys
from capstone import *
from capstone.arm import *
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); md.detail = True
def ins(a):
    for i in md.disasm(T[a:a + 4], a): return i
out = []
for a in range(0, len(T) - 4, 4):
    i = ins(a)
    if not i or len(i.operands) < 2: continue
    o = i.operands
    idx = base = None
    if i.mnemonic.startswith('movw') and o[1].type == ARM_OP_IMM and o[1].imm == 0x1408: idx = o[0].reg
    elif i.mnemonic.startswith('add') and len(o) == 3 and o[2].type == ARM_OP_IMM and o[2].imm == 0x1400: base = o[0].reg
    else: continue
    ptr = set()
    for k in range(1, 17):
        j = ins(a + 4 * k)
        if not j: continue
        mem = [x for x in j.operands if x.type == ARM_OP_MEM]
        if j.mnemonic.startswith('ldr') and mem and idx is not None and mem[0].mem.index == idx and j.writeback:
            ptr.add(mem[0].mem.base)
        if j.mnemonic.startswith('str') and mem:
            m = mem[0].mem
            hit = (idx is not None and m.index == idx) or (base is not None and m.base == base and m.disp in (8, 9, 10, 11)) or \
                  (m.base in ptr and m.disp == 0 and m.index == 0)
            if hit:
                ctx = ' ; '.join('%x %s %s' % (x.address, x.mnemonic, x.op_str) for x in [ins(a + 4 * q) for q in range(max(1, k - 4), k + 1)] if x)
                out.append('%#x :: %s' % (a, ctx))
        if j.mnemonic.startswith(('bx', 'pop', 'b ')) or j.mnemonic in ('b', 'bl', 'blx'):
            if j.mnemonic not in ('bl', 'blx'): break
print('\n'.join(out)); print(len(out), 'stores', file=sys.stderr)

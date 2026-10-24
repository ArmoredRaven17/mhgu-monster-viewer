"""Linear pointer tracker: which loads/stores go through [e+OFF] (the ctl block) and at what offset.
   python ctltrack.py lo hi OFF  -> prints every memory access whose base is ctl or ctl+k (k const) or ctl+reg"""
import sys, capstone
from capstone import arm as A
TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
lo, hi, OFF = int(sys.argv[1], 16), int(sys.argv[2], 16), int(sys.argv[3], 16)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True; md.detail = True
st = {}   # reg -> ('c', v) const | ('p', k) ctl+k | ('pv', k) ctl+var+k
def rn(r): return md.reg_name(r)
for i in md.disasm(TEXT[lo:hi], lo):
    if i.id == 0: st = {}; continue
    m = i.mnemonic; ops = i.operands
    try: _, w = i.regs_access()
    except Exception: w = []
    new = {}
    if m.startswith('movw') and ops[1].type == A.ARM_OP_IMM:
        new[ops[0].reg] = ('c', ops[1].imm)
    elif m in ('mov',) and ops[1].type == A.ARM_OP_REG and ops[1].reg in st:
        new[ops[0].reg] = st[ops[1].reg]
    elif m.startswith('ldr') and len(ops) == 2 and ops[1].type == A.ARM_OP_MEM:
        mem = ops[1].mem
        if mem.index and st.get(mem.index, (None,))[0] == 'c' and st[mem.index][1] == OFF and m == 'ldr':
            new[ops[0].reg] = ('p', 0)
            if i.writeback: new[mem.base] = ('e', OFF)
        elif mem.index == 0 and mem.disp == OFF and m == 'ldr':
            new[ops[0].reg] = ('p', 0)
        elif mem.base in st and st[mem.base][0] == 'e' and mem.disp == 0 and m == 'ldr':
            new[ops[0].reg] = ('p', 0)
    elif m.startswith('add') and len(ops) == 3 and ops[1].type == A.ARM_OP_REG and ops[1].reg in st and st[ops[1].reg][0] in ('p', 'pv'):
        if ops[2].type == A.ARM_OP_IMM: new[ops[0].reg] = (st[ops[1].reg][0], st[ops[1].reg][1] + ops[2].imm)
        else: new[ops[0].reg] = ('pv', st[ops[1].reg][1])
    # report memory ops through ctl pointers
    for o in ops:
        if o.type == A.ARM_OP_MEM and o.mem.base in st and st[o.mem.base][0] in ('p', 'pv'):
            kind, k = st[o.mem.base]
            idx = (' +' + rn(o.mem.index)) if o.mem.index else ''
            print('%08x  %-7s %-28s ctl%s+%#x%s%s' % (i.address, m, i.op_str, '' if kind == 'p' else '+var', k + o.mem.disp, idx, ' WB' if i.writeback else ''))
    if m.startswith(('stm', 'push', 'vstm')) and ops and ops[0].type == A.ARM_OP_REG and ops[0].reg in st and st[ops[0].reg][0] in ('p','pv'):
        print('%08x  %-7s %-28s ctl+%#x (multi)' % (i.address, m, i.op_str, st[ops[0].reg][1]))
    for r in w:
        st.pop(r, None)
    st.update(new)
    if m in ('bl', 'blx'):
        for r in (A.ARM_REG_R0, A.ARM_REG_R1, A.ARM_REG_R2, A.ARM_REG_R3, A.ARM_REG_R12): st.pop(r, None)
    if m in ('b', 'bx') or m.startswith('pop'): st = {}

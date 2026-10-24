"""Symbolic base+offset scan: every STORE whose address is (some base register) + offset in [LO, HI),
every pointer (base + offset in [LO - PAD, HI)) passed to a call in r0..r3 or stored outside the stack,
and every store through such a pointer with an unknown index.

Registers carry (base_token, offset) or ('#', const).  Tokens: 'rN@fnstart' at a push {.., lr},
'ld@addr' for a load result, 'ret@addr' for a call result, 'SP' for the stack pointer.  Stack spills
are tracked by SP offset (so `str r3,[sp,#0x48]` ... `ldr r2,[sp,#0x48]` carries the pointer).
Linear sweep: the state flows through branches in address order (over-approximation), reset at a
push that saves lr (a function start).

usage: symscan.py LO HI band_lo band_hi [band_lo band_hi ...]
"""
import sys, struct
import capstone
from capstone import arm as A

TEXT = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
md.detail = True
M32 = 0xffffffff

LO, HI = int(sys.argv[1], 0), int(sys.argv[2], 0)
import os
PAD = int(os.environ.get("PAD", "0x40"), 0)
bands = [(int(sys.argv[i], 0), int(sys.argv[i + 1], 0)) for i in range(3, len(sys.argv), 2)]

STORES = {A.ARM_INS_STR, A.ARM_INS_STRB, A.ARM_INS_STRH, A.ARM_INS_STRD, A.ARM_INS_VSTR, A.ARM_INS_STREX,
          A.ARM_INS_STRBT, A.ARM_INS_STRHT, A.ARM_INS_STRT}
MSTORES = {A.ARM_INS_STM, A.ARM_INS_STMDA, A.ARM_INS_STMDB, A.ARM_INS_STMIB, A.ARM_INS_VSTMIA, A.ARM_INS_VSTMDB,
           A.ARM_INS_PUSH, A.ARM_INS_VPUSH}
VST = {getattr(A, n) for n in dir(A) if n.startswith('ARM_INS_VST') and n not in ('ARM_INS_VSTR', 'ARM_INS_VSTMIA', 'ARM_INS_VSTMDB')}
LOADS = {A.ARM_INS_LDR, A.ARM_INS_LDRB, A.ARM_INS_LDRH, A.ARM_INS_LDRSB, A.ARM_INS_LDRSH, A.ARM_INS_LDRD,
         A.ARM_INS_VLDR, A.ARM_INS_LDREX}

hits = []


def width(ins):
    i = ins.id
    if i in (A.ARM_INS_STRB, A.ARM_INS_STRBT): return 1
    if i in (A.ARM_INS_STRH, A.ARM_INS_STRHT): return 2
    if i == A.ARM_INS_STRD: return 8
    if i == A.ARM_INS_VSTR:
        r = ins.reg_name(ins.operands[0].reg)
        return 8 if r.startswith('d') else 4
    return 4


def inwin(off, w=1):
    return off < HI and off + w > LO


def interesting_ptr(v):
    return v and v[0] not in ('#', 'SP') and LO - PAD <= v[1] < HI


def scan(lo, hi):
    R = {}
    stack = {}

    def get(r):
        if r == 'pc':
            return None
        return R.get(r)

    def reset(addr):
        R.clear(); stack.clear()
        for n in ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'sb', 'sl', 'fp', 'ip']:
            R[n] = ('%s@%x' % (n, addr), 0)
        R['sp'] = ('SP', 0)

    def shifted(op, v):
        if v is None: return None
        st, sv = op.shift.type, op.shift.value
        if st == 0 or sv == 0:
            return v
        if v[0] != '#':
            return None
        c = v[1]
        if st == A.ARM_SFT_LSL: return ('#', (c << sv) & M32)
        if st == A.ARM_SFT_LSR: return ('#', (c >> sv) & M32)
        if st == A.ARM_SFT_ASR:
            s = c - (1 << 32) if c & 0x80000000 else c
            return ('#', (s >> sv) & M32)
        return None

    def opval(op):
        if op.type == A.ARM_OP_IMM:
            return ('#', op.imm & M32)
        if op.type == A.ARM_OP_REG:
            return shifted(op, get(md.reg_name(op.reg)))
        return None

    def addv(a, b, neg=False):
        if a is None or b is None: return None
        if neg:
            if b[0] != '#': return None
            return (a[0], (a[1] - b[1]) & M32 if a[0] == '#' else a[1] - (b[1] if b[1] < 0x80000000 else b[1] - (1 << 32)))
        if a[0] == '#' and b[0] == '#': return ('#', (a[1] + b[1]) & M32)
        if a[0] == '#': a, b = b, a
        if b[0] != '#': return None
        c = b[1] if b[1] < 0x80000000 else b[1] - (1 << 32)
        return (a[0], a[1] + c)

    def memaddr(ins, mop):
        base = md.reg_name(mop.mem.base)
        if base == 'pc':
            return ('#', (ins.address + 8 + mop.mem.disp) & M32), None
        bv = get(base)
        if mop.mem.index:
            iv = get(md.reg_name(mop.mem.index))
            if iv is not None and iv[0] == '#':
                st = mop.shift.type; sv = mop.shift.value
                c = iv[1]
                if st == A.ARM_SFT_LSL and sv: c = (c << sv) & M32
                elif st and sv: return None, bv
                return addv(bv, ('#', c), neg=mop.subtracted), bv
            return None, bv
        d = mop.mem.disp
        if mop.subtracted and d > 0: d = -d
        return addv(bv, ('#', d & M32)), bv

    def report(kind, ins, extra):
        hits.append((ins.address, kind, '%s %s' % (ins.mnemonic, ins.op_str), extra))

    a = lo
    reset(lo)
    while a < hi:
        for ins in md.disasm(TEXT[a:hi], a):
            a = ins.address + 4
            i = ins.id
            ops = ins.operands
            cond = ins.cc not in (A.ARM_CC_AL, A.ARM_CC_INVALID)
            try:
                # function start
                if i in (A.ARM_INS_PUSH,) or (i == A.ARM_INS_STMDB and ins.writeback and md.reg_name(ops[0].reg) == 'sp'):
                    regs = [md.reg_name(o.reg) for o in (ops if i == A.ARM_INS_PUSH else ops[1:])]
                    reset(ins.address)   # v2: any push of core registers starts a function
                    R['sp'] = addv(R.get('sp'), ('#', 4 * len(regs)), neg=True)
                    continue
                if i in STORES:
                    mi = [k for k, o in enumerate(ops) if o.type == A.ARM_OP_MEM][0]
                    mop = ops[mi]
                    addr, bv = memaddr(ins, mop)
                    w = width(ins)
                    srcs = [md.reg_name(o.reg) for o in ops[:mi] if o.type == A.ARM_OP_REG]
                    post = len(ops) > mi + 1
                    eff = bv if post else addr
                    if eff is not None and eff[0] not in ('#', 'SP') and inwin(eff[1], w):
                        report('STORE', ins, '%s+0x%x w%d' % (eff[0], eff[1], w))
                    if eff is None and bv is not None and bv[0] not in ('#', 'SP') and LO - 0x10000 <= bv[1] < HI + 0x10000 and mop.mem.index:
                        report('STORE?idx', ins, 'base %s+0x%x, index unknown' % bv)
                    for k, s in enumerate(srcs):
                        sv = get(s)
                        if eff is not None and eff[0] == 'SP':
                            if not i == A.ARM_INS_VSTR:
                                stack[eff[1] + 4 * k] = sv
                        elif interesting_ptr(sv) and i != A.ARM_INS_VSTR:
                            report('ESCAPE', ins, '%s = %s+0x%x stored at %s' % (s, sv[0], sv[1], eff and ('%s+0x%x' % eff)))
                    # writeback
                    if ins.writeback or post:
                        bn = md.reg_name(mop.mem.base)
                        if post:
                            R[bn] = addv(bv, opval(ops[mi + 1]), neg=ops[mi + 1].subtracted)
                        else:
                            R[bn] = addr
                    continue
                if i in MSTORES or i in VST:
                    if i in VST:
                        mops = [o for o in ops if o.type == A.ARM_OP_MEM]
                        bn = md.reg_name(mops[0].mem.base); bv = get(bn)
                        if bv and bv[0] not in ('#', 'SP') and inwin(bv[1], 16):
                            report('STORE', ins, '%s+0x%x (vst)' % bv)
                        if ins.writeback: R[bn] = None
                        continue
                    bn = md.reg_name(ops[0].reg); bv = get(bn)
                    regs = [md.reg_name(o.reg) for o in ops[1:]]
                    n = len(regs) * (8 if regs and regs[0].startswith('d') else 4)
                    if i in (A.ARM_INS_STM, A.ARM_INS_VSTMIA): st = 0
                    elif i == A.ARM_INS_STMIB: st = 4
                    elif i in (A.ARM_INS_STMDB, A.ARM_INS_VSTMDB): st = -n
                    else: st = -n + 4
                    if bv and bv[0] not in ('#', 'SP') and inwin(bv[1] + st, n):
                        report('STORE', ins, '%s+0x%x..+%d (stm)' % (bv[0], bv[1] + st, n))
                    for r in regs:
                        if interesting_ptr(get(r)) and not (bv and bv[0] == 'SP'):
                            report('ESCAPE', ins, '%s stm' % r)
                    if ins.writeback:
                        R[bn] = addv(bv, ('#', n), neg=(st < 0))
                    continue
                if i in LOADS:
                    mi = [k for k, o in enumerate(ops) if o.type == A.ARM_OP_MEM][0]
                    mop = ops[mi]
                    addr, bv = memaddr(ins, mop)
                    post = len(ops) > mi + 1
                    eff = bv if post else addr
                    dsts = [md.reg_name(o.reg) for o in ops[:mi] if o.type == A.ARM_OP_REG]
                    if ins.writeback or post:
                        bn = md.reg_name(mop.mem.base)
                        if post:
                            R[bn] = addv(bv, opval(ops[mi + 1]), neg=ops[mi + 1].subtracted)
                        else:
                            R[bn] = addr
                    if i == A.ARM_INS_VLDR:
                        continue
                    for k, dn in enumerate(dsts):
                        if eff is not None and eff[0] == '#' and md.reg_name(mop.mem.base) == 'pc' and i == A.ARM_INS_LDR:
                            off = eff[1]
                            R[dn] = ('#', struct.unpack('<I', TEXT[off:off + 4])[0]) if off + 4 <= len(TEXT) else None
                        elif eff is not None and eff[0] == 'SP' and i == A.ARM_INS_LDR:
                            R[dn] = stack.get(eff[1] + 4 * k)
                        else:
                            R[dn] = ('ld@%x' % ins.address, 0)
                    continue
                if i in (A.ARM_INS_LDM, A.ARM_INS_POP, A.ARM_INS_LDMDB, A.ARM_INS_LDMIB, A.ARM_INS_LDMDA, A.ARM_INS_VPOP, A.ARM_INS_VLDMIA, A.ARM_INS_VLDMDB):
                    regs = [md.reg_name(o.reg) for o in ops if o.type == A.ARM_OP_REG]
                    if i == A.ARM_INS_POP:
                        R['sp'] = addv(R.get('sp'), ('#', 4 * len(regs)))
                        # v2: an epilogue (often `pop {r4, lr}; b tail`) does not end the code laid out after
                        # it, whose blocks still see the function's callee-saved registers: keep them; the
                        # scratch registers get fresh tokens (any base is reported, so a leaf's r0 still counts)
                        for r in ('r0', 'r1', 'r2', 'r3', 'ip'):
                            R[r] = ('%s@%x' % (r, ins.address), 0)
                    else:
                        for r in regs[1:]: R[r] = None
                        if ins.writeback: R[regs[0]] = None
                    continue
                if i in (A.ARM_INS_BL, A.ARM_INS_BLX):
                    for r in ('r0', 'r1', 'r2', 'r3'):
                        v = get(r)
                        if interesting_ptr(v):
                            report('ARG', ins, '%s = %s+0x%x' % (r, v[0], v[1]))
                    for r in ('r0', 'r1', 'r2', 'r3', 'ip', 'lr'):
                        R[r] = None
                    R['r0'] = ('ret@%x' % ins.address, 0)
                    continue
                if i in (A.ARM_INS_MOV, A.ARM_INS_MOVW) and len(ops) == 2:
                    d = md.reg_name(ops[0].reg)
                    v = opval(ops[1])
                    if d == 'sp' and v is None: v = R.get('sp')
                    R[d] = None if (cond and R.get(d) != v) else v
                    continue
                if i == A.ARM_INS_MVN and len(ops) == 2 and ops[1].type == A.ARM_OP_IMM:
                    R[md.reg_name(ops[0].reg)] = None if cond else ('#', ~ops[1].imm & M32)
                    continue
                if i == A.ARM_INS_MOVT:
                    d = md.reg_name(ops[0].reg); v = get(d)
                    R[d] = ('#', (v[1] & 0xffff) | ((ops[1].imm & 0xffff) << 16)) if v and v[0] == '#' and not cond else None
                    continue
                if i in (A.ARM_INS_ADD, A.ARM_INS_SUB, A.ARM_INS_RSB) and ops and ops[0].type == A.ARM_OP_REG:
                    d = md.reg_name(ops[0].reg)
                    if len(ops) == 3:
                        x, y = ops[1], ops[2]
                    else:
                        x, y = ops[0], ops[1]
                    if x.type == A.ARM_OP_REG and md.reg_name(x.reg) == 'pc':
                        yv = opval(y)
                        v = ('#', (ins.address + 8 + yv[1]) & M32) if yv and yv[0] == '#' else None
                    else:
                        xv, yv = opval(x), opval(y)
                        if i == A.ARM_INS_ADD: v = addv(xv, yv)
                        elif i == A.ARM_INS_SUB: v = addv(xv, yv, neg=True)
                        else: v = addv(yv, xv, neg=True) if xv and xv[0] == '#' else (('#', (yv[1] - xv[1]) & M32) if yv and xv and yv[0] == '#' == xv[0] else None)
                    if d == 'sp' and v is None:
                        v = R.get('sp')
                    R[d] = None if (cond and R.get(d) != v) else v
                    continue
                # generic: clobber written registers
                try:
                    _, wr = ins.regs_access()
                    for r in wr:
                        n = md.reg_name(r)
                        if n != 'sp' and n != 'pc':
                            R[n] = None
                except Exception:
                    pass
            except Exception as ex:
                report('ERR', ins, repr(ex))
        else:
            pass
        if a < hi:
            # an undecodable word: skip it
            a = (a + 4) if not hits or True else a
            # if the loop broke on a data word, the for-loop ended without advancing past it
        # make sure we progress past a data word
    return


def run():
    for lo, hi in bands:
        scan(lo, hi)


run()
for h in sorted(set(hits)):
    print('%08x  %-9s %-40s %s' % h)

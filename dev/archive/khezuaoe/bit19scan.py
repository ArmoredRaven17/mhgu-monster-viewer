# khezuaoe/bit19scan.py (Khezu AoE lane, 2026-10-27): every reader of P+0x1a8 bit 19 (0x80000) in main.text.
#   python dev/archive/khezuaoe/bit19scan.py [lo hi] > bit19scan.out
# Finds every load that can reach the word P+0x1a8 (ldr #0x1a8; ldrb #0x1aa; ldrh/ldrsh/ldrd via a register offset;
# a base left by `[rB, #0x1a8]!` writeback or `add rB, rX, #0x1a8` / #0x1a0 / #0x1a4 / #0x1aa then [rB, #k] or ldm rB),
# then follows the loaded register straight-line (fall-through, up to 48 instructions, both arms of a conditional
# ignored) with a bit-position model: original bit 19 sits at position p (lsl / lsr / asr / ror / ubfx / sbfx / and
# masks move or drop it). A USE is reported when bit 19's position is inside the operand mask of tst / ands / and /
# bics / bic / teq / cmp (against a mask held as an immediate or a movw/movt register constant), a movs/lsls that puts
# it in N or C, or when the register is stored (a copy) or passed to a call (r0..r3 at a bl / blx).
# Positive control: 0xbd1c8 (the stamina updater, `and r0, r0, r8(0x80001)`; cmp #1) and 0xbd0e4 must be listed.
import sys, struct, capstone
from capstone import arm as A
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.detail = True
lo = int(sys.argv[1], 16) if len(sys.argv) > 1 else 0
hi = int(sys.argv[2], 16) if len(sys.argv) > 2 else len(T) & ~3
BIT = 19

def ins_at(a):
    for i in md.disasm(T[a:a+4], a): return i
    return None

def rname(r): return md.reg_name(r) if r else None

# 1. seeds: raw-encoding prefilter, then decode
seeds = []   # (addr, kind, info)
for a in range(lo, hi, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w >> 28) == 0xf: continue
    op = (w >> 25) & 7
    hit = False
    if op in (2,) and (w & (1 << 20)):                    # LDR/LDRB immediate
        imm = w & 0xfff; byte = (w >> 22) & 1
        if (not byte and imm == 0x1a8) or (byte and 0x1a8 <= imm <= 0x1ab): hit = True
    elif op == 1 and ((w >> 21) & 0xf) in (4, 2) and (w & 0xfff) in (0x1a8, 0x1a0, 0x1a4, 0x1aa, 0x1a9, 0x1ab):  # add/sub imm (rot 0)
        hit = True
    elif op == 1 and ((w >> 20) & 0xff) in (0x30, 0x34) :  # movw / movt
        imm16 = ((w >> 4) & 0xf000) | (w & 0xfff)
        if ((w >> 20) & 0xff) == 0x30 and imm16 in (0x1a8, 0x1aa, 0x1a9, 0x1ab, 0x1a0, 0x1a4): hit = True
    if hit:
        i = ins_at(a)
        if i: seeds.append(i)

def const_regs_before(a, n=12):
    """movw/movt/mov constants established in the n words before a (straight-line, I)."""
    c = {}
    for b in range(max(0, a - 4 * n), a, 4):
        i = ins_at(b)
        if not i: continue
        ops = i.operands
        if i.mnemonic == 'movw' and len(ops) == 2: c[ops[0].reg] = ops[1].imm & 0xffff
        elif i.mnemonic == 'movt' and len(ops) == 2 and ops[0].reg in c: c[ops[0].reg] = (c[ops[0].reg] & 0xffff) | ((ops[1].imm & 0xffff) << 16)
        elif i.mnemonic == 'mov' and len(ops) == 2 and ops[1].type == A.ARM_OP_IMM: c[ops[0].reg] = ops[1].imm & 0xffffffff
        else:
            for r in i.regs_access()[1]:
                if r in c and not (i.mnemonic == 'movt'): c.pop(r, None)
    return c

def follow(start, regs, consts, label, out, depth=0):
    """regs: {reg: (pos, keepmask_over_original_bits)} pos = where original bit 19 now sits (None = dropped)."""
    a = start
    for _ in range(48):
        i = ins_at(a)
        if not i or not regs: return
        m = i.mnemonic; ops = i.operands
        base_m = m.rstrip('s') if m not in ('bics', 'ands', 'movs', 'lsls', 'lsrs', 'asrs') else m
        rd_ = ops[0].reg if ops and ops[0].type == A.ARM_OP_REG else None
        # constants
        if m == 'movw' and len(ops) == 2: consts[rd_] = ops[1].imm & 0xffff
        if m == 'movt' and len(ops) == 2: consts[rd_] = (consts.get(rd_, 0) & 0xffff) | ((ops[1].imm & 0xffff) << 16)
        def opmask(o):
            if o.type == A.ARM_OP_IMM: return o.imm & 0xffffffff
            if o.type == A.ARM_OP_REG and o.shift.type == 0 and o.reg in consts: return consts[o.reg]
            return None
        srcs = [o.reg for o in (ops if m in ('tst', 'teq', 'cmp', 'cmn') else ops[1:]) if o.type == A.ARM_OP_REG]
        tracked = [r for r in srcs if r in regs]
        if m.startswith('b') and m not in ('bic', 'bics', 'bfc', 'bfi'):
            if m in ('bl', 'blx'):
                for r in (A.ARM_REG_R0, A.ARM_REG_R1, A.ARM_REG_R2, A.ARM_REG_R3):
                    if r in regs and regs[r][0] is not None:
                        out.append((label, a, 'CALL-ARG %s (bit at %d) %s %s' % (rname(r), regs[r][0], m, i.op_str)))
                for r in (A.ARM_REG_R0, A.ARM_REG_R1, A.ARM_REG_R2, A.ARM_REG_R3, A.ARM_REG_R12, A.ARM_REG_LR): regs.pop(r, None)
                a += 4; continue
            if m in ('b', 'bx') and i.cc == A.ARM_CC_AL:
                if m == 'b' and ops and ops[0].type == A.ARM_OP_IMM and depth < 2:
                    follow(ops[0].imm, dict(regs), dict(consts), label, out, depth + 1)
                return
            if m == 'bx': return
            # conditional branch: follow the taken arm too (shallow)
            if ops and ops[0].type == A.ARM_OP_IMM and depth < 2:
                follow(ops[0].imm, dict(regs), dict(consts), label, out, depth + 1)
            a += 4; continue
        if m in ('pop',) and any(o.reg == A.ARM_REG_PC for o in ops): return
        if m in ('ldm', 'pop') and ops and any(o.reg == A.ARM_REG_PC for o in ops): return
        if tracked:
            r = tracked[0]; pos, keep = regs[r]
            if pos is None: pass
            elif m in ('tst', 'ands', 'and', 'bics', 'bic', 'teq', 'cmp', 'cmn', 'orr', 'orrs', 'eor', 'eors') and len(ops) >= 2:
                other = [o for o in ops[(0 if m in ('tst', 'teq', 'cmp', 'cmn') else 1):] if not (o.type == A.ARM_OP_REG and o.reg == r)]
                mk = opmask(other[-1]) if other else None
                if m in ('tst', 'ands', 'bics', 'teq'):
                    tag = 'TEST' if (mk is None or (mk >> pos) & 1) else 'test-other'
                    out.append((label, a, '%s %s %s (bit at %d, mask %s)' % (tag, m, i.op_str, pos, hex(mk) if mk is not None else '?')))
                    if m in ('ands',):
                        if mk is not None and not (mk >> pos) & 1: regs[rd_] = (None, 0)
                        else: regs[rd_] = (pos, keep)
                    elif m == 'bics':
                        regs[rd_] = (None, 0) if (mk is not None and (mk >> pos) & 1) else (pos, keep)
                elif m == 'cmp' or m == 'cmn':
                    out.append((label, a, 'CMP %s %s (bit at %d, value %s)' % (m, i.op_str, pos, hex(mk) if mk is not None else '?')))
                elif m == 'and':
                    if mk is not None and not (mk >> pos) & 1: regs[rd_] = (None, 0)
                    else:
                        regs[rd_] = (pos, keep); out.append((label, a, 'MASK %s %s (bit at %d, mask %s)' % (m, i.op_str, pos, hex(mk) if mk is not None else '?')))
                elif m == 'bic':
                    regs[rd_] = (None, 0) if (mk is not None and (mk >> pos) & 1) else (pos, keep)
                    out.append((label, a, 'BIC %s %s' % (m, i.op_str)))
                else:   # orr / eor: value carried (a re-store is a setter)
                    regs[rd_] = (pos, keep)
                    out.append((label, a, 'MODIFY %s %s' % (m, i.op_str)))
            elif m in ('lsl', 'lsls', 'lsr', 'lsrs', 'asr', 'asrs', 'ror', 'rors') and len(ops) == 3 and ops[2].type == A.ARM_OP_IMM:
                s = ops[2].imm
                np_ = pos + s if m.startswith('lsl') else pos - s
                if m.startswith('asr') and np_ < 0: np_ = None
                if m.startswith('ror'): np_ = (pos - s) % 32
                if np_ is not None and not (0 <= np_ < 32): np_ = None
                regs[rd_] = (np_, keep)
                if m.endswith('s') and np_ is not None:
                    out.append((label, a, 'FLAGS %s %s (bit now at %d%s)' % (m, i.op_str, np_, ' = N' if np_ == 31 else '')))
                if m.endswith('s') and np_ is None and m.startswith('lsl') and pos + s == 32:
                    out.append((label, a, 'FLAGS %s %s (bit -> C)' % (m, i.op_str)))
            elif m in ('mov', 'movs') and len(ops) == 2 and ops[1].type == A.ARM_OP_REG:
                sh = ops[1].shift
                p2 = pos
                if sh.type == A.ARM_SFT_LSL: p2 = pos + sh.value
                elif sh.type in (A.ARM_SFT_LSR, A.ARM_SFT_ASR): p2 = pos - sh.value
                if not (0 <= p2 < 32): p2 = None
                regs[rd_] = (p2, keep)
                if m == 'movs': out.append((label, a, 'FLAGS movs %s (bit now at %s)' % (i.op_str, p2)))
            elif m in ('ubfx', 'sbfx') and len(ops) == 4:
                lsb, w = ops[2].imm, ops[3].imm
                regs[rd_] = ((pos - lsb), keep) if lsb <= pos < lsb + w else (None, 0)
                out.append((label, a, '%s %s %s (bit 19 %s)' % ('EXTRACT' if lsb <= pos < lsb + w else 'extract-other', m, i.op_str, 'kept' if lsb <= pos < lsb + w else 'dropped')))
            elif m.startswith('str') or m in ('stm', 'stmdb', 'push', 'vmov'):
                if ops[0].type == A.ARM_OP_REG and ops[0].reg == r or m in ('stm', 'stmdb', 'push'):
                    out.append((label, a, 'STORE %s %s' % (m, i.op_str)))
            elif m in ('add', 'sub', 'mul', 'vmov', 'uxtb', 'uxth', 'sxtb', 'sxth', 'clz', 'rbit'):
                out.append((label, a, 'ARITH %s %s' % (m, i.op_str)))
                if m in ('uxtb', 'sxtb'): regs[rd_] = (None, 0) if pos >= 8 else (pos, keep)
                elif m in ('uxth', 'sxth'): regs[rd_] = (None, 0) if pos >= 16 else (pos, keep)
                else: regs.pop(rd_, None)
            else:
                out.append((label, a, 'OTHER %s %s' % (m, i.op_str)))
        # kill overwritten registers (not tracked results set above)
        w = i.regs_access()[1]
        for r in w:
            if r in regs and not tracked and not (m.startswith('str') or m in ('tst', 'cmp', 'teq', 'cmn')):
                regs.pop(r, None)
        if m.startswith('ldr') and rd_ in regs and not tracked: regs.pop(rd_, None)
        a += 4

out = []
seen = set()
def seed_load(i, offset_within):
    """A load of P+0x1a8 (word, byte at +2, ...) into ops[0]; offset_within = byte offset of the loaded unit in the word."""
    m = i.mnemonic; ops = i.operands; rd_ = ops[0].reg
    width = 4 if m in ('ldr', 'ldrd', 'ldrex') else 2 if m in ('ldrh', 'ldrsh') else 1
    pos = BIT - 8 * offset_within
    if not (0 <= pos < 8 * width):
        return
    regs = {rd_: (pos, 0)}
    follow(i.address + 4, regs, const_regs_before(i.address), '%08x %s %s' % (i.address, m, i.op_str), out)

ptrs = []   # (addr, reg, delta) : reg = base + delta where base+0x1a8 is the word
for i in seeds:
    m = i.mnemonic; ops = i.operands
    if m.startswith('ldr') and len(ops) >= 2 and ops[1].type == A.ARM_OP_MEM:
        disp = ops[1].mem.disp
        if ops[1].mem.index == 0:
            if m == 'ldr' and disp == 0x1a8: seed_load(i, 0)
            elif m in ('ldrb', 'ldrsb') and 0x1a8 <= disp <= 0x1ab: seed_load(i, disp - 0x1a8)
            if i.writeback and disp in (0x1a8,): ptrs.append((i.address + 4, ops[1].mem.base, 0x1a8))
    elif m in ('add', 'sub') and len(ops) == 3 and ops[2].type == A.ARM_OP_IMM:
        d = ops[2].imm if m == 'add' else -ops[2].imm
        if d in (0x1a8, 0x1a0, 0x1a4, 0x1aa, 0x1a9, 0x1ab): ptrs.append((i.address + 4, ops[0].reg, d))
    elif m == 'movw':
        ptrs.append((i.address + 4, ('idx', ops[0].reg), ops[1].imm))

# 2. pointer / index registers: [rB, #k] with base + k == 0x1a8.., or [rX, rIdx] with rIdx = 0x1a8..
nptr = 0
for (a0, reg, d) in ptrs:
    a = a0
    for _ in range(40):
        i = ins_at(a)
        if not i: break
        m = i.mnemonic; ops = i.operands
        if isinstance(reg, tuple):
            r = reg[1]
            if m.startswith('ldr') and len(ops) >= 2 and ops[-1].type == A.ARM_OP_MEM and ops[-1].mem.index == r:
                off = d - 0x1a8
                if 0 <= off < 4:
                    nptr += 1
                    if m in ('ldrh', 'ldrsh'): seed_load(i, off)
                    elif m in ('ldrd',): seed_load(i, off)
                    elif m in ('ldr',) and off == 0: seed_load(i, 0)
                    elif m in ('ldrb', 'ldrsb'): seed_load(i, off)
            if r in i.regs_access()[1]: break
        else:
            r = reg
            if m.startswith('ldr') and len(ops) >= 2 and ops[-1].type == A.ARM_OP_MEM and ops[-1].mem.base == r and ops[-1].mem.index == 0:
                tot = d + ops[-1].mem.disp
                if m == 'ldrd':
                    for k, o in enumerate(ops[:2]):
                        if tot + 4 * k == 0x1a8:
                            nptr += 1; regs = {o.reg: (BIT, 0)}
                            follow(a + 4, regs, const_regs_before(a), '%08x %s %s (ldrd)' % (a, m, i.op_str), out)
                elif 0x1a8 <= tot <= 0x1ab:
                    nptr += 1; seed_load(i, tot - 0x1a8)
            if m in ('ldm', 'ldmia') and ops[0].reg == r:
                for k, o in enumerate(ops[1:]):
                    if d + 4 * k == 0x1a8:
                        nptr += 1; follow(a + 4, {o.reg: (BIT, 0)}, {}, '%08x %s %s (ldm)' % (a, m, i.op_str), out)
            if m.startswith('ldr') and ops[0].reg == r: break
            if r in i.regs_access()[1] and not (m.startswith('ldr') and i.writeback): break
        if m in ('b', 'bx') and i.cc == A.ARM_CC_AL: break
        if m in ('bl', 'blx') and r in (A.ARM_REG_R0, A.ARM_REG_R1, A.ARM_REG_R2, A.ARM_REG_R3, A.ARM_REG_R12): break
        a += 4

done = set()
for label, a, what in out:
    k = (label, a, what)
    if k in done: continue
    done.add(k)
    print('%s  ->  %08x  %s' % (label, a, what))
print('# seeds %d, pointer-derived loads %d, uses %d' % (len(seeds), nptr, len(done)), file=sys.stderr)

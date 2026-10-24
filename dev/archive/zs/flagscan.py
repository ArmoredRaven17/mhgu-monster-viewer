"""Which bits of a shell's flags word any code of its class tests. The scan is bounded to the class's own methods (every
vtable slot) and their transitive direct calls, walked as control-flow graphs (b / bxx followed, bl / blx #imm recorded as
callees), inside the given address window. Registers are tracked through the walk: a pointer to the word (`add rX, rB, #off`,
`movw rI, #off` + `ldr rD, [rB, rI]!` writeback, `add rX, rB, rI`), its loads (`ldr` / `ldrb` / `ldrh` [p, #k]) and direct
loads `[shell, rI]` / `[shell, #off]`; every tst / ands / bics / teq / and / cmp / lsl / lsr / ubfx / sbfx / bfc on a loaded value
is recorded with the word-relative bit mask it reads.
Usage: python flagscan.py <vtable> <nslots> <off> <lo> <hi>"""
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as A
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
from capstone.arm import ARM_OP_REG, ARM_OP_IMM, ARM_OP_MEM
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); md.detail = True
def rd(va):
    for base, data in ((A.RO_VA, A.RODATA), (A.DA_VA, A.DATA)):
        if base <= va < base + len(data): return struct.unpack_from('<I', data, va - base)[0]
    return None
def ins_at(a):
    for i in md.disasm(A.TEXT[a:a + 4], a): return i
    return None
VT, N, OFF, LO, HI = (int(x, 0) for x in sys.argv[1:6])
roots = [rd(VT + 4 * k) for k in range(N)]
roots = [r for r in roots if r and LO <= r < HI]
todo, funcs = list(dict.fromkeys(roots)), set()
TESTS = []
def walk(fn):
    # state per block: {reg: ('ptr', k) | ('val', k) | ('imm', v)}
    seen = set(); stack = [(fn, {})]
    while stack:
        a, st = stack.pop()
        while True:
            key = (a, tuple(sorted(((str(k2), v) for k2, v in st.items()))))
            if key in seen or not (LO <= a < HI): break
            seen.add(key)
            i = ins_at(a)
            if i is None: break
            ops = i.operands; mn = i.mnemonic; nm = lambda r: i.reg_name(r)
            dst = nm(ops[0].reg) if ops and ops[0].type == ARM_OP_REG else None
            new = dict(st)
            base_mn = mn.rstrip('sb') if False else mn
            cond = i.cc not in (0, 15) if hasattr(i, 'cc') else False
            # immediates
            if mn in ('movw', 'mov') and len(ops) == 2 and ops[1].type == ARM_OP_IMM:
                new[dst] = ('imm', ops[1].imm & 0xffffffff)
            elif mn.startswith('mov') and len(ops) == 2 and ops[1].type == ARM_OP_REG and nm(ops[1].reg) in st:
                new[dst] = st[nm(ops[1].reg)]
            elif mn.startswith('add') and len(ops) == 3 and ops[2].type == ARM_OP_IMM and ops[2].imm == OFF:
                new[dst] = ('ptr', 0)
            elif mn.startswith('add') and len(ops) == 3 and ops[2].type == ARM_OP_REG and st.get(nm(ops[2].reg)) == ('imm', OFF):
                new[dst] = ('ptr', 0)
            elif mn.startswith('add') and len(ops) == 3 and ops[2].type == ARM_OP_REG and st.get(nm(ops[1].reg)) == ('imm', OFF):
                new[dst] = ('ptr', 0)
            elif mn.startswith('ldr') and len(ops) >= 2 and ops[1].type == ARM_OP_MEM:
                m = ops[1].mem; b = nm(m.base) if m.base else None; ix = nm(m.index) if m.index else None
                width = 1 if mn.startswith('ldrb') or mn.startswith('ldrsb') else 2 if mn.startswith('ldrh') or mn.startswith('ldrsh') else 4
                k = None
                if b == 'sp' and not ix and ('sp', m.disp) in st:
                    new[dst] = st[('sp', m.disp)]; a += 4; st = new; continue
                if b in st and st[b][0] == 'ptr' and not ix: k = st[b][1] + m.disp
                elif ix and st.get(ix, ('',))[0] == 'imm' and OFF <= st[ix][1] < OFF + 4 and m.disp == 0: k = st[ix][1] - OFF
                elif not ix and m.disp == OFF: k = 0
                elif not ix and OFF <= m.disp < OFF + 4: k = m.disp - OFF
                if k is not None and 0 <= k < 4:
                    new[dst] = ('val', k)
                    if i.writeback and b: new[b] = ('ptr', k if ix else st.get(b, ('ptr', 0))[1] + m.disp if b in st else 0)
                    if i.writeback and ix and st.get(ix, ('',))[0] == 'imm': new[b] = ('ptr', st[ix][1] - OFF)
                elif dst in new: del new[dst]
            elif mn.startswith('str') and len(ops) >= 2 and ops[1].type == ARM_OP_MEM and nm(ops[1].mem.base) == 'sp' and not ops[1].mem.index:
                r0n = nm(ops[0].reg)
                if r0n in st: new[('sp', ops[1].mem.disp)] = st[r0n]
                else: new.pop(('sp', ops[1].mem.disp), None)
            else:
                # a test or extraction of a loaded value
                srcs = [nm(o.reg) for o in ops if o.type == ARM_OP_REG]
                vals = [s for s in srcs[1:] if st.get(s, ('',))[0] == 'val'] if mn not in ('tst', 'teq', 'cmp', 'cmn') else [s for s in srcs if st.get(s, ('',))[0] == 'val']
                if vals:
                    k = st[vals[0]][1]
                    imm = [o.imm & 0xffffffff for o in ops if o.type == ARM_OP_IMM]
                    sh = i.operands[-1].shift.value if i.operands and i.operands[-1].shift.type else 0
                    TESTS.append((hex(a), fn, mn, i.op_str, k, imm[0] if imm else None))
                    if mn.startswith(('lsl', 'lsr', 'asr', 'and', 'bic', 'orr', 'ubfx', 'sbfx', 'bfc')) and dst:
                        new[dst] = ('val', k)          # (a derived value: its later tests are recorded too, with the op chain)
                elif dst and dst in new and mn not in ('tst', 'teq', 'cmp', 'cmn', 'str', 'strb', 'strh', 'push', 'stm'):
                    del new[dst]
            # control flow
            if mn == 'bl' or mn == 'blx':
                if ops and ops[0].type == ARM_OP_IMM:
                    t = ops[0].imm
                    if LO <= t < HI and t not in funcs: todo.append(t)
                for r in ('r0', 'r1', 'r2', 'r3', 'r12', 'lr'): new.pop(r, None)
                a += 4; st = new; continue
            if mn.startswith('b') and not mn.startswith(('bic', 'bfc', 'bfi', 'bkpt')) and ops and ops[0].type == ARM_OP_IMM:
                t = ops[0].imm
                if mn == 'b': a = t; st = new; continue
                stack.append((t, dict(new))); a += 4; st = new; continue
            if mn in ('bx',) or (mn.startswith('pop') and 'pc' in i.op_str) or (mn.startswith('ldm') and 'pc' in i.op_str):
                if mn == 'bx' or i.cc in (0, 15): break
            if mn.startswith('add') and 'pc, ' in i.op_str and i.op_str.startswith('pc'):
                # a jump table (add pc, rX, rY): its offsets follow the `add rY, pc, #4` -- take every case until a non-offset word
                tb = a + 4
                for kk in range(64):
                    w = struct.unpack_from('<I', A.TEXT, tb + 4 * kk)[0]
                    if w >= 0x10000: break
                    stack.append((tb + w, dict(new)))
                break
            a += 4; st = new
while todo:
    f = todo.pop()
    if f in funcs: continue
    funcs.add(f); walk(f)
print('functions', len(funcs))
masks = {}
for t in TESTS:
    a, fn, mn, ops, k, imm = t
    bits = (imm << (8 * k)) & 0xffffffff if imm is not None and mn in ('tst', 'ands', 'and', 'bics', 'bic', 'teq', 'cmp') else None
    print(a, hex(fn), mn, ops, 'byte', k, 'mask', hex(bits) if bits is not None else '-')
    if bits is not None: masks[bits] = masks.get(bits, 0) | 1
print('bits tested:', ' '.join(hex(b) for b in sorted(masks)))

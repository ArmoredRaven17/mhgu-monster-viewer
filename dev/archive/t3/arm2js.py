# arm2js.py -- the LINE-BY-LINE transcription of the type-3 contact routine 0x7dc9a0 and its callees into JS: every reachable
# instruction becomes one JS statement under its own address label, the float registers a Float32Array (every write rounds to f32,
# as the VFP does), vmla / vmls unfused (the product rounded, then the sum), the flags from vcmpe / cmp, the stack and the caller's
# blocks in a DataView heap, the axis constants of the BSS (0x19176e0 X / 0x19176f0 Y / 0x1917700 Z, written by the static
# initialiser 0x7c4708..0x7c473c) as a table. Output: the generated block of docs/render/hit-type3.js (between the markers).
#   python arm2js.py > rom_t3.js
import sys, re, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT; D = armdis.DATA
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
FN = [0x167f70, 0x7dda24, 0x7dc9a0, 0x806ce4, 0x7db964, 0x7ebfd8, 0x80017c, 0x80448c, 0x8060ac, 0x8069d8]
SQRT = 0x13ecc14
TRACE = len(sys.argv) > 1 and sys.argv[1] == 'trace'
COND = {'eq': 'Z', 'ne': '!Z', 'hs': 'C', 'cs': 'C', 'lo': '!C', 'cc': '!C', 'mi': 'N', 'pl': '!N', 'vs': 'V', 'vc': '!V',
        'hi': '(C && !Z)', 'ls': '(!C || Z)', 'ge': '(N === V)', 'lt': '(N !== V)', 'gt': '(!Z && N === V)', 'le': '(Z || N !== V)', '': None}
RN = {'sb': 9, 'sl': 10, 'fp': 11, 'ip': 12, 'sp': 13, 'lr': 14, 'pc': 15}
def rn(x):
    x = x.strip()
    if x in RN: return RN[x]
    assert re.match(r'^r\d+$', x), x
    return int(x[1:])
def sn(x):
    x = x.strip(); assert re.match(r'^s\d+$', x), x
    return int(x[1:])
def imm(x):
    x = x.strip(); assert x.startswith('#'), x
    return int(x[1:], 0)
def f32lit(a): return struct.unpack_from('<f', T, a)[0]
def u32lit(a): return struct.unpack_from('<I', T, a)[0]
def jsf(v):
    if v != v: return 'NaN'
    if v in (float('inf'), float('-inf')): return ('-' if v < 0 else '') + 'Infinity'
    return repr(float(v))
def split_cond(m, bases):
    for b in sorted(bases, key=len, reverse=True):
        if m.startswith(b):
            rest = m[len(b):]
            if rest in COND: return b, rest
    return None, None
def walk(a):
    seen = {}; todo = [a]
    while todo:
        p = todo.pop()
        while p not in seen:
            i = next(md.disasm(T[p:p+4], p)); seen[p] = i
            m, o = i.mnemonic, i.op_str
            if m == 'pop' and 'pc' in o: break
            if m == 'bx' and o == 'lr': break
            mm = re.match(r'^b(eq|ne|hs|lo|mi|pl|vs|vc|hi|ls|ge|lt|gt|le|cs|cc)?$', m)
            if mm and o.startswith('#'):
                t = int(o[1:], 16)
                if not mm.group(1): p = t; continue
                todo.append(t)
            p += 4
    return seen
def mem_operand(o):
    # '[rB, #off]' / '[rB]' / '[rB, #off]!' / '[rB], #off' / '[rB, rO]'
    m = re.match(r'^\[(\w+)(?:, #(-?0x[0-9a-f]+|-?\d+))?\](!?)(?:, #(-?0x[0-9a-f]+|-?\d+))?$', o.strip())
    if not m: return None
    return rn(m.group(1)), int(m.group(2), 0) if m.group(2) else 0, m.group(3) == '!', int(m.group(4), 0) if m.group(4) else None
def gen(a):
    I = walk(a)
    out = ['function F_%x(M){' % a, '  const R = M.R, S = M.S, DV = M.DV;', '  let pc = 0x%x;' % a, '  for (;;) switch (pc){']
    lastlit = {}
    for p in sorted(I):
        i = I[p]; m, o = i.mnemonic, i.op_str
        L = []
        def emit(s): L.append(s)
        # condition split
        base, cc = split_cond(m, ['vseleq.f32', 'vselge.f32', 'vmov.f32', 'vstr', 'vldr', 'movw', 'movt', 'mov', 'add', 'sub', 'ldr', 'str', 'ldrb', 'strb',
                                   'ldrd', 'strd', 'cmp', 'b', 'bl', 'eor', 'ands', 'pop', 'push', 'bx', 'bfc'])
        if m in ('vseleq.f32', 'vselge.f32'): base, cc = m, ''
        if base is None: base, cc = m, ''
        cond = COND[cc]
        ops = [x.strip() for x in re.split(r',(?![^\[]*\])(?![^{]*\})', o)] if o else []
        if base in ('vadd.f32', 'vsub.f32', 'vmul.f32', 'vdiv.f32'):
            d, n, k = sn(ops[0]), sn(ops[1]), sn(ops[2]); op = {'vadd.f32': '+', 'vsub.f32': '-', 'vmul.f32': '*', 'vdiv.f32': '/'}[base]
            emit('S[%d] = S[%d] %s S[%d];' % (d, n, op, k))
        elif base == 'vnmul.f32':
            d, n, k = sn(ops[0]), sn(ops[1]), sn(ops[2]); emit('S[%d] = -Math.fround(S[%d] * S[%d]);' % (d, n, k))
        elif base in ('vmla.f32', 'vmls.f32'):
            d, n, k = sn(ops[0]), sn(ops[1]), sn(ops[2])
            emit('S[%d] = S[%d] %s Math.fround(S[%d] * S[%d]);' % (d, d, '+' if base == 'vmla.f32' else '-', n, k))
        elif base == 'vsqrt.f32': emit('S[%d] = Math.sqrt(S[%d]);' % (sn(ops[0]), sn(ops[1])))
        elif base == 'vneg.f32': emit('S[%d] = -S[%d];' % (sn(ops[0]), sn(ops[1])))
        elif base == 'vabs.f32': emit('S[%d] = Math.abs(S[%d]);' % (sn(ops[0]), sn(ops[1])))
        elif base in ('vseleq.f32', 'vselge.f32'):
            c = 'M.Z' if base == 'vseleq.f32' else '(M.N === M.V)'
            emit('S[%d] = %s ? S[%d] : S[%d];' % (sn(ops[0]), c, sn(ops[1]), sn(ops[2])))
        elif base == 'vcmpe.f32':
            d = sn(ops[0]); rhs = '0' if ops[1] in ('#0', '#0.0') else 'S[%d]' % sn(ops[1])
            # vcmpe sets the FPSCR's flags (M.FP); only vmrs copies them to the APSR (M.N / Z / C / V)
            emit('{ const x = S[%d], y = %s; M.FP = (x !== x || y !== y) ? 3 : x < y ? 8 : x === y ? 6 : 2; }' % (d, rhs))
        elif base == 'vmrs': assert o == 'apsr_nzcv, fpscr'; emit('M.N = M.FP >> 3 & 1; M.Z = M.FP >> 2 & 1; M.C = M.FP >> 1 & 1; M.V = M.FP & 1;')
        elif base == 'vmov.f32':
            d = sn(ops[0])
            if ops[1].startswith('#'): emit('S[%d] = %s;' % (d, jsf(float(ops[1][1:]))))
            else: emit('S[%d] = S[%d];' % (d, sn(ops[1])))
        elif base == 'vmov':
            assert len(ops) == 2, (hex(p), o)
            if re.match(r'^s\d+$', ops[0]):
                emit('M.U[0] = R[%d]; S[%d] = M.F[0];' % (rn(ops[1]), sn(ops[0])))
            else:
                emit('M.F[0] = S[%d]; R[%d] = M.U[0];' % (sn(ops[1]), rn(ops[0])))
        elif base in ('vldr', 'vstr'):
            d = sn(ops[0])
            mo = mem_operand(ops[1])
            if mo and mo[0] == 15:
                lit = p + 8 + mo[1]
                assert base == 'vldr'
                emit('S[%d] = %s;  // [%#x]' % (d, jsf(f32lit(lit)), lit))
            else:
                b, off, wb, post = mo; assert not wb and post is None
                if base == 'vldr': emit('S[%d] = M.ldf((R[%d] + %d) >>> 0);' % (d, b, off))
                else: emit('M.stf((R[%d] + %d) >>> 0, S[%d]);' % (b, off, d))
        elif base == 'vpush':
            regs = re.findall(r'd(\d+)', o); n = len(regs); lo = int(regs[0])
            emit('R[13] = (R[13] - %d) >>> 0; for (let k = 0; k < %d; k++) M.stf(R[13] + 4 * k, S[%d + k]);' % (8 * n, 2 * n, 2 * lo))
        elif base == 'vpop':
            regs = re.findall(r'd(\d+)', o); n = len(regs); lo = int(regs[0])
            emit('for (let k = 0; k < %d; k++) S[%d + k] = M.ldf(R[13] + 4 * k); R[13] = (R[13] + %d) >>> 0;' % (2 * n, 2 * lo, 8 * n))
        elif base == 'push':
            regs = [rn(x) for x in o.strip('{}').split(',')]
            emit('R[13] = (R[13] - %d) >>> 0; %s' % (4 * len(regs), ' '.join('M.st32(R[13] + %d, R[%d]);' % (4 * k, r) for k, r in enumerate(regs))))
        elif base == 'pop':
            regs = [rn(x) for x in o.strip('{}').split(',')]
            s = ' '.join('R[%d] = M.ld32(R[13] + %d);' % (r, 4 * k) for k, r in enumerate(regs) if r != 15)
            s += ' R[13] = (R[13] + %d) >>> 0;' % (4 * len(regs))
            if 15 in regs: s += ' return;'
            emit(s)
        elif base == 'bx': assert o == 'lr'; emit('return;')
        elif base in ('mov', 'movw'):
            d = rn(ops[0])
            if ops[1].startswith('#'): emit('R[%d] = %d;' % (d, imm(ops[1]) & 0xffffffff))
            else: emit('R[%d] = R[%d];' % (d, rn(ops[1])))
        elif base == 'movt': emit('R[%d] = ((R[%d] & 0xffff) | (%d << 16)) >>> 0;' % (rn(ops[0]), rn(ops[0]), imm(ops[1])))
        elif base in ('add', 'sub', 'eor'):
            d, n = rn(ops[0]), rn(ops[1])
            if n == 15:
                # add rX, pc, rY / add rX, pc, #imm: an address
                if ops[2].startswith('#'): emit('R[%d] = %d;' % (d, p + 8 + imm(ops[2])));
                else: raise Exception('add pc reg at %#x' % p)
            else:
                rhs = str(imm(ops[2]) & 0xffffffff) if ops[2].startswith('#') else 'R[%d]' % rn(ops[2])
                op = {'add': '+', 'sub': '-', 'eor': '^'}[base]
                emit('R[%d] = (R[%d] %s %s) >>> 0;' % (d, n, op, rhs))
        elif base == 'ands':
            d, n = rn(ops[0]), rn(ops[1]); rhs = str(imm(ops[2])) if ops[2].startswith('#') else 'R[%d]' % rn(ops[2])
            emit('R[%d] = (R[%d] & %s) >>> 0; M.N = R[%d] >>> 31; M.Z = R[%d] === 0 ? 1 : 0;' % (d, n, rhs, d, d))
        elif base == 'bfc':
            d = rn(ops[0]); lsb, w = imm(ops[1]), imm(ops[2]); mask = ((1 << w) - 1) << lsb
            emit('R[%d] = (R[%d] & %d) >>> 0;' % (d, d, (~mask) & 0xffffffff))
        elif base == 'cmp':
            n = rn(ops[0]); rhs = str(imm(ops[1]) & 0xffffffff) if ops[1].startswith('#') else 'R[%d]' % rn(ops[1])
            emit('{ const a = R[%d] >>> 0, b = %s >>> 0, r = (a - b) >>> 0; M.N = r >>> 31; M.Z = r === 0 ? 1 : 0; M.C = a >= b ? 1 : 0; M.V = (((a ^ b) & (a ^ r)) >>> 31); }' % (n, rhs))
        elif base in ('ldr', 'str', 'ldrb', 'strb', 'ldrd', 'strd'):
            if base in ('ldrd', 'strd'):
                r1, r2 = rn(ops[0]), rn(ops[1]); mo = mem_operand(ops[2])
            else:
                r1 = rn(ops[0]); mo = mem_operand(ops[1])
            if mo is None:
                mr = re.match(r'^\[pc, (\w+)\]$', ops[1])
                assert base == 'ldr' and mr, (hex(p), m, o)
                # ldr rX, [pc, rY]: the GOT slot (rY the literal loaded before it)
                ry = rn(mr.group(1)); lit = lastlit[ry]
                got = (p + 8 + lit) & 0xffffffff
                val = struct.unpack_from('<I', D, got - armdis.DA_VA)[0]
                emit('R[%d] = %d;  // GOT %#x -> %#x' % (r1, val, got, val))
            else:
                b, off, wb, post = mo
                if b == 15:
                    lit = p + 8 + off; v = u32lit(lit); lastlit[r1] = v
                    emit('R[%d] = %d;  // [%#x]' % (r1, v, lit))
                else:
                    addr = '((R[%d] + %d) >>> 0)' % (b, off) if post is None else 'R[%d]' % b
                    if base == 'ldr': emit('R[%d] = M.ld32(%s);' % (r1, addr))
                    elif base == 'str': emit('M.st32(%s, R[%d]);' % (addr, r1))
                    elif base == 'ldrb': emit('R[%d] = M.ld8(%s);' % (r1, addr))
                    elif base == 'strb': emit('M.st8(%s, R[%d]);' % (addr, r1))
                    elif base == 'ldrd': emit('{ const a = %s; R[%d] = M.ld32(a); R[%d] = M.ld32(a + 4); }' % (addr, r1, r2))
                    elif base == 'strd': emit('{ const a = %s; M.st32(a, R[%d]); M.st32(a + 4, R[%d]); }' % (addr, r1, r2))
                    if wb: emit('R[%d] = (R[%d] + %d) >>> 0;' % (b, b, off))
                    if post is not None: emit('R[%d] = (R[%d] + %d) >>> 0;' % (b, b, post))
        elif base in ('b', 'bl'):
            t = int(o[1:], 16)
            if base == 'bl':
                if t == SQRT: emit('S[0] = Math.sqrt(S[0]);  // sqrtf')
                else: assert t in FN, hex(t); emit('F_%x(M);' % t)
            else:
                emit('{ pc = 0x%x; continue; }' % t)
        else:
            raise Exception('unhandled %#x %s %s' % (p, m, o))
        stmt = ' '.join(L)
        if cond: stmt = 'if (%s) %s' % (cond.replace('N', 'M.N').replace('Z', 'M.Z').replace('C', 'M.C').replace('V', 'M.V'), stmt if stmt.startswith('{') else '{ ' + stmt + ' }')
        if TRACE: stmt = 'M.T.push([0x%x, Array.from(M.S.slice(0, 32)), Array.from(M.R)]); ' % p + stmt
        out.append('    case 0x%x: %s  // %s %s' % (p, stmt, m, o))
        # a fall-through past the last instruction of a block that is not followed: the next address must be a label
    out.append("    default: throw new Error('hit-type3 ROM: no label ' + pc.toString(16));")
    out.append('  }')
    out.append('}')
    # every fall-through must land on a label: check that each non-terminal instruction's successor exists
    for p in sorted(I):
        i = I[p]
        term = (i.mnemonic == 'pop' and 'pc' in i.op_str) or (i.mnemonic == 'bx') or (i.mnemonic == 'b')
        if not term and (p + 4) not in I: raise Exception('fall-through out of %#x at %#x' % (a, p))
    return '\n'.join(out)
print('// ---- GENERATED by <scratchpad>/t3/arm2js.py from main.text: one statement per instruction, its address the label ----')
for a in FN: print(gen(a)); print()
print('// ---- END GENERATED ----')

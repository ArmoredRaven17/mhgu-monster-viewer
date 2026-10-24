# rdesc.py -- recursive-descent disassembly of a class's code from its roots (gapF, 2026-10-20). Read-only on the ROM.
# Roots: every word of the given vtables that points into the REGION (default: the enemy class code area 0xcec000..0x1130000).
# Follows: fallthrough, b / bcc / bl imm, PIC jump tables (`add rB, pc, #k; ldr rX, [rI, rB]; add pc, rX, rB` bounded by the
# preceding cmp #N + bhi / bhs), pc-relative function pointers (`add rX, pc, rY` with a literal, or adr) into the region.
# Returns: instructions reached (addr -> (mnem, ops)), function entries (bl / root / b-out targets), external calls (outside the
# region), and every unresolved control transfer (writes to pc it could not follow) -- so a coverage gap is named, not hidden.
import sys, struct, re, json
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
T = armdis.TEXT
_cache = {}
def dis(a):
    if a in _cache: return _cache[a]
    ins = next(md.disasm(T[a:a + 4], a), None)
    r = (ins.mnemonic, ins.op_str) if ins else ('.word', '%#x' % armdis.u32(a))
    _cache[a] = r; return r
COND = ('eq','ne','hs','lo','mi','pl','vs','vc','hi','ls','ge','lt','gt','le','cs','cc')
def bcond(m):
    # b / bl with an optional condition (not bic / bx / blx)
    if m in ('b', 'bl'): return m, None
    for c in COND:
        if m == 'b' + c: return 'b', c
        if m == 'bl' + c: return 'bl', c
    return None, None
def vt_words(vt, n=0x4a0):
    return [armdis.u32(vt + i) for i in range(0, n, 4)]
def walk(roots, lo, hi, extra_stop=()):
    seen = {}; entries = set(roots); ext = {}; unres = []; tables = []
    work = list(roots); fptr = set(); lits = {}
    while work:
        a = work.pop()
        while True:
            if a in seen or not (lo <= a < hi): break
            m, o = dis(a); seen[a] = (m, o)
            cond = None
            for c in COND:
                if m.endswith(c) and len(m) > len(c): cond = c
            kind, bc = bcond(m)
            if kind:
                t = int(o.split('#')[-1], 16)
                if kind == 'bl':
                    if lo <= t < hi: entries.add(t); work.append(t)
                    else: ext.setdefault(t, set()).add(a)
                    a += 4; continue
                # b
                if lo <= t < hi: work.append(t)
                else: ext.setdefault(t, set()).add(a)   # a tail call out
                if bc: a += 4; continue
                break
            if m in ('bx', 'blx') or m.startswith('bx') or m.startswith('blx'):
                if o == 'lr' and m == 'bx': break
                if m.startswith('blx') and o.startswith('#'):
                    unres.append((a, m, o, 'blx imm (thumb)')); a += 4; continue
                if m.startswith('blx'): a += 4; continue           # an indirect call (vtable / function pointer)
                if m.startswith('bx') and o == 'lr':
                    if m == 'bx': break
                    a += 4; continue
                ext.setdefault('bx ' + o, set()).add(a); break      # an indirect tail call (ldr rX, [vt, #k]; bx rX)
            if ('pc' in o.split(',')[0] and m.startswith(('add', 'ldr', 'mov', 'sub'))) or (m.startswith(('pop', 'ldm')) and 'pc' in o):
                if m.startswith(('pop', 'ldm')) or (m.startswith('ldr') and o.startswith('pc, [sp]')):
                    if cond: a += 4; continue
                    break
                if m == 'mov' and o == 'pc, lr': break
                # PIC jump table
                mm = re.match(r'pc, (r\d+|ip|lr|sb|sl|fp|r\d+), (r\d+|ip|lr|sb|sl|fp)$', o)
                ok = False
                if m == 'add' and mm:
                    base = None; n = None; inc = None
                    for b in range(a - 4, a - 0x40, -4):
                        bm, bo = dis(b)
                        mb = re.match(r'(\w+), pc, #(0x[0-9a-f]+|\d+)$', bo)
                        if bm == 'add' and mb and base is None: base = b + 8 + int(mb.group(2), 0)
                        mc = re.match(r'(\w+), #(0x[0-9a-f]+|\d+)$', bo)
                        if bm == 'cmp' and mc and n is None:
                            # the bound's branch right after the cmp
                            nm_, no_ = None, None
                            for q in range(b + 4, min(a, b + 0x1c), 4):
                                nm_, no_ = dis(q)
                                if nm_ in ('bhi', 'bhs', 'bls', 'blo'): break
                            if nm_ in ('bhi', 'bhs', 'bls', 'blo'):
                                N = int(mc.group(2), 0); n = N + 1 if nm_ in ('bhi', 'bls') else N
                                inc = nm_
                                t = int(no_.split('#')[-1], 16)
                                if lo <= t < hi: work.append(t)
                            break
                    if base is not None and n is not None:
                        tg = []
                        for i in range(n):
                            off = armdis.u32(base + 4 * i)
                            t = (base + off) & 0xffffffff
                            tg.append(t); work.append(t)
                            seen.setdefault(base + 4 * i, ('.jt', '%#x' % t))
                        tables.append((a, base, n, tg)); ok = True
                if not ok: unres.append((a, m, o, 'pc write'))
                break
            # pc-relative code pointers: adr, and the PIC form ldr rY, [pc, #k] .. add rX, pc, rY
            ml = re.match(r'(\w+), \[pc, #(-?0x[0-9a-f]+|\d+)\]$', o)
            if m == 'ldr' and ml: lits[ml.group(1)] = armdis.u32(a + 8 + int(ml.group(2), 0))
            mp = re.match(r'(\w+), pc, (\w+)$', o)
            if m == 'add' and mp and mp.group(2) in lits and lits[mp.group(2)] is not None:
                t = (a + 8 + lits[mp.group(2)]) & 0xffffffff
                if lo <= t < hi: fptr.add((a, t))
            mm = re.match(r'(\w+), pc, #(0x[0-9a-f]+|\d+)$', o)
            if m == 'add' and mm:
                t = a + 8 + int(mm.group(2), 0)
                if lo <= t < hi and t not in seen: fptr.add((a, t))
            a += 4
    return seen, entries, ext, unres, tables, fptr

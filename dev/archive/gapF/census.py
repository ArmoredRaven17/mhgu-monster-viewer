# census.py -- every shell create in uEm024_00's derived band 0xdeee40..0xdfeec4 (gapF, 2026-10-20). Static:
#  1. every b / bl to 0x48b884 (the submit) and to the request allocators 0x3f883c / 0x3fa2bc / 0x3fb7bc / 0x41add8 / 0x4041a8 in
#     the band's reached code (band024.json) and its unreached islands (the shells' ctors);
#  2. from each allocation, every CFG path forward (fallthrough, branches, jump tables; calls clobber r0-r3 / ip / lr and
#     keep the setup register if it was r4+) to a submit that takes the setup in r1, with the stores to +4 (the id) and +8
#     (the mode) on that path; a stored register's value is the last definition on the path, else the last straight-line
#     definition before the allocation (marked "pre").
# Positive controls: 0xdf8610's sp_01 mode 11 (literal) and sp_33's +0x158 0xdfe2b4 (mode = [0x169d3f0][the shell's mode]).
import sys, json, re
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, '.')
import armdis, rdesc
LO, HI = 0xdeee40, 0xdfeec4
d = json.load(open('band024.json'))
code = set(a for a in d['code'] if LO <= a < HI)
for lo, hi in ((0xdfd5b4, 0xdfd5e8), (0xdfdb54, 0xdfdb70), (0xdfdde0, 0xdfddfc), (0xdfdff8, 0xdfe014), (0xdfe4ac, 0xdfe4c8), (0xdfe994, 0xdfe9b0)):
    code |= set(range(lo, hi, 4))
JT = {}
for (a, base, n, tg) in d['tables']: JT[a] = tg
ALLOC = {0x3f883c, 0x3fa2bc, 0x3fb7bc, 0x41add8, 0x4041a8}
# every external call target of the band with the request allocators' shape (a pool GOT handed to the heap 0x7a75a0 in the
# first 8 instructions): 0x3fa2bc's own shape -- so a setup allocated by another base's allocator is in the census too
def alloc_shape(t):
    for i in range(8):
        m, o = rdesc.dis(t + 4 * i)
        if m == 'bl' and o == '#0x7a75a0': return True
    return False
for k in d['ext']:
    if k.startswith('0x') and alloc_shape(int(k, 16)): ALLOC.add(int(k, 16))
print('allocators (by shape):', ' '.join('%#x' % x for x in sorted(ALLOC)))
SUBMIT = 0x48b884
COND = rdesc.COND
def tgt(o): return int(o.split('#')[-1], 16)
def isb(m):  # (kind, cond)
    return rdesc.bcond(m)
REGS = ['r%d' % i for i in range(13)] + ['sb', 'sl', 'fp', 'ip']
ALIAS = {'sb': 'r9', 'sl': 'r10', 'fp': 'r11', 'ip': 'r12'}
def R(x): return ALIAS.get(x, x)
def expr_of(m, o, st):
    """the value an instruction writes to its destination, from state st (dict reg -> expr), or None"""
    ops = [x.strip() for x in o.split(',')]
    if m in ('mov', 'movw') and len(ops) == 2:
        s = ops[1]
        if s.startswith('#'): return s[1:]
        return st.get(R(s), R(s))
    if m == 'mvn' and ops[1].startswith('#'): return '~' + ops[1][1:]
    if m == 'movt': return '(%s | %s<<16)' % (st.get(R(ops[0]), R(ops[0])), ops[1][1:])
    if m.startswith('ldr'):
        mm = re.match(r'(\w+), \[(\w+)(?:, (#?-?\w+)(?:, lsl #(\d+))?)?\](!?)(?:, (#?-?\w+))?$', o)
        if mm:
            b = mm.group(2); off = mm.group(3)
            if b == 'pc' and off and off.startswith('#'): return 'lit %#x' % armdis.u32(st['_pc'] + 8 + int(off[1:], 0))
            bv = st.get(R(b), R(b))
            if b == 'pc' and off: return 'GOT[pc+%s]' % st.get(R(off), off)
            return '%s[%s%s%s]' % (m[3:] or 'w', bv, (' + ' + (off if off.startswith('#') else st.get(R(off), R(off)))) if off else '',
                                   (' << ' + mm.group(4)) if mm.group(4) else '')
    if m in ('add', 'sub', 'lsl', 'orr', 'and', 'uxtb', 'sxtb', 'uxth'):
        if len(ops) == 3:
            a1 = st.get(R(ops[1]), R(ops[1])); a2 = ops[2][1:] if ops[2].startswith('#') else st.get(R(ops[2]), R(ops[2]))
            return '(%s %s %s)' % (a1, {'add': '+', 'sub': '-', 'lsl': '<<', 'orr': '|', 'and': '&'}.get(m, m), a2)
        if len(ops) == 4:
            return '(%s %s %s %s)' % (st.get(R(ops[1]), R(ops[1])), m, st.get(R(ops[2]), R(ops[2])), ops[3])
        if len(ops) == 2: return '%s(%s)' % (m, st.get(R(ops[1]), R(ops[1])))
    return None
def pre_def(a, reg, lim=0x60):
    """the last straight-line definition of reg before a (within lim bytes)"""
    for b in range(a - 4, a - lim, -4):
        if b not in code: break
        m, o = rdesc.dis(b)
        ops = [x.strip() for x in o.split(',')]
        if ops and R(ops[0]) == reg and not m.startswith(('str', 'cmp', 'tst', 'vstr', 'b', 'push', 'vcmp')):
            e = expr_of(m, o, {'_pc': b})
            return '%s @%#x' % (e if e is not None else m + ' ' + o, b)
        if m.startswith('bl') and reg in ('r0', 'r1', 'r2', 'r3', 'r12'): return 'ret? @%#x' % b
    return 'pre ?'
def paths(a0):
    """from the allocation call at a0: every path to a submit with the setup in r1"""
    out = []
    st0 = {'r0': 'SETUP', '_pc': a0}
    stack = [(a0 + 4, st0, {}, (), 0)]
    while stack:
        a, st, stores, vis, n = stack.pop()
        if n > 400 or a in vis or a not in code: continue
        vis = vis + (a,)
        m, o = rdesc.dis(a); st = dict(st); st['_pc'] = a
        kind, bc = isb(m)
        ops = [x.strip() for x in o.split(',')]
        if kind:
            t = tgt(o)
            if t == SUBMIT:
                if st.get('r1') == 'SETUP':
                    out.append((a, kind, dict(stores), {k: st.get(k) for k in ('r0', 'r2', 'r3')}))
                    if kind == 'b' and not bc: continue
                if kind == 'b' and not bc: continue
            if t in ALLOC: continue                              # a second allocation: another census row
            if kind == 'bl':
                for r in ('r0', 'r1', 'r2', 'r3', 'r12', 'lr'):
                    if st.get(r) == 'SETUP' and r != 'r0': st[r] = 'clobbered'
                    elif r in st: st[r] = 'ret(%#x)' % t if r == 'r0' else 'clobbered'
                    else: st[r] = 'ret(%#x)' % t if r == 'r0' else 'clobbered'
                stack.append((a + 4, st, stores, vis, n + 1)); continue
            if not (LO <= t < HI): continue                      # a tail call elsewhere
            stack.append((t, st, stores, vis, n + 1))
            if bc: stack.append((a + 4, st, stores, vis, n + 1))
            continue
        if a in JT:
            for t in JT[a]: stack.append((t, st, stores, vis, n + 1))
            continue
        if m.startswith(('pop', 'ldm')) and 'pc' in o: continue
        if m == 'bx': continue
        if m.startswith('blx'):
            for r in ('r0', 'r1', 'r2', 'r3', 'r12'): st[r] = 'clobbered' if r != 'r0' else 'ret(blx)'
            stack.append((a + 4, st, stores, vis, n + 1)); continue
        cond = any(m.endswith(c) and len(m) > len(c) and not m.startswith(('vmrs',)) for c in COND) and not m.startswith(('movw', 'movt'))
        if m.startswith(('movw', 'movt')) and len(m) > 4 and m[4:] in COND: cond = True
        if m.startswith('str') and not m.startswith('strex'):
            mm = re.match(r'(\w+), \[(\w+)(?:, #(-?0x[0-9a-f]+|\d+))?\](!?)$', o)
            if mm and st.get(R(mm.group(2))) == 'SETUP':
                off = int(mm.group(3), 0) if mm.group(3) else 0
                v = mm.group(1); val = st.get(R(v)) or pre_def(a0, R(v)) + ' (pre)'
                stores = dict(stores); stores[off] = ('%s%s' % ('(cond %s) ' % m if cond else '', val), a)
            stack.append((a + 4, st, stores, vis, n + 1)); continue
        if m.startswith('stm'):
            mm = re.match(r'(\w+)(!?), \{(.*)\}$', o)
            if mm and st.get(R(mm.group(1))) == 'SETUP':
                rl = [x.strip() for x in mm.group(3).split(',')]
                first = 4 if m.startswith('stmib') else 0
                stores = dict(stores)
                for i, v in enumerate(rl):
                    stores[first + 4 * i] = (st.get(R(v)) or pre_def(a0, R(v)) + ' (pre)', a)
            stack.append((a + 4, st, stores, vis, n + 1)); continue
        if ops and R(ops[0]) in [R(x) for x in REGS] and not m.startswith(('cmp', 'cmn', 'tst', 'teq', 'vcmp', 'vstr', 'push', 'vpush', 'vmov', 'vldr', 'vadd', 'vmul', 'vsub', 'vcvt', 'vdiv')):
            e = expr_of(m, o, st)
            dst = R(ops[0])
            if cond: st[dst] = '(%s ? %s : %s)' % (m, e, st.get(dst, dst))
            else: st[dst] = e if e is not None else '%s %s' % (m, o)
            # ldm / ldr post-index writeback of the base not tracked: a register holding SETUP is not a load base here
        stack.append((a + 4, st, stores, vis, n + 1))
    return out
sites_sub = []; sites_alloc = []
for a in sorted(code):
    m, o = rdesc.dis(a); kind, bc = isb(m)
    if kind:
        t = tgt(o)
        if t == SUBMIT: sites_sub.append(a)
        if t in ALLOC: sites_alloc.append((a, t))
print('band %#x..%#x: %d submits (0x48b884), %d allocations' % (LO, HI, len(sites_sub), len(sites_alloc)))
print('submits:', ' '.join('%#x' % a for a in sites_sub))
fed = set(); rows = []
for a, t in sites_alloc:
    ps = paths(a)
    if not ps:
        print('ALLOC %#x (%#x): NO path to a submit with the setup in r1' % (a, t)); continue
    for (s, kind, stores, regs) in ps:
        fed.add(s)
        idv = stores.get(4, ('(no +4 store)',))[0]; mo = stores.get(8, ('(no +8 store)',))[0]
        rows.append((a, t, s, idv, mo))
seen = set()
for r in rows:
    k = (r[0], r[2], r[3], r[4])
    if k in seen: continue
    seen.add(k)
    print('alloc %#x (%#x) -> submit %#x  id %s  mode %s' % r)
print('submits fed by no allocation path:', [hex(s) for s in sites_sub if s not in fed])

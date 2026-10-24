"""fn.py ADDR [ADDR...] -- disassemble each function from ADDR to its derived end: a traversal of every
reachable instruction (conditional and unconditional b inside, jump tables of the `addls pc, pc, rX, lsl #2`
and `ldr pc, [pc, rX, lsl #2]` shapes), stopping at pop{..pc} / bx lr / ldm..pc and at a b outside the reached
span that lands on a push (a tail call). Prints the listing over [entry, max reached] with PIC resolution
(armdis.run) and a line naming the extent and every bl / tail target."""
import sys, struct, os
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
T = armdis.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)

def ins_at(a):
    return next(md.disasm(T[a:a + 4], a), None)

def is_push(a):
    w = struct.unpack_from('<I', T, a)[0]
    return (w & 0xFFFF0000) == 0xE92D0000 or (w & 0x0FFF0FFF) == 0x052D0004 and False

def extent(entry, limit=0x4000):
    seen = set(); work = [entry]; calls = set(); tails = set(); tables = []
    while work:
        a = work.pop()
        while True:
            if a in seen or a < entry or a > entry + limit: break
            seen.add(a)
            i = ins_at(a)
            if i is None: break
            m, o = i.mnemonic, i.op_str
            cond = m[1:3] if m.startswith('b') and len(m) in (3,) else ''
            CONDS=('eq','ne','cs','hs','cc','lo','mi','pl','vs','vc','hi','ls','ge','lt','gt','le','al')
            isbl = (m in ('bl','blx')) or (m.startswith('bl') and m[2:] in CONDS) or (m.startswith('blx') and m[3:] in CONDS)
            if isbl:
                if '#' in o: calls.add(int(o.split('#')[-1], 16))
                a += 4; continue
            if m.startswith('b') and not m.startswith('bic') and not m.startswith('bx') and '#' in o and (m == 'b' or m[1:] in CONDS):
                t = int(o.split('#')[-1], 16)
                uncond = (m == 'b')
                if is_push(t) and t != entry and (t < entry or t > entry + limit or True) and (t < entry or t > max(seen)+0x400):
                    tails.add(t)
                else:
                    work.append(t)
                if uncond: break
                a += 4; continue
            if m.startswith('bx') and 'lr' in o:
                if m == 'bx': break
                a += 4; continue
            if (m.startswith('pop') or m.startswith('ldm')) and 'pc' in o:
                if len(m) == 3 or m in ('ldm', 'ldmia', 'ldmfd'): break
                a += 4; continue
            if m.startswith('add') and o.startswith('pc, pc,'):
                # jump table: entries follow at a+8 (each a `b`), bounded by the preceding cmp
                n = 0
                p = ins_at(a - 4)
                if p and p.mnemonic.startswith('cmp') and '#' in p.op_str:
                    n = int(p.op_str.split('#')[-1], 0) + 1
                tables.append((a, n))
                for k in range(n + 1):
                    work.append(a + 8 + 4 * k)
                if m == 'add': break
                a += 4; continue
            if m.startswith('ldr') and o.startswith('pc,'):
                tables.append((a, -1)); break
            if m.startswith('mov') and o.startswith('pc,'):
                break
            a += 4
    return min(seen), max(seen), sorted(calls), sorted(tails), tables

if __name__ == '__main__':
    only = None
    args = [x for x in sys.argv[1:]]
    for s in args:
        e = int(s, 16)
        lo, hi, calls, tails, tables = extent(e)
        print('### fn %#x  extent %#x..%#x (%d words)  calls %s  tails %s  tables %s' % (e, lo, hi + 4, (hi + 4 - lo) // 4,
              ' '.join('%#x' % c for c in calls), ' '.join('%#x' % c for c in tails), tables))
        print('\n'.join(armdis.run(lo, hi + 4)))

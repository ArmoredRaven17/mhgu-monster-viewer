"""ptrscan.py <lo> <hi> <field hex> <bit>: every store to an enemy field that clears <bit>, POINTER FORMS INCLUDED.
A linear register track per function: a register "points at e + off" when formed as base + const (`movw rK, #c` then
`add rP, rB, rK`, `ldr rX, [rB, rK]!` -- rB += rK, `add rP, rB, #c`), moved (`mov rP, rQ`) or adjusted (`add / sub rP, rQ, #d`
on a pointer); a load through a pointer ([rP], [rP, #d], [rB, rK]) makes "the value of e + off"; a clear of <bit> on it
(bic / and / bfc) followed by a store through a pointer to the same field is reported. The byte view (field + bit // 8, bit
% 8) is checked too. Linear: branches are not followed. CONTROL: e+0x1404 bits 21-22 are cleared at 0xadcd8 through `sl`
= r7 - 4, r7 the e+0x1408 pointer formed earlier (`python ptrscan.py 0xad000 0xae400 0x1404 21` must report 0xadcdc)."""
import sys, re
sys.path.insert(0, r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\zg')
from armdis import dis
lo, hi, F, BIT = int(sys.argv[1], 16), int(sys.argv[2], 16), int(sys.argv[3], 16), int(sys.argv[4])
FB, BB = F + BIT // 8, BIT % 8
REG = r'(r\d+|sb|sl|fp|ip|lr)'
NUM = r'#(-?0x[0-9a-f]+|-?\d+)'
def view(fld, width):
    """the bit to test in a value loaded from e + fld with this width, or None when the bit is not in it"""
    if width == 'ldrb': return BB if fld == FB else None
    if width == 'ldrh': return BIT - 8 * (fld - F) if F <= fld <= F + 1 and 0 <= BIT - 8 * (fld - F) < 16 else None
    return BIT - 8 * (fld - F) if F - 3 <= fld <= F and 0 <= BIT - 8 * (fld - F) < 32 else None
out = []
step = 0x40000
for s0 in range(lo, hi, step):
    L = dis(s0, min(hi, s0 + step + 0x200))
    const, ptr, val = {}, {}, {}
    def drop(r): const.pop(r, None); ptr.pop(r, None); val.pop(r, None)
    for k, (a, s) in enumerate(L):
        if a >= s0 + step: break
        if (s.startswith('push') and 'lr' in s) or (s.startswith('pop') and 'pc' in s): const.clear(); ptr.clear(); val.clear(); continue
        # post-indexed forms: ldr / str v, [b], k|#d -- the access is at b, then b += k
        m = re.match(r'(ldr|ldrb|ldrh|str|strb|strh)\w*\s+' + REG + r', \[' + REG + r'\], (?:' + REG + '|' + NUM + ')$', s)
        if m:
            w, v, b, kk, num = m.groups()
            fld = ptr.get(b)
            if w.startswith('ldr'):
                drop(v)
                if fld is not None and view(fld, w) is not None: val[v] = [fld, False, w]
            add = const.get(kk) if kk else int(num, 0)
            if add is None: ptr.pop(b, None)
            else: ptr[b] = (ptr.get(b, 0)) + add
            continue
        m = re.match(r'movw?\s+' + REG + r', ' + NUM + '$', s)
        if m: r = m.group(1); drop(r); const[r] = int(m.group(2), 0); continue
        m = re.match(r'movt\s+' + REG + r', ' + NUM + '$', s)
        if m and m.group(1) in const: const[m.group(1)] = (const[m.group(1)] & 0xffff) | (int(m.group(2), 0) << 16); continue
        m = re.match(r'mov\s+' + REG + r', ' + REG + '$', s)
        if m:
            d, q = m.group(1), m.group(2); src = (const.get(q), ptr.get(q), val.get(q)); drop(d)
            if src[0] is not None: const[d] = src[0]
            if src[1] is not None: ptr[d] = src[1]
            if src[2] is not None: val[d] = list(src[2])
            continue
        m = re.match(r'(add|sub)\s+' + REG + r', ' + REG + r', ' + REG + '$', s)
        if m:
            d, b, kk = m.group(2), m.group(3), m.group(4); c = const.get(kk); drop(d)
            if m.group(1) == 'add' and c is not None: ptr[d] = ptr.get(b, 0) + c
            continue
        m = re.match(r'(add|sub)\s+' + REG + r', ' + REG + r', ' + NUM + '$', s)
        if m:
            d, b, c = m.group(2), m.group(3), int(m.group(4), 0); base = ptr.get(b); drop(d)
            if base is not None: ptr[d] = base + (c if m.group(1) == 'add' else -c)
            elif m.group(1) == 'add' and c >= 0x1000: ptr[d] = c
            continue
        m = re.match(r'(ldr|ldrb|ldrh)\w*\s+' + REG + r', \[' + REG + r'(?:, (?:' + REG + '|' + NUM + r'))?\](!?)$', s)
        if m:
            w, v, b, kk, num, wb = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5), m.group(6)
            if kk: fld = ptr.get(b, 0) + const[kk] if kk in const else None
            else: fld = ptr[b] + (int(num, 0) if num else 0) if b in ptr else None
            if wb == '!' and fld is not None: ptr[b] = fld
            drop(v)
            if fld is not None and view(fld, w) is not None: val[v] = [fld, False, w]
            continue
        m = re.match(r'(bic|and)\w*\s+' + REG + r', ' + REG + r', ' + NUM + '$', s)
        if m and m.group(3) in val:
            fld, cl, w = val[m.group(3)]; vb = view(fld, w); imm = int(m.group(4), 0) & 0xffffffff
            c2 = ((imm >> vb) & 1) if m.group(1) == 'bic' else not ((imm >> vb) & 1)
            d = m.group(2); drop(d); val[d] = [fld, cl or bool(c2), w]; continue
        m = re.match(r'(bic|and)\w*\s+' + REG + r', ' + REG + r', ' + REG + '$', s)
        if m and m.group(3) in val and m.group(4) in const:
            fld, cl, w = val[m.group(3)]; vb = view(fld, w); imm = const[m.group(4)] & 0xffffffff
            c2 = ((imm >> vb) & 1) if m.group(1) == 'bic' else not ((imm >> vb) & 1)
            d = m.group(2); drop(d); val[d] = [fld, cl or bool(c2), w]; continue
        m = re.match(r'bfc\w*\s+' + REG + r', #(\w+), #(\w+)$', s)
        if m and m.group(1) in val:
            fld, cl, w = val[m.group(1)]; vb = view(fld, w); l0, wd = int(m.group(2), 0), int(m.group(3), 0)
            val[m.group(1)] = [fld, cl or (l0 <= vb < l0 + wd), w]; continue
        m = re.match(r'(str|strb|strh)\w*\s+' + REG + r', \[' + REG + r'(?:, (?:' + REG + '|' + NUM + r'))?\](!?)$', s)
        if m:
            v, b, kk, num, wbs = m.group(2), m.group(3), m.group(4), m.group(5), m.group(6)
            if kk: fld = ptr.get(b, 0) + const[kk] if kk in const else None
            else: fld = ptr[b] + (int(num, 0) if num else 0) if b in ptr else None
            if wbs == '!':                                   # a store with writeback moves the base too
                if fld is not None: ptr[b] = fld
                else: ptr.pop(b, None)
            if fld is not None and v in val and val[v][1] and val[v][0] == fld: out.append((hex(a), s, 'e+' + hex(fld)))
            # a plain overwrite of the field with a constant whose bit is clear (the ctor's `e+0x1408 = 4`)
            elif fld is not None and v in const and view(fld, {'str': 'ldr', 'strb': 'ldrb', 'strh': 'ldrh'}[m.group(1)]) is not None                     and not ((const[v] >> view(fld, {'str': 'ldr', 'strb': 'ldrb', 'strh': 'ldrh'}[m.group(1)])) & 1):
                out.append((hex(a), s, 'e+' + hex(fld) + ' = ' + hex(const[v]) + ' (overwrite)'))
            continue
        m = re.match(r'[a-z.]+\w*\s+' + REG + r',', s)
        if m and not s.startswith(('str', 'cmp', 'tst', 'teq', 'cmn', 'vstr', 'vcmp')): drop(m.group(1))
for o in out: print(*o)
print('clears found:', len(out))

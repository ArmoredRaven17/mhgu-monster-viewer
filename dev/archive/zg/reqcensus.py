"""Request-side census per class band (class-effects.json code_lo..code_hi): every branch into the shared level request 0xa499c
(r1 = the level -> base u key: 0 1120, 1 1121, 2 1400, 3 900, 4 901, 5 905, 6 906), into the base request entries 0xa3ddc (u) /
0xa3dc0 (c) / 0x6feb8 / 0x6fdd4, and every vt+0x1d0 / +0x1cc call, each with the r1 immediate found before it (or 'computed').
   python reqcensus.py <class> ..."""
import sys, json, re, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT; md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
CL = {c['class']: c for c in json.load(open(r'C:\MHGU-Extract\efx\class-effects.json'))['classes']}
LEVEL = {0: 1120, 1: 1121, 2: 1400, 3: 900, 4: 901, 5: 905, 6: 906}
TGT = {0xa499c: 'level', 0xa3ddc: 'base u', 0xa3dc0: 'base c', 0x6feb8: 'u 0x6feb8', 0x6fdd4: 'c 0x6fdd4'}
def r1_before(ins, k):
    for j in range(k - 1, max(k - 14, -1), -1):
        i = ins[j]
        m = re.match(r'(?:mov|movw)\S* r1, #(0x[0-9a-f]+|\d+)$', i.mnemonic + ' ' + i.op_str) if False else None
        s = '%s %s' % (i.mnemonic, i.op_str)
        m = re.match(r'(mov|movw)(eq|ne|hi|ls|lo|hs|ge|lt|gt|le)? r1, #(0x[0-9a-f]+|\d+)$', s)
        if m: return int(m.group(3), 0), m.group(2) or ''
        if re.match(r'\w+ r1,', s) and not s.startswith(('cmp', 'tst', 'str')): return None, s
        if i.mnemonic in ('bl', 'blx', 'b') or i.mnemonic.startswith('pop'): return None, 'call/branch before'
    return None, 'not found'
for cls in sys.argv[1:]:
    c = CL[cls]; lo, hi = int(c['code_lo'], 16), int(c['code_hi'], 16)
    ins = []
    for a in range(lo, hi, 4):
        got = list(md.disasm(T[a:a + 4], a))
        if got: ins.append(got[0])
    rows = []
    for k, i in enumerate(ins):
        if i.mnemonic in ('b', 'bl') and i.op_str.startswith('#'):
            t = int(i.op_str[1:], 16)
            if t in TGT:
                v, why = r1_before(ins, k)
                key = LEVEL.get(v) if t == 0xa499c and v is not None else None
                rows.append(('%#x' % i.address, TGT[t], v, key, '' if v is not None else why))
        if i.mnemonic == 'ldr' and re.search(r'\[r\d+, #0x1(d0|cc)\]$', i.op_str):
            nxt = ins[k + 1:k + 4]
            if any(x.mnemonic.startswith('blx') for x in nxt):
                v, why = r1_before(ins, k + 3)
                rows.append(('%#x' % i.address, 'vt+0x' + i.op_str[-4:-1], v, None, '' if v is not None else why))
    print('==', cls, '%#x..%#x' % (lo, hi), len(rows), 'sites')
    for r in rows: print('  ', r)

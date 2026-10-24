# throw082.py -- the six sp_13 throw helpers of uEm082_00 read into their constants: per throw block the tune frame index, the
# x constant C, which call's result cancels it (r0 tested right after: 0x81614 tired / 0x1036e24 head / 0x103780c tail), the two
# per-action threshold tables (n - 4 in 0..0x2f), the words table base and the throw's offset in its 0x120-byte row
import re, struct, sys, json
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T = armdis.TEXT
def rd(a):
    for buf, base in ((T, 0), (armdis.RODATA, armdis.RO_VA), (armdis.DATA, armdis.DA_VA)):
        if base <= a < base + len(buf): return struct.unpack_from('<I', buf, a - base)[0]
L = [l.rstrip('\n') for l in open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\band082.txt')]
A = [int(l[:8], 16) for l in L]; ix = {a: i for i, a in enumerate(A)}
ins = lambda i: L[i][10:].strip()
NAMES = {0x81614: 'tired', 0x1036e24: 'head', 0x103780c: 'tail', 0x1035ee8: 'flame'}
out = {}
for h in (0x104a90c, 0x104adbc, 0x104b138, 0x104b314, 0x104bb60, 0x104bedc):
    i = ix[h]; j = i + 1
    while not re.search(r'\bpush\s+\{.*lr\}', ins(j)): j += 1
    body = list(range(i, j))
    tunes = []
    for k in body:
        m = re.match(r'mov\s+r1, #(0x[0-9a-f]+|\d+)$', ins(k))
        if m and 'bl      #0x6f618' in ins(k + 1): tunes.append(int(m.group(1), 0))
    # throw blocks: each ends at a call / branch to 0x104a634
    blocks, start = [], None
    for k in body:
        if 'bl      #0xb0968' in ins(k): start = k
        if re.search(r'\bb(l)?\s+#0x104a634$', ins(k)) and start is not None:
            blocks.append((start, k)); start = None
    hb = []
    for (s, e) in blocks:
        b = {'C': None, 'cancel': [], 'tables': [], 'off': 0, 'calls': []}
        for k in range(s, e + 1):
            t = ins(k)
            m = re.match(r'movw\s+r1, #(0x[0-9a-f]+)$', t)
            if m and ins(k + 2).startswith('mvn') or (m and 'sub     r0, r0, r1' in ' '.join(ins(q) for q in range(k, k + 6))):
                if m and int(m.group(1), 16) not in (0x73e1, 0x851f): b['C'] = int(m.group(1), 16)
            m = re.match(r'bl\s+#0x([0-9a-f]+)$', t)
            if m and int(m.group(1), 16) in NAMES:
                b['calls'].append(NAMES[int(m.group(1), 16)])
                if ins(k + 1).startswith('mvn     r1, #0') and ins(k + 2) == 'cmp     r0, #0': b['cancel'].append(NAMES[int(m.group(1), 16)])
                if ins(k + 1) == 'mvn     r1, #0' or ins(k + 2) == 'cmp     r0, #0': pass
            m = re.match(r'ldr\s+(r[23]), \[pc, #(0x[0-9a-f]+)\]$', t)
            if m and ins(k + 2).startswith('sxtb') or (m and 'add     %s, pc, %s' % (m.group(1), m.group(1)) in [ins(q) for q in range(k, k + 5)]):
                lit = rd(A[k] + 8 + int(m.group(2), 16))
                q = [q for q in range(k, k + 5) if ins(q) == 'add     %s, pc, %s' % (m.group(1), m.group(1))][0]
                base = (A[q] + 8 + lit) & 0xffffffff
                b['tables'].append([struct.unpack('<i', struct.pack('<I', rd(base + 4 * n)))[0] for n in range(0x30)])
            m = re.match(r'add\s+r2, r0, #(0x[0-9a-f]+)$', t)
            if m: b['off'] = int(m.group(1), 16)
            m = re.match(r'ldr\s+r0, \[pc, #(0x[0-9a-f]+)\]$', t)
            if m and ins(k + 1) == 'mov     r2, #0x360':
                lit = rd(A[k] + 8 + int(m.group(1), 16)); q = k + 2
                b['wbase'] = (A[q] + 8 + lit) & 0xffffffff
        hb.append(b)
    out[hex(h)] = {'tunes': tunes, 'blocks': hb}
    print(hex(h), 'tunes', tunes)
    for b in hb: print('   C', hex(b['C'] or 0), 'calls', b['calls'], 'cancel', b['cancel'], 'off', hex(b['off']), 'wbase', hex(b.get('wbase', 0)),
                       'tables', ['%d entries, nonneg %s' % (len(t), {n + 4: v for n, v in enumerate(t) if v >= 0}) for t in b['tables']])
json.dump(out, open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb\throw082.json', 'w'))

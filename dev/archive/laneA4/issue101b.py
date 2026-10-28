# laneA4/issue101b.py (lane A4, 2026-10-26): who issues (10, 0x1b)? (a) every store to #0x3ae (the reaction code P+0x3ae) with the
# immediate last moved into the stored register; (b) every place r1 = 10 and r2 = 0x1b are set within 6 instructions of a
# bl / blx (a direct (status, number) request). Control for (b): the same scan for (10, 0xaf) must not be empty only if a class
# asks it directly -- Mizutsune's is issued by 0x9a76c code 0x1c, so the control is (a) finding 0x998f4..0x9993c's 8.
import sys, re, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
T = armdis.TEXT
lo, hi = 0x40000, 0x1130000
ins = list(md.disasm(T[lo:hi], lo))
print('decoded', len(ins))
regimm = {}
A, B = [], []
for k, i in enumerate(ins):
    m, o = i.mnemonic, i.op_str
    if m in ('mov', 'movw') and re.match(r'^r\d+, #', o):
        r, v = o.split(', #'); 
        try: regimm[r] = (int(v, 0), i.address)
        except ValueError: pass
    if m.startswith('strb') or m.startswith('strh'):
        if '#0x3ae]' in o:
            r = o.split(',')[0]
            A.append((i.address, m, o, regimm.get(r)))
    if m in ('bl', 'blx'):
        win = ins[max(0, k - 6):k]
        r1 = r2 = None
        for j in win:
            mm = re.match(r'^(r1|r2), #(\w+)$', j.op_str)
            if j.mnemonic in ('mov', 'movw') and mm:
                if mm.group(1) == 'r1': r1 = int(mm.group(2), 0)
                else: r2 = int(mm.group(2), 0)
        if r1 == 10 and r2 in (0x1b, 0x1c): B.append((i.address, m, i.op_str, r2))
    if m in ('b', 'bl', 'blx', 'bx', 'pop') or m.startswith('ldm'): pass
print('stores to #0x3ae:', len(A))
for a in A: print('  %#x %s %s  last imm %s' % (a[0], a[1], a[2], ('%#x @%#x' % a[3]) if a[3] else '-'))
print('direct (10, 0x1b / 0x1c) calls:', len(B))
for b in B: print('  %#x %s %s r2=%#x' % b)
# (c) the register-offset forms: movw rO, #0x3ae then a strb / strh [rX, rO] within 4 instructions; the value's last immediate
C = []
for k, i in enumerate(ins):
    if i.mnemonic == 'movw' and i.op_str.endswith('#0x3ae'):
        ro = i.op_str.split(',')[0]
        for j in ins[k + 1:k + 5]:
            if (j.mnemonic.startswith('strh') or j.mnemonic.startswith('strb')) and j.op_str.endswith(', %s]' % ro):
                rv = j.op_str.split(',')[0]
                last = None
                for q in ins[max(0, k - 6):k + 5]:
                    if q.address >= j.address: break
                    mm = re.match(r'^%s, #(\w+)$' % rv, q.op_str)
                    if q.mnemonic in ('mov', 'movw') and mm: last = int(mm.group(1), 0)
                C.append((j.address, j.mnemonic, j.op_str, last)); break
print('register-offset stores to P+0x3ae:', len(C))
for c in C: print('  %#x %s %s  value %s' % (c[0], c[1], c[2], c[3]))

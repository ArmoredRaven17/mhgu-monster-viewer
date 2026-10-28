# laneB2/idsites084.py (lane B2, 2026-10-26): every vt+0x1d0 request call in uEm084_00's band (0x1064ae0..0x108b550, emclasses; the
# arm's methods sit inside it) with the id the call passes in r1, resolved back through the straight-line code before it: an immediate,
# or base + register (a computed id), with the register's own last write. Positive control: the body's known immediate sites (1001..1006)
# and Nakarkos's u 1 range 1010..1017 / 1020..1026 must show up.
import sys, re, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
T = armdis.TEXT
LO, HI = 0x1064ae0, 0x108b550
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[LO:HI], LO))
def writes(i, reg):
    a = ins[i]
    ops = a.op_str.split(', ')
    return ops and ops[0] == reg and not a.mnemonic.startswith(('str', 'cmp', 'tst', 'b', 'push', 'vst', 'teq', 'cmn'))
def last_def(i, reg, depth=40):
    for j in range(i - 1, max(0, i - depth), -1):
        if ins[j].mnemonic in ('bl', 'blx', 'pop') and reg in ('r0', 'r1', 'r2', 'r3'): return None
        if writes(j, reg): return j
    return None
out = []
for i, a in enumerate(ins):
    if a.mnemonic == 'bl' and a.op_str in ('#0x106f8c0', '#0x107fcb0', '#0x6feb8'):
        d = last_def(i, 'r1' if a.op_str != '#0x6feb8' else 'r2')
        out.append((a.address, ('direct %s: ' % a.op_str) + ('%s %s' % (ins[d].mnemonic, ins[d].op_str) if d is not None else '?'), '')); continue
    if a.mnemonic != 'blx': continue
    tgt = a.op_str
    j = next((k for k in range(i - 1, max(0, i - 14), -1) if ins[k].mnemonic == 'ldr' and ins[k].op_str.startswith(tgt + ',') and '#0x1d0]' in ins[k].op_str), None)
    if j is None: continue
    d = last_def(i, 'r1')
    if d is None: out.append((a.address, 'r1 ?', '')); continue
    txt = '%s %s' % (ins[d].mnemonic, ins[d].op_str)
    extra = ''
    m = re.match(r'add\w*\s+r1, (r\d+|sb|sl|fp|ip|lr), (#0x[0-9a-f]+|#\d+|r\d+|sb|sl|fp|ip)', txt)
    if m:
        for r in (m.group(1), m.group(2)):
            if r.startswith('#'): continue
            dd = last_def(d, r, 60)
            if dd is not None: extra += ' | %s <- %08x %s %s' % (r, ins[dd].address, ins[dd].mnemonic, ins[dd].op_str)
    out.append((a.address, txt, extra))
for addr, txt, extra in out: print('%08x  r1 = %s%s' % (addr, txt, extra))
print('sites', len(out))

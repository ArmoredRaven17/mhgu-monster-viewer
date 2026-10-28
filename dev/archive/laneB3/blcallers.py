# laneB3/blcallers.py (lane B3, 2026-10-27): every `bl` / `b` to a target in main.text, with the argument registers r1 / r2 resolved
# back through the straight-line code before it (an immediate, or the instruction that last wrote it).
#   python dev/archive/laneB3/blcallers.py <target hex> [regs=r1,r2]
# Caveat: calls through a register / vtable (blx) are not seen; a register defined before a branch-in is shown as '?'.
import sys, struct, capstone
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as D
T = D.TEXT
tgt = int(sys.argv[1], 16)
regs = (sys.argv[2] if len(sys.argv) > 2 else 'r1,r2').split(',')
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
hits = []
for a in range(0, len(T) - 4, 4):
    w = struct.unpack_from('<I', T, a)[0]
    if (w & 0x0e000000) != 0x0a000000 or (w >> 28) == 0xf: continue
    off = w & 0xffffff
    if off & 0x800000: off -= 0x1000000
    if a + 8 + off * 4 == tgt: hits.append((a, 'bl' if w & 0x01000000 else 'b'))
for a, kind in hits:
    ins = list(md.disasm(T[a - 4 * 24:a + 4], a - 4 * 24))
    res = []
    for r in regs:
        d = '?'
        for i in reversed(ins[:-1]):
            if i.mnemonic in ('bl', 'blx', 'b', 'bx', 'pop') or i.mnemonic.startswith('b') and i.mnemonic[1:] in ('eq', 'ne', 'lo', 'hs', 'hi', 'ls', 'lt', 'ge', 'gt', 'le'):
                break
            ops = i.op_str.split(', ')
            if ops and ops[0] == r and not i.mnemonic.startswith(('str', 'cmp', 'tst', 'push', 'vst', 'teq', 'cmn')):
                d = '%x %s %s' % (i.address, i.mnemonic, i.op_str); break
        res.append('%s=%s' % (r, d))
    print('%08x %-2s  %s' % (a, kind, '  '.join(res)))
print('sites', len(hits))

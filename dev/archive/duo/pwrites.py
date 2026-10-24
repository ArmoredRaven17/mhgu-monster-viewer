# pwrites.py <cls> <out.json> [status,status..]: every (status, n) x phase 0..7 x link 0/1 x scenario of the class (tracer.py),
# recording EVERY WRITE into the partner's memory (its unit E2, its P2 = +0x1428 block, its ctl C2 = +0xcac0 block) with the pc,
# and every call made with the partner as r0. Plus the per-frame hooks run with the partner set. The control: the same hook on the
# class's OWN P block records its own writes (the phase byte), so the write hook is live on that range.
import sys, json
import tracer as t
from unicorn import UC_MEM_WRITE
from unicorn.arm_const import *
cls = sys.argv[1]
STAT = [int(x, 0) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else [0, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 16, 17]
pw = []
def mh(uc, access, addr, size, value, ud):
    if access == UC_MEM_WRITE and (t.E2 <= addr < t.E2 + 0x100000 or t.P2 <= addr < t.P2 + 0x80000 or t.C2 <= addr < t.C2 + 0x80000):
        base = 'E2' if addr < t.P2 else 'P2' if addr < t.C2 else 'C2'
        off = addr - {'E2': t.E2, 'P2': t.P2, 'C2': t.C2}[base]
        pw.append('%s+%#x=%#x@%#x' % (base, off, value & ((1 << (8 * size)) - 1), uc.reg_read(UC_ARM_REG_PC)))
t.mu.hook_add(t.UC_HOOK_MEM_WRITE, mh, begin=t.E2, end=t.E2 + 0x200000)
SCN = {'none': {}, 'end': {'ended': 1, 'timer': 1, 'frame': 1, 'ptest': 'all'},
       'endnp': {'ended': 1, 'timer': 1, 'frame': 1}, 'frame': {'frame': 1, 'ptest': 'all'}}
out = {}
for s in STAT:
    for n in range(256):
        base = t.run(cls, s, n, phase=0, link=0, extra=[(t.E + 0x7420, b'\1')])
        f = t.fmt(base)
        if any(x.startswith('CHG unhandled') for x in f) and not base.get('motions'):
            continue
        rec = {}
        for ph in range(8):
            for link in (0, 1):
                for sn, scn in SCN.items():
                    del pw[:]
                    r = t.run(cls, s, n, phase=ph, link=link, sc=dict(scn), extra=[(t.E + 0x7420, b'\1')])
                    if pw or r.get('pcalls'):
                        rec['%d/%d/%s' % (ph, link, sn)] = {'pw': sorted(set(pw)), 'pcalls': sorted(set('%#x@%#x' % x for x in r.get('pcalls', [])))}
        if rec: out['%d,%#x' % (s, n)] = rec
# the per-frame hooks / vtable slots run as methods, with the partner set and linked
import struct
vt = t.CLS[cls]['vtable']
hooks = {}
def rd(va):
    import armdis
    for b, blob in ((armdis.RO_VA, armdis.RODATA), (armdis.DA_VA, armdis.DATA)):
        if b <= va < b + len(blob): return struct.unpack_from('<I', blob, va - b)[0]
for off in range(0, 0x500, 4):
    fn = rd(vt + off)
    if not fn or not (t.CLS[cls]['lo'] <= fn < t.CLS[cls]['hi']): continue
    for link in (0, 1):
        del pw[:]
        r = t.run(cls, 1, 0x23 if cls == 'uEm069_00' else 0x21, entry=fn, link=link, extra=[(t.E + 0x7420, b'\1')])
        if pw or r.get('pcalls'):
            hooks['vt+%#x %#x link %d' % (off, fn, link)] = {'pw': sorted(set(pw)), 'pcalls': sorted(set('%#x@%#x' % x for x in r.get('pcalls', [])))}
json.dump({'actions': out, 'hooks': hooks}, open(sys.argv[2], 'w'), indent=0)
print(len(out), 'actions with partner writes / calls;', len(hooks), 'hooks')

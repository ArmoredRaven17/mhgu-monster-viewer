# linear register tracker: lists every load/store through the class block ctl = [e+0xcac0]
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.detail = False
def scan(lo, hi, offs=None, OFF=0xcac0):
    imm, ctl, ptr = {}, set(), set()
    out = []
    for a in range(lo, hi, 4):
        ins = next(md.disasm(armdis.TEXT[a:a+4], a), None)
        if not ins: continue
        m, o = ins.mnemonic, ins.op_str
        ops = [x.strip() for x in o.split(',')]
        if m.startswith('push'):
            imm, ctl, ptr = {}, set(), set(); continue
        mm = re.match(r'(ldr|str)(b|h|sb|sh|d)?(eq|ne|lo|hs|hi|ls|ge|lt|gt|le|mi|pl)?$', m)
        base = None
        mem = re.search(r'\[(\w+)(?:, #(-?0x[0-9a-f]+|-?\d+))?\]', o)
        if mm and mem:
            b = mem.group(1); off = int(mem.group(2), 0) if mem.group(2) else 0
            if b in ctl and (offs is None or off in offs):
                out.append('%08x  %-8s %s' % (a, m, o))
        dst = ops[0] if ops else None
        # derive new state
        newc = None
        if m in ('movw',) and ops[1] == '#0x%x' % OFF: imm[dst] = OFF; ctl.discard(dst); ptr.discard(dst); continue
        if m.startswith('ldr') and m[:4] in ('ldr', 'ldre', 'ldrn') or m == 'ldr':
            r2 = re.match(r'\[(\w+), (\w+)\](!?)', ', '.join(ops[1:]))
            if r2 and imm.get(r2.group(2)) == OFF:
                ctl.add(dst); ptr.discard(dst); imm.pop(dst, None)
                if r2.group(3): ptr.add(r2.group(1)); ctl.discard(r2.group(1))
                continue
            r3 = re.match(r'\[(\w+), #0x%x\]' % OFF, ', '.join(ops[1:]))
            if r3: ctl.add(dst); ptr.discard(dst); continue
            r4 = re.match(r'\[(\w+)\]$', ', '.join(ops[1:]))
            if r4 and r4.group(1) in ptr: ctl.add(dst); imm.pop(dst, None); continue
        if m == 'mov' and len(ops) == 2 and ops[1] in ctl: ctl.add(dst); continue
        if m == 'mov' and len(ops) == 2 and ops[1] in ptr: ptr.add(dst); continue
        if m == 'add' and len(ops) == 3 and imm.get(ops[2]) == OFF: ptr.add(dst); ctl.discard(dst); continue
        # any other write to dst clears
        if dst and not m.startswith(('str', 'cmp', 'tst', 'teq', 'cmn', 'b', 'vstr', 'vcmp', 'push', 'pop')) and re.match(r'r\d+|ip|lr|fp|sb|sl', dst):
            ctl.discard(dst); ptr.discard(dst); imm.pop(dst, None)
        if m.startswith('bl'):
            for r in ('r0', 'r1', 'r2', 'r3', 'ip', 'lr'): ctl.discard(r); ptr.discard(r); imm.pop(r, None)
        # post-index writeback on the base
        if mm and '!' in o and mem:
            pass
    return out
if __name__ == '__main__':
    lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
    offs = set(int(x, 0) for x in sys.argv[3].split(',')) if len(sys.argv) > 3 else None
    print('\n'.join(scan(lo, hi, offs)))

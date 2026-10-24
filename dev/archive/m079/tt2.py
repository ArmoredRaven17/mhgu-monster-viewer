"""Every 0x7a258 / 0x7a27c (angle-picked turn) call in [lo, hi): the table r1 = pc + literal (ldr r0,[pc,#x]; add r1,pc,r0),
the posture written last before it in the same function (0xbc7f4 r1 immediate), and the table's records (16-byte header,
then 16-byte records whose first halfword is the motion id, until a record of 0xffff or 12 records).
   python turntabs.py <lo hex> <hi hex>"""
import sys, struct, capstone, bisect, re
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
RO = open(r'C:\MHGU-ROM\exefs\main.rodata', 'rb').read()
RO_VA = 0x13EF000
DATA = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read()
lo, hi = int(sys.argv[1], 16), int(sys.argv[2], 16)
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
ins = list(md.disasm(T[lo:hi], lo))
starts = sorted(i.address for i in ins if i.mnemonic.startswith('push') and 'lr' in i.op_str)
for k, i in enumerate(ins):
    if i.mnemonic not in ('bl', 'b') or not i.op_str.startswith('#'):
        continue
    t = int(i.op_str[1:], 16)
    if t not in (0x7a258, 0x7a27c):
        continue
    f = starts[bisect.bisect_right(starts, i.address) - 1]
    tb = None; post = None
    for j in range(k - 1, max(0, k - 12), -1):
        p = ins[j]
        got = p.mnemonic == 'ldr' and p.op_str == 'r1, [pc, r0]'
        if (p.mnemonic == 'add' and re.match(r'r1, pc, r0', p.op_str)) or got:
            for q in range(j - 1, max(0, j - 8), -1):
                m = re.match(r'r0, \[pc, #(0x[0-9a-f]+|\d+)\]', ins[q].op_str)
                if ins[q].mnemonic == 'ldr' and m:
                    lit = struct.unpack_from('<I', T, ins[q].address + 8 + int(m.group(1), 0))[0]
                    tb = (p.address + 8 + lit) & 0xffffffff
                    if got: tb = struct.unpack_from('<I', DATA, tb - 0x1728000)[0]
                    break
            break
    for j in range(k - 1, -1, -1):
        if ins[j].address < f: break
        if ins[j].mnemonic == 'bl' and ins[j].op_str == '#0xbc7f4':
            m = re.match(r'r1, #(\d+|0x[0-9a-f]+)$', ins[j - 1].op_str)
            post = m.group(1) if m else '?'
            break
    recs = []
    if False:
        o = tb - RO_VA
        for r in range(1, 4):
            mid = struct.unpack_from('<H', RO, o + 16 * r)[0]
            if mid == 0xffff: break
            recs.append('L%d M%d' % (mid >> 8, mid & 0xff))
    print('%08x %s fn %#x posture %s table %s  %s' % (i.address, '0x%x' % t, f, post, hex(tb) if tb else '?', ', '.join(recs)))

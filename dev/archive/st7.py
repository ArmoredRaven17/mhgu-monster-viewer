"""Resolve a PIC jump table: st7.py <dispatch_base> <count> <number_offset> ; prints number -> stub -> body (following
up to 6 instructions of a stub: mov r1/r2 literals then b)."""
import sys, struct, json, collections
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
base, n, off = int(sys.argv[1], 16), int(sys.argv[2], 0), int(sys.argv[3], 0)
res = collections.defaultdict(list)
for i in range(n):
    t = (base + struct.unpack('<i', armdis.rd(base + 4 * i))[0]) & 0xffffffff
    a, args, body = t, [], None
    for _ in range(8):
        ins = next(md.disasm(armdis.TEXT[a:a + 4], a), None)
        if not ins: break
        if ins.mnemonic in ('mov', 'movw') and ins.op_str.startswith(('r1,', 'r2,', 'r3,')):
            args.append(ins.op_str)
        if ins.mnemonic == 'b':
            body = int(ins.op_str[1:], 16); break
        if ins.mnemonic == 'bl':
            body = int(ins.op_str[1:], 16); args.append('(bl)'); break
        a += 4
    res[hex(body) if body else hex(t)].append('%d:0x%02x%s' % (7, i + off, (' ' + ','.join(args)) if args else ''))
json.dump(res, open(sys.argv[4], 'w'), indent=0)
for k, v in sorted(res.items()):
    print(k, ' '.join(v))

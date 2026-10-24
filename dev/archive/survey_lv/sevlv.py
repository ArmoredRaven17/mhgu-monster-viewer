import fwread as F
bands = {'uEm046_00': (0xe9f2d8, 0xeaa058), 'uEm047_00': (0xeab974, 0xeb3eb4), 'uEm049_00': (0xeb49d0, 0xec3cd8),
         'uEm056_00': (0xedf7a8, 0xeeafc4), 'uEm082_00': (0x1034f20, 0x104a1bc)}
for cls, (lo, hi) in bands.items():
    ins = list(F.md.disasm(F.T[lo:hi], lo))
    for i, x in enumerate(ins):
        if x.mnemonic in ('bl', 'b') and x.op_str == '#0xc2274':
            ctx = ins[max(0, i - 10):i + 1]
            r3 = [c for c in ctx if c.op_str.startswith('r3, #')]
            r1 = [c for c in ctx if c.op_str.startswith('r1, #')]
            print(cls, hex(x.address), 'r1', r1[-1].op_str if r1 else '?', 'r3', r3[-1].op_str if r3 else '?')
            for c in ctx: print('    %x: %s %s' % (c.address, c.mnemonic, c.op_str))

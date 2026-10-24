# status-7 dispatcher 0xdaf774: table 0xdaf7a8 (256 offsets from 0xdaf7a8); print each number's arm up to its first b/bl/pop
import capstone, struct, collections
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
TB = 0xdaf7a8
by = collections.defaultdict(list)
for n in range(256):
    off = struct.unpack_from('<I', T, TB + 4 * n)[0]
    by[(TB + off) & 0xffffffff].append(n)
for tgt, ns in sorted(by.items()):
    out = []
    for i in md.disasm(T[tgt:tgt + 0x40], tgt):
        out.append('%s %s' % (i.mnemonic, i.op_str))
        if i.mnemonic in ('b', 'bx') or (i.mnemonic.startswith('pop') and 'pc' in i.op_str):
            break
    print('%08x  n=%s\n           %s' % (tgt, ','.join('%#x' % x for x in ns), ' ; '.join(out)))

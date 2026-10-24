# the synthesized "14 NN ff" streams at e+0xba34 (group 2's cursor): each movw #0xba35 site, the register stored there and its last
# immediate within 40 instructions before (None: computed)
import struct, capstone, re
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
n = len(T) // 4
from collections import Counter
cnt = Counter()
for i in range(n):
    w = struct.unpack_from('<I', T, 4 * i)[0]
    if (w & 0x0FF00000) == 0x03000000 and (((w >> 4) & 0xF000) | (w & 0xFFF)) == 0xba35 and (w >> 28) == 0xE:
        a = 4 * i; rd = 'r%d' % ((w >> 12) & 15)
        ins = list(md.disasm(T[a - 160:a + 24], a - 160))
        st = [x for x in ins if x.address > a and x.mnemonic == 'strb' and re.search(r'\[r\d+, %s\]' % rd, x.op_str)]
        if not st: print('%08x no strb' % a); continue
        rv = st[0].op_str.split(',')[0]
        imm = None; src = None
        for x in ins:
            if x.address >= st[0].address: break
            if x.op_str.startswith(rv + ','):
                src = '%x %s %s' % (x.address, x.mnemonic, x.op_str)
                m = re.match(r'%s, #(0x[0-9a-f]+|\d+)$' % rv, x.op_str)
                imm = int(m.group(1), 0) if (m and x.mnemonic in ('mov', 'movw')) else None
        cnt[imm] += 1
        print('%08x %s <- %s' % (a, rv, src), '' if imm is None else '= %#x' % imm)
print(cnt)

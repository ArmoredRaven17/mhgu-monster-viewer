# every movw rA, #0x3ae in main.text (raw encoding), followed within 8 words by strh rV, [rB, rA]; prints rV's mov #imm
import sys, re, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
T = armdis.TEXT; n = len(T) // 4
W = struct.unpack('<%dI' % n, T[:n * 4])
def dis(a):
    l = list(md.disasm(T[a:a + 4], a)); return (l[0].mnemonic, l[0].op_str) if l else ('?', '')
for i, w in enumerate(W):
    if (w & 0xffff0fff) != 0xe30003ae: continue
    a = i * 4; ra = 'r%d' % ((w >> 12) & 0xf)
    ra = {'r9': 'sb', 'r10': 'sl', 'r11': 'fp', 'r12': 'ip'}.get(ra, ra)
    for k in range(1, 9):
        m, o = dis(a + 4 * k)
        mm = re.match(r'(\w+), \[(\w+), (\w+)\]$', o)
        if m.startswith('strh') and mm and mm.group(3) == ra:
            rv = mm.group(1); val = None
            for j in range(-8, k):
                m2, o2 = dis(a + 4 * j)
                if m2 in ('mov', 'movw') and o2.startswith(rv + ', #'): val = o2.split('#')[1]
            print('%08x strh %s value %s' % (a + 4 * k, o, val)); break

# pstores.py <off> [lo hi]: STORES to field +off (str / strb / strh / vstr, imm forms) whose base register was loaded from [rX, #0x1428]
# (or [rX, rY] with rY = 0x1428) within the 24 instructions before -- the writers of enemy param-block field P+off
import sys, struct
sys.path.insert(0, r'C:/MHGU-Extract/efx')
import armdis, capstone
T = armdis.TEXT
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
off = int(sys.argv[1], 0); lo = int(sys.argv[2], 0) if len(sys.argv) > 2 else 0; hi = int(sys.argv[3], 0) if len(sys.argv) > 3 else len(T)
n = len(T) // 4; W = struct.unpack('<%dI' % n, T[:4 * n])
cand = []
for i in range(lo // 4, min(hi // 4, n)):
    w = W[i]
    if (w >> 28) == 0xf: continue
    # str / strb imm12 (L = 0)
    if (w & 0x0e100000) == 0x04000000 and (w >> 23) & 1 and (w & 0xfff) == off: cand.append(4 * i); continue
    # strh imm8
    if (w & 0x0e5000f0) == 0x004000b0 and (w >> 23) & 1 and (((w >> 4) & 0xf0) | (w & 0xf)) == off: cand.append(4 * i); continue
    # vstr (single / double) U = 1
    if (w & 0x0f300e00) == 0x0d000a00 and (w >> 23) & 1 and (w & 0xff) * 4 == off: cand.append(4 * i); continue
for a in cand:
    ins = list(md.disasm(T[a:a + 4], a))
    if not ins: continue
    x = ins[0]
    base = x.op_str.split('[')[1].split(',')[0].strip() if '[' in x.op_str else None
    if base in (None, 'sp', 'pc'): continue
    win = list(md.disasm(T[a - 96:a], a - 96))
    src = None
    for y in reversed(win):
        if y.op_str.startswith(base + ',') and y.mnemonic.startswith('ldr'):
            src = y; break
        if y.op_str.startswith(base + ',') and not y.mnemonic.startswith(('str', 'cmp', 'tst', 'vstr')):
            break
    if src and '0x1428' in src.op_str or (src and src.op_str.endswith('!]') is False and '0x1428' in ' '.join(z.op_str for z in win[-8:])):
        print('%x  %s %s   <- %x %s %s' % (a, x.mnemonic, x.op_str, src.address, src.mnemonic, src.op_str))

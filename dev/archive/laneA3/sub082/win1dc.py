# resolve uEm082_00 vt+0x1dc (0x103592c) per-motion arms: motion 0x210+k -> (mode r1, s0, s1) for 0xb0968 at 0x1035ad8;
# result 0 -> P+0x5d34 = 2 (blocked); result != 0 -> P+0x5d34 not refreshed (counter chippable)
import sys, struct, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
def f32(b): return struct.unpack('<f', b)[0]
T = 0x1035954
for k in range(0x42):
    off = struct.unpack('<i', armdis.rd(T + 4 * k, 4))[0]
    a = T + off
    if a == 0x1035ae4: continue
    if a == 0x1035af8:
        print("L2 M%d (%#x): WHOLE CLIP (store skipped)" % ((0x210 + k) & 0xff, 0x210 + k)); continue
    regs = {}; pc = a; n = 0
    while n < 30:
        i = next(md.disasm(armdis.TEXT[pc:pc + 4], pc)); n += 1
        m, o = i.mnemonic, i.op_str
        if m == 'vldr' and '[pc' in o:
            r = o.split(',')[0]; imm = int(re.search(r'#(-?0x[0-9a-f]+|-?\d+)', o).group(1), 0)
            regs[r] = f32(armdis.rd(pc + 8 + imm, 4))
        elif m == 'vmov.f32' and '#' in o:
            r = o.split(',')[0]; regs[r] = float(o.split('#')[1])
        elif m == 'mov' and o.startswith('r1, #'):
            regs['r1'] = int(o.split('#')[1], 0)
        if m == 'b':
            pc = int(o.lstrip('#'), 16); continue
        if m == 'bl':
            break
        pc += 4
    print('L2 M%d (%#x): mode %s s0 %s s1 %s' % ((0x210 + k) & 0xff, 0x210 + k, regs.get('r1'), regs.get('s0'), regs.get('s1')))

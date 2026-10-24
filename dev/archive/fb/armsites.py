# armsites.py <class>: every 0x7db70 / 0x7ded8 call site in the class band with its r1 (slot) / r2 (hit id) / r3 (flags) immediates,
# the enclosing function (the push before it), and the motion ids (setMotion-family calls' r1 immediates) and frame gates (vldr s0
# literals before 0xb0968 / 0xb0974 / 0xb09a4 / 0xb09b0) in that function
import sys, struct, re
sys.path.insert(0, r'C:/MHGU-Extract/efx'); sys.path.insert(0, r'C:/MHGU-Extract/efx/agents/notice-scratch')
import armdis, emclasses, capstone
C = emclasses.load()[sys.argv[1]]
T = armdis.TEXT; md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
ARM = {0x7db70: 'arm', 0x7ded8: 'arm0'}
MOT = {0xafce8, 0xafe84, 0xafe8c, 0xafef0, 0xb032c, 0xb0230, 0xb00b4, 0xb0174, 0xb03f8, 0xb04d0, 0xb0004}
GATE = {0xb0968, 0xb0974, 0xb09a4, 0xb09b0}
ins = []
for a in range(C['lo'], C['hi'], 4):
    g = list(md.disasm(T[a:a + 4], a))
    ins.append(g[0] if g else None)
def imm_before(k, reg, lim=12):
    for j in range(k - 1, max(k - lim, -1), -1):
        x = ins[j]
        if not x: continue
        s = x.mnemonic + ' ' + x.op_str
        m = re.match(r'(mov|movw)\w* ' + reg + r', #(0x[0-9a-f]+|\d+)$', s)
        if m: return int(m.group(2), 0)
        if re.match(r'\w+ ' + reg + ',', s) and not s.startswith(('cmp', 'tst', 'str', 'vstr')): return None
        if x.mnemonic in ('bl', 'blx', 'b') or x.mnemonic.startswith('pop'): return None
    return None
def fstart(k):
    for j in range(k, -1, -1):
        x = ins[j]
        if x and x.mnemonic == 'push' and 'lr' in x.op_str: return j
    return 0
funcs = {}
for k, x in enumerate(ins):
    if not x or x.mnemonic not in ('bl', 'b') or not x.op_str.startswith('#'): continue
    t = int(x.op_str[1:], 16)
    if t in ARM:
        f = fstart(k)
        funcs.setdefault(f, []).append((x.address, ARM[t], imm_before(k, 'r1'), imm_before(k, 'r2'), imm_before(k, 'r3') if t == 0x7db70 else 0))
for f, sites in sorted(funcs.items()):
    fa = ins[f].address
    # the function's extent: to the next push-lr
    e = next((j for j in range(f + 1, len(ins)) if ins[j] and ins[j].mnemonic == 'push' and 'lr' in ins[j].op_str), len(ins))
    mots = sorted({imm_before(j, 'r1') for j in range(f, e) if ins[j] and ins[j].mnemonic in ('bl', 'b') and ins[j].op_str.startswith('#') and int(ins[j].op_str[1:], 16) in MOT} - {None})
    print('fn %#x  motions %s' % (fa, [('L%d M%d' % (m >> 8, m & 0xff)) for m in mots]))
    for s in sites: print('   %#x %s slot %s hit %s flags %s' % (s[0], s[1], s[2], hex(s[3]) if s[3] is not None else None, hex(s[4]) if s[4] is not None else None))

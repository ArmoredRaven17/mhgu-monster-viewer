# vt01.py -- the vtable(s) holding Old's sp_01 reader 0xd8d41c and sp_00 reader 0xd8cf8c / sp_11 0xd8da5c; their slots; for every slot
# function (and each function its body calls directly, one level), whether it calls / branches to 0x48b884 or 0x3fa2bc
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from capstone import *
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); T = armdis.TEXT; D = armdis.DATA; DA = armdis.DA_VA
def word(a): return struct.unpack_from('<I', D, a - DA)[0]
def fnbody(a, cap=0x1200):
    out = []
    for i in md.disasm(T[a:a + cap], a):
        out.append(i)
        if (i.mnemonic == 'pop' and 'pc' in i.op_str) or (i.mnemonic == 'bx' and i.op_str == 'lr') or (i.mnemonic == 'b' and not out[:-1] and True and len(out) == 1): break
        if i.mnemonic.startswith('push') and len(out) > 1: out.pop(); break
    return out
def calls(a):
    r = []
    for i in fnbody(a):
        if i.mnemonic in ('bl', 'b', 'blx') and i.op_str.startswith('#'): r.append((i.address, i.mnemonic, int(i.op_str[1:], 16)))
    return r
for rd in (0xd8d41c,):
    hits = [DA + o for o in range(0, len(D) - 4, 4) if struct.unpack_from('<I', D, o)[0] == rd]
    print('reader', hex(rd), 'in data at', [hex(h) for h in hits])
for vt in (0x17a5f2c,):
    pass
vt = 0x17a7cb8 - 0x14c
print('vt', hex(vt), '+0x150 =', hex(word(vt + 0x150)), 'pre:', hex(word(vt - 8)), hex(word(vt - 4)))
slots = [word(vt + 4 * k) for k in range(92)]
print('slot 92 (past end):', hex(word(vt + 4 * 92)), hex(word(vt + 4 * 93)))
seen = set(); bad = []
def walk(a, depth, path):
    if a in seen or depth > 3 or not (0 < a < len(T)): return
    seen.add(a)
    for site, m, t in calls(a):
        if t in (0x48b884,): bad.append((path + [hex(a)], hex(site), m, hex(t)))
        if t in (0x3fa2bc, 0x3f883c, 0x41add8): bad.append((path + [hex(a)], hex(site), m, hex(t)))
        if m in ('bl', 'b') and t not in (0x48b884,) and t < 0x1300000: walk(t, depth + 1, path + [hex(a)])
for k, a in enumerate(slots):
    walk(a, 0, ['+%#x' % (4 * k)])
print('functions walked', len(seen))
for b in bad: print('  ', b)

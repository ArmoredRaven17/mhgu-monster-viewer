# vt02.py -- for each of Old's shell readers: the vtable holding it, its extent DERIVED (from the 0, 0 pair before it to the first word
# that is not a .text pointer), and a walk (slot functions + their direct calls, depth 3) for creates 0x48b884 and the allocators.
# Controls: sp_11 (its +0x168 0xd8db9c makes sp_01 2 / 3 / 4) and sp_00 (its landing 0xd8d08c makes sp_01 / sp_11) must show creates.
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from capstone import *
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); T = armdis.TEXT; D = armdis.DATA; DA = armdis.DA_VA
def word(a): return struct.unpack_from('<I', D, a - DA)[0]
def body(a, cap=0x1800):
    out = []
    for i in md.disasm(T[a:a + cap], a):
        if i.mnemonic.startswith('push') and out: break
        out.append(i)
        if (i.mnemonic == 'pop' and 'pc' in i.op_str) or (i.mnemonic == 'bx' and i.op_str == 'lr'): 
            # keep going past an early return only when a later branch in this body targets beyond it
            tg = [int(j.op_str[1:], 16) for j in out if j.mnemonic.startswith('b') and j.op_str.startswith('#') and not j.mnemonic.startswith(('bl', 'bx'))]
            if not any(t > i.address for t in tg): break
        if i.mnemonic == 'b' and len(out) == 1: break
    return out
def walk(a, depth, path, seen, bad):
    if a in seen or depth > 3 or not (0 < a < len(T)): return
    seen.add(a)
    for i in body(a):
        if i.mnemonic in ('bl', 'b') and i.op_str.startswith('#'):
            t = int(i.op_str[1:], 16)
            if t in (0x48b884, 0x3fa2bc, 0x3f883c, 0x41add8): bad.append(('/'.join(path + [hex(a)]), hex(i.address), i.mnemonic, hex(t)))
            elif t < 0x1300000 and not (a <= t < a + 0x1800 and i.mnemonic == 'b'): walk(t, depth + 1, path + [hex(a)], seen, bad)
for name, rd in (('sp_00 0x8a', 0xd8cf8c), ('sp_01 0x8b', 0xd8d41c), ('sp_11 0x8d', 0xd8da5c), ('sp_51 0x8e', 0xd8dfa8)):
    at = [DA + o for o in range(0, len(D) - 4, 4) if struct.unpack_from('<I', D, o)[0] == rd]
    for p in at:
        s = p
        while not (word(s - 4) == 0 and word(s - 8) == 0): s -= 4
        e = s
        while 0x1000 <= word(e) < len(T): e += 4
        n = (e - s) // 4; seen = set(); bad = []
        for k in range(n): walk(word(s + 4 * k), 0, ['+%#x' % (4 * k)], seen, bad)
        print(name, 'reader', hex(rd), 'at', hex(p), 'vtable', hex(s), 'slots', n, 'reader slot +%#x' % (p - s), 'functions', len(seen))
        for b in bad: print('    ', b)
# the vtable between sp_01's and sp_11's (the beam 0x8c's: 0x17a7cdc) and the class's own (0x17a5a24): every slot's creates, with the
# setup's id where a `mov rX, #imm` / `str rX, [rY, #4]` pair precedes the create in that function
for name, s in (('beam 0x8c? vtable', 0x17a7b6c + 0x170),):
    e = s
    while 0x1000 <= word(e) < len(T): e += 4
    n = (e - s) // 4; seen = set(); bad = []
    for k in range(n): walk(word(s + 4 * k), 0, ['+%#x' % (4 * k)], seen, bad)
    print(name, hex(s), 'slots', n, 'functions', len(seen), 'first slots', [hex(word(s + 4 * k)) for k in range(3)])
    for b in bad: print('    ', b)

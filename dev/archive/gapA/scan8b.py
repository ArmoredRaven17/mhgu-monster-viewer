# scan8b.py -- linear ARM disassembly of uEm013_00's band [lo, hi + 0x400) (emclasses), listing: every create call (bl / b 0x48b884),
# every allocation (0x3fa2bc / 0x3f883c / 0x41add8), every instruction with the immediate 0x8b (and 0x87 / 0x83 for the cross-check),
# every immediate MODE (argv[1], default 9) written into a register, and every function start (push .. lr) for attribution.
# python scan8b.py 9 (the question) / python scan8b.py 6 (the control: Old's landing 0xd8d08c makes 0x8b mode 6 via `mov r5, #6`)
import sys, os, re
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\notice-scratch')
import armdis, emclasses
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
MODE = int(sys.argv[1]) if len(sys.argv) > 1 else 9
c = emclasses.load()['uEm013_00']; lo, hi = c['lo'], c['hi'] + 0x400
md = Cs(CS_ARCH_ARM, CS_MODE_ARM)
T = armdis.TEXT
ins = []
for a in range(lo, hi, 4):
    w = T[a:a + 4]
    d = list(md.disasm(w, a))
    ins.append((a, d[0].mnemonic, d[0].op_str) if d else (a, '.word', w.hex()))
fn = None; rows = {'create': [], 'alloc': [], 'imm': [], 'nine': [], 'fn': []}
for a, m, o in ins:
    if m.startswith('push') and 'lr' in o: fn = a; rows['fn'].append(a)
    if m in ('bl', 'b') and o in ('#0x48b884',): rows['create'].append((a, fn, m))
    if m in ('bl', 'b') and o in ('#0x3fa2bc', '#0x3f883c', '#0x41add8', '#0x3fb7bc'): rows['alloc'].append((a, fn, o))
    if re.search(r'#0x8b\b|#139\b', o): rows['imm'].append((a, fn, m, o))
    if re.search(r'#0x8[37]\b', o) and m.startswith(('mov', 'cmp')): rows['imm'].append((a, fn, m, o))
    if re.match(r'(mov|movw|mvn)', m) and re.search(r', #(%d|%#x)$' % (MODE, MODE), o): rows['nine'].append((a, fn, m, o))
print('band', hex(lo), hex(hi), 'functions', len(rows['fn']))
print('mode literal', MODE)
for k in ('create', 'alloc', 'imm', 'nine'):
    print('==', k, len(rows[k]))
    for r in rows[k]: print('  ', ' '.join(hex(x) if isinstance(x, int) else str(x) for x in r))

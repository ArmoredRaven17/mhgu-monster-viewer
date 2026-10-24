# ragescan.py -- does either duo class read or write the OTHER's rage / tired state?
# Scans a code band (linear ARM disassembly) for: bl to the shared state tests 0x81670 (enraged, P+0x518 == 1),
# 0x81688 (EMC op 0x1c's enraged test), 0x81614 (tired, P+0x505); and any memory operand #0x518 / #0x505.
# For each bl, the r0 source is reported by walking back to the last write of r0 in the same basic run.
import sys, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis
from capstone import Cs, CS_ARCH_ARM, CS_MODE_ARM
T = armdis.TEXT
md = Cs(CS_ARCH_ARM, CS_MODE_ARM); md.skipdata = True
TESTS = {0x81670: 'enraged 0x81670', 0x81688: 'enraged 0x81688', 0x81614: 'tired 0x81614', 0x81634: 'tired-calm 0x81634'}

def scan(name, lo, hi):
    ins = list(md.disasm(T[lo:hi], lo))
    print('==', name, hex(lo), hex(hi), len(ins), 'instructions')
    for i, x in enumerate(ins):
        if x.mnemonic == 'bl':
            try: tgt = int(x.op_str.lstrip('#'), 16)
            except ValueError: continue
            if tgt in TESTS:
                src = '?'
                for y in reversed(ins[max(0, i - 12):i]):
                    if re.match(r'^r0\b', y.op_str) and y.mnemonic not in ('cmp', 'tst', 'str', 'strb', 'strh', 'push'):
                        src = '%s %s @%#x' % (y.mnemonic, y.op_str, y.address); break
                print('  %#x bl %s  r0 <- %s' % (x.address, TESTS[tgt], src))
        if re.search(r'#0x(518|505)\]', x.op_str):
            print('  %#x %s %s' % (x.address, x.mnemonic, x.op_str))

# positive control: the base PSL method 0xca170 calls the enraged and tired tests
scan('control 0xca170 (base PSL word)', 0xca170, 0xca1f0)
scan('uEm076_00 Seltas band', 0xfc40ec, 0xfd963c)
scan('uEm069_00 Seltas Queen band', 0xf89000, 0xf99a64)

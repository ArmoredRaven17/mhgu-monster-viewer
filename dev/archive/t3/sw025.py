# sw025.py <addr>: find the switch (add pc, rX, rY jump table on e+0x73e1) whose case stub contains addr; print number -> case address
import sys, struct, re
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis, capstone
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM)
T = armdis.TEXT
a = int(sys.argv[1], 16)
p = a
while p > a - 0x2000:
    i = next(md.disasm(T[p:p+4], p), None)
    if i and i.mnemonic == 'add' and i.op_str.startswith('pc, r'):
        break
    p -= 4
# the table follows at p + 4 (after 'add pc, r0, r1' with r1 = pc + 4 / 8)
hdr = list(md.disasm(T[p - 0x24:p + 4], p - 0x24))
for h in hdr: print('   ', hex(h.address), h.mnemonic, h.op_str)
base = p + 4
cmpn = None
for h in hdr:
    m = re.match(r'cmp r\d+, #(0x[0-9a-f]+|\d+)', h.mnemonic + ' ' + h.op_str)
    if m: cmpn = int(m.group(1), 0)
n = (cmpn or 0) + 1
for k in range(n):
    off = struct.unpack_from('<i', T, base + 4 * k)[0]
    print(k, hex(k), hex(base + off))

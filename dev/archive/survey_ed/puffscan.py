"""Rage puff gate per class: immediates 0xb7d2 / 0xb7d3 / 0x5d04 in the class's code band (an ADDRESS RANGE from
class-effects.json, not proven membership), plus vt+0x2a4 (the puff pick; 0x6bf64 = base) and vt+0x2d8.
Controls: uEm050_00 (writes e+0xb7d2 = 0 at 0xec4a94..0xec4aa0, states-em050_00.md), uEm038_00 (none, rom-map)."""
import struct, json, capstone, re
T = open(r'C:\MHGU-ROM\exefs\main.text', 'rb').read()
D = open(r'C:\MHGU-ROM\exefs\main.data', 'rb').read(); DB = 0x1728000
w = lambda va: struct.unpack_from('<I', D, va - DB)[0]
cls = {c['class']: c for c in json.load(open(r'C:\MHGU-Extract\efx\class-effects.json'))['classes']}
md = capstone.Cs(capstone.CS_ARCH_ARM, capstone.CS_MODE_ARM); md.skipdata = True
for k in ['uEm050_00', 'uEm038_00', 'uEm011_00', 'uEm012_00', 'uEm013_00', 'uEm024_00', 'uEm025_00', 'uEm027_00', 'uEm058_00', 'uEm071_00', 'uEm084_00', 'uEm086_00']:
    c = cls[k]; lo, hi = int(c['code_lo'], 16), int(c['code_hi'], 16); vt = int(c['vtable'], 16)
    hits = {0xb7d2: [], 0xb7d3: [], 0x5d04: []}
    for i in md.disasm(T[lo:hi], lo):
        m = re.search(r'#0x([0-9a-f]+)$', i.op_str)
        if m and i.mnemonic in ('movw', 'mov', 'add', 'sub', 'ldrb', 'strb') and int(m.group(1), 16) in hits:
            hits[int(m.group(1), 16)].append('%x' % i.address)
    print('%s band %x..%x  vt+0x2a4 %x  vt+0x2d8 %x  b7d2 %s  b7d3 %s  5d04 %s' % (k, lo, hi, w(vt + 0x2a4), w(vt + 0x2d8), hits[0xb7d2], hits[0xb7d3], hits[0x5d04]))

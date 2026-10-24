# The ROM's 0xca6874 with flag bit 7 (the angle factor 0xca6988) under the emulator: cases for the JS comparison.
import sys, json, struct, math
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract')
import efx_load
from unicorn.arm_const import UC_ARM_REG_S0

x = efx_load.LoadedEffect(r'C:/MHGU-Extract/scratch-effects-em/effect/cm/cm202_050.efl')
e = x.e
P, A, B = x.malloc(0x40), x.malloc(0x10), x.malloc(0x10)
thr = (100.0, 300.0, 600.0, 900.0)
vecs_a = [(0, 0, 1), (0, 0, -1), (1, 0, 0), (0.6, 0, 0.8), (0, 1, 0), (0.2, -0.3, 0.93)]
vecs_b = [(0, 0, 5), (3, 0, 4), (0, -2, 0), (1e-9, 0, 0), (0, 0, 0), (-1, 1, -1), (float('nan'), 0, 1)]
cases = []
for flags in (0x80, 0x20000080):
    for b2 in (0, 1):
        for b3 in (0, 0x10):
            for lo, hi in ((0.3, 1.2), (0.0, 3.14159), (1.0, 1.0001)):
                for a in vecs_a:
                    for b in vecs_b:
                        d = 450.0
                        e.uc.mem_write(P, struct.pack('<I', flags) + bytes([0, 0, b2, b3])[2:4] if False else
                                       struct.pack('<I', flags))
                        blob = bytearray(0x40)
                        struct.pack_into('<I', blob, 0, flags)
                        blob[2] = (flags >> 16 & 0xff) | b2
                        blob[3] = (flags >> 24 & 0xff) | b3
                        struct.pack_into('<4f', blob, 0x10, *thr)
                        struct.pack_into('<2f', blob, 0x20, lo, hi)
                        struct.pack_into('<f', blob, 0x28, 0.0)
                        e.uc.mem_write(P, bytes(blob))
                        e.uc.mem_write(A, struct.pack('<4f', *a, 0))
                        e.uc.mem_write(B, struct.pack('<4f', *b, 0))
                        e.uc.reg_write(UC_ARM_REG_S0, struct.unpack('<I', struct.pack('<f', d))[0])
                        r = x.call(0xca6874, (P, A, B, 255), 'fade')
                        if e.fault:
                            print('fault', e.fault, file=sys.stderr); e.fault = None; continue
                        cases.append({'p': bytes(blob).hex(), 'a': list(a), 'b': ['nan' if v != v else v for v in b], 'd': d, 'mul': 255,
                                      'rom': r & 0xffffffff})
json.dump(cases, open(r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\anglegrid.json', 'w'))
print(len(cases), 'cases')

# gotref.py <vtable>... -- the functions that store each vtable (through its GOT slot holding vtable - 8): the ctors
import sys, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import armdis as A
T = A.TEXT
for v in [int(x, 0) for x in sys.argv[1:]]:
    needle = struct.pack('<I', v - 8); slots = []
    for data, b in ((A.RODATA, A.RO_VA), (A.DATA, A.DA_VA)):
        i = data.find(needle)
        while i >= 0:
            if (b + i) % 4 == 0: slots.append(b + i)
            i = data.find(needle, i + 1)
    hits = []
    for slot in slots:
        for q in range(0, len(T) - 4, 4):
            W = struct.unpack_from('<I', T, q)[0]
            a = (slot - 8 - W) & 0xffffffff
            if a % 4 or a >= len(T) - 4: continue
            ins = struct.unpack_from('<I', T, a)[0]
            if (ins & 0x0fff0ff0) == 0x079f0000 and ((ins >> 12) & 0xf) == (ins & 0xf):   # ldr rX, [pc, rX]
                hits.append(hex(a))
    print(hex(v), [hex(s) for s in slots], hits[:6])

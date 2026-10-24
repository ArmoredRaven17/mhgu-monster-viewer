# every PIC materialisation (ldr rT,[pc,#imm] ... add rD, pc, rT) whose address is in the targets
import sys, struct, pickle, os
sys.path.insert(0, r'C:\MHGU-Extract\efx'); import armdis
T = armdis.TEXT
CACHE = os.path.join(os.path.dirname(__file__), 'picrefs.pkl')
if os.path.exists(CACHE):
    refs = pickle.load(open(CACHE, 'rb'))
else:
    refs = {}
    n = len(T) // 4
    W = struct.unpack('<%dI' % n, T[:n*4])
    for i in range(n):
        w = W[i]
        if (w & 0xFFFF0000) != 0xE59F0000: continue
        rt = (w >> 12) & 0xF
        lit = armdis.u32(i*4 + 8 + (w & 0xFFF))
        if lit is None: continue
        for j in range(i+1, min(n, i+12)):
            x = W[j]
            if (x & 0xFFFF0FF0) == 0xE08F0000 and (x & 0xF) == rt:
                a = (j*4 + 8 + lit) & 0xFFFFFFFF
                refs.setdefault(a, []).append(j*4)
                break
    pickle.dump(refs, open(CACHE, 'wb'))
for t in sys.argv[1:]:
    t = int(t, 16)
    print(hex(t), [hex(x) for x in refs.get(t, [])])

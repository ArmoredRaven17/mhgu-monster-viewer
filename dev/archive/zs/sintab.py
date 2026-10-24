import sys, struct, math, json
sys.path.insert(0, r'C:\MHGU-Extract\build\arm'); sys.path.insert(0, r'C:\MHGU-Extract\efx')
import emu, armdis as A
E = emu.Emu()
for fn in emu.init_array():
    if fn in (0, 0xffffffff): continue
    E.fault = None; E.call(fn, (), tag='init', budget=2_000_000)
slot = (0x408a98 + 8 + 0x1429718) & 0xffffffff
tab = struct.unpack('<I', bytes(E.uc.mem_read(slot, 4)))[0]
vals = struct.unpack('<4096f', bytes(E.uc.mem_read(tab, 4 * 4096)))
f32 = lambda x: struct.unpack('<f', struct.pack('<f', x))[0]
bad = [k for k in range(4096) if vals[k] != f32(math.sin(2 * math.pi * k / 4096))]
print(hex(slot), hex(tab), vals[:4], vals[1024], len(bad), bad[:10], [ (vals[k], f32(math.sin(2*math.pi*k/4096))) for k in bad[:5]])
json.dump(list(vals), open('sintab.json', 'w'))

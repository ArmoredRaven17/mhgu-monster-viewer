# notice_sense.py (effects lane, 2026-10-25): the per-monster inputs of the shared sense scan 0xc3088 / 0xc3c4c / 0xc411c,
# read out of each monster's own files by the game's own loaders (tune_emu.Loader: dttune 0x57684, dtbase 0x53800), and its
# P+0x1a8 flag word (0x6b340 -> 0x50aa8 index -> table 0x159c2dc).
#   sense record  = [[e+0x75ec](dttune obj)+0x78] + 32 * P+0x249           (0x71088; the loader reads 32 x obj byte +0xf9 records, 0x5785c..0x578a4)
#     +0 s32 joint (-1: none, the eye is P+0x40 + (0, 50, 0) and the angles P+0x50 / P+0x54, 0xc3474)
#     +4 / +6 u16 the eye's two turn angles (both 0: the joint's Z row as is, 0xc34c0)
#     +8 f32 the near radius (3-D distance P+0x2e8+4i below it: detected outright, 0xc3c98)
#     +0xc f32 the range (horizontal, eye to target, 0xc4160)
#     +0x10 / +0x14 f32 the height band above / below the eye (0xc41ac..0xc4210)
#     +0x18 / +0x1a u16 the half-angles, yaw / pitch (0xc4188 / 0xc4260)
#     +0x1c 4 bytes, not read by the scan (kept as hex)  [WITHDRAWN 2026-10-25, Flashed state: not read by the HUNTER test; the same
#       scan's flash test reads +0x1c / +0x1e as u16 yaw / pitch half-angles at 0xc39f4 / 0xc3a08 -- rom-map "Flashed", Withdrawn table]
#   memory timer  = s16 [[e+0x75e8](dtbase obj)+0x8c] (when obj+0xc7 != 0, 0x71248): +0 the reload (0xc3800..0xc3818), +2 the
#     state-1 timeout (0xc8de0)
# Positive control: em001_00 record 0 is joint 3, 500 / 6000 / 1500 / 1500, 100 / 60 degrees (rom-map 0xc3c4c row).
import sys, os, json, struct
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\narga-scratch')
sys.path.insert(0, r'C:\MHGU-Extract\efx')
from tune_emu import Loader
import armdis
R = r'C:\MHGU-Extract\build\frag\monster-data-raw'
ids = sys.argv[1:]
TAB = 0x1594ca4
def flags1a8(key):
    if key == 0x1063: return 0x400c2080
    for i in range(0x89):
        if armdis.u32(TAB + 8 * i) == key:
            return armdis.u32(0x159c2dc + 4 * armdis.u32(TAB + 8 * i + 4))
    return None
out = {}
for mid in ids:
    em, v = int(mid[2:5]), int(mid[6:8])
    rec = {'flags1a8': None, 'sense': None, 'mem': None}
    f = flags1a8((v << 8) | em)
    rec['flags1a8'] = f
    t = os.path.join(R, mid + '_dttune.dtt'); b = os.path.join(R, mid + '_dtbase.dtb')
    if os.path.exists(t):
        L = Loader(t, 0x57684)
        p = L.u32(L.obj + 0x78)
        s = []
        n = L.rd(L.obj + 0xf9, 1)[0]
        rec['count'] = n
        for i in range(n):
            d = L.rd(p + 32 * i, 32)
            s.append([struct.unpack_from('<i', d, 0)[0]] + list(struct.unpack_from('<HH', d, 4))
                     + [struct.unpack_from('<f', d, o)[0] for o in (8, 0xc, 0x10, 0x14)] + list(struct.unpack_from('<HH', d, 0x18)) + [d[0x1c:].hex()])
        rec['sense'] = s
    if os.path.exists(b):
        D = Loader(b, 0x53800)
        o = D.rd(D.obj, 0xd0)
        if o[0xc7]:
            q = struct.unpack_from('<I', o, 0x8c)[0]
            rec['mem'] = list(struct.unpack_from('<hh', D.rd(q, 4)))
        else:
            rec['mem'] = 'none (dtbase +0xc7 == 0)'
    out[mid] = rec
json.dump(out, sys.stdout, indent=0)

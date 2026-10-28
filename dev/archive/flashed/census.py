"""census.py -- the flash inputs per monster, read out of each monster's own files by the game's own loaders (tune_emu.Loader):
  P+0x3a8 = dtbase obj +0x6c (0x9cd50 <- 0x711c8, the base init 0xa4b90): bit 2 (0x4) is the flash gate 0x99c58(e, 4) at 0xc3950;
            bit 3 (0x8) lets the flash through in posture 4 (0xc39c0..0xc39dc).
  the blind duration rows = dttune obj+0x64 (tune) +0x58 -> E, four row pointers; 0xa1a88 reads E[1] (= [E+4]) -> s16 x3
            [calm, enraged (0x81670) or 0x816b8 == 1, tired (0x81614)]; a null E or E[1] -> 1800.0 (literal 0xa1bf0).
  the sense record 0 (dttune obj+0x78, 32 B, 0x71088): +0x1c / +0x1e u16 = the flash test's yaw / pitch half-angles
            ([sb+0x18] / [sb+0x1a], sb = sp+0xe4 = the record copy + 4; 0xc39f4 / 0xc3a08).
Flashed read 2026-10-25. Writes census.json beside this file."""
import sys, os, struct, json
sys.path.insert(0, r'C:\MHGU-Extract\efx\agents\narga-scratch')
from tune_emu import Loader
ROOT = r'C:\MHGU-Extract\scratch-em'
mons = sys.argv[1:] or sorted(os.listdir(ROOT))
out = {}
for v in mons:
    pt = os.path.join(ROOT, v, 'enemy', 'dt_tune', '%s_dttune.dtt' % v)
    pb = os.path.join(ROOT, v, 'enemy', 'dt_base', '%s_dtbase.dtb' % v)
    row = {}
    if os.path.exists(pb):
        B = Loader(pb, 0x53800)
        row['flags'] = B.u32(B.obj + 0x6c)
        row['dtb_consumed'] = [B.pos, len(B.data)]
    if os.path.exists(pt):
        L = Loader(pt, 0x57684)
        row['dtt_consumed'] = [L.pos, len(L.data)]
        tune = L.obj + 0x64
        E = L.u32(tune + 0x58)
        rows = []
        if E:
            for k in range(4):
                p = L.u32(E + 4 * k)
                rows.append(list(struct.unpack('<3h', L.rd(p, 6))) if p else None)
        row['rows58'] = rows if E else None
        row['blind'] = rows[1] if (E and rows[1]) else None
        S = L.u32(L.obj + 0x78)
        if S:
            rec = L.rd(S, 32)
            row['sense0'] = {'joint': struct.unpack_from('<i', rec, 0)[0], 'flashYaw': struct.unpack_from('<H', rec, 0x1c)[0],
                             'flashPitch': struct.unpack_from('<H', rec, 0x1e)[0]}
    f = row.get('flags')
    row['bit2'] = None if f is None else bool(f & 4)
    row['bit3'] = None if f is None else bool(f & 8)
    out[v] = row
    print(v, json.dumps(row))
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'census.json'), 'w'), indent=1)

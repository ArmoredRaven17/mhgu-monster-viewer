"""rescols.py (hyper audit, 2026-10-28): the .mdd loader 0x4bd64's own table -- per monster (the em-id -> index pairs at 0x1594ca4,
0x89 of them, read by 0x50aa8) the row 0x172ba68[index] (GOT 0x1832544, ldr at 0x4bda4) and its resource columns 0x26 (below G) /
0x27 (G): a path index, or -1 = no file. -> rescols.json {id: has a path}, rescols_full.json.  python rescols.py"""
import sys, struct, json, os
sys.path.insert(0, r'C:\MHGU-Extract\efx'); sys.argv = ['x', '0', '0']
exec(open(r'C:\MHGU-Extract\efx\armdis.py').read().split("if __name__")[0])
u = lambda a: struct.unpack('<I', rd(a))[0]
H = os.path.dirname(os.path.abspath(__file__))
out = {}
for i in range(0x89):
    em, idx = u(0x1594ca4 + 8 * i), u(0x1594ca4 + 8 * i + 4)
    row = u(0x172ba68 + 4 * idx)
    c26, c27 = u(row + 4 * 0x26), u(row + 4 * 0x27)
    out['em%03d_%02d' % (em & 0xff, em >> 8)] = {'index': idx, 'row': hex(row), 'col26': None if c26 == 0xffffffff else c26, 'col27': None if c27 == 0xffffffff else c27}
json.dump({k: (v['col26'] is not None or v['col27'] is not None) for k, v in out.items()}, open(os.path.join(H, 'rescols.json'), 'w'), indent=0)
json.dump(out, open(os.path.join(H, 'rescols_full.json'), 'w'), indent=0)
print(len(out), 'monsters,', sum(1 for v in out.values() if v['col26'] is not None), 'with a column 0x26 path,', sum(1 for v in out.values() if v['col27'] is not None), 'with 0x27')

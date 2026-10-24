import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'; os.environ['FB_WATCH'] = '0x9d36c'
exec(open('trgen.py').read())
X = E + 0x380000; A = E + 0x380100
ROWS = bytes([6, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 3, 4, 2, 2, 3]) + bytes(12)
DTP = {E + 0x75f0: struct.pack('<I', X), X + 0x64: struct.pack('<I', A), A: ROWS}
for n in [4, 5, 0x11, 0x12, 9, 0xa, 0xf, 0x10] + list(range(0x13, 0x1f)) + [0x23, 0x24, 0x25, 0x26, 0x31, 0x32, 0x33, 0x34]:
  res = []
  for lv in (0, 2):
    for rage in (0, 1):
      for sev in (0, 1):
        r = run(7, n, phase=0, frame=0, ended=1, rage=rage, stub={0x3a8430: 5, 0x49930: 10, 0x9d36c: lv, 0xa3bf4: sev}, poke=dict(DTP))
        ctl = bytes(mu.mem_read(C, 0x100))
        res.append((lv, rage, sev, struct.unpack_from('<iiH', ctl, 0x70), sorted(set(e[2] for e in r.get('ev', []) if e[0] == 'watch'))))
  vals = set(x[3] for x in res)
  print('7:0x%02x' % n, vals if len(vals) == 1 else res)

import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'; os.environ['FB_WATCH'] = '0x9d36c'
exec(open('trgen.py').read())
X = E + 0x380000; A = E + 0x380100
ROWS = bytes([6, 2, 2, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 2, 2, 3, 4, 2, 2, 3]) + bytes(12)
DTP = {E + 0x75f0: struct.pack('<I', X), X + 0x64: struct.pack('<I', A), A: ROWS}
L = [(1,0x17),(1,0x18),(1,0x19),(1,0x1b),(7,0),(7,3),(7,4),(7,5),(7,8),(7,0xb),(7,0xc),(7,0x11),(7,0x12),(7,0x2d),(7,0x2e),(7,0x2f),(7,0x30),(7,0x38),(7,0x39),(7,0x3a),(7,0x3b),(7,0x3e),(7,0x3f),(7,0x40)]
for st, n in L:
  for lv in (0, 2):
    for rank in (3, 5):
      stub = {0x3a8430: rank, 0x49930: 10, 0x9d36c: lv}
      run(st, n, phase=0, frame=0, ended=1, stub=stub, poke=dict(DTP))
      ctl = bytes(mu.mem_read(C, 0x100)); pb = bytes(mu.mem_read(P, 0x400))
      out = []; parts = set()
      for ph in (1, 2):
          poke = {P: pb, P + 0x1a1: bytes([ph, 0, 0])}; poke.update(DTP)
          r = run(st, n, phase=ph, frame=1, frame2=1, stub=stub, ctl=ctl, poke=poke)
          parts |= set(e[2] for e in r.get('ev', []) if e[0] == 'watch')
          for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
              if e[1] != '0x13e': continue
              b = bytes.fromhex(raw)
              out.append((ph, e[2], struct.unpack_from('<i', b, 0x10)[0], e[6]))
      print('%d:0x%02x lv %d rank %d parts %s ctl70 %d' % (st, n, lv, rank, sorted(parts), struct.unpack_from('<i', ctl, 0x70)[0]), out)

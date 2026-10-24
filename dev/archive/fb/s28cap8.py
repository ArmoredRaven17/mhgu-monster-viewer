import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
exec(open('trgen.py').read())
for mot in (0x21d, 0x230):
  for a70 in (0, 1):
    for a74 in (0, 1):
      for a78 in (0, 1):
        for sev in (0, 1):
          ctl = bytearray(0x100); struct.pack_into('<iiH', ctl, 0x70, a70, a74, a78)
          r = run(1, 0, fn=0xfddfcc, mot=mot, frame=1, frame2=1, ctl=bytes(ctl), stub={0x3a8430: 5, 0x49930: 10, 0xa3bf4: sev})
          out = []
          for e, raw in zip([e for e in r.get('ev', []) if e[0] == 'create'], r.get('raw', [])):
              b = bytes.fromhex(raw)
              out.append((e[2], struct.unpack_from('<i', b, 0x10)[0], b[0x1c], struct.unpack_from('<i', b, 0x20)[0], e[6][1]))
          print(hex(mot), a70, a74, a78, 'sev', sev, out)

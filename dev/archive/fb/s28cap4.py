import os, sys, json, struct
os.environ['FB_CLASS'] = 'uEm077_00'; os.environ['FB_MON'] = 'em077_00'
exec(open('trgen.py').read())
for mot in (0x21d, 0x230):
  for rank in (3, 5):
    r = run(1, 0, fn=0xfddfcc, mot=mot, frame=1, frame2=1, stub={0x3a8430: rank, 0x49930: 10, 0xa3bf4: 1, 0x81670: 1, 0x81688: 1, 0x816b8: 1})
    out = []
    cr = [e for e in r.get('ev', []) if e[0] == 'create']
    for e, raw in zip(cr, r.get('raw', [])):
        b = bytes.fromhex(raw)
        out.append((e[1], e[2], struct.unpack_from('<i', b, 0x10)[0], b[0x1c], struct.unpack_from('<i', b, 0x20)[0], e[6], e[5]))
    print(hex(mot), rank, out, r.get('end', ''))
r = run(1, 0, fn=0xfddfcc, mot=0x21d, frame=1, frame2=1, stub={0x3a8430: 5, 0x49930: 10, 0xa3bf4: 1, 0x81670: 1, 0x81688: 1, 0x816b8: 1})
print([e for e in r['ev'] if e[0] in ('ftest', 'ftest2')])

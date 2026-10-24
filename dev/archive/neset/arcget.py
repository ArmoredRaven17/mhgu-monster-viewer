# arcget.py <arc> <type hex> <outdir>: extract every entry of that resource type from an MT ARC (zlib entries)
import sys, struct, zlib, os
p, typ, out = sys.argv[1], int(sys.argv[2], 16), sys.argv[3]
b = open(p, 'rb').read()
assert b[:4] == b'ARC\x00'
ver, cnt = struct.unpack_from('<HH', b, 4)
os.makedirs(out, exist_ok=True)
for i in range(cnt):
    o = 12 + i * 80
    path = b[o:o + 64].split(b'\0')[0].decode('latin1')
    t, csz, usz, off = struct.unpack_from('<IIII', b, o + 64)
    if t != typ: continue
    raw = b[off:off + csz]
    try: data = zlib.decompress(raw)
    except Exception: data = raw
    fn = os.path.join(out, path.replace('\\', '_') + '.bin')
    open(fn, 'wb').write(data)
    print(path, hex(t), csz, usz & 0x1fffffff, len(data), '->', fn)

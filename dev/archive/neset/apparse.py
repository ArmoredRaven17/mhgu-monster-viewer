# apparse.py <file.bin>: rAreaPatrolData (XFS) records, read heuristically from the data section: each record's mMapNo / mAreaNo /
# mIndex (the bytes 0x69bb74 matches at rec+4 / +5 / +6) and its mAreaDataArray points (mPointPos x, y, z, mRadius)
import sys, struct, re
b = open(sys.argv[1], 'rb').read()
f = lambda o: struct.unpack_from('<f', b, o)[0]
# record header: '01 00 00 00 00 <map>' '01 00 00 00 00 <area>' '01 00 00 00 00 <index>' after a class-5 head
for m in re.finditer(rb'\x05\x00(.)\x00(....)\x01\x00\x00\x00\x00(.)\x01\x00\x00\x00\x00(.)\x01\x00\x00\x00\x00(.)', b, re.S):
    print('record @%#x: map %d area %d index %#x' % (m.start(), m.group(3)[0], m.group(4)[0], m.group(5)[0]))
# point: '07 00 <k> 00 30 00 00 00 01 00 00 00 00' x y z w '01 00 00 00 00' radius
for m in re.finditer(rb'\x07\x00(.)\x00\x30\x00\x00\x00\x01\x00\x00\x00\x00', b, re.S):
    o = m.end() - 1
    print('  point k=%d: (%.1f, %.1f, %.1f) radius %.1f' % (m.group(1)[0], f(o), f(o + 4), f(o + 8), f(o + 21)))

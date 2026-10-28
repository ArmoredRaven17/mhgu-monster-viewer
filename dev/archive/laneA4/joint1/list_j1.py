"""Lane A4: every exported effect record whose joint (payload +0x32, s16) is -1, across docs/effects/*.json.
Fields (payload offsets, efx/proof.py block(); rom-map rows 0x328c10 / 0x329390 / 0x42744):
  +0x00 offset vec3, +0x32 joint, +0x36 mode, +0x38 space, +0x40 BYTE = spawn-height test on (0x329390 ldrb),
  +0x58 f32 = its limit, +0x52 byte / +0x5c word = the ground ray (0x42744: +0x52 set, +0x5c bit 0 / bit 4).
Writes joint1_records.json beside this file and prints a table."""
import json, os, struct, glob, sys

DOCS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'joint1_records.json')
rows = []
for f in sorted(glob.glob(os.path.join(DOCS, 'em*.json'))):
    d = json.load(open(f))
    mon = d.get('monster') or os.path.basename(f)[:-5]
    for i, e in enumerate(d.get('effects', [])):
        r = e.get('record')
        if not r or not r.get('payload'):
            continue
        p = bytes.fromhex(r['payload'])
        j = struct.unpack_from('<h', p, 0x32)[0]
        if j != -1:
            continue
        off = struct.unpack_from('<3f', p, 0)
        rows.append(dict(
            file=os.path.basename(f), monster=mon, i=i, pel=r.get('pel'), key=r.get('key'), efl=e.get('efl'),
            when=e.get('when'), mode=p[0x36], space=p[0x38], offset=[round(x, 2) for x in off],
            sh=p[0x40], shLimit=round(struct.unpack_from('<f', p, 0x58)[0], 2) if len(p) >= 0x5c else None,
            ray52=p[0x52] if len(p) > 0x52 else None,
            ray5c=struct.unpack_from('<I', p, 0x5c)[0] if len(p) >= 0x60 else None,
            joints=e.get('joints')))
json.dump(rows, open(OUT, 'w'), indent=1)
if '-q' not in sys.argv:
    for r in rows:
        print('%-10s %-11s %5s %-6s m%d s%d sh%d %-7s r52 %s r5c %s off %s %s' % (
            r['monster'], r['pel'], r['key'], r['when'], r['mode'], r['space'], r['sh'], r['shLimit'],
            r['ray52'], hex(r['ray5c'] or 0), r['offset'], r['efl']))
print(len(rows), 'joint -1 records;', sum(1 for r in rows if r['sh']), 'with the spawn-height test;',
      len({r['monster'] for r in rows}), 'monsters')

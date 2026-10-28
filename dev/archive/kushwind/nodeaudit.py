"""kushwind/nodeaudit.py: every exported record whose built rows hang from a node that FACES THE CAMERA (0x9bca30, left out of
the viewer until 2026-10-27). A node's +0x110 bit 12 = its block +4 & 0x30000, bit 13 = block +4 bit 17 (0xae83c8:
0xae8808 / 0xae883c): bit 13 aims the node's Z at the camera (0xafb350), bit 12 alone turns its rows by the camera's
inverse view. A row is built when base +0 & MASK1 and base +4 & MASK2 (0x9bb8fc); the base row's low byte is its node.
Prints per record: the camera nodes, the rows on them, and whether any of those rows also has a shape-6 Z offset (those
move on screen with the fix; the others only turn)."""
import json, os, struct, sys, importlib.util, collections
DOCS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects'
spec = importlib.util.spec_from_file_location('dec', r'C:\MHGU-RE\offline\root\decode-efl-psl.py')
dec = importlib.util.module_from_spec(spec); spec.loader.exec_module(dec)
cache = {}
def efl(p):
    if p not in cache: cache[p] = dec.decode_efl(open(os.path.join(DOCS, p), 'rb').read())
    return cache[p]
mons = sys.argv[1:] or sorted(f[:-5] for f in os.listdir(DOCS) if f.startswith('em') and f.endswith('.json'))
tot = collections.Counter(); moved = []
for mon in mons:
    d = json.load(open(os.path.join(DOCS, mon + '.json')))
    for e in d['effects']:
        r = e.get('record')
        if not r or not e.get('efl', '').endswith('.efl'): continue
        b = bytes.fromhex(r['payload']); m1, m2 = struct.unpack_from('<II', b, 0x48)
        try: hdr, elems, jr = efl(e['efl'])
        except Exception: continue
        cam = {i: ('aim' if j['w4'] & 0x20000 else 'turn') for i, j in enumerate(jr) if j['w4'] & 0x30000}
        rows = [el for el in elems if (el['baseBlk']['w00'] & m1) and (el['baseBlk']['w04'] & m2) and el['joint'] in cam]
        if not rows: continue
        off = [el['index'] for el in rows if (el['baseBlk']['w78'] & 0xff) == 6 and el['baseBlk']['f70']]
        tot[e['when']] += 1
        line = '%s %s:%s (%s) %s nodes %s rows %s%s' % (mon, r['pel'], r['key'], e['when'], e['efl'],
               {k: v for k, v in cam.items()}, [el['index'] for el in rows], ('  shape-6 offset rows %s' % off) if off else '')
        print(line)
        if off: moved.append(line)
print('\nrecords with rows on a camera node:', sum(tot.values()), dict(tot))
print('of them with a shape-6 Z offset on such a row (they move on screen):', len(moved))

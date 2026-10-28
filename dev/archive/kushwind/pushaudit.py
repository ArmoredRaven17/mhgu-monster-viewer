"""kushwind/pushaudit.py [mon ...]: which exported effect records draw a model particle that the model draw pushes along the camera
ray (0xa9272c: param +0x10c bit 28 -> 0xa93374..0xa93408, pos += param +0x110 x gen +0xfc x unit(pos - eye)) while its emitter
places it OFF the node along the frame's Z (base block +0x78 low byte = the shape; shape 6 puts z = +0x70 + rnd x +0x74:
0xa59c1c -> 0xa5b488 -> 0xa5bc50) -- the pair that
makes a particle's drawn place depend on the camera's angle (Kushala's u 10 dome, 2026-10-27). Also the facing mode
(param +0x100 bits 8..11 -> 0xaf9d20 / 0xafa464) and the record's placement (joint +0x32, mode +0x36, space +0x38).

A record's rows: an element is built when base +0 & MASK1 (payload +0x48) and base +4 & MASK2 (payload +0x4c) (0x9bb8fc).
With no monster ids, every docs/effects/<mon>.json is read and only the flagged records are printed.
"""
import json, os, struct, sys, importlib.util
DOCS = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\effects'
spec = importlib.util.spec_from_file_location('dec', r'C:\MHGU-RE\offline\root\decode-efl-psl.py')
dec = importlib.util.module_from_spec(spec); spec.loader.exec_module(dec)

cache = {}
def efl(path):
    if path not in cache:
        cache[path] = dec.decode_efl(open(os.path.join(DOCS, path), 'rb').read())
    return cache[path]

def audit(mon, only_flagged):
    d = json.load(open(os.path.join(DOCS, mon + '.json')))
    out = []
    for e in d['effects']:
        r = e.get('record')
        if not r or not e.get('efl', '').endswith('.efl'): continue
        b = bytes.fromhex(r['payload'])
        joint = struct.unpack_from('<h', b, 0x32)[0]
        mode, space = b[0x36], b[0x38]
        m1, m2 = struct.unpack_from('<II', b, 0x48)
        try: hdr, elems, jr = efl(e['efl'])
        except Exception as x: out.append((False, '%s %s:%s %s decode failed %s' % (mon, r['pel'], r['key'], e['efl'], x))); continue
        rows, flagged = [], False
        for el in elems:
            bb, gb = el['baseBlk'], el['genBlk']
            if not ((bb['w00'] & m1) and (bb['w04'] & m2)): continue
            shape, off = bb['w78'] & 0xff, bb['f70']
            if el['genType'] == 5:
                face = (gb['w100'] >> 8) & 0xf
                push = gb['f110'] if (gb['w10c'] >> 28) & 1 else 0.0
                cam = bool(push) and bool(off) and shape == 6        # shape 6: z = +0x70 + rnd x +0x74 (0xa5bc50); shape 5's +0x70 is a radius
                flagged |= cam
                rows.append('el %d node %d %s face %d push %g shape %d off %g%s' % (el['index'], el['joint'], gb['model'].split('\\')[-1],
                            face, push, shape, off, '  <-- CAMERA-DEPENDENT' if cam else ''))
            else:
                rows.append('el %d node %d genType %d shape %d off %g' % (el['index'], el['joint'], el['genType'], shape, off))
        if flagged or not only_flagged:
            out.append((flagged, '%s %s:%s (%s) %s joint %d mode %d space %d mask %x/%x\n    %s' % (mon, r['pel'], r['key'], e['when'],
                        e['efl'], joint, mode, space, m1, m2, '\n    '.join(rows))))
    return out

if __name__ == '__main__':
    mons = sys.argv[1:]
    every = not mons
    if every: mons = sorted(f[:-5] for f in os.listdir(DOCS) if f.startswith('em') and f.endswith('.json'))
    n = 0
    for mon in mons:
        for flag, line in audit(mon, every):
            n += flag
            print(line)
    print('\nflagged records:', n)

"""Pull em087_00_rubble_0N.mod out of em088_00.arc (and em087_00.arc), dump the MOD joint block, and compare it to
the viewer glb's nodes / skin. Read-only."""
import struct, zlib, json, sys, hashlib
sys.path.insert(0, r'C:\MHGU-Extract\efx')
import arclist
ARCS = [r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em088_00.arc', r'C:\MHGU-ROM\romfs\nativeNX\arc\enemy\em087_00.arc']
GLB = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\models\monsters\em087_00_rubble_0%d.glb'

def from_arc(path, name):
    ver, rows = arclist.entries(path)
    d = open(path, 'rb').read()
    for nm, th, comp, dec, off in rows:
        if nm.lower().endswith(name) and th == '58a15856':
            raw = d[off:off + comp]
            try: return nm, th, zlib.decompress(raw)
            except Exception: return nm, th, raw
    return None, None, None

def mat(d, o):
    return [list(struct.unpack_from('<4f', d, o + 16 * r)) for r in range(4)]

def fmt(m):
    return ' | '.join(' '.join('%9.4f' % x for x in row) for row in m)

def mod(d):
    assert d[:4] == b'MOD\0'
    ver, nb, nmesh, nmat = struct.unpack_from('<HHHH', d, 4)
    boff = struct.unpack_from('<I', d, 0x24)[0]   # 0x84 + 24 + 64 + 64 + 256 = 0x21c = the next block (0x28)
    hdr = [hex(x) for x in struct.unpack_from('<16I', d, 0)]
    print('  version 0x%x bones %d meshes %d materials %d  boneOffset 0x%x' % (ver, nb, nmesh, nmat, boff))
    print('  header words', hdr)
    if nb == 0: return
    o = boff
    for i in range(nb):
        jid, par, mir, pad = d[o + 24 * i: o + 24 * i + 4]
        f = struct.unpack_from('<5f', d, o + 24 * i + 4)
        print('  joint %d: id %d parent %d mirror %d  furthest %.4f length %.4f offset (%.4f, %.4f, %.4f)' % ((i, jid, par, mir) + f))
    lo = o + 24 * nb
    io = lo + 64 * nb
    for i in range(nb):
        print('  local[%d]   %s' % (i, fmt(mat(d, lo + 64 * i))))
        print('  invbind[%d] %s' % (i, fmt(mat(d, io + 64 * i))))
    remap = d[io + 64 * nb: io + 64 * nb + 256]
    print('  remap (id -> index) non-0xff:', {i: b for i, b in enumerate(remap) if b != 0xff})

def glb(path):
    d = open(path, 'rb').read()
    jl = struct.unpack_from('<I', d, 12)[0]
    j = json.loads(d[20:20 + jl])
    bo = 20 + jl
    bl = struct.unpack_from('<I', d, bo)[0]
    bin_ = d[bo + 8: bo + 8 + bl]
    print('  nodes:')
    for i, n in enumerate(j['nodes']):
        print('   ', i, n.get('name'), {k: n[k] for k in ('translation', 'rotation', 'scale', 'matrix', 'children', 'mesh', 'skin') if k in n})
    print('  scenes', j.get('scenes'))
    for s in j.get('skins', []):
        print('  skin joints', s['joints'], 'skeleton', s.get('skeleton'))
        a = j['accessors'][s['inverseBindMatrices']]
        bv = j['bufferViews'][a['bufferView']]
        off = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        for k in range(a['count']):
            m = struct.unpack_from('<16f', bin_, off + 64 * k)   # column-major
            rows = [[m[c * 4 + r] for c in range(4)] for r in range(4)]
            print('   IBM[%d] (rows) %s' % (k, ' | '.join(' '.join('%9.4f' % x for x in row) for row in rows)))
    for mi, m in enumerate(j.get('meshes', [])):
        for p in m['primitives']:
            a = j['accessors'][p['attributes']['POSITION']]
            print('  mesh', mi, 'POSITION', a.get('componentType'), a.get('normalized'), 'min', a.get('min'), 'max', a.get('max'))

for k in (1, 2, 3):
    name = 'em087_00_rubble_0%d' % k
    print('=====', name)
    for arc in ARCS:
        nm, th, data = from_arc(arc, name)
        if data is None: print(' not in', arc); continue
        print(' arc', arc.split('\\')[-1], nm, th, len(data), hashlib.md5(data).hexdigest())
        if data[:4] == b'MOD\0' and arc == ARCS[0]:
            mod(data)
    print(' glb'); glb(GLB % k)

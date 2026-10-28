# patch_uv1.py: put the ROM's own second-map UV into each two-map primitive's TEXCOORD_1.
#   python -I patch_uv1.py census.json backupdir [--apply]
# The census (uvcensus.py) gives, per two-map primitive, the ROM layout and the byte offset of the UV slot its second map samples
# (the layout's UV_Secondary / UV_Extend element, docs/effects/model-shaders.json). Per primitive:
#   TEXCOORD_1 present and not the slot's values   -> overwritten with them (in place)
#   TEXCOORD_1 absent and the slot is not UV_Primary -> added (a new accessor + bufferView at the end of the BIN chunk)
#   TEXCOORD_1 absent and the slot IS UV_Primary     -> left: the viewer aliases uv1 to uv (monster.js buildMesh)
# UVViewNormal (computed) and unmatched primitives are left alone. Originals are copied to backupdir before the first write.
import importlib.util, json, os, shutil, struct, sys
sys.path.insert(0, os.path.join('C:' + os.sep, 'MHGU-Extract'))
spec = importlib.util.spec_from_file_location('u2', r'C:\MHGU-Extract\add-uv2.py'); u2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(u2)
V = os.path.join('C:' + os.sep, 'MHGU-Extract', 'MHGU-Monster-Viewer', 'docs', 'models', 'monsters')
rows = json.load(open(sys.argv[1])); backup = sys.argv[2]; apply_it = '--apply' in sys.argv
F2 = struct.Struct('<ff')

def modpath(stem):
    mon = stem.split('_tail')[0].split('_head')[0]
    return os.path.join('C:' + os.sep, 'MHGU-Extract', 'scratch-em', mon, 'enemy', mon[:len(mon) - 3].rstrip('_'), mon, 'mod', stem + '.mod')

def mod_mesh(d, meshes, raw, js, bo, prim):
    a = prim['attributes']; b0, s0, n0, _ = u2.acc_span(js, bo, a['TEXCOORD_0'])
    want = [F2.unpack_from(raw, b0 + k * s0) for k in range(min(n0, 8))]
    for m in meshes:
        if m['count'] != n0: continue
        for off in range(0, m['stride'] - 3, 2):
            if all(abs(u2.lane(d, m, off, k)[0] - w[0]) < 2e-3 and abs(u2.lane(d, m, off, k)[1] - w[1]) < 2e-3 for k, w in enumerate(want)):
                return m
    return None

by_glb = {}
for r in rows:
    if r.get('romSlotAt') is None or r.get('mod') == 'UNMATCHED': continue
    if not r['uv1'] and r.get('romSlotIsUv0'): continue
    if r['uv1'] and r.get('glbUv1MatchesRomSlot'): continue
    by_glb.setdefault(r['glb'], []).append(r)

for stem, todo in by_glb.items():
    path = os.path.join(V, stem + '.glb')
    d, meshes = u2.mod_meshes(modpath(stem))
    raw, js, bo = u2.glb_read(path)
    jlen = struct.unpack_from('<I', raw, 12)[0]
    binlen = struct.unpack_from('<I', raw, 20 + jlen)[0]
    bin_ = bytearray(raw[bo:bo + binlen])
    changed = []
    for r in todo:
        prim = js['meshes'][r['mesh']]['primitives'][r['prim']]
        m = meshes[r['modi']]
        vals = [u2.lane(d, m, r['romSlotAt'], k) for k in range(m['count'])]
        if r['uv1']:
            b1, s1, n1, ct = u2.acc_span(js, bo, prim['attributes']['TEXCOORD_1'])
            assert ct == 5126 and n1 == len(vals)
            for k, (u, v) in enumerate(vals): F2.pack_into(bin_, b1 - bo + k * s1, u, v)
            changed.append('mesh %d prim %d %s: TEXCOORD_1 overwritten from MOD @%d (%s)' % (r['mesh'], r['prim'], r['mat'], r['romSlotAt'], r['layout']))
        else:
            while len(bin_) % 4: bin_.append(0)
            off = len(bin_)
            for u, v in vals: bin_ += F2.pack(u, v)
            js['bufferViews'].append({'buffer': 0, 'byteOffset': off, 'byteLength': 8 * len(vals)})
            mn = [min(x[0] for x in vals), min(x[1] for x in vals)]; mx = [max(x[0] for x in vals), max(x[1] for x in vals)]
            js['accessors'].append({'bufferView': len(js['bufferViews']) - 1, 'componentType': 5126, 'count': len(vals), 'type': 'VEC2', 'min': mn, 'max': mx})
            prim['attributes']['TEXCOORD_1'] = len(js['accessors']) - 1
            changed.append('mesh %d prim %d %s: TEXCOORD_1 ADDED from MOD @%d (%s)' % (r['mesh'], r['prim'], r['mat'], r['romSlotAt'], r['layout']))
    print(stem); [print('   ' + c) for c in changed]
    if not apply_it: continue
    os.makedirs(backup, exist_ok=True)
    bk = os.path.join(backup, stem + '.glb')
    if not os.path.exists(bk): shutil.copy2(path, bk)
    while len(bin_) % 4: bin_.append(0)
    js['buffers'][0]['byteLength'] = len(bin_)
    jb = json.dumps(js, separators=(',', ':')).encode('utf-8')
    while len(jb) % 4: jb += b' '
    rest = bytes(raw[bo + binlen:])                       # any chunk after BIN (none expected)
    out = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(jb) + 8 + len(bin_) + len(rest)) + struct.pack('<I', len(jb)) + b'JSON' + jb \
          + struct.pack('<I', len(bin_)) + b'BIN\x00' + bytes(bin_) + rest
    tmp = path + '.part'; open(tmp, 'wb').write(out); os.replace(tmp, path)
    print('   written')
if not apply_it: print('REPORT ONLY')

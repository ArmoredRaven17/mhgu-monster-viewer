# per two-map primitive: the ROM layout, the UV slot its second map samples, and what the glb's TEXCOORD_1 holds
import json, os, sys, importlib.util
sys.path.insert(0, r'C:\MHGU-Extract')
spec = importlib.util.spec_from_file_location('u2', r'C:\MHGU-Extract\add-uv2.py'); u2 = importlib.util.module_from_spec(spec); spec.loader.exec_module(u2)
V = r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs'
M = json.load(open(V + r'\materials.json'))
LAY = json.load(open(V + r'\effects\model-shaders.json'))['layouts']
BY = {v['index']: (k, v) for k, v in LAY.items()}
SLOT = {'UVSecondary': 'UV_Secondary', 'UVExtend': 'UV_Extend', 'UVUnique': 'UV_Unique', 'UVPrimary': 'UV_Primary'}
out = []
for fn in sorted(os.listdir(V + r'\models\monsters')):
    if not fn.endswith('.glb'): continue
    stem = fn[:-4]; mon = stem.split('_tail')[0].split('_head')[0]
    sub = '/tail' if '_tail' in stem else '/head' if '_head' in stem else ''
    ent = M['monsters'].get('em/' + mon[2:] + sub)
    if not ent: continue
    two = {n: r for n, r in ent.get('mats', {}).items() if r.get('t', {}).get('tAlbedoBlendMap')}
    if not two: continue
    mod = os.path.join(r'C:\MHGU-Extract\scratch-em', mon, 'enemy', mon[:len(mon) - 3].rstrip('_'), mon, 'mod', stem + '.mod')
    d, meshes = u2.mod_meshes(mod) if os.path.isfile(mod) else (None, None)
    raw, js, bo = u2.glb_read(os.path.join(V, 'models', 'monsters', fn))
    names = [m.get('name') for m in js['materials']]
    used = set()
    for mi, mesh in enumerate(js['meshes']):
        for pi, p in enumerate(mesh['primitives']):
            n = names[p['material']] if 'material' in p else None
            if n not in two: continue
            f = M['feat'][two[n]['f']]
            uvn = f.get('uvAlbedoExtendMap') or f.get('uvAlbedoBlendMap')
            a = p['attributes']; b0, s0, n0, _ = u2.acc_span(js, bo, a['TEXCOORD_0'])
            want = [u2.F2.unpack_from(raw, b0 + k * s0) for k in range(min(n0, 8))]
            hit = None
            for m in meshes or []:
                if m['count'] != n0 or m['i'] in used: continue
                for off in range(0, m['stride'] - 3, 2):
                    if all(abs(u2.lane(d, m, off, k)[0] - w[0]) < 2e-3 and abs(u2.lane(d, m, off, k)[1] - w[1]) < 2e-3 for k, w in enumerate(want)):
                        hit = (m, off); break
                if hit: break
            row = {'glb': stem, 'mesh': mi, 'prim': pi, 'mat': n, 'albedo': f['albedo'], 'slot': uvn, 'n': n0, 'uv1': 'TEXCOORD_1' in a}
            if not hit: row['mod'] = 'UNMATCHED'; out.append(row); continue
            m, off0 = hit; used.add(m['i'])
            lk, lv = BY.get(m['fmt'] & 0xff, (None, None))
            row.update(modi=m['i'], fmt=hex(m['fmt']), layout=lk, stride=m['stride'], uv0at=off0)
            if lv and lv['stride'] != m['stride']: row['layout'] = 'STRIDE MISMATCH ' + str(lk)
            el = {e[0]: e[1] for e in lv['elements']} if lv else {}
            romoff = el.get(SLOT.get(uvn)) if uvn in SLOT else None
            row['romSlotAt'] = romoff
            if romoff is not None:
                vals = [u2.lane(d, m, romoff, k) for k in range(n0)]
                row['romSlotIsUv0'] = romoff == el.get('UV_Primary')
                row['romSlotZero'] = all(v == (0.0, 0.0) for v in vals)
                if 'TEXCOORD_1' in a:
                    b1, s1, n1, ct = u2.acc_span(js, bo, a['TEXCOORD_1'])
                    g = [u2.F2.unpack_from(raw, b1 + k * s1) for k in range(n1)] if ct == 5126 else None
                    row['glbUv1MatchesRomSlot'] = bool(g) and all(abs(x[0] - y[0]) < 2e-3 and abs(x[1] - y[1]) < 2e-3 for x, y in zip(g, vals))
                    row['glbUv1Zero'] = bool(g) and all(x == (0.0, 0.0) for x in g)
                    # which MOD offset the glb TEXCOORD_1 came from
                    src = [o for o in range(0, m['stride'] - 3, 2) if g and all(abs(u2.lane(d, m, o, k)[0] - g[k][0]) < 2e-3 and abs(u2.lane(d, m, o, k)[1] - g[k][1]) < 2e-3 for k in range(min(n1, 16)))]
                    row['glbUv1From'] = src[:4]
            out.append(row)
json.dump(out, open(sys.argv[1], 'w'), indent=1)
for r in out: print({k: v for k, v in r.items()})

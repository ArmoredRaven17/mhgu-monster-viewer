import sys, os, struct, json, re
sys.path.insert(0, r'C:\MHGU-Extract')
import buildlib as B
B.ROOT = r'C:\MHGU-Extract'
B.TOOL = r'C:\MHGU-Extract\tools\reviltoolset\revil_toolset.exe'
B.use_repo('MHGU-Monster-Viewer')
for p in sys.argv[1:]:
    g = B.mod_to_gltf(p)
    js = B.glb_json(g)
    mn = [1e9]*3; mx = [-1e9]*3; nv = 0
    for a in js['accessors']:
        if 'min' in a and len(a['min']) == 3 and a.get('type') == 'VEC3':
            pass
    for m in js['meshes']:
        for pr in m['primitives']:
            a = js['accessors'][pr['attributes']['POSITION']]
            nv += a['count']
            for i in range(3):
                mn[i] = min(mn[i], a['min'][i]); mx[i] = max(mx[i], a['max'][i])
    mrl = p[:-4] + '.mrl'
    tex = sorted(set(re.findall(rb'[a-z0-9_\]+_(?:BM|NM|GSM|HQ)[A-Za-z0-9_+]*', open(mrl, 'rb').read()))) if os.path.exists(mrl) else []
    print(os.path.basename(p), 'glb', g, 'verts', nv, 'nodes', len(js.get('nodes', [])), 'min', [round(x,1) for x in mn], 'max', [round(x,1) for x in mx], [t.decode() for t in tex][:6])

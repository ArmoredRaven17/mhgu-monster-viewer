# cliplen.py <mon> <list> <motion>..: a clip's frame count from docs/poses/monsters/<mon>_<list>.glb (max sampler time x 60: the check's len)
import json, struct, sys
mon, lst = sys.argv[1], sys.argv[2]
b = open(r'C:\MHGU-Extract\MHGU-Monster-Viewer\docs\poses\monsters\%s_%s.glb' % (mon, lst), 'rb').read()
L = struct.unpack_from('<I', b, 12)[0]; J = json.loads(b[20:20 + L])
for m in sys.argv[3:]:
    for a in J.get('animations', []):
        if a.get('name', '').endswith('Motion[%s]' % m):
            mx = max(J['accessors'][s['input']]['max'][0] for s in a['samplers'])
            print(a['name'], round(mx * 60, 2))

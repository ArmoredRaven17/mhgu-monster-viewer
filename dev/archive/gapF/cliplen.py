# cliplen.py <glb> [names..] -- each animation's length in frames (max input time x 30), from the glb's JSON chunk
import sys, json, struct
b = open(sys.argv[1], 'rb').read()
n = struct.unpack_from('<I', b, 12)[0]; J = json.loads(b[20:20 + n])
want = set(sys.argv[2:])
for an in J.get('animations', []):
    nm = an.get('name')
    if want and nm not in want: continue
    mx = max(J['accessors'][s['input']].get('max', [0])[0] for s in an['samplers'])
    print(nm, round(mx * 30, 3))

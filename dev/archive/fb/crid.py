# crid.py <class> <mon> <variant> <poke-json {e-offset: id}> st:n:ph:frame|ALL ..: each create's id / mode / lr with the class's id fields poked
import os, sys, json, struct
os.environ['FB_CLASS'] = sys.argv[1]; os.environ['FB_MON'] = sys.argv[2]; v = int(sys.argv[3]); pk = json.loads(sys.argv[4]); args = sys.argv[5:]; sys.argv = ['x']
import trgen as T
poke = {T.E + int(k, 0): list(struct.pack('<I', int(x, 0) if isinstance(x, str) else x)) for k, x in pk.items()}
for a in args:
    st, n, ph, fr = a.split(':')
    for sc in ([{'only': float(fr)}] if fr != 'ALL' else [{'frame': 1, 'frame2': 1}, {'frame': 1, 'frame2': 1, 'ended': 1}, {}, {'ended': 1}]):
        r = T.run(int(st, 0), int(n, 0), int(ph), v, 0, stub={0x3a8430: 5}, poke=poke, **sc)
        cr = [(e[1], e[2], e[5], e[6]) for e in r.get('ev', []) if e[0] == 'create']
        if cr: print(a, sc, cr, [e[1] for e in r.get('ev', []) if e[0] == 'mot'])

# crraw.py <class> <mon> <variant> <poke-json> st:n:ph:frame ..: each create's raw setup (id, mode, +0x10 floats, +0x20 floats, +0x30 words, +0x3c) and lr
import os, sys, json, struct
os.environ['FB_CLASS'] = sys.argv[1]; os.environ['FB_MON'] = sys.argv[2]; v = int(sys.argv[3]); pk = json.loads(sys.argv[4]); args = sys.argv[5:]; sys.argv = ['x']
import trgen as T
poke = {T.E + int(k, 0): x for k, x in pk.items()}
for a in args:
    st, n, ph, fr = a.split(':')
    kw = {'only': float(fr)} if fr not in ('ALL', 'END') else ({'frame': 1, 'frame2': 1} if fr == 'ALL' else {'ended': 1})
    r = T.run(int(st, 0), int(n, 0), int(ph), v, 0, stub={0x3a8430: 5}, poke=poke, **kw)
    lrs = [e[5] for e in r.get('ev', []) if e[0] == 'create']
    for raw, lr in zip(r.get('raw', []), lrs):
        b = bytes.fromhex(raw); w = struct.unpack('<16I', b); fl = struct.unpack('<16f', b)
        print(a, 'id %#x m%d' % (w[1], w[2]), '+10', [round(x, 2) for x in fl[4:8]], '+20', [round(x, 2) for x in fl[8:12]], '+30', [hex(x) for x in w[12:16]], lr)

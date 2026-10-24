# setups.py <class> <mon> <st:n:phase:frame>...: the raw setups the action main creates with that frame answered alone
import os, sys, json, struct
os.environ['FB_CLASS'] = sys.argv[1]; os.environ['FB_MON'] = sys.argv[2]
args = sys.argv[3:]; sys.argv = ['x']
import trgen as T
for a in args:
    st, n, ph, fr = a.split(':')
    kw = {'only': float(fr)} if fr != 'ALL' else {'frame': 1, 'frame2': 1}
    r = T.run(int(st, 0), int(n, 0), int(ph), 0, 0, stub={0x3a8430: 5}, **kw)
    for raw in r.get('raw', []):
        b = bytes.fromhex(raw)
        w = struct.unpack('<16I', b)
        fl = struct.unpack('<16f', b)
        print(a, 'id %#x mode %d' % (w[1], w[2]), '+10', [round(x, 3) for x in fl[4:7]], '+20', [hex(x) for x in w[8:11]], '+2c', hex(w[11]), '+30', [hex(x) for x in w[12:15]], '+3c', hex(w[15]))

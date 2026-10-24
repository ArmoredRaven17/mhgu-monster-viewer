# crlr.py <class> <mon> <variant> st:n:ph:frame ..: each create's id / mode / lr (the maker's call site)
import os, sys
os.environ['FB_CLASS'] = sys.argv[1]; os.environ['FB_MON'] = sys.argv[2]; v = int(sys.argv[3]); args = sys.argv[4:]; sys.argv = ['x']
import trgen as T
for a in args:
    st, n, ph, fr = a.split(':')
    kw = {'only': float(fr)} if fr != 'ALL' else {'frame': 1, 'frame2': 1}
    r = T.run(int(st, 0), int(n, 0), int(ph), v, 0, stub={0x3a8430: 5}, **kw)
    print(a, [(e[1], e[2], e[5]) for e in r.get('ev', []) if e[0] == 'create'])

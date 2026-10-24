import sys, os, struct
FB = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, FB); os.chdir(FB)
os.environ['FB_WATCH'] = '0x1057224,0x105781c,0x1059e3c,0x1059f70,0x105b4bc'
V = int(sys.argv[1]); sys.argv = ['x']
import trgen as T
for ST in [s for s in range(16) if s != 7]:
 for n in range(256):
     hits = set()
     for ph in range(9):
         r = T.run(ST, n, ph, V, 0)
         hits |= {(e[1], ph) for e in r.get('ev', []) if e[0] == 'watch'}
     if hits: print('%d:%#04x' % (ST, n), sorted(hits))

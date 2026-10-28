import sys,os
__file__x = os.path.abspath('cen063.py')
src = open('cen063.py').read().split('for st in st_list:')[0].replace('os.path.abspath(__file__)', repr(__file__x))
sys.argv = ['x', '7', sys.argv[1] if len(sys.argv) > 1 else '0', sys.argv[2] if len(sys.argv) > 2 else '0']
exec(src)
st, n = int(os.environ.get('ST', '7')), int(os.environ.get('N', '3'), 0)
for ph in range(5):
  for fr in (0, 1):
    r = T.run(st, n, ph, var, 0, rage=int(os.environ.get('RG','0')), stub=STUB, poke=POKE, frame=fr, frame2=fr)
    print(ph, fr, r.get('end'), [e for e in r.get('ev', []) if e[0] in KEEP + ('mot',)][:14])

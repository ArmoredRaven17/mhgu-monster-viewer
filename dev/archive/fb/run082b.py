import os, sys, json, struct, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, D); sys.argv = ['x']
os.environ['FB_CLASS'] = 'uEm082_00'
import trgen as T
A = 0x200000
DTP = {0: [0,1,1,0, 0,3,3,1, 1,2,2,2, 2,2,2,3, 5,1,1,4, 6,1,1,5], 4: [0,2,2,1, 1,2,2,2, 2,2,2,3, 5,1,1,4, 6,1,1,5]}
IDS = {0: {'0xcac0': 0x159, '0xcac4': 0x15a, '0xcac8': 0x158, '0xcacc': 0x15b},
       4: {'0xcac0': 0x15d, '0xcac4': 0x15e, '0xcac8': 0x15c, '0xcacc': 0x15f, '0xcad0': 0x160}}
procs = []
for v, mon in ((0, 'em082_00'), (4, 'em082_04')):
    poke = {k: list(struct.pack('<I', x)) for k, x in IDS[v].items()}
    poke['0x75f0'] = list(struct.pack('<I', T.E + A)); poke[hex(A + 0x64)] = list(struct.pack('<I', T.E + A + 0x100))
    poke[hex(A + 0x100)] = DTP[v]
    env = dict(os.environ, FB_CLASS='uEm082_00', FB_MON=mon, FB_POKE=json.dumps(poke))
    out = open(os.path.join(D, 'cen12_%s.txt' % mon), 'w'); err = open(os.path.join(D, 'cen12_%s.err' % mon), 'w')
    procs.append(subprocess.Popen([sys.executable, os.path.join(D, 'cengen10.py'), '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15', str(v)],
                                  cwd=D, env=env, stdout=out, stderr=err))
for p in procs: p.wait()
print('done')

import os, sys, json, struct, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, D); KIND = int(sys.argv[1]) if len(sys.argv) > 1 else 1; sys.argv = ['x']
os.environ['FB_CLASS'] = 'uEm066_00'
import trgen as T
A = 0x200000
DTP = {0: [0,1,1,0x81, 0,2,2,0x81, 4,1,1,2, 5,1,1,2, 1,1,1,3], 4: [0,1,1,0, 0,2,2,1, 4,1,1,2, 5,1,1,2, 1,1,1,3]}
IDS = {0: {'0xcac4': 0x11c, '0xcac8': 0x11a, '0xcacc': 0x11b, '0xcad0': 0x11d},
       4: {'0xcac4': 0x120, '0xcac8': 0x11e, '0xcacc': 0x11f, '0xcad0': 0x121}}
kind = KIND
procs = []
for v, mon in ((0, 'em066_00'), (4, 'em066_04')):
    poke = {k: list(struct.pack('<I', x)) for k, x in IDS[v].items()}
    poke['0x75f0'] = list(struct.pack('<I', T.E + A)); poke[hex(A + 0x64)] = list(struct.pack('<I', T.E + A + 0x100))
    poke[hex(A + 0x100)] = DTP[v]
    poke['0xcac0'] = list(struct.pack('<I', T.E + A + 0x400)); poke[hex(A + 0x430)] = [kind]
    env = dict(os.environ, FB_CLASS='uEm066_00', FB_MON=mon, FB_POKE=json.dumps(poke))
    out = open(os.path.join(D, 'cen11_%s_k%d.txt' % (mon, kind)), 'w'); err = open(os.path.join(D, 'cen11_%s_k%d.err' % (mon, kind)), 'w')
    procs.append(subprocess.Popen([sys.executable, os.path.join(D, 'cengen11.py'), '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15', str(v)],
                                  cwd=D, env=env, stdout=out, stderr=err))
for p in procs: p.wait()
print('done')

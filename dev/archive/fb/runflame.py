import os, sys, json, struct, subprocess, re
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, D); sys.argv = ['x']
import trgen as T
A = 0x200000
IDS = {'0xcac0': 0x15d, '0xcac4': 0x15e, '0xcac8': 0x15c, '0xcacc': 0x15f, '0xcad0': 0x160}
DTP = [0,2,2,1, 1,2,2,2, 2,2,2,3, 5,1,1,4, 6,1,1,5]
poke = {k: list(struct.pack('<I', x)) for k, x in IDS.items()}
poke['0x75f0'] = list(struct.pack('<I', T.E + A)); poke[hex(A + 0x64)] = list(struct.pack('<I', T.E + A + 0x100)); poke[hex(A + 0x100)] = DTP
ps = []
for lit in (0, 2):
    env = dict(os.environ, FB_CLASS='uEm082_00', FB_MON='em082_04', FB_POKE=json.dumps(poke), FB_PPOKE=json.dumps({'0x1bb': [lit]}))
    for ch, sts in (('a', '0,1,2,3,4,5,6'), ('b', '7'), ('c', '8,9,10,11,12,13,14,15')):
        base = os.path.join(D, 'cenflame_%d_%s' % (lit, ch))
        ps.append(subprocess.Popen([sys.executable, os.path.join(D, 'cengen11.py'), sts, '4'], cwd=D, env=env, stdout=open(base + '.txt', 'w'), stderr=open(base + '.err', 'w')))
for p in ps: p.wait()
print('done')

import os, sys, json, struct, subprocess
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, D); sys.argv = ['x']
os.environ['FB_CLASS'] = 'uEm067_00'
import trgen as T
A = 0x200000
DTP = [0,1,1,1, 1,2,2,2, 2,1,1,3, 3,1,1,3, 6,1,1,4]
poke = {'0x75f0': list(struct.pack('<I', T.E + A)), hex(A + 0x64): list(struct.pack('<I', T.E + A + 0x100)), hex(A + 0x100): DTP}
env = dict(os.environ, FB_CLASS='uEm067_00', FB_MON='em067_00', FB_POKE=json.dumps(poke))
procs = []
for part, sts in (('a', '0,1,2,3,4,5,6'), ('b', '7'), ('c', '8,9,10,11,12,13,14,15')):
    out = open(os.path.join(D, 'cen11_em067_%s.txt' % part), 'w'); err = open(os.path.join(D, 'cen11_em067_%s.err' % part), 'w')
    procs.append(subprocess.Popen([sys.executable, os.path.join(D, 'cengen11.py'), sts, '0'], cwd=D, env=env, stdout=out, stderr=err))
for p in procs: p.wait()
print('done')

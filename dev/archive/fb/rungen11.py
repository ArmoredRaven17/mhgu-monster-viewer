# rungen11.py <class> <mon> <variant> <tag>: cengen11 over all 16 statuses (3 chunks), the .dtp filled -> cen11_<tag>_{a,b,c}.txt
import os, sys, json, struct, subprocess, re
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
cls, mon, v, tag = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
sys.path.insert(0, D); sys.argv = ['x']
import trgen as T
A = 0x200000
out = subprocess.run([sys.executable, r'C:\MHGU-Extract\efx\agents\diablos-scratch\dtp.py', mon], capture_output=True, text=True, cwd=r'C:\MHGU-Extract\efx').stdout
a = out.split('array A')[1].split('array')[0] if 'array A' in out else ''
d = []
for m in re.finditer(r'blk=0x([0-9a-f]+)', a): d += list(struct.pack('<I', int(m.group(1), 16)))
poke = {}
if d: poke = {'0x75f0': list(struct.pack('<I', T.E + A)), hex(A + 0x64): list(struct.pack('<I', T.E + A + 0x100)), hex(A + 0x100): d}
env = dict(os.environ, FB_CLASS=cls, FB_MON=mon, FB_POKE=json.dumps(poke))
ps = []
for ch, sts in (('a', '0,1,2,3,4,5,6'), ('b', '7'), ('c', '8,9,10,11,12,13,14,15')):
    base = os.path.join(D, 'cen11_%s_%s' % (tag, ch))
    ps.append(subprocess.Popen([sys.executable, os.path.join(D, 'cengen11.py'), sts, str(v)], cwd=D, env=env, stdout=open(base + '.txt', 'w'), stderr=open(base + '.err', 'w')))
for p in ps: p.wait()
print('done', tag)

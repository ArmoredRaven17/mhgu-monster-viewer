# rungen11k.py <class> <mon> <variant> <tag> <statuses> <poke-json> <ppoke-json>: rungen11 with extra owner / block pokes (keys are
# offsets from E; the class block C = E + 0x180000), one chunk -> cen11_<tag>.txt
import os, sys, json, struct, subprocess, re
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
cls, mon, v, tag, sts, xp, xpp = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4], sys.argv[5], sys.argv[6], sys.argv[7]
sys.path.insert(0, D); sys.argv = ['x']
import trgen as T
A = 0x200000
out = subprocess.run([sys.executable, r'C:\MHGU-Extract\efx\agents\diablos-scratch\dtp.py', mon], capture_output=True, text=True, cwd=r'C:\MHGU-Extract\efx').stdout
a = out.split('array A')[1].split('array')[0] if 'array A' in out else ''
d = []
for m in re.finditer(r'blk=0x([0-9a-f]+)', a): d += list(struct.pack('<I', int(m.group(1), 16)))
poke = {}
if d: poke = {'0x75f0': list(struct.pack('<I', T.E + A)), hex(A + 0x64): list(struct.pack('<I', T.E + A + 0x100)), hex(A + 0x100): d}
poke.update(json.loads(xp))
env = dict(os.environ, FB_CLASS=cls, FB_MON=mon, FB_POKE=json.dumps(poke), FB_PPOKE=xpp)
base = os.path.join(D, 'cen11_%s' % tag)
p = subprocess.Popen([sys.executable, os.path.join(D, 'cengen11.py'), sts, str(v)], cwd=D, env=env, stdout=open(base + '.txt', 'w'), stderr=open(base + '.err', 'w'))
p.wait()
print('done', tag)

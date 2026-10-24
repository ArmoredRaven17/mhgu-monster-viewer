# recen11.py: the earlier groups' censuses again with cengen11 (the first pass's creates + the landing answered) -- trap 87's control.
# Writes cen11r_<mon>_v<variant>_<chunk>.txt; then recen11cmp.py diffs them against the earlier census files.
import os, sys, json, struct, subprocess, re, time
D = r'C:\Users\humph\AppData\Local\Temp\claude\C--MHGU-Extract-MHGU-Monster-Viewer\bbae25d7-5c4a-424f-bb47-777ad4066372\scratchpad\fb'
sys.path.insert(0, D); sys.argv = ['x']
import trgen as T
A = 0x200000
RUNS = [('uEm010_00', 'em010_00', 0), ('uEm017_00', 'em017_00', 0), ('uEm036_00', 'em036_00', 0), ('uEm021_00', 'em021_00', 0),
        ('uEm022_00', 'em022_00', 0), ('uEm023_00', 'em023_00', 0), ('uEm023_00', 'em023_05', 5), ('uEm060_00', 'em060_00', 0),
        ('uEm060_00', 'em060_04', 4), ('uEm061_00', 'em061_00', 0), ('uEm061_00', 'em061_04', 4), ('uEm062_00', 'em062_00', 0),
        ('uEm065_00', 'em065_00', 0), ('uEm083_00', 'em083_00', 0), ('uEm083_00', 'em083_04', 4), ('uEm046_00', 'em046_00', 0),
        ('uEm047_00', 'em047_00', 0), ('uEm049_00', 'em049_00', 0), ('uEm056_00', 'em056_00', 0), ('uEm082_00', 'em082_00', 0),
        ('uEm082_00', 'em082_04', 4)]
IDS082 = {0: {'0xcac0': 0x159, '0xcac4': 0x15a, '0xcac8': 0x158, '0xcacc': 0x15b},
          4: {'0xcac0': 0x15d, '0xcac4': 0x15e, '0xcac8': 0x15c, '0xcacc': 0x15f, '0xcad0': 0x160}}
def dtp(mon):
    out = subprocess.run([sys.executable, r'C:\MHGU-Extract\efx\agents\diablos-scratch\dtp.py', mon], capture_output=True, text=True,
                         cwd=r'C:\MHGU-Extract\efx').stdout
    a = out.split('array A')[1].split('array')[0] if 'array A' in out else ''
    b = []
    for m in re.finditer(r'blk=0x([0-9a-f]+)', a): b += list(struct.pack('<I', int(m.group(1), 16)))
    return b
jobs = []
only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
for cls, mon, v in RUNS:
    if only and mon not in only: continue
    poke = {}
    if cls == 'uEm082_00': poke = {k: list(struct.pack('<I', x)) for k, x in IDS082[v].items()}
    d = dtp(mon)
    if d:
        poke['0x75f0'] = list(struct.pack('<I', T.E + A)); poke[hex(A + 0x64)] = list(struct.pack('<I', T.E + A + 0x100)); poke[hex(A + 0x100)] = d
    env = dict(os.environ, FB_CLASS=cls, FB_MON=mon, FB_POKE=json.dumps(poke))
    for ch, sts in (('a', '0,1,2,3,4,5,6'), ('b', '7'), ('c', '8,9,10,11,12,13,14,15')):
        jobs.append((env, sts, v, os.path.join(D, 'cen11r_%s_v%d_%s' % (mon, v, ch))))
running = []
while jobs or running:
    while jobs and len(running) < 11:
        env, sts, v, base = jobs.pop(0)
        running.append(subprocess.Popen([sys.executable, os.path.join(D, 'cengen11.py'), sts, str(v)], cwd=D, env=env,
                                        stdout=open(base + '.txt', 'w'), stderr=open(base + '.err', 'w')))
    time.sleep(5)
    running = [p for p in running if p.poll() is None]
print('done')

# runfbb.py (2026-10-19): the Flying / Brute / Bird Wyverns' cengen11 re-run (rom-map trap 87: landing-made and test-free creates),
# 42 monsters (docs/monster-classes.json, large only), class uEmNNN_00 with the variant byte = the sub id; statuses a 0..6 / b 7 / c 8..15,
# FOUR monsters at a time. Output cen11r_<mon>_v<var>_<part>.txt beside this file.
import os, sys, subprocess, time
D = os.path.dirname(os.path.abspath(__file__))
LIST = os.path.join(D, '..', 'neset', 'fbb_list.txt')
mons = [l.split()[0] for l in open(LIST) if l.startswith('em')]
only = sys.argv[1:]
if only: mons = [m for m in mons if m in only]
# the shared classes (trgen's FB_EM = the monster's em byte): the Rath line, Basarios / Gravios (rom-map 'uEm004_00 em 5'), the dromes
SHARED = {'002': 'uEm001_00', '005': 'uEm004_00', '015': 'uEm014_00', '016': 'uEm014_00', '034': 'uEm014_00'}
# the Rath line's shell ids (shells-em001.md 1: the loader 0xd09918 by em / variant -> e+0xcac4 sp_00, +0xcac8 sp_01, +0xcacc sp_11;
# 0x19d = none): poked so the census names the shell (unpoked it logs id 0)
import json, struct
RATH = {'em001_00': (0x54, 0x5a, 0x60), 'em001_02': (0x55, 0x5b, 0x61), 'em001_04': (0x56, 0x5c, 0x62),
        'em002_00': (0x57, 0x5d, 0x19d), 'em002_02': (0x58, 0x5e, 0x63), 'em002_04': (0x59, 0x5f, 0x64)}
# uEm004_00's loader 0xd2e538 (READ 2026-10-19): em 4 -> +0xcac4 0x6a, +0xcac8 0x6b, +0xcacc 0x6c, +0xcad0 0x19d; em 5 -> 0x19d / 0x6d /
# 0x6e / 0x6f (uShellEm005_sp_13)
RATH.update({'em004_00': (0x6a, 0x6b, 0x6c, 0x19d), 'em005_00': (0x19d, 0x6d, 0x6e, 0x6f)})
# uEm018_00's loader 0xda4820 (READ): variant 4 -> +0xcac4 0x96, +0xcac8 0x97, +0xcacc 0x98 (uShellEm018_04_07); else 0x94 / 0x95 (+0xcacc
# the ctor's: 0x19d taken). uEm032_00's 0xe20334 (READ): +0xcac4 0xbe (sp_01) / variant 4 0xc0, +0xcac8 0xbd (sp_00) / 0xbf
RATH.update({'em018_00': (0x94, 0x95, 0x19d), 'em018_04': (0x96, 0x97, 0x98), 'em032_00': (0xbe, 0xbd), 'em032_04': (0xc0, 0xbf)})
IDS = json.load(open(os.path.join(D, 'ids_fbb.json'))) if os.path.exists(os.path.join(D, 'ids_fbb.json')) else {}
def poke_of(mon):
    # (2026-10-19) idprobe.py: each class's own loader (vt+0x158) run under the tracer -> the id words it writes (ids_fbb.json)
    if IDS.get(mon) and 'err' not in IDS[mon]:
        return json.dumps({k: list(struct.pack('<I', int(v, 16))) for k, v in IDS[mon].items()})
    if mon not in RATH: return None
    return json.dumps({hex(0xcac4 + 4 * i): list(struct.pack('<I', v)) for i, v in enumerate(RATH[mon])})
PARTS = (('a', '0,1,2,3,4,5,6'), ('b', '7'), ('c', '8,9,10,11,12,13,14,15'))
queue = list(mons); running = []
def start(mon):
    var = int(mon[6:8]); cls = SHARED.get(mon[2:5], 'uEm%s_00' % mon[2:5])
    env = dict(os.environ, FB_CLASS=cls, FB_MON=mon, FB_EM=str(int(mon[2:5])))
    if poke_of(mon): env['FB_POKE'] = poke_of(mon)
    ps = []
    for part, sts in PARTS:
        base = os.path.join(D, 'cen11r_%s_v%d_%s' % (mon, var, part))
        ps.append(subprocess.Popen([sys.executable, os.path.join(D, 'cengen11.py'), sts, str(var)], cwd=D, env=env,
                                   stdout=open(base + '.txt', 'w'), stderr=open(base + '.err', 'w')))
    print('start', mon, cls, 'v%d' % var, flush=True)
    return (mon, ps)
while queue or running:
    while queue and len(running) < 4: running.append(start(queue.pop(0)))
    time.sleep(5)
    for r in list(running):
        if all(p.poll() is not None for p in r[1]):
            print('done', r[0], [p.returncode for p in r[1]], flush=True); running.remove(r)
print('ALL DONE', flush=True)
